import { WakeWordModel } from "@livekit/wakeword/core";
import {
  VoiceProcessor,
  VoiceProcessorError,
} from "@picovoice/react-native-voice-processor";
import { Asset } from "expo-asset";
import { File } from "expo-file-system";
import * as ort from "onnxruntime-react-native";
import { PermissionsAndroid } from "react-native";

import { requireNativeModule } from "expo";

// Module needs for foreground listening for background to work
const NativeWakeWord = requireNativeModule("WakeWord");

type Detection = { name: string; confidence: number };
type Listener = (d: Detection) => void;

// MODEL SETTINGS
const MODEL_NAME = "hey_beaver";
const THRESHOLD = 0.7;

// AUDIO SETTINGS
const DEBOUNCE_MS = 2000; // 2 second debounce for audio listening
const SAMPLE_RATE = 16000; // what the model expects from audio
const FRAME_LENGTH = 1280; // 1280 samples = 80 ms = exactly one model step

// STATE
const voiceProcessor = VoiceProcessor.instance; // the mic (one shared instance)
let model: WakeWordModel | null = null; // loaded once, reused
let listening = false; // is the mic running?
let starting = false; // guards the moment while starting is in progress
let lastFired = 0; // for the debounce

// Subscriber
const listeners = new Set<Listener>(); // everyone who wants "onWakeWord"

// load the model once
async function loadModel() {
  if (model) return;

  const [asset] = await Asset.loadAsync(
    require("../ios/models/hey_beaver.onnx"),
  );
  // the model only takes bytes
  const bytes = await new File(asset.localUri!).bytes();
  const m = new WakeWordModel(ort);
  await m.loadModel(bytes, MODEL_NAME);
  model = m;
}

// Runs every 80 MS on the audio to check for wake word
async function onFrame(frame: number[]) {
  if (!model) return;

  try {
    // model only takes Int16. number[] -> Int 16 -> Model
    const scores = await model.predict(Int16Array.from(frame));
    const now = Date.now();

    if (scores.hey_beaver >= THRESHOLD && now - lastFired >= DEBOUNCE_MS) {
      lastFired = now;
      listeners.forEach((l) =>
        l({ name: MODEL_NAME, confidence: scores.hey_beaver }),
      );
      model?.reset();
    }
  } catch (err) {
    console.warn("Prediction failed", err);
  }
}

function onError(error: VoiceProcessorError) {
  console.log("voice processor error:", error.message);
}

// Exported as an object.
const WakeWordAndroid = {
  async requestMicPermission(): Promise<boolean> {
    try {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      );
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );

      return result === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  },

  async startListening(): Promise<void> {
    // to make sure we dont have a rac condition where it is starting or listening and we create another instance to start it
    if (listening || starting) return;
    starting = true;
    try {
      await loadModel();
      NativeWakeWord.startBackgroundService();
      // reset the leftover audio from previous session
      model?.reset();

      voiceProcessor.addFrameListener(onFrame);
      voiceProcessor.addErrorListener(onError);
      await voiceProcessor.start(FRAME_LENGTH, SAMPLE_RATE);
      listening = true;
    } catch (e) {
      voiceProcessor.removeFrameListener(onFrame);
      voiceProcessor.removeErrorListener(onError);
      NativeWakeWord.stopBackgroundService();
      throw e;
    } finally {
      starting = false;
    }
  },

  async stopListening(): Promise<void> {
    if (!listening) return;
    listening = false;

    // remove the listening frames
    voiceProcessor.removeFrameListener(onFrame);
    voiceProcessor.removeErrorListener(onError);
    // turn mic off
    await voiceProcessor.stop();
    NativeWakeWord.stopBackgroundService();
    model?.reset(); // forget old audio, so the next start begins fresh
  },

  // add the listener like we did in iOS
  addListener(event: "onWakeWord", cb: Listener) {
    listeners.add(cb);
    return { remove: () => listeners.delete(cb) };
  },
};

export default WakeWordAndroid;

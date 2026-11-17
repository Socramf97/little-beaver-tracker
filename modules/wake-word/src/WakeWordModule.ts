import { NativeModule, requireNativeModule } from "expo";

import { WakeWordModuleEvents } from "./WakeWord.types";

declare class WakeWordModule extends NativeModule<WakeWordModuleEvents> {
  setValueAsync(value: string): Promise<void>;

  requestMicPermission(): Promise<boolean>;
  startListening(): Promise<void>;
  stopListening(): Promise<void>;
}

export default requireNativeModule<WakeWordModule>("WakeWord");

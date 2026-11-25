import ExpoModulesCore
import AVFoundation
import LiveKitWakeWord

final class ModelNotFoundException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "Model '\(param).onnx' was not found in the app bundle"
  }
}

public class WakeWordModule: Module {
  private var listener: WakeWordListener?
  private var detectionTask: Task<Void, Never>?
  private var model: WakeWordModel?

  public func definition() -> ModuleDefinition {
    Name("WakeWord")

    Events("onChange", "onWakeWord")

    // Ask for permission -> true/false
    AsyncFunction("requestMicPermission"){ () async -> Bool in 
      let session = AVAudioSession.sharedInstance()
      if session.recordPermission == .granted {return true}
      return await withCheckedContinuation { cont in
          session.requestRecordPermission { cont.resume(returning: $0) }
      }
    }

    // Load our model and start listening
    AsyncFunction("startListening"){ () async throws in
      if self.listener != nil { return }
      let modelName = "hey_beaver"
      guard let url = Bundle.main.url(forResource: modelName, withExtension: "onnx") ?? Bundle(for: WakeWordModule.self).url(forResource: modelName, withExtension: "onnx") else {
        throw ModelNotFoundException(modelName)
      }

      let model = try self.model ?? WakeWordModel(models: [url], sampleRate: 16_000)
      self.model = model
      let threshold: Float = 0.7
      let listener = WakeWordListener(model:model, threshold: threshold, debounce: 2.0)
      self.listener = listener
      do {
        try await listener.start()
      } catch {
        self.listener = nil
        throw error
      }

      self.detectionTask = Task {[weak self] in
        for await detection in listener.detections() {
          self?.sendEvent("onWakeWord", [
            "name": detection.name,
            "confidence": detection.confidence
          ])
        }
      }
    }

    // STop Listening
    AsyncFunction("stopListening"){ () async in
      self.detectionTask?.cancel()
      self.detectionTask = nil
      let listener = self.listener 
      self.listener = nil
      await listener?.stop()
    
    }

    AsyncFunction("setValueAsync") { (value: String) in
      self.sendEvent("onChange", ["value": value])
    }

    OnDestroy {
      self.detectionTask?.cancel()
      if let listener = self.listener{
        Task{ await listener.stop() }
      }
    }
  }
}
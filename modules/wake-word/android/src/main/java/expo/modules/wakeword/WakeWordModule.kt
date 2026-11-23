package expo.modules.wakeword

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class WakeWordModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("WakeWord")

    Function("startBackgroundService") {
      appContext.reactContext?.let { WakeWordService.start(it) }
    }

    Function("stopBackgroundService") {
      appContext.reactContext?.let { WakeWordService.stop(it) }
    }
  }
}

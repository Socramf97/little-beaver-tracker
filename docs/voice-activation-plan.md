# Voice Activation Feasibility & Plan

# Platform Constraints for iOS vs Android

    - iOS:
        - No custom always-on wake word for third-party apps. iOS does not let an app listen continuously in the background for its own hail word the way "Hey Siri" works.
        - We can use Siri App Shortcuts (App Intents)
            EX: "Hey Siri log with Little Beaver" then it will start listening
        - While app is open: Can listen for hail word

    - Android:
        - Background listening is possible through foreground service
            - Must allow permission
                - foregroundServiceType="microphone"
                - FOREGROUND_SERVICE_MICROPHONE

# Three Tier Plan (Priority)

    1. Push-To-Talk
        - iOS: Tap mic button -> Speak Command
        - Android: Same

    2. Hail word, app open
        - iOS: Siri "Hey Beaver" via porcupine
        - Android: Same

    3. App closed/background
        - iOS: Siri app shortcut opens app and starts listening.
        - Android: Porcupine in foreground service with notification

# Wake-word engine (Porcupine)

    - @picovoice/porcupine-react-native
    - Runs fully on device
    - Custom word "Hey Beaver"
    - Requires Picovoice AccessKey

# Notes

    - When permission is denied we get "Permission Denied" and we need to re-prompt it
    - When we parse is it "3" or is it "three"

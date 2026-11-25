module.exports = {
  dependencies: {
    "onnxruntime-react-native": {
      root: "./node_modules/onnxruntime-react-native",
      platforms: {
        ios: null,
        android: {
          sourceDir: "./android",
          packageImportPath:
            "import ai.onnxruntime.reactnative.OnnxruntimePackage;",
          packageInstance: "new OnnxruntimePackage()",
        },
      },
    },
    "@picovoice/react-native-voice-processor": {
      platforms: { ios: null },
    },
  },
};

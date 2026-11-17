Pod::Spec.new do |s|
  s.name           = 'WakeWord'
  s.version        = '1.0.0'
  s.summary        = 'A sample project summary'
  s.description    = 'A sample project description'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = {
    :ios => '16.4',
  }
  s.source         = { git: '' }

  s.dependency 'ExpoModulesCore'
  # onnx is required to run live-kit
  s.dependency 'onnxruntime-c', '1.24.2' 
  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }
  
  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
  # we need to bundle our model so it can be read
  s.resources = ['models/*.onnx']
  
  spm_dependency(s,
  url: 'https://github.com/livekit/livekit-wakeword',
  requirement: { kind: 'branch', branch: 'main' },
  products: ['LiveKitWakeWord']
 )

end

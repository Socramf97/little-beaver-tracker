import { registerWebModule, NativeModule } from 'expo';

import { WakeWordModuleEvents } from './WakeWord.types';

class WakeWordModule extends NativeModule<WakeWordModuleEvents> {
  hello() {
    return 'Hello world! 👋';
  }

  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
}

export default registerWebModule(WakeWordModule, 'WakeWordModule');

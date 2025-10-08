import { registerWebModule, NativeModule } from 'expo';

import { ExpoCxonemobilesdkModuleEvents } from './ExpoCxonemobilesdk.types';

class ExpoCxonemobilesdkModule extends NativeModule<ExpoCxonemobilesdkModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
}

export default registerWebModule(ExpoCxonemobilesdkModule, 'ExpoCxonemobilesdkModule');

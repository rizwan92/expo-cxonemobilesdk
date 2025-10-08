import { NativeModule, requireNativeModule } from 'expo';

import { ExpoCxonemobilesdkModuleEvents } from './ExpoCxonemobilesdk.types';

declare class ExpoCxonemobilesdkModule extends NativeModule<ExpoCxonemobilesdkModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoCxonemobilesdkModule>('ExpoCxonemobilesdk');

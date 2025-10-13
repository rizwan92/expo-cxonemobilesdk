import { NativeModule, requireNativeModule } from "expo";

import { ExpoCxonemobilesdkModuleEvents } from "./ExpoCxonemobilesdk.types";

declare class ExpoCxonemobilesdkModule extends NativeModule<ExpoCxonemobilesdkModuleEvents> {
  prepare(env: string, brandId: number, channelId: string): Promise<void>;
  connect(): Promise<void>;
  disconnect(): void;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoCxonemobilesdkModule>(
  "ExpoCxonemobilesdk"
);

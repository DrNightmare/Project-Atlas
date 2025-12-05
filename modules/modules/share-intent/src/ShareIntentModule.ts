import { NativeModule, requireNativeModule } from 'expo';

import { ShareIntentModuleEvents } from './ShareIntent.types';

declare class ShareIntentModule extends NativeModule<ShareIntentModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ShareIntentModule>('ShareIntent');

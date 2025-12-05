import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './ShareIntent.types';

type ShareIntentModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class ShareIntentModule extends NativeModule<ShareIntentModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
};

export default registerWebModule(ShareIntentModule, 'ShareIntentModule');

import { EventEmitter, NativeModule, requireNativeModule } from 'expo-modules-core';

// It loads the native module object from the JSI or falls back to
// the bridge module (from NativeModulesProxy) if the remote debugger is on.
const ShareIntentModule = requireNativeModule('ShareIntent') as NativeModule;

export function getSharedContent(): string | null {
    return (ShareIntentModule as any).getSharedContent();
}

const emitter = new EventEmitter(ShareIntentModule as any);

export function addShareIntentListener(listener: (event: { content: string }) => void) {
    return emitter.addListener('onShareIntent', listener);
}

export default ShareIntentModule;

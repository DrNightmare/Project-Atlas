// Reexport the native module. On web, it will be resolved to ShareIntentModule.web.ts
// and on native platforms to ShareIntentModule.ts
export { default } from './src/ShareIntentModule';
export { default as ShareIntentView } from './src/ShareIntentView';
export * from  './src/ShareIntent.types';

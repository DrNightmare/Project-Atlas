import { requireNativeView } from 'expo';
import * as React from 'react';

import { ShareIntentViewProps } from './ShareIntent.types';

const NativeView: React.ComponentType<ShareIntentViewProps> =
  requireNativeView('ShareIntent');

export default function ShareIntentView(props: ShareIntentViewProps) {
  return <NativeView {...props} />;
}

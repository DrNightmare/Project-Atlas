import * as React from 'react';

import { ShareIntentViewProps } from './ShareIntent.types';

export default function ShareIntentView(props: ShareIntentViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}

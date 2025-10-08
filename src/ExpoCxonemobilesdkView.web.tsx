import * as React from 'react';

import { ExpoCxonemobilesdkViewProps } from './ExpoCxonemobilesdk.types';

export default function ExpoCxonemobilesdkView(props: ExpoCxonemobilesdkViewProps) {
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

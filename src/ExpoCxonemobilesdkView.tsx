import { requireNativeView } from 'expo';
import * as React from 'react';

import { ExpoCxonemobilesdkViewProps } from './ExpoCxonemobilesdk.types';

const NativeView: React.ComponentType<ExpoCxonemobilesdkViewProps> =
  requireNativeView('ExpoCxonemobilesdk');

export default function ExpoCxonemobilesdkView(props: ExpoCxonemobilesdkViewProps) {
  return <NativeView {...props} />;
}

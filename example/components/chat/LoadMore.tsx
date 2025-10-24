import React from 'react';
import { ActivityIndicator, Button, View } from 'react-native';

type Props = {
  loading: boolean;
  onPress: () => void;
};

export default function LoadMore({ loading, onPress }: Props) {
  if (loading) {
    return (
      <View style={{ padding: 12 }}>
        <ActivityIndicator />
      </View>
    );
  }
  return <Button title="Load earlier" onPress={onPress} />;
}


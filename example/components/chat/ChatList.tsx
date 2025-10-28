import React, { useMemo } from 'react';
import { FlatList, ListRenderItem, View } from 'react-native';
import type { ChatMessage } from 'expo-cxonemobilesdk';
import MessageBubble from './MessageBubble';
import Avatar from './Avatar';

type Props = {
  messages: ChatMessage[];
  myUserLabel?: string;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
};

export default function ChatList({ messages, myUserLabel = 'You', hasMore, loadingMore, onLoadMore }: Props) {
  // Use order as provided by SDK/API; no resorting here.
  const data = messages;

  const renderItem: ListRenderItem<ChatMessage> = ({ item }) => {
    const isMe = item.direction === 'toAgent';
    const name = isMe ? myUserLabel : item.author?.fullName ?? 'Agent';
    return (
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 8, marginVertical: 4 }}>
        {!isMe && <Avatar name={name} imageUrl={item.author?.imageUrl} size={28} />}
        <View style={{ flex: 1, marginLeft: isMe ? 0 : 6 }}>
          <MessageBubble
            text={item.text || ''}
            isMe={isMe}
            createdAtMs={item.createdAtMs}
            status={item.status}
            authorName={!isMe ? name : undefined}
          />
        </View>
      </View>
    );
  };

  return (
    <FlatList
      data={data}
      keyExtractor={(m) => m.id}
      renderItem={renderItem}
      inverted
      onEndReachedThreshold={0.1}
      onEndReached={() => {
        if (hasMore && !loadingMore) {
          onLoadMore?.();
        }
      }}
      maintainVisibleContentPosition={{ minIndexForVisible: 1 }}
      initialNumToRender={20}
      maxToRenderPerBatch={20}
      windowSize={10}
    />
  );
}

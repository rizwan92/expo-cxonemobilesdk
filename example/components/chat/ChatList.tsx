import React, { useEffect, useRef } from 'react';
import { FlatList, ListRenderItem, View } from 'react-native';
import type { ChatMessage, MessageContent } from 'expo-cxonemobilesdk';
import MessageBubble from './MessageBubble';
import Avatar from './Avatar';

type Props = {
  messages: ChatMessage[];
  myUserLabel?: string;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
  scrollToBottomKey?: number; // bump to force scroll to latest
};

export default function ChatList({
  messages,
  myUserLabel = 'You',
  hasMore,
  loadingMore,
  onLoadMore,
  scrollToBottomKey,
}: Props) {
  // Use the SDK-provided order without client-side sorting
  const data = messages;

  // Auto-scroll to latest when a new message is added
  const listRef = useRef<FlatList<ChatMessage>>(null);
  useEffect(() => {
    if (typeof scrollToBottomKey === 'number') {
      try {
        listRef.current?.scrollToIndex({ index: 0, animated: true });
      } catch {}
    }
  }, [scrollToBottomKey]);

  const renderItem: ListRenderItem<ChatMessage> = ({ item }) => {
    const isMe = item.direction === 'toAgent';
    const name = isMe ? myUserLabel : item.authorUser?.fullName ?? 'Agent';
    const ms = new Date(item.createdAt).getTime();
    let text = '';
    const ct = item.contentType as MessageContent | undefined;
    if (ct && ct.type === 'text') {
      text = ct.payload.text;
    } else if (ct && ct.type === 'richLink') {
      text = `[link] ${ct.data.title}`;
    } else if (ct && ct.type === 'quickReplies') {
      text = `[quick replies] ${ct.data.title}`;
    } else if (ct && ct.type === 'listPicker') {
      text = `[list] ${ct.data.title}`;
    } else {
      text = '[unknown]';
    }
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          paddingHorizontal: 8,
          marginVertical: 4,
        }}
      >
        {!isMe && <Avatar name={name} imageUrl={item.authorUser?.imageUrl} size={28} />}
        <View style={{ flex: 1, marginLeft: isMe ? 0 : 6 }}>
          <MessageBubble
            text={text}
            isMe={isMe}
            createdAtMs={isFinite(ms) ? ms : undefined}
            status={item.status}
            authorName={!isMe ? name : undefined}
            direction={item.direction as any}
          />
        </View>
      </View>
    );
  };

  return (
    <FlatList
      ref={listRef}
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

import React, { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { Thread } from 'expo-cxonemobilesdk';
import Composer from './Composer';

type PendingAttachment = {
  id: string;
  name: string;
  mimeType: string;
  type: 'image' | 'video' | 'file';
  base64: string;
  size?: number | null;
};

type Props = {
  threadId?: string;
  onSent?: () => void;
};

export default function ThreadComposer({ threadId, onSent }: Props) {
  const [text, setText] = useState('1');
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);

  const addAttachment = useCallback((attachment: PendingAttachment) => {
    setPendingAttachments((prev) => [...prev, attachment]);
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setPendingAttachments((prev) => prev.filter((att) => att.id !== id));
  }, []);

  const handlePickMedia = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 0.7,
        base64: true,
      });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      const type = asset.type === 'video' ? 'video' : 'image';
      const mimeType = asset.mimeType ?? (type === 'video' ? 'video/mp4' : 'image/jpeg');
      let base64 = asset.base64;
      if (!base64 && asset.uri) {
        const file = new File(asset.uri);
        base64 = await file.base64();
      }
      if (!base64) {
        Alert.alert('Attachment error', 'Unable to read the selected media.');
        return;
      }
      addAttachment({
        id: `${Date.now()}-${Math.random()}`,
        name: asset.fileName ?? `media-${Date.now()}`,
        mimeType,
        type,
        base64,
        size: asset.fileSize,
      });
    } catch (error) {
      console.error('[ThreadComposer] pick media failed', error);
      Alert.alert('Attachment error', 'Failed to pick media file.');
    }
  }, [addAttachment]);

  const handlePickDocument = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      if (!asset.uri) return;
      const file = new File(asset.uri);
      const base64 = await file.base64();
      addAttachment({
        id: `${Date.now()}-${Math.random()}`,
        name: asset.name ?? 'document',
        mimeType: asset.mimeType ?? 'application/octet-stream',
        type: 'file',
        base64,
        size: asset.size,
      });
    } catch (error) {
      console.error('[ThreadComposer] pick document failed', error);
      Alert.alert('Attachment error', 'Failed to pick document.');
    }
  }, [addAttachment]);

  const handleSend = useCallback(
    async (raw: string) => {
      if (!threadId) {
        Alert.alert('Chat unavailable', 'Missing thread identifier.');
        return;
      }
      const trimmed = raw.trim();
      const hasText = trimmed.length > 0;
      const hasAttachments = pendingAttachments.length > 0;
      if (!hasText && !hasAttachments) return;

      try {
        await Thread.send(threadId, {
          text: hasText ? trimmed : '',
          attachments: hasAttachments
            ? pendingAttachments.map((attachment) => ({
                data: attachment.base64,
                mimeType: attachment.mimeType,
                fileName: attachment.name,
                friendlyName: attachment.name,
              }))
            : undefined,
        });
        if (hasAttachments) {
          setPendingAttachments([]);
        }
        if (hasText) {
          const next = Number(trimmed);
          if (Number.isFinite(next)) {
            setText(String(next + 1));
          } else {
            setText('');
          }
        }
        onSent?.();
      } catch (error) {
        console.error('[ThreadComposer] send failed', error);
        Alert.alert('Send failed', 'Unable to send message.');
        throw error;
      }
    },
    [threadId, pendingAttachments, onSent],
  );

  const canSend = useCallback(
    (value: string) => pendingAttachments.length > 0 || value.trim().length > 0,
    [pendingAttachments.length],
  );

  return (
    <Composer
      onSend={handleSend}
      value={text}
      onChangeText={setText}
      canSend={canSend}
      attachments={pendingAttachments.map((att) => ({
        id: att.id,
        name: att.name,
        mimeType: att.mimeType,
        size: att.size,
      }))}
      onRemoveAttachment={removeAttachment}
      attachmentActions={[
        { label: 'Photo/Video', onPress: handlePickMedia },
        { label: 'Document', onPress: handlePickDocument },
      ]}
    />
  );
}

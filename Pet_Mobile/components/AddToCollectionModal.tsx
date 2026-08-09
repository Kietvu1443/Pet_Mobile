import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  fetchMyCollections,
  fetchPetCollections,
  createCollection,
  addPetToCollection,
  removePetFromCollection,
  type RawCollection,
} from '@/lib/api/collections';
import { useTheme } from '@/lib/theme/ThemeContext';

const EMOJI_OPTIONS = ['📁', '❤️', '⭐', '🏠', '🐶', '🐱', '✨'];

export function AddToCollectionModal({
  visible,
  petId,
  petName,
  onClose,
}: {
  visible: boolean;
  petId: number | null;
  petName?: string;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const [isCreating, setIsCreating] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('📁');

  // Fetch collections
  const collectionsQuery = useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const res = await fetchMyCollections();
      return res.collections || [];
    },
    enabled: visible,
  });

  // Fetch which collections contain this pet
  const petCollectionsQuery = useQuery({
    queryKey: ['pet-collections', petId],
    queryFn: async () => {
      if (!petId) return [];
      const res = await fetchPetCollections(petId);
      return res.collectionIds || [];
    },
    enabled: visible && petId !== null,
  });

  const collections = collectionsQuery.data || [];
  const activeCollectionIds = petCollectionsQuery.data || [];

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Mutation: Toggle Collection
  const toggleMutation = useMutation({
    mutationFn: async ({ collectionId, isMember }: { collectionId: number; isMember: boolean }) => {
      if (!petId) return;
      if (isMember) {
        await removePetFromCollection(collectionId, petId);
      } else {
        await addPetToCollection(collectionId, petId);
      }
    },
    onMutate: async ({ collectionId, isMember }) => {
      await queryClient.cancelQueries({ queryKey: ['pet-collections', petId] });
      const previousIds = queryClient.getQueryData<number[]>(['pet-collections', petId]) || [];

      const nextIds = isMember
        ? previousIds.filter((id) => id !== collectionId)
        : [...previousIds, collectionId];

      queryClient.setQueryData(['pet-collections', petId], nextIds);
      return { previousIds };
    },
    onError: (_err, _vars, context) => {
      if (context) {
        queryClient.setQueryData(['pet-collections', petId], context.previousIds);
      }
    },
    onSuccess: (_data, variables) => {
      const col = collections.find((c) => c.id === variables.collectionId);
      const colName = col ? `${col.emoji} ${col.name}` : 'Bộ sưu tập';
      if (!variables.isMember) {
        showToast(`Đã thêm thú cưng vào "${colName}"`);
      } else {
        showToast(`Đã bỏ khỏi "${colName}"`);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['pet-collections', petId] });
      void queryClient.invalidateQueries({ queryKey: ['collections'] });
      void queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  // Mutation: Create Collection
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!newCollectionName.trim()) return;
      const res = await createCollection(newCollectionName.trim(), selectedEmoji);
      if (petId && res.collection?.id) {
        await addPetToCollection(res.collection.id, petId);
      }
      return res.collection;
    },
    onSuccess: (newCol) => {
      setNewCollectionName('');
      setIsCreating(false);
      void queryClient.invalidateQueries({ queryKey: ['collections'] });
      void queryClient.invalidateQueries({ queryKey: ['pet-collections', petId] });
      void queryClient.invalidateQueries({ queryKey: ['favorites'] });
      if (newCol) {
        showToast(`Đã tạo "${newCol.emoji} ${newCol.name}" & lưu thú cưng!`);
      }
    },
  });

  if (!visible || !petId) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: theme.colors.text }]}>Lưu vào bộ sưu tập</Text>
              {petName ? (
                <Text style={[styles.subtitle, { color: theme.colors.muted }]}>
                  {petName}
                </Text>
              ) : null}
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={theme.colors.text} />
            </Pressable>
          </View>

          {/* Toast feedback banner */}
          {toastMessage ? (
            <View
              style={[
                styles.toastBanner,
                { backgroundColor: `${theme.colors.primary}18`, borderColor: theme.colors.primary },
              ]}
            >
              <Ionicons name="checkmark-circle" size={16} color={theme.colors.primary} />
              <Text style={[styles.toastText, { color: theme.colors.primary }]}>{toastMessage}</Text>
            </View>
          ) : null}

          {/* Collection List */}
          {collectionsQuery.isLoading ? (
            <ActivityIndicator style={{ marginVertical: 20 }} color={theme.colors.primary} />
          ) : (
            <ScrollView style={{ maxHeight: 240 }} showsVerticalScrollIndicator={false}>
              {collections.length === 0 && !isCreating ? (
                <Text style={[styles.emptyText, { color: theme.colors.muted }]}>
                  Chưa có bộ sưu tập nào. Tạo ngay bên dưới nhé!
                </Text>
              ) : null}

              {collections.map((col: RawCollection) => {
                const isChecked = activeCollectionIds.includes(col.id);
                return (
                  <Pressable
                    key={col.id}
                    style={({ pressed }) => [
                      styles.collectionItem,
                      { backgroundColor: theme.colors.surface },
                      pressed && { opacity: 0.8 },
                    ]}
                    onPress={() =>
                      toggleMutation.mutate({ collectionId: col.id, isMember: isChecked })
                    }
                  >
                    <Text style={styles.emoji}>{col.emoji || '📁'}</Text>
                    <Text style={[styles.collectionName, { color: theme.colors.text }]}>
                      {col.name}
                    </Text>
                    <Text style={[styles.petCount, { color: theme.colors.muted }]}>
                      {col.pet_count ?? 0} bé
                    </Text>

                    <View
                      style={[
                        styles.checkbox,
                        {
                          backgroundColor: isChecked ? theme.colors.primary : 'transparent',
                          borderColor: isChecked ? theme.colors.primary : theme.colors.border,
                        },
                      ]}
                    >
                      {isChecked && <Ionicons name="checkmark" size={14} color="white" />}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {/* Create Collection Form / Toggle Button */}
          {!isCreating ? (
            <Pressable
              style={({ pressed }) => [
                styles.addCollectionBtn,
                { borderColor: theme.colors.border },
                pressed && { opacity: 0.8 },
              ]}
              onPress={() => setIsCreating(true)}
            >
              <Ionicons name="add-circle-outline" size={20} color={theme.colors.primary} />
              <Text style={[styles.addCollectionText, { color: theme.colors.primary }]}>
                Tạo bộ sưu tập mới
              </Text>
            </Pressable>
          ) : (
            <View style={[styles.createForm, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.formLabel, { color: theme.colors.text }]}>Tên bộ sưu tập:</Text>
              <TextInput
                style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
                placeholder="VD: Muốn nhận nuôi, Đang cân nhắc..."
                placeholderTextColor={theme.colors.muted}
                value={newCollectionName}
                onChangeText={setNewCollectionName}
                autoFocus
              />

              <View style={styles.emojiRow}>
                {EMOJI_OPTIONS.map((emoji) => (
                  <Pressable
                    key={emoji}
                    style={[
                      styles.emojiBtn,
                      selectedEmoji === emoji && { backgroundColor: theme.colors.primaryContainer },
                    ]}
                    onPress={() => setSelectedEmoji(emoji)}
                  >
                    <Text style={{ fontSize: 18 }}>{emoji}</Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.formActions}>
                <Pressable style={styles.cancelBtn} onPress={() => setIsCreating(false)}>
                  <Text style={{ color: theme.colors.muted, fontWeight: '600' }}>Hủy</Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.submitBtn,
                    { backgroundColor: theme.colors.primary },
                    createMutation.isPending && { opacity: 0.6 },
                  ]}
                  onPress={() => createMutation.mutate()}
                  disabled={createMutation.isPending || !newCollectionName.trim()}
                >
                  <Text style={{ color: 'white', fontWeight: '700' }}>
                    {createMutation.isPending ? 'Đang tạo...' : 'Tạo & Lưu'}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 2 },
  closeBtn: { padding: 4 },
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  toastText: { fontSize: 13, fontWeight: '700', flex: 1 },
  emptyText: { textAlign: 'center', marginVertical: 16, fontSize: 13 },
  collectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
  },
  emoji: { fontSize: 20, marginRight: 10 },
  collectionName: { flex: 1, fontSize: 14, fontWeight: '700' },
  petCount: { fontSize: 12, marginRight: 12 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCollectionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    paddingVertical: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  addCollectionText: { fontSize: 14, fontWeight: '700' },
  createForm: { borderRadius: 18, padding: 16, marginTop: 8 },
  formLabel: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 14,
    marginBottom: 12,
  },
  emojiRow: { flexDirection: 'row', gap: 8, marginBottom: 16, justifyContent: 'center' },
  emojiBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, alignItems: 'center' },
  cancelBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  submitBtn: { borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10 },
});

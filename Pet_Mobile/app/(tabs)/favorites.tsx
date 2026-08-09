// FavoritesScreen — Màn hình Đã lưu / Yêu thích.
//
// Nguồn dữ liệu:
//   - likedPets   <- GET /api/v1/favorites/my (backend)
//   - passedPets  <- GET /api/v1/favorites/passed (backend)
import { useCallback, useEffect, useState } from "react";
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  fetchMyFavorites,
  fetchMyPassed,
  fetchMySuperliked,
  removeFavorite,
  restoreFavorite,
  superLikeFavorite,
  type RawFavorite,
} from "@/lib/api/favorites";
import { resolveImageUrl } from "@/lib/images/resolveUrl";
import { useTheme } from "@/lib/theme/ThemeContext";
import { useTranslation } from "react-i18next";
import { AddToCollectionModal } from "@/components/AddToCollectionModal";
import { PetNoteModal } from "@/components/PetNoteModal";
import { PetReminderModal } from "@/components/PetReminderModal";
import { getPetReminder } from "@/lib/notifications/reminders";
import {
  fetchMyCollections,
  fetchCollectionPets,
  type RawCollection,
} from "@/lib/api/collections";
import { fetchPetNote } from "@/lib/api/notes";

type FilterType = "all" | "liked" | "superliked" | "passed";

type FavItem = {
  id: number;
  name: string;
  image: string | null;
  type: "liked" | "passed" | "superliked";
  breed?: string;
  age?: string;
  location?: string;
  likedAt?: string | null;
};

function formatRelativeDate(
  isoDateString: string | null | undefined,
  t: any,
): string {
  if (!isoDateString) return "--";
  const date = new Date(isoDateString);
  if (isNaN(date.getTime())) return "--";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return t("favorites:today", { defaultValue: "Hôm nay" });
  if (diffDays === 1)
    return t("favorites:yesterday", { defaultValue: "Hôm qua" });
  if (diffDays < 7)
    return t("favorites:daysAgo", {
      count: diffDays,
      defaultValue: `${diffDays} ngày trước`,
    });
  return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
}

function cleanLocationText(rawLocation?: string | null): string | undefined {
  if (!rawLocation) return undefined;
  const cleaned = rawLocation
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/https?:\/\/\S+/gi, "")
    .trim();
  return cleaned.length > 0 ? cleaned : undefined;
}

function FavoriteCard({
  item,
  onDetail,
  onRemove,
  onRestore,
  onAddToCollection,
  onOpenNote,
  onOpenReminder,
  onSuperlike,
  compareMode = false,
  isSelectedForCompare = false,
  compareIndex = 0,
  onToggleCompare,
}: {
  item: FavItem;
  onDetail: (id: number) => void;
  onRemove: (id: number) => void;
  onRestore: (id: number) => void;
  onAddToCollection: (item: FavItem) => void;
  onOpenNote: (item: FavItem) => void;
  onOpenReminder: (item: FavItem) => void;
  onSuperlike: (item: FavItem) => void;
  compareMode?: boolean;
  isSelectedForCompare?: boolean;
  compareIndex?: number;
  onToggleCompare?: (item: FavItem) => void;
}) {
  const { theme } = useTheme();
  const { t } = useTranslation(["favorites", "common"]);

  // Fetch whether this pet belongs to any collection
  const petCollectionsQuery = useQuery({
    queryKey: ["pet-collections", item.id],
    queryFn: async () => {
      const res = await fetchPetCollections(item.id);
      return res.collectionIds || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const hasCollections = (petCollectionsQuery.data || []).length > 0;

  // Fetch personal note for this pet
  const petNoteQuery = useQuery({
    queryKey: ["note", item.id],
    queryFn: async () => {
      const res = await fetchPetNote(item.id);
      return res.note;
    },
    staleTime: 5 * 60 * 1000,
  });

  const noteContent = petNoteQuery.data?.content || null;

  // Fetch reminder for this pet
  const reminderQuery = useQuery({
    queryKey: ["reminder", item.id],
    queryFn: async () => {
      return await getPetReminder(item.id);
    },
    staleTime: 60 * 1000,
  });

  const reminder = reminderQuery.data;

  const badgeConfig = {
    liked: {
      label: t("favorites:badgeLiked"),
      bg: theme.colors.primary,
      color: "white",
    },
    superliked: { label: "⭐ Ưu tiên", bg: "#FFB800", color: "white" },
    passed: {
      label: t("favorites:badgePassed"),
      bg: "rgba(0,0,0,0.55)",
      color: "white",
    },
  }[item.type];

  const dateText = formatRelativeDate(item.likedAt, t);
  const locationText = cleanLocationText(item.location);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.favCard,
        {
          backgroundColor: theme.colors.card,
          borderColor:
            item.type === "superliked"
              ? "#FFB800"
              : isSelectedForCompare
                ? theme.colors.primary
                : theme.colors.border,
          borderWidth:
            item.type === "superliked" || isSelectedForCompare ? 2.5 : 1,
        },
        isSelectedForCompare && {
          shadowColor: theme.colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 10,
          elevation: 8,
        },
        pressed && { opacity: 0.9 },
      ]}
      onPress={() => {
        if (compareMode) {
          onToggleCompare?.(item);
        } else {
          onDetail(item.id);
        }
      }}
      onLongPress={() => onAddToCollection(item)}
    >
      <View style={styles.favImageWrap}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.favImage} />
        ) : (
          <View
            style={[
              styles.favImage,
              {
                backgroundColor: theme.colors.surface,
                alignItems: "center",
                justifyContent: "center",
              },
            ]}
          >
            <Ionicons name="paw" size={40} color={theme.colors.muted} />
          </View>
        )}

        {/* Compare selection checkmark badge */}
        {compareMode && isSelectedForCompare && (
          <View
            style={[
              styles.compareBadgeActive,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <Ionicons name="checkmark-circle" size={14} color="white" />
            <Text style={styles.compareBadgeText}>✓ {compareIndex}</Text>
          </View>
        )}

        {/* Dark overlay gradient behind info for readability */}
        <View style={styles.favImageOverlayGradient} />

        {/* Top Badges Row (Non-overlapping) */}
        <View style={styles.topBadgesRow}>
          <View style={[styles.typeBadge, { backgroundColor: badgeConfig.bg }]}>
            <Text
              style={[styles.typeBadgeText, { color: badgeConfig.color }]}
              numberOfLines={1}
            >
              {badgeConfig.label}
            </Text>
          </View>
          <View style={styles.dateBadge}>
            <Text style={styles.dateBadgeText} numberOfLines={1}>
              {dateText}
            </Text>
          </View>
        </View>

        {/* Pet name & note overlay */}
        <View style={styles.favNameOverlay}>
          <Text style={styles.favPetName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.breed || item.age ? (
            <Text style={styles.favPetBreed} numberOfLines={1}>
              {[item.breed, item.age].filter(Boolean).join(" · ")}
            </Text>
          ) : null}
          {noteContent ? (
            <Text style={styles.favNotePreview} numberOfLines={1}>
              📝 {noteContent}
            </Text>
          ) : null}
          {reminder ? (
            <Text style={styles.favReminderPreview} numberOfLines={1}>
              ⏰{" "}
              {new Date(reminder.remindAt).toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.favFooter}>
        {locationText ? (
          <View style={styles.favLocationRow}>
            <Ionicons
              name="location-outline"
              size={11}
              color={theme.colors.muted}
            />
            <Text
              style={[styles.favLocation, { color: theme.colors.muted }]}
              numberOfLines={1}
            >
              {locationText}
            </Text>
          </View>
        ) : (
          <View style={styles.favLocationRow} />
        )}

        {item.type === "passed" ? (
          <Pressable
            style={({ pressed }) => [
              styles.restoreBtn,
              { backgroundColor: theme.colors.text },
              pressed && { opacity: 0.8 },
            ]}
            onPress={(e) => {
              e.stopPropagation();
              onRestore(item.id);
            }}
          >
            <Ionicons name="refresh" size={13} color="white" />
            <Text style={styles.restoreBtnText}>
              {t("common:restore", { defaultValue: "Khôi phục" })}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.favActionsContainer}>
            {/* Row 1: Detail, Note, Collection */}
            <View style={styles.favActionsRow}>
              {/* Detail Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.iconActionBtn,
                  { backgroundColor: theme.colors.surface },
                  pressed && { opacity: 0.8 },
                ]}
                onPress={(e) => {
                  e.stopPropagation();
                  onDetail(item.id);
                }}
              >
                <Ionicons
                  name="eye-outline"
                  size={16}
                  color={theme.colors.text}
                />
              </Pressable>

              {/* Note Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.iconActionBtn,
                  {
                    backgroundColor: noteContent
                      ? `${theme.colors.primary}22`
                      : theme.colors.surface,
                    borderColor: noteContent
                      ? theme.colors.primary
                      : "transparent",
                    borderWidth: noteContent ? 1 : 0,
                  },
                  pressed && { opacity: 0.8 },
                ]}
                onPress={(e) => {
                  e.stopPropagation();
                  onOpenNote(item);
                }}
              >
                <Ionicons
                  name={noteContent ? "create" : "create-outline"}
                  size={15}
                  color={noteContent ? theme.colors.primary : theme.colors.text}
                />
              </Pressable>

              {/* Collection Folder Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.iconActionBtn,
                  {
                    backgroundColor: hasCollections
                      ? `${theme.colors.primary}22`
                      : theme.colors.surface,
                    borderColor: hasCollections
                      ? theme.colors.primary
                      : "transparent",
                    borderWidth: hasCollections ? 1 : 0,
                  },
                  pressed && { opacity: 0.8 },
                ]}
                onPress={(e) => {
                  e.stopPropagation();
                  onAddToCollection(item);
                }}
              >
                <Ionicons
                  name={hasCollections ? "folder" : "folder-open-outline"}
                  size={15}
                  color={
                    hasCollections ? theme.colors.primary : theme.colors.text
                  }
                />
              </Pressable>
            </View>

            {/* Row 2: Reminder Bell, Superlike Star, Heart Dislike */}
            <View style={styles.favActionsRow}>
              {/* Reminder Bell Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.iconActionBtn,
                  {
                    backgroundColor: reminder
                      ? `${theme.colors.primary}22`
                      : theme.colors.surface,
                    borderColor: reminder
                      ? theme.colors.primary
                      : "transparent",
                    borderWidth: reminder ? 1 : 0,
                  },
                  pressed && { opacity: 0.8 },
                ]}
                onPress={(e) => {
                  e.stopPropagation();
                  onOpenReminder(item);
                }}
              >
                <Ionicons
                  name={reminder ? "notifications" : "notifications-outline"}
                  size={15}
                  color={reminder ? theme.colors.primary : theme.colors.text}
                />
              </Pressable>

              {/* Superlike Star Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.iconActionBtn,
                  {
                    backgroundColor:
                      item.type === "superliked"
                        ? "#FFF8E1"
                        : theme.colors.surface,
                    borderColor:
                      item.type === "superliked" ? "#FFB800" : "transparent",
                    borderWidth: item.type === "superliked" ? 1 : 0,
                  },
                  pressed && { opacity: 0.8 },
                ]}
                onPress={(e) => {
                  e.stopPropagation();
                  onSuperlike(item);
                }}
              >
                <Ionicons
                  name={item.type === "superliked" ? "star" : "star-outline"}
                  size={15}
                  color={
                    item.type === "superliked" ? "#FFB800" : theme.colors.text
                  }
                />
              </Pressable>

              {/* Like / Dislike Heart Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.iconActionBtn,
                  { backgroundColor: theme.colors.primaryContainer },
                  pressed && { opacity: 0.8 },
                ]}
                onPress={(e) => {
                  e.stopPropagation();
                  onRemove(item.id);
                }}
              >
                <Ionicons name="heart" size={15} color={theme.colors.primary} />
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function FavoriteSkeletonCard() {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.favCard,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
          opacity: 0.6,
        },
      ]}
    >
      <View
        style={[styles.favImageWrap, { backgroundColor: theme.colors.surface }]}
      />
      <View style={styles.favFooter}>
        <View
          style={{
            height: 12,
            width: "65%",
            backgroundColor: theme.colors.surface,
            borderRadius: 6,
            marginBottom: 10,
          }}
        />
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View
            style={{
              flex: 1,
              height: 34,
              backgroundColor: theme.colors.surface,
              borderRadius: 10,
            }}
          />
          <View
            style={{
              width: 34,
              height: 34,
              backgroundColor: theme.colors.surface,
              borderRadius: 10,
            }}
          />
        </View>
      </View>
    </View>
  );
}

const LIKED_QUERY_KEY = ["favorites", "liked"];
const SUPERLIKED_QUERY_KEY = ["favorites", "superliked"];
const PASSED_QUERY_KEY = ["favorites", "passed"];

export default function FavoritesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { t } = useTranslation(["favorites", "tabs", "common"]);
  const queryClient = useQueryClient();

  // Interaction filter
  const [filter, setFilter] = useState<FilterType>("all");
  // Category & Gender sub-filters
  const [speciesFilter, setSpeciesFilter] = useState<"all" | "dog" | "cat">(
    "all",
  );
  const [genderFilter, setGenderFilter] = useState<"all" | "male" | "female">(
    "all",
  );

  // Search & Sort state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name">("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 200ms Search Debounce to keep UI silky smooth
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // TanStack Queries
  const likedQuery = useQuery({
    queryKey: LIKED_QUERY_KEY,
    queryFn: async () => {
      const res = await fetchMyFavorites();
      return (res.favorites || []).map((f: RawFavorite) => ({
        id: f.id,
        name: f.name ?? "Thú cưng",
        image: f.image ? resolveImageUrl(f.image) : null,
        type: "liked" as const,
        breed: f.breed ?? undefined,
        age: f.age ?? undefined,
        location: f.location ?? undefined,
        likedAt: f.liked_at ?? null,
      }));
    },
  });

  const superlikedQuery = useQuery({
    queryKey: SUPERLIKED_QUERY_KEY,
    queryFn: async () => {
      const res = await fetchMySuperliked();
      return (res.favorites || []).map((f: RawFavorite) => ({
        id: f.id,
        name: f.name ?? "Thú cưng",
        image: f.image ? resolveImageUrl(f.image) : null,
        type: "superliked" as const,
        breed: f.breed ?? undefined,
        age: f.age ?? undefined,
        location: f.location ?? undefined,
        likedAt: f.liked_at ?? null,
      }));
    },
  });

  const passedQuery = useQuery({
    queryKey: PASSED_QUERY_KEY,
    queryFn: async () => {
      const res = await fetchMyPassed();
      return (res.favorites || []).map((f: RawFavorite) => ({
        id: f.id,
        name: f.name ?? "Thú cưng",
        image: f.image ? resolveImageUrl(f.image) : null,
        type: "passed" as const,
        breed: f.breed ?? undefined,
        age: f.age ?? undefined,
        location: f.location ?? undefined,
        likedAt: f.liked_at ?? null,
      }));
    },
  });

  const likedItems = likedQuery.data || [];
  const superlikedItems = superlikedQuery.data || [];
  const passedItems = passedQuery.data || [];
  const isLoading =
    likedQuery.isLoading || superlikedQuery.isLoading || passedQuery.isLoading;

  // Refetch on focus if stale
  useFocusEffect(
    useCallback(() => {
      void likedQuery.refetch();
      void superlikedQuery.refetch();
      void passedQuery.refetch();
    }, [likedQuery, superlikedQuery, passedQuery]),
  );

  // Optimistic Mutation: Remove Favorite (Liked -> Passed)
  const removeMutation = useMutation({
    mutationFn: (petId: number) => removeFavorite(petId),
    onMutate: async (petId: number) => {
      await queryClient.cancelQueries({ queryKey: ["favorites"] });

      const prevLiked =
        queryClient.getQueryData<FavItem[]>(LIKED_QUERY_KEY) || [];
      const prevPassed =
        queryClient.getQueryData<FavItem[]>(PASSED_QUERY_KEY) || [];

      const itemToMove = prevLiked.find((i) => i.id === petId);
      if (itemToMove) {
        queryClient.setQueryData<FavItem[]>(
          LIKED_QUERY_KEY,
          prevLiked.filter((i) => i.id !== petId),
        );
        queryClient.setQueryData<FavItem[]>(PASSED_QUERY_KEY, [
          { ...itemToMove, type: "passed" },
          ...prevPassed,
        ]);
      }

      return { prevLiked, prevPassed };
    },
    onError: (_err, _petId, context) => {
      if (context) {
        queryClient.setQueryData(LIKED_QUERY_KEY, context.prevLiked);
        queryClient.setQueryData(PASSED_QUERY_KEY, context.prevPassed);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  // Optimistic Mutation: Restore Favorite (Passed -> Liked)
  const restoreMutation = useMutation({
    mutationFn: (petId: number) => restoreFavorite(petId),
    onMutate: async (petId: number) => {
      await queryClient.cancelQueries({ queryKey: ["favorites"] });

      const prevLiked =
        queryClient.getQueryData<FavItem[]>(LIKED_QUERY_KEY) || [];
      const prevPassed =
        queryClient.getQueryData<FavItem[]>(PASSED_QUERY_KEY) || [];

      const itemToMove = prevPassed.find((i) => i.id === petId);
      if (itemToMove) {
        queryClient.setQueryData<FavItem[]>(
          PASSED_QUERY_KEY,
          prevPassed.filter((i) => i.id !== petId),
        );
        queryClient.setQueryData<FavItem[]>(LIKED_QUERY_KEY, [
          { ...itemToMove, type: "liked" },
          ...prevLiked,
        ]);
      }

      return { prevLiked, prevPassed };
    },
    onError: (_err, _petId, context) => {
      if (context) {
        queryClient.setQueryData(LIKED_QUERY_KEY, context.prevLiked);
        queryClient.setQueryData(PASSED_QUERY_KEY, context.prevPassed);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  // Collection, Note & Reminder state
  const [collectionModalPet, setCollectionModalPet] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [noteModalPet, setNoteModalPet] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [reminderModalPet, setReminderModalPet] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState<
    number | null
  >(null);

  // Compare Mode state
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<number[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleToggleCompare = (item: FavItem) => {
    setSelectedForCompare((prev) => {
      if (prev.includes(item.id)) {
        return prev.filter((id) => id !== item.id);
      }
      if (prev.length >= 3) {
        showToast("Chỉ có thể so sánh tối đa 3 thú cưng cùng lúc");
        return prev;
      }
      return [...prev, item.id];
    });
  };

  // Collections Query
  const collectionsQuery = useQuery({
    queryKey: ["collections"],
    queryFn: async () => {
      const res = await fetchMyCollections();
      return res.collections || [];
    },
  });
  const collections = collectionsQuery.data || [];

  // Collection Pets Query (when a collection chip is selected)
  const collectionPetsQuery = useQuery({
    queryKey: ["collection-pets", selectedCollectionId],
    queryFn: async () => {
      if (!selectedCollectionId) return [];
      const res = await fetchCollectionPets(selectedCollectionId);
      return (res.favorites || []).map((f: RawFavorite) => ({
        id: f.id,
        name: f.name ?? "Thú cưng",
        image: f.image ? resolveImageUrl(f.image) : null,
        type: "liked" as const,
        breed: f.breed ?? undefined,
        age: f.age ?? undefined,
        location: f.location ?? undefined,
        likedAt: f.liked_at ?? null,
      }));
    },
    enabled: selectedCollectionId !== null,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      likedQuery.refetch(),
      passedQuery.refetch(),
      collectionsQuery.refetch(),
    ]);
    setRefreshing(false);
  };

  const handleDetail = (petId: number) => {
    router.push({
      pathname: "/pet-detail",
      params: { petId: String(petId) },
    });
  };

  const handleRemove = (petId: number) => {
    removeMutation.mutate(petId);
  };

  const handleRestore = (petId: number) => {
    restoreMutation.mutate(petId);
  };

  const handleAddToCollection = (item: FavItem) => {
    setCollectionModalPet({ id: item.id, name: item.name });
  };

  const handleOpenNote = (item: FavItem) => {
    setNoteModalPet({ id: item.id, name: item.name });
  };

  // Superlike Mutation
  const superlikeMutation = useMutation({
    mutationFn: (petId: number) => superLikeFavorite(petId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  const handleSuperlike = (item: FavItem) => {
    if (item.type === "superliked") {
      restoreMutation.mutate(item.id);
    } else {
      superlikeMutation.mutate(item.id);
    }
  };

  const handleOpenReminder = (item: FavItem) => {
    setReminderModalPet({ id: item.id, name: item.name });
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSpeciesFilter("all");
    setGenderFilter("all");
    setFilter("all");
    setSelectedCollectionId(null);
  };

  const allSaved: FavItem[] = [
    ...superlikedItems,
    ...likedItems,
    ...passedItems,
  ];

  const baseItems: FavItem[] =
    selectedCollectionId !== null ? collectionPetsQuery.data || [] : allSaved;

  // Advanced Multi-Attribute Filtering
  const filtered = baseItems.filter((item) => {
    // 1. Interaction Filter
    if (filter === "liked" && item.type !== "liked") return false;
    if (filter === "superliked" && item.type !== "superliked") return false;
    if (filter === "passed" && item.type !== "passed") return false;

    // 2. Species Filter
    if (speciesFilter === "dog") {
      const isDog =
        (item.breed || "").toLowerCase().includes("chó") ||
        (item.name || "").toLowerCase().includes("chó");
      if (!isDog) return false;
    }
    if (speciesFilter === "cat") {
      const isCat =
        (item.breed || "").toLowerCase().includes("mèo") ||
        (item.name || "").toLowerCase().includes("mèo");
      if (!isCat) return false;
    }

    // 2b. Gender Filter
    if (genderFilter === "male") {
      const isMale =
        (item.breed || "").toLowerCase().includes("đực") ||
        (item.name || "").toLowerCase().includes("đực");
      if (!isMale) return false;
    }
    if (genderFilter === "female") {
      const isFemale =
        (item.breed || "").toLowerCase().includes("cái") ||
        (item.name || "").toLowerCase().includes("cái");
      if (!isFemale) return false;
    }

    // 3. Search Query (matches name, breed, or location) - debounced 200ms
    if (debouncedQuery.trim().length > 0) {
      const q = debouncedQuery.trim().toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchBreed = (item.breed || "").toLowerCase().includes(q);
      const matchLocation = (item.location || "").toLowerCase().includes(q);
      if (!matchName && !matchBreed && !matchLocation) return false;
    }

    return true;
  });

  // Sorting Logic
  filtered.sort((a, b) => {
    if (sortBy === "oldest") {
      return (
        new Date(a.likedAt || 0).getTime() - new Date(b.likedAt || 0).getTime()
      );
    }
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    }
    // Default 'newest'
    return (
      new Date(b.likedAt || 0).getTime() - new Date(a.likedAt || 0).getTime()
    );
  });

  const statCards = [
    {
      Icon: "heart" as const,
      color: theme.colors.primary,
      bg: theme.colors.primaryContainer,
      count: likedItems.length,
      label: t("favorites:likedCount"),
    },
    {
      Icon: "star" as const,
      color: "#FFB800",
      bg: "#FFF8E1",
      count: superlikedItems.length,
      label: "Siêu thích ⭐",
    },
    {
      Icon: "close" as const,
      color: theme.colors.muted,
      bg: theme.colors.surface,
      count: passedItems.length,
      label: t("favorites:passedCount"),
    },
  ];

  const filterOptions = [
    {
      id: "all" as FilterType,
      label: t("favorites:filterAll"),
      count: allSaved.length,
    },
    {
      id: "liked" as FilterType,
      label: t("favorites:filterLiked"),
      count: likedItems.length,
    },
    {
      id: "superliked" as FilterType,
      label: "Siêu thích ⭐",
      count: superlikedItems.length,
    },
    {
      id: "passed" as FilterType,
      label: t("favorites:passedCount"),
      count: passedItems.length,
    },
  ];

  const sortLabels = {
    newest: t("favorites:sortNewest"),
    oldest: t("favorites:sortOldest"),
    name: t("favorites:sortNameAsc"),
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: Math.max(insets.top, 38) + 12, paddingBottom: 120 },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTag, { color: theme.colors.primary }]}>
            {t("tabs:favorites")}
          </Text>
          <View style={styles.headerTitleRow}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              {t("favorites:title")}
            </Text>
            <Text style={[styles.headerCount, { color: theme.colors.muted }]}>
              ·· {t("favorites:petCount", { count: filtered.length })}
            </Text>
          </View>
        </View>

        {/* Action buttons: Compare, Sort & Search */}
        <View style={styles.headerActions}>
          <Pressable
            style={({ pressed }) => [
              styles.iconBtn,
              compareMode
                ? [
                    styles.iconBtnActive,
                    {
                      backgroundColor: theme.colors.primary,
                      shadowColor: theme.colors.primary,
                    },
                  ]
                : {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                  },
              pressed && { opacity: 0.85 },
            ]}
            onPress={() => {
              setCompareMode((prev) => {
                if (prev) {
                  setSelectedForCompare([]);
                }
                return !prev;
              });
            }}
          >
            <Ionicons
              name="swap-horizontal"
              size={18}
              color={compareMode ? "white" : theme.colors.text}
            />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.iconBtn,
              showSortMenu
                ? [
                    styles.iconBtnActive,
                    {
                      backgroundColor: theme.colors.primary,
                      shadowColor: theme.colors.primary,
                    },
                  ]
                : {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                  },
              pressed && { opacity: 0.85 },
            ]}
            onPress={() => setShowSortMenu((prev) => !prev)}
          >
            <Ionicons
              name="options-outline"
              size={18}
              color={showSortMenu ? "white" : theme.colors.text}
            />
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.iconBtn,
              showSearch
                ? [
                    styles.iconBtnActive,
                    {
                      backgroundColor: theme.colors.primary,
                      shadowColor: theme.colors.primary,
                    },
                  ]
                : {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                  },
              pressed && { opacity: 0.85 },
            ]}
            onPress={() => {
              setShowSearch((prev) => !prev);
              if (showSearch) setSearchQuery("");
            }}
          >
            <Ionicons
              name={showSearch ? "close" : "search-outline"}
              size={18}
              color={showSearch ? "white" : theme.colors.text}
            />
          </Pressable>
        </View>
      </View>

      {/* Persistent Compare Mode Info Banner */}
      {compareMode && (
        <View
          style={[
            styles.compareHintBanner,
            {
              backgroundColor: `${theme.colors.primary}15`,
              borderColor: `${theme.colors.primary}35`,
            },
          ]}
        >
          <Ionicons
            name="information-circle"
            size={18}
            color={theme.colors.primary}
            style={styles.hintIcon}
          />
          <Text
            style={[styles.compareHintText, { color: theme.colors.primary }]}
          >
            Chế độ so sánh: Chọn tối đa 3 thú cưng ({selectedForCompare.length}
            /3)
          </Text>
        </View>
      )}

      {/* Toast Feedback */}
      {toastMessage && (
        <View
          style={[
            styles.toastBanner,
            {
              backgroundColor: `${theme.colors.primary}18`,
              borderColor: theme.colors.primary,
            },
          ]}
        >
          <Ionicons
            name="information-circle"
            size={16}
            color={theme.colors.primary}
          />
          <Text style={[styles.toastText, { color: theme.colors.primary }]}>
            {toastMessage}
          </Text>
        </View>
      )}

      {/* Animated Search Bar */}
      {showSearch && (
        <View
          style={[
            styles.searchBarWrap,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Ionicons
            name="search"
            size={16}
            color={theme.colors.muted}
            style={{ marginRight: 8 }}
          />
          <TextInput
            placeholder={t("favorites:searchPlaceholder")}
            placeholderTextColor={theme.colors.muted}
            style={[styles.searchInput, { color: theme.colors.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
              <Ionicons
                name="close-circle"
                size={16}
                color={theme.colors.muted}
              />
            </Pressable>
          )}
        </View>
      )}

      {/* Sort Menu Bar */}
      {showSortMenu && (
        <View
          style={[
            styles.sortMenuWrap,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.sortMenuTitle, { color: theme.colors.muted }]}>
            Sắp xếp theo:
          </Text>
          <View style={styles.sortOptionsRow}>
            {(["newest", "oldest", "name"] as const).map((key) => (
              <Pressable
                key={key}
                style={[
                  styles.sortPill,
                  {
                    backgroundColor:
                      sortBy === key
                        ? theme.colors.primary
                        : theme.colors.surface,
                  },
                ]}
                onPress={() => setSortBy(key)}
              >
                <Text
                  style={[
                    styles.sortPillText,
                    { color: sortBy === key ? "white" : theme.colors.text },
                  ]}
                >
                  {sortLabels[key]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Stat Cards */}
      <View style={styles.statsRow}>
        {statCards.map(({ Icon, color, bg, count, label }) => (
          <View
            key={label}
            style={[
              styles.statCard,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={[styles.statIconWrap, { backgroundColor: bg }]}>
              <Ionicons name={Icon} size={18} color={color} />
            </View>
            <Text style={[styles.statCount, { color }]}>{count}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.muted }]}>
              {label}
            </Text>
          </View>
        ))}
      </View>

      {/* Row 1: Interaction Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingBottom: 2, marginBottom: 12 }}
      >
        {filterOptions.map((f) => {
          const isActive = filter === f.id;
          return (
            <Pressable
              key={f.id}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isActive
                    ? theme.colors.primary
                    : theme.colors.card,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={() => setFilter(f.id)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: isActive ? "white" : theme.colors.text },
                ]}
              >
                {f.label}
              </Text>
              {f.count > 0 && (
                <View
                  style={[
                    styles.filterCount,
                    {
                      backgroundColor: isActive
                        ? "rgba(255,255,255,0.25)"
                        : theme.colors.surface,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterCountText,
                      { color: isActive ? "white" : theme.colors.muted },
                    ]}
                  >
                    {f.count}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Row 2: Collection Filter Chips */}
      {collections.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: 2, marginBottom: 10 }}
        >
          <Pressable
            style={[
              styles.subFilterChip,
              {
                backgroundColor:
                  selectedCollectionId === null
                    ? `${theme.colors.primary}18`
                    : theme.colors.card,
                borderColor:
                  selectedCollectionId === null
                    ? theme.colors.primary
                    : theme.colors.border,
              },
            ]}
            onPress={() => setSelectedCollectionId(null)}
          >
            <Text
              style={[
                styles.subFilterChipText,
                {
                  color:
                    selectedCollectionId === null
                      ? theme.colors.primary
                      : theme.colors.muted,
                },
              ]}
            >
              📁 Tất cả BST
            </Text>
          </Pressable>

          {collections.map((col: RawCollection) => {
            const isActive = selectedCollectionId === col.id;
            return (
              <Pressable
                key={col.id}
                style={[
                  styles.subFilterChip,
                  {
                    backgroundColor: isActive
                      ? `${theme.colors.primary}18`
                      : theme.colors.card,
                    borderColor: isActive
                      ? theme.colors.primary
                      : theme.colors.border,
                  },
                ]}
                onPress={() =>
                  setSelectedCollectionId(isActive ? null : col.id)
                }
              >
                <Text
                  style={[
                    styles.subFilterChipText,
                    {
                      color: isActive
                        ? theme.colors.primary
                        : theme.colors.text,
                    },
                  ]}
                >
                  {col.emoji || "📁"} {col.name} ({col.pet_count ?? 0})
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Row 3: Category Filter Chips (Dogs / Cats) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingBottom: 2, marginBottom: 20 }}
      >
        {[
          { id: "all", label: "Tất cả loài" },
          { id: "dog", label: t("favorites:filterDogs") },
          { id: "cat", label: t("favorites:filterCats") },
        ].map((c) => {
          const isActive = speciesFilter === c.id;
          return (
            <Pressable
              key={c.id}
              style={[
                styles.subFilterChip,
                {
                  backgroundColor: isActive
                    ? `${theme.colors.primary}18`
                    : theme.colors.card,
                  borderColor: isActive
                    ? theme.colors.primary
                    : theme.colors.border,
                },
              ]}
              onPress={() => setSpeciesFilter(c.id as any)}
            >
              <Text
                style={[
                  styles.subFilterChipText,
                  {
                    color: isActive ? theme.colors.primary : theme.colors.muted,
                  },
                ]}
              >
                {c.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Pet Grid */}
      {isLoading ? (
        <View style={styles.grid}>
          <FavoriteSkeletonCard />
          <FavoriteSkeletonCard />
          <FavoriteSkeletonCard />
          <FavoriteSkeletonCard />
        </View>
      ) : filtered.length === 0 ? (
        allSaved.length === 0 ? (
          /* Entirely Empty State */
          <View style={styles.emptyState}>
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: theme.colors.primaryContainer },
              ]}
            >
              <Ionicons name="heart" size={36} color={theme.colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              {t("favorites:emptyTitle")}
            </Text>
            <Text style={[styles.emptyDesc, { color: theme.colors.muted }]}>
              {t("favorites:emptyDesc")}
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.ctaBtn,
                { backgroundColor: theme.colors.primary },
                pressed && { opacity: 0.85 },
              ]}
              onPress={() => router.push("/(tabs)")}
            >
              <Ionicons
                name="paw-sharp"
                size={16}
                color="white"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.ctaBtnText}>{t("favorites:exploreCta")}</Text>
            </Pressable>
          </View>
        ) : (
          /* Search / Filter No Match State */
          <View style={styles.emptyState}>
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <Ionicons name="search" size={32} color={theme.colors.muted} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              {t("favorites:noMatchTitle")}
            </Text>
            <Text style={[styles.emptyDesc, { color: theme.colors.muted }]}>
              {t("favorites:noMatchDesc")}
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.resetBtn,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
                pressed && { opacity: 0.85 },
              ]}
              onPress={resetFilters}
            >
              <Text style={[styles.resetBtnText, { color: theme.colors.text }]}>
                Xóa bộ lọc
              </Text>
            </Pressable>
          </View>
        )
      ) : (
        <View style={styles.grid}>
          {filtered.map((item) => (
            <FavoriteCard
              key={`${item.type}-${item.id}`}
              item={item}
              onDetail={handleDetail}
              onRemove={handleRemove}
              onRestore={handleRestore}
              onAddToCollection={handleAddToCollection}
              onOpenNote={handleOpenNote}
              onOpenReminder={handleOpenReminder}
              onSuperlike={handleSuperlike}
              compareMode={compareMode}
              isSelectedForCompare={selectedForCompare.includes(item.id)}
              compareIndex={selectedForCompare.indexOf(item.id) + 1}
              onToggleCompare={handleToggleCompare}
            />
          ))}
        </View>
      )}

      {/* Add To Collection Modal */}
      <AddToCollectionModal
        visible={collectionModalPet !== null}
        petId={collectionModalPet?.id ?? null}
        petName={collectionModalPet?.name}
        onClose={() => setCollectionModalPet(null)}
      />

      {/* Pet Note Modal */}
      <PetNoteModal
        visible={noteModalPet !== null}
        petId={noteModalPet?.id ?? null}
        petName={noteModalPet?.name}
        onClose={() => setNoteModalPet(null)}
      />

      {/* Pet Reminder Modal */}
      <PetReminderModal
        visible={reminderModalPet !== null}
        petId={reminderModalPet?.id ?? null}
        petName={reminderModalPet?.name}
        onClose={() => setReminderModalPet(null)}
      />

      {/* Floating Action Button for Compare */}
      {selectedForCompare.length >= 2 && (
        <View style={styles.fabContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.compareFab,
              { backgroundColor: theme.colors.primary },
              pressed && { opacity: 0.9 },
            ]}
            onPress={() => {
              router.push({
                pathname: "/compare-pets",
                params: { petIds: selectedForCompare.join(",") },
              });
            }}
          >
            <Ionicons
              name="swap-horizontal"
              size={18}
              color="white"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.compareFabText}>
              So sánh ({selectedForCompare.length}/3)
            </Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 24 },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  headerTag: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerTitle: { fontSize: 32, fontWeight: "800", lineHeight: 38 },
  headerCount: { fontSize: 16, marginTop: 4 },
  // Stats
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1,
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
  },
  statIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  statCount: { fontSize: 22, fontWeight: "800", marginBottom: 3 },
  statLabel: { fontSize: 11, fontWeight: "500" },
  // Filter chips
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
  },
  filterChipText: { fontSize: 13, fontWeight: "700" },
  filterCount: {
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  filterCountText: { fontSize: 12, fontWeight: "700" },
  // Grid
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  favCard: {
    width: "47%",
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.09,
    shadowRadius: 14,
    elevation: 6,
    borderWidth: 1,
  },
  favImageWrap: { position: "relative", height: 160 },
  favImage: { width: "100%", height: "100%" },
  compareBadgeActive: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  compareIndexText: { color: "white", fontSize: 11, fontWeight: "800" },
  compareBadgeInactive: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 12,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  compareAddText: { color: "white", fontSize: 10.5, fontWeight: "700" },
  favGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  topBadgesRow: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 2,
  },
  typeBadge: {
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    maxWidth: "52%",
  },
  typeBadgeText: { fontSize: 10.5, fontWeight: "700" },
  dateBadge: {
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    maxWidth: "48%",
  },
  dateBadgeText: { color: "white", fontSize: 10.5, fontWeight: "600" },
  favNameOverlay: { position: "absolute", bottom: 10, left: 10, right: 10 },
  favPetName: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 2,
  },
  favPetBreed: { color: "rgba(255,255,255,0.8)", fontSize: 11 },
  favNotePreview: {
    color: "white",
    fontSize: 10.5,
    fontWeight: "600",
    marginTop: 3,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  favReminderPreview: {
    color: "white",
    fontSize: 10.5,
    fontWeight: "700",
    marginTop: 3,
    backgroundColor: "rgba(255, 79, 163, 0.75)",
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  favFooter: { padding: 12 },
  favLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 10,
  },
  favLocation: {
    fontSize: 11,
    flex: 1,
    overflow: "hidden",
  },
  restoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 12,
    paddingVertical: 9,
    width: "100%",
  },
  favActionsContainer: { flexDirection: "column", gap: 6, width: "100%" },
  favActionsRow: { flexDirection: "row", gap: 6, width: "100%" },
  favActions: { flexDirection: "row", gap: 5, alignItems: "center" },
  iconActionBtn: {
    flex: 1,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  headerActions: { flexDirection: "row", gap: 8, marginTop: 4 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  iconBtnActive: {
    borderWidth: 0,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  compareHintBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  hintIcon: {
    marginRight: 8,
  },
  compareHintText: {
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
    lineHeight: 18,
  },
  searchBarWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 44,
    marginBottom: 16,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  sortMenuWrap: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  sortMenuTitle: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  sortOptionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  sortPill: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sortPillText: {
    fontSize: 12,
    fontWeight: "600",
  },
  subFilterChip: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
  },
  subFilterChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  // Empty state
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontWeight: "700", marginBottom: 10 },
  emptyDesc: { fontSize: 14, textAlign: "center", lineHeight: 21 },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 20,
  },
  ctaBtnText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
  resetBtn: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 16,
    borderWidth: 1,
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  fabContainer: {
    position: "absolute",
    bottom: 90,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 99,
  },
  compareFab: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  compareFabText: { color: "white", fontSize: 14, fontWeight: "800" },
});

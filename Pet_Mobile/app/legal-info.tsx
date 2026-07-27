import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/lib/theme/ThemeContext';

type TabKey = 'privacy' | 'terms' | 'about';

export default function LegalInfoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { t } = useTranslation(['legal', 'common']);
  const [activeTab, setActiveTab] = useState<TabKey>('privacy');

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'privacy', label: t('legal:tabPrivacy') },
    { key: 'terms', label: t('legal:tabTerms') },
    { key: 'about', label: t('legal:tabAbout') },
  ];

  const contentMap: Record<TabKey, { title: string; body: string[] }> = {
    privacy: {
      title: t('legal:privacyTitle'),
      body: [
        t('legal:privacyContent1'),
        t('legal:privacyContent2'),
        t('legal:privacyContent3'),
      ],
    },
    terms: {
      title: t('legal:termsTitle'),
      body: [
        t('legal:termsContent1'),
        t('legal:termsContent2'),
      ],
    },
    about: {
      title: t('legal:aboutTitle'),
      body: [
        t('legal:aboutContent1'),
        t('legal:aboutVersion', { version: '1.2.0' }),
      ],
    },
  };

  const content = contentMap[activeTab];

  return (
    <Animated.View style={[styles.screen, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, { backgroundColor: theme.colors.card }, pressed && { opacity: 0.7 }]}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{t('legal:title')}</Text>
        </View>

        {/* Tab bar */}
        <View style={[styles.tabBar, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          {tabs.map(tItem => {
            const isActive = activeTab === tItem.key;
            return (
              <Pressable
                key={tItem.key}
                style={({ pressed }) => [
                  styles.tabBtn,
                  isActive && { backgroundColor: theme.colors.primary },
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => setActiveTab(tItem.key)}
              >
                <Text style={[styles.tabBtnText, { color: isActive ? 'white' : theme.colors.muted }, isActive && styles.tabBtnTextActive]}>
                  {tItem.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Content */}
        <View style={[styles.contentCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.contentTitle, { color: theme.colors.text }]}>{content.title}</Text>
          {content.body.map((paragraph, i) => (
            <Text key={i} style={[styles.contentParagraph, { color: theme.colors.muted }]}>{paragraph}</Text>
          ))}
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 0, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24, paddingTop: 16 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
  },
  headerTitle: { fontSize: 26, fontWeight: '800' },
  tabBar: {
    flexDirection: 'row', borderRadius: 18,
    padding: 4, gap: 4, marginBottom: 24,
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  tabBtn: {
    flex: 1, borderRadius: 14, paddingVertical: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  tabBtnText: { fontSize: 13, fontWeight: '700' },
  tabBtnTextActive: { color: 'white', fontWeight: '800' },
  contentCard: {
    borderRadius: 24, padding: 24, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  contentTitle: {
    fontSize: 20, fontWeight: '800', marginBottom: 16,
  },
  contentParagraph: {
    fontSize: 14, lineHeight: 22, marginBottom: 12,
  },
});

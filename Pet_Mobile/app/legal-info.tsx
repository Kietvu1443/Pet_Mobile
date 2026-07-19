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

type TabKey = 'privacy' | 'terms' | 'about';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'privacy', label: 'Chính sách bảo mật' },
  { key: 'terms', label: 'Điều khoản dịch vụ' },
  { key: 'about', label: 'Giới thiệu' },
];

const CONTENT: Record<TabKey, { title: string; body: string[] }> = {
  privacy: {
    title: 'Chính sách bảo mật',
    body: [
      'Pet Helper cam kết bảo vệ thông tin cá nhân của bạn. Chúng tôi chỉ thu thập dữ liệu cần thiết để cung cấp dịch vụ kết nối nhận nuôi thú cưng.',
      'Thông tin thu thập bao gồm: họ tên, email, số điện thoại, địa chỉ và hình ảnh thú cưng. Dữ liệu được lưu trữ an toàn và không chia sẻ với bên thứ ba.',
      'Bạn có quyền yêu cầu xoá dữ liệu bất cứ lúc nào bằng cách liên hệ với chúng tôi qua email hỗ trợ.',
    ],
  },
  terms: {
    title: 'Điều khoản dịch vụ',
    body: [
      'Bằng cách sử dụng Pet Helper, bạn đồng ý với các điều khoản sau đây. Nền tảng kết nối người nhận nuôi và trại cứu hộ, không chịu trách nhiệm về các giao dịch ngoài nền tảng.',
      'Người dùng cam kết cung cấp thông tin chính xác và trung thực. Mọi hành vi gian lận sẽ dẫn đến khoá tài khoản vĩnh viễn.',
      'Chúng tôi có quyền điều chỉnh điều khoản và sẽ thông báo qua email khi có thay đổi quan trọng.',
    ],
  },
  about: {
    title: 'Giới thiệu',
    body: [
      'Pet Helper là nền tảng kết nối cộng đồng yêu thú cưng tại Việt Nam. Sứ mệnh của chúng tôi là giúp những bé thú cưng tìm được mái ấm yêu thương.',
      'Phiên bản: 1.2.0',
      'Liên hệ: support@pethelper.vn',
    ],
  },
};

export default function LegalInfoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabKey>('privacy');
  const content = CONTENT[activeTab];

  return (
    <Animated.View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={20} color="#1A1A1A" />
          </Pressable>
          <Text style={styles.headerTitle}>Thông tin & Pháp lý</Text>
        </View>

        {/* Tab bar */}
        <View style={styles.tabBar}>
          {TABS.map(t => (
            <Pressable
              key={t.key}
              style={({ pressed }) => [
                styles.tabBtn,
                activeTab === t.key && styles.tabBtnActive,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => setActiveTab(t.key)}
            >
              <Text style={[styles.tabBtnText, activeTab === t.key && styles.tabBtnTextActive]}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Content */}
        <View style={styles.contentCard}>
          <Text style={styles.contentTitle}>{content.title}</Text>
          {content.body.map((paragraph, i) => (
            <Text key={i} style={styles.contentParagraph}>{paragraph}</Text>
          ))}
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F5F8' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 0, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24, paddingTop: 16 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'white', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#1A1A1A' },
  tabBar: {
    flexDirection: 'row', backgroundColor: 'white', borderRadius: 18,
    padding: 4, gap: 4, marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  tabBtn: {
    flex: 1, borderRadius: 14, paddingVertical: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#FF4FA3',
    shadowColor: '#FF4FA3', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30, shadowRadius: 8, elevation: 4,
  },
  tabBtnText: { fontSize: 13, fontWeight: '700', color: '#888' },
  tabBtnTextActive: { color: 'white' },
  contentCard: {
    backgroundColor: 'white', borderRadius: 24, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  contentTitle: {
    fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginBottom: 16,
  },
  contentParagraph: {
    fontSize: 14, color: '#6B7280', lineHeight: 22, marginBottom: 12,
  },
});

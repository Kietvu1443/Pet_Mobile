// Tab layout — cấu hình 4 tabs cho app.
//
// Dùng BottomNav tự dựng thay cho tab bar mặc định của expo-router:
//   - Tab bar ẩn hoàn toàn (tabBarStyle: { display: 'none' })
//   - BottomNav render dưới dạng absolute overlay qua tabBar render prop
//   - 4 tabs: index (Nhận nuôi), pets (Thú cưng), favorites (Yêu thích), profile (Hồ sơ)
import { Tabs, useRouter } from 'expo-router';
import { BottomNav, type Tab } from '@/components/BottomNav';

// Map tab ID sang route path của expo-router
const TAB_ROUTES: Record<Tab, string> = {
  adopt:     '/(tabs)',
  pets:      '/(tabs)/pets',
  favorites: '/(tabs)/favorites',
  profile:   '/(tabs)/profile',
};

export default function TabLayout() {
  const router = useRouter();

  const handleTabChange = (tab: Tab) => {
    router.push(TAB_ROUTES[tab] as Parameters<typeof router.push>[0]);
  };

  return (
    <Tabs
      tabBar={(props) => {
        // Xác định tab đang active dựa trên state của expo-router
        const routeName = props.state.routes[props.state.index]?.name ?? 'index';
        const activeTab: Tab =
          routeName === 'index' ? 'adopt'
          : routeName === 'pets' ? 'pets'
          : routeName === 'favorites' ? 'favorites'
          : 'profile';
        return <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />;
      }}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index"     options={{ title: 'Nhận nuôi' }} />
      <Tabs.Screen name="pets"      options={{ title: 'Thú cưng' }} />
      <Tabs.Screen name="favorites" options={{ title: 'Yêu thích' }} />
      <Tabs.Screen name="profile"   options={{ title: 'Hồ sơ' }} />
    </Tabs>
  );
}

// Bảng màu + font cho PetSnap — khôi phục bản sắc legacy (frontend/pages/snap.html :root).
//
// Nguồn chân lý duy nhất cho mọi style PetSnap (card/deck/màn hình) để giữ đồng nhất.
// KHÔNG đụng tới constants/theme.ts (theme mặc định của Expo starter).

export const SNAP_COLORS = {
  bgLight: '#bef264', // điểm sáng của nền lime
  bg: '#a3e635',
  bgDark: '#84cc16', // điểm tối của nền lime
  ink: '#1a2e05', // chữ đậm trên nền sáng
  border: '#1f3d08', // viền xanh rêu đậm đặc trưng của thẻ
  panel: '#f2f5eb', // nền panel thông tin
  like: '#7c3aed', // TÍM = thích (đúng legacy, KHÔNG phải xanh lá)
  nope: '#ef4444', // ĐỎ = bỏ qua
  card: '#ffffff',
  muted: '#4b5563',
  white: '#ffffff',
} as const;

// Họ font Fredoka do @expo-google-fonts/fredoka cung cấp (nạp ở app/_layout.tsx).
export const SNAP_FONTS = {
  regular: 'Fredoka_400Regular',
  medium: 'Fredoka_500Medium',
  semibold: 'Fredoka_600SemiBold',
  bold: 'Fredoka_700Bold',
} as const;

// Nền PetSnap — tái hiện 1:1 nền của legacy (snap.html body):
//   - Gradient lime 160deg (#bef264 -> #a3e635 -> #84cc16)
//   - 2 vệt sáng radial trắng (góc trên-trái 15%/18%, trên-phải 88%/10%)
//   - Lát pattern dấu chân (paw) trắng mờ 0.7 — ĐÚNG path SVG của legacy, tile 160x160.
// Mọi nội dung màn hình render đè lên trên (children).
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  Path,
  Pattern,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { SNAP_COLORS } from '@/constants/petsnap-theme';

// Một dấu chân: thân (path) + 4 ngón (circle) — đúng hình của legacy paw SVG.
const PAW_PATH =
  'M10 16 C6 12 2 10 2 6 C2 3.5 4 1.5 6.5 1.5 C7.8 1.5 9 2.1 10 3.2 ' +
  'C11 2.1 12.2 1.5 13.5 1.5 C16 1.5 18 3.5 18 6 C18 10 14 12 10 16';

function Paw() {
  return (
    <>
      <Path d={PAW_PATH} />
      <Circle cx={4} cy={3} r={2.5} />
      <Circle cx={8} cy={1} r={2.5} />
      <Circle cx={12} cy={1} r={2.5} />
      <Circle cx={16} cy={3} r={2.5} />
    </>
  );
}

export function SnapBackground({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.root}>
      {/* Lớp nền lime (gradient 160deg xấp xỉ bằng start/end chéo). */}
      <LinearGradient
        colors={[SNAP_COLORS.bgLight, SNAP_COLORS.bg, SNAP_COLORS.bgDark]}
        locations={[0, 0.5, 1]}
        start={{ x: 0.12, y: 0 }}
        end={{ x: 0.88, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Vệt sáng radial + pattern dấu chân (giống background-image của legacy). */}
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <RadialGradient id="hl1" cx="15%" cy="18%" r="32%">
            <Stop offset="0%" stopColor="#ffffff" stopOpacity={0.4} />
            <Stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="hl2" cx="88%" cy="10%" r="26%">
            <Stop offset="0%" stopColor="#ffffff" stopOpacity={0.3} />
            <Stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
          </RadialGradient>

          {/* Tile 160x160 với 4 dấu chân ở các vị trí/độ xoay của legacy. */}
          <Pattern id="paws" width={160} height={160} patternUnits="userSpaceOnUse">
            <G fill="#ffffff" fillOpacity={0.7}>
              <G transform="translate(20,20) rotate(-15)">
                <Paw />
              </G>
              <G transform="translate(100,40) rotate(20)">
                <Paw />
              </G>
              <G transform="translate(50,110) rotate(-45)">
                <Paw />
              </G>
              <G transform="translate(130,120) rotate(10)">
                <Paw />
              </G>
            </G>
          </Pattern>
        </Defs>

        <Rect x="0" y="0" width="100%" height="100%" fill="url(#paws)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#hl1)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#hl2)" />
      </Svg>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

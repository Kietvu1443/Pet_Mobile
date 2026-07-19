import { motion } from "motion/react";
import { PawPrint, Search, Heart, User, ScanLine } from "lucide-react";
import type { Tab } from "../App";

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

type TabItem = {
  id: Tab;
  icon: React.ElementType;
  label: string;
  fillOnActive?: boolean;
};

const LEFT_TABS: TabItem[] = [
  { id: "pets",      icon: PawPrint, label: "Thú cưng",  fillOnActive: true  },
  { id: "adopt",     icon: Search,   label: "Nhận nuôi", fillOnActive: false },
];

const RIGHT_TABS: TabItem[] = [
  { id: "favorites", icon: Heart,    label: "Yêu thích", fillOnActive: true  },
  { id: "profile",   icon: User,     label: "Hồ sơ",     fillOnActive: false },
];

// Active pill: fixed square box — same size regardless of label
const PILL_W = 66;
const PILL_H = 52;

// FAB
const FAB_SIZE = 50;
const FAB_AREA = 64;   // spacer width that reserves the center slot
const FAB_LIFT = 20;   // px above the glass top (40% of FAB_SIZE)

function NavTab({
  tab,
  isActive,
  onClick,
}: {
  tab: TabItem;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = tab.icon;
  // Split label at first space: "Nhận nuôi" → ["Nhận", "nuôi"]
  const spaceIdx = tab.label.indexOf(" ");
  const line1 = spaceIdx === -1 ? tab.label : tab.label.slice(0, spaceIdx);
  const line2 = spaceIdx === -1 ? "" : tab.label.slice(spaceIdx + 1);

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.80 }}
      transition={{ type: "spring", stiffness: 520, damping: 28 }}
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "6px 2px",
        minHeight: 58,
        outline: "none",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {isActive ? (
        /* ── Active: fixed-size boxy rounded rectangle ── */
        <motion.div
          layoutId="activeTabPill"
          style={{
            background: "#FF4FA3",
            borderRadius: 14,
            width: PILL_W,
            height: PILL_H,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
            boxShadow: [
              "0 2px 8px rgba(255,79,163,0.38)",
              "0 6px 18px rgba(255,79,163,0.26)",
              "inset 0 1px 0 rgba(255,255,255,0.32)",
            ].join(", "),
          }}
          transition={{ type: "spring", stiffness: 420, damping: 36 }}
        >
          {/* Line 1: icon + first word */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Icon
              size={14}
              color="white"
              fill={tab.fillOnActive ? "white" : "none"}
              strokeWidth={2.3}
            />
            <span style={{
              color: "white",
              fontSize: 11,
              fontWeight: 700,
              lineHeight: 1,
              whiteSpace: "nowrap",
            }}>
              {line1}
            </span>
          </div>
          {/* Line 2: second word centered below */}
          {line2 ? (
            <span style={{
              color: "white",
              fontSize: 11,
              fontWeight: 700,
              lineHeight: 1,
              textAlign: "center",
              whiteSpace: "nowrap",
            }}>
              {line2}
            </span>
          ) : null}
        </motion.div>
      ) : (
        /* ── Inactive: icon + full label stacked ── */
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
          padding: "4px 6px",
        }}>
          <Icon
            size={21}
            color="rgba(100,100,120,0.65)"
            fill="none"
            strokeWidth={1.8}
          />
          <span style={{
            fontSize: 10,
            color: "rgba(100,100,120,0.65)",
            whiteSpace: "nowrap",
            fontWeight: 500,
          }}>
            {tab.label}
          </span>
        </div>
      )}
    </motion.button>
  );
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    /* Outer wrapper — paddingTop reserves space for the FAB that pokes above the glass */
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: "max(12px, env(safe-area-inset-bottom, 12px))",
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: FAB_LIFT + 10,
        pointerEvents: "none",
        zIndex: 100,
      }}
    >
      {/* Glass pill — position: relative is the anchor for the absolute FAB */}
      <div
        style={{
          position: "relative",
          pointerEvents: "all",
          display: "flex",
          alignItems: "center",

          background: "rgba(255, 255, 255, 0.13)",
          backdropFilter: "blur(30px) saturate(180%)",
          WebkitBackdropFilter: "blur(30px) saturate(180%)",

          borderRadius: 32,
          border: "0.5px solid rgba(255, 255, 255, 0.40)",
          boxShadow: [
            "inset 0 1px 0 rgba(255, 255, 255, 0.60)",
            "inset 0 -0.5px 0 rgba(0, 0, 0, 0.04)",
            "0 2px 8px rgba(0, 0, 0, 0.06)",
            "0 8px 24px rgba(0, 0, 0, 0.09)",
            "0 20px 48px rgba(0, 0, 0, 0.06)",
          ].join(", "),

          paddingTop: 6,
          paddingBottom: 6,
        }}
      >
        {/* ── Left tab group (flex: 1) ── */}
        <div style={{ flex: 1, display: "flex" }}>
          {LEFT_TABS.map(tab => (
            <NavTab
              key={tab.id}
              tab={tab}
              isActive={activeTab === tab.id}
              onClick={() => onTabChange(tab.id)}
            />
          ))}
        </div>

        {/* ── Center spacer — width matches FAB_AREA so left/right stay symmetric ── */}
        <div style={{ width: FAB_AREA, flexShrink: 0 }} />

        {/* ── Right tab group (flex: 1) ── */}
        <div style={{ flex: 1, display: "flex" }}>
          {RIGHT_TABS.map(tab => (
            <NavTab
              key={tab.id}
              tab={tab}
              isActive={activeTab === tab.id}
              onClick={() => onTabChange(tab.id)}
            />
          ))}
        </div>

        {/* ── FAB: absolutely pinned at horizontal center, never in flex flow ──
            top: 0 + translateY(-FAB_LIFT) lifts it so ~40% sits above the glass */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            transform: `translate(-50%, -${FAB_LIFT}px)`,
            pointerEvents: "all",
            zIndex: 10,
          }}
        >
          <motion.button
            whileTap={{ scale: 0.86 }}
            transition={{ type: "spring", stiffness: 500, damping: 24 }}
            style={{
              width: FAB_SIZE,
              height: FAB_SIZE,
              borderRadius: "50%",
              background: "linear-gradient(145deg, #FF3D9A 0%, #FF5FB0 50%, #FF7DC0 100%)",
              border: "2px solid rgba(255,255,255,0.90)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: [
                "0 0 0 1px rgba(255,61,154,0.18)",
                "0 3px 10px rgba(255,61,154,0.55)",
                "0 8px 24px rgba(255,61,154,0.28)",
                "0 16px 40px rgba(255,61,154,0.12)",
                "inset 0 1px 0 rgba(255,255,255,0.40)",
              ].join(", "),
              outline: "none",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <ScanLine size={20} color="white" strokeWidth={2.1} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

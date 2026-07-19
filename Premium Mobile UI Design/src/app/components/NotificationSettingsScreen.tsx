import { useState } from "react";
import { ChevronRight, Bell, Heart, Info, Volume2, Smartphone, Moon } from "lucide-react";
import { motion } from "motion/react";

interface NotificationSettingsScreenProps {
  onBack: () => void;
}

function Toggle({
  value,
  onChange,
  disabled = false,
}: {
  value: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div
      onClick={() => !disabled && onChange?.(!value)}
      style={{
        width: 51, height: 31,
        borderRadius: 16,
        background: value ? (disabled ? "#FFB3D3" : "#FF4FA3") : "#E5E7EB",
        position: "relative",
        cursor: disabled ? "default" : "pointer",
        transition: "background 0.25s",
        flexShrink: 0,
        boxShadow: value && !disabled ? "0 2px 8px rgba(255,79,163,0.35)" : "none",
        opacity: disabled ? 0.7 : 1,
      }}
    >
      <motion.div
        animate={{ x: value ? 22 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        style={{
          position: "absolute",
          top: 2,
          width: 27, height: 27,
          borderRadius: "50%",
          background: "white",
          boxShadow: "0 1px 4px rgba(0,0,0,0.20)",
        }}
      />
    </div>
  );
}

export function NotificationSettingsScreen({ onBack }: NotificationSettingsScreenProps) {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [matchNotif, setMatchNotif] = useState(true);
  const [sound, setSound] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [quietHours, setQuietHours] = useState(false);

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{
        position: "absolute",
        inset: 0,
        background: "#F5F5F8",
        zIndex: 10,
        overflowY: "auto",
        scrollbarWidth: "none",
      }}
    >
      {/* Header */}
      <div style={{ padding: "56px 20px 8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
          <button
            onClick={onBack}
            style={{
              width: 40, height: 40, borderRadius: "50%",
              background: "white",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
              flexShrink: 0,
            }}
          >
            <ChevronRight size={20} color="#1A1A1A" style={{ transform: "rotate(180deg)" }} />
          </button>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1A1A1A", margin: 0 }}>
            Cài đặt thông báo
          </h1>
        </div>
      </div>

      <div style={{ padding: "0 16px 40px" }}>

        {/* ── Push notification hero card ── */}
        <div style={{
          background: "#FFF0F7",
          borderRadius: 20,
          padding: "16px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 24,
          border: "1px solid rgba(255,79,163,0.10)",
        }}>
          <div style={{
            width: 52, height: 52,
            borderRadius: 16,
            background: "#FF4FA3",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 4px 12px rgba(255,79,163,0.35)",
          }}>
            <Bell size={26} color="white" fill="white" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A", margin: "0 0 3px" }}>
              Thông báo đẩy
            </p>
            <p style={{ fontSize: 13, color: "#9CA3AF", margin: 0 }}>
              Đang bật cho thiết bị này
            </p>
          </div>
          <Toggle value={pushEnabled} onChange={setPushEnabled} />
        </div>

        {/* ── LOẠI THÔNG BÁO ── */}
        <p style={{
          fontSize: 11, fontWeight: 700, color: "#9CA3AF",
          letterSpacing: 1.2, textTransform: "uppercase",
          margin: "0 4px 10px",
        }}>
          Loại thông báo
        </p>
        <div style={{
          background: "white",
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          border: "1px solid rgba(0,0,0,0.04)",
          marginBottom: 24,
        }}>
          {/* Match mới */}
          <div style={{
            padding: "14px 16px",
            display: "flex", alignItems: "center", gap: 14,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "#FFF0F7",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Heart size={22} color="#FF4FA3" fill="#FF4FA3" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A", margin: "0 0 2px" }}>
                Match mới
              </p>
              <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0 }}>
                Khi bạn và một bé thích nhau
              </p>
            </div>
            <Toggle value={matchNotif} onChange={setMatchNotif} />
          </div>

          <div style={{ height: 1, background: "#F3F4F6", marginLeft: 74 }} />

          {/* Thông báo hệ thống — locked */}
          <div style={{
            padding: "14px 16px",
            display: "flex", alignItems: "center", gap: 14,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "#EFF6FF",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Info size={22} color="#3B82F6" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A", margin: 0 }}>
                  Thông báo hệ thống
                </p>
                <span style={{ fontSize: 14 }}>🔒</span>
              </div>
              <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0, lineHeight: 1.4 }}>
                Cập nhật quan trọng — không thể tắt
              </p>
            </div>
            <Toggle value={true} disabled={true} />
          </div>
        </div>

        {/* ── ÂM THANH & CHẾ ĐỘ YÊN TĨNH ── */}
        <p style={{
          fontSize: 11, fontWeight: 700, color: "#9CA3AF",
          letterSpacing: 1.2, textTransform: "uppercase",
          margin: "0 4px 10px",
        }}>
          Âm thanh & Chế độ yên tĩnh
        </p>
        <div style={{
          background: "white",
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          border: "1px solid rgba(0,0,0,0.04)",
          marginBottom: 20,
        }}>
          {/* Âm thanh */}
          <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "#FFF0F7",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Volume2 size={22} color="#FF4FA3" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A", margin: 0 }}>Âm thanh</p>
            </div>
            <Toggle value={sound} onChange={setSound} />
          </div>

          <div style={{ height: 1, background: "#F3F4F6", marginLeft: 74 }} />

          {/* Rung */}
          <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "#ECFDF5",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Smartphone size={22} color="#10B981" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A", margin: 0 }}>Rung</p>
            </div>
            <Toggle value={vibration} onChange={setVibration} />
          </div>

          <div style={{ height: 1, background: "#F3F4F6", marginLeft: 74 }} />

          {/* Giờ yên tĩnh */}
          <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "#F0EDFF",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Moon size={22} color="#7C3AED" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A", margin: "0 0 2px" }}>
                Giờ yên tĩnh
              </p>
              <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0, lineHeight: 1.4 }}>
                Tắt âm & rung trong khung giờ đã chọn
              </p>
            </div>
            <Toggle value={quietHours} onChange={setQuietHours} />
          </div>
        </div>

        {/* Footer note */}
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 10,
          padding: "0 4px",
        }}>
          <Bell size={15} color="#9CA3AF" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0, lineHeight: 1.6 }}>
            Bạn có thể thay đổi quyền thông báo bất cứ lúc nào trong Cài đặt hệ thống của điện thoại.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

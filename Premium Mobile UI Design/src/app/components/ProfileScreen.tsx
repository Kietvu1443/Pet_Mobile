import { ChevronRight, User, PawPrint, Home, Settings, FileText, LogOut, Shield, AlertCircle, Edit3 } from "lucide-react";

interface ProfileScreenProps {
  onRole: () => void;
  onPersonalInfo: () => void;
  onLostPets: () => void;
  onSettings: () => void;
  onHousingEvaluation: () => void;
}

export function ProfileScreen({ onRole, onPersonalInfo, onLostPets, onSettings, onHousingEvaluation }: ProfileScreenProps) {
  const stats = [
    { count: 1, label: "Đã quét", sublabel: "tổng", color: "#1A1A1A" },
    { count: 0, label: "Match", sublabel: "chưa có", color: "#FF4FA3" },
    { count: 0, label: "Nhận nuôi", sublabel: "chưa có", color: "#34C759" },
  ];

  const menuItems = [
    {
      icon: User,
      iconBg: "#FFF0F7",
      iconColor: "#FF4FA3",
      label: "Thông tin cá nhân",
      sublabel: "Tên, email, ngày sinh",
      onPress: onPersonalInfo,
      badge: null,
    },
    {
      icon: PawPrint,
      iconBg: "#FFF0F7",
      iconColor: "#FF4FA3",
      label: "Vai trò",
      sublabel: "Đổi vai trò bất cứ lúc ...",
      onPress: onRole,
      badge: "Nhận nuôi",
    },
    {
      icon: Home,
      iconBg: "#E8F8EE",
      iconColor: "#34C759",
      label: "Đánh giá nhà ở",
      sublabel: "Cập nhật để tăng tỉ lệ duyệt",
      onPress: onHousingEvaluation,
      badge: null,
    },
    {
      icon: AlertCircle,
      iconBg: "#FFF8E8",
      iconColor: "#FFB340",
      label: "Thú cưng bị thất lạc",
      sublabel: "Xem và đăng báo lạc",
      onPress: onLostPets,
      badge: null,
    },
    {
      icon: Settings,
      iconBg: "#F0F0FF",
      iconColor: "#8B5CF6",
      label: "Cài đặt",
      sublabel: "Ngôn ngữ, thông báo, bảo mật",
      onPress: onSettings,
      badge: null,
    },
    {
      icon: FileText,
      iconBg: "#E8F8EE",
      iconColor: "#34C759",
      label: "Thông tin & Pháp lý",
      sublabel: "Điều khoản & chính sách bảo mật",
      onPress: () => {},
      badge: null,
    },
  ];

  return (
    <div style={{ padding: "58px 24px 0" }}>
      {/* Header */}
      <h1 style={{ fontSize: 32, fontWeight: 800, color: "#1A1A1A", margin: "0 0 24px" }}>Hồ sơ</h1>

      {/* Profile Hero Card */}
      <div style={{
        background: "linear-gradient(135deg, #FF4FA3 0%, #FF83C4 60%, #FFBBD8 100%)",
        borderRadius: 28, padding: "22px 20px",
        marginBottom: 20,
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 12px 36px rgba(255,79,163,0.35)",
      }}>
        {/* Decorative blobs */}
        <div style={{
          position: "absolute", top: -30, right: -30,
          width: 120, height: 120, borderRadius: "50%",
          background: "rgba(255,255,255,0.12)",
        }} />
        <div style={{
          position: "absolute", bottom: -20, right: 60,
          width: 80, height: 80, borderRadius: "50%",
          background: "rgba(255,255,255,0.08)",
        }} />

        <div style={{ display: "flex", alignItems: "center", gap: 16, position: "relative" }}>
          <div style={{ position: "relative" }}>
            <img
              src="https://images.unsplash.com/photo-1581562324420-eff2f5aaa4b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=200"
              alt="Avatar"
              style={{
                width: 68, height: 68, borderRadius: "50%",
                objectFit: "cover",
                border: "3px solid rgba(255,255,255,0.6)",
              }}
            />
            <button style={{
              position: "absolute", bottom: -2, right: -2,
              width: 26, height: 26, borderRadius: "50%",
              background: "white",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            }}>
              <Edit3 size={12} color="#FF4FA3" />
            </button>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: "white", fontSize: 22, fontWeight: 800, margin: "0 0 3px" }}>Kikiki</p>
            <p style={{ color: "rgba(255,255,255,0.82)", fontSize: 13, margin: "0 0 10px" }}>
              ezviz@gmail.com
            </p>
            <div style={{
              background: "rgba(255,255,255,0.22)",
              borderRadius: 20, padding: "5px 14px",
              display: "inline-flex", alignItems: "center", gap: 6,
              backdropFilter: "blur(8px)",
            }}>
              <Shield size={13} color="white" fill="rgba(255,255,255,0.5)" />
              <span style={{ color: "white", fontSize: 12, fontWeight: 600 }}>Hồ sơ đã hoàn tất</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
        {stats.map(s => (
          <div key={s.label} style={{
            flex: 1,
            background: "white",
            borderRadius: 22, padding: "16px 10px",
            textAlign: "center",
            boxShadow: "0 4px 16px rgba(0,0,0,0.07)",
          }}>
            <p style={{ fontSize: 26, fontWeight: 800, color: s.color, margin: "0 0 2px", lineHeight: 1 }}>{s.count}</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", margin: "0 0 2px" }}>{s.label}</p>
            <p style={{ fontSize: 11, color: "#AAAAAA", margin: 0 }}>{s.sublabel}</p>
          </div>
        ))}
      </div>

      {/* Account Section */}
      <p style={{ fontSize: 11, fontWeight: 800, color: "#AAAAAA", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>
        Tài khoản
      </p>
      <div style={{
        background: "white",
        borderRadius: 24,
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
        marginBottom: 16,
        border: "1px solid rgba(0,0,0,0.04)",
      }}>
        {menuItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={item.label}>
              <button onClick={item.onPress} style={{
                width: "100%",
                background: "none", border: "none", cursor: "pointer",
                padding: "15px 18px",
                display: "flex", alignItems: "center", gap: 14,
                textAlign: "left",
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 14,
                  background: item.iconBg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Icon size={20} color={item.iconColor} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A", margin: "0 0 2px" }}>{item.label}</p>
                  <p style={{ fontSize: 12, color: "#AAAAAA", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.sublabel}</p>
                </div>
                {item.badge && (
                  <span style={{
                    background: "linear-gradient(135deg, #FF4FA3, #FF83C4)",
                    color: "white",
                    borderRadius: 10, padding: "3px 10px",
                    fontSize: 12, fontWeight: 700,
                    marginRight: 4,
                    flexShrink: 0,
                  }}>{item.badge}</span>
                )}
                <ChevronRight size={16} color="#CCCCCC" />
              </button>
              {i < menuItems.length - 1 && (
                <div style={{ height: 1, background: "#F5F5F5", marginLeft: 74 }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Logout */}
      <button style={{
        width: "100%",
        background: "white",
        border: "none", cursor: "pointer",
        borderRadius: 22, padding: "16px",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
        marginBottom: 24,
      }}>
        <LogOut size={18} color="#FF4D4F" />
        <span style={{ fontSize: 15, fontWeight: 700, color: "#FF4D4F" }}>Đăng xuất</span>
      </button>

      {/* App version */}
      <p style={{ textAlign: "center", fontSize: 12, color: "#CCCCCC", marginBottom: 20 }}>Pet Match · Version 1.2.0</p>
    </div>
  );
}

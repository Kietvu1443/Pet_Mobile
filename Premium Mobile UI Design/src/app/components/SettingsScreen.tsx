import { ChevronRight, Languages, Bell, ShieldCheck, HelpCircle, FileText, Lock } from "lucide-react";
import { motion } from "motion/react";

interface SettingsScreenProps {
  onBack: () => void;
  onSecurityPrivacy: () => void;
  onNotifications: () => void;
}

type SettingsItem = {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  label: string;
  sublabel: string;
  onPress: () => void;
  rightContent?: React.ReactNode;
};

type Section = {
  title: string;
  items: SettingsItem[];
};

export function SettingsScreen({ onBack, onSecurityPrivacy, onNotifications }: SettingsScreenProps) {
  const sections: Section[] = [
    {
      title: "TÙY CHỌN",
      items: [
        {
          icon: Languages,
          iconBg: "#FFF8E8",
          iconColor: "#F59E0B",
          label: "Ngôn ngữ",
          sublabel: "🇻🇳 Tiếng Việt",
          onPress: () => {},
        },
        {
          icon: Bell,
          iconBg: "#EFF6FF",
          iconColor: "#3B82F6",
          label: "Thông báo",
          sublabel: "Đẩy, email, âm thanh",
          onPress: onNotifications,
        },
        {
          icon: ShieldCheck,
          iconBg: "#F0EDFF",
          iconColor: "#7C3AED",
          label: "Bảo mật & Quyền riêng tư",
          sublabel: "Mật khẩu, dữ liệu",
          onPress: onSecurityPrivacy,
        },
      ],
    },
    {
      title: "HỖ TRỢ",
      items: [
        {
          icon: HelpCircle,
          iconBg: "#EFF6FF",
          iconColor: "#3B82F6",
          label: "Hướng dẫn sử dụng",
          sublabel: "Xem lại hướng dẫn từng bước",
          onPress: () => {},
        },
      ],
    },
    {
      title: "THÔNG TIN & PHÁP LÝ",
      items: [
        {
          icon: FileText,
          iconBg: "#ECFDF5",
          iconColor: "#10B981",
          label: "Điều khoản sử dụng",
          sublabel: "Quy định sử dụng dịch vụ",
          onPress: () => {},
        },
        {
          icon: Lock,
          iconBg: "#FFF0F0",
          iconColor: "#EF4444",
          label: "Chính sách bảo mật",
          sublabel: "Cách dữ liệu được xử lý",
          onPress: () => {},
        },
      ],
    },
  ];

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
      <div style={{ padding: "56px 20px 8px", background: "#F5F5F8" }}>
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
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1A1A1A", margin: 0 }}>Cài đặt</h1>
        </div>
      </div>

      {/* Sections */}
      <div style={{ padding: "0 16px 32px" }}>
        {sections.map((section) => (
          <div key={section.title} style={{ marginBottom: 24 }}>
            {/* Section label */}
            <p style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#9CA3AF",
              letterSpacing: 1.2,
              textTransform: "uppercase",
              margin: "0 4px 10px",
            }}>
              {section.title}
            </p>

            {/* Items card */}
            <div style={{
              background: "white",
              borderRadius: 20,
              overflow: "hidden",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              border: "1px solid rgba(0,0,0,0.04)",
            }}>
              {section.items.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={item.label}>
                    <button
                      onClick={item.onPress}
                      style={{
                        width: "100%",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "14px 16px",
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        textAlign: "left",
                      }}
                    >
                      <div style={{
                        width: 44, height: 44,
                        borderRadius: 12,
                        background: item.iconBg,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                      }}>
                        <Icon size={22} color={item.iconColor} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A", margin: "0 0 2px" }}>
                          {item.label}
                        </p>
                        <p style={{ fontSize: 13, color: "#9CA3AF", margin: 0 }}>
                          {item.sublabel}
                        </p>
                      </div>
                      <ChevronRight size={17} color="#D1D5DB" />
                    </button>
                    {i < section.items.length - 1 && (
                      <div style={{ height: 1, background: "#F3F4F6", marginLeft: 74 }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* App version footer */}
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <p style={{ fontSize: 13, color: "#9CA3AF", margin: "0 0 4px" }}>v1.4.1 (15)</p>
          <p style={{ fontSize: 12, color: "#C4C4C4", margin: 0 }}>OTA: 019f59b5 · 2026-07-13</p>
        </div>
      </div>
    </motion.div>
  );
}

import { useState } from "react";
import { ChevronRight, Mail, KeyRound, User, Activity, Sparkles, Lock, FileText, Trash2, CheckCircle } from "lucide-react";
import { motion } from "motion/react";

interface SecurityPrivacyScreenProps {
  onBack: () => void;
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 51, height: 31,
        borderRadius: 16,
        background: value ? "#FF4FA3" : "#E5E7EB",
        position: "relative",
        cursor: "pointer",
        transition: "background 0.25s",
        flexShrink: 0,
        boxShadow: value ? "0 2px 8px rgba(255,79,163,0.35)" : "none",
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

export function SecurityPrivacyScreen({ onBack }: SecurityPrivacyScreenProps) {
  const [showProfile, setShowProfile] = useState(true);
  const [activeStatus, setActiveStatus] = useState(true);
  const [personalised, setPersonalised] = useState(true);

  const privacyItems = [
    {
      icon: User,
      iconBg: "#F0EDFF",
      iconColor: "#7C3AED",
      label: "Hiển thị hồ sơ",
      sublabel: "Cho phép người khác xem hồ sơ công khai của bạn",
      value: showProfile,
      onChange: setShowProfile,
    },
    {
      icon: Activity,
      iconBg: "#ECFDF5",
      iconColor: "#10B981",
      label: "Trạng thái hoạt động",
      sublabel: "Hiển thị khi bạn hoạt động gần đây",
      value: activeStatus,
      onChange: setActiveStatus,
    },
    {
      icon: Sparkles,
      iconBg: "#FFF0F7",
      iconColor: "#FF4FA3",
      label: "Cá nhân hoá gợi ý",
      sublabel: "Dùng hoạt động của bạn để gợi ý phù hợp hơn",
      value: personalised,
      onChange: setPersonalised,
    },
  ];

  const legalItems = [
    {
      icon: Lock,
      iconBg: "#F0EDFF",
      iconColor: "#7C3AED",
      label: "Chính sách bảo mật",
      onPress: () => {},
    },
    {
      icon: FileText,
      iconBg: "#ECFDF5",
      iconColor: "#10B981",
      label: "Điều khoản sử dụng",
      onPress: () => {},
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
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1A1A1A", margin: 0 }}>
            Bảo mật & Quyền riêng tư
          </h1>
        </div>
      </div>

      <div style={{ padding: "0 16px 40px" }}>

        {/* ── Account card (Email + Change Password) ── */}
        <div style={{
          background: "white",
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          border: "1px solid rgba(0,0,0,0.04)",
          marginBottom: 24,
        }}>
          {/* Email row */}
          <div style={{
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}>
            <div style={{
              width: 44, height: 44,
              borderRadius: 12,
              background: "#EFF6FF",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Mail size={22} color="#3B82F6" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A", margin: "0 0 2px" }}>Email</p>
              <p style={{
                fontSize: 13, color: "#9CA3AF", margin: 0,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                ezviztaiphat17@gm...
              </p>
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "#ECFDF5",
              borderRadius: 20, padding: "5px 12px",
              flexShrink: 0,
            }}>
              <CheckCircle size={13} color="#10B981" fill="#10B981" />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#10B981" }}>Đã xác minh</span>
            </div>
          </div>

          <div style={{ height: 1, background: "#F3F4F6", marginLeft: 74 }} />

          {/* Change password row */}
          <button style={{
            width: "100%",
            background: "none", border: "none", cursor: "pointer",
            padding: "14px 16px",
            display: "flex", alignItems: "center", gap: 14,
            textAlign: "left",
          }}>
            <div style={{
              width: 44, height: 44,
              borderRadius: 12,
              background: "#FFF0F7",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <KeyRound size={22} color="#FF4FA3" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A", margin: "0 0 2px" }}>Đổi mật khẩu</p>
              <p style={{ fontSize: 13, color: "#9CA3AF", margin: 0 }}>Gửi liên kết đặt lại qua email</p>
            </div>
            <ChevronRight size={17} color="#D1D5DB" />
          </button>
        </div>

        {/* ── QUYỀN RIÊNG TƯ ── */}
        <p style={{
          fontSize: 11, fontWeight: 700, color: "#9CA3AF",
          letterSpacing: 1.2, textTransform: "uppercase",
          margin: "0 4px 10px",
        }}>
          Quyền riêng tư
        </p>
        <div style={{
          background: "white",
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          border: "1px solid rgba(0,0,0,0.04)",
          marginBottom: 24,
        }}>
          {privacyItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={item.label}>
                <div style={{
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}>
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
                    <p style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A", margin: "0 0 3px" }}>
                      {item.label}
                    </p>
                    <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0, lineHeight: 1.4 }}>
                      {item.sublabel}
                    </p>
                  </div>
                  <Toggle value={item.value} onChange={item.onChange} />
                </div>
                {i < privacyItems.length - 1 && (
                  <div style={{ height: 1, background: "#F3F4F6", marginLeft: 74 }} />
                )}
              </div>
            );
          })}
        </div>

        {/* ── PHÁP LÝ ── */}
        <p style={{
          fontSize: 11, fontWeight: 700, color: "#9CA3AF",
          letterSpacing: 1.2, textTransform: "uppercase",
          margin: "0 4px 10px",
        }}>
          Pháp lý
        </p>
        <div style={{
          background: "white",
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          border: "1px solid rgba(0,0,0,0.04)",
          marginBottom: 24,
        }}>
          {legalItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={item.label}>
                <button
                  onClick={item.onPress}
                  style={{
                    width: "100%",
                    background: "none", border: "none", cursor: "pointer",
                    padding: "14px 16px",
                    display: "flex", alignItems: "center", gap: 14,
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
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A", margin: 0 }}>
                      {item.label}
                    </p>
                  </div>
                  <ChevronRight size={17} color="#D1D5DB" />
                </button>
                {i < legalItems.length - 1 && (
                  <div style={{ height: 1, background: "#F3F4F6", marginLeft: 74 }} />
                )}
              </div>
            );
          })}
        </div>

        {/* ── QUẢN LÝ DỮ LIỆU ── */}
        <p style={{
          fontSize: 11, fontWeight: 700, color: "#9CA3AF",
          letterSpacing: 1.2, textTransform: "uppercase",
          margin: "0 4px 10px",
        }}>
          Quản lý dữ liệu
        </p>
        <div style={{
          background: "white",
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          border: "1px solid rgba(0,0,0,0.04)",
        }}>
          <button style={{
            width: "100%",
            background: "none", border: "none", cursor: "pointer",
            padding: "14px 16px",
            display: "flex", alignItems: "center", gap: 14,
            textAlign: "left",
          }}>
            <div style={{
              width: 44, height: 44,
              borderRadius: 12,
              background: "#FFF0F0",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Trash2 size={22} color="#EF4444" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#EF4444", margin: "0 0 2px" }}>
                Xoá tài khoản
              </p>
              <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0, lineHeight: 1.4 }}>
                Hồ sơ và dữ liệu của bạn sẽ ngừng hoạt động ngay lập tức
              </p>
            </div>
            <ChevronRight size={17} color="#EF4444" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

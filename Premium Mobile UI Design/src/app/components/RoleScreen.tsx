import { useState } from "react";
import { ChevronLeft, PawPrint, Heart, Shield, Home, Check, Sparkles } from "lucide-react";
import { motion } from "motion/react";

interface RoleScreenProps {
  onBack: () => void;
}

export function RoleScreen({ onBack }: RoleScreenProps) {
  const [selectedRole, setSelectedRole] = useState<"adopt" | "lover">("adopt");

  const quickRoles = [
    {
      id: "adopt" as const,
      icon: PawPrint,
      iconBg: "#FFF0F7",
      iconColor: "#FF4FA3",
      title: "Nhận nuôi",
      desc: "Muốn mang một bé về làm bạn đồng hành.",
    },
    {
      id: "lover" as const,
      icon: Heart,
      iconBg: "#FFF8E8",
      iconColor: "#FFB340",
      title: "Yêu thú cưng",
      desc: "Lướt, thả tim, lưu yêu thích — chưa cần nhận nuôi.",
    },
  ];

  const verifiedRoles = [
    {
      icon: Shield,
      iconBg: "#EEF2FF",
      iconColor: "#3A7AFE",
      title: "Trại cứu hộ",
      subtitle: "Chưa đăng ký",
      desc: "Quản lý nhiều thú cưng, nhận yêu cầu nhận nuôi và xuất hiện trên bản đồ trại.",
      requirements: ["Giấy phép hoạt động hoặc CMND đại diện", "Ảnh thực tế của cơ sở", "Xét duyệt trong 1–3 ngày làm việc"],
    },
  ];

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{
        position: "absolute", inset: 0,
        background: "#FFF9FC",
        zIndex: 10,
        overflowY: "auto",
        scrollbarWidth: "none",
      }}
    >
      <div style={{ padding: "58px 24px 40px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
          <button onClick={onBack} style={{
            width: 44, height: 44, borderRadius: 14,
            background: "white", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
          }}>
            <ChevronLeft size={22} color="#1A1A1A" />
          </button>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1A1A1A", margin: 0 }}>Vai trò</h1>
        </div>

        {/* Current Role Card */}
        <div style={{
          background: "linear-gradient(135deg, #FFF0F7, #FFE4F0, #FFF8E8)",
          borderRadius: 24, padding: "20px",
          marginBottom: 24,
          border: "1.5px solid #FFBBD8",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16,
              background: "white",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 12px rgba(255,79,163,0.18)",
            }}>
              <PawPrint size={24} color="#FF4FA3" />
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#FF83C4", margin: "0 0 3px", textTransform: "uppercase", letterSpacing: 1 }}>Vai trò hiện tại</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: "#1A1A1A", margin: 0 }}>Nhận nuôi</p>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div style={{
          background: "white",
          borderRadius: 20, padding: "16px 18px",
          marginBottom: 28,
          display: "flex", alignItems: "flex-start", gap: 10,
          boxShadow: "0 3px 14px rgba(0,0,0,0.06)",
        }}>
          <Sparkles size={18} color="#FF4FA3" style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: 13, color: "#555", margin: 0, lineHeight: 1.6 }}>
            Hoàn thiện đánh giá nhà ở và hồ sơ để đăng ký nhận nuôi — trại cứu hộ cần thông tin đầy đủ để cân nhắc cho bạn nhận nuôi.
          </p>
        </div>
        <button style={{
          width: "100%",
          background: "white", border: "1.5px solid #EEE",
          borderRadius: 18, padding: "15px",
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          marginBottom: 28,
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        }}>
          <Home size={18} color="#1A1A1A" />
          <span style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A" }}>Đánh giá nhà ở</span>
        </button>

        {/* Quick Roles */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: "#AAAAAA", letterSpacing: 1.5, textTransform: "uppercase", margin: 0 }}>
            Đổi tức thì
          </p>
          <span style={{ fontSize: 12, color: "#34C759", fontWeight: 700 }}>✓ Không cần duyệt</span>
        </div>
        <div style={{
          background: "white",
          borderRadius: 22, overflow: "hidden",
          boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
          marginBottom: 10,
        }}>
          {quickRoles.map((role, i) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;
            return (
              <div key={role.id}>
                <button onClick={() => setSelectedRole(role.id)} style={{
                  width: "100%",
                  background: isSelected ? "#FFF9FC" : "white",
                  border: "none", cursor: "pointer",
                  padding: "18px 20px",
                  display: "flex", alignItems: "center", gap: 14,
                  textAlign: "left",
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 16,
                    background: role.iconBg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <Icon size={22} color={role.iconColor} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A", margin: "0 0 3px" }}>{role.title}</p>
                    <p style={{ fontSize: 13, color: "#888", margin: 0, lineHeight: 1.4 }}>{role.desc}</p>
                  </div>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: isSelected ? "#FF4FA3" : "#F0F0F0",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s",
                    flexShrink: 0,
                  }}>
                    {isSelected && <Check size={14} color="white" strokeWidth={3} />}
                  </div>
                </button>
                {i < quickRoles.length - 1 && <div style={{ height: 1, background: "#F5F5F5", marginLeft: 82 }} />}
              </div>
            );
          })}
        </div>
        <p style={{ fontSize: 13, color: "#AAAAAA", marginBottom: 28, paddingLeft: 4 }}>Bạn có thể đổi lại bất cứ lúc nào.</p>

        {/* Verified Roles */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: "#AAAAAA", letterSpacing: 1.5, textTransform: "uppercase", margin: 0 }}>
            Vai trò có xác minh
          </p>
          <span style={{ fontSize: 12, color: "#FFB340", fontWeight: 700 }}>🛡 Cần duyệt</span>
        </div>
        {verifiedRoles.map(role => {
          const Icon = role.icon;
          return (
            <div key={role.title} style={{
              background: "white",
              borderRadius: 22, padding: "20px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 16,
                  background: role.iconBg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Icon size={22} color={role.iconColor} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <p style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A", margin: 0 }}>{role.title}</p>
                    <span style={{ fontSize: 11, color: "#888", background: "#F0F0F0", borderRadius: 6, padding: "2px 8px", fontWeight: 500 }}>
                      {role.subtitle}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: "#888", margin: 0, lineHeight: 1.4 }}>{role.desc}</p>
                </div>
              </div>
              <div style={{ borderTop: "1px solid #F0F0F0", paddingTop: 14 }}>
                {role.requirements.map(req => (
                  <div key={req} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                    <Check size={14} color="#BBBBBB" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 13, color: "#777", lineHeight: 1.4 }}>{req}</span>
                  </div>
                ))}
              </div>
              <button style={{
                width: "100%",
                background: "linear-gradient(135deg, #3A7AFE, #6B9FFF)",
                border: "none", borderRadius: 16, padding: "14px",
                cursor: "pointer",
                color: "white", fontSize: 15, fontWeight: 700,
                boxShadow: "0 4px 16px rgba(58,122,254,0.35)",
                marginTop: 8,
              }}>
                Đăng ký trại cứu hộ
              </button>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

import { useState } from "react";
import { ChevronLeft, User, Calendar, Mail, Phone, Camera, Check } from "lucide-react";
import { motion } from "motion/react";

interface PersonalInfoScreenProps {
  onBack: () => void;
}

export function PersonalInfoScreen({ onBack }: PersonalInfoScreenProps) {
  const [name, setName] = useState("Kikiki");
  const [birthday] = useState("12/02/2005");
  const [gender, setGender] = useState<"male" | "female" | "other">("female");
  const [phone] = useState("+84 650855808888");
  const [email] = useState("ezviztaiphat17@gmail.com");

  const genderOptions = [
    { id: "male" as const, label: "♂ Nam" },
    { id: "female" as const, label: "♀ Nữ" },
    { id: "other" as const, label: "✦ Khác" },
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
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ flex: 1, padding: "58px 24px 0" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <button onClick={onBack} style={{
            width: 44, height: 44, borderRadius: 14,
            background: "white", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
          }}>
            <ChevronLeft size={22} color="#1A1A1A" />
          </button>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1A1A1A", margin: 0 }}>Thông tin cá nhân</h1>
        </div>

        {/* Profile completion banner */}
        <div style={{
          background: "#FFF0F7",
          borderRadius: 20, padding: "14px 18px",
          marginBottom: 28,
          display: "flex", alignItems: "center", gap: 12,
          border: "1.5px solid #FFBBD8",
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            background: "white",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 2px 8px rgba(255,79,163,0.18)",
          }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#FF4FA3" }}>100</span>
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#1A1A1A", margin: "0 0 2px" }}>Hồ sơ đã hoàn thiện</p>
            <p style={{ fontSize: 12, color: "#888", margin: 0 }}>Tuyệt vời! Hồ sơ của bạn đã đầy đủ thông tin.</p>
          </div>
        </div>

        {/* Avatar */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
          <div style={{ position: "relative", marginBottom: 10 }}>
            <div style={{
              width: 88, height: 88, borderRadius: "50%",
              border: "3px solid #FF4FA3",
              overflow: "hidden",
            }}>
              <img
                src="https://images.unsplash.com/photo-1581562324420-eff2f5aaa4b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=200"
                alt="Avatar"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <button style={{
              position: "absolute", bottom: -2, right: -2,
              width: 30, height: 30, borderRadius: "50%",
              background: "linear-gradient(135deg, #FF4FA3, #FF83C4)",
              border: "2px solid white",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(255,79,163,0.3)",
            }}>
              <Camera size={13} color="white" />
            </button>
          </div>
          <button style={{ background: "none", border: "none", cursor: "pointer", color: "#FF4FA3", fontSize: 14, fontWeight: 600 }}>
            Đổi ảnh đại diện
          </button>
        </div>

        {/* Form Section: Cá nhân */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: "#AAAAAA", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 16 }}>
            Cá nhân
          </p>

          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 8 }}>Họ và tên</p>
              <div style={{
                background: "white",
                borderRadius: 18,
                border: "1.5px solid #EEE",
                padding: "14px 16px",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <User size={16} color="#CCCCCC" />
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={{
                    flex: 1, background: "none", border: "none", outline: "none",
                    fontSize: 15, fontWeight: 600, color: "#1A1A1A",
                    fontFamily: "inherit",
                  }}
                />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 8 }}>Ngày sinh</p>
              <div style={{
                background: "white",
                borderRadius: 18,
                border: "1.5px solid #EEE",
                padding: "14px 16px",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <Calendar size={16} color="#CCCCCC" />
                <span style={{ fontSize: 15, fontWeight: 600, color: "#1A1A1A" }}>{birthday}</span>
              </div>
            </div>
          </div>

          {/* Gender */}
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 8 }}>Giới tính</p>
            <div style={{
              display: "flex",
              background: "white",
              borderRadius: 18,
              border: "1.5px solid #EEE",
              padding: 4,
              gap: 4,
            }}>
              {genderOptions.map(g => (
                <button key={g.id} onClick={() => setGender(g.id)} style={{
                  flex: 1,
                  background: gender === g.id ? "#FF4FA3" : "transparent",
                  border: "none", cursor: "pointer",
                  borderRadius: 14, padding: "12px 4px",
                  fontSize: 14, fontWeight: 700,
                  color: gender === g.id ? "white" : "#888",
                  transition: "all 0.2s",
                  boxShadow: gender === g.id ? "0 4px 12px rgba(255,79,163,0.30)" : "none",
                }}>{g.label}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Form Section: Liên hệ */}
        <div style={{ marginBottom: 36 }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: "#AAAAAA", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 16 }}>
            Liên hệ
          </p>

          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 8 }}>Email</p>
            <div style={{
              background: "white",
              borderRadius: 18,
              border: "1.5px solid #EEE",
              padding: "14px 16px",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <Mail size={16} color="#CCCCCC" />
              <span style={{
                flex: 1, fontSize: 15, fontWeight: 600, color: "#1A1A1A",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{email}</span>
              <span style={{
                background: "#E8F8EE", color: "#34C759",
                borderRadius: 8, padding: "3px 10px",
                fontSize: 11, fontWeight: 700,
                flexShrink: 0,
                display: "flex", alignItems: "center", gap: 4,
              }}>
                <Check size={10} strokeWidth={3} />
                Đã xác minh
              </span>
            </div>
          </div>

          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 8 }}>Số điện thoại</p>
            <div style={{
              background: "white",
              borderRadius: 18,
              border: "1.5px solid #EEE",
              padding: "14px 16px",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <Phone size={16} color="#CCCCCC" />
              <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: "#1A1A1A" }}>{phone}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Buttons */}
      <div style={{
        padding: "16px 24px 36px",
        background: "white",
        display: "flex", gap: 12,
        flexShrink: 0,
        boxShadow: "0 -4px 20px rgba(0,0,0,0.06)",
      }}>
        <button onClick={onBack} style={{
          flex: 1,
          background: "white", border: "2px solid #EEE",
          borderRadius: 18, padding: "16px",
          cursor: "pointer",
          fontSize: 16, fontWeight: 700, color: "#888",
        }}>Huỷ</button>
        <button style={{
          flex: 2,
          background: "linear-gradient(135deg, #FF4FA3, #FF83C4)",
          border: "none", borderRadius: 18, padding: "16px",
          cursor: "pointer",
          fontSize: 16, fontWeight: 700, color: "white",
          boxShadow: "0 6px 20px rgba(255,79,163,0.40)",
        }}>Lưu thay đổi</button>
      </div>
    </motion.div>
  );
}

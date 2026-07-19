import { ChevronLeft, Search, SlidersHorizontal, MapPin, Calendar, AlertTriangle } from "lucide-react";
import { motion } from "motion/react";

interface LostPetsScreenProps {
  onBack: () => void;
}

const LOST_PETS = [
  {
    id: "l1",
    name: "Xám ca",
    image: "https://images.unsplash.com/photo-1722863579619-5c75dc740b04?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400",
    location: "Phường Hiệp Bình, TP. Hồ Chí Minh",
    date: "15/01/2026",
    type: "lost" as const,
    breed: "Mèo mướp",
    color: "Xám",
    gender: "Đực",
  },
  {
    id: "l2",
    name: "Mèo vàng",
    image: "https://images.unsplash.com/photo-1698170928357-a4671f4ef461?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400",
    location: "P. Bình Thới, TP. Hồ Chí Minh",
    date: "12/01/2026",
    type: "found" as const,
    breed: "Mèo ta",
    color: "Vàng",
    gender: "Cái",
  },
  {
    id: "l3",
    name: "Chó Phốc",
    image: "https://images.unsplash.com/photo-1710962251981-6e1f63b7bb8e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400",
    location: "P. Hiệp Bình, TP. Hồ Chí Minh",
    date: "10/01/2026",
    type: "lost" as const,
    breed: "Chó phốc sóc",
    color: "Đen trắng",
    gender: "Đực",
  },
];

export function LostPetsScreen({ onBack }: LostPetsScreenProps) {
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
      {/* Header */}
      <div style={{ padding: "58px 24px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button onClick={onBack} style={{
              width: 44, height: 44, borderRadius: 14,
              background: "white", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
            }}>
              <ChevronLeft size={22} color="#1A1A1A" />
            </button>
            <div>
              <p style={{ color: "#FFB340", fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", margin: "0 0 3px" }}>
                Cùng tìm về nhà
              </p>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1A1A1A", margin: 0 }}>Tìm bé bị thất lạc</h1>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{
              width: 44, height: 44, borderRadius: 14,
              background: "white", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
            }}>
              <Search size={18} color="#888" />
            </button>
            <button style={{
              width: 44, height: 44, borderRadius: 14,
              background: "white", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
            }}>
              <SlidersHorizontal size={18} color="#888" />
            </button>
          </div>
        </div>

        {/* Alert Banner */}
        <div style={{
          background: "linear-gradient(135deg, #FFF8E8, #FFF3D0)",
          borderRadius: 20, padding: "16px 18px",
          border: "1.5px solid #FFE5A0",
          display: "flex", alignItems: "flex-start", gap: 12,
          marginBottom: 20,
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: "white",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 2px 8px rgba(255,179,64,0.2)",
          }}>
            <AlertTriangle size={18} color="#FFB340" />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#1A1A1A", margin: "0 0 4px" }}>
              {LOST_PETS.filter(p => p.type === "lost").length} bé đang thất lạc trong khu vực bạn
            </p>
            <p style={{ fontSize: 12, color: "#888", margin: 0, lineHeight: 1.5 }}>
              Nếu bạn gặp những bé này, hãy liên hệ với chủ nhân ngay nhé!
            </p>
          </div>
        </div>

        {/* Filter chips */}
        <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
          {["Tất cả", "Thất lạc", "Đã tìm thấy"].map((label, i) => (
            <button key={label} style={{
              background: i === 0 ? "#1A1A1A" : "white",
              border: "none", cursor: "pointer",
              borderRadius: 20, padding: "8px 16px",
              fontSize: 13, fontWeight: 600,
              color: i === 0 ? "white" : "#888",
              boxShadow: i !== 0 ? "0 2px 10px rgba(0,0,0,0.06)" : "none",
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Pet List */}
      <div style={{ padding: "0 24px 32px" }}>
        {LOST_PETS.map((pet, i) => (
          <motion.div
            key={pet.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            style={{
              background: "white",
              borderRadius: 22,
              padding: 18,
              marginBottom: 14,
              boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
              cursor: "pointer",
              border: `1.5px solid ${pet.type === "lost" ? "#FFECD0" : "#D6F5E0"}`,
              display: "flex", alignItems: "center", gap: 14,
            }}
          >
            <img
              src={pet.image}
              alt={pet.name}
              style={{ width: 80, height: 80, borderRadius: 18, objectFit: "cover", flexShrink: 0 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                <span style={{
                  background: pet.type === "lost" ? "#FFF4E0" : "#E8F8EE",
                  color: pet.type === "lost" ? "#FFB340" : "#34C759",
                  borderRadius: 8, padding: "3px 10px",
                  fontSize: 11, fontWeight: 700,
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                  {pet.type === "lost" ? "⚠ Thất lạc" : "✓ Đã tìm thấy"}
                </span>
              </div>
              <p style={{ fontSize: 17, fontWeight: 800, color: "#1A1A1A", margin: "0 0 5px" }}>{pet.name}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                <MapPin size={11} color="#888" style={{ flexShrink: 0 }} />
                <span style={{
                  fontSize: 12, color: "#888",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>{pet.location}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Calendar size={11} color="#BBBBBB" />
                <span style={{ fontSize: 12, color: "#BBBBBB" }}>{pet.date}</span>
              </div>
            </div>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: pet.type === "lost" ? "#FFB340" : "#34C759",
              flexShrink: 0,
              marginRight: 4,
            }} />
          </motion.div>
        ))}

        {/* Report button */}
        <button style={{
          width: "100%",
          background: "linear-gradient(135deg, #FFB340, #FF8C00)",
          border: "none", borderRadius: 20, padding: "18px",
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          boxShadow: "0 6px 20px rgba(255,179,64,0.38)",
          marginTop: 8,
        }}>
          <AlertTriangle size={20} color="white" />
          <span style={{ color: "white", fontSize: 16, fontWeight: 700 }}>Báo cáo thú cưng thất lạc</span>
        </button>
      </div>
    </motion.div>
  );
}

import { Bell, Plus, PawPrint, Camera, Heart, MapPin } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

interface MyPetsScreenProps {
  onAddPet: () => void;
}

type OwnPet = {
  id: string;
  name: string;
  breed: string;
  age: string;
  image: string;
  gender: string;
  weight: string;
  color: string;
  vaccinated: boolean;
};

const MY_PETS: OwnPet[] = [
  {
    id: "p1",
    name: "Kikiki",
    breed: "Bichon Frisé",
    age: "3 tuổi",
    image: "https://images.unsplash.com/photo-1581562324420-eff2f5aaa4b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=800",
    gender: "Cái",
    weight: "4.2 kg",
    color: "Trắng",
    vaccinated: true,
  },
];

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        background: "white",
        borderRadius: 28,
        padding: "52px 32px",
        textAlign: "center",
        boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
        border: "1.5px solid #F5E8F0",
        marginTop: 24,
      }}
    >
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        style={{
          width: 88, height: 88, borderRadius: "50%",
          background: "linear-gradient(135deg, #FFE8F4, #FFF5FA)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px",
        }}
      >
        <PawPrint size={38} color="#FF83C4" />
      </motion.div>
      <p style={{ color: "#FF4FA3", fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
        Bắt đầu nào
      </p>
      <p style={{ fontSize: 22, fontWeight: 800, color: "#1A1A1A", marginBottom: 12, lineHeight: 1.3 }}>
        Chưa có thú cưng nào
      </p>
      <p style={{ fontSize: 14, color: "#888", lineHeight: 1.6, marginBottom: 32, maxWidth: 260, margin: "0 auto 32px" }}>
        Thêm thú cưng của bạn để quản lý thông tin và theo dõi các bé dễ dàng hơn.
      </p>
      <button onClick={onAdd} style={{
        background: "linear-gradient(135deg, #FF4FA3, #FF83C4)",
        border: "none", cursor: "pointer",
        borderRadius: 18, padding: "16px 36px",
        color: "white", fontSize: 16, fontWeight: 700,
        boxShadow: "0 8px 24px rgba(255,79,163,0.38)",
        display: "flex", alignItems: "center", gap: 8, margin: "0 auto",
      }}>
        <Plus size={20} />
        Thêm thú cưng
      </button>
    </motion.div>
  );
}

function PetCard({ pet, onTap }: { pet: OwnPet; onTap: () => void }) {
  const [liked, setLiked] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onTap}
      style={{
        background: "white",
        borderRadius: 28,
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
        cursor: "pointer",
        marginBottom: 18,
        border: "1px solid rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ position: "relative", height: 240 }}>
        <img src={pet.image} alt={pet.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 55%)",
        }} />
        <div style={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 8 }}>
          <button
            onClick={(e) => { e.stopPropagation(); setLiked(l => !l); }}
            style={{
              width: 38, height: 38, borderRadius: "50%",
              background: "rgba(255,255,255,0.92)",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              backdropFilter: "blur(8px)",
            }}
          >
            <Heart size={18} color={liked ? "#FF4FA3" : "#888"} fill={liked ? "#FF4FA3" : "none"} />
          </button>
          <button
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 38, height: 38, borderRadius: "50%",
              background: "rgba(255,255,255,0.92)",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              backdropFilter: "blur(8px)",
            }}
          >
            <Camera size={18} color="#888" />
          </button>
        </div>
        {pet.vaccinated && (
          <div style={{
            position: "absolute", top: 16, left: 16,
            background: "rgba(52,199,89,0.95)",
            borderRadius: 10, padding: "4px 12px",
            backdropFilter: "blur(8px)",
          }}>
            <span style={{ color: "white", fontSize: 12, fontWeight: 600 }}>✓ Đã tiêm phòng</span>
          </div>
        )}
        <div style={{ position: "absolute", bottom: 16, left: 16 }}>
          <p style={{ color: "white", fontSize: 26, fontWeight: 800, margin: "0 0 4px" }}>{pet.name}</p>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, margin: 0 }}>{pet.breed} · {pet.age}</p>
        </div>
      </div>

      <div style={{ padding: "16px 20px 20px" }}>
        <div style={{ display: "flex", gap: 10 }}>
          {[
            { label: "Giới tính", value: pet.gender },
            { label: "Cân nặng", value: pet.weight },
            { label: "Màu lông", value: pet.color },
          ].map(item => (
            <div key={item.label} style={{
              flex: 1,
              background: "#FFF9FC",
              borderRadius: 14, padding: "10px 12px",
              textAlign: "center",
            }}>
              <p style={{ fontSize: 11, color: "#999", margin: "0 0 3px", fontWeight: 500 }}>{item.label}</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1A1A1A", margin: 0 }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function MyPetsScreen({ onAddPet }: MyPetsScreenProps) {
  const [hasPets] = useState(MY_PETS.length > 0);

  return (
    <div style={{ padding: "58px 24px 0" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <p style={{ color: "#FF4FA3", fontSize: 11, fontWeight: 800, letterSpacing: 1.5, margin: "0 0 4px", textTransform: "uppercase" }}>
            Xin chào, Kikiki 👋
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: "#1A1A1A", margin: 0, lineHeight: 1.1 }}>Thú cưng</h1>
            {hasPets && (
              <span style={{ fontSize: 16, color: "#888", marginTop: 4 }}>· {MY_PETS.length} bé</span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <button style={{
            width: 44, height: 44, borderRadius: 14,
            background: "white", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          }}>
            <Bell size={18} color="#888" />
          </button>
          <button onClick={onAddPet} style={{
            width: 44, height: 44, borderRadius: 14,
            background: "linear-gradient(135deg, #FF4FA3, #FF83C4)",
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 16px rgba(255,79,163,0.40)",
          }}>
            <Plus size={22} color="white" />
          </button>
        </div>
      </div>

      {!hasPets ? (
        <EmptyState onAdd={onAddPet} />
      ) : (
        <div>
          {MY_PETS.map(pet => (
            <PetCard key={pet.id} pet={pet} onTap={() => {}} />
          ))}

          {/* Add more */}
          <button onClick={onAddPet} style={{
            width: "100%",
            background: "white",
            border: "2px dashed #FFBBD8",
            borderRadius: 24, padding: "20px",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            marginBottom: 12,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "#FFF5FA",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Plus size={18} color="#FF4FA3" />
            </div>
            <span style={{ fontSize: 15, fontWeight: 600, color: "#FF4FA3" }}>Thêm thú cưng mới</span>
          </button>
        </div>
      )}

      {/* Nearby shelters section */}
      <div style={{ marginTop: hasPets ? 8 : 32, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1A", margin: 0 }}>Trại gần bạn</h3>
          <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#FF4FA3", fontWeight: 600 }}>Xem tất cả</button>
        </div>
        <div style={{ display: "flex", gap: 14, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 4 }}>
          {[
            { name: "Trại Bình Thới", pets: 24, image: "https://images.unsplash.com/photo-1629740067905-bd3f515aa739?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400", dist: "1.2 km" },
            { name: "Trại Q.9", pets: 18, image: "https://images.unsplash.com/photo-1606391276068-d82696ac76bc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400", dist: "2.5 km" },
            { name: "HCA Shelter", pets: 41, image: "https://images.unsplash.com/photo-1610112645245-36020fc0e128?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400", dist: "3.8 km" },
          ].map(s => (
            <div key={s.name} style={{
              flexShrink: 0, width: 155,
              background: "white", borderRadius: 22,
              overflow: "hidden",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              cursor: "pointer",
            }}>
              <div style={{ height: 100, position: "relative" }}>
                <img src={s.image} alt={s.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{
                  position: "absolute", bottom: 8, left: 8,
                  background: "rgba(0,0,0,0.5)",
                  borderRadius: 8, padding: "3px 8px",
                  backdropFilter: "blur(4px)",
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                  <MapPin size={10} color="white" />
                  <span style={{ color: "white", fontSize: 11, fontWeight: 600 }}>{s.dist}</span>
                </div>
              </div>
              <div style={{ padding: "12px 14px" }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#1A1A1A", margin: "0 0 3px" }}>{s.name}</p>
                <p style={{ fontSize: 12, color: "#888", margin: 0 }}>{s.pets} bé đang chờ</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

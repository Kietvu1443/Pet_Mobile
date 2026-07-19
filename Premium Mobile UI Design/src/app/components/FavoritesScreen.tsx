import { useState } from "react";
import { ChevronDown, Search, Heart, Star, X, MapPin, CheckCircle, RotateCcw } from "lucide-react";
import { motion } from "motion/react";
import type { Pet } from "../App";

interface FavoritesScreenProps {
  pets: Pet[];
  likedPets: string[];
  superLikedPets: string[];
  passedPets: string[];
  onPetDetail: (pet: Pet) => void;
}

export function FavoritesScreen({ pets, likedPets, superLikedPets, passedPets, onPetDetail }: FavoritesScreenProps) {
  const [filter, setFilter] = useState<"all" | "liked" | "superliked" | "passed">("all");

  const getPet = (id: string) => pets.find(p => p.id === id);
  const allSaved = [
    ...likedPets.map(id => ({ id, type: "liked" as const })),
    ...superLikedPets.map(id => ({ id, type: "superliked" as const })),
    ...passedPets.map(id => ({ id, type: "passed" as const })),
  ].filter(item => getPet(item.id));

  const filtered = allSaved.filter(item => {
    if (filter === "liked") return item.type === "liked";
    if (filter === "superliked") return item.type === "superliked";
    if (filter === "passed") return item.type === "passed";
    return true;
  });

  const statCards = [
    { icon: Heart, color: "#FF4FA3", bg: "#FFF0F7", count: likedPets.length, label: "Đã thích" },
    { icon: Star, color: "#3A7AFE", bg: "#F0F4FF", count: superLikedPets.length, label: "Siêu thích" },
    { icon: X, color: "#888", bg: "#F5F5F5", count: passedPets.length, label: "Bỏ qua" },
  ];

  return (
    <div style={{ padding: "58px 24px 0" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <p style={{ color: "#FF4FA3", fontSize: 11, fontWeight: 800, letterSpacing: 1.5, margin: "0 0 4px", textTransform: "uppercase" }}>Yêu thích</p>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: "#1A1A1A", margin: 0, lineHeight: 1.1 }}>Đã lưu</h1>
            <span style={{ fontSize: 16, color: "#888", marginTop: 4 }}>·· {allSaved.length} bé</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <button style={{
            width: 44, height: 44, borderRadius: 14,
            background: "white", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          }}>
            <ChevronDown size={18} color="#888" />
          </button>
          <button style={{
            width: 44, height: 44, borderRadius: 14,
            background: "white", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          }}>
            <Search size={18} color="#888" />
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        {statCards.map(({ icon: Icon, color, bg, count, label }) => (
          <div key={label} style={{
            flex: 1,
            background: "white",
            borderRadius: 22, padding: "16px 12px",
            textAlign: "center",
            boxShadow: "0 4px 16px rgba(0,0,0,0.07)",
            border: "1px solid rgba(0,0,0,0.04)",
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: "50%",
              background: bg,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 10px",
            }}>
              <Icon size={18} color={color} fill={label !== "Bỏ qua" ? color : undefined} />
            </div>
            <p style={{ fontSize: 22, fontWeight: 800, color, margin: "0 0 3px" }}>{count}</p>
            <p style={{ fontSize: 11, color: "#888", fontWeight: 500, margin: 0 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Filter Chips */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 2 }}>
        {([
          { id: "all", label: "Đã lưu", count: allSaved.length },
          { id: "liked", label: "Đã thích", count: likedPets.length, icon: Heart, iconColor: "#FF4FA3" },
          { id: "superliked", label: "Siêu thích", count: superLikedPets.length, icon: Star, iconColor: "#3A7AFE" },
          { id: "passed", label: "Bỏ qua", count: passedPets.length },
        ] as const).map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            flexShrink: 0,
            background: filter === f.id ? "#1A1A1A" : "white",
            border: "none", cursor: "pointer",
            borderRadius: 20, padding: "8px 16px",
            display: "flex", alignItems: "center", gap: 6,
            boxShadow: filter !== f.id ? "0 2px 10px rgba(0,0,0,0.06)" : "none",
            transition: "all 0.2s",
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: filter === f.id ? "white" : "#1A1A1A" }}>{f.label}</span>
            {f.count > 0 && (
              <span style={{
                background: filter === f.id ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.07)",
                color: filter === f.id ? "white" : "#555",
                borderRadius: 10, padding: "1px 7px",
                fontSize: 12, fontWeight: 700,
              }}>{f.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Pet Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 24px" }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: "#FFF5FA",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
          }}>
            <Heart size={34} color="#FF83C4" />
          </div>
          <p style={{ fontSize: 20, fontWeight: 700, color: "#1A1A1A", marginBottom: 10, margin: "0 0 10px" }}>Chưa có gì</p>
          <p style={{ fontSize: 14, color: "#888", margin: 0, lineHeight: 1.5 }}>
            Thích các bé thú cưng để lưu vào đây nhé!
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, paddingBottom: 12 }}>
          {filtered.map(({ id, type }) => {
            const pet = getPet(id);
            if (!pet) return null;
            return (
              <FavoriteCard
                key={id}
                pet={pet}
                type={type}
                onTap={() => onPetDetail(pet)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function FavoriteCard({ pet, type, onTap }: {
  pet: Pet;
  type: "liked" | "superliked" | "passed";
  onTap: () => void;
}) {
  const badgeConfig = {
    liked: { label: "♥ Thích", bg: "#FF4FA3", color: "white" },
    superliked: { label: "★ Siêu thích", bg: "#3A7AFE", color: "white" },
    passed: { label: "× Đã bỏ qua", bg: "rgba(0,0,0,0.55)", color: "white" },
  }[type];

  const date = "13/07";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        background: "white",
        borderRadius: 22,
        overflow: "hidden",
        boxShadow: "0 6px 20px rgba(0,0,0,0.09)",
        cursor: "pointer",
        border: "1px solid rgba(0,0,0,0.04)",
      }}
      onClick={onTap}
    >
      {/* Image */}
      <div style={{ position: "relative", height: 160 }}>
        <img src={pet.image} alt={pet.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 50%)",
        }} />

        {/* Type badge */}
        <div style={{
          position: "absolute", top: 10, left: 10,
          background: badgeConfig.bg,
          borderRadius: 8, padding: "4px 8px",
          backdropFilter: "blur(6px)",
        }}>
          <span style={{ color: badgeConfig.color, fontSize: 11, fontWeight: 700 }}>{badgeConfig.label}</span>
        </div>

        {/* Date */}
        <div style={{
          position: "absolute", top: 10, right: 10,
          background: "rgba(0,0,0,0.45)",
          borderRadius: 8, padding: "4px 8px",
          backdropFilter: "blur(6px)",
        }}>
          <span style={{ color: "white", fontSize: 11, fontWeight: 600 }}>{date}</span>
        </div>

        {/* Pet name at bottom */}
        <div style={{ position: "absolute", bottom: 10, left: 10, right: 10 }}>
          <p style={{ color: "white", fontSize: 16, fontWeight: 800, margin: "0 0 2px" }}>{pet.name}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, margin: 0 }}>{pet.breed} · {pet.age}</p>
            {pet.verified && (
              <CheckCircle size={10} color="#34C759" fill="#34C759" />
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: "10px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 10 }}>
          <MapPin size={11} color="#888" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {pet.location.split(",")[0]}
          </span>
        </div>
        {type === "passed" ? (
          <button
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              background: "#1A1A1A",
              border: "none", cursor: "pointer",
              borderRadius: 12, padding: "9px",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <RotateCcw size={13} color="white" />
            <span style={{ color: "white", fontSize: 12, fontWeight: 700 }}>Khôi phục</span>
          </button>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={(e) => e.stopPropagation()}
              style={{
                flex: 1,
                background: "#F5F5F5",
                border: "none", cursor: "pointer",
                borderRadius: 12, padding: "9px",
                fontSize: 12, fontWeight: 600, color: "#1A1A1A",
              }}
            >
              Chi tiết
            </button>
            <button
              onClick={(e) => e.stopPropagation()}
              style={{
                width: 36, height: 36, borderRadius: 12,
                background: "#FFF0F7",
                border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Heart size={15} color="#FF4FA3" fill="#FF4FA3" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

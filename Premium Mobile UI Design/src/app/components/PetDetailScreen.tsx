import { useState } from "react";
import { ChevronLeft, Share2, CheckCircle, Heart, MapPin, Star, ChevronRight, Shield } from "lucide-react";
import { motion } from "motion/react";
import type { Pet } from "../App";

interface PetDetailScreenProps {
  pet: Pet;
  onBack: () => void;
}

export function PetDetailScreen({ pet, onBack }: PetDetailScreenProps) {
  const [currentImg, setCurrentImg] = useState(0);
  const [liked, setLiked] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [applied, setApplied] = useState(false);

  const allTraits = [
    ...pet.traits,
    "Trầm tính", "Độc lập",
  ].slice(0, 5);

  const healthItems = [
    { label: "Tiêm phòng", value: "Đã tiêm đủ mũi", ok: true },
    { label: "Triệt sản", value: "Chưa triệt sản", ok: false },
    { label: "Chip định vị", value: "Đã gắn chip", ok: true },
    { label: "Khám sức khỏe", value: "06/2026", ok: true },
  ];

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{
        position: "absolute", inset: 0,
        background: "#FFF9FC",
        zIndex: 10,
        overflowY: "auto",
        scrollbarWidth: "none",
      }}
    >
      {/* Image Gallery */}
      <div style={{ position: "relative", height: 420, flexShrink: 0 }}>
        <img
          src={pet.images[currentImg]}
          alt={pet.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 35%, transparent 60%, rgba(0,0,0,0.15) 100%)",
        }} />

        {/* Nav buttons */}
        <button onClick={onBack} style={{
          position: "absolute", top: 56, left: 20,
          width: 44, height: 44, borderRadius: "50%",
          background: "rgba(255,255,255,0.92)",
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          backdropFilter: "blur(8px)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
        }}>
          <ChevronLeft size={22} color="#1A1A1A" />
        </button>

        {/* Verified badge */}
        {pet.verified && (
          <div style={{
            position: "absolute", top: 56, left: "50%", transform: "translateX(-50%)",
            background: "rgba(255,255,255,0.95)",
            borderRadius: 20, padding: "7px 16px",
            display: "flex", alignItems: "center", gap: 6,
            backdropFilter: "blur(12px)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.10)",
          }}>
            <CheckCircle size={15} color="#FF4FA3" fill="#FF4FA3" />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#FF4FA3" }}>Đã xác minh</span>
          </div>
        )}

        <button style={{
          position: "absolute", top: 56, right: 20,
          width: 44, height: 44, borderRadius: "50%",
          background: "rgba(255,255,255,0.92)",
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          backdropFilter: "blur(8px)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
        }}>
          <Share2 size={20} color="#1A1A1A" />
        </button>

        {/* Photo counter */}
        <div style={{
          position: "absolute", top: 120, right: 20,
          background: "rgba(0,0,0,0.50)",
          borderRadius: 10, padding: "5px 10px",
          backdropFilter: "blur(6px)",
        }}>
          <span style={{ color: "white", fontSize: 12, fontWeight: 600 }}>{currentImg + 1} / {pet.images.length}</span>
        </div>

        {/* Dot indicators */}
        <div style={{
          position: "absolute", bottom: 18, left: "50%", transform: "translateX(-50%)",
          display: "flex", gap: 6,
        }}>
          {pet.images.map((_, i) => (
            <div
              key={i}
              onClick={() => setCurrentImg(i)}
              style={{
                width: i === currentImg ? 24 : 7,
                height: 7, borderRadius: 4,
                background: i === currentImg ? "white" : "rgba(255,255,255,0.5)",
                cursor: "pointer",
                transition: "all 0.3s",
              }}
            />
          ))}
        </div>
      </div>

      {/* Thumbnail Strip */}
      <div style={{ display: "flex", gap: 10, padding: "16px 20px", background: "white" }}>
        {pet.images.map((img, i) => (
          <button key={i} onClick={() => setCurrentImg(i)} style={{
            width: 80, height: 80, borderRadius: 16,
            overflow: "hidden", flexShrink: 0,
            border: i === currentImg ? "2.5px solid #FF4FA3" : "2.5px solid transparent",
            padding: 0, cursor: "pointer",
          }}>
            <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "20px 24px 120px", background: "#FFF9FC" }}>
        {/* Name & Basic Info */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <h1 style={{ fontSize: 34, fontWeight: 800, color: "#1A1A1A", margin: 0 }}>{pet.name}</h1>
              <span style={{ fontSize: 20, color: "#888", fontWeight: 400 }}>{pet.age}</span>
            </div>
            <p style={{ fontSize: 15, color: "#777", margin: "0 0 6px" }}>
              {pet.breed} · {pet.gender === "male" ? "Đực" : "Cái"}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <MapPin size={13} color="#888" />
              <span style={{ fontSize: 13, color: "#888" }}>{pet.location}</span>
            </div>
          </div>
          <button
            onClick={() => setLiked(l => !l)}
            style={{
              width: 48, height: 48, borderRadius: "50%",
              background: liked ? "#FFF0F7" : "#F5F5F5",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s",
              boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
            }}
          >
            <Heart size={22} color={liked ? "#FF4FA3" : "#888"} fill={liked ? "#FF4FA3" : "none"} />
          </button>
        </div>

        {/* Likes count */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 20 }}>
          <Heart size={14} color="#FF4FA3" fill="#FF4FA3" />
          <span style={{ fontSize: 13, color: "#888" }}>{pet.likes + (liked ? 1 : 0)} người thích</span>
        </div>

        {/* Traits */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
          {allTraits.map(t => (
            <span key={t} style={{
              background: "#FFF0F7",
              borderRadius: 20, padding: "7px 16px",
              color: "#FF4FA3", fontSize: 13, fontWeight: 600,
              border: "1px solid #FFD6EA",
            }}>{t}</span>
          ))}
        </div>

        {/* Description */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1A", margin: "0 0 10px" }}>Mô tả</h3>
          <p style={{
            fontSize: 15, color: "#555", lineHeight: 1.7, margin: 0,
            overflow: showFullDesc ? "visible" : "hidden",
            display: showFullDesc ? "block" : "-webkit-box",
            WebkitLineClamp: showFullDesc ? "none" : 3,
            WebkitBoxOrient: showFullDesc ? "horizontal" : "vertical",
          } as React.CSSProperties}>
            {pet.description ?? `${pet.name} là một bé thú cưng đáng yêu đang tìm kiếm một gia đình yêu thương. Bé rất thân thiện, dễ thương và luôn vui vẻ. Hãy cho bé một mái ấm nhé!`}
          </p>
          {!showFullDesc && (
            <button
              onClick={() => setShowFullDesc(true)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#FF4FA3", fontSize: 14, fontWeight: 600, padding: "6px 0 0" }}
            >
              Xem thêm ↓
            </button>
          )}
        </div>

        {/* Health Cards */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1A", margin: "0 0 14px" }}>Sức khỏe</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {healthItems.map(item => (
              <div key={item.label} style={{
                background: "white",
                borderRadius: 18, padding: "14px 16px",
                boxShadow: "0 3px 12px rgba(0,0,0,0.07)",
                border: "1px solid rgba(0,0,0,0.04)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: item.ok ? "#34C759" : "#FFB340",
                  }} />
                  <span style={{ fontSize: 11, color: "#888", fontWeight: 600 }}>{item.label}</span>
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", margin: 0 }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Shelter Info */}
        {pet.shelter && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1A", margin: "0 0 14px" }}>Trại cứu hộ</h3>
            <div style={{
              background: "white",
              borderRadius: 22, padding: "18px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.07)",
              display: "flex", alignItems: "center", gap: 14, cursor: "pointer",
              border: "1px solid rgba(0,0,0,0.04)",
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 16,
                background: "linear-gradient(135deg, #E8F0FF, #C5D8FF)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <Shield size={24} color="#3A7AFE" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A", margin: "0 0 3px" }}>{pet.shelter}</p>
                  <CheckCircle size={14} color="#34C759" fill="#34C759" />
                </div>
                <p style={{ fontSize: 13, color: "#888", margin: 0 }}>
                  <Star size={11} color="#FFB340" fill="#FFB340" style={{ marginRight: 3 }} />
                  4.8 · {Math.floor(Math.random() * 30 + 15)} thú cưng
                </p>
              </div>
              <ChevronRight size={18} color="#CCCCCC" />
            </div>
          </div>
        )}

        {/* Report */}
        <button style={{
          background: "none", border: "none", cursor: "pointer",
          padding: "12px 0",
          width: "100%", textAlign: "center",
        }}>
          <span style={{ fontSize: 13, color: "#BBBBBB" }}>⚑ Báo cáo tin đăng này</span>
        </button>
      </div>

      {/* Sticky CTA */}
      <div style={{
        position: "sticky", bottom: 0,
        width: "100%",
        padding: "16px 24px 32px",
        background: "linear-gradient(to top, #FFF9FC 85%, transparent)",
        zIndex: 20,
        marginTop: -8,
      }}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setApplied(a => !a)}
          style={{
            width: "100%",
            background: applied
              ? "linear-gradient(135deg, #34C759, #30B050)"
              : "linear-gradient(135deg, #FF4FA3, #FF83C4)",
            border: "none", cursor: "pointer",
            borderRadius: 18, padding: "18px",
            color: "white", fontSize: 17, fontWeight: 700,
            boxShadow: applied
              ? "0 8px 24px rgba(52,199,89,0.40)"
              : "0 8px 28px rgba(255,79,163,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            transition: "all 0.3s",
          }}
        >
          <Star size={20} color="white" fill="white" />
          {applied ? "✓ Đã đăng ký nhận nuôi" : "Đăng ký nhận nuôi"}
        </motion.button>
      </div>
    </motion.div>
  );
}

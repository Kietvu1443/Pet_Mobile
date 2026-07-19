import { useState, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { CheckCircle, MapPin, X, Star, Heart, Sparkles, RotateCcw, SlidersHorizontal, Bell, Clock } from "lucide-react";
import type { Pet } from "../App";

interface AdoptScreenProps {
  pets: Pet[];
  likedPets: string[];
  superLikedPets: string[];
  passedPets: string[];
  onLike: (id: string) => void;
  onSuperLike: (id: string) => void;
  onPass: (id: string) => void;
  onPetDetail: (pet: Pet) => void;
}

interface SwipeCardProps {
  pet: Pet;
  onSwipeComplete: (direction: "like" | "pass" | "superlike") => void;
  onPetDetail: () => void;
  triggerSwipe?: "like" | "pass" | "superlike" | null;
  onTriggerDone?: () => void;
  isBehind?: boolean;
}

function SwipeCard({ pet, onSwipeComplete, onPetDetail, triggerSwipe, onTriggerDone, isBehind }: SwipeCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-22, 0, 22]);
  const likeOpacity = useTransform(x, [30, 110], [0, 1]);
  const nopeOpacity = useTransform(x, [-110, -30], [1, 0]);
  const superLikeOpacity = useTransform(y, [-110, -40], [1, 0]);
  const hasTriggered = useRef(false);

  if (triggerSwipe && !hasTriggered.current) {
    hasTriggered.current = true;
    const target = triggerSwipe === "like" ? 600 : triggerSwipe === "pass" ? -600 : 0;
    const yTarget = triggerSwipe === "superlike" ? -600 : 0;
    animate(x, target, { duration: 0.35, ease: "easeIn" });
    animate(y, yTarget, { duration: 0.35, ease: "easeIn" });
    setTimeout(() => {
      onSwipeComplete(triggerSwipe);
      onTriggerDone?.();
    }, 350);
  }

  if (isBehind) {
    return (
      <motion.div
        style={{
          position: "absolute", inset: 0,
          scale: 0.94,
          translateY: 14,
          borderRadius: 28, overflow: "hidden",
          boxShadow: "0 12px 40px rgba(0,0,0,0.10)",
          zIndex: 1,
        }}
      >
        <img src={pet.image} alt={pet.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)" }} />
      </motion.div>
    );
  }

  return (
    <motion.div
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.9}
      style={{ x, y, rotate, position: "absolute", inset: 0, zIndex: 2, cursor: "grab" }}
      whileDrag={{ cursor: "grabbing" }}
      onDragEnd={(_, info) => {
        const absX = Math.abs(info.offset.x);
        const absY = Math.abs(info.offset.y);
        if (info.offset.x > 100 && absX > absY) {
          animate(x, 600, { duration: 0.3, ease: "easeOut" });
          setTimeout(() => onSwipeComplete("like"), 300);
        } else if (info.offset.x < -100 && absX > absY) {
          animate(x, -600, { duration: 0.3, ease: "easeOut" });
          setTimeout(() => onSwipeComplete("pass"), 300);
        } else if (info.offset.y < -100 && absY > absX) {
          animate(y, -600, { duration: 0.3, ease: "easeOut" });
          setTimeout(() => onSwipeComplete("superlike"), 300);
        } else {
          animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
          animate(y, 0, { type: "spring", stiffness: 400, damping: 30 });
        }
      }}
      onClick={onPetDetail}
    >
      <div style={{ width: "100%", height: "100%", borderRadius: 28, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>
        <img
          src={pet.image}
          alt={pet.name}
          style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }}
          draggable={false}
        />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.15) 45%, transparent 65%)",
        }} />

        {/* Verified badge */}
        {pet.verified && (
          <div style={{
            position: "absolute", top: 18, left: "50%", transform: "translateX(-50%)",
            background: "rgba(255,255,255,0.95)",
            borderRadius: 20, padding: "6px 16px",
            display: "flex", alignItems: "center", gap: 6,
            backdropFilter: "blur(12px)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
          }}>
            <CheckCircle size={14} color="#FF4FA3" fill="#FF4FA3" />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#FF4FA3" }}>Đã xác minh</span>
          </div>
        )}

        {/* THÍCH stamp */}
        <motion.div style={{
          position: "absolute", top: 52, left: 20,
          opacity: likeOpacity,
          border: "3px solid #34C759",
          borderRadius: 10, padding: "5px 14px",
          rotate: -16,
          pointerEvents: "none",
        }}>
          <span style={{ color: "#34C759", fontSize: 26, fontWeight: 900, letterSpacing: 2 }}>THÍCH</span>
        </motion.div>

        {/* BỎ QUA stamp */}
        <motion.div style={{
          position: "absolute", top: 52, right: 20,
          opacity: nopeOpacity,
          border: "3px solid #FF4D4F",
          borderRadius: 10, padding: "5px 14px",
          rotate: 16,
          pointerEvents: "none",
        }}>
          <span style={{ color: "#FF4D4F", fontSize: 26, fontWeight: 900, letterSpacing: 2 }}>BỎ QUA</span>
        </motion.div>

        {/* SIÊU THÍCH stamp */}
        <motion.div style={{
          position: "absolute", top: "40%", left: "50%",
          marginLeft: "-80px",
          opacity: superLikeOpacity,
          border: "3px solid #3A7AFE",
          borderRadius: 10, padding: "5px 14px",
          pointerEvents: "none",
        }}>
          <span style={{ color: "#3A7AFE", fontSize: 22, fontWeight: 900, letterSpacing: 1 }}>SIÊU THÍCH</span>
        </motion.div>

        {/* Pet info overlay */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "24px 22px 26px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginBottom: 8 }}>
            <span style={{ color: "white", fontSize: 34, fontWeight: 800, lineHeight: 1 }}>{pet.name}</span>
            <span style={{ color: "rgba(255,255,255,0.88)", fontSize: 22, fontWeight: 400, paddingBottom: 3 }}>{pet.age}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
            <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 14 }}>🐾 {pet.breed}</span>
            <span style={{ color: "rgba(255,255,255,0.5)" }}>·</span>
            <MapPin size={12} color="rgba(255,255,255,0.75)" style={{ flexShrink: 0 }} />
            <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>{pet.location}</span>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {pet.traits.slice(0, 3).map(t => (
              <div key={t} style={{
                background: "rgba(255,255,255,0.18)",
                backdropFilter: "blur(10px)",
                borderRadius: 20, padding: "5px 14px",
                color: "white", fontSize: 13, fontWeight: 500,
                border: "1px solid rgba(255,255,255,0.25)",
              }}>{t}</div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ConnectedTab({ pets, likedPets, superLikedPets, onPetDetail }: {
  pets: Pet[];
  likedPets: string[];
  superLikedPets: string[];
  onPetDetail: (p: Pet) => void;
}) {
  const [filter, setFilter] = useState("all");
  const connected = pets.filter(p => likedPets.includes(p.id) || superLikedPets.includes(p.id));

  const filters = [
    { id: "all", label: "Tất cả", count: connected.length },
    { id: "pending", label: "Chờ duyệt", count: connected.filter(p => likedPets.includes(p.id)).length },
    { id: "contact", label: "Chờ liên hệ", count: connected.filter(p => superLikedPets.includes(p.id)).length },
  ];

  return (
    <div style={{ paddingTop: 16 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {filters.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            background: filter === f.id ? "#1A1A1A" : "white",
            border: "none", cursor: "pointer",
            borderRadius: 20, padding: "8px 14px",
            display: "flex", alignItems: "center", gap: 6,
            boxShadow: filter !== f.id ? "0 2px 10px rgba(0,0,0,0.06)" : "none",
            transition: "all 0.2s",
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: filter === f.id ? "white" : "#1A1A1A" }}>{f.label}</span>
            {f.count > 0 && (
              <span style={{
                background: filter === f.id ? "rgba(255,255,255,0.22)" : "#FF4FA3",
                color: "white", borderRadius: "50%",
                width: 20, height: 20,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700,
              }}>{f.count}</span>
            )}
          </button>
        ))}
      </div>

      {connected.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 24px" }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "#FFF5FA",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
          }}>
            <Heart size={30} color="#FF83C4" />
          </div>
          <p style={{ fontSize: 20, fontWeight: 700, color: "#1A1A1A", marginBottom: 8, margin: "0 0 8px" }}>Chưa kết nối</p>
          <p style={{ fontSize: 14, color: "#777", margin: 0 }}>Thích một bé để bắt đầu kết nối!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {connected.map(pet => (
            <div key={pet.id} onClick={() => onPetDetail(pet)} style={{
              background: "white", borderRadius: 22, padding: 18,
              boxShadow: "0 4px 20px rgba(0,0,0,0.07)", cursor: "pointer",
              border: "1px solid rgba(0,0,0,0.04)",
            }}>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <img src={pet.image} alt={pet.name} style={{ width: 76, height: 76, borderRadius: 18, objectFit: "cover", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 17, fontWeight: 700, color: "#1A1A1A" }}>{pet.name}</span>
                    <span style={{
                      background: "#FFF8E8", color: "#FFB340",
                      borderRadius: 8, padding: "2px 10px",
                      fontSize: 12, fontWeight: 600,
                    }}>Chờ duyệt</span>
                    <span style={{ marginLeft: "auto", fontSize: 12, color: "#AAAAAA" }}>05/07</span>
                  </div>
                  <p style={{ fontSize: 13, color: "#888", margin: "0 0 5px" }}>
                    {pet.breed} · {pet.age} · {pet.gender === "male" ? "Đực" : "Cái"}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 12, color: "#888" }}>🛡️ {pet.shelter}</span>
                    {pet.verified && <span style={{ color: "#FF4FA3", fontSize: 13 }}>✓</span>}
                  </div>
                </div>
              </div>
              <div style={{
                marginTop: 14, background: "#FFFBF0",
                borderRadius: 14, padding: "12px 14px",
                display: "flex", alignItems: "center", gap: 12,
                border: "1px solid #FFEBB0",
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: "0 2px 8px rgba(255,179,64,0.2)",
                }}>
                  <Clock size={16} color="#FFB340" />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#FFB340", margin: "0 0 2px" }}>Chờ trại duyệt</p>
                  <p style={{ fontSize: 12, color: "#888", margin: 0 }}>Trại đang xem xét yêu cầu của bạn</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AdoptScreen({ pets, likedPets, superLikedPets, passedPets, onLike, onSuperLike, onPass, onPetDetail }: AdoptScreenProps) {
  const [activeTab, setActiveTab] = useState<"explore" | "connected">("explore");
  const [cardIndex, setCardIndex] = useState(0);
  const [pendingTrigger, setPendingTrigger] = useState<"like" | "pass" | "superlike" | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const alreadySwiped = new Set([...likedPets, ...superLikedPets, ...passedPets]);
  const available = pets.filter(p => !alreadySwiped.has(p.id));
  const currentPet = available[0];
  const nextPet = available[1];

  const handleSwipeComplete = (direction: "like" | "pass" | "superlike") => {
    if (!currentPet) return;
    if (direction === "like") onLike(currentPet.id);
    else if (direction === "pass") onPass(currentPet.id);
    else onSuperLike(currentPet.id);
    setIsAnimating(false);
  };

  const triggerAction = (action: "like" | "pass" | "superlike") => {
    if (isAnimating || !currentPet) return;
    setIsAnimating(true);
    setPendingTrigger(action);
    // onLike/onPass/onSuperLike are called inside handleSwipeComplete after animation
  };

  return (
    <div style={{ padding: "0 24px", height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ paddingTop: 58, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <p style={{ color: "#FF4FA3", fontSize: 11, fontWeight: 800, letterSpacing: 1.5, margin: "0 0 4px", textTransform: "uppercase" }}>Nhận nuôi</p>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: "#1A1A1A", margin: 0, lineHeight: 1.1 }}>Khám phá</h1>
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
            <button style={{
              width: 44, height: 44, borderRadius: 14,
              background: "white", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
              position: "relative",
            }}>
              <SlidersHorizontal size={18} color="#888" />
              <span style={{
                position: "absolute", top: 8, right: 8,
                width: 8, height: 8,
                background: "#FF4FA3", borderRadius: "50%",
                border: "2px solid white",
              }} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 24, borderBottom: "1.5px solid #EEE", marginBottom: 0 }}>
          {(["explore", "connected"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 15, fontWeight: activeTab === tab ? 700 : 500,
              color: activeTab === tab ? "#1A1A1A" : "#AAAAAA",
              paddingBottom: 12, paddingLeft: 0, paddingRight: 0,
              borderBottom: activeTab === tab ? "2px solid #FF4FA3" : "2px solid transparent",
              marginBottom: -1.5,
              transition: "all 0.2s",
            }}>
              {tab === "explore" ? "Khám phá" : "Đã kết nối"}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "explore" && (
        <>
          {/* Card Area */}
          <div style={{ flex: 1, position: "relative", marginTop: 20, marginBottom: 20, minHeight: 0 }}>
            {currentPet ? (
              <>
                {nextPet && (
                  <SwipeCard
                    key={`behind-${nextPet.id}`}
                    pet={nextPet}
                    onSwipeComplete={() => {}}
                    onPetDetail={() => {}}
                    isBehind={true}
                  />
                )}
                <SwipeCard
                  key={`top-${currentPet.id}`}
                  pet={currentPet}
                  onSwipeComplete={handleSwipeComplete}
                  onPetDetail={() => onPetDetail(currentPet)}
                  triggerSwipe={pendingTrigger}
                  onTriggerDone={() => setPendingTrigger(null)}
                />
              </>
            ) : (
              <div style={{
                width: "100%", height: "100%",
                borderRadius: 28, background: "white",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
              }}>
                <div style={{
                  width: 88, height: 88, borderRadius: "50%",
                  background: "#FFF5FA",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 20, fontSize: 40,
                }}>🐾</div>
                <p style={{ fontSize: 22, fontWeight: 800, color: "#1A1A1A", marginBottom: 10, margin: "0 0 10px" }}>Đã hết rồi!</p>
                <p style={{ fontSize: 14, color: "#888", textAlign: "center", maxWidth: 220, margin: 0, lineHeight: 1.5 }}>
                  Bạn đã xem hết các bé hôm nay. Quay lại sau nhé!
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {currentPet && (
            <div style={{
              display: "flex", alignItems: "center",
              justifyContent: "center", gap: 14,
              paddingBottom: 8, flexShrink: 0,
            }}>
              <ActionBtn onClick={() => triggerAction("pass")} size={52} shadow="0 4px 16px rgba(0,0,0,0.10)">
                <X size={22} color="#FF4D4F" strokeWidth={2.5} />
              </ActionBtn>

              <ActionBtn onClick={() => triggerAction("superlike")} size={62} shadow="0 4px 16px rgba(58,122,254,0.15)" badge="3">
                <Star size={26} color="#3A7AFE" fill="#3A7AFE" />
              </ActionBtn>

              <button
                onClick={() => triggerAction("like")}
                style={{
                  width: 78, height: 78, borderRadius: "50%",
                  background: "linear-gradient(135deg, #FF4FA3, #FF83C4)",
                  border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 8px 28px rgba(255,79,163,0.50)",
                  transition: "transform 0.1s",
                }}
              >
                <Heart size={34} color="white" fill="white" />
              </button>

              <ActionBtn onClick={() => {}} size={62} shadow="0 4px 16px rgba(255,179,64,0.15)">
                <Sparkles size={24} color="#FFB340" />
              </ActionBtn>

              <ActionBtn onClick={() => {}} size={52} shadow="0 4px 16px rgba(0,0,0,0.10)">
                <RotateCcw size={20} color="#888" />
              </ActionBtn>
            </div>
          )}
        </>
      )}

      {activeTab === "connected" && (
        <div style={{ flex: 1, overflowY: "auto", paddingTop: 4, scrollbarWidth: "none" }}>
          <ConnectedTab
            pets={pets}
            likedPets={likedPets}
            superLikedPets={superLikedPets}
            onPetDetail={onPetDetail}
          />
        </div>
      )}
    </div>
  );
}

function ActionBtn({ children, onClick, size, shadow, badge }: {
  children: React.ReactNode;
  onClick: () => void;
  size: number;
  shadow: string;
  badge?: string;
}) {
  return (
    <button onClick={onClick} style={{
      width: size, height: size, borderRadius: "50%",
      background: "white", border: "none", cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: shadow,
      position: "relative",
      transition: "transform 0.1s",
    }}>
      {children}
      {badge && (
        <span style={{
          position: "absolute", top: -2, right: -2,
          width: 20, height: 20, borderRadius: "50%",
          background: "#3A7AFE",
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "2px solid white",
          color: "white", fontSize: 10, fontWeight: 700,
        }}>{badge}</span>
      )}
    </button>
  );
}

import { useState } from "react";
import { ChevronRight, Home, Leaf, PawPrint, Users, Clock, Award, Wallet, Plane, Heart, Building2, DoorOpen, Check } from "lucide-react";
import { motion } from "motion/react";

interface HousingEvaluationScreenProps {
  onBack: () => void;
}

/* ── Section header ── */
function SectionHeader({
  icon: Icon,
  title,
  badge,
  badgeColor = "#9CA3AF",
}: {
  icon: React.ElementType;
  title: string;
  badge?: string;
  badgeColor?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
      <div style={{
        width: 30, height: 30, borderRadius: 8,
        background: "#FFF0F7",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon size={16} color="#FF4FA3" />
      </div>
      <p style={{ flex: 1, fontSize: 15, fontWeight: 700, color: "#1A1A1A", margin: 0 }}>{title}</p>
      {badge && (
        <span style={{ fontSize: 11, fontWeight: 700, color: badgeColor, letterSpacing: 0.5 }}>
          {badge}
        </span>
      )}
    </div>
  );
}

/* ── Card option (icon + title + subtitle) ── */
function CardOption({
  label,
  sublabel,
  icon: Icon,
  selected,
  onSelect,
}: {
  label: string;
  sublabel?: string;
  icon?: React.ElementType;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onSelect}
      style={{
        flex: 1,
        background: selected ? "#FFF0F7" : "white",
        border: selected ? "2px solid #FF4FA3" : "1.5px solid #E5E7EB",
        borderRadius: 16,
        padding: "16px 10px 12px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        outline: "none",
        WebkitTapHighlightColor: "transparent",
        transition: "background 0.15s, border-color 0.15s",
      }}
    >
      {Icon && (
        <Icon size={26} color={selected ? "#FF4FA3" : "#6B7280"} strokeWidth={1.5} />
      )}
      <p style={{ fontSize: 13, fontWeight: 700, color: selected ? "#FF4FA3" : "#1A1A1A", margin: "0 0 2px", textAlign: "center" }}>
        {label}
      </p>
      {sublabel && (
        <p style={{ fontSize: 11, color: selected ? "#FF82C0" : "#9CA3AF", margin: 0, textAlign: "center", lineHeight: 1.3 }}>
          {sublabel}
        </p>
      )}
    </motion.button>
  );
}

/* ── Pill option ── */
function PillOption({
  label,
  sublabel,
  selected,
  onSelect,
  fullWidth = false,
}: {
  label: string;
  sublabel?: string;
  selected: boolean;
  onSelect: () => void;
  fullWidth?: boolean;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onSelect}
      style={{
        background: selected ? "#FFF0F7" : "white",
        border: selected ? "2px solid #FF4FA3" : "1.5px solid #E5E7EB",
        borderRadius: 14,
        padding: sublabel ? "10px 16px" : "11px 18px",
        cursor: "pointer",
        outline: "none",
        WebkitTapHighlightColor: "transparent",
        transition: "background 0.15s, border-color 0.15s",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        ...(fullWidth ? { width: "100%" } : {}),
      }}
    >
      <span style={{
        fontSize: 13, fontWeight: selected ? 700 : 600,
        color: selected ? "#FF4FA3" : "#1A1A1A",
        whiteSpace: "nowrap",
      }}>
        {label}
      </span>
      {sublabel && (
        <span style={{ fontSize: 11, color: selected ? "#FF82C0" : "#9CA3AF" }}>
          {sublabel}
        </span>
      )}
    </motion.button>
  );
}

/* ── Checkbox row ── */
function CheckboxRow({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onToggle}
      style={{
        width: "100%",
        background: checked ? "#FFF0F7" : "white",
        border: checked ? "2px solid #FF4FA3" : "1.5px solid #E5E7EB",
        borderRadius: 14,
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        cursor: "pointer",
        outline: "none",
        WebkitTapHighlightColor: "transparent",
        textAlign: "left",
        transition: "background 0.15s, border-color 0.15s",
      }}
    >
      <div style={{
        width: 22, height: 22,
        borderRadius: 6,
        border: checked ? "none" : "2px solid #D1D5DB",
        background: checked ? "#FF4FA3" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
        transition: "background 0.15s",
      }}>
        {checked && <Check size={13} color="white" strokeWidth={3} />}
      </div>
      <span style={{ fontSize: 14, fontWeight: 600, color: checked ? "#FF4FA3" : "#1A1A1A" }}>
        {label}
      </span>
    </motion.button>
  );
}

export function HousingEvaluationScreen({ onBack }: HousingEvaluationScreenProps) {
  const [housingType, setHousingType] = useState<string | null>(null);
  const [outdoorSpace, setOutdoorSpace] = useState<string | null>(null);
  const [hasPets, setHasPets] = useState<string | null>(null);
  const [hasChildren, setHasChildren] = useState<string | null>(null);
  const [timeAtHome, setTimeAtHome] = useState<string | null>(null);
  const [experience, setExperience] = useState<string | null>(null);
  const [income, setIncome] = useState<string | null>(null);
  const [whenAway, setWhenAway] = useState<string[]>([]);
  const [commitments, setCommitments] = useState<string[]>([]);

  const toggleWhenAway = (val: string) => {
    setWhenAway(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };

  const toggleCommitment = (val: string) => {
    setCommitments(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };

  const canSave = commitments.length === 2;

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
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>
        {/* Header */}
        <div style={{ padding: "56px 20px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
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
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1A1A1A", margin: 0 }}>Đánh giá nhà ở</h1>
          </div>
          <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6, margin: "0 0 24px" }}>
            Cập nhật để chúng tôi đề xuất các bé phù hợp với không gian và thói quen của bạn, đồng thời tăng tỉ lệ được duyệt nhận nuôi.
          </p>
        </div>

        <div style={{ padding: "0 16px 24px", display: "flex", flexDirection: "column", gap: 24 }}>

          {/* ── 1. Không gian sống ── */}
          <div>
            <SectionHeader icon={Home} title="Không gian sống của bạn" />
            <div style={{ display: "flex", gap: 10 }}>
              <CardOption
                label="Căn hộ"
                sublabel="Chung cư, tập thể"
                icon={Building2}
                selected={housingType === "apartment"}
                onSelect={() => setHousingType("apartment")}
              />
              <CardOption
                label="Phòng thuê"
                sublabel="Nhà trọ, ở ghép"
                icon={DoorOpen}
                selected={housingType === "rental"}
                onSelect={() => setHousingType("rental")}
              />
              <CardOption
                label="Nhà riêng"
                sublabel="Nhà mặt đất"
                icon={Home}
                selected={housingType === "house"}
                onSelect={() => setHousingType("house")}
              />
            </div>
          </div>

          {/* ── 2. Không gian ngoài trời ── */}
          <div>
            <SectionHeader icon={Leaf} title="Không gian ngoài trời" badge="TUỲ CHỌN" />
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[
                { id: "none",    label: "Không có" },
                { id: "balcony", label: "Ban công" },
                { id: "garden",  label: "Sân / vườn" },
              ].map(opt => (
                <PillOption
                  key={opt.id}
                  label={opt.label}
                  selected={outdoorSpace === opt.id}
                  onSelect={() => setOutdoorSpace(opt.id)}
                />
              ))}
            </div>
          </div>

          {/* ── 3. Thú cưng khác ── */}
          <div>
            <SectionHeader icon={PawPrint} title="Bạn đã có thú cưng khác?" />
            <div style={{ display: "flex", gap: 10 }}>
              {[{ id: "yes", label: "Có" }, { id: "no", label: "Không" }].map(opt => (
                <PillOption
                  key={opt.id}
                  label={opt.label}
                  selected={hasPets === opt.id}
                  onSelect={() => setHasPets(opt.id)}
                  fullWidth
                />
              ))}
            </div>
          </div>

          {/* ── 4. Trẻ em ── */}
          <div>
            <SectionHeader icon={Users} title="Có trẻ em dưới 12 tuổi trong nhà?" />
            <div style={{ display: "flex", gap: 10 }}>
              {[{ id: "yes", label: "Có" }, { id: "no", label: "Không" }].map(opt => (
                <PillOption
                  key={opt.id}
                  label={opt.label}
                  selected={hasChildren === opt.id}
                  onSelect={() => setHasChildren(opt.id)}
                  fullWidth
                />
              ))}
            </div>
          </div>

          {/* ── 5. Thời gian ở nhà ── */}
          <div>
            <SectionHeader icon={Clock} title="Thời gian ở nhà mỗi ngày" badge="TUỲ CHỌN" />
            <div style={{ display: "flex", gap: 10 }}>
              <CardOption
                label="< 4 giờ"
                sublabel="Đi làm cả ngày"
                selected={timeAtHome === "under4"}
                onSelect={() => setTimeAtHome("under4")}
              />
              <CardOption
                label="4 – 8 giờ"
                sublabel="Có ở nhà buổi tối"
                selected={timeAtHome === "4to8"}
                onSelect={() => setTimeAtHome("4to8")}
              />
              <CardOption
                label="> 8 giờ"
                sublabel="Làm việc tại nhà"
                selected={timeAtHome === "over8"}
                onSelect={() => setTimeAtHome("over8")}
              />
            </div>
          </div>

          {/* ── 6. Kinh nghiệm ── */}
          <div>
            <SectionHeader icon={Award} title="Kinh nghiệm nuôi thú cưng" badge="TUỲ CHỌN" />
            <div style={{ display: "flex", gap: 10 }}>
              <CardOption
                label="Chưa có"
                sublabel="Lần đầu nuôi"
                selected={experience === "none"}
                onSelect={() => setExperience("none")}
              />
              <CardOption
                label="1 – 2 năm"
                sublabel="Đã từng nuôi"
                selected={experience === "1to2"}
                onSelect={() => setExperience("1to2")}
              />
              <CardOption
                label="Trên 2 năm"
                sublabel="Nhiều kinh nghiệm"
                selected={experience === "over2"}
                onSelect={() => setExperience("over2")}
              />
            </div>
          </div>

          {/* ── 7. Thu nhập ── */}
          <div>
            <SectionHeader icon={Wallet} title="Thu nhập hàng tháng" badge="TUỲ CHỌN" />
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[
                { id: "u5m",    label: "< 5 triệu" },
                { id: "5-10m",  label: "5 – 10 triệu" },
                { id: "10-20m", label: "10 – 20 triệu" },
                { id: "o20m",   label: "> 20 triệu" },
              ].map(opt => (
                <PillOption
                  key={opt.id}
                  label={opt.label}
                  selected={income === opt.id}
                  onSelect={() => setIncome(opt.id)}
                />
              ))}
            </div>
          </div>

          {/* ── 8. Khi đi vắng ── */}
          <div>
            <SectionHeader icon={Plane} title="Khi đi vắng dài ngày, bé sẽ được" badge="TUỲ CHỌN" />
            <div style={{ display: "flex", gap: 10, flexDirection: "column" }}>
              <PillOption
                label="Gửi người thân / bạn bè"
                selected={whenAway.includes("family")}
                onSelect={() => toggleWhenAway("family")}
                fullWidth
              />
              <div style={{ display: "flex", gap: 10 }}>
                <PillOption
                  label="Gửi dịch vụ trông giữ"
                  selected={whenAway.includes("service")}
                  onSelect={() => toggleWhenAway("service")}
                  fullWidth
                />
                <PillOption
                  label="Mang bé theo cùng"
                  selected={whenAway.includes("bring")}
                  onSelect={() => toggleWhenAway("bring")}
                  fullWidth
                />
              </div>
              <PillOption
                label="Chưa có kế hoạch"
                selected={whenAway.includes("noplan")}
                onSelect={() => toggleWhenAway("noplan")}
                fullWidth
              />
            </div>
          </div>

          {/* ── 9. Cam kết ── */}
          <div>
            <SectionHeader icon={Heart} title="Cam kết của bạn" badge="BẮT BUỘC" badgeColor="#FF4FA3" />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <CheckboxRow
                label="Cam kết không bỏ rơi bé"
                checked={commitments.includes("no-abandon")}
                onToggle={() => toggleCommitment("no-abandon")}
              />
              <CheckboxRow
                label="Cam kết không bán lại bé"
                checked={commitments.includes("no-resell")}
                onToggle={() => toggleCommitment("no-resell")}
              />
            </div>
          </div>

        </div>
      </div>

      {/* ── Sticky bottom bar ── */}
      <div style={{
        background: "white",
        borderTop: "1px solid #F3F4F6",
        padding: "14px 16px max(20px, env(safe-area-inset-bottom, 20px))",
        display: "flex",
        gap: 12,
      }}>
        <button
          onClick={onBack}
          style={{
            flex: 1,
            background: "white",
            border: "1.5px solid #E5E7EB",
            borderRadius: 16,
            padding: "15px",
            fontSize: 15, fontWeight: 700, color: "#6B7280",
            cursor: "pointer",
            outline: "none",
          }}
        >
          Huỷ
        </button>
        <motion.button
          whileTap={canSave ? { scale: 0.97 } : {}}
          style={{
            flex: 2,
            background: canSave
              ? "linear-gradient(135deg, #FF4FA3, #FF83C4)"
              : "#F3F4F6",
            border: "none",
            borderRadius: 16,
            padding: "15px",
            fontSize: 15, fontWeight: 700,
            color: canSave ? "white" : "#9CA3AF",
            cursor: canSave ? "pointer" : "default",
            outline: "none",
            boxShadow: canSave ? "0 6px 20px rgba(255,79,163,0.35)" : "none",
            transition: "background 0.2s, box-shadow 0.2s",
          }}
        >
          Lưu thay đổi
        </motion.button>
      </div>
    </motion.div>
  );
}

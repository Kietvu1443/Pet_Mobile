import { useState } from "react";
import { ChevronLeft, Camera, Plus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AddPetScreenProps {
  onBack: () => void;
}

const TRAITS_SUGGESTIONS = ["Hiền lành", "Năng động", "Yêu trẻ con", "Trầm tính", "Sạch sẽ", "Thông minh", "Quấn người", "Hòa đồng với thú khác", "Độc lập"];

const STEPS = [
  { step: 1, title: "Thông tin cơ bản", subtitle: "Loài, giống & ảnh đại diện" },
  { step: 2, title: "Chi tiết", subtitle: "Tính cách & mô tả" },
  { step: 3, title: "Hoàn tất", subtitle: "Xem lại & đăng" },
];

export function AddPetScreen({ onBack }: AddPetScreenProps) {
  const [step, setStep] = useState(1);
  const [species, setSpecies] = useState<"cat" | "dog" | "other">("cat");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [ageYear, setAgeYear] = useState("0");
  const [ageMonth, setAgeMonth] = useState("0");
  const [color, setColor] = useState("");
  const [traits, setTraits] = useState<string[]>([]);
  const [traitInput, setTraitInput] = useState("");

  const toggleTrait = (t: string) => {
    setTraits(prev => prev.includes(t) ? prev.filter(x => x !== t) : prev.length < 5 ? [...prev, t] : prev);
  };

  const addCustomTrait = () => {
    if (traitInput.trim() && traits.length < 5) {
      setTraits(prev => [...prev, traitInput.trim()]);
      setTraitInput("");
    }
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{
        position: "absolute", inset: 0,
        background: "#FFF9FC",
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div style={{ padding: "58px 24px 20px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <button onClick={onBack} style={{
            width: 44, height: 44, borderRadius: 14,
            background: "white", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
          }}>
            <ChevronLeft size={22} color="#1A1A1A" />
          </button>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1A1A1A", margin: 0 }}>Thêm thú cưng</h2>
          <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#FF4FA3" }}>
            Lưu bản nháp
          </button>
        </div>

        {/* Step indicator */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              <p style={{ color: "#FF4FA3", fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", margin: "0 0 3px" }}>
                Bước {step} / {STEPS.length}
              </p>
              <p style={{ fontSize: 20, fontWeight: 800, color: "#1A1A1A", margin: "0 0 2px" }}>{STEPS[step - 1].title}</p>
              <p style={{ fontSize: 13, color: "#888", margin: 0 }}>{STEPS[step - 1].subtitle}</p>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {STEPS.map(s => (
                <div key={s.step} style={{
                  height: 7, borderRadius: 4,
                  width: s.step === step ? 32 : 7,
                  background: s.step <= step ? "#FF4FA3" : "#EEE",
                  transition: "all 0.3s",
                }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none", padding: "0 24px" }}>
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Step1Form
                species={species} setSpecies={setSpecies}
                gender={gender} setGender={setGender}
                name={name} setName={setName}
                breed={breed} setBreed={setBreed}
              />
            </motion.div>
          )}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Step2Form
                ageYear={ageYear} setAgeYear={setAgeYear}
                ageMonth={ageMonth} setAgeMonth={setAgeMonth}
                color={color} setColor={setColor}
                traits={traits} traitInput={traitInput}
                setTraitInput={setTraitInput}
                addCustomTrait={addCustomTrait}
                toggleTrait={toggleTrait}
                suggestions={TRAITS_SUGGESTIONS}
              />
            </motion.div>
          )}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Step3Form name={name} breed={breed} species={species} gender={gender} traits={traits} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Buttons */}
      <div style={{
        padding: "16px 24px 36px",
        background: "white",
        display: "flex", gap: 12,
        flexShrink: 0,
        boxShadow: "0 -4px 20px rgba(0,0,0,0.06)",
      }}>
        {step > 1 && (
          <button onClick={() => setStep(s => s - 1)} style={{
            flex: 1,
            background: "white", border: "2px solid #EEE",
            borderRadius: 18, padding: "16px",
            cursor: "pointer",
            fontSize: 16, fontWeight: 700, color: "#1A1A1A",
          }}>
            Quay lại
          </button>
        )}
        <button onClick={() => step < 3 ? setStep(s => s + 1) : onBack()} style={{
          flex: 2,
          background: "linear-gradient(135deg, #FF4FA3, #FF83C4)",
          border: "none", borderRadius: 18, padding: "16px",
          cursor: "pointer",
          fontSize: 16, fontWeight: 700, color: "white",
          boxShadow: "0 6px 20px rgba(255,79,163,0.40)",
        }}>
          {step < 3 ? "Tiếp tục" : "Đăng ngay 🐾"}
        </button>
      </div>
    </motion.div>
  );
}

function Step1Form({ species, setSpecies, gender, setGender, name, setName, breed, setBreed }: any) {
  const speciesOptions = [
    { id: "cat", emoji: "🐱", label: "Mèo" },
    { id: "dog", emoji: "🐶", label: "Chó" },
    { id: "other", emoji: "🐰", label: "Khác" },
  ];

  return (
    <div>
      {/* Photo Upload */}
      <div style={{ marginBottom: 28 }}>
        <Label>Ảnh đại diện *</Label>
        <div style={{
          height: 180,
          background: "white",
          borderRadius: 22,
          border: "2px dashed #FFBBD8",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 10,
          cursor: "pointer",
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "#FFF0F7",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Camera size={26} color="#FF4FA3" />
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, color: "#FF4FA3", margin: 0 }}>Thêm ảnh</p>
          <p style={{ fontSize: 12, color: "#BBB", margin: 0 }}>Tối đa 5 ảnh · JPG, PNG</p>
        </div>
      </div>

      {/* Species */}
      <div style={{ marginBottom: 24 }}>
        <Label>Loài *</Label>
        <div style={{ display: "flex", gap: 12 }}>
          {speciesOptions.map(s => (
            <button key={s.id} onClick={() => setSpecies(s.id)} style={{
              flex: 1,
              background: species === s.id ? "#FFF0F7" : "white",
              border: species === s.id ? "2px solid #FF4FA3" : "2px solid #EEE",
              borderRadius: 18, padding: "14px 8px",
              cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
              transition: "all 0.2s",
            }}>
              <span style={{ fontSize: 28 }}>{s.emoji}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: species === s.id ? "#FF4FA3" : "#1A1A1A" }}>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div style={{ marginBottom: 20 }}>
        <Label>Tên bé *</Label>
        <Input
          value={name}
          onChange={setName}
          placeholder="Tên thú cưng..."
        />
      </div>

      {/* Breed */}
      <div style={{ marginBottom: 20 }}>
        <Label>Giống *</Label>
        <Input value={breed} onChange={setBreed} placeholder="VD: Mèo ta, Corgi, Poodle..." />
      </div>

      {/* Gender */}
      <div style={{ marginBottom: 24 }}>
        <Label>Giới tính *</Label>
        <div style={{
          display: "flex",
          background: "white",
          borderRadius: 18,
          padding: 4,
          border: "1.5px solid #EEE",
          gap: 4,
        }}>
          {[{ id: "male", label: "♂ Đực" }, { id: "female", label: "♀ Cái" }].map(g => (
            <button key={g.id} onClick={() => setGender(g.id)} style={{
              flex: 1,
              background: gender === g.id ? "#FF4FA3" : "transparent",
              border: "none", cursor: "pointer",
              borderRadius: 14, padding: "12px",
              fontSize: 15, fontWeight: 700,
              color: gender === g.id ? "white" : "#888",
              transition: "all 0.2s",
              boxShadow: gender === g.id ? "0 4px 12px rgba(255,79,163,0.30)" : "none",
            }}>{g.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step2Form({ ageYear, setAgeYear, ageMonth, setAgeMonth, color, setColor, traits, traitInput, setTraitInput, addCustomTrait, toggleTrait, suggestions }: any) {
  return (
    <div>
      {/* Age */}
      <div style={{ marginBottom: 24 }}>
        <Label>Tuổi *</Label>
        <div style={{ display: "flex", gap: 12 }}>
          {[
            { val: ageYear, set: setAgeYear, unit: "năm" },
            { val: ageMonth, set: setAgeMonth, unit: "tháng" },
          ].map(({ val, set, unit }) => (
            <div key={unit} style={{ flex: 1, position: "relative" }}>
              <input
                type="number"
                value={val}
                onChange={e => set(e.target.value)}
                min="0"
                style={{
                  width: "100%",
                  background: "white",
                  border: "1.5px solid #EEE",
                  borderRadius: 18,
                  padding: "15px 60px 15px 16px",
                  fontSize: 16, fontWeight: 600, color: "#1A1A1A",
                  outline: "none", boxSizing: "border-box",
                }}
              />
              <span style={{
                position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
                fontSize: 14, color: "#888", fontWeight: 500, pointerEvents: "none",
              }}>{unit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Color */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Label inline>Màu lông</Label>
          <span style={{ fontSize: 13, color: "#AAAAAA" }}>· VD: Vàng, Đen trắng, Tam thể...</span>
        </div>
        <Input value={color} onChange={setColor} placeholder="VD: Vàng, Đen trắng, Tam thể..." />
      </div>

      {/* Location */}
      <div style={{ marginBottom: 24 }}>
        <Label>Khu vực * <span style={{ color: "#AAA", fontWeight: 400 }}>· tỉnh/thành · phường/xã</span></Label>
        <div style={{ display: "flex", gap: 12 }}>
          <select style={{
            flex: 1, background: "white", border: "1.5px solid #EEE",
            borderRadius: 18, padding: "15px 16px",
            fontSize: 14, color: "#1A1A1A", outline: "none", cursor: "pointer",
            appearance: "none",
          }}>
            <option>Thành phố...</option>
            <option>TP. Hồ Chí Minh</option>
            <option>Hà Nội</option>
          </select>
          <select style={{
            flex: 1, background: "white", border: "1.5px solid #EEE",
            borderRadius: 18, padding: "15px 16px",
            fontSize: 14, color: "#1A1A1A", outline: "none", cursor: "pointer",
            appearance: "none",
          }}>
            <option>Chọn phường...</option>
          </select>
        </div>
      </div>

      {/* Traits */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Label inline>Tính cách *</Label>
          <span style={{ fontSize: 13, color: "#AAAAAA" }}>· tối đa 5</span>
        </div>

        {/* Selected traits */}
        {traits.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            {traits.map((t: string) => (
              <span key={t} onClick={() => {/* remove */}} style={{
                background: "#FFF0F7",
                border: "1.5px solid #FF4FA3",
                borderRadius: 20, padding: "6px 14px",
                color: "#FF4FA3", fontSize: 13, fontWeight: 600,
                cursor: "pointer",
              }}>{t} ×</span>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <input
            value={traitInput}
            onChange={e => setTraitInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addCustomTrait()}
            placeholder="Nhập tính cách..."
            style={{
              flex: 1, background: "white", border: "1.5px solid #EEE",
              borderRadius: 18, padding: "14px 16px",
              fontSize: 14, color: "#1A1A1A", outline: "none",
            }}
          />
          <button onClick={addCustomTrait} style={{
            background: "#FF4FA3", border: "none", borderRadius: 18, padding: "14px 20px",
            color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer",
          }}>Thêm</button>
        </div>

        <p style={{ fontSize: 12, color: "#AAAAAA", marginTop: 12, marginBottom: 10 }}>Gợi ý</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {suggestions.filter((s: string) => !traits.includes(s)).map((t: string) => (
            <button key={t} onClick={() => toggleTrait(t)} style={{
              background: "white", border: "1.5px solid #EEE",
              borderRadius: 20, padding: "7px 14px",
              cursor: "pointer", fontSize: 13, fontWeight: 500, color: "#555",
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <Plus size={12} color="#888" />
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step3Form({ name, breed, species, gender, traits }: any) {
  return (
    <div>
      <div style={{
        background: "white",
        borderRadius: 24, overflow: "hidden",
        boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
        marginBottom: 24,
      }}>
        <div style={{
          height: 200,
          background: "linear-gradient(135deg, #FFF0F7, #FFE0F2)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 80 }}>{species === "cat" ? "🐱" : species === "dog" ? "🐶" : "🐰"}</span>
        </div>
        <div style={{ padding: "20px 24px" }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1A1A1A", margin: "0 0 6px" }}>{name || "Tên bé"}</h2>
          <p style={{ fontSize: 15, color: "#777", margin: "0 0 16px" }}>
            {breed || "Giống"} · {gender === "male" ? "Đực" : "Cái"}
          </p>
          {traits.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {traits.map((t: string) => (
                <span key={t} style={{
                  background: "#FFF0F7", borderRadius: 20, padding: "5px 14px",
                  color: "#FF4FA3", fontSize: 13, fontWeight: 600,
                }}>{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{
        background: "#FFF5FA",
        borderRadius: 20, padding: "16px 18px",
        border: "1.5px solid #FFBBD8",
        display: "flex", alignItems: "flex-start", gap: 12,
      }}>
        <span style={{ fontSize: 22, flexShrink: 0 }}>🎉</span>
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A", margin: "0 0 4px" }}>Sắp hoàn tất!</p>
          <p style={{ fontSize: 13, color: "#777", margin: 0, lineHeight: 1.5 }}>
            Sau khi đăng, hồ sơ của bé sẽ được hiển thị để người dùng khác có thể nhận nuôi.
          </p>
        </div>
      </div>
    </div>
  );
}

function Label({ children, inline }: { children: React.ReactNode; inline?: boolean }) {
  return (
    <p style={{
      fontSize: 11, fontWeight: 800, color: "#888",
      letterSpacing: 1.2, textTransform: "uppercase",
      margin: inline ? 0 : "0 0 8px",
      display: inline ? "inline" : "block",
    }}>{children}</p>
  );
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%",
        background: "white",
        border: "1.5px solid #EEE",
        borderRadius: 18, padding: "15px 16px",
        fontSize: 15, color: "#1A1A1A", outline: "none",
        boxSizing: "border-box",
        fontFamily: "inherit",
      }}
    />
  );
}

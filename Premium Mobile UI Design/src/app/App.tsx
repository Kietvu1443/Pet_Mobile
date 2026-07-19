import { useState } from "react";
import { BottomNav } from "./components/BottomNav";
import { MyPetsScreen } from "./components/MyPetsScreen";
import { AdoptScreen } from "./components/AdoptScreen";
import { FavoritesScreen } from "./components/FavoritesScreen";
import { ProfileScreen } from "./components/ProfileScreen";
import { PetDetailScreen } from "./components/PetDetailScreen";
import { AddPetScreen } from "./components/AddPetScreen";
import { LostPetsScreen } from "./components/LostPetsScreen";
import { RoleScreen } from "./components/RoleScreen";
import { PersonalInfoScreen } from "./components/PersonalInfoScreen";
import { SettingsScreen } from "./components/SettingsScreen";
import { SecurityPrivacyScreen } from "./components/SecurityPrivacyScreen";
import { NotificationSettingsScreen } from "./components/NotificationSettingsScreen";
import { HousingEvaluationScreen } from "./components/HousingEvaluationScreen";

export type Tab = "pets" | "adopt" | "favorites" | "profile";
export type Screen = null | "petDetail" | "addPet" | "lostPets" | "role" | "personalInfo" | "settings" | "securityPrivacy" | "notificationSettings" | "housingEvaluation";

export type Pet = {
  id: string;
  name: string;
  age: string;
  breed: string;
  species: "cat" | "dog";
  gender: "male" | "female";
  image: string;
  images: string[];
  location: string;
  traits: string[];
  verified: boolean;
  likes: number;
  shelter?: string;
  description?: string;
};

export const ADOPT_PETS: Pet[] = [
  {
    id: "1",
    name: "Si",
    age: "1t 3th",
    breed: "Mèo ta",
    species: "cat",
    gender: "male",
    image: "https://images.unsplash.com/photo-1515002246390-7bf7e8f87b54?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080",
    images: [
      "https://images.unsplash.com/photo-1515002246390-7bf7e8f87b54?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080",
      "https://images.unsplash.com/photo-1663637875268-7bba6bc372fd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080",
      "https://images.unsplash.com/photo-1629491569394-e56b6a44ece8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080",
    ],
    location: "P. Bình Thới, TP. Hồ Chí Minh",
    traits: ["Hiền lành", "Quấn người", "Hòa đồng với thú khác"],
    verified: true,
    likes: 43,
    shelter: "Trại cứu hộ Bình Thới",
    description: "Si là một chú mèo đực rất hiền lành và thân thiện. Bé rất thích được vuốt ve và ôm ấp. Si có thể sống hòa đồng với các thú cưng khác và đặc biệt rất thích trẻ em.",
  },
  {
    id: "2",
    name: "Luna",
    age: "8th",
    breed: "Mèo Anh lông ngắn",
    species: "cat",
    gender: "female",
    image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080",
    images: [
      "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080",
      "https://images.unsplash.com/photo-1498100152307-ce63fd6c5424?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080",
      "https://images.unsplash.com/photo-1612632237538-2de30e25af6f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080",
    ],
    location: "P. Hiệp Bình, TP. Hồ Chí Minh",
    traits: ["Trầm tính", "Độc lập", "Sạch sẽ"],
    verified: true,
    likes: 28,
    shelter: "Trại cứu hộ Hiệp Bình",
    description: "Luna là mèo cái hiền lành, ưa sạch sẽ. Bé thích không gian yên tĩnh và rất thông minh. Phù hợp với gia đình ít trẻ nhỏ.",
  },
  {
    id: "3",
    name: "Bò Nâu",
    age: "1t",
    breed: "Chó ta",
    species: "dog",
    gender: "male",
    image: "https://images.unsplash.com/photo-1526660690293-bcd32dc3b123?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080",
    images: [
      "https://images.unsplash.com/photo-1526660690293-bcd32dc3b123?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080",
      "https://images.unsplash.com/photo-1610112645245-36020fc0e128?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080",
      "https://images.unsplash.com/photo-1629740067905-bd3f515aa739?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080",
    ],
    location: "P. Hiệp Bình, TP. Hồ Chí Minh",
    traits: ["Năng động", "Thân thiện", "Thông minh"],
    verified: true,
    likes: 15,
    shelter: "Trại cứu hộ Q.9",
    description: "Bò Nâu là chú chó đực năng động, vui vẻ. Bé rất thích chạy nhảy và được chơi đùa với mọi người.",
  },
  {
    id: "4",
    name: "Mochi",
    age: "2t",
    breed: "Poodle",
    species: "dog",
    gender: "female",
    image: "https://images.unsplash.com/photo-1581562324420-eff2f5aaa4b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080",
    images: [
      "https://images.unsplash.com/photo-1581562324420-eff2f5aaa4b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080",
      "https://images.unsplash.com/photo-1599709606362-2078844247fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080",
      "https://images.unsplash.com/photo-1696254643239-eeb065e3f35a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080",
    ],
    location: "Q. Bình Thạnh, TP. Hồ Chí Minh",
    traits: ["Yêu trẻ con", "Quấn người", "Năng động"],
    verified: false,
    likes: 67,
    shelter: "Hội bảo vệ động vật HCM",
    description: "Mochi là bé poodle siêu dễ thương, rất thích được chơi đùa với trẻ em và người lớn. Bé đã được tiêm phòng đầy đủ.",
  },
  {
    id: "5",
    name: "Cam",
    age: "3th",
    breed: "Mèo ta",
    species: "cat",
    gender: "male",
    image: "https://images.unsplash.com/photo-1698170928357-a4671f4ef461?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080",
    images: [
      "https://images.unsplash.com/photo-1698170928357-a4671f4ef461?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080",
      "https://images.unsplash.com/photo-1702701752458-19366f87fad8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080",
      "https://images.unsplash.com/photo-1604675223954-b1aabd668078?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080",
    ],
    location: "Q. Gò Vấp, TP. Hồ Chí Minh",
    traits: ["Hiền lành", "Sạch sẽ", "Yêu trẻ con"],
    verified: true,
    likes: 92,
    shelter: "Trại cứu hộ Gò Vấp",
    description: "Cam là mèo con màu cam xinh xắn. Dù còn nhỏ nhưng bé rất hiền và không cào cắn. Đang tìm gia đình yêu thương.",
  },
];

const PHONE_STYLE: React.CSSProperties = {
  background: "#FFF9FC",
  maxWidth: 390,
  width: "100%",
  height: "100%",
  maxHeight: 844,
  position: "relative",
  overflow: "hidden",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif",
  WebkitFontSmoothing: "antialiased",
};

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("adopt");
  const [activeScreen, setActiveScreen] = useState<Screen>(null);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [likedPets, setLikedPets] = useState<string[]>(["2"]);
  const [superLikedPets, setSuperLikedPets] = useState<string[]>([]);
  const [passedPets, setPassedPets] = useState<string[]>([]);

  const openPetDetail = (pet: Pet) => {
    setSelectedPet(pet);
    setActiveScreen("petDetail");
  };

  const goBack = () => {
    setActiveScreen(null);
    setSelectedPet(null);
  };

  const handleTabChange = (tab: Tab) => {
    setActiveScreen(null);
    setSelectedPet(null);
    setActiveTab(tab);
  };

  return (
    <div style={{ background: "#E8E0F0", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={PHONE_STYLE}>
        {/* Main Content Area — full height so content scrolls BEHIND the glass nav */}
        <div style={{ height: "100%", overflowY: "auto", overflowX: "hidden", scrollbarWidth: "none" }}>
          {/* Inner wrapper — definite height so flex children resolve correctly.
              paddingBottom creates clearance behind the glass nav on scrollable screens.
              overflow: visible lets screen content taller than 100% still scroll. */}
          <div style={{ height: "100%", paddingBottom: activeScreen === null ? 96 : 0, boxSizing: "border-box" }}>
            {activeTab === "pets" && activeScreen === null && (
              <MyPetsScreen onAddPet={() => setActiveScreen("addPet")} />
            )}
            {activeTab === "adopt" && activeScreen === null && (
              <AdoptScreen
                pets={ADOPT_PETS}
                likedPets={likedPets}
                superLikedPets={superLikedPets}
                passedPets={passedPets}
                onLike={(id) => setLikedPets(p => [...p, id])}
                onSuperLike={(id) => setSuperLikedPets(p => [...p, id])}
                onPass={(id) => setPassedPets(p => [...p, id])}
                onPetDetail={openPetDetail}
              />
            )}
            {activeTab === "favorites" && activeScreen === null && (
              <FavoritesScreen
                pets={ADOPT_PETS}
                likedPets={likedPets}
                superLikedPets={superLikedPets}
                passedPets={passedPets}
                onPetDetail={openPetDetail}
              />
            )}
            {activeTab === "profile" && activeScreen === null && (
              <ProfileScreen
                onRole={() => setActiveScreen("role")}
                onPersonalInfo={() => setActiveScreen("personalInfo")}
                onLostPets={() => setActiveScreen("lostPets")}
                onSettings={() => setActiveScreen("settings")}
                onHousingEvaluation={() => setActiveScreen("housingEvaluation")}
              />
            )}
          </div>
        </div>

        {/* Overlay Screens */}
        {activeScreen === "petDetail" && selectedPet && (
          <PetDetailScreen pet={selectedPet} onBack={goBack} />
        )}
        {activeScreen === "addPet" && (
          <AddPetScreen onBack={goBack} />
        )}
        {activeScreen === "lostPets" && (
          <LostPetsScreen onBack={goBack} />
        )}
        {activeScreen === "role" && (
          <RoleScreen onBack={goBack} />
        )}
        {activeScreen === "personalInfo" && (
          <PersonalInfoScreen onBack={goBack} />
        )}
        {activeScreen === "settings" && (
          <SettingsScreen
            onBack={goBack}
            onSecurityPrivacy={() => setActiveScreen("securityPrivacy")}
            onNotifications={() => setActiveScreen("notificationSettings")}
          />
        )}
        {activeScreen === "notificationSettings" && (
          <NotificationSettingsScreen onBack={() => setActiveScreen("settings")} />
        )}
        {activeScreen === "housingEvaluation" && (
          <HousingEvaluationScreen onBack={goBack} />
        )}
        {activeScreen === "securityPrivacy" && (
          <SecurityPrivacyScreen onBack={() => setActiveScreen("settings")} />
        )}

        {/* Bottom Navigation */}
        {activeScreen === null && (
          <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
        )}
      </div>
    </div>
  );
}

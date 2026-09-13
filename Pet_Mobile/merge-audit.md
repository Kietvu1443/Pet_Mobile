# BÁO CÁO AUDIT VÀ SO SÁNH MERGE: PET HELPER MOBILE & BACKEND

> **Ngày thực hiện:** 13/09/2026  
> **Trạng thái:** Giai đoạn 1 — Audit toàn diện & Đề xuất kế hoạch Merge (Chưa chỉnh sửa source code)  
> **Nguyên tắc cốt lõi:** **CURRENT PROJECT LÀ SOURCE OF TRUTH (CURRENT > TEAM UPDATE)**. Tuyệt đối không overwrite hoặc làm rollback bất kỳ tính năng, bug fix, kiến trúc cache hay cấu hình native nào đã được hoàn thiện và kiểm thử trước đó.

---

## 1. Executive Summary

### 1.1. Phạm vi so sánh
1. **Current Mobile:** `C:\Hope\Pet_Helper_Mobile\Pet_Mobile` (Source of Truth)
2. **Team Mobile Update (v0.0.9):** `C:\Hope\Update_pet\Pet_Mobile-0.0.9\Pet_Mobile-0.0.9\Pet_Mobile`
3. **Current Backend:** `C:\Hope\Pet_Helper_Mobile_Backend\Pet_helper\backend` (Source of Truth)
4. **Team Backend Update (v1.0.4):** `C:\Hope\Update_pet\Pet_Mobile_BE-1.0.4\Pet_Mobile_BE-1.0.4\backend`

### 1.2. Tổng quan kết quả kiểm tra
- **Dependencies (`package.json`):** Cả Backend và Mobile đều sử dụng bộ dependencies và version hoàn toàn đồng nhất (Backend: 24 packages, Mobile: 45 packages). Không có conflict về version hay thư viện mới cần cài đặt thêm qua npm/yarn.
- **Cấu hình Native & Android:** Thư mục `android/` chỉ tồn tại duy nhất ở **Current Mobile** (đã được prebuild và cấu hình đầy đủ cho MapLibre, Google Sign-In, Facebook SDK, Push Notification channels). Bản team Mobile **không có thư mục `android/`**. Do đó, tuyệt đối **không chạy `npx expo prebuild --clean`** để bảo vệ cấu hình native.
- **Tính năng mới nổi bật từ Team Update:**
  - **Hệ thống Best Match (Hành trình gắn bó sau nhận nuôi):** Toàn bộ domain mới gồm 7 bảng database mới, API routes `/api/v1/best-matches/*`, Story upload/quản lý khoảnh khắc, đánh giá hành trình (assessment), wellbeing signals, quyền riêng tư (privacy) và tích hợp tự động kích hoạt khi đơn nhận nuôi được duyệt (`adoptionRequestService.js`).
  - **PetSnap Recommendation & Interactions nâng cao:** Các endpoint tương tác mới (`detail-view`, `super-like`, `unlike`, `liked-pets`, `pass`) và thuật toán candidate scoring / profiling phong phú trong `PetLike.js`.
  - **Phòng thủ dịch vụ Email Resend:** Fix lỗi tiềm ẩn tại 4 controller auth (`authApiV1Controller.js`, `authController.js`, `oauthController.js`, `passkeyController.js`) khi thiếu `RESEND_API_KEY` (trả về 503 thay vì crash instance).
- **Phần quan trọng vượt trội ở Current Project mà Team Update KHÔNG có (hoặc bản Team là Mockup cũ):**
  - **Places & Maps (MapLibre):** Toàn bộ API `/api/v1/places`, model `Place`, `PlaceReview`, `ModerationReport`, bản đồ MapLibre an toàn `SafeMapView`, `places-map.tsx`, `add-place.tsx`, `place/[id].tsx`. (Team BE hoàn toàn thiếu domain này).
  - **User Pets:** Toàn bộ API `/api/v1/user-pets`, model `UserPet`, `UserPetImage` (Team BE thiếu domain này).
  - **Adoption Flow hoàn chỉnh (Milestone A):** Đã kiểm thử thực tế và nghiệm thu: Email OTP verification (`VerifyEmailModal.tsx`), `AdoptionRequestModal.tsx`, Real Like API, `adopt-catalog.tsx`, `my-adoption-requests.tsx`. Bản Team `pet-detail.tsx` chỉ là mockup cũ (like bằng local state, form submit rỗng).
  - **Lost / Found Pet Flow hoàn chỉnh (Milestone B):** `lost-pets.tsx` với TanStack Query infinite feed, bộ lọc All/Lost/Found, `report-lost.tsx`, `report-found.tsx`, `report/[id].tsx`, `my-reports.tsx`. Bản Team `lost-pets.tsx` chỉ là mockup cứng với popup `Alert.alert('Đang phát triển')`.
  - **Quy chuẩn UX Thông báo (Push Notification Permission):** Current tuân thủ nghiêm ngặt: Tuyệt đối KHÔNG tự động popup xin quyền khi mở app/login, chỉ xin quyền khi bật toggle trong Settings qua `AppDialog` giải thích trước. Bản Team vẫn gọi `Notifications.requestPermissionsAsync()` tự động khi đăng ký token.
  - **Hệ thống Design System & UI Dialog:** Current chuẩn hóa toàn bộ dialog xác nhận qua `AppDialog.tsx`. Bản Team vẫn dùng `Alert.alert` gốc của React Native.

---

## 2. Mobile Feature Comparison

| Feature / Domain | Current Mobile (Source of Truth) | Team Mobile 0.0.9 | Đánh giá & Action |
|---|---|---|---|
| **Best Match Journey Selector** | Chưa có | Có (`app/index.tsx` - dự định cho `/best-match`) | **MERGE (P0):** Đổi tên file thành `app/best-match/index.tsx` để tránh xung đột routing root Expo. |
| **Best Match Journey Detail & Stories** | Chưa có | Có (`app/[id].tsx` - dự định cho `/best-match/[id]`) | **MERGE (P0):** Đổi tên file thành `app/best-match/[id].tsx` kèm component `BestMatchStoryModal.tsx`. |
| **Best Match API Client** | Chưa có | Có (`lib/api/bestMatches.ts`) | **MERGE (P0):** Port nguyên vẹn file client API. |
| **Best Match Avatar Ring Badge** | Chưa có | Có trong `app/(tabs)/profile.tsx` (icon `∞` trên avatar) | **MERGE (P1):** Ghép badge và query `fetchMyBestMatches` vào Profile hiện tại, giữ nguyên toàn bộ menu và AppDialog của Current. |
| **PetSnap Extended Interactions** | Chỉ có Like / Dislike cơ bản | Có API backend cho Super Like, Detail View, Liked Pets | **MERGE (P1):** Bổ sung method gọi API trong `lib/api/petSnap.ts`. |
| **Adoption Flow & Catalog** | Hoàn chỉnh: `adopt-catalog.tsx`, `pet-detail.tsx` (Real Like, Email OTP check, `AdoptionRequestModal`, Housing Review) | Mockup cũ: `pet-detail.tsx` chỉ toggle state like giả lập, submit đơn rỗng | **KEEP CURRENT (SKIP TEAM):** Giữ 100% Current. Không ghi đè `pet-detail.tsx`. |
| **My Adoption Requests** | Hoàn chỉnh: `my-adoption-requests.tsx` tích hợp menu Profile | Không có file này | **KEEP CURRENT:** Giữ nguyên. |
| **Lost / Found Pet Flow** | Hoàn chỉnh: `lost-pets.tsx` (Infinite scroll, bộ lọc), `report-lost.tsx`, `report-found.tsx`, `my-reports.tsx`, `report/[id].tsx` | Mockup cũ: nút báo cáo bật `Alert.alert('Đang phát triển')` | **KEEP CURRENT (SKIP TEAM):** Giữ 100% Current. |
| **Places & MapLibre** | Hoàn chỉnh: `places-map.tsx`, `SafeMapView`, `InlinePlaceMap`, `add-place.tsx`, `place/[id].tsx`, `PlaceReviewModal`, `ReportModal` | Bản cũ chưa hoàn thiện camera và modal review | **KEEP CURRENT:** Giữ 100% Current. |
| **Notification Permission UX** | Chuẩn hóa: Không popup khi mở app, toggle Settings kích hoạt qua `AppDialog` | Bản cũ: tự động gọi `requestPermissionsAsync()` khi đăng ký token | **KEEP CURRENT (SKIP TEAM):** Giữ 100% Current trong `settings.tsx` và `lib/notifications/device.ts`. |
| **AppDialog vs Alert.alert** | Tất cả modal xác nhận (Logout, Delete Pet, Permissions) dùng `AppDialog.tsx` | Dùng `Alert.alert` gốc của React Native | **KEEP CURRENT:** Giữ 100% Current. |
| **Shelter Registration** | Hoàn thiện layout form, review status, tích hợp `AppDialog` | Form tương đương nhưng dùng `Alert.alert` | **KEEP CURRENT:** Giữ Current. |
| **Settings & Legal Info** | Đầy đủ Language, Theme, Notification toggle (AppDialog flow), Tabs Terms/Privacy | Tương đương nhưng chưa tối ưu permission flow | **KEEP CURRENT:** Giữ Current. |

---

## 3. Backend Feature Comparison

| Feature / API Module | Current Backend (Source of Truth) | Team BE 1.0.4 | Đánh giá & Action |
|---|---|---|---|
| **Best Match Domain** | Chưa có | Đầy đủ: Models, Controller, Services, Upload Handler, Routes `/api/v1/best-matches/*` | **MERGE (P0):** Thêm toàn bộ các file mới này vào Backend. |
| **Best Match Auto-Activation on Adoption** | Chưa có | Có trong `service/adoptionRequestService.js` (`ensureBestMatchForOfficialAdoption`) | **MERGE (P1):** Ghép logic kích hoạt vào `adoptionRequestService.js`. |
| **Pet Recommendation & Candidate Scoring** | Thuật toán random cơ bản trong `PetLike.js` | `PetLike.js` mở rộng 2000 dòng với scoring, preferences, history tracking | **MERGE (P1):** Cập nhật `PetLike.js` và `controller/petSnapApiV1Controller.js`. |
| **PetSnap Endpoints** | Chỉ có `/pet-snap`, `like`, `dislike` | Thêm `detail-view`, `super-like`, `liked-pets`, `unlike` | **MERGE (P1):** Cập nhật `routes/api/v1/petSnap.js`. |
| **Resend Email Service Defensive Fallback** | Khởi tạo trực tiếp, có nguy cơ crash nếu thiếu API key | Kiểm tra `process.env.RESEND_API_KEY ? new Resend(...) : null` và trả về 503 | **MERGE (P0):** Port bug fix sang 4 controller auth. |
| **Notification Constants** | Có `PLACE_APPROVED`, `PLACE_REJECTED` | Có `BEST_MATCH_STARTED`, `BEST_MATCH_CANCELLED` | **MERGE (P0):** Hợp nhất cả 2 nhóm enum trong `shared/constants/notificationTypes.js`. |
| **Places Domain (`/places`)** | Đầy đủ: controller, routes, model `Place`, `PlaceReview`, `ModerationReport`, migration | Hoàn toàn không có | **KEEP CURRENT:** Bảo vệ 100% code Places trong Backend. |
| **User Pets Domain (`/user-pets`)** | Đầy đủ: controller, routes, model `UserPet`, `UserPetImage`, migration | Hoàn toàn không có | **KEEP CURRENT:** Bảo vệ 100% code UserPets trong Backend. |
| **Route Mounting trong `app.js`** | Mount `userPets`, `places` | Mount `bestMatches` | **MERGE (P0):** Mount cả 3 router (`userPets`, `places`, `bestMatches`) trong `app.js`. |

---

## 4. New APIs (Từ Team BE 1.0.4)

Dưới đây là danh mục chi tiết toàn bộ các API endpoint mới từ Team BE 1.0.4 cần merge:

### 4.1. Nhóm Best Match (User Endpoints)

#### 1. `GET /api/v1/best-matches`
- **Mô tả:** Lấy danh sách các hành trình Best Match đang hoạt động của người dùng hiện tại.
- **Controller:** `controller/bestMatchApiV1Controller.js` -> `listMine`
- **Service:** `service/bestMatchService.js` -> `listUserBestMatches`
- **Model:** `models/BestMatch.js`
- **Auth Requirement:** Bắt buộc (`requireApiAuth`)
- **Request Body:** Không có
- **Response (200):** `{ success: true, data: { bestMatches: BestMatchSummary[] } }`
- **Database Dependency:** Bảng `best_matches`, `pets`, `best_match_privacy_settings`

#### 2. `GET /api/v1/best-matches/:id`
- **Mô tả:** Lấy hồ sơ chi tiết hành trình Best Match của một thú cưng (bao gồm thông tin thú cưng, danh sách stories, evidence, assessment, cài đặt riêng tư).
- **Controller:** `controller/bestMatchApiV1Controller.js` -> `getProfile`
- **Service:** `service/bestMatchService.js` -> `getProfile`
- **Model:** `models/BestMatch.js`, `models/BestMatchStory.js`, `models/BestMatchAssessment.js`
- **Auth Requirement:** Bắt buộc (`requireApiAuth` - chủ sở hữu hoặc staff/admin)
- **Response (200):** `{ success: true, data: { bestMatch: {...}, stories: [...], assessment: {...}, is_owner: boolean } }`
- **Database Dependency:** Bảng `best_matches`, `best_match_stories`, `best_match_assessments`

#### 3. `POST /api/v1/best-matches/:id/cancel`
- **Mô tả:** Người dùng chủ động kết thúc/hủy một hành trình Best Match.
- **Controller:** `controller/bestMatchApiV1Controller.js` -> `cancel`
- **Service:** `service/bestMatchService.js` -> `cancelBestMatch`
- **Model:** `models/BestMatch.js`
- **Auth Requirement:** Bắt buộc (`requireApiAuth`)
- **Request Body:** `{ reason?: string }`
- **Response (200):** `{ success: true, message: "Đã hủy hành trình Best Match", data: { bestMatch: {...} } }`

#### 4. `GET /api/v1/best-matches/:id/privacy` & `PUT /api/v1/best-matches/:id/privacy`
- **Mô tả:** Lấy và cập nhật cấu hình hiển thị quyền riêng tư (ẩn/hiện stories, media, vòng ring badge trên avatar).
- **Controller:** `controller/bestMatchApiV1Controller.js` -> `getPrivacy` / `updatePrivacy`
- **Service:** `service/bestMatchService.js`
- **Model:** `models/BestMatchPrivacySettings.js`
- **Auth Requirement:** Bắt buộc (`requireApiAuth` - chỉ chủ sở hữu)
- **Request Body (PUT):** `{ show_stories?: boolean, show_media?: boolean, show_ring_badge?: boolean }`
- **Response (200):** `{ success: true, data: { settings: {...} } }`

#### 5. `GET /api/v1/best-matches/:id/stories`
- **Mô tả:** Lấy danh sách các câu chuyện/khoảnh khắc trong hành trình.
- **Controller:** `controller/bestMatchApiV1Controller.js` -> `listStories`
- **Service:** `service/bestMatchStoryService.js`

#### 6. `POST /api/v1/best-matches/:id/stories`
- **Mô tả:** Tạo một khoảnh khắc/câu chuyện mới kèm upload ảnh/video (tối đa 10 tệp media).
- **Controller:** `controller/bestMatchApiV1Controller.js` -> `createStory`
- **Middleware:** `uploadStoryMedia` (`middleware/bestMatchUploadHandler.js`)
- **Service:** `service/bestMatchStoryService.js`
- **Model:** `models/BestMatchStory.js`, `models/BestMatchEvidence.js`
- **Auth Requirement:** Bắt buộc (`requireApiAuth`)
- **Request Body (Multipart):** `title`, `content`, `story_date`, `visibility`, `media` (files)
- **Response (201):** `{ success: true, data: { story: {...} } }`

#### 7. `PUT /api/v1/best-matches/:id/stories/:storyId` & `DELETE /api/v1/best-matches/:id/stories/:storyId`
- **Mô tả:** Chỉnh sửa nội dung text/ngày/privacy hoặc soft-delete một câu chuyện.
- **Controller:** `controller/bestMatchApiV1Controller.js` -> `updateStory` / `deleteStory`

#### 8. `GET /api/v1/best-matches/:id/assessment`
- **Mô tả:** Lấy trạng thái đánh giá chiều sâu hành trình (early, growing, established, long_term).
- **Controller:** `controller/bestMatchApiV1Controller.js` -> `getAssessment`
- **Service:** `service/BestMatchAssessmentService.js`

#### 9. `GET /api/v1/best-matches/:id/wellbeing-signals`
- **Mô tả:** Lấy danh sách các tín hiệu sức khỏe/hạnh phúc của thú cưng trong hành trình.

### 4.2. Nhóm Best Match (Staff / Admin Endpoints)
- **`POST /api/v1/best-matches/:id/wellbeing-signals`:** Thêm tín hiệu theo dõi (`requireApiRole([0, 1])`).
- **`PATCH /api/v1/best-matches/wellbeing-signals/:signalId/status`:** Cập nhật trạng thái tín hiệu (`requireApiRole([0, 1])`).
- **`POST /api/v1/best-matches/sync/:adoptionRequestId`:** Đồng bộ thủ công Best Match từ đơn nhận nuôi (`requireApiRole([0, 1])`).

### 4.3. Nhóm PetSnap Interactions mới
- **`POST /api/v1/pet-snap/:id/detail-view`:** Ghi nhận sự kiện người dùng xem chi tiết thẻ pet khi quẹt.
- **`POST /api/v1/pet-snap/:id/super-like`:** Ghi nhận tương tác Super Like.
- **`GET /api/v1/pet-snap/liked-pets`:** Lấy danh sách thú cưng đã thích qua PetSnap swipe.
- **`POST /api/v1/pet-snap/:id/unlike`:** Bỏ thích thú cưng từ danh sách đã thích.
- **`POST /api/v1/pets/:id/pass`:** Ghi nhận tương tác bỏ qua (pass) thú cưng vào hệ thống tương tác AI.
- **`POST /api/v1/pets/:id/super-like`:** Ghi nhận tương tác Super Like từ trang chi tiết.

---

## 5. Database Changes

> [!WARNING]
> Tuyệt đối KHÔNG tự ý thực thi chạy migration trên cơ sở dữ liệu production. Dưới đây là các định nghĩa schema từ Team BE 1.0.4 để phục vụ việc đánh giá tương thích.

### 5.1. Bảng mới cần thêm (24 bảng)
1. **Domain Best Match (`003_best_match.sql`):**
   - `best_matches`: Lưu phiên hành trình giữa `user_id` và `pet_id`, `adoption_request_id`, ngày bắt đầu, trạng thái `active` / `cancelled`.
   - `best_match_privacy_settings`: Cấu hình quyền riêng tư cho từng hành trình (`show_stories`, `show_media`, `show_ring_badge`).
   - `best_match_stories`: Các bài viết nhật ký/khoảnh khắc theo hành trình.
   - `best_match_story_media`: Lưu đường dẫn ảnh/video đính kèm câu chuyện.
   - `best_match_evidence`: Dữ liệu chứng thực hành trình dẫn xuất từ stories.
   - `best_match_assessments`: Đánh giá mức độ gắn bó (`early`, `growing`, `established`, `long_term`).
   - `best_match_wellbeing_signals`: Tín hiệu sức khỏe thú cưng theo thời gian.
2. **Domain Pet Attributes & Recommendation (`001_pet_domain_v1.sql`, `002_pet_domain_v2.sql`, `001_create_pet_attributes.sql`):**
   - `pet_attributes`: Từ điển thuộc tính mở rộng của thú cưng.
   - Hồ sơ chuyên sâu thú cưng: `pet_physical_profiles`, `pet_personality_profiles`, `pet_behavior_profiles`, `pet_social_profiles`, `pet_health_profiles`, `pet_care_profiles`, `pet_environment_profiles`.
   - Danh mục & Tags: `pet_species`, `pet_breeds`, `traits`, `pet_traits`, `tags`, `pet_tags`.
   - Đề xuất & Tương tác: `user_pet_preferences`, `pet_interactions`, `pet_recommendations`.

### 5.2. Cột mới thêm vào bảng hiện có (`pets`)
- Trong `001_pet_domain_v1.sql` và `002_pet_domain_v2.sql`:
  - `breed_secondary VARCHAR(255) NULL`
  - `birth_date DATE NULL`
  - `estimated_age_months INT UNSIGNED NULL`
  - `source_type VARCHAR(50) NULL`
  - `intake_date DATE NULL`
  - `adoption_status VARCHAR(30) NOT NULL DEFAULT 'available'`
  - `availability_status VARCHAR(30) NOT NULL DEFAULT 'active'`
  - `notes TEXT NULL`
  - `species_id INT NULL` (FK tới `pet_species(id)`)
  - `primary_breed_id INT NULL` (FK tới `pet_breeds(id)`)
  - `secondary_breed_id INT NULL` (FK tới `pet_breeds(id)`)

### 5.3. Seed Data
- `seedPetAttributes.js`: Dữ liệu mẫu khởi tạo danh mục thuộc tính đặc tính thú cưng.

---

## 6. Mobile Changes

### 6.1. Screens mới
- **`app/best-match/index.tsx` (Tạo mới từ `app/index.tsx` của Team):**  
  Màn hình "Best Match của tôi", mở khi người dùng bấm vào vòng Best Match trên avatar ở Profile. Hiển thị danh sách các hành trình Best Match đang có để người dùng chọn.
- **`app/best-match/[id].tsx` (Tạo mới từ `app/[id].tsx` của Team):**  
  Màn hình hồ sơ hành trình Best Match cụ thể của một thú cưng (dòng thời gian, ảnh/video kỷ niệm, câu chuyện, trạng thái hành trình).

### 6.2. Components mới
- **`components/BestMatchStoryModal.tsx`:** Modal tạo và chỉnh sửa câu chuyện/khoảnh khắc Best Match (hỗ trợ chọn tối đa 10 ảnh/video từ thư viện, nhập nội dung, chọn ngày, quyền riêng tư).

### 6.3. API Client mới
- **`lib/api/bestMatches.ts`:** Toàn bộ client functions cho Best Match (`fetchMyBestMatches`, `fetchBestMatchProfile`, `createBestMatchStory`, `updateBestMatchStory`, `deleteBestMatchStory`, `updateBestMatchPrivacy`, `cancelBestMatch` và các helper định dạng thời gian).

### 6.4. Hook & Cache Changes
- Tích hợp TanStack Query key `['best-matches']` và `['best-match-profile', id]`.
- Giữ nguyên toàn bộ cấu trúc query keys hiện có (`['my-reports']`, `['pet-detail', id]`, `['places']`).

### 6.5. Android / Native Changes
- **Không có bất kỳ thay đổi nào trong `android/` hoặc `app.json`.** Giữ nguyên toàn bộ cấu hình native hiện tại.

---

## 7. Conflicts & Rủi ro tiềm ẩn

| Vấn đề xung đột | Chi tiết rủi ro | Giải pháp khuyến nghị |
|---|---|---|
| **Xung đột cấu trúc thư mục Routing (`app/index.tsx`, `app/[id].tsx`)** | Team đặt `index.tsx` và `[id].tsx` ngay tại thư mục gốc `app/`. Điều này gây xung đột nghiêm trọng với Expo Router (ghi đè trang chủ root `/` của app và bắt tất cả params động ở root). | **Không đặt tại `app/`**. Đặt đúng vào thư mục con `app/best-match/index.tsx` và `app/best-match/[id].tsx`, khớp chính xác với `router.push('/best-match')` mà profile gọi. |
| **Xung đột Adoption Flow (`pet-detail.tsx`)** | File `pet-detail.tsx` của Team là bản mockup cũ (chưa có OTP, chưa có modal form nhận nuôi, like giả). Nếu ghi đè sẽ làm mất toàn bộ tính năng Milestone A đã hoàn thành. | **KEEP 100% Current `pet-detail.tsx`**. Không lấy code từ Team. |
| **Xung đột Lost/Found Flow (`lost-pets.tsx`)** | File `lost-pets.tsx` của Team là bản mockup với alert thông báo "Đang phát triển". Current đã có infinite scroll, filter, và luồng đăng tin thật. | **KEEP 100% Current `lost-pets.tsx`**. Không lấy code từ Team. |
| **Xung đột Notification Permission UX** | File `device.ts` của Team tự động gọi `requestPermissionsAsync()` khi app khởi động. Current đã bảo đảm không tự động xin quyền, chỉ kích hoạt khi user toggle trong Settings qua `AppDialog`. | **KEEP 100% Current `device.ts` và `settings.tsx`**. |
| **Xung đột Router Mounting Backend (`app.js`)** | File `app.js` của Team thiếu các route `/places` và `/userPets`. Nếu copy toàn bộ sẽ làm gãy tính năng Places và User Pets trên Mobile. | **Surgical Edit `app.js`**: Chỉ thêm `bestMatchApiV1Router` vào danh sách routers hiện tại. |
| **Xung đột Notification Types (`notificationTypes.js`)** | Current có `PLACE_APPROVED`, `PLACE_REJECTED`. Team có `BEST_MATCH_STARTED`, `BEST_MATCH_CANCELLED`. | **Merge Enum**: Giữ cả 4 giá trị enum trong file constants cả Backend và Mobile. |
| **Xung đột UI Confirm Delete Dialog** | Current dùng `AppDialog.tsx` chuẩn hóa design system. Team dùng modal tự chế cũ. | **KEEP CURRENT `ConfirmDeleteModal.tsx`**. |

---

## 8. Kế hoạch Merge Đề xuất Cải tiến (Phased Merge Plan: C0 -> C5)

Dựa trên nguyên tắc an toàn tuyệt đối và phản hồi từ người dùng, kế hoạch được chia thành các Phase nhỏ tuần tự:

### 🟢 Phase C0: Backend Core & Defensive Fixes (Rủi ro: 0%)
1. **Fix phòng thủ Resend Email 503:**
   - Áp dụng kiểm tra `process.env.RESEND_API_KEY ? new Resend(...) : null` tại:
     - `controller/authApiV1Controller.js`
     - `controller/authController.js`
     - `controller/oauthController.js`
     - `controller/passkeyController.js`
2. **Vá lỗi thiếu file validation của Team:**
   - Tạo file `backend/validation/bestMatchValidation.js` (được require trong `bestMatchApiV1Controller.js` nhưng Team quên commit) với các hàm validation: `validateCancel`, `validatePrivacyUpdate`.
3. **Merge Best Match Backend Core:**
   - Thêm upload handler: `middleware/bestMatchUploadHandler.js`
   - Thêm models: `BestMatch.js`, `BestMatchStory.js`, `BestMatchEvidence.js`, `BestMatchAssessment.js`, `BestMatchPrivacySettings.js`, `BestMatchWellbeingSignal.js`
   - Thêm services: `bestMatchService.js`, `bestMatchStoryService.js`, `BestMatchAssessmentService.js`, `bestMatchWellbeingService.js`, `BestMatchKnowledgeService.js`, `BestMatchPatternService.js`
   - Thêm controller: `bestMatchApiV1Controller.js`
   - Thêm router: `routes/api/v1/bestMatches.js`
4. **Mount router & Cập nhật notification types:**
   - Bổ sung `BEST_MATCH_STARTED`, `BEST_MATCH_CANCELLED` vào `shared/constants/notificationTypes.js`.
   - Mount `/api/v1/best-matches` trong `app.js` (bảo vệ nguyên vẹn `/places` và `/user-pets`).
5. **CHƯA SỬA `adoptionRequestService.js`:** Giữ nguyên vẹn Adoption flow hiện tại.
6. **CHƯA SỬA `PetLike.js`:** Không copy đè scoring 2000 dòng.

### 🟡 Phase C1: DB Migrations Review & Staging (Tuyệt đối KHÔNG chạy production)
1. Lưu trữ file SQL `database/migrations/003_best_match.sql` vào repository để đội ngũ DB theo dõi.
2. Tách riêng 7 bảng Best Match khỏi 17 bảng Pet Attributes / Recommendations.
3. Tuyệt đối **KHÔNG chạy bất kỳ migration SQL nào trên production database**.

### 🟢 Phase C2: Mobile Best Match Core UI & Client
1. Thêm API client: `lib/api/bestMatches.ts`.
2. Thêm modal: `components/BestMatchStoryModal.tsx`.
3. Thêm màn hình Best Match danh sách: `app/best-match/index.tsx` (tuyệt đối không đặt tại root `app/index.tsx`).
4. Thêm màn hình Best Match chi tiết: `app/best-match/[id].tsx` (tuyệt đối không đặt tại root `app/[id].tsx`).
5. Thêm entry point vòng Best Match (`∞`) trên avatar trong `app/(tabs)/profile.tsx` khi có Best Match và được bật hiển thị.
   - Giữ 100% các menu "Hồ sơ nhận nuôi", "Tin báo của tôi" và `AppDialog` logout hiện tại.
6. Cập nhật `shared/constants/notificationTypes.ts` phía Mobile.

### 🧪 Phase C3: Independent Verification (Kiểm tra Độc lập)
1. Kiểm tra TypeScript Mobile: `npx tsc --noEmit`.
2. Kiểm tra Lint Mobile: `npx expo lint`.
3. Kiểm tra cú pháp và khởi động Backend: `node -c app.js`.
4. Kiểm tra điều hướng `/best-match` không xung đột với các màn hình khác.

### 🟡 Phase C4: Adoption -> Best Match Integration (Chỉ làm sau khi Phase C3 PASS)
1. Tích hợp an toàn trong `service/adoptionRequestService.js`:
   - Gọi `ensureBestMatchForOfficialAdoption()` bọc trong block `try / catch` riêng biệt.
   - Nếu tạo Best Match thất bại, chỉ log warning, **tuyệt đối không làm fail quy trình duyệt đơn nhận nuôi**.

### 🟠 Phase C5: PetSnap Enhancements (Milestone riêng biệt)
1. Rà soát ngoại vi các endpoint mới (`detail-view`, `super-like`, `liked-pets`, `unlike`).
2. Tích hợp có chọn lọc logic scoring trong `PetLike.js` sau khi schema bảng thuộc tính được DB team chuẩn bị.

---

## 9. Bảng Quy tắc Vàng: Bảo vệ Tuyệt đối Code Hiện tại

| Thành phần | Trạng thái | Lý do bảo vệ |
|---|---|---|
| **`app/pet-detail.tsx`** | 🛡️ **KHÔNG ĐỤNG ĐẾN** | Đã có Milestone A (OTP verification, Real Like, Request modal, Housing review). Bản team là mockup cũ. |
| **`app/lost-pets.tsx`** | 🛡️ **KHÔNG ĐỤNG ĐẾN** | Đã có Milestone B (Infinite feed, All/Lost/Found filter, Report actions). Bản team là alert "Đang phát triển". |
| **`lib/notifications/device.ts` & `settings.tsx`** | 🛡️ **KHÔNG ĐỤNG ĐẾN** | Đã chuẩn hóa UX không tự ý xin quyền notification khi mở app. Bản team tự gọi `requestPermissionsAsync()`. |
| **`components/ConfirmDeleteModal.tsx`** | 🛡️ **KHÔNG ĐỤNG ĐẾN** | Đã chuẩn hóa dùng `AppDialog.tsx`. |
| **Thư mục `android/` & `app.json`** | 🛡️ **KHÔNG ĐỤNG ĐẾN** | Chứa config native MapLibre, Google, Facebook SDK. Không chạy `prebuild --clean`. |
| **Places (`/places`) & User Pets (`/user-pets`)** | 🛡️ **KHÔNG ĐỤNG ĐẾN** | Team BE không có hai domain này. Phải giữ nguyên 100%. |

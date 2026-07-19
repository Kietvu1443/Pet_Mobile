# Graph Report - .  (2026-06-15)

## Corpus Check
- Large corpus: 619 files · ~3,281,943 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 626 nodes · 920 edges · 65 communities (57 shown, 8 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 48 edges (avg confidence: 0.83)
- Token cost: 0 input · 405,569 output

## Community Hubs (Navigation)
- [[_COMMUNITY_API Endpoint Surface|API Endpoint Surface]]
- [[_COMMUNITY_Auth Controller & JWT|Auth Controller & JWT]]
- [[_COMMUNITY_Backend Dependencies|Backend Dependencies]]
- [[_COMMUNITY_Mascot Guide System|Mascot Guide System]]
- [[_COMMUNITY_Image Upload (Cloudinary)|Image Upload (Cloudinary)]]
- [[_COMMUNITY_Report Pages & Moderation|Report Pages & Moderation]]
- [[_COMMUNITY_Pet Return Controller|Pet Return Controller]]
- [[_COMMUNITY_OAuth Login (GoogleFB)|OAuth Login (Google/FB)]]
- [[_COMMUNITY_Pet Return Service Layer|Pet Return Service Layer]]
- [[_COMMUNITY_Pet Return Tests|Pet Return Tests]]
- [[_COMMUNITY_Admin API Controller|Admin API Controller]]
- [[_COMMUNITY_Static Header & Cart|Static Header & Cart]]
- [[_COMMUNITY_News & Report Services|News & Report Services]]
- [[_COMMUNITY_App Bootstrap & Swagger|App Bootstrap & Swagger]]
- [[_COMMUNITY_PetImage & Report Service|PetImage & Report Service]]
- [[_COMMUNITY_Favorites Controller|Favorites Controller]]
- [[_COMMUNITY_PasskeyWebAuthn Auth|Passkey/WebAuthn Auth]]
- [[_COMMUNITY_Pet API Controller|Pet API Controller]]
- [[_COMMUNITY_Report API Controller|Report API Controller]]
- [[_COMMUNITY_Auth Profile Controller|Auth Profile Controller]]
- [[_COMMUNITY_API Auth Guards (v1)|API Auth Guards (v1)]]
- [[_COMMUNITY_Legacy Page Routers|Legacy Page Routers]]
- [[_COMMUNITY_DB Pool & Migrations|DB Pool & Migrations]]
- [[_COMMUNITY_Migrations & PetLike|Migrations & PetLike]]
- [[_COMMUNITY_Adoption Request Controller|Adoption Request Controller]]
- [[_COMMUNITY_PetSnap Swipe Controller|PetSnap Swipe Controller]]
- [[_COMMUNITY_Admin Use-Case Specs|Admin Use-Case Specs]]
- [[_COMMUNITY_Mascot Character Assets|Mascot Character Assets]]
- [[_COMMUNITY_Root Package Scripts|Root Package Scripts]]
- [[_COMMUNITY_Platform Features & Roles|Platform Features & Roles]]
- [[_COMMUNITY_Staff Use-Case Specs|Staff Use-Case Specs]]
- [[_COMMUNITY_Swagger API Definitions|Swagger API Definitions]]
- [[_COMMUNITY_News Route|News Route]]
- [[_COMMUNITY_Pets Route|Pets Route]]
- [[_COMMUNITY_Reports Route|Reports Route]]
- [[_COMMUNITY_Admin Design System|Admin Design System]]
- [[_COMMUNITY_Pet Returns Route|Pet Returns Route]]
- [[_COMMUNITY_Auth Route|Auth Route]]
- [[_COMMUNITY_Admin Route|Admin Route]]
- [[_COMMUNITY_User Use-Case Specs|User Use-Case Specs]]
- [[_COMMUNITY_Cloudinary Migration Script|Cloudinary Migration Script]]
- [[_COMMUNITY_News Service|News Service]]
- [[_COMMUNITY_Pet Return Validation|Pet Return Validation]]
- [[_COMMUNITY_Coding Guidelines|Coding Guidelines]]
- [[_COMMUNITY_Brand Logo Assets|Brand Logo Assets]]
- [[_COMMUNITY_Adoption Requests Route|Adoption Requests Route]]
- [[_COMMUNITY_Favorites Route|Favorites Route]]
- [[_COMMUNITY_PetSnap Route|PetSnap Route]]
- [[_COMMUNITY_Docker Compose Stack|Docker Compose Stack]]
- [[_COMMUNITY_Swipe UI Assets|Swipe UI Assets]]
- [[_COMMUNITY_Pet Images Migration Design|Pet Images Migration Design]]
- [[_COMMUNITY_Adoption Request Service|Adoption Request Service]]
- [[_COMMUNITY_Account UI Screenshots|Account UI Screenshots]]
- [[_COMMUNITY_Migration Runner|Migration Runner]]
- [[_COMMUNITY_User Model|User Model]]
- [[_COMMUNITY_UserConnection Model|UserConnection Model]]
- [[_COMMUNITY_UserPasskey Model|UserPasskey Model]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]

## God Nodes (most connected - your core abstractions)
1. `pool` - 25 edges
2. `sendError()` - 19 edges
3. `requireApiAuth()` - 13 edges
4. `sendSuccess()` - 13 edges
5. `Pet Helper API (Swagger)` - 13 edges
6. `GET /api/v1/auth/me` - 12 edges
7. `Auth Overlay Component` - 11 edges
8. `My Reports / My Activity (my-reports.html)` - 10 edges
9. `init()` - 9 edges
10. `Pet Helper Platform` - 9 edges

## Surprising Connections (you probably didn't know these)
- `Email OTP Authentication (Resend)` --conceptually_related_to--> `Auth API`  [INFERRED]
  Pet_helper/README.md → Pet_helper/backend/swagger.yaml
- `Profile Page UI` --shares_data_with--> `Auth API`  [INFERRED]
  Pet_helper/Update/profile.html → Pet_helper/backend/swagger.yaml
- `UC_User_Account_01: Register Account` --conceptually_related_to--> `Auth API`  [INFERRED]
  Pet_helper/backend/UML/UC/User/UC_User_Detailed_Specs.md → Pet_helper/backend/swagger.yaml
- `PetSnap Swipe Browsing Feature` --semantically_similar_to--> `UC_User_Pet_01: PetSnap Swipe`  [INFERRED] [semantically similar]
  Pet_helper/README.md → Pet_helper/backend/UML/UC/User/UC_User_Detailed_Specs.md
- `Profile Page UI` --conceptually_related_to--> `PetHelper Admin Design System`  [INFERRED]
  Pet_helper/Update/profile.html → Pet_helper/Update/DESIGN.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Docker Compose Service Stack** — docker_compose_db, docker_compose_app, docker_compose_phpmyadmin [EXTRACTED 1.00]
- **Pet Adoption Flow Use Cases** — uc_user_detailed_specs_request_adoption, uc_staff_detailed_specs_review_adoption, uc_admin_detailed_specs_review_adoption, swagger_adoption_requests_api [INFERRED 0.85]
- **Lost/Found Report Handling Flow** — uc_user_detailed_specs_report_lost, uc_staff_detailed_specs_manage_report, uc_admin_detailed_specs_handle_report, swagger_reports_api [INFERRED 0.85]
- **Pet Adoption End-to-End Flow** — pages_adopt, pages_adopt_detail, pages_my_adoption_requests, pages_adoption_review, pages_add_pet [INFERRED 0.85]
- **Admin Management Pages** — pages_admin, pages_admin_shop, pages_adoption_review [INFERRED 0.75]
- **Shop Commerce Flow** — pages_shop, pages_admin_shop, endpoint_api_orders [INFERRED 0.75]
- **Lost & Found Pet Report Lifecycle (submit, browse, moderate, track)** — report_lost, report_found, report_list, report_admin_reports, report_my_reports [INFERRED 0.85]
- **Tinder-style Swipe Adoption UI Controls** — images_btn_like, images_btn_nope, images_swipe_adoption_ui [INFERRED 0.75]
- **Pet Helper Brand Asset Set** — images_the_logo, images_the_logo_webp, images_logo, images_favicon [INFERRED 0.75]
- **Pet Images Storage Redesign Notes** — notes_1, notes_2, notes_2_image_url_migration [INFERRED 0.75]
- **Mascot Reaction Set** — mascots_cat_happy, mascots_cat_idle, mascots_cat_like, mascots_dog_cool, mascots_dog_curious, mascots_dog_idle, mascots_dog_review [INFERRED 0.85]

## Communities (65 total, 8 thin omitted)

### Community 0 - "API Endpoint Surface"
Cohesion: 0.07
Nodes (50): Auth Overlay Component, Why API-first stateless auth via overlay, /api/orders, /api/products, /api/reviews, /api/v1/admin/news, /api/v1/admin/reports, /api/v1/admin/users (+42 more)

### Community 1 - "Auth Controller & JWT"
Cohesion: 0.05
Nodes (39): authController, EmailVerification, jwt, { JWT_SECRET }, { Resend }, User, extractUser(), isAdmin (+31 more)

### Community 2 - "Backend Dependencies"
Cohesion: 0.06
Nodes (32): dependencies, axios, bcryptjs, body-parser, cloudinary, cookie-parser, cors, debug (+24 more)

### Community 3 - "Mascot Guide System"
Cohesion: 0.18
Nodes (24): applyChoice(), buildMascotAvatar(), buildPanel(), buildPicker(), buildTrigger(), findEl(), getChoice(), getPageBubbles() (+16 more)

### Community 4 - "Image Upload (Cloudinary)"
Cohesion: 0.09
Nodes (20): apiKey, apiSecret, avatarUploadDir, baseUploadDir, bgUploadDir, cloudAvatarStorage, cloudBgStorage, { CloudinaryStorage } (+12 more)

### Community 5 - "Report Pages & Moderation"
Cohesion: 0.16
Nodes (21): Report API v1 Test Page, Admin Report Moderation (admin-reports.html), GET /api/v1/admin/news + PATCH status, GET /api/v1/admin/reports, PATCH /api/v1/admin/reports/:id/status, GET/PATCH /api/v1/adoption-requests (admin), GET /api/v1/auth/me, Found Pet Report Form (found.html) (+13 more)

### Community 6 - "Pet Return Controller"
Cohesion: 0.11
Nodes (16): ALLOWED_STATUSES, { mapUploadedFiles }, notificationService, petReturnController, petReturnService, { sendSuccess, sendError }, { cloudinary, isProduction, getCloudinaryId }, { CloudinaryStorage } (+8 more)

### Community 7 - "OAuth Login (Google/FB)"
Cohesion: 0.15
Nodes (12): axios, EmailVerification, findOrCreateOAuthUser(), googleClient, jwt, { JWT_SECRET }, makeUniqueDisplayName(), { OAuth2Client } (+4 more)

### Community 8 - "Pet Return Service Layer"
Cohesion: 0.14
Nodes (9): petReturnRepository, { pool }, notificationService, { pool }, notificationService, petReturnRepository, petReturnService, petReturnValidation (+1 more)

### Community 9 - "Pet Return Tests"
Cohesion: 0.32
Nodes (13): cleanup(), dbQuery(), fail(), pass(), petReturnService, { pool }, tc1_CreateReturnRequest(), tc2_DuplicateBlock() (+5 more)

### Community 10 - "Admin API Controller"
Cohesion: 0.15
Nodes (10): adminApiV1Controller, ALLOWED_REPORT_ACTIONS, ALLOWED_ROLES, ALLOWED_STATUSES, { pool }, Report, { sendSuccess, sendError }, User (+2 more)

### Community 11 - "Static Header & Cart"
Cohesion: 0.26
Nodes (8): attachCartBadgeClick(), esc(), getCart(), init(), injectCartHTML(), renderCart(), saveCart(), updateBadges()

### Community 12 - "News & Report Services"
Cohesion: 0.18
Nodes (9): getCloudinaryId(), getImageUrl(), { isProduction, getImageUrl, getCloudinaryId }, newsApiV1Controller, newsService, { sendSuccess, sendError }, {
  isProduction,
  getImageUrl,
  getCloudinaryId,
}, reportController (+1 more)

### Community 13 - "App Bootstrap & Swagger"
Cohesion: 0.22
Nodes (8): authRateLimiter, path, swaggerSpec, swaggerUi, YAML, fs, path, staticPagesRoot

### Community 14 - "PetImage & Report Service"
Cohesion: 0.18
Nodes (8): deleteImage(), PetImage, { pool }, { deleteImage }, PetImage, { pool }, Report, reportService

### Community 15 - "Favorites Controller"
Cohesion: 0.18
Nodes (6): favoritesApiV1Controller, Pet, PetLike, { sendSuccess, sendError }, Pet, { pool }

### Community 16 - "Passkey/WebAuthn Auth"
Cohesion: 0.18
Nodes (9): EmailVerification, {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
}, jwt, { JWT_SECRET }, { Resend }, { sendSuccess, sendError }, User, UserConnection (+1 more)

### Community 17 - "Pet API Controller"
Cohesion: 0.18
Nodes (8): fs, {
  isProduction,
  getImageUrl,
  getCloudinaryId,
  ensurePetFolder,
  deleteImage,
}, path, Pet, petApiV1Controller, PetImage, PetLike, { sendSuccess, sendError }

### Community 18 - "Report API Controller"
Cohesion: 0.22
Nodes (9): buildFoundReportData(), buildLostReportData(), { isProduction, getImageUrl, getCloudinaryId }, normalizePhone(), REPORT_STATUSES, REPORT_TYPES, reportApiV1Controller, reportService (+1 more)

### Community 19 - "Auth Profile Controller"
Cohesion: 0.20
Nodes (8): getAvatarUrl(), getBgUrl(), authApiV1Controller, {
  avatarUpload,
  bgUpload,
  getAvatarUrl,
  getBgUrl,
  deleteImage,
}, jwt, { JWT_SECRET }, { sendSuccess, sendError }, User

### Community 20 - "API Auth Guards (v1)"
Cohesion: 0.33
Nodes (9): getTokenFromRequest(), getUserFromToken(), jwt, { JWT_SECRET }, requireApiAuth(), requireApiVerified(), { sendError }, User (+1 more)

### Community 21 - "Legacy Page Routers"
Cohesion: 0.18
Nodes (8): express, path, router, staticPagesRoot, express, path, router, staticPagesRoot

### Community 22 - "DB Pool & Migrations"
Cohesion: 0.22
Nodes (4): mysql, EmailVerification, { pool }, { pool }

### Community 23 - "Migrations & PetLike"
Cohesion: 0.22
Nodes (5): pool, { pool }, PetLike, { pool }, { pool }

### Community 24 - "Adoption Request Controller"
Cohesion: 0.28
Nodes (6): adoptionRequestApiV1Controller, adoptionRequestService, allowedStatuses, { sendSuccess, sendError }, sendResponse(), sendSuccess()

### Community 25 - "PetSnap Swipe Controller"
Cohesion: 0.25
Nodes (7): getNextPetBundle(), normalizePet(), Pet, PetImage, PetLike, petSnapApiV1Controller, { sendSuccess, sendError }

### Community 26 - "Admin Use-Case Specs"
Cohesion: 0.25
Nodes (9): Admin API, Reports API, Admin Use Case Specs, UC_Admin_User_02: Ban/Unban Account, UC_Admin_Report_01: Handle Report & Ban, UC_Admin_Pet_01: Manage Pets, UC_Admin_Adopt_01: Review Adoption, UC_Admin_User_01: Update Role (+1 more)

### Community 27 - "Mascot Character Assets"
Cohesion: 0.57
Nodes (8): Cat Mascot - Happy, Cat Mascot - Idle, Cat Mascot - Like (thumbs up), Dog Mascot - Cool (thumbs up peek), Dog Mascot - Curious (peeking), Dog Mascot - Idle, Dog Mascot - Review (writing/reviewing), Mascot Reaction System

### Community 28 - "Root Package Scripts"
Cohesion: 0.25
Nodes (7): name, private, scripts, dev, install-all, start, version

### Community 29 - "Platform Features & Roles"
Cohesion: 0.25
Nodes (8): Pet Adoption Feature, Cloudinary Image Storage, Email OTP Authentication (Resend), Lost/Found Pet Reports Feature, Pet Helper Platform, Admin Role, Staff Role, User Role

### Community 30 - "Staff Use-Case Specs"
Cohesion: 0.25
Nodes (8): Adoption Requests API, Pets API, Staff Use Case Specs, UC_Staff_Pet_01: Add New Pet, UC_Staff_Report_01: Manage Lost Reports, UC_Staff_Adopt_01: Review Adoption Request, UC_Staff_Pet_02: Update/Delete Pet, UC_User_Adopt_01: Send Adoption Request

### Community 31 - "Swagger API Definitions"
Cohesion: 0.29
Nodes (8): Auth API, Favorites API, JWT Bearer Authentication, News API, Orders API, Pet Helper API (Swagger), Products API, Reviews API

### Community 32 - "News Route"
Cohesion: 0.25
Nodes (6): express, newsApiV1Controller, {
  requireApiAuth,
  requireApiRole,
}, router, { sendError }, { upload }

### Community 33 - "Pets Route"
Cohesion: 0.25
Nodes (6): express, petApiV1Controller, { requireApiAuth, requireApiRole }, router, { sendError }, { upload }

### Community 34 - "Reports Route"
Cohesion: 0.25
Nodes (6): express, reportApiV1Controller, {
  requireApiAuth,
  requireApiRole,
}, router, { sendError }, { upload }

### Community 35 - "Admin Design System"
Cohesion: 0.29
Nodes (7): Fixed Sidebar / Fluid Content Layout, Forest Greens & Slate Neutrals Palette, Modern Corporate Glassmorphic Style, Inter Typography System, PetHelper Admin Design System, Status Pills Component, Profile Page UI

### Community 36 - "Pet Returns Route"
Cohesion: 0.29
Nodes (6): uploadReturnImages(), express, petReturnController, {
  requireApiAuth,
  requireApiRole,
  requireApiVerified,
}, router, { uploadReturnImages }

### Community 37 - "Auth Route"
Cohesion: 0.29
Nodes (6): authApiV1Controller, express, oauthController, passkeyController, { requireApiAuth }, router

### Community 38 - "Admin Route"
Cohesion: 0.33
Nodes (5): requireApiRole(), adminApiV1Controller, express, {
  requireApiAuth,
  requireApiRole,
}, router

### Community 39 - "User Use-Case Specs"
Cohesion: 0.33
Nodes (6): PetSnap Swipe Browsing Feature, PetSnap API, User Use Case Specs, UC_User_Service_01: Book Vaccination, UC_User_Pet_01: PetSnap Swipe, UC_User_Account_01: Register Account

### Community 40 - "Cloudinary Migration Script"
Cohesion: 0.33
Nodes (4): fs, path, { pool }, PUBLIC_DIR

### Community 41 - "News Service"
Cohesion: 0.33
Nodes (4): newsService, { pool }, VALID_CATEGORIES, VALID_STATUSES

### Community 42 - "Pet Return Validation"
Cohesion: 0.33
Nodes (4): petReturnValidation, TRANSITION_PERMISSIONS, VALID_REASON_CATEGORIES, VALID_TRANSITIONS

### Community 43 - "Coding Guidelines"
Cohesion: 0.40
Nodes (5): Goal-Driven Execution, Karpathy Behavioral Guidelines, Simplicity First, Surgical Changes, Think Before Coding

### Community 44 - "Brand Logo Assets"
Cohesion: 0.50
Nodes (5): Site Favicon, Logo (SVG Vector), Pet Helper Branding - 'Be kind to every kind' Concept, Pet Helper Brand Logo (JPG), Pet Helper Brand Logo (WebP)

### Community 45 - "Adoption Requests Route"
Cohesion: 0.40
Nodes (4): adoptionRequestApiV1Controller, express, {
  requireApiAuth,
  requireApiRole,
  requireApiVerified,
}, router

### Community 46 - "Favorites Route"
Cohesion: 0.40
Nodes (4): express, favoritesApiV1Controller, { requireApiAuth }, router

### Community 47 - "PetSnap Route"
Cohesion: 0.40
Nodes (4): express, petSnapApiV1Controller, { requireApiAuth }, router

### Community 48 - "Docker Compose Stack"
Cohesion: 0.83
Nodes (4): app Service (Express), MySQL 8.0 db Service, phpMyAdmin Service, Pet Helper Docker Compose Stack

### Community 49 - "Swipe UI Assets"
Cohesion: 0.67
Nodes (4): Like Button (Heart) Asset, Nope Button (X) Asset, Lovely.jpg - Cat & Puppy Photo, Tinder-style Swipe Adoption UI Concept

### Community 50 - "Pet Images Migration Design"
Cohesion: 0.67
Nodes (4): Pet Images Architecture Diagram, Pet Images Storage & Display-Order Design, Pet Images Migration Notes & Files-Changed Table, Migrate image_url to pet_images Table Rationale

### Community 52 - "Account UI Screenshots"
Cohesion: 0.50
Nodes (4): Web Dashboard Sidebar Screenshot, Account Settings Page Screenshot, Account Management & Security UI Concept, Admin Dashboard Navigation Concept

## Ambiguous Edges - Review These
- `The Wisdom Sheep (sheep.html)` → `Lost & Found Pet Report Lifecycle`  [AMBIGUOUS]
  Pet_helper/frontend/report/sheep.html · relation: conceptually_related_to

## Knowledge Gaps
- **338 isolated node(s):** `authRateLimiter`, `mysql`, `YAML`, `path`, `multer` (+333 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `The Wisdom Sheep (sheep.html)` and `Lost & Found Pet Report Lifecycle`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `pool` connect `Migrations & PetLike` to `Auth Controller & JWT`, `Pet Return Service Layer`, `Cloudinary Migration Script`, `Admin API Controller`, `Pet Return Tests`, `News Service`, `PetImage & Report Service`, `Favorites Controller`, `Adoption Request Service`, `Migration Runner`, `DB Pool & Migrations`, `User Model`, `UserConnection Model`, `UserPasskey Model`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Why does `sendError()` connect `API Auth Guards (v1)` to `News Route`, `Pets Route`, `Reports Route`, `Pet Return Controller`, `OAuth Login (Google/FB)`, `Admin API Controller`, `News & Report Services`, `Favorites Controller`, `Passkey/WebAuthn Auth`, `Pet API Controller`, `Report API Controller`, `Auth Profile Controller`, `Adoption Request Controller`, `PetSnap Swipe Controller`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `sendSuccess()` connect `Adoption Request Controller` to `Pet Return Controller`, `OAuth Login (Google/FB)`, `Admin API Controller`, `News & Report Services`, `Favorites Controller`, `Passkey/WebAuthn Auth`, `Pet API Controller`, `Report API Controller`, `Auth Profile Controller`, `PetSnap Swipe Controller`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `authRateLimiter`, `mysql`, `YAML` to the rest of the system?**
  _343 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `API Endpoint Surface` be split into smaller, more focused modules?**
  _Cohesion score 0.06938775510204082 - nodes in this community are weakly interconnected._
- **Should `Auth Controller & JWT` be split into smaller, more focused modules?**
  _Cohesion score 0.05142857142857143 - nodes in this community are weakly interconnected._
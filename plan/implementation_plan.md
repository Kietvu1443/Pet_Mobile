# Architectural Design Review: Profile Module

*Performed by Senior Software Architect*

This document presents a final production-readiness design review of the Profile module. It focuses on long-term maintainability, historical audit trails, image storage scalability, API completeness, and analytical capability.

---

## Part 1: Production-Readiness Reviews

### 1. Historical Versioning & Data Retention
- **Vetting History**: The previous design had a unique constraint on `housing_reviews.user_id`, meaning subsequent updates overwrite historical data. In production, if a user changes residences and submits a new review, the administrator must be able to review the historical record of their past approvals.
- **Recommendation**:
  - Remove the `UNIQUE KEY unique_user_review (user_id)` constraint from `housing_reviews`.
  - Add an `is_active TINYINT(1) DEFAULT 1` column to `housing_reviews` to track the active evaluation while retaining historical entries.

### 2. Multi-Image Storage Strategy
- **Shelter Photos & Documents**: Shelters require multiple photographs (facilities, play areas) and multiple document uploads (license copies, identification) rather than single image paths.
- **Recommendation**:
  - Replace `shelters.image_path` with a separate relation `shelter_photos`.
  - Replace `shelters.license_path` with a `shelter_documents` table to support multi-page license uploads.

### 3. API Completeness & Push Security
- **Token Deregistration**: To prevent push notifications from leaking to other accounts sharing the same physical device, we must support token deletion.
- **Recommendation**:
  - Add a `DELETE /api/v1/notifications/token` endpoint to unregister push tokens on logout.
- **CRUD Completeness**:
  - Add `PATCH /api/v1/housing-reviews/my` to let users update their answers while in the `pending` state.
  - Add `DELETE /api/v1/housing-reviews/my` to let users withdraw their applications.

### 4. Admin Audit Trails
- **Auditing Accountability**: Administrators must be accountable for approvals and rejections of evaluations and shelters.
- **Recommendation**:
  - Add `reviewed_by INT` (FK referencing `users.id`) and `reviewed_at TIMESTAMP` columns to both `housing_reviews` and `shelters` tables.

---

## Part 2: REST Convention & Index Strategy Optimizations

Following a secondary verification pass, the following refinements are applied to the schema and endpoints to ensure strict compliance with database indices and RESTful API patterns:

### 1. REST Naming & Convention Adjustments
- **Shelter Applications**: Rename `POST /api/v1/shelters/register` to `POST /api/v1/shelters` (creating a shelter resource) and `GET /api/v1/shelters/my` to check status.
- **Admin Approvals**: Rename `PATCH /api/v1/admin/shelters/:userId/status` to `PATCH /api/v1/admin/shelters/:shelterId/status` to query against the shelter resource ID rather than the owner's user ID.
- **Device Registrations**: Rename `POST /api/v1/notifications/token` to `POST /api/v1/devices` and `DELETE /api/v1/notifications/token` to `DELETE /api/v1/devices/:token` for clean resource routing.

### 2. Missing Database Index Additions
- **Admin Status Queries**: Add `INDEX idx_hr_status (status)` to `housing_reviews` and `INDEX idx_shelter_status (status)` to `shelters` to prevent full-table scans when admins load pending queues.
- **Analytics Date Ranges**: Add `INDEX idx_scans_date (scanned_at)` to `pet_scans` to index date range queries (e.g. "Scans in the last 30 days").

---

## Part 3: Final Production Database Schema

```sql
-- 1. Extend users table with preferences JSON column
ALTER TABLE users 
  ADD COLUMN preferences JSON NULL AFTER address;

-- Documented JSON schema for users.preferences:
-- {
--   "quickRole": "adopt" | "lover",
--   "theme": "light" | "dark",
--   "language": "vi" | "en",
--   "pushEnabled": boolean,
--   "emailEnabled": boolean
-- }

-- 2. Dedicated relational table for housing reviews (supporting version history)
CREATE TABLE IF NOT EXISTS housing_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    house_type VARCHAR(50) NOT NULL,
    own_or_rent VARCHAR(20) NOT NULL,
    has_allergies TINYINT(1) DEFAULT 0,
    has_pets TINYINT(1) DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    is_active TINYINT(1) DEFAULT 1, -- Tracks current active review
    admin_notes TEXT NULL,
    reviewed_by INT NULL, -- FK for audit logs
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_hr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_hr_admin FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_hr_user_active (user_id, is_active),
    INDEX idx_hr_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Dedicated relational table for housing review photos
CREATE TABLE IF NOT EXISTS housing_review_photos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    review_id INT NOT NULL,
    image_path VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_hrp_review FOREIGN KEY (review_id) REFERENCES housing_reviews(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Dedicated relational table for shelters (supporting audit logs)
CREATE TABLE IF NOT EXISTS shelters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    admin_notes TEXT NULL,
    reviewed_by INT NULL, -- FK for audit logs
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_shelter_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_shelter_admin FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_user_shelter (user_id),
    INDEX idx_shelter_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Multi-image support for shelters
CREATE TABLE IF NOT EXISTS shelter_photos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shelter_id INT NOT NULL,
    image_path VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sp_shelter FOREIGN KEY (shelter_id) REFERENCES shelters(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Multi-document support for shelter licensing
CREATE TABLE IF NOT EXISTS shelter_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shelter_id INT NOT NULL,
    document_path VARCHAR(500) NOT NULL, -- link to CMND or Giấy phép hoạt động page
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sd_shelter FOREIGN KEY (shelter_id) REFERENCES shelters(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Multi-device push notification token tracking
CREATE TABLE IF NOT EXISTS user_devices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    push_token VARCHAR(255) NOT NULL,
    device_platform VARCHAR(50) NOT NULL,
    last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ud_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_device_token (push_token),
    INDEX idx_user_devices (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Analytics-ready pet scans tracking
CREATE TABLE IF NOT EXISTS pet_scans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    pet_id INT NOT NULL,
    scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    referrer VARCHAR(50) NOT NULL DEFAULT 'collar_qr',
    device_platform VARCHAR(50) NULL,
    scan_location_lat DECIMAL(9,6) NULL,
    scan_location_lng DECIMAL(9,6) NULL,
    CONSTRAINT fk_scans_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_scans_pet FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
    INDEX idx_pet_scanned (pet_id, scanned_at),
    INDEX idx_user_scanned (user_id, scanned_at),
    INDEX idx_scans_date (scanned_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## Part 4: Phased Implementation Roadmap

### Phase 1: Core UX Integration (Critical)
- **Objective**: Complete the date picker, phone validation, dynamic profile completion, and concurrent refresh focus hooks.
- **Complexity**: Low.
- **Risk**: Very Low.

### Phase 2: Relational Vetting & Housing (High)
- **Objective**: Implement `housing_reviews` versioned tables and endpoints, including image upload handlers.
- **Complexity**: Medium.
- **Risk**: Low.

### Phase 3: Multi-Device Notifications & Token Lifecycle (Medium)
- **Objective**: Implement `user_devices` table and registration/deregistration endpoints.
- **Complexity**: Medium.
- **Risk**: Medium.

### Phase 4: Shelters with Multi-Image & Audit Logs (Medium)
- **Objective**: Implement `shelters`, `shelter_photos`, and `shelter_documents` tables with administrative review workflows.
- **Complexity**: High.
- **Risk**: Medium.

---

## Verification Plan

### Automated Tests
- Type checking: `cmd /c "npx tsc --noEmit"`
- Lint checks: `cmd /c "npm run lint"`

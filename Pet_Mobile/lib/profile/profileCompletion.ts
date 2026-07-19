// Centralized pure function for calculating profile completion percentage.
//
// This helper is the single source of truth for scoring profile completeness.
// It has no side effects, no React dependencies, and no API calls.
// All weight values sum to 100.

export type ProfileField =
  | "displayName"
  | "fullName"
  | "email"
  | "emailVerified"
  | "avatar"
  | "birthday"
  | "gender"
  | "phone";

/** Minimal user shape required by the completion calculator. */
export type UserProfileForCompletion = {
  display_name?: string | null;
  name?: string | null;
  email?: string | null;
  verify?: number | null;
  avatar?: string | null;
  birthday?: string | null;
  gender?: string | null;
  phone?: string | null;
};

export interface ProfileCompletionResult {
  percentage: number;
  completed: ProfileField[];
  missing: ProfileField[];
  helperText: {
    title: string;
    description: string;
  };
}

const WEIGHTS: Record<ProfileField, number> = {
  displayName: 10,
  fullName: 15,
  email: 15,
  emailVerified: 15,
  avatar: 15,
  birthday: 10,
  gender: 10,
  phone: 10,
};

const FIELD_LABELS: Record<ProfileField, string> = {
  displayName: "Tên đăng nhập",
  fullName: "Họ tên",
  email: "Email",
  emailVerified: "Xác thực email",
  avatar: "Ảnh đại diện",
  birthday: "Ngày sinh",
  gender: "Giới tính",
  phone: "Số điện thoại",
};

const ALL_FIELDS = Object.keys(WEIGHTS) as ProfileField[];

export function calculateProfileCompletion(
  user: UserProfileForCompletion | null | undefined,
): ProfileCompletionResult {
  if (!user) {
    return {
      percentage: 0,
      completed: [],
      missing: ALL_FIELDS,
      helperText: {
        title: "Hồ sơ chưa hoàn thiện",
        description: "Đăng nhập để bắt đầu hoàn thiện hồ sơ của bạn.",
      },
    };
  }

  const missing: ProfileField[] = [];

  const checks: [ProfileField, boolean][] = [
    ["displayName", !!user.display_name],
    ["fullName", !!user.name],
    ["email", !!user.email],
    ["emailVerified", user.verify === 1],
    ["avatar", !!user.avatar],
    ["birthday", !!user.birthday],
    ["gender", !!user.gender],
    ["phone", !!user.phone],
  ];

  const completed: ProfileField[] = [];
  for (const [field, isComplete] of checks) {
    if (isComplete) {
      completed.push(field);
    } else {
      missing.push(field);
    }
  }

  const percentage = completed.reduce(
    (sum, field) => sum + WEIGHTS[field],
    0,
  );

  const title =
    percentage === 100
      ? "Hồ sơ đã hoàn thiện"
      : "Hồ sơ chưa hoàn thiện";

  const description =
    percentage === 100
      ? "Tuyệt vời! Hồ sơ của bạn đã đầy đủ thông tin."
      : `Còn ${missing.length} mục cần bổ sung: ${missing.map((f) => FIELD_LABELS[f]).join(", ")}.`;

  return {
    percentage,
    completed,
    missing,
    helperText: { title, description },
  };
}

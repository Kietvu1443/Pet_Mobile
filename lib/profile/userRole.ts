export enum UserRole {
  ADMIN = 0,
  STAFF = 1,
  USER = 2,
}

export type QuickRole = "adopt" | "lover";

export function getQuickRoleFromPreferences(
  preferences: { quickRole?: string } | null | undefined,
): QuickRole {
  if (preferences?.quickRole === "lover") return "lover";
  return "adopt";
}

const QUICK_ROLE_LABEL: Record<QuickRole, string> = {
  adopt: "Nhận nuôi",
  lover: "Yêu thú cưng",
};

export function getCurrentRoleLabel(
  userRole: number | undefined | null,
  quickRole: QuickRole,
): string {
  if (userRole === UserRole.ADMIN) return "Admin";
  if (userRole === UserRole.STAFF) return "Staff";
  return QUICK_ROLE_LABEL[quickRole];
}

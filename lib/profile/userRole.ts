// Centralised user role definitions and helpers.
// These values match the frontend role-mapping convention.

export enum UserRole {
  ADMIN = 1,
  USER = 2,
  LOVER = 3,
}

export type QuickRole = "adopt" | "lover";

/** Map a numeric role to a QuickRole. LOVER → "lover", everything else → "adopt". */
export function getQuickRoleFromUserRole(
  role: number | undefined | null,
): QuickRole {
  return role === UserRole.LOVER ? "lover" : "adopt";
}

/** Return a human-readable label for the given role. */
export function getRoleLabel(role: number | undefined | null): string {
  return role === UserRole.ADMIN ? "Admin" : "Nhận nuôi";
}

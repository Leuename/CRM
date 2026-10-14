export const KIOSK_ROLE = "OPERATIONS";

export function isKioskRole(role: string): boolean {
  return role === KIOSK_ROLE;
}

/** The landing route for a role, used after login and by both layout guards. */
export function homePathForRole(role: string): string {
  return isKioskRole(role) ? "/kiosk" : "/dashboard";
}

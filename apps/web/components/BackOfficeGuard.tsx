"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { isKioskRole } from "@/lib/kiosk-role";

export function BackOfficeGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const redirect = isKioskRole(user.role);

  useEffect(() => {
    if (redirect) router.replace("/kiosk");
  }, [redirect, router]);

  if (redirect) return null;
  return <>{children}</>;
}

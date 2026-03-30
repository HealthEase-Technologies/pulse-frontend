"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserRole, USER_ROLES } from "@/hooks/useUserRole";

export default function DashboardPage() {
  const router = useRouter();
  const { role, loading } = useUserRole();

  useEffect(() => {
    if (!loading && role) {
      // Redirect based on user role
      switch (role) {
        case USER_ROLES.PATIENT:
          router.push("/dashboard/patient");
          break;
        case USER_ROLES.PROVIDER:
          router.push("/dashboard/provider");
          break;
        case USER_ROLES.ADMIN:
          router.push("/dashboard/admin");
          break;
        default:
          console.error("Unknown role:", role);
      }
    }
  }, [role, loading, router]);

  return (
    <div className="fixed inset-0 bg-[#070c18] flex flex-col items-center justify-center z-50">
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.18) 0%, transparent 70%)", filter: "blur(60px)" }} />

      {/* Logo mark with pulse ring */}
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-2xl bg-indigo-500/20 animate-ping" style={{ animationDuration: "1.8s" }} />
        <div className="relative w-14 h-14 rounded-2xl bg-white/[0.08] border border-white/20 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-7 h-7">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      <p className="text-white font-semibold text-lg tracking-tight mb-1">Pulse</p>
      <p className="text-white/30 text-sm">Loading your dashboard…</p>
    </div>
  );
}

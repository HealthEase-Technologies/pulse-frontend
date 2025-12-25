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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-gray-600">Redirecting to your dashboard...</p>
      </div>
    );
  }

  // This page should only show briefly while redirecting
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}

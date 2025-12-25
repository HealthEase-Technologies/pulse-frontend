"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserRole, USER_ROLES } from "@/hooks/useUserRole";

export default function RoleProtection({ children, allowedRoles }) {
  const router = useRouter();
  const { role, loading } = useUserRole();

  useEffect(() => {
    if (!loading && role) {
      // Check if user's role is in the allowed roles
      if (!allowedRoles.includes(role)) {
        // Redirect to their correct dashboard
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
            router.push("/dashboard");
        }
      }
    }
  }, [role, loading, allowedRoles, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If role is not allowed, show loading while redirecting
  if (role && !allowedRoles.includes(role)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

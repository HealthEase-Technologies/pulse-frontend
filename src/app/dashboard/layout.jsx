"use client";

import { useAuth } from "@/context/auth-context";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { getCurrentUser } from "@/services/api_calls";

export default function DashboardLayout({ children }) {
  const { checkAuth } = useAuth();
  const pathname = usePathname();
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    checkAuth();
    loadUserRole();
  }, []);

  const loadUserRole = async () => {
    try {
      const user = await getCurrentUser();
      // Map role number to role string
      const roleMap = { 1: "patient", 2: "provider", 3: "admin" };
      setUserRole(roleMap[user.role]);
    } catch (err) {
      console.error("Failed to load user role:", err);
    }
  };

  // Don't show sidebar on the main dashboard redirect page
  const showSidebar = userRole && pathname !== "/dashboard";

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      {showSidebar && <Sidebar userRole={userRole} />}

      {/* Main Content */}
      <div className="flex-1">
        <main className={`${showSidebar ? "p-8" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"}`}>
          {children}
        </main>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, checkOnboardingStatus } from "@/services/api_calls";
import RoleProtection from "@/components/RoleProtection";
import { USER_ROLES } from "@/hooks/useUserRole";

export default function PatientDashboard() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkOnboardingAndLoadInfo();
  }, []);

  const checkOnboardingAndLoadInfo = async () => {
    try {
      // Check onboarding status first
      const onboardingStatus = await checkOnboardingStatus();

      // If onboarding not completed, redirect to onboarding page
      if (!onboardingStatus.completed) {
        router.push("/dashboard/patient/onboarding");
        return;
      }

      // Load user info if onboarding is complete
      const user = await getCurrentUser();
      setUserInfo(user);
    } catch (err) {
      console.error("Failed to load user info:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <RoleProtection allowedRoles={[USER_ROLES.PATIENT]}>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Patient Dashboard</h1>
        <p className="text-gray-600 mb-8">Welcome, {userInfo?.full_name}</p>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Your Dashboard</h2>
            <p className="text-gray-600">Your patient dashboard is ready. More features coming soon!</p>
          </div>
        </div>
      </div>
    </RoleProtection>
  );
}

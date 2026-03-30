"use client";

import { useState, useEffect } from "react";
import { getCurrentUser } from "@/services/api_calls";
import RoleProtection from "@/components/RoleProtection";
import { USER_ROLES } from "@/hooks/useUserRole";

const Field = ({ label, value }) => (
  <div>
    <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-1">{label}</p>
    <p className="text-white/80 text-sm">{value || "—"}</p>
  </div>
);

const Skeleton = () => (
  <div className="animate-pulse space-y-6">
    {[...Array(5)].map((_, i) => (
      <div key={i}>
        <div className="h-3 w-20 bg-white/[0.06] rounded mb-2" />
        <div className="h-4 w-48 bg-white/[0.06] rounded" />
      </div>
    ))}
  </div>
);

export default function ProviderProfile() {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then(setUserInfo)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <RoleProtection allowedRoles={[USER_ROLES.PROVIDER]}>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-1">Provider</p>
          <h1 className="font-[family-name:var(--font-serif)] text-white text-3xl font-bold">My Profile</h1>
          <p className="text-white/40 text-sm mt-1">Your account details.</p>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.07]">
            <p className="text-white text-sm font-semibold">Personal Information</p>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 border border-green-500/20 text-green-400">
              Provider
            </span>
          </div>

          {loading ? (
            <Skeleton />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Field label="Full Name"    value={userInfo?.full_name} />
              <Field label="Email"        value={userInfo?.email} />
              <Field label="Username"     value={userInfo?.username} />
              <Field label="Member Since" value={userInfo?.created_at ? new Date(userInfo.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : null} />
            </div>
          )}
        </div>

      </div>
    </RoleProtection>
  );
}

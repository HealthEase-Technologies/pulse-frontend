"use client";

import { useState, useEffect } from "react";
import { getCurrentUser } from "@/services/api_calls";
import RoleProtection from "@/components/RoleProtection";
import { USER_ROLES } from "@/hooks/useUserRole";

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-1.5">{label}</p>
      <p className="text-sm text-white">{value || "—"}</p>
    </div>
  );
}

export default function AdminProfile() {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => { loadUserInfo(); }, []);

  const loadUserInfo = async () => {
    try {
      const user = await getCurrentUser();
      setUserInfo(user);
    } catch (err) {
      console.error("Failed to load user info:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <RoleProtection allowedRoles={[USER_ROLES.ADMIN]}>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-1">Admin</p>
          <h1 className="font-[family-name:var(--font-serif)] text-white text-3xl font-bold">Profile</h1>
        </div>

        {loading ? (
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 space-y-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-2.5 bg-white/[0.06] rounded w-20 animate-pulse" />
                <div className="h-4 bg-white/[0.04] rounded w-48 animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.07]">
              <p className="text-xs font-semibold text-white/30 uppercase tracking-widest">Personal Information</p>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Full Name"    value={userInfo?.full_name} />
              <Field label="Email"        value={userInfo?.email} />
              <Field label="Username"     value={userInfo?.username} />
              <div>
                <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-1.5">Role</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border bg-purple-500/15 border-purple-500/20 text-purple-400">
                  Admin
                </span>
              </div>
              <Field
                label="Member Since"
                value={userInfo?.created_at ? new Date(userInfo.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : null}
              />
            </div>
          </div>
        )}

      </div>
    </RoleProtection>
  );
}

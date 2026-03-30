"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/services/api_calls";
import RoleProtection from "@/components/RoleProtection";
import { USER_ROLES } from "@/hooks/useUserRole";

const QUICK_LINKS = [
  {
    href: "/dashboard/provider/patient-connection",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    title: "Patients",
    desc: "Manage connections & view patient data",
    color: "indigo",
  },
  {
    href: "/dashboard/provider/reports",
    icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    title: "Reports",
    desc: "Generate & download health reports",
    color: "green",
  },
  {
    href: "/dashboard/provider/license-submission",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    title: "License & Profile",
    desc: "Upload license and update your profile",
    color: "amber",
  },
  {
    href: "/dashboard/provider/profile",
    icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    title: "My Profile",
    desc: "View your account details",
    color: "purple",
  },
];

const COLOR = {
  indigo: { card: "bg-indigo-500/10 border-indigo-500/15", icon: "text-indigo-400", dot: "bg-indigo-400" },
  green:  { card: "bg-green-500/10  border-green-500/15",  icon: "text-green-400",  dot: "bg-green-400"  },
  amber:  { card: "bg-amber-500/10  border-amber-500/15",  icon: "text-amber-400",  dot: "bg-amber-400"  },
  purple: { card: "bg-purple-500/10 border-purple-500/15", icon: "text-purple-400", dot: "bg-purple-400" },
};

export default function ProviderDashboard() {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then(setUserInfo)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <RoleProtection allowedRoles={[USER_ROLES.PROVIDER]}>
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-1">Provider</p>
          {loading ? (
            <div className="h-9 bg-white/[0.06] rounded-xl w-64 animate-pulse" />
          ) : (
            <h1 className="font-[family-name:var(--font-serif)] text-white text-3xl font-bold">
              Welcome back, {userInfo?.full_name?.split(" ")[0] || "Doctor"}
            </h1>
          )}
          <p className="text-white/40 text-sm mt-1">Here's your provider workspace.</p>
        </div>

        {/* Quick links grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {QUICK_LINKS.map((item) => {
            const c = COLOR[item.color];
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-start gap-4 p-5 rounded-2xl border ${c.card} hover:brightness-125 transition-all duration-150`}
              >
                <div className={`w-10 h-10 rounded-xl ${c.card} flex items-center justify-center flex-shrink-0`}>
                  <svg className={`w-5 h-5 ${c.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={item.icon} />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-semibold">{item.title}</p>
                  <p className="text-white/40 text-xs mt-0.5">{item.desc}</p>
                </div>
                <svg className="w-4 h-4 text-white/20 group-hover:text-white/40 ml-auto flex-shrink-0 mt-0.5 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            );
          })}
        </div>

      </div>
    </RoleProtection>
  );
}

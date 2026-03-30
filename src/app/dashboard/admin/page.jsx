"use client";

import { useState, useEffect } from "react";
import { getCurrentUser, getAllProviders, getAllUsersAdmin } from "@/services/api_calls";
import RoleProtection from "@/components/RoleProtection";
import { USER_ROLES } from "@/hooks/useUserRole";
import Link from "next/link";

function StatCard({ label, value, loading, icon, color }) {
  const colors = {
    indigo: { bg: "bg-indigo-500/10", border: "border-indigo-500/20", icon: "text-indigo-400", glow: "rgba(99,102,241,0.15)" },
    green:  { bg: "bg-green-500/10",  border: "border-green-500/20",  icon: "text-green-400",  glow: "rgba(34,197,94,0.12)"  },
    amber:  { bg: "bg-amber-500/10",  border: "border-amber-500/20",  icon: "text-amber-400",  glow: "rgba(245,158,11,0.12)" },
  };
  const c = colors[color] || colors.indigo;

  if (loading) {
    return (
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/[0.05] animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-white/[0.06] rounded-lg w-24 animate-pulse" />
            <div className="h-7 bg-white/[0.06] rounded-lg w-16 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none"
        style={{ background: `radial-gradient(circle at top right, ${c.glow}, transparent 70%)` }} />
      <div className="flex items-center gap-4 relative z-10">
        <div className={`w-12 h-12 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center flex-shrink-0`}>
          <svg className={`w-5 h-5 ${c.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={icon} />
          </svg>
        </div>
        <div>
          <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-0.5">{label}</p>
          <p className="text-white text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [userInfo, setUserInfo]   = useState(null);
  const [stats, setStats]         = useState({ providers: 0, users: 0, pendingLicenses: 0 });
  const [loading, setLoading]     = useState(true);

  useEffect(() => { loadDashboardData(); }, []);

  const loadDashboardData = async () => {
    try {
      const [user, providersData, usersData] = await Promise.all([
        getCurrentUser(), getAllProviders(), getAllUsersAdmin()
      ]);
      setUserInfo(user);
      const pending = providersData.providers?.filter(p => p.license_status === "pending").length || 0;
      setStats({ providers: providersData.total || 0, users: usersData.total || 0, pendingLicenses: pending });
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <RoleProtection allowedRoles={[USER_ROLES.ADMIN]}>
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-1">Admin</p>
          <h1 className="font-[family-name:var(--font-serif)] text-white text-3xl font-bold">Dashboard</h1>
          <p className="text-white/40 text-sm mt-1">
            Welcome back, <span className="text-white/70">{userInfo?.full_name || "Admin"}</span>
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard label="Total Users"      value={stats.users}           loading={loading} color="indigo"
            icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          <StatCard label="Total Providers"  value={stats.providers}       loading={loading} color="green"
            icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          <StatCard label="Pending Licenses" value={stats.pendingLicenses} loading={loading} color="amber"
            icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </div>

        {/* Quick Actions */}
        <p className="text-white/25 text-[11px] font-semibold uppercase tracking-widest mb-3">Quick Actions</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              href: "/dashboard/admin/providers",
              title: "Manage Providers",
              desc: "Review and approve provider medical licences",
              icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
              badge: stats.pendingLicenses > 0 ? `${stats.pendingLicenses} pending` : null,
            },
            {
              href: "/dashboard/admin/users",
              title: "Manage Users",
              desc: "View all registered users in the system",
              icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
              badge: null,
            },
          ].map((action) => (
            <Link key={action.href} href={action.href}
              className="group bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                    <svg className="w-4.5 h-4.5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={action.icon} />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-white text-sm font-semibold">{action.title}</h3>
                      {action.badge && (
                        <span className="bg-amber-500/15 border border-amber-500/25 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {action.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-white/35 text-xs">{action.desc}</p>
                  </div>
                </div>
                <svg className="w-4 h-4 text-white/20 group-hover:text-white/40 group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </RoleProtection>
  );
}

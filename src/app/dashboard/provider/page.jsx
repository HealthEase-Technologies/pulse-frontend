"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  getCurrentUser,
  getPatientToHCP,
} from "@/services/api_calls";
import RoleProtection from "@/components/RoleProtection";
import { USER_ROLES } from "@/hooks/useUserRole";

const fmtDate = (ts) => {
  if (!ts) return "—";
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

export default function ProviderDashboard() {
  const [userInfo,     setUserInfo]     = useState(null);
  const [connections,  setConnections]  = useState([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    Promise.allSettled([
      getCurrentUser(),
      getPatientToHCP(),
    ]).then(([user, conns]) => {
      if (user.status  === "fulfilled") setUserInfo(user.value);
      if (conns.status === "fulfilled") {
        const list = conns.value?.requests || conns.value || [];
        setConnections(Array.isArray(list) ? list : []);
      }
      setLoading(false);
    });
  }, []);

  const accepted = connections.filter((c) => c.status === "accepted");
  const pending  = connections.filter((c) => c.status === "pending");
  const recent   = [...accepted].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);

  // Patients with unread notes (is_read false on any note, proxied via connection flag if available)
  const needsAttention = accepted.filter((c) => c.has_unread_notes || c.unread_notes_count > 0);

  const STAT_CARDS = [
    {
      label: "Total Patients",
      value: accepted.length,
      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
      color: "indigo",
      href: "/dashboard/provider/patient-connection",
    },
    {
      label: "Pending Requests",
      value: pending.length,
      icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
      color: "amber",
      href: "/dashboard/provider/patient-connection",
    },
    {
      label: "Accepted This Week",
      value: accepted.filter((c) => { const d = new Date(c.created_at); return (Date.now() - d) < 7 * 86400000; }).length,
      icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
      color: "green",
      href: "/dashboard/provider/patient-connection",
    },
    {
      label: "Needs Attention",
      value: needsAttention.length,
      icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
      color: "rose",
      href: "/dashboard/provider/patient-connection",
    },
  ];

  const COLOR = {
    indigo: { bg: "bg-indigo-500/10 border-indigo-500/20", text: "text-indigo-400", dot: "bg-indigo-400" },
    amber:  { bg: "bg-amber-500/10  border-amber-500/20",  text: "text-amber-400",  dot: "bg-amber-400"  },
    red:    { bg: "bg-red-500/10    border-red-500/20",    text: "text-red-400",    dot: "bg-red-400"    },
    rose:   { bg: "bg-rose-500/10   border-rose-500/20",   text: "text-rose-400",   dot: "bg-rose-400"   },
    green:  { bg: "bg-green-500/10  border-green-500/20",  text: "text-green-400",  dot: "bg-green-400"  },
  };

  const QUICK_LINKS = [
    { href: "/dashboard/provider/patient-connection", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", label: "Patients", color: "indigo" },
    { href: "/dashboard/provider/patient-recommendation", icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z", label: "Recommendations", color: "green" },
    { href: "/dashboard/provider/license-submission", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", label: "License", color: "amber" },
    { href: "/dashboard/provider/profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", label: "Profile", color: "indigo" },
  ];

  return (
    <RoleProtection allowedRoles={[USER_ROLES.PROVIDER]}>
      <div className="max-w-5xl mx-auto pb-10 space-y-8">

        {/* Header */}
        <div>
          <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-1">Provider Dashboard</p>
          {loading ? (
            <div className="h-9 bg-white/[0.06] rounded-xl w-64 animate-pulse" />
          ) : (
            <h1 className="font-[family-name:var(--font-serif)] text-white text-3xl font-bold">
              Welcome back, {userInfo?.full_name?.split(" ")[0] || "Doctor"}
            </h1>
          )}
          <p className="text-white/35 text-sm mt-1">Here's your practice at a glance.</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STAT_CARDS.map((s) => {
            const c = COLOR[s.color];
            return (
              <Link key={s.label} href={s.href}
                className={`group rounded-2xl border p-4 flex flex-col gap-3 hover:brightness-125 transition-all ${c.bg}`}>
                <div className={`w-8 h-8 rounded-xl ${c.bg} flex items-center justify-center`}>
                  <svg className={`w-4 h-4 ${c.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={s.icon} />
                  </svg>
                </div>
                {loading ? (
                  <div className="h-7 w-12 bg-white/10 rounded animate-pulse" />
                ) : (
                  <p className={`text-2xl font-bold ${c.text}`}>{s.value}</p>
                )}
                <p className="text-white/35 text-xs">{s.label}</p>
              </Link>
            );
          })}
        </div>

        <div className="grid md:grid-cols-2 gap-6">

          {/* Recently connected patients */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-white/60 text-sm font-semibold">Recently Connected</p>
              <Link href="/dashboard/provider/patient-connection" className="text-indigo-400 text-xs hover:text-indigo-300 transition-colors">View all →</Link>
            </div>
            {loading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-white/[0.04] rounded-xl animate-pulse" />)}</div>
            ) : recent.length === 0 ? (
              <p className="text-white/25 text-sm text-center py-4">No connected patients yet.</p>
            ) : (
              <ul className="space-y-2">
                {recent.map((c) => (
                  <li key={c.patient_id || c.id}>
                    <Link
                      href={c.patient_user_id ? `/dashboard/provider/patient-connection/${c.patient_user_id}` : "/dashboard/provider/patient-connection"}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors group"
                    >
                      <div className="w-7 h-7 rounded-full bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-indigo-400 text-xs font-bold">{(c.patient_name || c.full_name || "P")[0].toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/70 text-sm font-medium truncate">{c.patient_name || c.full_name || "Patient"}</p>
                        <p className="text-white/25 text-xs">Connected {fmtDate(c.created_at)}</p>
                      </div>
                      <svg className="w-3.5 h-3.5 text-white/15 group-hover:text-white/35 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Pending requests */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-white/60 text-sm font-semibold">Pending Requests</p>
              {!loading && pending.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
                  {pending.length} new
                </span>
              )}
            </div>
            {loading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-white/[0.04] rounded-xl animate-pulse" />)}</div>
            ) : (() => {
              const allPending = pending.slice(0, 5);
              return allPending.length === 0 ? (
                <p className="text-white/25 text-sm text-center py-4">No pending requests.</p>
              ) : (
                <ul className="space-y-2">
                  {allPending.map((r, i) => (
                    <li key={r.id || i}>
                      <Link
                        href="/dashboard/provider/patient-connection"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors group"
                      >
                        <div className="w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/15 flex items-center justify-center flex-shrink-0">
                          <span className="text-amber-400 text-xs font-bold">{(r.patient_name || r.full_name || "P")[0].toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white/70 text-sm font-medium truncate">{r.patient_name || r.full_name || "Patient"}</p>
                          <p className="text-white/25 text-xs">Requested {fmtDate(r.created_at)}</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/15 text-amber-400 flex-shrink-0">Pending</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              );
            })()}
          </div>

          {/* Patients needing attention (unread notes) */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-white/60 text-sm font-semibold">Unread Notes</p>
              <svg className="w-4 h-4 text-rose-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            {loading ? (
              <div className="space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="h-10 bg-white/[0.04] rounded-xl animate-pulse" />)}</div>
            ) : needsAttention.length === 0 ? (
              <div className="flex flex-col items-center py-4 gap-2">
                <svg className="w-6 h-6 text-green-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-white/25 text-sm">All notes read.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {needsAttention.slice(0, 5).map((c) => (
                  <li key={c.patient_id || c.id}>
                    <Link
                      href={c.patient_user_id ? `/dashboard/provider/patient-connection/${c.patient_user_id}` : "/dashboard/provider/patient-connection"}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors group"
                    >
                      <div className="w-2 h-2 rounded-full bg-rose-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white/70 text-sm font-medium truncate">{c.patient_name || c.full_name || "Patient"}</p>
                        {c.unread_notes_count > 0 && <p className="text-white/25 text-xs">{c.unread_notes_count} unread note{c.unread_notes_count > 1 ? "s" : ""}</p>}
                      </div>
                      <svg className="w-3.5 h-3.5 text-white/15 group-hover:text-white/35 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Quick links */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 space-y-4">
            <p className="text-white/60 text-sm font-semibold">Quick Links</p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_LINKS.map((item) => {
                const c = COLOR[item.color];
                return (
                  <Link key={item.href} href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border ${c.bg} hover:brightness-125 transition-all`}>
                    <svg className={`w-4 h-4 ${c.text} flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={item.icon} />
                    </svg>
                    <span className="text-white/60 text-xs font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </RoleProtection>
  );
}

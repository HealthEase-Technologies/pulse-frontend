"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useState, useEffect } from "react";

function LogoMark() {
  return (
    <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/10 border border-white/[0.15] flex-shrink-0">
      <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth={2.5} className="w-4 h-4">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function NavIcon({ d }) {
  return (
    <svg className="w-[17px] h-[17px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
    </svg>
  );
}

function HamburgerIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

const PATIENT_ITEMS = [
  { name: "Dashboard",      href: "/dashboard/patient",                icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", group: null },
  { name: "My Goals",       href: "/dashboard/patient/goals",          icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", group: "Health" },
  { name: "Biomarkers",     href: "/dashboard/patient/biomarkers",     icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", group: "Health" },
  { name: "Thresholds",     href: "/dashboard/patient/thresholds",     icon: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4", group: "Health" },
  { name: "Alerts",         href: "/dashboard/patient/alerts",         icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9", group: "Health" },
  { name: "Devices",        href: "/dashboard/patient/devices",        icon: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z", group: "Tracking" },
  { name: "Reports",        href: "/dashboard/patient/reports",        icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", group: "Tracking" },
  { name: "HCP Directory",  href: "/dashboard/patient/hcp-directory",  icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z", group: "Care" },
  { name: "Provider Notes", href: "/dashboard/patient/provider-notes", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", group: "Care" },
  { name: "AI Insights",    href: "/dashboard/patient/recommendations", icon: "M13 10V3L4 14h7v7l9-11h-7z", group: "AI" },
  { name: "AI Chat",        href: "/dashboard/patient/chat",           icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z", group: "AI" },
  { name: "My Pet",         href: "/dashboard/patient/pet",            icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z", group: "Me" },
  { name: "Profile",        href: "/dashboard/patient/profile",        icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", group: "Me" },
];

const PROVIDER_ITEMS = [
  { name: "Dashboard",            href: "/dashboard/provider",                    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { name: "License Verification", href: "/dashboard/provider/license-submission", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { name: "Patients",             href: "/dashboard/provider/patient-connection", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
  { name: "Profile",              href: "/dashboard/provider/profile",             icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
];

const ADMIN_ITEMS = [
  { name: "Dashboard", href: "/dashboard/admin",           icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { name: "Providers",  href: "/dashboard/admin/providers", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
  { name: "All Users",  href: "/dashboard/admin/users",     icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
  { name: "Profile",    href: "/dashboard/admin/profile",   icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
];

export default function Sidebar({ userRole }) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const allItems =
    userRole === "patient"  ? PATIENT_ITEMS  :
    userRole === "provider" ? PROVIDER_ITEMS :
    userRole === "admin"    ? ADMIN_ITEMS    : [];

  const isActive = (item) =>
    pathname === item.href ||
    (item.href !== `/dashboard/${userRole}` && pathname.startsWith(item.href));

  const roleBadgeCls =
    userRole === "admin"    ? "bg-purple-500/10 text-purple-400 border-purple-500/15" :
    userRole === "provider" ? "bg-green-500/10  text-green-400  border-green-500/15"  :
                              "bg-indigo-500/10 text-indigo-400 border-indigo-500/15";

  const renderNavItem = (item) => {
    const active = isActive(item);
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          title={collapsed ? item.name : undefined}
          className={`flex items-center gap-3 px-3 py-[9px] rounded-xl text-[13px] font-medium transition-colors duration-100 border
            ${active
              ? "bg-indigo-500/10 text-white/90 border-indigo-500/15"
              : "text-white/40 hover:text-white/70 hover:bg-white/[0.04] border-transparent"
            }
            ${collapsed ? "md:justify-center" : ""}
          `}
        >
          <NavIcon d={item.icon} />
          <span className={`truncate ${collapsed ? "md:hidden" : ""}`}>{item.name}</span>
          {active && (
            <span className={`ml-auto w-1 h-1 rounded-full bg-indigo-400 flex-shrink-0 ${collapsed ? "md:hidden" : ""}`} />
          )}
        </Link>
      </li>
    );
  };

  const renderItems = () => {
    if (userRole !== "patient") return allItems.map(renderNavItem);

    const result = [];
    let lastGroup = undefined;
    for (const item of allItems) {
      if (item.group !== lastGroup) {
        lastGroup = item.group;
        if (item.group) {
          result.push(
            <li key={`grp-${item.group}`} className={`pt-4 pb-0.5 px-3 ${collapsed ? "md:hidden" : ""}`}>
              <p className="text-[9px] font-semibold text-white/20 uppercase tracking-[0.12em]">{item.group}</p>
            </li>
          );
        }
      }
      result.push(renderNavItem(item));
    }
    return result;
  };

  return (
    <>
      {/* Mobile backdrop — always rendered, fades in/out */}
      <div
        className={`md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-250
          ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* ── Sidebar ── */}
      {/* Mobile: fixed overlay; Desktop: sticky full-height column */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          md:sticky md:top-0 md:h-screen md:z-auto
          flex flex-col flex-shrink-0
          bg-[#070b18] border-r border-white/[0.055]
          transition-transform duration-200 ease-out md:transition-none
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          ${collapsed ? "md:w-[60px]" : "md:w-[210px]"} w-[210px]
        `}
      >
        {/* Header: logo + hamburger/close toggle */}
        <div className={`flex items-center h-[56px] border-b border-white/[0.05] flex-shrink-0 px-3 gap-2
          ${collapsed ? "md:justify-center" : "justify-between"}`}
        >
          <Link href="/dashboard" className="flex items-center gap-2 min-w-0 overflow-hidden">
            <LogoMark />
            <span className={`text-white font-bold text-[14px] tracking-tight ${collapsed ? "md:hidden" : ""}`}>
              Pulse
            </span>
          </Link>

          {/* Desktop: hamburger toggles collapsed ↔ expanded */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`hidden md:flex w-8 h-8 rounded-xl items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-all flex-shrink-0
              ${collapsed ? "md:hidden" : ""}`}
            title="Collapse sidebar"
          >
            <HamburgerIcon />
          </button>

          {/* Mobile: X to close overlay */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden w-8 h-8 rounded-xl flex items-center justify-center text-white/35 hover:text-white/65 hover:bg-white/[0.05] transition-all flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Role badge */}
        <div className={`px-3 pt-3 pb-0.5 ${collapsed ? "md:hidden" : ""}`}>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${roleBadgeCls}`}>
            {userRole}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-1.5 overflow-y-auto min-h-0">
          <ul className="space-y-0.5">
            {renderItems()}
          </ul>
        </nav>

        {/* Expand button — desktop collapsed state only */}
        {collapsed && (
          <div className="hidden md:flex px-2 pb-1 justify-center">
            <button
              onClick={() => setCollapsed(false)}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white/35 hover:text-white/65 hover:bg-white/[0.05] transition-all"
              title="Expand sidebar"
            >
              <HamburgerIcon />
            </button>
          </div>
        )}

        {/* Sign out */}
        <div className="px-2 py-3 border-t border-white/[0.05] flex-shrink-0">
          <button
            onClick={logout}
            title={collapsed ? "Sign Out" : undefined}
            className={`w-full flex items-center gap-3 px-3 py-[9px] text-white/45 hover:text-white/75 hover:bg-white/[0.04] rounded-xl text-[13px] font-medium transition-colors border border-transparent
              ${collapsed ? "md:justify-center" : ""}`}
          >
            <svg className="w-[17px] h-[17px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className={collapsed ? "md:hidden" : ""}>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile hamburger — always rendered, fades out when sidebar opens */}
      <button
        onClick={() => setMobileOpen(true)}
        className={`md:hidden fixed top-[14px] left-4 z-30 w-8 h-8 rounded-xl bg-[#070b18] border border-white/[0.12] flex items-center justify-center text-white/50 hover:text-white/80 transition-all duration-200
          ${mobileOpen ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        aria-label="Open menu"
      >
        <HamburgerIcon />
      </button>
    </>
  );
}

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AreaChart, Area, LineChart, Line, ResponsiveContainer,
  CartesianGrid, XAxis, YAxis, Tooltip,
} from "recharts";
import {
  getCurrentUser, checkOnboardingStatus,
  getAllBiomarkers, getBiomarkerHistory, getAlertHistory,
  getActiveRecommendations, getHealthScore, getMyDevices,
  initializeDailyGoals, getGoalCompletions, getPatientProfile,
} from "@/services/api_calls";
import RoleProtection from "@/components/RoleProtection";
import { USER_ROLES } from "@/hooks/useUserRole";

/* ─── constants ──────────────────────────────────────────────────── */
const BIO_META = {
  heart_rate:               { label: "Heart Rate",          unit: "bpm",   color: "#f87171", stroke: "#ef4444" },
  blood_pressure_systolic:  { label: "BP Systolic",         unit: "mmHg",  color: "#fb923c", stroke: "#f97316" },
  blood_pressure_diastolic: { label: "BP Diastolic",        unit: "mmHg",  color: "#fbbf24", stroke: "#f59e0b" },
  glucose:                  { label: "Glucose",             unit: "mg/dL", color: "#34d399", stroke: "#10b981" },
  steps:                    { label: "Steps",               unit: "steps", color: "#60a5fa", stroke: "#3b82f6" },
  sleep:                    { label: "Sleep",               unit: "hrs",   color: "#a78bfa", stroke: "#8b5cf6" },
};

const STATUS_CLS = {
  normal:  "bg-green-500/10 border-green-500/20 text-green-400",
  low:     "bg-amber-500/10 border-amber-500/20 text-amber-400",
  high:    "bg-red-500/10   border-red-500/20   text-red-400",
  warning: "bg-amber-500/10 border-amber-500/20 text-amber-400",
};

const QUICK_LINKS = [
  { href: "/dashboard/patient/biomarkers",      label: "Biomarkers",     icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  { href: "/dashboard/patient/goals",           label: "Goals",          icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
  { href: "/dashboard/patient/ai-recommendations", label: "AI Recs",    icon: "M13 10V3L4 14h7v7l9-11h-7z" },
  { href: "/dashboard/patient/alerts",          label: "Alerts",         icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" },
  { href: "/dashboard/patient/thresholds",      label: "Thresholds",     icon: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" },
  { href: "/dashboard/patient/devices",         label: "Devices",        icon: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" },
  { href: "/dashboard/patient/hcp-directory",   label: "Find Provider",  icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  { href: "/dashboard/patient/reports",         label: "Reports",        icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { href: "/dashboard/patient/pet",             label: "My Pet",         icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" },
];

/* ─── helpers ────────────────────────────────────────────────────── */
const fmt = (type, val) => {
  if (val == null) return "--";
  return type === "steps" ? Math.round(Number(val)).toLocaleString() : Number(val).toFixed(1);
};
const fmtTime = (ts) => {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};
const fmtTs = (ts) => {
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleTimeString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};

const prettifyDevice = (raw) => {
  if (!raw || raw === "manual") return "Manual";
  return String(raw).replace(/[_.-]+/g, " ").split(" ").filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
};

const computeBiomarkersFromReadings = (readings, selected) => {
  // selected is an array of device UUIDs + "manual" + "all"
  const all = selected.includes("all") || selected.length === 0;
  let list;
  if (all) {
    list = readings;
  } else {
    const deviceIds = selected.filter((s) => s !== "manual" && s !== "all");
    list = readings.filter((r) => {
      if (selected.includes("manual") && r.source === "manual") return true;
      if (deviceIds.length > 0 && r.source === "device") {
        // match by device_id; if reading has no device_id, include when any device filter active
        if (!r.device_id || deviceIds.includes(r.device_id)) return true;
      }
      return false;
    });
  }
  const map  = new Map();
  list.forEach((r) => {
    if (!r.biomarker_type) return;
    const ts = new Date(r.recorded_at || 0).getTime();
    if (!map.has(r.biomarker_type) || ts > map.get(r.biomarker_type).ts)
      map.set(r.biomarker_type, { ...r, ts });
  });
  return Array.from(map.values());
};

/* ─── sub-components ─────────────────────────────────────────────── */
function DarkTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0a0f1e] border border-white/[0.12] rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-white/40 mb-1">{fmtTs(label)}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value} {unit || ""}
        </p>
      ))}
    </div>
  );
}

function Sparkline({ data, color }) {
  if (!data?.length) return <div className="h-10 flex items-center justify-center text-white/15 text-xs">No data</div>;
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function StatCard({ label, value, sub, color = "indigo" }) {
  const palette = {
    indigo: "from-indigo-500/10 to-indigo-500/5 border-indigo-500/15 text-indigo-400",
    green:  "from-green-500/10 to-green-500/5 border-green-500/15 text-green-400",
    amber:  "from-amber-500/10 to-amber-500/5 border-amber-500/15 text-amber-400",
    red:    "from-red-500/10 to-red-500/5 border-red-500/15 text-red-400",
  };
  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-4 ${palette[color]}`}>
      <p className="text-xs uppercase tracking-widest font-semibold text-white/30 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${palette[color].split(" ").pop()}`}>{value}</p>
      {sub && <p className="text-white/30 text-xs mt-0.5">{sub}</p>}
    </div>
  );
}

/* ─── main page ──────────────────────────────────────────────────── */
export default function PatientDashboard() {
  const router = useRouter();

  const [user,          setUser]          = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [biomarkers,    setBiomarkers]    = useState([]);
  const [bioLoading,    setBioLoading]    = useState(true);
  const [sparklines,    setSparklines]    = useState({});
  const [goalTotal,     setGoalTotal]     = useState(0);
  const [goalDone,      setGoalDone]      = useState(0);
  const [alerts,        setAlerts]        = useState([]);
  const [recs,          setRecs]          = useState([]);
  const [healthScore,   setHealthScore]   = useState(null);
  const [expanded,      setExpanded]      = useState(null); // expanded biomarker chart
  const [chartData,     setChartData]     = useState([]);
  const [chartLoading,  setChartLoading]  = useState(false);
  const [bioSrcFilter,    setBioSrcFilter]    = useState(["all"]);
  const [myDevices,       setMyDevices]       = useState([]);
  const allReadingsRef = useRef([]);

  /* initial load */
  useEffect(() => {
    (async () => {
      try {
        const status = await checkOnboardingStatus();
        if (!status.completed) { router.push("/dashboard/patient/onboarding"); return; }
        const u = await getCurrentUser();
        setUser(u);
      } catch (_) {}
      finally { setLoading(false); }
    })();
  }, []);

  /* parallel data load */
  useEffect(() => {
    (async () => {
      await initializeDailyGoals().catch(() => {});
      const today = new Date().toISOString().slice(0, 10);
      const [, profileRes, completionsRes, alertRes, recRes, scoreRes, devRes] = await Promise.allSettled([
        loadBiomarkers(),
        getPatientProfile().catch(() => null),
        getGoalCompletions(today, today).catch(() => null),
        getAlertHistory({ limit: 5, page: 1 }).catch(() => null),
        getActiveRecommendations().catch(() => null),
        getHealthScore().catch(() => null),
        getMyDevices().catch(() => []),
      ]);
      if (profileRes.status === "fulfilled") {
        const goals = profileRes.value?.health_goals || [];
        setGoalTotal(Array.isArray(goals) ? goals.length : 0);
      }
      if (completionsRes.status === "fulfilled") {
        const list = Array.isArray(completionsRes.value)
          ? completionsRes.value
          : completionsRes.value?.completions || [];
        setGoalDone(list.filter((c) => c.status === "completed").length);
      }
      if (alertRes.status === "fulfilled") {
        const list = Array.isArray(alertRes.value) ? alertRes.value : alertRes.value?.alerts || [];
        setAlerts(list.slice(0, 5));
      }
      if (recRes.status === "fulfilled") {
        const list = Array.isArray(recRes.value) ? recRes.value : recRes.value?.recommendations || [];
        setRecs(list.slice(0, 3));
      }
      if (scoreRes.status === "fulfilled" && scoreRes.value?.score != null) setHealthScore(scoreRes.value.score);
      if (devRes.status === "fulfilled") {
        const devList = Array.isArray(devRes.value) ? devRes.value : devRes.value?.devices || [];
        setMyDevices(devList);
      }
    })();
  }, []);

  const loadBiomarkers = useCallback(async () => {
    setBioLoading(true);
    try {
      const all = await getAllBiomarkers({ limit: 500 });
      const rawList = Array.isArray(all) ? all : [];
      allReadingsRef.current = rawList;
      setBioSrcFilter(["all"]);
      const items = computeBiomarkersFromReadings(rawList, ["all"]);
      setBiomarkers(items);
      /* load sparklines in background */
      items.forEach(async (b) => {
        try {
          const raw = await getBiomarkerHistory(b.biomarker_type, { limit: 20 });
          const list = Array.isArray(raw) ? raw : [];
          const pts = list
            .filter((r) => r.value != null)
            .map((r) => ({ ts: new Date(r.recorded_at || 0).getTime(), v: Number(r.value) }))
            .filter((p) => Number.isFinite(p.ts) && Number.isFinite(p.v))
            .sort((a, b) => a.ts - b.ts)
            .slice(-15);
          setSparklines((prev) => ({ ...prev, [b.biomarker_type]: pts }));
        } catch (_) {}
      });
    } catch (_) {} finally { setBioLoading(false); }
  }, []);

  const handleBioSrcFilter = (src) => {
    const prev = Array.isArray(bioSrcFilter) ? bioSrcFilter : ["all"];
    let next;
    if (src === "all") {
      next = ["all"];
    } else {
      const without = prev.filter((s) => s !== "all");
      next = without.includes(src) ? without.filter((s) => s !== src) : [...without, src];
      if (next.length === 0) next = ["all"];
    }
    setBioSrcFilter(next);
    setBiomarkers(computeBiomarkersFromReadings(allReadingsRef.current, next));
  };

  const openExpanded = useCallback(async (type) => {
    if (expanded === type) { setExpanded(null); return; }
    setExpanded(type);
    setChartLoading(true);
    setChartData([]);
    try {
      const raw = await getBiomarkerHistory(type, { limit: 200 });
      const list = Array.isArray(raw) ? raw : [];
      const cutoff = Date.now() - 7 * 86400000;
      const pts = list
        .filter((r) => new Date(r.recorded_at || 0).getTime() >= cutoff)
        .map((r) => ({ ts: new Date(r.recorded_at || 0).getTime(), v: Number(r.value) }))
        .filter((p) => Number.isFinite(p.ts) && Number.isFinite(p.v))
        .sort((a, b) => a.ts - b.ts);
      setChartData(pts);
    } catch (_) {} finally { setChartLoading(false); }
  }, [expanded]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin" />
    </div>
  );

  const unackAlerts = alerts.filter((a) => !a.acknowledged_at).length;
  const todayGoals  = goalTotal;
  const doneGoals   = goalDone;
  const goalPct     = todayGoals > 0 ? Math.round((doneGoals / todayGoals) * 100) : 0;
  const firstName   = user?.full_name?.split(" ")[0] || "there";

  return (
    <RoleProtection allowedRoles={[USER_ROLES.PATIENT]}>
      <div className="max-w-7xl mx-auto pb-10 space-y-8">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-[family-name:var(--font-serif)] text-white text-3xl font-bold">
              Good to see you, {firstName}
            </h1>
            <p className="text-white/40 text-sm mt-1">Here's your health at a glance.</p>
          </div>
          <button
            onClick={loadBiomarkers}
            disabled={bioLoading}
            className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.07] text-white/40 text-sm hover:bg-white/[0.07] hover:text-white/60 transition-colors disabled:opacity-40"
          >
            {bioLoading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {/* ── Stat row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Health Score"
            value={healthScore != null ? `${healthScore}` : "--"}
            sub="Overall wellness"
            color="indigo"
          />
          <StatCard
            label="Daily Goals"
            value={todayGoals > 0 ? `${goalPct}%` : "--"}
            sub={todayGoals > 0 ? `${doneGoals} / ${todayGoals} complete` : "No goals today"}
            color={goalPct >= 80 ? "green" : goalPct >= 40 ? "amber" : "red"}
          />
          <StatCard
            label="Unread Alerts"
            value={unackAlerts}
            sub={unackAlerts === 0 ? "All clear" : "Needs attention"}
            color={unackAlerts === 0 ? "green" : "red"}
          />
          <StatCard
            label="Active Recs"
            value={recs.length}
            sub="AI recommendations"
            color="indigo"
          />
        </div>

        {/* ── Biomarker cards ── */}
        <div>
          <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-white/70 text-sm font-semibold">Biomarkers</h2>
              {myDevices.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {[{ value: "all", label: "All" }, { value: "manual", label: "Manual" },
                    ...myDevices.map((d) => ({ value: d.id, label: d.device_name || d.display_name || prettifyDevice(d.device_type) }))
                  ].map(({ value, label }) => (
                    <button key={value} onClick={() => handleBioSrcFilter(value)}
                      className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${bioSrcFilter.includes(value) ? "bg-indigo-500/15 border-indigo-500/25 text-indigo-300" : "border-white/[0.07] text-white/35 hover:border-white/20 hover:text-white/55"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Link href="/dashboard/patient/biomarkers" className="text-indigo-400 text-xs hover:text-indigo-300 transition-colors">
              View all →
            </Link>
          </div>
          {bioLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-28 rounded-2xl bg-white/[0.03] border border-white/[0.05] animate-pulse" />
              ))}
            </div>
          ) : biomarkers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/[0.1] p-8 text-center text-white/25 text-sm">
              No biomarker data yet.{" "}
              <Link href="/dashboard/patient/devices" className="text-indigo-400 hover:underline">Connect a device</Link> to get started.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {biomarkers.map((b) => {
                const meta   = BIO_META[b.biomarker_type] || { label: b.biomarker_type, unit: b.unit || "", color: "#818cf8", stroke: "#6366f1" };
                const isOpen = expanded === b.biomarker_type;
                const spark  = sparklines[b.biomarker_type] || [];
                const sCls   = STATUS_CLS[b.status] || STATUS_CLS.normal;

                return (
                  <div key={b.biomarker_type} className={`rounded-2xl border bg-white/[0.03] hover:bg-white/[0.05] transition-colors overflow-hidden ${isOpen ? "border-white/15" : "border-white/[0.07]"}`}>
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-white/40 text-xs uppercase tracking-widest">{meta.label}</p>
                        {b.status && (
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${sCls}`}>
                            {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <span className="text-3xl font-bold text-white/90" style={{ color: meta.color }}>
                            {fmt(b.biomarker_type, b.value)}
                          </span>
                          <span className="text-white/35 text-sm ml-1.5">{meta.unit}</span>
                        </div>
                        <span className="text-white/25 text-xs">{fmtTime(b.recorded_at)}</span>
                      </div>
                    </div>

                    {/* Sparkline row */}
                    <div className="px-4 pb-2">
                      <Sparkline data={spark} color={meta.stroke} />
                    </div>

                    {/* Expand button */}
                    <button
                      onClick={() => openExpanded(b.biomarker_type)}
                      className="w-full px-4 py-2 border-t border-white/[0.05] text-white/30 text-xs hover:text-white/50 hover:bg-white/[0.03] transition-colors"
                    >
                      {isOpen ? "Hide chart" : "7-day chart"}
                    </button>

                    {/* Expanded area chart */}
                    {isOpen && (
                      <div className="px-4 pb-4 pt-2">
                        {chartLoading ? (
                          <div className="flex items-center justify-center h-32 gap-2 text-white/25 text-xs">
                            <div className="w-4 h-4 rounded-full border border-indigo-400/30 border-t-indigo-400 animate-spin" />
                            Loading…
                          </div>
                        ) : chartData.length === 0 ? (
                          <p className="text-white/25 text-xs text-center py-8">No data for the last 7 days.</p>
                        ) : (
                          <ResponsiveContainer width="100%" height={160}>
                            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                              <defs>
                                <linearGradient id={`g-${b.biomarker_type}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%"  stopColor={meta.color} stopOpacity={0.25} />
                                  <stop offset="95%" stopColor={meta.color} stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 4" stroke="rgba(255,255,255,0.05)" />
                              <XAxis dataKey="ts" type="number" scale="time" domain={["auto","auto"]} tickCount={4}
                                tickFormatter={(ts) => new Date(ts).toLocaleDateString(undefined, { month:"short", day:"numeric" })}
                                tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }} axisLine={false} tickLine={false}
                              />
                              <YAxis tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }} axisLine={false} tickLine={false} />
                              <Tooltip content={<DarkTooltip unit={meta.unit} />} />
                              <Area type="monotone" dataKey="v" name={meta.label}
                                stroke={meta.stroke} strokeWidth={2}
                                fill={`url(#g-${b.biomarker_type})`}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Bottom row: alerts + recs + quick links ── */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Recent Alerts */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-white/60 text-sm font-semibold">Recent Alerts</p>
              <Link href="/dashboard/patient/alerts" className="text-indigo-400 text-xs hover:text-indigo-300">View all</Link>
            </div>
            {alerts.length === 0 ? (
              <p className="text-white/20 text-sm py-4 text-center">No alerts yet.</p>
            ) : (
              <div className="space-y-2">
                {alerts.map((a, i) => (
                  <div key={a.id || i} className="flex items-start gap-2.5 py-2 border-b border-white/[0.05] last:border-0">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${a.acknowledged_at ? "bg-white/20" : "bg-red-400"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white/60 text-xs leading-snug truncate">{a.message || a.alert_type || "Alert"}</p>
                      <p className="text-white/25 text-xs">{fmtTime(a.triggered_at || a.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Recommendations */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-white/60 text-sm font-semibold">AI Recommendations</p>
              <Link href="/dashboard/patient/ai-recommendations" className="text-indigo-400 text-xs hover:text-indigo-300">View all</Link>
            </div>
            {recs.length === 0 ? (
              <p className="text-white/20 text-sm py-4 text-center">No active recommendations.</p>
            ) : (
              <div className="space-y-3">
                {recs.map((r, i) => (
                  <div key={r.id || i} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                    <p className="text-indigo-400 text-xs uppercase tracking-widest mb-0.5">
                      {r.biomarker_type || r.category || "General"}
                    </p>
                    <p className="text-white/65 text-sm leading-snug line-clamp-2">
                      {r.recommendation || r.title || r.description || "View recommendation →"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
            <p className="text-white/60 text-sm font-semibold mb-4">Quick Access</p>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_LINKS.map((ql) => (
                <Link
                  key={ql.href}
                  href={ql.href}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-indigo-500/25 hover:bg-indigo-500/[0.05] transition-colors group"
                >
                  <svg className="w-5 h-5 text-white/30 group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={ql.icon} />
                  </svg>
                  <span className="text-white/30 group-hover:text-white/55 text-xs transition-colors text-center leading-tight">{ql.label}</span>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </RoleProtection>
  );
}

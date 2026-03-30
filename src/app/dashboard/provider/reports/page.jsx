"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import RoleProtection from "@/components/RoleProtection";
import { USER_ROLES } from "@/hooks/useUserRole";
import {
  getPatientToHCP,
  generateReport, listReports, downloadReportPdf, downloadReportCsv, getReportPreview,
} from "@/services/api_calls";

// ── Constants ────────────────────────────────────────────────────────────────

const REPORT_TYPES = [
  { value: "weekly",    label: "Weekly",    days: 7   },
  { value: "monthly",   label: "Monthly",   days: 30  },
  { value: "quarterly", label: "Quarterly", days: 90  },
  { value: "annual",    label: "Annual",    days: 365 },
  { value: "custom",    label: "Custom",    days: null },
];

const BIO_OPTIONS = [
  { value: "heart_rate",               label: "Heart Rate",    unit: "bpm",   color: "#f87171" },
  { value: "blood_pressure_systolic",  label: "BP Systolic",   unit: "mmHg",  color: "#fb923c" },
  { value: "blood_pressure_diastolic", label: "BP Diastolic",  unit: "mmHg",  color: "#fbbf24" },
  { value: "glucose",                  label: "Blood Glucose", unit: "mg/dL", color: "#34d399" },
  { value: "steps",                    label: "Daily Steps",   unit: "steps", color: "#60a5fa" },
  { value: "sleep",                    label: "Sleep",         unit: "hrs",   color: "#a78bfa" },
];

const NORMALS = {
  heart_rate:               { min: 60,   max: 100,   unit: "bpm"   },
  blood_pressure_systolic:  { min: 90,   max: 120,   unit: "mmHg"  },
  blood_pressure_diastolic: { min: 60,   max: 80,    unit: "mmHg"  },
  glucose:                  { min: 70,   max: 100,   unit: "mg/dL" },
  steps:                    { min: 7000, max: 15000, unit: "steps" },
  sleep:                    { min: 7,    max: 9,     unit: "hrs"   },
};

const STATUS_CLS = {
  ready:      "bg-green-500/10 border-green-500/20 text-green-400",
  generating: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 animate-pulse",
  pending:    "bg-amber-500/10 border-amber-500/20 text-amber-400",
  failed:     "bg-red-500/10   border-red-500/20   text-red-400",
};

const TREND_CLS = {
  improving:         "text-green-400",
  declining:         "text-red-400",
  stable:            "text-indigo-400",
  insufficient_data: "text-white/25",
};

const TREND_ICON = {
  improving: "↑", declining: "↓", stable: "→", insufficient_data: "–",
};

const inputCls = "flex-1 min-w-[150px] px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white/70 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors";

function today()    { return new Date().toISOString().slice(0, 10); }
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); }
const fmtDate = (ts) => { const d = new Date(ts); return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); };

// Dark-friendly chart tooltip
function DarkTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0a0f1e] border border-white/[0.12] rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-white/40 mb-1">{fmtDate(label)}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.stroke }} className="font-semibold">
          {p.name}: {p.value?.toFixed?.(1) ?? p.value}
        </p>
      ))}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function ProviderReportsPage() {
  const [patients,        setPatients]        = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [reportType,  setReportType]  = useState("monthly");
  const [dateFrom,    setDateFrom]    = useState(daysAgo(30));
  const [dateTo,      setDateTo]      = useState(today());
  const [selectedBio, setSelectedBio] = useState(BIO_OPTIONS.map((b) => b.value));

  const [generating, setGenerating] = useState(false);
  const [genError,   setGenError]   = useState("");

  const [reports,     setReports]     = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  const [preview,     setPreview]     = useState(null);
  const [loadingPrev, setLoadingPrev] = useState(false);
  const [prevError,   setPrevError]   = useState("");
  const [activeBio,   setActiveBio]   = useState(null);

  const [activeTab, setActiveTab] = useState("generate");

  useEffect(() => {
    (async () => {
      try {
        const data = await getPatientToHCP();
        const accepted = (data.requests || []).filter((p) => p.status === "accepted");
setPatients(accepted);
      } catch { setPatients([]); }
      finally  { setPatientsLoading(false); }
    })();
  }, []);

  useEffect(() => {
    const t = REPORT_TYPES.find((r) => r.value === reportType);
    if (t?.days) { setDateFrom(daysAgo(t.days)); setDateTo(today()); }
  }, [reportType]);

  const loadReports = useCallback(async (pid) => {
    if (!pid) return;
    setLoadingList(true);
    try {
      const res = await listReports({ patientUserId: pid, limit: 50 });
      setReports(res.reports || []);
    } catch { setReports([]); }
    finally  { setLoadingList(false); }
  }, []);

  useEffect(() => {
    if (!selectedPatient) return;
    const needsPoll = reports.some((r) => r.status === "pending" || r.status === "generating");
    if (!needsPoll) return;
    const t = setTimeout(() => loadReports(selectedPatient.patient_user_id), 5000);
    return () => clearTimeout(t);
  }, [reports, selectedPatient, loadReports]);

  const handleSelectPatient = async (patient) => {
    setSelectedPatient(patient);
    setReports([]); setPreview(null); setGenError(""); setPrevError(""); setActiveBio(null);
    // load history in background
    loadReports(patient.patient_user_id);
    // auto-load preview so HCP sees data immediately
    setLoadingPrev(true);
    setActiveTab("preview");
    try {
      const data = await getReportPreview({
        dateFrom, dateTo,
        biomarkerTypes: selectedBio.length ? selectedBio : null,
        patientUserId:  patient.patient_user_id,
      });
      setPreview(data);
      if (data?.stats?.length) setActiveBio(data.stats[0].biomarker_type);
    } catch (e) { setPrevError(e.message || "Failed to load preview"); }
    finally { setLoadingPrev(false); }
  };

  const handleGenerate = async () => {
    setGenError(""); setGenerating(true);
    try {
      await generateReport({
        report_type:     reportType,
        date_from:       dateFrom,
        date_to:         dateTo,
        biomarker_types: selectedBio.length ? selectedBio : null,
        patient_user_id: selectedPatient.patient_user_id,
      });
      await loadReports(selectedPatient.patient_user_id);
      setActiveTab("history");
    } catch (e) { setGenError(e.message); }
    finally     { setGenerating(false); }
  };

  const handlePreview = async () => {
    setPrevError(""); setLoadingPrev(true); setPreview(null);
    try {
      const data = await getReportPreview({
        dateFrom, dateTo,
        biomarkerTypes: selectedBio.length ? selectedBio : null,
        patientUserId:  selectedPatient.patient_user_id,
      });
      setPreview(data);
      if (data?.stats?.length) setActiveBio(data.stats[0].biomarker_type);
      setActiveTab("preview");
    } catch (e) { setPrevError(e.message); }
    finally     { setLoadingPrev(false); }
  };

  const toggleBio = (val) =>
    setSelectedBio((prev) => prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]);

  // Derived preview values
  const activeBioMeta  = BIO_OPTIONS.find((b) => b.value === activeBio);
  const activeStat     = preview?.stats?.find((s) => s.biomarker_type === activeBio);
  const chartData      = (preview?.series?.[activeBio] || [])
    .map((p) => ({ ts: new Date(p.date || p.recorded_at || p.ts || 0).getTime(), v: Number(p.value ?? p.v) }))
    .filter((p) => Number.isFinite(p.ts) && p.ts > 0 && Number.isFinite(p.v))
    .sort((a, b) => a.ts - b.ts);
  const scoreChartData = (preview?.score_series || [])
    .map((p) => ({ ts: new Date(p.date || 0).getTime(), v: Number(p.score) }))
    .filter((p) => Number.isFinite(p.ts) && p.ts > 0 && Number.isFinite(p.v))
    .sort((a, b) => a.ts - b.ts);

  return (
    <RoleProtection allowedRoles={[USER_ROLES.PROVIDER]}>
      <div className="max-w-5xl mx-auto pb-10">

        {/* Header */}
        <div className="mb-8">
          <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-1">Provider</p>
          <h1 className="font-[family-name:var(--font-serif)] text-white text-3xl font-bold">Health Reports</h1>
          <p className="text-white/40 text-sm mt-1">Generate and download professional health reports for your patients.</p>
        </div>

        {/* Patient selector */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 mb-5">
          <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-3">Select Patient</p>
          {patientsLoading ? (
            <div className="flex items-center gap-2 text-white/30 text-sm">
              <div className="w-4 h-4 rounded-full border-2 border-indigo-400/40 border-t-indigo-400 animate-spin" />
              Loading patients…
            </div>
          ) : patients.length === 0 ? (
            <p className="text-white/25 text-sm">No accepted patient connections found.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {patients.map((p) => {
                const sel = selectedPatient?.patient_id === p.patient_id;
                return (
                  <button
                    key={p.patient_id}
                    onClick={() => handleSelectPatient(p)}
                    className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
                      sel
                        ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-300"
                        : "bg-white/[0.03] border-white/[0.07] text-white/50 hover:border-white/20 hover:text-white/70"
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${sel ? "bg-indigo-500/25 text-indigo-300" : "bg-white/[0.06] text-white/40"}`}>
                      {p.patient_name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <span>{p.patient_name}</span>
                    <span className="text-xs opacity-50">{p.patient_email}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Main content */}
        {!selectedPatient ? (
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-16 text-center">
            <svg className="w-10 h-10 mx-auto mb-3 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-white/25 text-sm">Select a patient above to generate or view reports.</p>
          </div>
        ) : (
          <>
            {/* Viewing pill */}
            <div className="flex items-center gap-2 mb-4 text-sm">
              <span className="text-white/30">Viewing:</span>
              <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
                {selectedPatient.patient_name}
              </span>
              <span className="text-white/20 text-xs">{selectedPatient.patient_email}</span>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-5">
              {[
                { key: "generate", label: "Generate" },
                { key: "preview",  label: "Preview"  },
                { key: "history",  label: `History (${reports.length})` },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    activeTab === t.key
                      ? "bg-indigo-500/15 border-indigo-500/25 text-indigo-300"
                      : "bg-white/[0.03] border-white/[0.07] text-white/40 hover:text-white/60"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── Generate tab ──────────────────────────────────────────────── */}
            {activeTab === "generate" && (
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 space-y-6">

                {/* Report type */}
                <div>
                  <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-3">Report Type</p>
                  <div className="flex flex-wrap gap-2">
                    {REPORT_TYPES.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setReportType(t.value)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          reportType === t.value
                            ? "bg-indigo-500/15 border-indigo-500/25 text-indigo-300"
                            : "bg-white/[0.03] border-white/[0.07] text-white/40 hover:text-white/60"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date range */}
                <div>
                  <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-3">Date Range</p>
                  <div className="flex flex-wrap gap-3">
                    <div className="flex flex-col gap-1 flex-1 min-w-[150px]">
                      <label className="text-white/25 text-xs">From</label>
                      <input type="date" value={dateFrom} max={dateTo} onChange={(e) => setDateFrom(e.target.value)} className={inputCls} />
                    </div>
                    <div className="flex flex-col gap-1 flex-1 min-w-[150px]">
                      <label className="text-white/25 text-xs">To</label>
                      <input type="date" value={dateTo} min={dateFrom} max={today()} onChange={(e) => setDateTo(e.target.value)} className={inputCls} />
                    </div>
                  </div>
                </div>

                {/* Biomarkers */}
                <div>
                  <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-3">
                    Biomarkers <span className="text-white/20 normal-case tracking-normal font-normal">(all by default)</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {BIO_OPTIONS.map((b) => {
                      const on = selectedBio.includes(b.value);
                      return (
                        <button
                          key={b.value}
                          onClick={() => toggleBio(b.value)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${!on && "bg-white/[0.03] border-white/[0.07] text-white/40 hover:text-white/60"}`}
                          style={on ? { borderColor: b.color + "60", background: b.color + "15", color: b.color } : {}}
                        >
                          {b.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {genError && (
                  <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{genError}</div>
                )}

                <div className="flex gap-3 flex-wrap pt-1">
                  <button
                    onClick={handlePreview}
                    disabled={loadingPrev}
                    className="px-5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/50 text-sm font-medium hover:bg-white/[0.07] hover:text-white/70 transition-colors disabled:opacity-40"
                  >
                    {loadingPrev ? "Loading…" : "Preview in App"}
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-sm font-semibold hover:bg-indigo-500/20 transition-colors disabled:opacity-40"
                  >
                    {generating ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-indigo-300/30 border-t-indigo-300 animate-spin" />
                        Generating…
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586L7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                        </svg>
                        Generate PDF
                      </>
                    )}
                  </button>
                </div>
                <p className="text-white/20 text-xs">PDF is generated in the background. Check History when ready.</p>
              </div>
            )}

            {/* ── Preview tab ───────────────────────────────────────────────── */}
            {activeTab === "preview" && (
              <div className="space-y-5">
                {prevError && (
                  <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{prevError}</div>
                )}
                {loadingPrev && (
                  <div className="flex items-center justify-center py-20 gap-3 text-white/30 text-sm">
                    <div className="w-5 h-5 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin" />
                    Loading patient data…
                  </div>
                )}
                {!preview && !prevError && !loadingPrev && (
                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-16 text-center">
                    <p className="text-white/25 text-sm">Click <span className="text-white/50 font-medium">Preview in App</span> on the Generate tab to load data here.</p>
                  </div>
                )}

                {preview && (
                  <div className="space-y-6">

                    {/* Report header */}
                    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-white/25 text-[10px] uppercase tracking-widest font-semibold">Pulse Health Report — Provider View</p>
                        <p className="text-white/70 font-semibold mt-0.5">{fmtDate(dateFrom)} — {fmtDate(dateTo)}</p>
                        <p className="text-white/30 text-xs mt-1">
                          Patient: <span className="text-white/50 font-medium">{selectedPatient.patient_name}</span> ·{" "}
                          {preview.stats?.filter((s) => s.readings_count > 0).length || 0} biomarkers tracked ·{" "}
                          {preview.stats?.reduce((a, s) => a + s.readings_count, 0) || 0} total readings
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-white/25 text-xs">Preview generated</p>
                        <p className="text-white/40 text-xs mt-0.5">{new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</p>
                      </div>
                    </div>

                    {/* Overview stat cards */}
                    {(() => {
                      const hr   = preview.stats?.find((s) => s.biomarker_type === "heart_rate");
                      const gluc = preview.stats?.find((s) => s.biomarker_type === "glucose");
                      const stp  = preview.stats?.find((s) => s.biomarker_type === "steps");
                      const avgScore = preview.score_series?.length
                        ? Math.round(preview.score_series.reduce((a, x) => a + (x.score || 0), 0) / preview.score_series.length)
                        : null;
                      return (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[
                            { label: "Avg Health Score", val: avgScore,  sfx: "/100",   cls: "text-indigo-400", grad: "from-indigo-500/10 to-indigo-500/5 border-indigo-500/15" },
                            { label: "Avg Heart Rate",   val: hr?.avg,   sfx: " bpm",   cls: "text-red-400",    grad: "from-red-500/10 to-red-500/5 border-red-500/15"         },
                            { label: "Avg Glucose",      val: gluc?.avg, sfx: " mg/dL", cls: "text-green-400",  grad: "from-green-500/10 to-green-500/5 border-green-500/15"   },
                            { label: "Avg Steps", val: stp?.avg != null ? Math.round(stp.avg).toLocaleString() : null, sfx: "", cls: "text-blue-400", grad: "from-blue-500/10 to-blue-500/5 border-blue-500/15" },
                          ].map((s) => (
                            <div key={s.label} className={`rounded-2xl border bg-gradient-to-br p-4 ${s.grad}`}>
                              <p className="text-white/30 text-[10px] uppercase tracking-widest font-semibold">{s.label}</p>
                              <p className={`text-2xl font-bold mt-1 ${s.cls}`}>
                                {s.val != null ? `${typeof s.val === "number" ? s.val.toFixed(1) : s.val}${s.sfx}` : "—"}
                              </p>
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    {/* Health Score Trend */}
                    {scoreChartData.length > 1 && (
                      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
                        <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-4">Health Score Trend</p>
                        <ResponsiveContainer width="100%" height={140}>
                          <AreaChart data={scoreChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%"  stopColor="#818cf8" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#818cf8" stopOpacity={0}   />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 4" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="ts" type="number" scale="time" domain={["auto","auto"]} tickCount={5}
                              tickFormatter={(t) => new Date(t).toLocaleDateString(undefined, { month:"short", day:"numeric" })}
                              tick={{ fill:"rgba(255,255,255,0.25)", fontSize:10 }} axisLine={false} tickLine={false} />
                            <YAxis domain={[0,100]} tick={{ fill:"rgba(255,255,255,0.25)", fontSize:10 }} axisLine={false} tickLine={false} />
                            <Tooltip content={<DarkTooltip />} />
                            <Area type="monotone" dataKey="v" name="Health Score" stroke="#818cf8" strokeWidth={2} fill="url(#scoreGrad)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Biomarker Analysis */}
                    {preview.stats?.filter((s) => s.readings_count > 0).length > 0 && (
                      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 space-y-5">
                        <p className="text-white/50 text-xs font-semibold uppercase tracking-widest">Biomarker Analysis</p>

                        {/* Biomarker tabs */}
                        <div className="flex flex-wrap gap-2">
                          {preview.stats.filter((s) => s.readings_count > 0).map((s) => {
                            const m = BIO_OPTIONS.find((b) => b.value === s.biomarker_type);
                            const isA = activeBio === s.biomarker_type;
                            return (
                              <button key={s.biomarker_type} onClick={() => setActiveBio(s.biomarker_type)}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${isA ? "" : "border-white/[0.07] text-white/35 hover:border-white/20 hover:text-white/55"}`}
                                style={isA && m ? { borderColor: m.color + "60", background: m.color + "15", color: m.color } : {}}>
                                {m?.label || s.biomarker_type}
                              </button>
                            );
                          })}
                        </div>

                        {/* Active biomarker detail */}
                        {activeStat && activeBioMeta && (
                          <div className="space-y-4">
                            {/* Status + trend row */}
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold capitalize
                                ${activeStat.status === "normal"     ? "bg-green-500/10 border-green-500/20 text-green-400" :
                                  activeStat.status === "borderline" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                                  activeStat.status === "abnormal"   ? "bg-red-500/10 border-red-500/20 text-red-400" :
                                  "bg-white/[0.05] border-white/[0.08] text-white/30"}`}>
                                {activeStat.status?.replace("_", " ") || "No data"}
                              </span>
                              <span className={`text-xs font-semibold ${TREND_CLS[activeStat.trend] || "text-white/30"}`}>
                                {TREND_ICON[activeStat.trend] || "–"} {activeStat.trend?.replace(/_/g, " ")}
                              </span>
                              <span className="text-white/25 text-xs">{activeStat.readings_count} readings</span>
                            </div>

                            {/* Avg / Min / Max / Latest */}
                            <div className="grid grid-cols-4 gap-2">
                              {[["Avg", activeStat.avg], ["Min", activeStat.min], ["Max", activeStat.max], ["Latest", activeStat.latest]].map(([l, v]) => (
                                <div key={l} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 text-center">
                                  <p className="text-white/25 text-xs mb-0.5">{l}</p>
                                  <p className="font-bold" style={{ color: activeBioMeta.color }}>
                                    {v != null ? (activeBio === "steps" ? Math.round(v).toLocaleString() : Number(v).toFixed(1)) : "—"}
                                  </p>
                                  <p className="text-white/20 text-[10px]">{activeStat.unit}</p>
                                </div>
                              ))}
                            </div>

                            {/* Days in normal range */}
                            {activeStat.days_total > 0 && (
                              <div>
                                <div className="flex items-center justify-between mb-1.5">
                                  <p className="text-white/35 text-xs">Days in normal range</p>
                                  <p className="text-white/50 text-xs font-semibold">
                                    {activeStat.days_in_normal} / {activeStat.days_total} days
                                    {" "}({Math.round(activeStat.days_in_normal / activeStat.days_total * 100)}%)
                                  </p>
                                </div>
                                <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                                  <div className="h-full rounded-full transition-all"
                                    style={{ width: `${Math.round(activeStat.days_in_normal / activeStat.days_total * 100)}%`, background: activeBioMeta.color + "cc" }} />
                                </div>
                              </div>
                            )}

                            {/* Chart */}
                            {chartData.length > 0 ? (
                              <ResponsiveContainer width="100%" height={180}>
                                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                  <defs>
                                    <linearGradient id="prevGrad" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%"  stopColor={activeBioMeta.color} stopOpacity={0.25} />
                                      <stop offset="95%" stopColor={activeBioMeta.color} stopOpacity={0}    />
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 4" stroke="rgba(255,255,255,0.05)" />
                                  <XAxis dataKey="ts" type="number" scale="time" domain={["auto","auto"]} tickCount={5}
                                    tickFormatter={(t) => new Date(t).toLocaleDateString(undefined, { month:"short", day:"numeric" })}
                                    tick={{ fill:"rgba(255,255,255,0.25)", fontSize:10 }} axisLine={false} tickLine={false} />
                                  <YAxis tick={{ fill:"rgba(255,255,255,0.25)", fontSize:10 }} axisLine={false} tickLine={false} />
                                  <Tooltip content={<DarkTooltip />} />
                                  {NORMALS[activeBio]?.min != null && <ReferenceLine y={NORMALS[activeBio].min} stroke="rgba(52,211,153,0.3)" strokeDasharray="4 3" />}
                                  {NORMALS[activeBio]?.max != null && <ReferenceLine y={NORMALS[activeBio].max} stroke="rgba(248,113,113,0.3)" strokeDasharray="4 3" />}
                                  <Area type="monotone" dataKey="v" name={activeBioMeta.label}
                                    stroke={activeBioMeta.color} strokeWidth={2} fill="url(#prevGrad)"
                                    dot={chartData.length < 20 ? { r: 3, fill: activeBioMeta.color, strokeWidth: 0 } : false} />
                                </AreaChart>
                              </ResponsiveContainer>
                            ) : (
                              <p className="text-white/20 text-xs text-center py-6">No chart data for this period.</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Goals Performance */}
                    {preview.goals_total > 0 && (
                      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 space-y-4">
                        <p className="text-white/50 text-xs font-semibold uppercase tracking-widest">Goals Performance</p>
                        <div className="flex items-center gap-5">
                          <div className="flex-shrink-0 text-center">
                            <p className={`text-4xl font-bold ${preview.goals_completion_rate >= 80 ? "text-green-400" : preview.goals_completion_rate >= 50 ? "text-amber-400" : "text-red-400"}`}>
                              {preview.goals_completion_rate != null ? `${preview.goals_completion_rate}%` : "—"}
                            </p>
                            <p className="text-white/30 text-xs mt-0.5">completion</p>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1.5 text-xs text-white/30">
                              <span>{preview.goals_completed} completed</span>
                              <span>{preview.goals_total} total</span>
                            </div>
                            <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                              <div className="h-full rounded-full transition-all"
                                style={{ width: `${preview.goals_completion_rate || 0}%`, background: preview.goals_completion_rate >= 80 ? "#34d399" : preview.goals_completion_rate >= 50 ? "#f59e0b" : "#f87171" }} />
                            </div>
                          </div>
                        </div>
                        {preview.goals?.length > 0 && (
                          <div className="space-y-1.5 max-h-40 overflow-y-auto">
                            {[...new Map(preview.goals.map((g) => [g.goal_text, g])).values()].slice(0, 8).map((g, i) => {
                              const done  = preview.goals.filter((x) => x.goal_text === g.goal_text && x.status === "completed").length;
                              const total = preview.goals.filter((x) => x.goal_text === g.goal_text).length;
                              return (
                                <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-white/[0.04] last:border-0">
                                  <span className="text-white/55 truncate flex-1">{g.goal_text}</span>
                                  <span className="text-white/30 flex-shrink-0 ml-3">{done}/{total} days</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* AI Recommendations & Action Items */}
                    {preview.recommendations?.length > 0 && (
                      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-white/50 text-xs font-semibold uppercase tracking-widest">AI Recommendations & Action Items</p>
                          <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                            {preview.recommendations.length} active
                          </span>
                        </div>
                        <div className="space-y-3">
                          {preview.recommendations.map((rec, i) => {
                            const priorityStyle = rec.priority === "high" || rec.priority === 1
                              ? "bg-red-500/10 border-red-500/20 text-red-400"
                              : rec.priority === "medium" || rec.priority === 2
                              ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                              : "bg-green-500/10 border-green-500/20 text-green-400";
                            const rawSteps = Array.isArray(rec.action_steps) ? rec.action_steps : [];
                            const actionSteps = rawSteps.map((s) =>
                              typeof s === "string"
                                ? { instruction: s, tip: null }
                                : { instruction: s.instruction || s.step || s.tip || "", tip: s.tip !== s.instruction ? s.tip : null }
                            ).filter((s) => s.instruction);
                            return (
                              <div key={i} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wide ${priorityStyle}`}>
                                        {typeof rec.priority === "number" ? ["", "High", "Medium", "Low"][rec.priority] || rec.priority : rec.priority || "—"} priority
                                      </span>
                                      {rec.category && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/15 text-indigo-400 font-medium capitalize">
                                          {rec.category}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-white/80 text-sm font-semibold">{rec.title}</p>
                                  </div>
                                </div>
                                {rec.description && (
                                  <p className="text-white/50 text-xs leading-relaxed">{rec.description}</p>
                                )}
                                {actionSteps.length > 0 && (
                                  <div>
                                    <p className="text-white/30 text-[10px] uppercase tracking-widest font-semibold mb-2">Action Steps</p>
                                    <ul className="space-y-1.5">
                                      {actionSteps.map((step, j) => (
                                        <li key={j} className="flex items-start gap-2 text-xs">
                                          <span className="w-4 h-4 rounded-full bg-indigo-500/15 border border-indigo-500/20 flex-shrink-0 flex items-center justify-center text-indigo-400 text-[9px] font-bold mt-0.5">{j + 1}</span>
                                          <div>
                                            <p className="text-white/65">{step.instruction}</p>
                                            {step.tip && <p className="text-white/30 mt-0.5 italic">{step.tip}</p>}
                                          </div>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {rec.related_goal && (
                                  <p className="text-white/25 text-xs">
                                    <span className="text-white/35 font-medium">Related goal:</span> {rec.related_goal}
                                  </p>
                                )}
                                {rec.requires_professional_consultation && (
                                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/[0.06] border border-amber-500/20">
                                    <svg className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <p className="text-amber-400 text-xs">Consult a healthcare professional before acting on this recommendation.</p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>
            )}

            {/* ── History tab ───────────────────────────────────────────────── */}
            {activeTab === "history" && (
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
                {loadingList ? (
                  <div className="flex items-center justify-center py-14 gap-2 text-white/30 text-sm">
                    <div className="w-5 h-5 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin" />
                    Loading reports…
                  </div>
                ) : reports.length === 0 ? (
                  <div className="py-14 text-center">
                    <svg className="w-9 h-9 mx-auto mb-2 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-white/25 text-sm">No reports generated yet for this patient.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.05]">
                    {reports.map((report) => (
                      <div key={report.id} className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors">
                        <div>
                          <p className="text-white/70 text-sm font-medium capitalize">{report.report_type} Report</p>
                          <p className="text-white/25 text-xs mt-0.5">
                            {report.date_from && report.date_to ? `${fmtDate(report.date_from)} – ${fmtDate(report.date_to)}` : fmtDate(report.created_at)}
                          </p>
                          {report.summary?.total_readings != null && (
                            <p className="text-white/20 text-xs">{report.summary.total_readings} readings</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_CLS[report.status] || "bg-white/[0.05] border-white/[0.08] text-white/30"}`}>
                            {report.status}
                          </span>
                          {report.status === "ready" && (
                            <>
                              <button
                                onClick={() => downloadReportPdf(report.id, selectedPatient.patient_user_id)}
                                className="text-xs px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-medium hover:bg-indigo-500/20 transition-colors"
                              >
                                PDF
                              </button>
                              <button
                                onClick={() => downloadReportCsv(report.id, selectedPatient.patient_user_id)}
                                className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/40 font-medium hover:bg-white/[0.07] transition-colors"
                              >
                                CSV
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {reports.some((r) => r.status === "pending" || r.status === "generating") && (
                  <p className="text-xs text-center text-indigo-400/60 animate-pulse py-3 border-t border-white/[0.05]">
                    Generating — refreshes automatically…
                  </p>
                )}
              </div>
            )}
          </>
        )}

      </div>
    </RoleProtection>
  );
}

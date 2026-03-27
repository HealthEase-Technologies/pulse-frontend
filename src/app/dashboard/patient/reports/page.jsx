"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  generateReport, listReports, downloadReportPdf, downloadReportCsv, getReportPreview,
} from "@/services/api_calls";

// ── Constants ────────────────────────────────────────────────────────────────

const REPORT_TYPES = [
  { value: "weekly",    label: "Weekly",    days: 7  },
  { value: "monthly",   label: "Monthly",   days: 30 },
  { value: "quarterly", label: "Quarterly", days: 90 },
  { value: "annual",    label: "Annual",    days: 365 },
  { value: "custom",    label: "Custom",    days: null },
];

const BIOMARKER_OPTIONS = [
  { value: "heart_rate",               label: "Heart Rate",               unit: "bpm"   },
  { value: "blood_pressure_systolic",  label: "BP Systolic",              unit: "mmHg"  },
  { value: "blood_pressure_diastolic", label: "BP Diastolic",             unit: "mmHg"  },
  { value: "glucose",                  label: "Blood Glucose",            unit: "mg/dL" },
  { value: "steps",                    label: "Daily Steps",              unit: "steps" },
  { value: "sleep",                    label: "Sleep",                    unit: "hrs"   },
];

const NORMALS = {
  heart_rate:               { min: 60,   max: 100,   unit: "bpm"   },
  blood_pressure_systolic:  { min: 90,   max: 120,   unit: "mmHg"  },
  blood_pressure_diastolic: { min: 60,   max: 80,    unit: "mmHg"  },
  glucose:                  { min: 70,   max: 100,   unit: "mg/dL" },
  steps:                    { min: 7000, max: 15000, unit: "steps" },
  sleep:                    { min: 7,    max: 9,     unit: "hrs"   },
};

const STATUS_COLORS = {
  normal:     { bg: "bg-green-100",  text: "text-green-700",  dot: "bg-green-500"  },
  borderline: { bg: "bg-amber-100",  text: "text-amber-700",  dot: "bg-amber-500"  },
  abnormal:   { bg: "bg-red-100",    text: "text-red-700",    dot: "bg-red-500"    },
  no_data:    { bg: "bg-gray-100",   text: "text-gray-500",   dot: "bg-gray-400"   },
};

const TREND_LABELS = {
  improving:        { icon: "↑", color: "text-green-600" },
  declining:        { icon: "↓", color: "text-red-600"   },
  stable:           { icon: "→", color: "text-blue-600"  },
  insufficient_data:{ icon: "–", color: "text-gray-400"  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().slice(0, 10);
}
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.no_data;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status?.replace("_", " ")}
    </span>
  );
}

function TrendIcon({ trend }) {
  const t = TREND_LABELS[trend] || TREND_LABELS.insufficient_data;
  return <span className={`font-bold ${t.color}`}>{t.icon} {trend?.replace("_", " ")}</span>;
}

function ScoreCard({ label, value, unit, colorClass }) {
  return (
    <div className={`rounded-xl p-4 border ${colorClass} flex flex-col gap-1`}>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      {value != null
        ? <p className="text-3xl font-black text-gray-900">{typeof value === "number" ? value.toFixed(1) : value}<span className="text-sm font-normal text-gray-400 ml-1">{unit}</span></p>
        : <p className="text-2xl font-bold text-gray-400">—</p>
      }
    </div>
  );
}

function BiomarkerCard({ stat }) {
  const pct = stat.days_total > 0 ? Math.round((stat.days_in_normal / stat.days_total) * 100) : 0;
  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <p className="font-semibold text-gray-800 text-sm">
          {BIOMARKER_OPTIONS.find(b => b.value === stat.biomarker_type)?.label || stat.biomarker_type}
        </p>
        <StatusBadge status={stat.status} />
      </div>

      {stat.status === "no_data" ? (
        <p className="text-xs text-gray-400">No readings logged for this period.</p>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[["Avg", stat.avg], ["Min", stat.min], ["Max", stat.max], ["Latest", stat.latest]].map(([lbl, val]) => (
              <div key={lbl} className="text-center bg-gray-50 rounded-lg py-2">
                <p className="text-[10px] text-gray-400 uppercase font-semibold">{lbl}</p>
                <p className="text-sm font-bold text-gray-800">{val ?? "—"}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-gray-500 w-14">Normal</span>
            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
              <div className="h-1.5 bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-gray-500">{pct}%</span>
          </div>
          <p className="text-xs text-gray-500">
            Trend: <TrendIcon trend={stat.trend} />
          </p>
        </>
      )}
    </div>
  );
}

function ReportRow({ report, onDownloadPdf, onDownloadCsv }) {
  const statusColor = {
    ready:      "bg-green-100 text-green-700",
    generating: "bg-blue-100 text-blue-700 animate-pulse",
    pending:    "bg-yellow-100 text-yellow-700",
    failed:     "bg-red-100 text-red-700",
  }[report.status] || "bg-gray-100 text-gray-600";

  return (
    <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-white hover:bg-gray-50 transition">
      <div className="flex flex-col gap-0.5">
        <span className="font-semibold text-gray-800 capitalize text-sm">
          {report.report_type} Report
        </span>
        <span className="text-xs text-gray-400">
          {report.date_from} → {report.date_to}
        </span>
        {report.summary?.total_readings != null && (
          <span className="text-xs text-gray-400">{report.summary.total_readings} readings</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor}`}>
          {report.status}
        </span>
        {report.status === "ready" && (
          <>
            <button
              onClick={() => onDownloadPdf(report.id)}
              className="flex items-center gap-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-semibold transition"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
              PDF
            </button>
            <button
              onClick={() => onDownloadCsv(report.id)}
              className="flex items-center gap-1 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded-lg font-semibold transition"
            >
              CSV
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PatientReportsPage() {
  // Generator state
  const [reportType, setReportType]         = useState("monthly");
  const [dateFrom,   setDateFrom]           = useState(daysAgo(30));
  const [dateTo,     setDateTo]             = useState(today());
  const [selectedBio, setSelectedBio]       = useState([]);
  const [generating,  setGenerating]        = useState(false);
  const [genError,    setGenError]          = useState("");

  // Reports list
  const [reports,   setReports]             = useState([]);
  const [loadingList, setLoadingList]       = useState(true);

  // Preview
  const [preview,     setPreview]           = useState(null);
  const [loadingPrev, setLoadingPrev]       = useState(false);
  const [prevError,   setPrevError]         = useState("");
  const [activeTab,   setActiveTab]         = useState("generate"); // generate | preview | history

  // ── Date auto-fill when type changes ──────────────────────────────────────
  useEffect(() => {
    const t = REPORT_TYPES.find(r => r.value === reportType);
    if (t?.days) {
      setDateFrom(daysAgo(t.days));
      setDateTo(today());
    }
  }, [reportType]);

  // ── Load reports list ──────────────────────────────────────────────────────
  const loadReports = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await listReports({ limit: 50 });
      setReports(res.reports || []);
    } catch { setReports([]); }
    finally   { setLoadingList(false); }
  }, []);

  useEffect(() => { loadReports(); }, [loadReports]);

  // ── Poll pending/generating reports ───────────────────────────────────────
  useEffect(() => {
    const needsPoll = reports.some(r => r.status === "pending" || r.status === "generating");
    if (!needsPoll) return;
    const timer = setTimeout(loadReports, 5000);
    return () => clearTimeout(timer);
  }, [reports, loadReports]);

  // ── Generate ──────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    setGenError("");
    setGenerating(true);
    try {
      await generateReport({
        report_type:     reportType,
        date_from:       dateFrom,
        date_to:         dateTo,
        biomarker_types: selectedBio.length ? selectedBio : null,
      });
      await loadReports();
      setActiveTab("history");
    } catch (e) {
      setGenError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  // ── Preview ───────────────────────────────────────────────────────────────
  const handlePreview = async () => {
    setPrevError("");
    setLoadingPrev(true);
    try {
      const data = await getReportPreview({
        dateFrom,
        dateTo,
        biomarkerTypes: selectedBio.length ? selectedBio : null,
      });
      setPreview(data);
      setActiveTab("preview");
    } catch (e) {
      setPrevError(e.message);
    } finally {
      setLoadingPrev(false);
    }
  };

  // ── Toggle biomarker selection ────────────────────────────────────────────
  const toggleBio = (val) => {
    setSelectedBio(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">Health Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Generate professional PDF reports with charts and actionable insights</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: "generate", label: "Generate" },
          { key: "preview",  label: "Preview"  },
          { key: "history",  label: `History (${reports.length})` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === t.key
                ? "bg-white text-blue-600 shadow"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Generate Tab ────────────────────────────────────────────────────── */}
      {activeTab === "generate" && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">

          {/* Report type */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Report Type</label>
            <div className="flex flex-wrap gap-2">
              {REPORT_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setReportType(t.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                    reportType === t.value
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-blue-400"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date range */}
          <div className="flex gap-4 flex-wrap">
            <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                max={dateTo}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                min={dateFrom}
                max={today()}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Biomarker filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Biomarkers <span className="text-gray-400 font-normal">(optional — all selected by default)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {BIOMARKER_OPTIONS.map(b => (
                <button
                  key={b.value}
                  onClick={() => toggleBio(b.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    selectedBio.includes(b.value)
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-indigo-400"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {genError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{genError}</p>}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handlePreview}
              disabled={loadingPrev}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-blue-300 text-blue-600 text-sm font-semibold hover:bg-blue-50 transition disabled:opacity-50"
            >
              {loadingPrev ? "Loading..." : "Preview in App"}
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md transition disabled:opacity-50"
            >
              {generating ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586L7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd"/></svg>
                  Generate PDF Report
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-gray-400">PDF generation runs in the background. Check History tab for download when ready.</p>
        </div>
      )}

      {/* ── Preview Tab ─────────────────────────────────────────────────────── */}
      {activeTab === "preview" && (
        <div className="space-y-6">
          {prevError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{prevError}</div>
          )}

          {!preview && !prevError && (
            <div className="text-center py-16 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
              <p>Click <strong>Preview in App</strong> on the Generate tab to load live data here.</p>
            </div>
          )}

          {preview && (() => {
            const scores = preview.score_series || [];
            const avgScore  = scores.length ? Math.round(scores.reduce((s, r) => s + r.score, 0) / scores.length) : null;
            const bestScore = scores.length ? Math.round(Math.max(...scores.map(r => r.score))) : null;
            const worstScore= scores.length ? Math.round(Math.min(...scores.map(r => r.score))) : null;
            return (
            <>
              {/* Score summary cards */}
              {scores.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={`rounded-xl p-4 border ${avgScore >= 70 ? "bg-green-50 border-green-200" : avgScore >= 40 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200"}`}>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Avg Health Score</p>
                    <p className="text-3xl font-black text-gray-900 mt-1">{avgScore}<span className="text-sm font-normal text-gray-400">/100</span></p>
                  </div>
                  <div className="rounded-xl p-4 border bg-green-50 border-green-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Best Score</p>
                    <p className="text-3xl font-black text-gray-900 mt-1">{bestScore}<span className="text-sm font-normal text-gray-400">/100</span></p>
                  </div>
                  <div className={`rounded-xl p-4 border ${worstScore >= 70 ? "bg-green-50 border-green-200" : worstScore >= 40 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200"}`}>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Lowest Score</p>
                    <p className="text-3xl font-black text-gray-900 mt-1">{worstScore}<span className="text-sm font-normal text-gray-400">/100</span></p>
                  </div>
                  <div className="rounded-xl p-4 border bg-blue-50 border-blue-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Days Tracked</p>
                    <p className="text-3xl font-black text-gray-900 mt-1">{scores.length}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
                  No health score data for this period. Visit your <strong>My Pet</strong> page to generate your daily score.
                </div>
              )}

              {/* Score chart */}
              {preview.score_series?.length > 1 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                  <h3 className="font-bold text-gray-800 mb-4">Daily Health Score</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={preview.score_series}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <ReferenceLine y={70} stroke="#16a34a" strokeDasharray="4 4" label={{ value: "Happy", fontSize: 10, fill: "#16a34a" }} />
                      <ReferenceLine y={40} stroke="#d97706" strokeDasharray="4 4" label={{ value: "Sad", fontSize: 10, fill: "#d97706" }} />
                      <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} name="Score" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Biomarker charts */}
              {Object.entries(preview.series || {}).map(([bt, data]) => {
                if (!data.length) return null;
                const norm = preview.normals?.[bt] || NORMALS[bt];
                const bio  = BIOMARKER_OPTIONS.find(b => b.value === bt);
                return (
                  <div key={bt} className="bg-white border border-gray-200 rounded-2xl p-5">
                    <h3 className="font-bold text-gray-800 mb-4">
                      {bio?.label || bt} <span className="text-xs text-gray-400 font-normal">({norm?.unit})</span>
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        {norm && <ReferenceLine y={norm.min} stroke="#16a34a" strokeDasharray="3 3" opacity={0.6} />}
                        {norm && <ReferenceLine y={norm.max} stroke="#16a34a" strokeDasharray="3 3" opacity={0.6} label={{ value: `Normal (${norm.min}–${norm.max})`, fontSize: 9, fill: "#16a34a", position: "insideTopRight" }} />}
                        <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} name={bio?.label || bt} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                );
              })}

              {/* Biomarker stats */}
              {(preview.stats || []).filter(s => s.status !== "no_data").length > 0 && (
                <>
                  <h3 className="font-bold text-gray-800">Biomarker Stats</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(preview.stats || []).filter(s => s.status !== "no_data").map(s => (
                      <BiomarkerCard key={s.biomarker_type} stat={s} />
                    ))}
                  </div>
                </>
              )}

              {/* Goals */}
              {preview.goals_total > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                  <h3 className="font-bold text-gray-800 mb-4">Goal Tracking</h3>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center bg-blue-50 rounded-xl py-3">
                      <p className="text-xs text-gray-500 uppercase font-semibold">Total</p>
                      <p className="text-2xl font-black text-gray-800">{preview.goals_total}</p>
                    </div>
                    <div className="text-center bg-green-50 rounded-xl py-3">
                      <p className="text-xs text-gray-500 uppercase font-semibold">Completed</p>
                      <p className="text-2xl font-black text-green-700">{preview.goals_completed}</p>
                    </div>
                    <div className="text-center bg-gray-50 rounded-xl py-3">
                      <p className="text-xs text-gray-500 uppercase font-semibold">Rate</p>
                      <p className="text-2xl font-black text-gray-800">{preview.goals_completion_rate ?? "—"}<span className="text-sm font-normal">%</span></p>
                    </div>
                  </div>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {preview.goals.map((g, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${g.status === "completed" ? "bg-green-500" : g.status === "missed" ? "bg-red-400" : "bg-gray-300"}`} />
                        <span className="text-gray-700 flex-1">{g.goal_text}</span>
                        <span className="text-xs text-gray-400">{g.completion_date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {preview.recommendations?.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                  <h3 className="font-bold text-gray-800 mb-4">AI Recommendations</h3>
                  <div className="space-y-3">
                    {preview.recommendations.map((rec, i) => {
                      const priorityColor = { urgent: "text-red-600 bg-red-50 border-red-200", high: "text-amber-600 bg-amber-50 border-amber-200", medium: "text-blue-600 bg-blue-50 border-blue-200", low: "text-gray-500 bg-gray-50 border-gray-200" }[rec.priority] || "text-gray-500 bg-gray-50 border-gray-200";
                      return (
                        <div key={i} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${priorityColor}`}>{rec.priority}</span>
                            <span className="text-xs text-gray-400">{rec.category?.replace("_", " ")}</span>
                          </div>
                          <p className="font-semibold text-sm text-gray-800">{rec.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{rec.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
            );
          })()}
        </div>
      )}

      {/* ── History Tab ─────────────────────────────────────────────────────── */}
      {activeTab === "history" && (
        <div className="space-y-3">
          {loadingList && (
            <div className="text-center py-10 text-gray-400">Loading reports...</div>
          )}

          {!loadingList && reports.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              <p>No reports yet. Generate your first report!</p>
            </div>
          )}

          {reports.map(report => (
            <ReportRow
              key={report.id}
              report={report}
              onDownloadPdf={(id) => downloadReportPdf(id)}
              onDownloadCsv={(id) => downloadReportCsv(id)}
            />
          ))}

          {reports.some(r => r.status === "pending" || r.status === "generating") && (
            <p className="text-xs text-center text-blue-500 animate-pulse pt-2">
              Report generation in progress — page will refresh automatically...
            </p>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, AreaChart,
} from "recharts";
import RoleProtection from "@/components/RoleProtection";
import { USER_ROLES } from "@/hooks/useUserRole";
import {
  getPatientDashboardForProvider, getPatientToHCP,
  getPatientNotes, createPatientNote, updatePatientNote, deletePatientNote,
  getPatientRecommendations,
  getPatientThresholds, getPatientEffectiveThresholds, setPatientThreshold, deleteProviderThreshold,
  getPatientAlertHistory, providerAcknowledgeAlert,
  getPatientHistoryForProvider,
  generateReport, listReports, getReportPreview, downloadReportPdf, downloadReportCsv,
} from "@/services/api_calls";

// ── Constants & helpers ───────────────────────────────────────────────────────

const BIO_KEYS = [
  "heart_rate", "blood_pressure_systolic", "blood_pressure_diastolic",
  "glucose", "steps", "sleep",
];

const BIO_META = {
  heart_rate:               { label: "Heart Rate",       unit: "bpm",    color: "#f87171", stroke: "#f87171" },
  blood_pressure_systolic:  { label: "BP Systolic",      unit: "mmHg",   color: "#818cf8", stroke: "#818cf8" },
  blood_pressure_diastolic: { label: "BP Diastolic",     unit: "mmHg",   color: "#a78bfa", stroke: "#a78bfa" },
  glucose:                  { label: "Blood Glucose",    unit: "mg/dL",  color: "#fbbf24", stroke: "#fbbf24" },
  steps:                    { label: "Daily Steps",      unit: "steps",  color: "#34d399", stroke: "#34d399" },
  sleep:                    { label: "Sleep",            unit: "hrs",    color: "#94a3b8", stroke: "#94a3b8" },
};

const BIO_CARD_RING = {
  heart_rate:               "bg-rose-500/10   border-rose-500/20",
  blood_pressure_systolic:  "bg-indigo-500/10 border-indigo-500/20",
  blood_pressure_diastolic: "bg-violet-500/10 border-violet-500/20",
  glucose:                  "bg-amber-500/10  border-amber-500/20",
  steps:                    "bg-emerald-500/10 border-emerald-500/20",
  sleep:                    "bg-slate-500/10  border-slate-500/20",
  default:                  "bg-white/[0.04]  border-white/[0.08]",
};

const STATUS_BADGE = {
  pending:  "bg-amber-500/10 border-amber-500/20 text-amber-400",
  accepted: "bg-green-500/10 border-green-500/20 text-green-400",
  rejected: "bg-red-500/10   border-red-500/20   text-red-400",
};

const TABS = [
  { key: "overview",        label: "Overview",        icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { key: "history",         label: "History",         icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  { key: "recommendations", label: "Recommendations", icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" },
  { key: "alerts",          label: "Alerts",          icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" },
  { key: "notes",           label: "Notes",           icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
  { key: "reports",         label: "Reports",         icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
];

const RANGE_OPTIONS = [
  { label: "7d",  days: 7  },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
];

function formatDate(s)      { return s ? new Date(s).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "N/A"; }
function formatTs(s)        { return new Date(s).toLocaleString("en-US", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: true }); }
function daysAgoStr(n)      { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); }
function today()            { return new Date().toISOString().slice(0, 10); }

const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0a0f1e] border border-white/[0.12] rounded-xl px-3 py-2 text-xs shadow-2xl">
      <p className="text-white/30 mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: <span className="text-white/80">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PatientDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const patientUserId = params?.patient_Id;

  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  // Core data
  const [dashboard,      setDashboard]      = useState(null);
  const [patientRequest, setPatientRequest] = useState(null);

  // History
  const [historyData,     setHistoryData]    = useState({});          // { heart_rate: [...], ... }
  const [historyLoading,  setHistoryLoading] = useState(false);
  const [selectedBio,     setSelectedBio]    = useState("heart_rate");
  const [historyRange,    setHistoryRange]   = useState(30);

  // Notes
  const [notes,         setNotes]         = useState([]);
  const [editingNoteId, setEditingNoteId] = useState(null);

  // Recommendations
  const [patientRecs, setPatientRecs]   = useState([]);
  const [recsLoading, setRecsLoading]   = useState(true);

  // Thresholds & alerts
  const [thresholds,          setThresholds]          = useState([]);
  const [effectiveThresholds, setEffectiveThresholds] = useState([]);
  const [alertHistory,        setAlertHistory]        = useState([]);
  const [thresholdEdit,       setThresholdEdit]       = useState(null);
  const [thresholdSaving,     setThresholdSaving]     = useState(false);

  const editorRef = useRef(null);

  // Export
  const [exportOpen,       setExportOpen]       = useState(false);
  const [exportFrom,       setExportFrom]       = useState(() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10); });
  const [exportTo,         setExportTo]         = useState(() => new Date().toISOString().slice(0, 10));
  const [exportGenerating, setExportGenerating] = useState(false);
  const [exportError,      setExportError]      = useState("");

  // Reports tab
  const [patientReports,    setPatientReports]    = useState([]);
  const [reportsLoading,    setReportsLoading]    = useState(false);
  const [reportsPoll,       setReportsPoll]       = useState(null);
  const [reportPreview,     setReportPreview]     = useState(null);
  const [prevLoading,       setPrevLoading]       = useState(false);
  const [prevError,         setPrevError]         = useState("");
  const [activeBio,         setActiveBio]         = useState(null);
  const [reportDateFrom,    setReportDateFrom]    = useState(() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10); });
  const [reportDateTo,      setReportDateTo]      = useState(() => new Date().toISOString().slice(0, 10));

  const loadPatientReports = useCallback(async () => {
    if (!patientUserId) return;
    setReportsLoading(true);
    try {
      const res = await listReports({ patientUserId, limit: 50 });
      setPatientReports(res.reports || []);
    } catch { setPatientReports([]); }
    finally { setReportsLoading(false); }
  }, [patientUserId]);

  const loadReportPreview = useCallback(async (from = reportDateFrom, to = reportDateTo) => {
    if (!patientUserId) return;
    setPrevLoading(true); setPrevError("");
    try {
      const data = await getReportPreview({ dateFrom: from, dateTo: to, patientUserId });
      setReportPreview(data);
      if (data?.stats?.length) setActiveBio(data.stats.find(s => s.readings_count > 0)?.biomarker_type || null);
    } catch (e) { setPrevError(e.message || "Failed to load preview"); }
    finally { setPrevLoading(false); }
  }, [patientUserId, reportDateFrom, reportDateTo]);

  useEffect(() => {
    if (activeTab === "reports") { loadPatientReports(); loadReportPreview(); }
  }, [activeTab]);

  // Auto-poll while any report is pending/generating
  useEffect(() => {
    const hasPending = patientReports.some((r) => r.status === "pending" || r.status === "generating");
    if (!hasPending) { if (reportsPoll) { clearInterval(reportsPoll); setReportsPoll(null); } return; }
    if (reportsPoll) return;
    const id = setInterval(loadPatientReports, 5000);
    setReportsPoll(id);
    return () => { clearInterval(id); };
  }, [patientReports]);

  const handleExport = async (format) => {
    setExportGenerating(true); setExportError("");
    try {
      await generateReport({
        report_type: "custom",
        date_from: exportFrom,
        date_to: exportTo,
        patient_user_id: patientUserId,
        biomarker_types: null,
      });
      // Switch to Reports tab — it will auto-poll and show the report when ready
      setExportOpen(false);
      setActiveTab("reports");
      await loadPatientReports();
    } catch (e) { setExportError(e.message || "Export failed"); }
    finally { setExportGenerating(false); }
  };

  const handleDownload = async (reportId, format) => {
    try {
      if (format === "pdf") await downloadReportPdf(reportId, patientUserId);
      else                  await downloadReportCsv(reportId, patientUserId);
    } catch (e) { alert(e.message || "Download failed"); }
  };

  // ── Load all data ───────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true); setError("");
        if (!patientUserId || typeof patientUserId !== "string") throw new Error("Missing patient_Id route param.");

        const [dash, reqs, notesData, recsData, thresholdsData, effectiveData, alertsData] = await Promise.allSettled([
          getPatientDashboardForProvider(patientUserId),
          getPatientToHCP(),
          getPatientNotes(patientUserId),
          getPatientRecommendations(patientUserId),
          getPatientThresholds(patientUserId),
          getPatientEffectiveThresholds(patientUserId),
          getPatientAlertHistory(patientUserId, { limit: 20 }),
        ]);

        if (cancelled) return;

        const dashVal   = dash.status   === "fulfilled" ? dash.value   : null;
        const reqsVal   = reqs.status   === "fulfilled" ? reqs.value   : null;
        const match     = reqsVal?.requests?.find((r) => r.patient_user_id === patientUserId) ?? null;

        setDashboard(dashVal);
        setPatientRequest(match);
        setNotes(notesData.status === "fulfilled" ? (notesData.value?.notes || notesData.value || []) : []);
        setPatientRecs(recsData.status === "fulfilled" ? (recsData.value?.recommendations || []) : []);
        setRecsLoading(false);
        setThresholds(thresholdsData.status === "fulfilled" ? (thresholdsData.value || []) : []);
        setEffectiveThresholds(effectiveData.status === "fulfilled" ? (effectiveData.value || []) : []);
        setAlertHistory(alertsData.status === "fulfilled" ? (alertsData.value?.alerts || []) : []);
      } catch (e) {
        if (!cancelled) setError(e?.message || "Failed to load patient data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [patientUserId]);

  // ── Load history on tab open or range change ────────────────────────────────
  const loadHistory = useCallback(async (range = historyRange) => {
    if (!patientUserId) return;
    setHistoryLoading(true);
    try {
      const results = await Promise.allSettled(
        BIO_KEYS.map((bt) => getPatientHistoryForProvider(patientUserId, bt, { limit: 300 }))
      );
      const cutoff = new Date(daysAgoStr(range));
      const data = {};
      BIO_KEYS.forEach((bt, i) => {
        if (results[i].status !== "fulfilled") { data[bt] = []; return; }
        const raw = (results[i].value || [])
          .filter((r) => r.recorded_at && new Date(r.recorded_at) >= cutoff)
          .sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));
        // Group by day — take daily average
        const byDay = {};
        raw.forEach((r) => {
          const day = new Date(r.recorded_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
          if (!byDay[day]) byDay[day] = { sum: 0, count: 0, date: day };
          byDay[day].sum += Number(r.value); byDay[day].count += 1;
        });
        data[bt] = Object.values(byDay).map((d) => ({
          date:  d.date,
          value: bt === "steps" ? Math.round(d.sum / d.count) : parseFloat((d.sum / d.count).toFixed(1)),
        }));
      });
      setHistoryData(data);
    } catch {}
    finally { setHistoryLoading(false); }
  }, [patientUserId, historyRange]);

  useEffect(() => {
    if (activeTab === "history") loadHistory(historyRange);
  }, [activeTab, historyRange]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const patient = useMemo(() => ({
    name:         patientRequest?.patient_name  ?? dashboard?.patient_name  ?? "Patient",
    email:        patientRequest?.patient_email ?? dashboard?.patient_email ?? "",
    age:          typeof patientRequest?.patient_age === "number" && patientRequest.patient_age >= 0 ? patientRequest.patient_age : patientRequest?.patient_age ?? "N/A",
    requestedAt:  patientRequest?.requested_at  ?? null,
    acceptedAt:   patientRequest?.accepted_at   ?? null,
    status:       patientRequest?.status        ?? "",
    goals:        patientRequest?.patient_health_goals        ?? [],
    restrictions: patientRequest?.patient_health_restrictions ?? [],
  }), [patientRequest, dashboard]);

  const unacknowledgedAlerts = alertHistory.filter((a) => a.status === "triggered" || a.status === "notified").length;

  // ── Rich text helpers ───────────────────────────────────────────────────────
  const formatText    = (cmd) => { document.execCommand(cmd, false, null); editorRef.current?.focus(); };
  const getEditorHTML = ()    => editorRef.current?.innerHTML ?? "";
  const clearEditor   = ()    => { if (editorRef.current) editorRef.current.innerHTML = ""; };

  const handleEditNote = (noteId) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;
    if (editorRef.current) { editorRef.current.innerHTML = note.content || note.html; editorRef.current.focus(); }
    setEditingNoteId(noteId);
    setActiveTab("notes");
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm("Delete this note?")) return;
    try {
      await deletePatientNote(noteId);
      const n = await getPatientNotes(patientUserId);
      setNotes(n.notes || n || []);
    } catch (err) { alert("Failed to delete note."); }
  };

  const handleSaveNote = async () => {
    const html = getEditorHTML().trim();
    if (!html.replace(/<[^>]*>/g, "").trim()) return;
    try {
      if (editingNoteId) await updatePatientNote(editingNoteId, { content: html });
      else               await createPatientNote(patientUserId, { content: html });
      const n = await getPatientNotes(patientUserId);
      setNotes(n.notes || n || []);
      clearEditor(); setEditingNoteId(null);
    } catch { alert("Failed to save note."); }
  };

  // ── Loading / error states ──────────────────────────────────────────────────
  if (loading) {
    return (
      <RoleProtection allowedRoles={[USER_ROLES.PROVIDER]}>
        <div className="max-w-6xl mx-auto space-y-4 animate-pulse">
          <div className="h-36 rounded-2xl bg-white/[0.03] border border-white/[0.05]" />
          <div className="h-10 rounded-xl bg-white/[0.03] border border-white/[0.05] w-2/3" />
          <div className="grid grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-white/[0.03] border border-white/[0.05]" />)}
          </div>
        </div>
      </RoleProtection>
    );
  }

  if (error) {
    return (
      <RoleProtection allowedRoles={[USER_ROLES.PROVIDER]}>
        <div className="max-w-3xl mx-auto px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      </RoleProtection>
    );
  }

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <RoleProtection allowedRoles={[USER_ROLES.PROVIDER]}>
      <div className="max-w-6xl mx-auto pb-16">

        {/* Back */}
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-white/25 hover:text-white/60 text-sm mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Patients
        </button>

        {/* ── Patient header ──────────────────────────────────────────────── */}
        <div className="mb-6 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 flex flex-col sm:flex-row sm:items-center gap-5 relative">
          <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
            <div className="absolute -right-16 -top-16 w-52 h-52 rounded-full bg-indigo-500/[0.04] blur-3xl" />
            <div className="absolute right-32 bottom-0 w-36 h-36 rounded-full bg-purple-500/[0.04] blur-3xl" />
          </div>

          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-bold text-indigo-300">{patient.name.charAt(0).toUpperCase()}</span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="font-[family-name:var(--font-serif)] text-white text-2xl font-bold">{patient.name}</h1>
            <p className="text-white/40 text-sm mt-0.5">{patient.email}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_BADGE[patient.status] || "bg-white/[0.05] border-white/[0.08] text-white/30"}`}>
                {patient.status?.charAt(0).toUpperCase() + patient.status?.slice(1)}
              </span>
              {patient.age !== "N/A" && (
                <span className="px-2.5 py-1 rounded-full text-xs border border-white/[0.07] text-white/35">Age {patient.age}</span>
              )}
              {patient.acceptedAt && (
                <span className="text-white/20 text-xs">Connected {formatDate(patient.acceptedAt)}</span>
              )}
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex gap-4 sm:gap-6 flex-shrink-0">
            {[
              { label: "Goals",    value: patient.goals.length },
              { label: "Active Recs", value: patientRecs.filter(r => r.status === "active" || r.status === "in_progress").length },
              { label: "Alerts",   value: unacknowledgedAlerts, highlight: unacknowledgedAlerts > 0 },
            ].map(({ label, value, highlight }) => (
              <div key={label} className="text-center">
                <p className={`text-xl font-bold ${highlight ? "text-amber-400" : "text-white/80"}`}>{value}</p>
                <p className="text-white/25 text-xs">{label}</p>
              </div>
            ))}
          </div>

          {/* Export button */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => { setExportOpen((v) => !v); setExportError(""); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium hover:bg-indigo-500/20 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Report
            </button>

            {exportOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-white/[0.1] bg-[#0d1525] shadow-2xl p-4 z-50 space-y-3">
                <p className="text-white/50 text-xs font-semibold uppercase tracking-widest">Export Health Report</p>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <label className="text-white/30 text-xs w-8">From</label>
                    <input type="date" value={exportFrom} max={exportTo}
                      onChange={(e) => setExportFrom(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/60 text-xs focus:outline-none focus:border-indigo-500/50" />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-white/30 text-xs w-8">To</label>
                    <input type="date" value={exportTo} min={exportFrom} max={new Date().toISOString().slice(0,10)}
                      onChange={(e) => setExportTo(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/60 text-xs focus:outline-none focus:border-indigo-500/50" />
                  </div>
                </div>

                {exportError && (
                  <p className="text-red-400 text-xs px-1">{exportError}</p>
                )}

                {exportGenerating ? (
                  <div className="flex items-center justify-center gap-2 py-3 text-white/40 text-xs">
                    <div className="w-4 h-4 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin" />
                    Generating report…
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => handleExport("pdf")}
                      className="flex-1 py-2 rounded-xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-xs font-semibold hover:bg-indigo-500/20 transition-colors">
                      PDF
                    </button>
                    <button onClick={() => handleExport("csv")}
                      className="flex-1 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/45 text-xs font-semibold hover:bg-white/[0.07] transition-colors">
                      CSV
                    </button>
                  </div>
                )}

                <p className="text-white/15 text-[10px] text-center">Report generates in background (~30s)</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Tab bar ─────────────────────────────────────────────────────── */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const badge = tab.key === "alerts" && unacknowledgedAlerts > 0 ? unacknowledgedAlerts : tab.key === "notes" && notes.length > 0 ? notes.length : null;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-indigo-500/15 border-indigo-500/25 text-indigo-300"
                    : "bg-white/[0.03] border-white/[0.06] text-white/35 hover:text-white/60 hover:bg-white/[0.05]"
                }`}
              >
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                {tab.label}
                {badge && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab.key === "alerts" ? "bg-amber-500/20 text-amber-400" : "bg-white/10 text-white/40"}`}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Tab content ─────────────────────────────────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className={`${activeTab === "reports" ? "lg:col-span-3" : "lg:col-span-2"} space-y-5`}>

            {/* ══ OVERVIEW TAB ══════════════════════════════════════════════ */}
            {activeTab === "overview" && (
              <>
                {/* Current biomarkers */}
                <Card title="Current Biomarkers">
                  {!dashboard ? (
                    <p className="text-white/25 text-sm">No biomarker data available.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {BIO_KEYS.map((key) => {
                        const item = dashboard?.[key];
                        if (!item) return null;
                        const meta   = BIO_META[key];
                        const ring   = BIO_CARD_RING[key] || BIO_CARD_RING.default;
                        return (
                          <div key={key} className={`rounded-xl border px-4 py-3 ${ring} relative overflow-hidden`}>
                            <div className="absolute bottom-0 right-0 w-12 h-12 rounded-full blur-xl opacity-30" style={{ backgroundColor: meta.color }} />
                            <p className="text-white/30 text-[11px] uppercase tracking-widest">{meta.label}</p>
                            <p className="text-white text-xl font-bold mt-1">{item?.value ?? "—"}</p>
                            <p className="text-white/30 text-xs">{item?.unit ?? meta.unit}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>

                {/* Health goals */}
                <Card title="Health Goals">
                  {patient.goals?.length > 0 ? (
                    <ul className="space-y-2">
                      {patient.goals.map((goal, i) => (
                        <li key={i} className="flex items-center gap-2.5 text-sm text-white/55">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                          <span className="flex-1">{typeof goal === "string" ? goal : goal.goal}</span>
                          {typeof goal === "object" && goal.frequency && (
                            <span className="text-[10px] text-indigo-400 bg-indigo-500/15 border border-indigo-500/20 px-2 py-0.5 rounded-full uppercase tracking-wide">{goal.frequency}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-white/25 text-sm">No health goals provided.</p>}
                </Card>

                {/* Health restrictions */}
                <Card title="Health Restrictions">
                  {patient.restrictions?.length > 0 ? (
                    <ul className="space-y-2">
                      {patient.restrictions.map((r, i) => (
                        <li key={i} className="flex items-center gap-2.5 text-sm text-white/55">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-white/25 text-sm">No health restrictions.</p>}
                </Card>
              </>
            )}

            {/* ══ HISTORY TAB ════════════════════════════════════════════════ */}
            {activeTab === "history" && (
              <>
                {/* Range selector */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex gap-2">
                    {RANGE_OPTIONS.map((r) => (
                      <button
                        key={r.days}
                        onClick={() => setHistoryRange(r.days)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${historyRange === r.days ? "bg-indigo-500/15 border-indigo-500/25 text-indigo-300" : "bg-white/[0.03] border-white/[0.06] text-white/35 hover:text-white/60"}`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                  {historyLoading && (
                    <div className="flex items-center gap-1.5 text-white/25 text-xs">
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin" />
                      Loading…
                    </div>
                  )}
                </div>

                {/* Biomarker pill selector */}
                <div className="flex flex-wrap gap-2">
                  {BIO_KEYS.map((key) => {
                    const meta = BIO_META[key];
                    const isSel = selectedBio === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedBio(key)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${isSel ? "border-current text-white/80" : "border-white/[0.08] text-white/30 hover:text-white/55 hover:border-white/20"}`}
                        style={isSel ? { borderColor: meta.color + "55", backgroundColor: meta.color + "14", color: meta.color } : {}}
                      >
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: meta.color }} />
                        {meta.label}
                      </button>
                    );
                  })}
                </div>

                {/* Main chart */}
                {(() => {
                  const meta    = BIO_META[selectedBio];
                  const data    = historyData[selectedBio] || [];
                  const hasData = data.length > 0;
                  const ring    = BIO_CARD_RING[selectedBio] || BIO_CARD_RING.default;
                  return (
                    <div className={`rounded-2xl border p-5 ${ring}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-white/60 font-semibold">{meta.label}</p>
                          <p className="text-white/25 text-xs">{meta.unit} · last {historyRange} days</p>
                        </div>
                        {hasData && (
                          <div className="flex gap-4 text-right text-xs">
                            {[
                              ["Min", Math.min(...data.map(d => d.value))],
                              ["Max", Math.max(...data.map(d => d.value))],
                              ["Latest", data[data.length - 1]?.value],
                            ].map(([lbl, val]) => (
                              <div key={lbl}>
                                <p className="text-white/25">{lbl}</p>
                                <p className="text-white/70 font-semibold">{val}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {historyLoading ? (
                        <div className="h-52 rounded-xl bg-white/[0.03] animate-pulse" />
                      ) : !hasData ? (
                        <div className="h-52 flex items-center justify-center text-white/20 text-sm rounded-xl border border-dashed border-white/[0.07]">
                          No data for this period
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={220}>
                          <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id={`grad-${selectedBio}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%"  stopColor={meta.color} stopOpacity={0.25} />
                                <stop offset="95%" stopColor={meta.color} stopOpacity={0}    />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.25)" }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.25)" }} axisLine={false} tickLine={false} />
                            <Tooltip content={<DarkTooltip />} />
                            <Area type="monotone" dataKey="value" stroke={meta.color} strokeWidth={2}
                              fill={`url(#grad-${selectedBio})`} dot={false} activeDot={{ r: 5, fill: meta.color, strokeWidth: 0 }} name={meta.label} />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  );
                })()}

                {/* Mini sparklines for all other biomarkers */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {BIO_KEYS.filter((k) => k !== selectedBio).map((key) => {
                    const meta   = BIO_META[key];
                    const data   = historyData[key] || [];
                    const ring   = BIO_CARD_RING[key] || BIO_CARD_RING.default;
                    const latest = data[data.length - 1]?.value;
                    return (
                      <button key={key} onClick={() => setSelectedBio(key)} className={`rounded-xl border p-3 text-left hover:brightness-110 transition-all ${ring}`}>
                        <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">{meta.label}</p>
                        {data.length > 1 ? (
                          <ResponsiveContainer width="100%" height={40}>
                            <LineChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                              <Line type="monotone" dataKey="value" stroke={meta.color} strokeWidth={1.5} dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-10 flex items-center">
                            <span className="text-white/20 text-xs">No data</span>
                          </div>
                        )}
                        {latest && <p className="text-white/60 text-xs font-semibold mt-1">{latest} <span className="text-white/25 font-normal">{meta.unit}</span></p>}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* ══ RECOMMENDATIONS TAB ════════════════════════════════════════ */}
            {activeTab === "recommendations" && (
              <Card title="AI Recommendations">
                {recsLoading ? (
                  <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-white/[0.04] animate-pulse" />)}</div>
                ) : patientRecs.length === 0 ? (
                  <div className="py-10 text-center">
                    <svg className="w-10 h-10 mx-auto mb-2 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                    <p className="text-white/20 text-sm">No AI recommendations generated yet.</p>
                  </div>
                ) : (
                  <>
                    {/* Summary row */}
                    <div className="grid grid-cols-3 gap-3 mb-5">
                      {[
                        { label: "Total",      val: patientRecs.length,                                                              color: "text-white/70" },
                        { label: "Active",     val: patientRecs.filter(r => r.status==="active"||r.status==="in_progress").length,   color: "text-indigo-400" },
                        { label: "Completed",  val: patientRecs.filter(r => r.status==="completed").length,                          color: "text-green-400" },
                      ].map(({ label, val, color }) => (
                        <div key={label} className="rounded-xl bg-white/[0.04] border border-white/[0.07] p-3 text-center">
                          <p className={`text-xl font-bold ${color}`}>{val}</p>
                          <p className="text-white/25 text-xs">{label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Recommendation cards */}
                    <div className="space-y-3">
                      {patientRecs.map((rec) => {
                        const progress     = rec.progress_percentage || 0;
                        const steps        = rec.action_steps || [];
                        const completedSteps = steps.filter(s => s.completed).length;
                        const isCompleted  = rec.status === "completed";
                        const isInProgress = rec.status === "in_progress";
                        const catColor     = rec.category_display?.color || "#6b7280";
                        const statusBadge  = isCompleted ? "bg-green-500/10 border-green-500/20 text-green-400" : isInProgress ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" : rec.status === "dismissed" ? "bg-white/[0.05] border-white/[0.07] text-white/25" : "bg-amber-500/10 border-amber-500/20 text-amber-400";
                        const cardBg       = isCompleted ? "border-green-500/12 bg-green-500/[0.04]" : isInProgress ? "border-indigo-500/12 bg-indigo-500/[0.04]" : "border-white/[0.07] bg-white/[0.02]";
                        const barColor     = progress >= 80 ? "#34d399" : progress >= 50 ? "#818cf8" : progress >= 25 ? "#fbbf24" : "rgba(255,255,255,0.15)";
                        return (
                          <div key={rec.id} className={`rounded-xl border p-4 ${cardBg}`}>
                            <div className="flex items-start gap-3 mb-3">
                              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: catColor }} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p className={`text-sm font-semibold ${isCompleted ? "line-through text-white/25" : "text-white/75"}`}>{rec.title}</p>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${statusBadge}`}>
                                    {isCompleted ? "Done" : isInProgress ? "Active" : rec.status === "dismissed" ? "Dismissed" : "Pending"}
                                  </span>
                                </div>
                                {rec.description && <p className="text-white/35 text-xs mt-1 leading-relaxed">{rec.description}</p>}
                              </div>
                            </div>

                            {/* Progress */}
                            <div className="mb-3">
                              <div className="flex items-center justify-between text-xs mb-1.5">
                                <span className="text-white/25">{steps.length > 0 ? `${completedSteps}/${steps.length} steps` : "Progress"}</span>
                                <span className="font-bold" style={{ color: barColor }}>{progress}%</span>
                              </div>
                              <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: barColor }} />
                              </div>
                            </div>

                            {/* Steps */}
                            {steps.length > 0 && (
                              <div className="space-y-1.5">
                                {steps.map((step) => (
                                  <div key={step.step_number} className="flex items-center gap-2 text-xs">
                                    <span className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center ${step.completed ? "bg-green-500 border-green-500" : "border-white/20 bg-white/[0.04]"}`}>
                                      {step.completed && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                    </span>
                                    <span className={step.completed ? "text-white/20 line-through" : "text-white/45"}>{step.instruction}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Meta pills */}
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {rec.category_display?.label && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: rec.category_display.bg_color + "33", color: catColor }}>{rec.category_display.label}</span>
                              )}
                              {rec.priority && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${rec.priority === "urgent" ? "bg-red-500/10 border-red-500/20 text-red-400" : rec.priority === "high" ? "bg-orange-500/10 border-orange-500/20 text-orange-400" : rec.priority === "medium" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-green-500/10 border-green-500/20 text-green-400"}`}>
                                  {rec.priority}
                                </span>
                              )}
                              {rec.difficulty && <span className="text-[10px] text-white/20 capitalize">{rec.difficulty}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </Card>
            )}

            {/* ══ ALERTS & THRESHOLDS TAB ════════════════════════════════════ */}
            {activeTab === "alerts" && (
              <>
                {/* Alert history */}
                <Card title="Alert History">
                  {alertHistory.length === 0 ? (
                    <p className="text-white/25 text-sm">No alerts triggered for this patient.</p>
                  ) : (
                    <div className="space-y-2">
                      {alertHistory.map((alert) => {
                        const isCritical = alert.alert_type === "critical";
                        const isUnread   = alert.status === "triggered" || alert.status === "notified";
                        const label      = alert.biomarker_type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                        const bg = isCritical
                          ? isUnread ? "bg-red-500/[0.08] border-red-500/25" : "bg-red-500/[0.04] border-red-500/12"
                          : isUnread ? "bg-amber-500/[0.08] border-amber-500/25" : "bg-amber-500/[0.04] border-amber-500/12";
                        return (
                          <div key={alert.id} className={`rounded-xl border p-3 ${bg}`}>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${isCritical ? "bg-red-500/15 border-red-500/25 text-red-400" : "bg-amber-500/15 border-amber-500/25 text-amber-400"}`}>
                                  {isCritical ? "CRITICAL" : "WARNING"}
                                </span>
                                <span className="text-white/60 text-sm font-medium">{label}</span>
                                <span className="text-white/35 text-sm">{alert.value} {alert.unit}
                                  <span className="text-white/20 text-xs ml-1">({alert.alert_direction})</span>
                                </span>
                              </div>
                              {isUnread && (
                                <button
                                  onClick={async () => {
                                    try {
                                      await providerAcknowledgeAlert(alert.id);
                                      setAlertHistory(prev => prev.map(a => a.id === alert.id ? { ...a, status: "acknowledged" } : a));
                                    } catch {}
                                  }}
                                  className="text-[10px] px-2.5 py-1 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white/40 hover:text-white/60 hover:bg-white/[0.08] transition-colors flex-shrink-0"
                                >
                                  Acknowledge
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1.5 text-[10px] text-white/20">
                              <span>{new Date(alert.created_at).toLocaleString()}</span>
                              <span>Source: {alert.threshold_source}</span>
                              {alert.status === "acknowledged" && <span className="text-green-400">✓ Acknowledged</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>

                {/* Custom thresholds */}
                <Card title="Custom Thresholds">
                  <p className="text-white/20 text-xs mb-4">Your thresholds override patient and default values.</p>
                  {effectiveThresholds.length === 0 ? (
                    <p className="text-white/25 text-sm">No threshold data available.</p>
                  ) : (
                    <div className="space-y-2">
                      {effectiveThresholds.map((t) => {
                        const isEditing   = thresholdEdit?.biomarker_type === t.biomarker_type;
                        const label       = t.biomarker_type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                        const sourceCls   = t.source === "provider" ? "bg-purple-500/10 border-purple-500/20 text-purple-400" : t.source === "patient" ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" : "bg-white/[0.05] border-white/[0.08] text-white/25";
                        const sourceLabel = t.source === "provider" ? "Provider" : t.source === "patient" ? "Patient" : "Default";
                        return (
                          <div key={t.biomarker_type} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <p className="text-white/60 text-sm font-medium">{label}</p>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${sourceCls}`}>{sourceLabel}</span>
                              </div>
                              {!isEditing && (
                                <button onClick={() => setThresholdEdit({ biomarker_type: t.biomarker_type, warning_low: t.warning_low ?? "", warning_high: t.warning_high ?? "", critical_low: t.critical_low ?? "", critical_high: t.critical_high ?? "" })}
                                  className="text-xs text-indigo-400 hover:text-indigo-300">
                                  Set
                                </button>
                              )}
                            </div>
                            {!isEditing ? (
                              <div className="grid grid-cols-4 gap-2 text-xs">
                                <div><p className="text-white/20">Crit Low</p><p className="font-medium text-red-400">{t.critical_low ?? "—"}</p></div>
                                <div><p className="text-white/20">Warn Low</p><p className="font-medium text-amber-400">{t.warning_low ?? "—"}</p></div>
                                <div><p className="text-white/20">Warn High</p><p className="font-medium text-amber-400">{t.warning_high ?? "—"}</p></div>
                                <div><p className="text-white/20">Crit High</p><p className="font-medium text-red-400">{t.critical_high ?? "—"}</p></div>
                              </div>
                            ) : (
                              <div>
                                <div className="grid grid-cols-4 gap-2 text-xs mb-2">
                                  {["critical_low","warning_low","warning_high","critical_high"].map((field) => (
                                    <div key={field}>
                                      <label className="text-white/20 capitalize">{field.replace(/_/g," ")}</label>
                                      <input type="number" step="any" value={thresholdEdit[field]}
                                        onChange={(e) => setThresholdEdit(prev => ({ ...prev, [field]: e.target.value }))}
                                        className="w-full mt-0.5 px-2 py-1 bg-white/[0.06] border border-white/[0.1] rounded text-xs text-white/70 focus:outline-none focus:border-indigo-500/50" />
                                    </div>
                                  ))}
                                </div>
                                <div className="flex gap-2">
                                  <button disabled={thresholdSaving} onClick={async () => {
                                    setThresholdSaving(true);
                                    try {
                                      await setPatientThreshold(patientUserId, {
                                        biomarker_type: thresholdEdit.biomarker_type,
                                        warning_low:   thresholdEdit.warning_low   === "" ? null : Number(thresholdEdit.warning_low),
                                        warning_high:  thresholdEdit.warning_high  === "" ? null : Number(thresholdEdit.warning_high),
                                        critical_low:  thresholdEdit.critical_low  === "" ? null : Number(thresholdEdit.critical_low),
                                        critical_high: thresholdEdit.critical_high === "" ? null : Number(thresholdEdit.critical_high),
                                      });
                                      const [n, e] = await Promise.all([getPatientThresholds(patientUserId), getPatientEffectiveThresholds(patientUserId)]);
                                      setThresholds(n||[]); setEffectiveThresholds(e||[]); setThresholdEdit(null);
                                    } catch {}
                                    finally { setThresholdSaving(false); }
                                  }} className="text-xs px-3 py-1.5 bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 rounded-lg hover:bg-indigo-500/20 disabled:opacity-40">
                                    {thresholdSaving ? "Saving…" : "Save"}
                                  </button>
                                  <button onClick={() => setThresholdEdit(null)} className="text-xs px-2 py-1 text-white/25 hover:text-white/50">Cancel</button>
                                  {thresholds.find(x => x.biomarker_type === thresholdEdit.biomarker_type && x.set_by_role === "provider") && (
                                    <button onClick={async () => {
                                      const ex = thresholds.find(x => x.biomarker_type === thresholdEdit.biomarker_type && x.set_by_role === "provider");
                                      if (!ex) return;
                                      setThresholdSaving(true);
                                      try {
                                        await deleteProviderThreshold(ex.id);
                                        const [n, e] = await Promise.all([getPatientThresholds(patientUserId), getPatientEffectiveThresholds(patientUserId)]);
                                        setThresholds(n||[]); setEffectiveThresholds(e||[]); setThresholdEdit(null);
                                      } catch {}
                                      finally { setThresholdSaving(false); }
                                    }} className="text-xs px-2 py-1 text-red-400 hover:text-red-300">Remove Override</button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </>
            )}

            {/* ══ NOTES TAB ══════════════════════════════════════════════════ */}
            {activeTab === "notes" && (
              <Card title="Clinical Notes">
                {notes.length === 0 ? (
                  <p className="text-white/25 text-sm">No notes yet. Add one using the panel on the right.</p>
                ) : (
                  <div className="space-y-4">
                    {notes.map((note) => (
                      <div key={note.id} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                        <div
                          className="text-white/60 text-sm prose prose-invert max-w-none"
                          dangerouslySetInnerHTML={{ __html: note.content || note.html }}
                        />
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.05]">
                          <div>
                            <p className="text-white/45 text-xs font-medium">{note.provider_name || note.hcp_name || "Provider"}</p>
                            <p className="text-white/20 text-xs">{formatTs(note.created_at || note.createdAt)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-white/15 text-[10px]">{note.is_read ? "Read" : "Unread"}</span>
                            <button onClick={() => handleEditNote(note.id)} className="text-xs text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded-lg hover:bg-indigo-500/10 transition-colors">Edit</button>
                            <button onClick={() => handleDeleteNote(note.id)} className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-colors">Delete</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* ── Reports tab ─────────────────────────────────────────────── */}
            {activeTab === "reports" && (
              <div className="space-y-6">

                {/* Date range + reload */}
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-white/30 text-xs">From</label>
                    <input type="date" value={reportDateFrom} max={reportDateTo}
                      onChange={(e) => setReportDateFrom(e.target.value)}
                      className="px-2.5 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/60 text-xs focus:outline-none focus:border-indigo-500/50" />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-white/30 text-xs">To</label>
                    <input type="date" value={reportDateTo} min={reportDateFrom} max={new Date().toISOString().slice(0,10)}
                      onChange={(e) => setReportDateTo(e.target.value)}
                      className="px-2.5 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/60 text-xs focus:outline-none focus:border-indigo-500/50" />
                  </div>
                  <button onClick={() => loadReportPreview(reportDateFrom, reportDateTo)} disabled={prevLoading}
                    className="px-4 py-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-xs font-semibold hover:bg-indigo-500/20 transition-colors disabled:opacity-40">
                    {prevLoading ? "Loading…" : "Load Report"}
                  </button>
                  {prevError && <p className="text-red-400 text-xs">{prevError}</p>}
                </div>

                {/* Loading */}
                {prevLoading && (
                  <div className="flex items-center justify-center py-16 gap-3 text-white/30 text-sm">
                    <div className="w-5 h-5 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin" />
                    Loading patient data…
                  </div>
                )}

                {/* Full detailed preview */}
                {reportPreview && !prevLoading && (() => {
                  const BIO_OPTIONS = [
                    { value: "heart_rate",               label: "Heart Rate",    unit: "bpm",   color: "#f87171" },
                    { value: "blood_pressure_systolic",  label: "BP Systolic",   unit: "mmHg",  color: "#fb923c" },
                    { value: "blood_pressure_diastolic", label: "BP Diastolic",  unit: "mmHg",  color: "#fbbf24" },
                    { value: "glucose",                  label: "Blood Glucose", unit: "mg/dL", color: "#34d399" },
                    { value: "steps",                    label: "Daily Steps",   unit: "steps", color: "#60a5fa" },
                    { value: "sleep",                    label: "Sleep",         unit: "hrs",   color: "#a78bfa" },
                  ];
                  const NORMALS_MAP = {
                    heart_rate: { min:60, max:100 }, blood_pressure_systolic: { min:90, max:120 },
                    blood_pressure_diastolic: { min:60, max:80 }, glucose: { min:70, max:100 },
                    steps: { min:7000, max:15000 }, sleep: { min:7, max:9 },
                  };
                  const TREND_CLS  = { improving:"text-green-400", declining:"text-red-400", stable:"text-indigo-400", insufficient_data:"text-white/25" };
                  const TREND_ICON = { improving:"↑", declining:"↓", stable:"→", insufficient_data:"–" };
                  const fmtD = (ts) => { const d = new Date(ts); return isNaN(d) ? "—" : d.toLocaleDateString(undefined, { month:"short", day:"numeric", year:"numeric" }); };
                  const activeBioMeta = BIO_OPTIONS.find(b => b.value === activeBio);
                  const activeStat   = reportPreview.stats?.find(s => s.biomarker_type === activeBio);
                  const chartData    = (reportPreview.series?.[activeBio] || [])
                    .map(p => ({ ts: new Date(p.date || p.recorded_at || p.ts || 0).getTime(), v: Number(p.value ?? p.v) }))
                    .filter(p => isFinite(p.ts) && p.ts > 0 && isFinite(p.v)).sort((a,b) => a.ts - b.ts);
                  const scoreData    = (reportPreview.score_series || [])
                    .map(p => ({ ts: new Date(p.date||0).getTime(), v: Number(p.score) }))
                    .filter(p => isFinite(p.ts) && p.ts > 0 && isFinite(p.v)).sort((a,b) => a.ts - b.ts);

                  return (
                    <div className="space-y-5">
                      {/* Report header */}
                      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 flex items-start justify-between gap-4">
                        <div>
                          <p className="text-white/25 text-[10px] uppercase tracking-widest font-semibold">Pulse Health Report — Provider View</p>
                          <p className="text-white/70 font-semibold mt-0.5">{fmtD(reportDateFrom)} — {fmtD(reportDateTo)}</p>
                          <p className="text-white/30 text-xs mt-1">
                            Patient: <span className="text-white/50 font-medium">{patient.name}</span> ·{" "}
                            {reportPreview.stats?.filter(s => s.readings_count > 0).length || 0} biomarkers · {reportPreview.stats?.reduce((a,s) => a + s.readings_count, 0) || 0} readings
                          </p>
                        </div>
                        <p className="text-white/25 text-xs flex-shrink-0">{new Date().toLocaleDateString()}</p>
                      </div>

                      {/* Stat cards */}
                      {(() => {
                        const hr   = reportPreview.stats?.find(s => s.biomarker_type === "heart_rate");
                        const gluc = reportPreview.stats?.find(s => s.biomarker_type === "glucose");
                        const stp  = reportPreview.stats?.find(s => s.biomarker_type === "steps");
                        const avgScore = reportPreview.score_series?.length
                          ? Math.round(reportPreview.score_series.reduce((a,x) => a + (x.score||0), 0) / reportPreview.score_series.length) : null;
                        return (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                              { label:"Avg Health Score", val:avgScore,  sfx:"/100",   cls:"text-indigo-400", grad:"from-indigo-500/10 to-indigo-500/5 border-indigo-500/15" },
                              { label:"Avg Heart Rate",   val:hr?.avg,   sfx:" bpm",   cls:"text-red-400",    grad:"from-red-500/10 to-red-500/5 border-red-500/15" },
                              { label:"Avg Glucose",      val:gluc?.avg, sfx:" mg/dL", cls:"text-green-400",  grad:"from-green-500/10 to-green-500/5 border-green-500/15" },
                              { label:"Avg Steps", val:stp?.avg!=null?Math.round(stp.avg).toLocaleString():null, sfx:"", cls:"text-blue-400", grad:"from-blue-500/10 to-blue-500/5 border-blue-500/15" },
                            ].map(s => (
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
                      {scoreData.length > 1 && (
                        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
                          <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-4">Health Score Trend</p>
                          <ResponsiveContainer width="100%" height={140}>
                            <AreaChart data={scoreData} margin={{ top:4, right:4, left:-20, bottom:0 }}>
                              <defs>
                                <linearGradient id="rScoreGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%"  stopColor="#818cf8" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0}   />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 4" stroke="rgba(255,255,255,0.05)" />
                              <XAxis dataKey="ts" type="number" scale="time" domain={["auto","auto"]} tickCount={5}
                                tickFormatter={t => new Date(t).toLocaleDateString(undefined,{month:"short",day:"numeric"})}
                                tick={{fill:"rgba(255,255,255,0.25)",fontSize:10}} axisLine={false} tickLine={false} />
                              <YAxis domain={[0,100]} tick={{fill:"rgba(255,255,255,0.25)",fontSize:10}} axisLine={false} tickLine={false} />
                              <Tooltip contentStyle={{background:"#0a0f1e",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,fontSize:11}} />
                              <Area type="monotone" dataKey="v" name="Score" stroke="#818cf8" strokeWidth={2} fill="url(#rScoreGrad)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {/* Biomarker Analysis */}
                      {reportPreview.stats?.filter(s => s.readings_count > 0).length > 0 && (
                        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 space-y-5">
                          <p className="text-white/50 text-xs font-semibold uppercase tracking-widest">Biomarker Analysis</p>
                          <div className="flex flex-wrap gap-2">
                            {reportPreview.stats.filter(s => s.readings_count > 0).map(s => {
                              const m = BIO_OPTIONS.find(b => b.value === s.biomarker_type);
                              const isA = activeBio === s.biomarker_type;
                              return (
                                <button key={s.biomarker_type} onClick={() => setActiveBio(s.biomarker_type)}
                                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${isA?"":"border-white/[0.07] text-white/35 hover:border-white/20"}`}
                                  style={isA && m ? {borderColor:m.color+"60",background:m.color+"15",color:m.color} : {}}>
                                  {m?.label || s.biomarker_type}
                                </button>
                              );
                            })}
                          </div>
                          {activeStat && activeBioMeta && (
                            <div className="space-y-4">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold capitalize
                                  ${activeStat.status==="normal"?"bg-green-500/10 border-green-500/20 text-green-400":
                                    activeStat.status==="borderline"?"bg-amber-500/10 border-amber-500/20 text-amber-400":
                                    activeStat.status==="abnormal"?"bg-red-500/10 border-red-500/20 text-red-400":
                                    "bg-white/[0.05] border-white/[0.08] text-white/30"}`}>
                                  {activeStat.status?.replace("_"," ") || "No data"}
                                </span>
                                <span className={`text-xs font-semibold ${TREND_CLS[activeStat.trend]||"text-white/30"}`}>
                                  {TREND_ICON[activeStat.trend]||"–"} {activeStat.trend?.replace(/_/g," ")}
                                </span>
                                <span className="text-white/25 text-xs">{activeStat.readings_count} readings</span>
                              </div>
                              <div className="grid grid-cols-4 gap-2">
                                {[["Avg",activeStat.avg],["Min",activeStat.min],["Max",activeStat.max],["Latest",activeStat.latest]].map(([l,v]) => (
                                  <div key={l} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 text-center">
                                    <p className="text-white/25 text-xs mb-0.5">{l}</p>
                                    <p className="font-bold" style={{color:activeBioMeta.color}}>
                                      {v!=null?(activeBio==="steps"?Math.round(v).toLocaleString():Number(v).toFixed(1)):"—"}
                                    </p>
                                    <p className="text-white/20 text-[10px]">{activeStat.unit}</p>
                                  </div>
                                ))}
                              </div>
                              {activeStat.days_total > 0 && (
                                <div>
                                  <div className="flex items-center justify-between mb-1.5">
                                    <p className="text-white/35 text-xs">Days in normal range</p>
                                    <p className="text-white/50 text-xs font-semibold">{activeStat.days_in_normal}/{activeStat.days_total} ({Math.round(activeStat.days_in_normal/activeStat.days_total*100)}%)</p>
                                  </div>
                                  <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                                    <div className="h-full rounded-full" style={{width:`${Math.round(activeStat.days_in_normal/activeStat.days_total*100)}%`,background:activeBioMeta.color+"cc"}} />
                                  </div>
                                </div>
                              )}
                              {chartData.length > 0 && (
                                <ResponsiveContainer width="100%" height={180}>
                                  <AreaChart data={chartData} margin={{top:4,right:4,left:-20,bottom:0}}>
                                    <defs>
                                      <linearGradient id="rBioGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor={activeBioMeta.color} stopOpacity={0.25} />
                                        <stop offset="95%" stopColor={activeBioMeta.color} stopOpacity={0} />
                                      </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 4" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="ts" type="number" scale="time" domain={["auto","auto"]} tickCount={5}
                                      tickFormatter={t => new Date(t).toLocaleDateString(undefined,{month:"short",day:"numeric"})}
                                      tick={{fill:"rgba(255,255,255,0.25)",fontSize:10}} axisLine={false} tickLine={false} />
                                    <YAxis tick={{fill:"rgba(255,255,255,0.25)",fontSize:10}} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{background:"#0a0f1e",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,fontSize:11}} />
                                    {NORMALS_MAP[activeBio]?.min != null && <ReferenceLine y={NORMALS_MAP[activeBio].min} stroke="rgba(52,211,153,0.3)" strokeDasharray="4 3" />}
                                    {NORMALS_MAP[activeBio]?.max != null && <ReferenceLine y={NORMALS_MAP[activeBio].max} stroke="rgba(248,113,113,0.3)" strokeDasharray="4 3" />}
                                    <Area type="monotone" dataKey="v" name={activeBioMeta.label} stroke={activeBioMeta.color} strokeWidth={2} fill="url(#rBioGrad)"
                                      dot={chartData.length < 20 ? {r:3,fill:activeBioMeta.color,strokeWidth:0} : false} />
                                  </AreaChart>
                                </ResponsiveContainer>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Goals Performance */}
                      {reportPreview.goals_total > 0 && (
                        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 space-y-4">
                          <p className="text-white/50 text-xs font-semibold uppercase tracking-widest">Goals Performance</p>
                          <div className="flex items-center gap-5">
                            <div className="flex-shrink-0 text-center">
                              <p className={`text-4xl font-bold ${reportPreview.goals_completion_rate>=80?"text-green-400":reportPreview.goals_completion_rate>=50?"text-amber-400":"text-red-400"}`}>
                                {reportPreview.goals_completion_rate != null ? `${reportPreview.goals_completion_rate}%` : "—"}
                              </p>
                              <p className="text-white/30 text-xs mt-0.5">completion</p>
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between mb-1.5 text-xs text-white/30"><span>{reportPreview.goals_completed} completed</span><span>{reportPreview.goals_total} total</span></div>
                              <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                                <div className="h-full rounded-full" style={{width:`${reportPreview.goals_completion_rate||0}%`,background:reportPreview.goals_completion_rate>=80?"#34d399":reportPreview.goals_completion_rate>=50?"#f59e0b":"#f87171"}} />
                              </div>
                            </div>
                          </div>
                          {reportPreview.goals?.length > 0 && (
                            <div className="space-y-1.5 max-h-40 overflow-y-auto">
                              {[...new Map(reportPreview.goals.map(g => [g.goal_text,g])).values()].slice(0,8).map((g,i) => {
                                const done  = reportPreview.goals.filter(x => x.goal_text===g.goal_text && x.status==="completed").length;
                                const total = reportPreview.goals.filter(x => x.goal_text===g.goal_text).length;
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

                      {/* AI Recommendations */}
                      {reportPreview.recommendations?.length > 0 && (
                        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 space-y-4">
                          <div className="flex items-center justify-between">
                            <p className="text-white/50 text-xs font-semibold uppercase tracking-widest">AI Recommendations & Action Items</p>
                            <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">{reportPreview.recommendations.length} active</span>
                          </div>
                          <div className="space-y-3">
                            {reportPreview.recommendations.map((rec, i) => {
                              const pStyle = rec.priority==="high"||rec.priority===1?"bg-red-500/10 border-red-500/20 text-red-400":
                                rec.priority==="medium"||rec.priority===2?"bg-amber-500/10 border-amber-500/20 text-amber-400":
                                "bg-green-500/10 border-green-500/20 text-green-400";
                              const steps = (Array.isArray(rec.action_steps)?rec.action_steps:[]).map(s =>
                                typeof s==="string"?{instruction:s,tip:null}:{instruction:s.instruction||s.step||"",tip:s.tip!==s.instruction?s.tip:null}
                              ).filter(s => s.instruction);
                              return (
                                <div key={i} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 space-y-3">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wide ${pStyle}`}>
                                      {typeof rec.priority==="number"?["","High","Medium","Low"][rec.priority]||rec.priority:rec.priority||"—"} priority
                                    </span>
                                    {rec.category && <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/15 text-indigo-400 font-medium capitalize">{rec.category}</span>}
                                  </div>
                                  <p className="text-white/80 text-sm font-semibold">{rec.title}</p>
                                  {rec.description && <p className="text-white/50 text-xs leading-relaxed">{rec.description}</p>}
                                  {steps.length > 0 && (
                                    <div>
                                      <p className="text-white/30 text-[10px] uppercase tracking-widest font-semibold mb-2">Action Steps</p>
                                      <ul className="space-y-1.5">
                                        {steps.map((step, j) => (
                                          <li key={j} className="flex items-start gap-2 text-xs">
                                            <span className="w-4 h-4 rounded-full bg-indigo-500/15 border border-indigo-500/20 flex-shrink-0 flex items-center justify-center text-indigo-400 text-[9px] font-bold mt-0.5">{j+1}</span>
                                            <div><p className="text-white/65">{step.instruction}</p>{step.tip && <p className="text-white/30 mt-0.5 italic">{step.tip}</p>}</div>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {rec.requires_professional_consultation && (
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/[0.06] border border-amber-500/20">
                                      <svg className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
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
                  );
                })()}

                {/* Generated Reports list */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-white/30 text-xs font-semibold uppercase tracking-widest">Generated Reports</p>
                    <button onClick={loadPatientReports} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">Refresh</button>
                  </div>
                  {reportsLoading && patientReports.length === 0 ? (
                    <div className="flex items-center justify-center py-10 gap-2 text-white/30 text-sm">
                      <div className="w-5 h-5 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin" />Loading…
                    </div>
                  ) : patientReports.length === 0 ? (
                    <p className="text-white/25 text-sm py-4">No reports yet. Use <span className="text-white/45 font-medium">Export Report</span> above.</p>
                  ) : (
                    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden divide-y divide-white/[0.05]">
                      {patientReports.map((r) => {
                        const sc = {ready:"bg-green-500/10 border-green-500/20 text-green-400",generating:"bg-indigo-500/10 border-indigo-500/20 text-indigo-400 animate-pulse",pending:"bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse",failed:"bg-red-500/10 border-red-500/20 text-red-400"}[r.status]||"bg-white/[0.05] border-white/[0.08] text-white/30";
                        return (
                          <div key={r.id} className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors gap-4">
                            <div className="min-w-0">
                              <p className="text-white/70 text-sm font-medium capitalize">{r.report_type} Report</p>
                              <p className="text-white/30 text-xs mt-0.5">
                                {r.date_from && r.date_to ? `${new Date(r.date_from).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})} – ${new Date(r.date_to).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}` : new Date(r.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${sc}`}>{r.status}</span>
                              {r.status === "ready" && (
                                <>
                                  <button onClick={() => handleDownload(r.id,"pdf")} className="text-xs px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-medium hover:bg-indigo-500/20 transition-colors">PDF</button>
                                  <button onClick={() => handleDownload(r.id,"csv")} className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/40 font-medium hover:bg-white/[0.07] transition-colors">CSV</button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {patientReports.some(r => r.status==="pending"||r.status==="generating") && (
                    <p className="text-xs text-center text-indigo-400/60 animate-pulse pt-2">Report generating — auto-refreshing…</p>
                  )}
                </div>

              </div>
            )}

          </div>

          {/* ── RIGHT COLUMN — sticky note editor ─────────────────────────── */}
          {activeTab !== "reports" && <div className="lg:col-span-1">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 sticky top-8">

              {/* Quick patient summary */}
              <div className="mb-5 pb-4 border-b border-white/[0.06]">
                <p className="text-white/25 text-[10px] uppercase tracking-widest mb-2">Quick Summary</p>
                <div className="grid grid-cols-2 gap-2">
                  {BIO_KEYS.slice(0, 4).map((key) => {
                    const item = dashboard?.[key];
                    if (!item) return null;
                    const meta = BIO_META[key];
                    return (
                      <div key={key} className="bg-white/[0.04] rounded-lg px-2.5 py-2">
                        <p className="text-white/20 text-[9px] uppercase tracking-widest truncate">{meta.label}</p>
                        <p className="text-white/70 text-sm font-semibold">{item.value} <span className="text-white/25 text-[10px] font-normal">{meta.unit}</span></p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI context hint for note */}
              {patientRecs.length > 0 && !editingNoteId && (() => {
                const activeRecs  = patientRecs.filter(r => r.status === "active" || r.status === "in_progress");
                const urgentRecs  = patientRecs.filter(r => r.priority === "urgent" || r.priority === "high");
                const avgProgress = activeRecs.length > 0 ? Math.round(activeRecs.reduce((s, r) => s + (r.progress_percentage || 0), 0) / activeRecs.length) : 0;
                const topCats     = [...new Set(patientRecs.map(r => r.category_display?.label || r.category))].slice(0, 2);
                return (
                  <div className="mb-4 rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
                    <p className="text-white/25 text-[10px] uppercase tracking-widest mb-2">AI Context</p>
                    <div className="flex gap-3 mb-2">
                      <div className="flex-1 bg-white/[0.04] rounded-lg p-2 text-center">
                        <p className="text-white/75 font-bold text-base">{activeRecs.length}</p>
                        <p className="text-white/20 text-[10px]">Active</p>
                      </div>
                      <div className="flex-1 bg-white/[0.04] rounded-lg p-2 text-center">
                        <p className="text-indigo-400 font-bold text-base">{avgProgress}%</p>
                        <p className="text-white/20 text-[10px]">Progress</p>
                      </div>
                    </div>
                    {urgentRecs.length > 0 && (
                      <p className="text-amber-400/70 text-[10px] mb-1">{urgentRecs.length} urgent: {urgentRecs[0]?.title}</p>
                    )}
                    <p className="text-white/15 text-[10px]">Focus: {topCats.join(", ")}</p>
                    <button
                      onClick={() => {
                        const txt = urgentRecs.length > 0
                          ? `Key areas: ${urgentRecs.map(r => r.title).join("; ")}. Progress: ${avgProgress}% avg.`
                          : `${activeRecs.length} active recommendations (${topCats.join(", ")}). Avg progress: ${avgProgress}%.`;
                        if (editorRef.current) { editorRef.current.innerHTML = `<p>${txt}</p>`; editorRef.current.focus(); }
                      }}
                      className="mt-2 text-[10px] text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      Insert summary →
                    </button>
                  </div>
                );
              })()}

              {/* Note editor */}
              <p className="text-white/50 text-xs font-semibold mb-3">
                {editingNoteId ? "Editing Note" : "Add Note"}
              </p>

              {/* Toolbar */}
              <div className="flex gap-1 mb-2 pb-2 border-b border-white/[0.06]">
                {[
                  { label: <strong className="text-white/40 text-sm">B</strong>, cmd: "bold" },
                  { label: <em className="text-white/40 text-sm">I</em>, cmd: "italic" },
                  { label: <u className="text-white/40 text-sm">U</u>, cmd: "underline" },
                  { label: <span className="text-white/40 text-base leading-none">•</span>, cmd: "insertUnorderedList" },
                ].map(({ label, cmd }) => (
                  <button key={cmd} type="button" onClick={() => formatText(cmd)}
                    className="w-8 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.07] transition-colors">
                    {label}
                  </button>
                ))}
              </div>

              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                className="w-full min-h-[180px] p-3 rounded-xl border border-white/[0.07] bg-white/[0.04] text-white/65 text-sm focus:outline-none focus:border-indigo-500/40 focus:bg-white/[0.06] transition-colors"
              />

              <div className="flex gap-2 mt-3">
                <button onClick={handleSaveNote} className="flex-1 py-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-xs font-bold hover:bg-indigo-500/20 transition-colors">
                  {editingNoteId ? "Update" : "Save Note"}
                </button>
                {editingNoteId && (
                  <button onClick={() => { setEditingNoteId(null); clearEditor(); }}
                    className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.07] text-white/30 text-xs hover:bg-white/[0.07] transition-colors">
                    Cancel
                  </button>
                )}
              </div>

              {/* Notes mini-list */}
              {notes.length > 0 && activeTab !== "notes" && (
                <div className="mt-4 pt-4 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white/20 text-[10px] uppercase tracking-widest">Recent Notes</p>
                    <button onClick={() => setActiveTab("notes")} className="text-[10px] text-indigo-400 hover:text-indigo-300">View all</button>
                  </div>
                  <div className="space-y-2">
                    {notes.slice(0, 2).map((note) => (
                      <div key={note.id} className="rounded-lg bg-white/[0.03] border border-white/[0.05] px-3 py-2">
                        <p className="text-white/40 text-xs line-clamp-2" dangerouslySetInnerHTML={{ __html: note.content || note.html }} />
                        <p className="text-white/15 text-[10px] mt-1">{formatTs(note.created_at || note.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>}
        </div>
      </div>
    </RoleProtection>
  );
}

// ── Reusable card wrapper ─────────────────────────────────────────────────────
function Card({ title, children, accent }) {
  const border = accent === "indigo"
    ? "border-indigo-500/12 bg-indigo-500/[0.03]"
    : accent === "amber"
    ? "border-amber-500/12 bg-amber-500/[0.03]"
    : "border-white/[0.07] bg-white/[0.02]";
  return (
    <div className={`rounded-2xl border p-5 ${border}`}>
      <p className="text-white/35 text-[11px] font-bold uppercase tracking-widest mb-4">{title}</p>
      {children}
    </div>
  );
}

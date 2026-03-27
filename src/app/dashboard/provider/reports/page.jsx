"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
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

const BIOMARKER_OPTIONS = [
  { value: "heart_rate",               label: "Heart Rate"    },
  { value: "blood_pressure_systolic",  label: "BP Systolic"   },
  { value: "blood_pressure_diastolic", label: "BP Diastolic"  },
  { value: "glucose",                  label: "Blood Glucose" },
  { value: "steps",                    label: "Daily Steps"   },
  { value: "sleep",                    label: "Sleep"         },
];

const NORMALS = {
  heart_rate:               { min: 60,   max: 100,   unit: "bpm"   },
  blood_pressure_systolic:  { min: 90,   max: 120,   unit: "mmHg"  },
  blood_pressure_diastolic: { min: 60,   max: 80,    unit: "mmHg"  },
  glucose:                  { min: 70,   max: 100,   unit: "mg/dL" },
  steps:                    { min: 7000, max: 15000, unit: "steps" },
  sleep:                    { min: 7,    max: 9,     unit: "hrs"   },
};

function today()  { return new Date().toISOString().slice(0, 10); }
function daysAgo(n) {
  const d = new Date(); d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const map = {
    normal:     "bg-green-100 text-green-700",
    borderline: "bg-amber-100 text-amber-700",
    abnormal:   "bg-red-100 text-red-700",
    no_data:    "bg-gray-100 text-gray-500",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[status] || map.no_data}`}>
      {status?.replace("_", " ")}
    </span>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProviderReportsPage() {
  // Patients
  const [patients,      setPatients]      = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null); // full patient object

  // Report config
  const [reportType,  setReportType]  = useState("monthly");
  const [dateFrom,    setDateFrom]    = useState(daysAgo(30));
  const [dateTo,      setDateTo]      = useState(today());
  const [selectedBio, setSelectedBio] = useState([]);

  // Actions
  const [generating,  setGenerating]  = useState(false);
  const [genError,    setGenError]    = useState("");

  // Reports list
  const [reports,      setReports]     = useState([]);
  const [loadingList,  setLoadingList] = useState(false);

  // Preview
  const [preview,     setPreview]     = useState(null);
  const [loadingPrev, setLoadingPrev] = useState(false);
  const [prevError,   setPrevError]   = useState("");

  // Tabs
  const [activeTab, setActiveTab] = useState("generate");

  // ── Load accepted patients ────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const data = await getPatientToHCP();
        const accepted = (data.requests || []).filter(p => p.status === "accepted" && p.patient_user_id);
        setPatients(accepted);
      } catch {
        setPatients([]);
      } finally {
        setPatientsLoading(false);
      }
    })();
  }, []);

  // ── Date auto-fill ────────────────────────────────────────────────────────
  useEffect(() => {
    const t = REPORT_TYPES.find(r => r.value === reportType);
    if (t?.days) { setDateFrom(daysAgo(t.days)); setDateTo(today()); }
  }, [reportType]);

  // ── Load reports for selected patient ────────────────────────────────────
  const loadReports = useCallback(async (pid) => {
    if (!pid) return;
    setLoadingList(true);
    try {
      const res = await listReports({ patientUserId: pid, limit: 50 });
      setReports(res.reports || []);
    } catch { setReports([]); }
    finally   { setLoadingList(false); }
  }, []);

  // ── Poll pending/generating reports ──────────────────────────────────────
  useEffect(() => {
    if (!selectedPatient) return;
    const needsPoll = reports.some(r => r.status === "pending" || r.status === "generating");
    if (!needsPoll) return;
    const timer = setTimeout(() => loadReports(selectedPatient.patient_user_id), 5000);
    return () => clearTimeout(timer);
  }, [reports, selectedPatient, loadReports]);

  // ── Select patient ────────────────────────────────────────────────────────
  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setReports([]);
    setPreview(null);
    setGenError("");
    setPrevError("");
    loadReports(patient.patient_user_id);
  };

  // ── Generate ──────────────────────────────────────────────────────────────
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

  // ── Preview ───────────────────────────────────────────────────────────────
  const handlePreview = async () => {
    setPrevError(""); setLoadingPrev(true);
    try {
      const data = await getReportPreview({
        dateFrom, dateTo,
        biomarkerTypes: selectedBio.length ? selectedBio : null,
        patientUserId:  selectedPatient.patient_user_id,
      });
      setPreview(data);
      setActiveTab("preview");
    } catch (e) { setPrevError(e.message); }
    finally     { setLoadingPrev(false); }
  };

  const toggleBio = (val) =>
    setSelectedBio(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <RoleProtection allowedRoles={[USER_ROLES.PROVIDER]}>
      <div className="max-w-7xl mx-auto">

        {/* Page header */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Patient Health Reports</h1>
        <p className="text-gray-600 mb-8">Generate and download professional health reports for your patients</p>

        {/* ── Patient selector ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Select Patient</h2>

          {patientsLoading ? (
            <div className="flex items-center gap-3 text-gray-400">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
              Loading patients...
            </div>
          ) : patients.length === 0 ? (
            <p className="text-gray-500 text-sm">No accepted patient connections found. Accept a patient connection request first.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {patients.map(p => {
                const isSelected = selectedPatient?.patient_user_id === p.patient_user_id;
                return (
                  <button
                    key={p.patient_user_id}
                    onClick={() => handleSelectPatient(p)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600 shadow-md"
                        : "bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:text-blue-600"
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isSelected ? "bg-blue-500" : "bg-gray-100 text-gray-600"}`}>
                      {p.patient_name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <span>{p.patient_name}</span>
                    <span className={`text-xs ${isSelected ? "text-blue-200" : "text-gray-400"}`}>{p.patient_email}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Main content — only shown when a patient is selected ─────────── */}
        {!selectedPatient ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <p className="font-medium">Select a patient above to generate or view their reports</p>
          </div>
        ) : (
          <>
            {/* Selected patient pill */}
            <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
              <span className="font-semibold text-gray-800">Viewing:</span>
              <span className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full font-medium">
                {selectedPatient.patient_name}
              </span>
              <span className="text-gray-400">{selectedPatient.patient_email}</span>
            </div>

            {/* Tabs */}
            <div className="mb-6 flex gap-2">
              {[
                { key: "generate", label: "Generate Report" },
                { key: "preview",  label: "Preview Data"    },
                { key: "history",  label: `Report History (${reports.length})` },
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`px-6 py-2 rounded-lg font-medium text-sm ${
                    activeTab === t.key ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── Generate Tab ───────────────────────────────────────────── */}
            {activeTab === "generate" && (
              <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
                {/* Report type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                  <div className="flex flex-wrap gap-2">
                    {REPORT_TYPES.map(t => (
                      <button
                        key={t.value}
                        onClick={() => setReportType(t.value)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
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
                    <label className="text-sm font-medium text-gray-700">From</label>
                    <input
                      type="date" value={dateFrom} max={dateTo}
                      onChange={e => setDateFrom(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
                    <label className="text-sm font-medium text-gray-700">To</label>
                    <input
                      type="date" value={dateTo} min={dateFrom} max={today()}
                      onChange={e => setDateTo(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Biomarker filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Biomarkers <span className="text-gray-400 font-normal text-xs">(all included by default)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {BIOMARKER_OPTIONS.map(b => (
                      <button
                        key={b.value}
                        onClick={() => toggleBio(b.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          selectedBio.includes(b.value)
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-600 border-gray-200 hover:border-blue-400"
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>

                {genError && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{genError}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handlePreview}
                    disabled={loadingPrev}
                    className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    {loadingPrev ? "Loading..." : "Preview in App"}
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50"
                  >
                    {generating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586L7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                        </svg>
                        Generate PDF Report
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-400">PDF is generated in the background. Check Report History when ready.</p>
              </div>
            )}

            {/* ── Preview Tab ───────────────────────────────────────────── */}
            {activeTab === "preview" && (
              <div className="space-y-4">
                {prevError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">{prevError}</div>
                )}

                {!preview && !prevError && (
                  <div className="bg-white rounded-lg shadow-sm border p-12 text-center text-gray-400">
                    <p>Click <strong>Preview in App</strong> on the Generate tab to load live data here.</p>
                  </div>
                )}

                {preview && (
                  <>
                    {/* Score chart */}
                    {preview.score_series?.length > 1 && (
                      <div className="bg-white rounded-lg shadow-sm border p-6">
                        <h3 className="font-semibold text-gray-800 mb-4">Daily Health Score</h3>
                        <ResponsiveContainer width="100%" height={220}>
                          <LineChart data={preview.score_series}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <ReferenceLine y={70} stroke="#16a34a" strokeDasharray="4 4" label={{ value: "Happy (70)", fontSize: 10, fill: "#16a34a" }} />
                            <ReferenceLine y={40} stroke="#d97706" strokeDasharray="4 4" label={{ value: "Sad (40)", fontSize: 10, fill: "#d97706" }} />
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
                        <div key={bt} className="bg-white rounded-lg shadow-sm border p-6">
                          <h3 className="font-semibold text-gray-800 mb-4">
                            {bio?.label || bt}
                            {norm && <span className="text-xs text-gray-400 font-normal ml-2">Normal: {norm.min}–{norm.max} {norm.unit}</span>}
                          </h3>
                          <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={data}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                              <YAxis tick={{ fontSize: 11 }} />
                              <Tooltip />
                              {norm && <ReferenceLine y={norm.min} stroke="#16a34a" strokeDasharray="3 3" opacity={0.7} />}
                              {norm && <ReferenceLine y={norm.max} stroke="#16a34a" strokeDasharray="3 3" opacity={0.7} />}
                              <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} name={bio?.label || bt} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      );
                    })}

                    {/* Biomarker stats */}
                    {(preview.stats || []).filter(s => s.status !== "no_data").length > 0 && (
                      <>
                        <h3 className="font-semibold text-gray-800 pt-2">Biomarker Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(preview.stats || []).filter(s => s.status !== "no_data").map(s => {
                            const bio = BIOMARKER_OPTIONS.find(b => b.value === s.biomarker_type);
                            return (
                              <div key={s.biomarker_type} className="bg-white rounded-lg shadow-sm border p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <p className="font-medium text-gray-800 text-sm">{bio?.label || s.biomarker_type}</p>
                                  <StatusBadge status={s.status} />
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                  {[["Avg", s.avg], ["Min", s.min], ["Max", s.max], ["Latest", s.latest]].map(([lbl, val]) => (
                                    <div key={lbl} className="text-center bg-gray-50 rounded-lg py-2">
                                      <p className="text-[10px] text-gray-400 uppercase font-medium">{lbl}</p>
                                      <p className="text-sm font-semibold text-gray-800">{val ?? "—"}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── History Tab ───────────────────────────────────────────── */}
            {activeTab === "history" && (
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                {loadingList ? (
                  <div className="flex items-center justify-center py-12 gap-3 text-gray-400">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                    Loading reports...
                  </div>
                ) : reports.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <svg className="w-10 h-10 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    <p>No reports generated yet for this patient.</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {reports.map(report => (
                      <div key={report.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition">
                        <div>
                          <p className="font-medium text-gray-800 capitalize">{report.report_type} Report</p>
                          <p className="text-sm text-gray-400">{report.date_from} → {report.date_to}</p>
                          {report.summary?.total_readings != null && (
                            <p className="text-xs text-gray-400">{report.summary.total_readings} readings</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                            { ready: "bg-green-100 text-green-800", generating: "bg-blue-100 text-blue-700", pending: "bg-yellow-100 text-yellow-800", failed: "bg-red-100 text-red-700" }[report.status] || "bg-gray-100 text-gray-600"
                          }`}>
                            {report.status}
                          </span>
                          {report.status === "ready" && (
                            <>
                              <button
                                onClick={() => downloadReportPdf(report.id, selectedPatient.patient_user_id)}
                                className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg font-medium transition"
                              >
                                PDF
                              </button>
                              <button
                                onClick={() => downloadReportCsv(report.id, selectedPatient.patient_user_id)}
                                className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-1.5 rounded-lg font-medium transition"
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

                {reports.some(r => r.status === "pending" || r.status === "generating") && (
                  <p className="text-xs text-center text-blue-500 animate-pulse py-3 border-t">
                    Generating — page refreshes automatically...
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

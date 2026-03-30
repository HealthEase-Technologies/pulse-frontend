"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import RoleProtection from "@/components/RoleProtection";
import { USER_ROLES } from "@/hooks/useUserRole";
import {
  getPatientToHCP,
  acceptConnectionRequest,
  rejectConnectionRequest,
  getPatientDashboardForProvider,
} from "@/services/api_calls";

const STATUS_BADGE = {
  pending:  "bg-amber-500/10  border-amber-500/20  text-amber-400",
  accepted: "bg-green-500/10  border-green-500/20  text-green-400",
  rejected: "bg-red-500/10    border-red-500/20    text-red-400",
};

const BIOMARKER_COLORS = {
  heart_rate:               "bg-rose-500/10  border-rose-500/20",
  blood_pressure_systolic:  "bg-indigo-500/10 border-indigo-500/20",
  blood_pressure_diastolic: "bg-indigo-500/10 border-indigo-500/20",
  glucose:                  "bg-amber-500/10  border-amber-500/20",
  steps:                    "bg-emerald-500/10 border-emerald-500/20",
  sleep:                    "bg-slate-500/10   border-slate-500/20",
  default:                  "bg-white/[0.04]   border-white/[0.08]",
};

const TABS = [
  { key: "all",      label: "All" },
  { key: "pending",  label: "Pending" },
  { key: "accepted", label: "Accepted" },
  { key: "rejected", label: "Rejected" },
];

const formatDate = (s) =>
  s ? new Date(s).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "N/A";

const RowSkeleton = () => (
  <tr className="border-b border-white/[0.05]">
    {[...Array(4)].map((_, i) => (
      <td key={i} className="px-5 py-4">
        <div className="h-4 bg-white/[0.05] rounded animate-pulse w-24" />
      </td>
    ))}
  </tr>
);

export default function PatientConnections() {
  const [activeTab, setActiveTab]         = useState("all");
  const [searchTerm, setSearchTerm]       = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [biomarkers, setBiomarkers]           = useState(null);
  const [biomarkersLoading, setBiomarkersLoading] = useState(false);
  const [biomarkersError, setBiomarkersError] = useState("");

  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading]         = useState(true);

  const fetchRequests = async () => {
    try {
      const data = await getPatientToHCP();
      setAllRequests(data.requests || []);
    } catch (err) {
      console.error("Error fetching patient requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const loadBiomarkers = async (patient) => {
    if (!patient?.patient_user_id || patient.status !== "accepted") {
      setBiomarkers(null); setBiomarkersError(""); setBiomarkersLoading(false);
      return;
    }
    try {
      setBiomarkersLoading(true); setBiomarkersError("");
      const data = await getPatientDashboardForProvider(patient.patient_user_id);
      setBiomarkers(data);
    } catch (err) {
      setBiomarkersError(err?.message || "Failed to load biomarkers");
      setBiomarkers(null);
    } finally {
      setBiomarkersLoading(false);
    }
  };

  const handleViewDetails = async (patient) => {
    setSelectedPatient(patient);
    setBiomarkers(null); setBiomarkersError(""); setBiomarkersLoading(false);
    await loadBiomarkers(patient);
  };

  const handleAccept = async (connectionId, patientName) => {
    try {
      await acceptConnectionRequest(connectionId);
      await fetchRequests();
      setSelectedPatient(null);
    } catch (err) {
      alert(`Failed to accept connection: ${err.message}`);
    }
  };

  const handleReject = async (connectionId, patientName) => {
    try {
      await rejectConnectionRequest(connectionId);
      await fetchRequests();
      setSelectedPatient(null);
    } catch (err) {
      alert(`Failed to reject connection: ${err.message}`);
    }
  };

  const counts = {
    all:      allRequests.length,
    pending:  allRequests.filter((r) => r.status === "pending").length,
    accepted: allRequests.filter((r) => r.status === "accepted").length,
    rejected: allRequests.filter((r) => r.status === "rejected").length,
  };

  const filtered = allRequests.filter((p) => {
    if (activeTab !== "all" && p.status !== activeTab) return false;
    if (searchTerm && !p.patient_name?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <RoleProtection allowedRoles={[USER_ROLES.PROVIDER]}>
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-1">Provider</p>
          <h1 className="font-[family-name:var(--font-serif)] text-white text-3xl font-bold">Patients</h1>
          <p className="text-white/40 text-sm mt-1">Manage connection requests and view patient data.</p>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white/80 placeholder-white/20 text-sm focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.06] transition-colors"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                activeTab === tab.key
                  ? "bg-indigo-500/15 border-indigo-500/25 text-indigo-300"
                  : "bg-white/[0.03] border-white/[0.07] text-white/40 hover:text-white/60"
              }`}
            >
              {tab.label} <span className="opacity-60 ml-0.5">({counts[tab.key]})</span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.07]">
                {["Patient", "Status", "Requested", "Actions"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-white/25 uppercase tracking-widest">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(4)].map((_, i) => <RowSkeleton key={i} />)
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-white/25 text-sm">
                    No patient connection requests found.
                  </td>
                </tr>
              ) : (
                filtered.map((patient) => (
                  <tr key={patient.id} className="border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <Link
                        href={patient.patient_user_id ? `/dashboard/provider/patient-connection/${patient.patient_user_id}` : "#"}
                        onClick={(e) => { if (!patient.patient_user_id) e.preventDefault(); }}
                        className={`text-sm font-semibold ${patient.patient_user_id ? "text-indigo-400 hover:text-indigo-300" : "text-white/30 cursor-not-allowed"}`}
                      >
                        {patient.patient_name}
                      </Link>
                      <p className="text-xs text-white/30 mt-0.5">{patient.patient_email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_BADGE[patient.status] || STATUS_BADGE.pending}`}>
                        {patient.status?.charAt(0).toUpperCase() + patient.status?.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-white/40">{formatDate(patient.requested_at)}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-x-3 gap-y-1">
                        <button onClick={() => handleViewDetails(patient)} className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                          Details
                        </button>
                        <Link
                          href={patient.patient_user_id ? `/dashboard/provider/patient-connection/biomarkers/${patient.patient_user_id}` : "#"}
                          onClick={(e) => { if (patient.status !== "accepted" || !patient.patient_user_id) e.preventDefault(); }}
                          className={`text-xs font-medium ${patient.status === "accepted" && patient.patient_user_id ? "text-purple-400 hover:text-purple-300" : "text-white/20 cursor-not-allowed"}`}
                        >
                          History
                        </Link>
                        <Link
                          href={patient.patient_user_id ? `/dashboard/provider/patient-recommendation?patient_user_id=${patient.patient_user_id}` : "#"}
                          onClick={(e) => { if (patient.status !== "accepted" || !patient.patient_user_id) e.preventDefault(); }}
                          className={`text-xs font-medium ${patient.status === "accepted" && patient.patient_user_id ? "text-emerald-400 hover:text-emerald-300" : "text-white/20 cursor-not-allowed"}`}
                        >
                          Recommendations
                        </Link>
                        {patient.status === "pending" && (
                          <>
                            <button onClick={() => handleAccept(patient.id, patient.patient_name)} className="text-xs text-green-400 hover:text-green-300 font-medium">
                              Accept
                            </button>
                            <button onClick={() => handleReject(patient.id, patient.patient_name)} className="text-xs text-red-400 hover:text-red-300 font-medium">
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Patient details modal */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedPatient(null)} />
          <div className="relative bg-[#0d1525] border border-white/[0.1] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">

            {/* Modal header */}
            <div className="sticky top-0 z-10 bg-[#0d1525] border-b border-white/[0.08] px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <p className="text-white font-semibold">{selectedPatient.patient_name}</p>
                <p className="text-white/30 text-xs mt-0.5">{selectedPatient.patient_email}</p>
              </div>
              <button onClick={() => setSelectedPatient(null)} className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center text-white/50 hover:text-white/80 transition-colors text-lg">
                ×
              </button>
            </div>

            <div className="p-6 space-y-5">

              {/* Personal info */}
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
                <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-3">Personal Information</p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Age", value: typeof selectedPatient.patient_age === "number" ? selectedPatient.patient_age : "N/A" },
                    { label: "Requested", value: formatDate(selectedPatient.requested_at) },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-white/30 text-xs mb-0.5">{label}</p>
                      <p className="text-white/70 text-sm">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Health goals */}
              <div className="rounded-xl border border-indigo-500/15 bg-indigo-500/[0.05] p-4">
                <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-3">Health Goals</p>
                {selectedPatient.patient_health_goals?.length > 0 ? (
                  <ul className="space-y-2">
                    {selectedPatient.patient_health_goals.map((goal, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-white/60">
                        <span className="w-1 h-1 rounded-full bg-indigo-400 flex-shrink-0" />
                        <span className="flex-1">{typeof goal === "string" ? goal : goal.goal}</span>
                        {typeof goal === "object" && goal.frequency && (
                          <span className="text-xs text-indigo-400 bg-indigo-500/15 border border-indigo-500/20 px-2 py-0.5 rounded-full uppercase tracking-wide">
                            {goal.frequency}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-white/25 text-sm">No health goals provided.</p>
                )}
              </div>

              {/* Health restrictions */}
              <div className="rounded-xl border border-amber-500/15 bg-amber-500/[0.05] p-4">
                <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-3">Health Restrictions</p>
                {selectedPatient.patient_health_restrictions?.length > 0 ? (
                  <ul className="space-y-2">
                    {selectedPatient.patient_health_restrictions.map((r, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-white/60">
                        <span className="w-1 h-1 rounded-full bg-amber-400 flex-shrink-0" />
                        {typeof r === "string" ? r : r}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-white/25 text-sm">No health restrictions provided.</p>
                )}
              </div>

              {/* Connection details */}
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
                <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-3">Connection</p>
                <div className="flex items-center gap-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_BADGE[selectedPatient.status] || STATUS_BADGE.pending}`}>
                    {selectedPatient.status?.charAt(0).toUpperCase() + selectedPatient.status?.slice(1)}
                  </span>
                  {selectedPatient.accepted_at && (
                    <p className="text-white/30 text-xs">Accepted {formatDate(selectedPatient.accepted_at)}</p>
                  )}
                </div>
              </div>

              {/* Pending actions */}
              {selectedPatient.status === "pending" && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAccept(selectedPatient.id, selectedPatient.patient_name)}
                    className="flex-1 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-semibold hover:bg-green-500/15 transition-colors"
                  >
                    Accept Connection
                  </button>
                  <button
                    onClick={() => handleReject(selectedPatient.id, selectedPatient.patient_name)}
                    className="flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold hover:bg-red-500/15 transition-colors"
                  >
                    Reject Connection
                  </button>
                </div>
              )}

              {/* Biomarkers */}
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
                <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-3">Current Biomarkers</p>
                {selectedPatient.status !== "accepted" ? (
                  <p className="text-white/25 text-sm">Available once connection is accepted.</p>
                ) : biomarkersLoading ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-16 rounded-xl bg-white/[0.04] animate-pulse" />
                    ))}
                  </div>
                ) : biomarkersError ? (
                  <p className="text-red-400 text-sm">{biomarkersError}</p>
                ) : !biomarkers ? (
                  <p className="text-white/25 text-sm">No biomarker data available.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(biomarkers).map(([key, value]) => {
                      if (!value) return null;
                      const label = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
                      const colors = BIOMARKER_COLORS[key] || BIOMARKER_COLORS.default;
                      const displayValue = typeof value === "object" && value !== null && "value" in value ? value.value : value;
                      const displayUnit  = typeof value === "object" && value !== null && "unit" in value ? value.unit : "";
                      return (
                        <div key={key} className={`rounded-xl border px-4 py-3 ${colors}`}>
                          <p className="text-white/30 text-xs uppercase tracking-wide">{label}</p>
                          <p className="text-white text-lg font-semibold mt-0.5">
                            {displayValue} <span className="text-white/40 text-sm font-normal">{displayUnit}</span>
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-6 pb-5">
              <button
                onClick={() => setSelectedPatient(null)}
                className="w-full py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white/50 text-sm font-medium hover:bg-white/[0.08] hover:text-white/70 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </RoleProtection>
  );
}

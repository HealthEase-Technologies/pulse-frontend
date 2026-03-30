"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import RoleProtection from "@/components/RoleProtection";
import { USER_ROLES } from "@/hooks/useUserRole";
import { getPatientToHCP, getPatientRecommendations } from "@/services/api_calls";

const formatDateTime = (value) => {
  if (!value) return "N/A";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "N/A" : d.toLocaleString();
};

const STATUS_BADGE = {
  accepted: "bg-green-500/10  border-green-500/20  text-green-400",
  pending:  "bg-amber-500/10  border-amber-500/20  text-amber-400",
  rejected: "bg-red-500/10   border-red-500/20   text-red-400",
};

const pickFirstText = (rec, keys, fallback = "") => {
  for (const key of keys) {
    const val = rec?.[key];
    if (typeof val === "string" && val.trim()) return val;
  }
  return fallback;
};

function ProviderPatientRecommendationsContent() {
  const searchParams = useSearchParams();

  const [patients,          setPatients]          = useState([]);
  const [expandedPatientId, setExpandedPatientId] = useState("");
  const [recCache,          setRecCache]          = useState({});
  const [recLoadingMap,     setRecLoadingMap]     = useState({});
  const [recErrorMap,       setRecErrorMap]       = useState({});
  const [loading,           setLoading]           = useState(true);
  const [error,             setError]             = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true); setError("");
        const data     = await getPatientToHCP();
        if (cancelled) return;
        const accepted = (data?.requests || []).filter((r) => r.status === "accepted" && r.patient_user_id);
        setPatients(accepted);
        const requestedId = searchParams.get("patient_user_id");
        if (requestedId && accepted.some((p) => p.patient_user_id === requestedId)) {
          setExpandedPatientId(requestedId);
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || "Failed to load patients");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleTogglePatient = async (patientId) => {
    if (expandedPatientId === patientId) { setExpandedPatientId(""); return; }
    setExpandedPatientId(patientId);
    if (recCache[patientId]) return;
    setRecLoadingMap((prev) => ({ ...prev, [patientId]: true }));
    setRecErrorMap((prev) => ({ ...prev, [patientId]: "" }));
    try {
      const data = await getPatientRecommendations(patientId);
      const list = Array.isArray(data) ? data : Array.isArray(data?.recommendations) ? data.recommendations : Array.isArray(data?.data) ? data.data : [];
      setRecCache((prev) => ({ ...prev, [patientId]: list }));
    } catch (err) {
      setRecErrorMap((prev) => ({ ...prev, [patientId]: err?.message || "Failed to load recommendations" }));
    } finally {
      setRecLoadingMap((prev) => ({ ...prev, [patientId]: false }));
    }
  };

  const selectedPatient    = useMemo(() => patients.find((p) => p.patient_user_id === expandedPatientId), [patients, expandedPatientId]);
  const selectedRecs       = recCache[expandedPatientId] || [];
  const selectedRecLoading = recLoadingMap[expandedPatientId];
  const selectedRecError   = recErrorMap[expandedPatientId];

  return (
    <RoleProtection allowedRoles={[USER_ROLES.PROVIDER]}>
      <div className="max-w-6xl mx-auto pb-10">

        {/* Header */}
        <div className="mb-8">
          <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-1">Provider</p>
          <h1 className="font-[family-name:var(--font-serif)] text-white text-3xl font-bold">Patient Recommendations</h1>
          <p className="text-white/40 text-sm mt-1">View AI-generated recommendations for your connected patients.</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-2xl bg-white/[0.03] border border-white/[0.05] animate-pulse" />)}
          </div>
        ) : error ? (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
        ) : patients.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/[0.1] p-8 text-center text-white/25 text-sm">
            No accepted patient connections yet.
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">

            {/* Patient list */}
            <div className="lg:col-span-1">
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-white/60 text-sm font-semibold">Patients</p>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    {patients.length} connected
                  </span>
                </div>
                <div className="space-y-2">
                  {patients.map((p) => {
                    const isOpen = expandedPatientId === p.patient_user_id;
                    return (
                      <button
                        key={p.patient_user_id}
                        onClick={() => handleTogglePatient(p.patient_user_id)}
                        className={`w-full text-left rounded-xl border p-3 flex items-center gap-3 transition-colors ${isOpen ? "border-indigo-500/25 bg-indigo-500/[0.07]" : "border-white/[0.07] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"}`}
                      >
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${isOpen ? "bg-indigo-500/20 text-indigo-300" : "bg-white/[0.06] text-white/40"}`}>
                          {(p.patient_name || "P").charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate ${isOpen ? "text-white/80" : "text-white/50"}`}>{p.patient_name || "Patient"}</p>
                          <p className="text-white/25 text-xs truncate">{p.patient_email}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border flex-shrink-0 ${STATUS_BADGE[p.status] || "bg-white/[0.05] border-white/[0.08] text-white/25"}`}>
                          {p.status?.charAt(0).toUpperCase() + p.status?.slice(1)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recommendations panel */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 min-h-[400px]">
                {!selectedPatient ? (
                  <div className="h-full flex items-center justify-center min-h-[300px] rounded-xl border border-dashed border-white/[0.08]">
                    <p className="text-white/20 text-sm">Select a patient to view recommendations.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-5">
                      <div>
                        <p className="text-white/25 text-xs uppercase tracking-widest mb-0.5">Recommendations</p>
                        <p className="text-white font-semibold">{selectedPatient.patient_name || "Patient"}</p>
                        <p className="text-white/30 text-xs mt-0.5">{selectedPatient.patient_email}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_BADGE[selectedPatient.status] || "bg-white/[0.05] border-white/[0.08] text-white/25"}`}>
                        {selectedPatient.status?.charAt(0).toUpperCase() + selectedPatient.status?.slice(1)}
                      </span>
                    </div>

                    {selectedRecError ? (
                      <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{selectedRecError}</div>
                    ) : selectedRecLoading ? (
                      <div className="flex items-center justify-center py-16 gap-2 text-white/30 text-sm">
                        <div className="w-6 h-6 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin" />
                        Loading recommendations…
                      </div>
                    ) : selectedRecs.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-white/[0.08] p-8 text-center text-white/20 text-sm">
                        No recommendations for this patient yet.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-white/25 text-xs">{selectedRecs.length} item{selectedRecs.length === 1 ? "" : "s"}</p>
                        {selectedRecs.map((rec) => {
                          const title       = pickFirstText(rec, ["title", "headline", "summary", "recommendation"], "Recommendation");
                          const description = pickFirstText(rec, ["description", "text", "content", "recommendation"], "No details provided.");
                          const status      = pickFirstText(rec, ["status", "state", "recommendation_status"], "");
                          const source      = pickFirstText(rec, ["source", "type", "category"], "Recommendation");
                          const created     = rec?.created_at || rec?.createdAt || rec?.generated_at || rec?.timestamp;

                          return (
                            <div key={rec.id || rec._id || `${title}-${created}`} className="rounded-xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.05] transition-colors p-4 space-y-2">
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1 flex-1 min-w-0">
                                  <p className="text-indigo-400 text-xs uppercase tracking-widest">{source}</p>
                                  <h4 className="text-white/80 text-base font-semibold leading-snug">{title}</h4>
                                  <p className="text-white/45 text-sm leading-relaxed whitespace-pre-line">{description}</p>
                                </div>
                                {status && (
                                  <span className="flex-shrink-0 text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-medium">
                                    {status}
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-2 pt-1">
                                {created && (
                                  <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.07] text-white/30">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    {formatDateTime(created)}
                                  </span>
                                )}
                                {rec?.biomarker_type && (
                                  <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.07] text-white/30">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                    {rec.biomarker_type}
                                  </span>
                                )}
                                {rec?.goal && (
                                  <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Goal related
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleProtection>
  );
}

export default function ProviderPatientRecommendationsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin" />
        </div>
      }
    >
      <ProviderPatientRecommendationsContent />
    </Suspense>
  );
}

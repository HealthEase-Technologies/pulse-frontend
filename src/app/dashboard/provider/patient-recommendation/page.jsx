"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import RoleProtection from "@/components/RoleProtection";
import { USER_ROLES } from "@/hooks/useUserRole";
import { getPatientToHCP, getPatientRecommendations } from "@/services/api_calls";

const formatDateTime = (value) => {
    if (!value) return "N/A";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "N/A" : d.toLocaleString();
};

const ConnectionBadge = ({ status }) => {
    if (!status) return null;
    const styles = {
        accepted: "bg-emerald-50 text-emerald-700 border-emerald-200",
        pending: "bg-amber-50 text-amber-800 border-amber-200",
        rejected: "bg-rose-50 text-rose-700 border-rose-200",
    }[status] || "bg-gray-50 text-gray-700 border-gray-200";
    const label = status.charAt(0).toUpperCase() + status.slice(1);
    return (
        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border ${styles}`}>
            <span className="h-2 w-2 rounded-full bg-current" />
            {label}
        </span>
    );
};

const StatusPill = ({ label }) => {
    if (!label) return null;
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            {label}
        </span>
    );
};

const pickFirstText = (rec, keys, fallback = "") => {
    for (const key of keys) {
        const val = rec?.[key];
        if (typeof val === "string" && val.trim()) return val;
    }
    return fallback;
};

export default function ProviderPatientRecommendations() {
    const searchParams = useSearchParams();
    const [patients, setPatients] = useState([]);
    const [expandedPatientId, setExpandedPatientId] = useState("");
    const [recommendationCache, setRecommendationCache] = useState({});
    const [recLoadingMap, setRecLoadingMap] = useState({});
    const [recErrorMap, setRecErrorMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const loadPatients = async () => {
            try {
                setLoading(true);
                setError("");
                const data = await getPatientToHCP();
                if (cancelled) return;

                const accepted = (data?.requests || []).filter(
                    (r) => r.status === "accepted" && r.patient_user_id
                );
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
        };

        loadPatients();
        return () => {
            cancelled = true;
        };
    }, []);

    const handleTogglePatient = async (patientId) => {
        if (expandedPatientId === patientId) {
            setExpandedPatientId("");
            return;
        }

        setExpandedPatientId(patientId);

        if (recommendationCache[patientId]) return;

        setRecLoadingMap((prev) => ({ ...prev, [patientId]: true }));
        setRecErrorMap((prev) => ({ ...prev, [patientId]: "" }));
        try {
            const data = await getPatientRecommendations(patientId);
            const list = Array.isArray(data)
                ? data
                : Array.isArray(data?.recommendations)
                ? data.recommendations
                : Array.isArray(data?.data)
                ? data.data
                : [];
            setRecommendationCache((prev) => ({ ...prev, [patientId]: list }));
        } catch (err) {
            setRecErrorMap((prev) => ({ ...prev, [patientId]: err?.message || "Failed to load recommendations" }));
        } finally {
            setRecLoadingMap((prev) => ({ ...prev, [patientId]: false }));
        }
    };

    const selectedPatient = useMemo(
        () => patients.find((p) => p.patient_user_id === expandedPatientId),
        [patients, expandedPatientId]
    );

    const selectedRecs = recommendationCache[expandedPatientId] || [];
    const selectedRecLoading = recLoadingMap[expandedPatientId];
    const selectedRecError = recErrorMap[expandedPatientId];

    return (
        <RoleProtection allowedRoles={[USER_ROLES.PROVIDER]}>
            <div className="max-w-7xl mx-auto pb-10">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-white via-indigo-50 to-sky-50 border border-indigo-100 shadow-sm mb-6">
                    <div className="absolute inset-0 opacity-50" style={{backgroundImage:"radial-gradient(circle at 20% 20%, rgba(99,102,241,0.2) 0, transparent 30%), radial-gradient(circle at 80% 30%, rgba(14,165,233,0.18) 0, transparent 25%), radial-gradient(circle at 40% 80%, rgba(16,185,129,0.18) 0, transparent 25%)"}} />
                    <div className="relative p-6 flex flex-col gap-2">
                        <p className="uppercase tracking-[0.2em] text-xs font-semibold text-indigo-700/80">Provider workspace</p>
                        <h1 className="text-3xl font-bold text-gray-900">Patient Recommendations</h1>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">{error}</div>
                ) : patients.length === 0 ? (
                    <div className="bg-gray-50 border border-dashed border-gray-200 text-gray-700 rounded-lg p-6">
                        No accepted patient connections yet.
                    </div>
                ) : (
                    <div className="grid lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1 space-y-4">
                            <div className="bg-white/90 backdrop-blur border border-indigo-100 rounded-xl shadow-sm p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="text-lg font-semibold text-gray-900">Patients</h2>
                                    <span className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-full">
                                        {patients.length} connected
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    {patients.map((p) => {
                                        const isOpen = expandedPatientId === p.patient_user_id;

                                        return (
                                            <div
                                                key={p.patient_user_id}
                                                className={`border rounded-xl transition overflow-hidden ${
                                                    isOpen
                                                        ? "border-indigo-300 shadow-md"
                                                        : "border-gray-200 hover:border-indigo-200 hover:shadow-sm"
                                                }`}
                                            >
                                                <button
                                                    onClick={() => handleTogglePatient(p.patient_user_id)}
                                                    className={`w-full text-left p-4 flex items-start justify-between gap-3 bg-white ${
                                                        isOpen ? "bg-gradient-to-r from-indigo-50 via-sky-50 to-emerald-50" : ""
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold">
                                                            {(p.patient_name || "P").charAt(0)}
                                                        </span>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-semibold text-gray-900">{p.patient_name || "Patient"}</p>
                                                                <ConnectionBadge status={p.status} />
                                                            </div>
                                                            <p className="text-sm text-gray-600">{p.patient_email}</p>
                                                            <p className="text-xs text-gray-500">Patient ID: {p.patient_user_id}</p>
                                                        </div>
                                                    </div>
                                                    <span className={`text-sm font-semibold ${isOpen ? "text-indigo-700" : "text-gray-500"}`}>
                                                        {isOpen ? "Collapse" : "Expand"}
                                                    </span>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-2 space-y-4">
                            <div className="bg-white/90 backdrop-blur border border-indigo-100 rounded-xl shadow-sm p-6 h-full">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="uppercase tracking-[0.15em] text-xs font-semibold text-indigo-700/80">Details</p>
                                        <h2 className="text-xl font-semibold text-gray-900">
                                            {selectedPatient ? selectedPatient.patient_name || "Patient" : "Select a patient"}
                                        </h2>
                                        {selectedPatient && (
                                            <p className="text-sm text-gray-600">{selectedPatient.patient_email}</p>
                                        )}
                                    </div>
                                    {selectedPatient && <ConnectionBadge status={selectedPatient.status} />}
                                </div>

                                {!selectedPatient ? (
                                    <div className="h-[380px] flex items-center justify-center text-sm text-gray-600 bg-gradient-to-r from-indigo-50 via-sky-50 to-emerald-50 border border-dashed border-indigo-200 rounded-xl">
                                        Choose a patient to view recommendations.
                                    </div>
                                ) : selectedRecError ? (
                                    <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm">{selectedRecError}</div>
                                ) : selectedRecLoading ? (
                                    <div className="flex items-center justify-center h-64">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
                                    </div>
                                ) : selectedRecs.length === 0 ? (
                                    <div className="bg-gradient-to-r from-indigo-50 via-sky-50 to-emerald-50 border border-dashed border-indigo-200 text-indigo-800 rounded-lg p-5 text-sm">
                                        No recommendations for this patient yet.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs uppercase tracking-wide text-gray-500">Recommendations</p>
                                                <p className="text-sm text-gray-700">{selectedRecs.length} item{selectedRecs.length === 1 ? "" : "s"}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {selectedRecs.map((rec) => {
                                                const title = pickFirstText(rec, ["title", "headline", "summary", "recommendation"], "Recommendation");
                                                const description = pickFirstText(
                                                    rec,
                                                    ["description", "text", "content", "recommendation"],
                                                    "No details provided."
                                                );
                                                const status = pickFirstText(rec, ["status", "state", "recommendation_status"], "");
                                                const source = pickFirstText(rec, ["source", "type", "category"], "Recommendation");
                                                const created = rec?.created_at || rec?.createdAt || rec?.generated_at || rec?.timestamp;

                                                return (
                                                    <div
                                                        key={rec.id || rec._id || `${title}-${created}`}
                                                        className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-4 space-y-2"
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="space-y-1">
                                                                <p className="text-xs uppercase tracking-wide text-indigo-700">{source}</p>
                                                                <h4 className="text-lg font-semibold text-gray-900 leading-snug">{title}</h4>
                                                                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{description}</p>
                                                            </div>
                                                            <StatusPill label={status} />
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-gray-600">
                                                            {created && (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                    </svg>
                                                                    {formatDateTime(created)}
                                                                </span>
                                                            )}
                                                            {rec?.biomarker_type && (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                                    </svg>
                                                                    {rec.biomarker_type}
                                                                </span>
                                                            )}
                                                            {rec?.goal && (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                    </svg>
                                                                    Goal related
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </RoleProtection>
    );
}

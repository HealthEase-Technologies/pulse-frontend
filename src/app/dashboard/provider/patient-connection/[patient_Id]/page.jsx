"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import RoleProtection from "@/components/RoleProtection";
import { USER_ROLES } from "@/hooks/useUserRole";
import { getPatientDashboardForProvider, getPatientToHCP, getPatientNotes, createPatientNote, updatePatientNote, deletePatientNote, getPatientRecommendations } from "@/services/api_calls";

function formatDate(dateString) {
  if (!dateString) return "N/A";
  const d = new Date(dateString);
  return d.toLocaleDateString();
}

function formatTimestamp(date) {
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function StatusBadge({ status }) {
  const statusMap = {
    pending: { color: "bg-amber-100 text-amber-800 border border-amber-200", label: "Pending" },
    accepted: { color: "bg-emerald-100 text-emerald-800 border border-emerald-200", label: "Accepted" },
    rejected: { color: "bg-rose-100 text-rose-800 border border-rose-200", label: "Rejected" },
  };
  const config = statusMap[status] || { color: "bg-gray-100 text-gray-800", label: status || "Unknown" };
  return (
    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}

function BiomarkerCard({ label, value, unit, colors }) {
  return (
    <div className={`rounded-lg border px-4 py-4 bg-gradient-to-br ${colors} shadow-sm`}>
      <p className="text-xs uppercase tracking-wide text-gray-600">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">
        {value ?? "—"} {unit ?? ""}
      </p>
    </div>
  );
}

const CARD_COLORS = {
  heart_rate: "from-rose-50 to-orange-50 border-rose-200",
  blood_pressure_systolic: "from-indigo-50 to-blue-50 border-indigo-200",
  blood_pressure_diastolic: "from-indigo-50 to-blue-50 border-indigo-200",
  glucose: "from-amber-50 to-amber-100 border-amber-200",
  steps: "from-emerald-50 to-teal-50 border-emerald-200",
  sleep: "from-slate-50 to-slate-100 border-slate-200",
  default: "from-gray-50 to-gray-100 border-gray-200",
};

export default function PatientDetailsPage() {
  const router = useRouter();
  const params = useParams();

  //Folder is [patient_Id], so param key is patient_Id
  const patientUserId = params?.patient_Id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // REAL biomarkers/dashboard response
  const [dashboard, setDashboard] = useState(null);

  // REAL patient request (name/email/age/goals/restrictions/status/requested/accepted)
  const [patientRequest, setPatientRequest] = useState(null);

  // Notes (local for now; wire to backend when notes API exists)
  const [notes, setNotes] = useState([]);

  // Editing state
  const [editingNoteId, setEditingNoteId] = useState(null);

  // AI Recommendations for this patient
  const [patientRecs, setPatientRecs] = useState([]);
  const [recsLoading, setRecsLoading] = useState(true);

  const editorRef = useRef(null);
useEffect(() => {
  let cancelled = false;

  async function load() {
    try {
      setLoading(true);
      setError("");

      if (!patientUserId || typeof patientUserId !== "string") {
        throw new Error("Missing patient_Id route param.");
      }

      // 1) Biomarkers
      const dash = await getPatientDashboardForProvider(patientUserId);
      console.log("getPatientDashboardForProvider:", patientUserId, dash);

      // 2) Patient identity/details
      const reqs = await getPatientToHCP();
      console.log("getPatientToHCP:", reqs);

      const match = reqs?.requests?.find((r) => r.patient_user_id === patientUserId) ?? null;
      console.log("Matched patient request:", match);

      // 3) Load notes from API
      const notesData = await getPatientNotes(patientUserId);
      console.log("Patient notes:", notesData);

      // 4) Load AI recommendations for this patient
      let recsData = null;
      try {
        recsData = await getPatientRecommendations(patientUserId);
      } catch (e) {
        console.warn("Could not load patient recommendations:", e);
      }

      if (!cancelled) {
        setDashboard(dash || null);
        setPatientRequest(match);
        setNotes(notesData.notes || notesData || []);
        setPatientRecs(recsData?.recommendations || []);
        setRecsLoading(false);
      }
    } catch (e) {
      if (!cancelled) setError(e?.message || "Failed to load patient dashboard.");
    } finally {
      if (!cancelled) setLoading(false);
    }
  }

  load();
  return () => {
    cancelled = true;
  };
}, [patientUserId]);

  const patient = useMemo(() => {
    return {
      name: patientRequest?.patient_name ?? dashboard?.patient_name ?? "Patient",
      email: patientRequest?.patient_email ?? dashboard?.patient_email ?? "",
      age:
        typeof patientRequest?.patient_age === "number" && patientRequest.patient_age >= 0
          ? patientRequest.patient_age
          : patientRequest?.patient_age ?? "N/A",
      requestedAt: patientRequest?.requested_at ?? null,
      acceptedAt: patientRequest?.accepted_at ?? null,
      status: patientRequest?.status ?? "",
      goals: patientRequest?.patient_health_goals ?? [],
      restrictions: patientRequest?.patient_health_restrictions ?? [],
    };
  }, [patientRequest, dashboard]);

  const biomarkers = useMemo(() => {
    // Expecting shape: { heart_rate: {value, unit}, ... }
    // This matches your modal biomarker cards.
    if (!dashboard || typeof dashboard !== "object") return null;
    return dashboard;
  }, [dashboard]);

  // Rich text helpers (contentEditable)
  const formatText = (command) => {
    document.execCommand(command, false, null);
    editorRef.current?.focus();
  };

  const getEditorHTML = () => editorRef.current?.innerHTML ?? "";

  const clearEditor = () => {
    if (editorRef.current) editorRef.current.innerHTML = "";
  };

  const handleUseAiSuggestion = (text) => {
    if (editorRef.current) {
      editorRef.current.innerHTML = `<p>${text}</p>`;
      editorRef.current.focus();
      setShowAiSuggestion(false);
    }
  };

  const handleEditNote = (noteId) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    
    // Load the note content into the editor
    if (editorRef.current) {
      editorRef.current.innerHTML = note.content || note.html;
      editorRef.current.focus();
    }
    
    // Set editing mode
    setEditingNoteId(noteId);
    setShowAiSuggestion(false);
    
    // Scroll to editor
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;

    try {
      await deletePatientNote(noteId);
      
      // Reload notes from API
      const notesData = await getPatientNotes(patientUserId);
      setNotes(notesData.notes || notesData || []);
    } catch (error) {
      console.error("Failed to delete note:", error);
      alert("Failed to delete note. Please try again.");
    }
  };

  const handleSaveNote = async () => {
  const html = getEditorHTML().trim();
  const textOnly = html.replace(/<[^>]*>/g, "").trim();

  if (!textOnly) return;

  try {
    if (editingNoteId) {
      // Update existing note
      await updatePatientNote(editingNoteId, { content: html });
    } else {
      // Create new note
      await createPatientNote(patientUserId, { content: html });
    }

    // Reload notes from API
    const notesData = await getPatientNotes(patientUserId);
    setNotes(notesData.notes || notesData || []);

    clearEditor();
    setEditingNoteId(null);
    setShowAiSuggestion(true);
  } catch (error) {
    console.error("Failed to save note:", error);
    alert("Failed to save note. Please try again.");
  }
};

  if (loading) {
    return (
      <RoleProtection allowedRoles={[USER_ROLES.PROVIDER]}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </RoleProtection>
    );
  }

  if (error) {
    return (
      <RoleProtection allowedRoles={[USER_ROLES.PROVIDER]}>
        <div className="max-w-3xl mx-auto bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          {error}
        </div>
      </RoleProtection>
    );
  }

  return (
    <RoleProtection allowedRoles={[USER_ROLES.PROVIDER]}>
      <div className="max-w-7xl mx-auto pb-10">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm text-indigo-700 font-semibold hover:text-indigo-900"
          >
            ← Back
          </button>
        </div>

        {/* Header - uses REAL patient name/email */}
        <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-50 via-sky-50 to-emerald-50 border border-indigo-100 shadow-sm">
          <div className="absolute -right-16 -top-14 h-40 w-40 rounded-full bg-indigo-200/60 blur-3xl" />
          <div className="absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-emerald-200/50 blur-3xl" />
          <div className="relative p-6 flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-gray-900">{patient.name}</h1>
            <p className="text-gray-700">{patient.email || "—"}</p>
            <p className="text-sm text-gray-600">Patient ID: {patientUserId}</p>
            <div className="flex items-center gap-3 mt-2">
              <StatusBadge status={patient.status} />
              <span className="inline-flex items-center gap-2 text-sm text-indigo-800 bg-white/70 px-3 py-1 rounded-full border border-indigo-100">
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                Updated: {formatDate(patient.acceptedAt) || "—"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information (matches your modal) */}
            <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Personal Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium">{patient.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{patient.email || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Age</p>
                  <p className="font-medium">{patient.age ?? "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Requested</p>
                  <p className="font-medium">{formatDate(patient.requestedAt)}</p>
                </div>
              </div>
            </div>

            {/* Health Goals */}
            <div className="bg-gradient-to-r from-indigo-50 via-sky-50 to-emerald-50 rounded-xl shadow-sm border border-indigo-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">🎯 Health Goals</h2>
              {patient.goals?.length > 0 ? (
                <ul className="space-y-2">
                  {patient.goals.map((goal, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span>•</span>
                      <span className="flex-1">{typeof goal === "string" ? goal : goal.goal}</span>
                      {typeof goal === "object" && goal.frequency && (
                        <span className="text-xs text-blue-600 uppercase bg-blue-100 px-2 py-1 rounded">
                          {goal.frequency}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600">No health goals provided</p>
              )}
            </div>

            {/* Health Restrictions */}
            <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 rounded-xl shadow-sm border border-amber-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">⚠️ Health Restrictions</h2>
              {patient.restrictions?.length > 0 ? (
                <ul className="space-y-2">
                  {patient.restrictions.map((r, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span>•</span>
                      <span className="text-orange-700">{r}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600">No health restrictions provided</p>
              )}
            </div>

            {/* Connection Details */}
            <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Connection Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <div className="mt-2">
                    <StatusBadge status={patient.status} />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Accepted At</p>
                  <p className="font-medium mt-2">{formatDate(patient.acceptedAt)}</p>
                </div>
              </div>
            </div>

            {/* Current Biomarkers (matches your modal cards) */}
            <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Current Biomarkers</h2>

              {!biomarkers ? (
                <p className="text-gray-600">No biomarker data available.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    "heart_rate",
                    "blood_pressure_systolic",
                    "blood_pressure_diastolic",
                    "glucose",
                    "steps",
                    "sleep",
                  ].map((key) => {
                    const item = biomarkers?.[key];
                    if (!item) return null;

                    const label = key.replace(/_/g, " ").toUpperCase();
                    const colors = CARD_COLORS[key] || CARD_COLORS.default;

                    return (
                      <BiomarkerCard
                        key={key}
                        label={label}
                        value={item?.value}
                        unit={item?.unit}
                        colors={colors}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {/* AI Recommendations Progress */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">AI Recommendations Progress</h2>

              {recsLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="animate-pulse bg-gray-100 rounded-lg p-4">
                      <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                      <div className="h-2 bg-gray-200 rounded-full w-full" />
                    </div>
                  ))}
                </div>
              ) : patientRecs.length === 0 ? (
                <p className="text-gray-500 text-sm">No AI recommendations generated for this patient yet.</p>
              ) : (
                <div className="space-y-3">
                  {patientRecs.map((rec) => {
                    const progress = rec.progress_percentage || 0;
                    const steps = rec.action_steps || [];
                    const completedSteps = steps.filter((s) => s.completed).length;
                    const isCompleted = rec.status === "completed";
                    const isInProgress = rec.status === "in_progress";
                    const catColor = rec.category_display?.color || "#6b7280";

                    return (
                      <div
                        key={rec.id}
                        className={`rounded-lg border p-4 ${
                          isCompleted ? "bg-green-50 border-green-200" :
                          isInProgress ? "bg-blue-50 border-blue-200" :
                          "bg-gray-50 border-gray-200"
                        }`}
                      >
                        {/* Header */}
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: catColor }}
                          />
                          <h4 className={`text-sm font-semibold text-gray-900 flex-1 ${isCompleted ? "line-through opacity-60" : ""}`}>
                            {rec.title}
                          </h4>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            isCompleted ? "bg-green-100 text-green-700" :
                            isInProgress ? "bg-blue-100 text-blue-700" :
                            rec.status === "dismissed" ? "bg-gray-100 text-gray-500" :
                            "bg-yellow-100 text-yellow-700"
                          }`}>
                            {isCompleted ? "Completed" :
                             isInProgress ? "In Progress" :
                             rec.status === "dismissed" ? "Dismissed" : "Active"}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-500">
                              {steps.length > 0
                                ? `${completedSteps}/${steps.length} steps`
                                : "Progress"}
                            </span>
                            <span className={`font-bold ${progress >= 100 ? "text-green-600" : "text-blue-600"}`}>
                              {progress}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                progress >= 80 ? "bg-green-500" :
                                progress >= 50 ? "bg-blue-500" :
                                progress >= 25 ? "bg-yellow-500" :
                                "bg-gray-400"
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Action Steps (collapsed view) */}
                        {steps.length > 0 && (
                          <div className="space-y-1">
                            {steps.map((step) => (
                              <div key={step.step_number} className="flex items-center gap-2 text-xs">
                                <span className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center ${
                                  step.completed
                                    ? "bg-green-500 border-green-500 text-white"
                                    : "border-gray-300 bg-white"
                                }`}>
                                  {step.completed && (
                                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </span>
                                <span className={step.completed ? "text-gray-400 line-through" : "text-gray-700"}>
                                  {step.instruction}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Meta Info */}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {rec.category_display?.label && (
                            <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: rec.category_display.bg_color, color: catColor }}>
                              {rec.category_display.label}
                            </span>
                          )}
                          {rec.priority && (
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              rec.priority === "urgent" ? "bg-red-100 text-red-700" :
                              rec.priority === "high" ? "bg-orange-100 text-orange-700" :
                              rec.priority === "medium" ? "bg-yellow-100 text-yellow-700" :
                              "bg-green-100 text-green-700"
                            }`}>
                              {rec.priority}
                            </span>
                          )}
                          {rec.difficulty && (
                            <span className="text-xs text-gray-500 capitalize">{rec.difficulty}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Historical Trends (Sprint requires UI even if endpoint missing) */}
            <div className="bg-gradient-to-r from-indigo-50 via-sky-50 to-emerald-50 rounded-xl shadow-sm border border-indigo-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Historical Trends (Last 5 Days)</h2>
              <p className="text-sm text-gray-700">
                Trend data will appear here once a trends endpoint is connected.
              </p>
            </div>

            {/* Previous Notes (Sprint requires display with timestamp + HCP name) */}
            <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Previous Notes</h2>

              {notes.length === 0 ? (
                <p className="text-gray-700">No notes yet.</p>
              ) : (
                <div className="space-y-4">
                  {notes.map((note) => (
                    <div key={note.id} className="p-4 bg-gradient-to-r from-indigo-50 via-sky-50 to-emerald-50 rounded-lg border border-indigo-100">
                      <div
                        className="text-gray-800 prose max-w-none"
                        dangerouslySetInnerHTML={{ __html: note.content || note.html }}
                      />
                      <div className="flex items-center justify-between text-sm mt-3">
                        <span className="text-gray-700 font-semibold">{note.provider_name || note.hcp_name || "Provider"}</span>
                        <span className="text-gray-600">{formatTimestamp(note.created_at || note.createdAt)}</span>
                      </div>
                      
                      {/* providers receive mark as read */}
                      <p>
                        <span className="text-xs text-gray-400">
                          {note.is_read ? "Read" : "Unread"}
                        </span>
                      </p>

                      {/* edit and delete notes buttons*/}
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-indigo-100">
                        <button
                          onClick={() => handleEditNote(note.id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT - Note Taking UI (THIS is what you said you don't see) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingNoteId ? 'Edit Note' : 'Add Note / Recommendation'}
              </h2>

              {/* AI Quick Context for Note Writing */}
              {!editingNoteId && patientRecs.length > 0 && (() => {
                const activeRecs = patientRecs.filter(r => r.status === "active" || r.status === "in_progress");
                const urgentRecs = patientRecs.filter(r => r.priority === "urgent" || r.priority === "high");
                const avgProgress = activeRecs.length > 0
                  ? Math.round(activeRecs.reduce((sum, r) => sum + (r.progress_percentage || 0), 0) / activeRecs.length)
                  : 0;
                const topCategories = [...new Set(patientRecs.map(r => r.category_display?.label || r.category))].slice(0, 3);

                return (
                  <div className="mb-4 p-4 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg">
                    <p className="text-xs font-semibold text-indigo-900 uppercase tracking-wide mb-2">Patient AI Overview</p>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-white/70 rounded p-2 text-center">
                        <p className="text-lg font-bold text-indigo-700">{activeRecs.length}</p>
                        <p className="text-xs text-gray-500">Active</p>
                      </div>
                      <div className="bg-white/70 rounded p-2 text-center">
                        <p className="text-lg font-bold text-indigo-700">{avgProgress}%</p>
                        <p className="text-xs text-gray-500">Avg Progress</p>
                      </div>
                    </div>
                    {urgentRecs.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded p-2 mb-2">
                        <p className="text-xs font-semibold text-red-700 mb-1">{urgentRecs.length} urgent/high priority:</p>
                        {urgentRecs.slice(0, 2).map(r => (
                          <p key={r.id} className="text-xs text-red-600 truncate">• {r.title}</p>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-500">Focus areas: {topCategories.join(", ")}</p>
                    <button
                      onClick={() => {
                        const summary = urgentRecs.length > 0
                          ? `Key areas to discuss: ${urgentRecs.map(r => r.title).join("; ")}. Patient progress: ${avgProgress}% average across ${activeRecs.length} active recommendations.`
                          : `Patient has ${activeRecs.length} active AI recommendations (${topCategories.join(", ")}). Average progress: ${avgProgress}%.`;
                        handleUseAiSuggestion(summary);
                      }}
                      className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Insert summary into note
                    </button>
                  </div>
                );
              })()}

              {/* Rich Text Toolbar */}
              <div className="mb-2 flex gap-1 pb-2 border-b border-indigo-100">
                <button
                  type="button"
                  onClick={() => formatText("bold")}
                  className="p-2 hover:bg-gray-100 rounded"
                  title="Bold"
                >
                  <strong>B</strong>
                </button>
                <button
                  type="button"
                  onClick={() => formatText("italic")}
                  className="p-2 hover:bg-gray-100 rounded"
                  title="Italic"
                >
                  <em>I</em>
                </button>
                <button
                  type="button"
                  onClick={() => formatText("underline")}
                  className="p-2 hover:bg-gray-100 rounded"
                  title="Underline"
                >
                  <u>U</u>
                </button>
                <button
                  type="button"
                  onClick={() => formatText("insertUnorderedList")}
                  className="p-2 hover:bg-gray-100 rounded"
                  title="Bullet List"
                >
                  •
                </button>
              </div>

              {/* Rich Text Editor */}
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                className="w-full min-h-[280px] p-4 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                placeholder="Enter your clinical notes and recommendations here..."
                onInput={() => {
                  // If user starts typing, hide suggestion card (optional)
                  const text = editorRef.current?.innerText?.trim();
                  if (text) setShowAiSuggestion(false);
                }}
              />

              {/* Save/Cancel Buttons */}
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={handleSaveNote}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  {editingNoteId ? 'Update Note' : 'Save Note'}
                </button>
                
                {editingNoteId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingNoteId(null);
                      clearEditor();
                      setShowAiSuggestion(true);
                    }}
                    className="px-4 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <p className="text-xs text-gray-500 mt-3">
                Notes are stored locally for now. If your backend has notes APIs, we can save them to the patient's record.
              </p>
            </div>
          </div>
        </div>
      </div>
    </RoleProtection>
  );
}
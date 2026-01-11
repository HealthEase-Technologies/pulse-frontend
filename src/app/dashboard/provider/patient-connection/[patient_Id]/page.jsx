"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import RoleProtection from "@/components/RoleProtection";
import { USER_ROLES } from "@/hooks/useUserRole";
import { getPatientDashboardForProvider, getPatientToHCP, getPatientNotes, createPatientNote, updatePatientNote, deletePatientNote } from "@/services/api_calls";

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
    pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
    accepted: { color: "bg-green-100 text-green-800", label: "Accepted" },
    rejected: { color: "bg-red-100 text-red-800", label: "Rejected" },
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

  // AI suggestion (placeholder requirement)
  const aiSuggestion =
    "Based on recent biomarker trends, the patient's blood pressure has slightly increased. Consider discussing stress management techniques and reviewing sodium intake. Sleep patterns remain stable, which is positive for overall cardiovascular health.";

  const [showAiSuggestion, setShowAiSuggestion] = useState(true);
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

      if (!cancelled) {
        setDashboard(dash || null);
        setPatientRequest(match);
        setNotes(notesData.notes || notesData || []);
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

  const handleUseAiSuggestion = () => {
    if (editorRef.current) {
      editorRef.current.innerHTML = `<p>${aiSuggestion}</p>`;
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
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            ← Back
          </button>
        </div>

        {/* Header - uses REAL patient name/email */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{patient.name}</h1>
          <p className="text-gray-600 mt-1">{patient.email || "—"}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information (matches your modal) */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
            <div className="bg-blue-50 rounded-lg shadow-sm border border-blue-200 p-6">
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
            <div className="bg-orange-50 rounded-lg shadow-sm border border-orange-200 p-6">
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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

            {/* Historical Trends (Sprint requires UI even if endpoint missing) */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Historical Trends (Last 5 Days)</h2>
              <p className="text-sm text-gray-500">
                Trend data will appear here once a trends endpoint is connected.
              </p>
            </div>

            {/* Previous Notes (Sprint requires display with timestamp + HCP name) */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Previous Notes</h2>

              {notes.length === 0 ? (
                <p className="text-gray-600">No notes yet.</p>
              ) : (
                <div className="space-y-4">
                  {notes.map((note) => (
                    <div key={note.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div
                        className="text-gray-800 prose max-w-none"
                        dangerouslySetInnerHTML={{ __html: note.content || note.html }}
                      />
                      <div className="flex items-center justify-between text-sm mt-3">
                        <span className="text-gray-600 font-medium">{note.provider_name || note.hcp_name || "Provider"}</span>
                        <span className="text-gray-500">{formatTimestamp(note.created_at || note.createdAt)}</span>
                      </div>
                      
                      {/* providers receive mark as read */}
                      <p>
                        <span className="text-xs text-gray-400">
                          {note.is_read ? "Read" : "Unread"}
                        </span>
                      </p>

                      {/* edit and delete notes buttons*/}
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingNoteId ? 'Edit Note' : 'Add Note / Recommendation'}
              </h2>

              {/* AI Suggestion */}
              {showAiSuggestion && !editingNoteId && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-semibold text-blue-900 mb-1">AI Suggestion</p>
                  <p className="text-sm text-blue-800">{aiSuggestion}</p>
                  <button
                    onClick={handleUseAiSuggestion}
                    className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Use this suggestion
                  </button>
                </div>
              )}

              {/* Rich Text Toolbar */}
              <div className="mb-2 flex gap-1 pb-2 border-b border-gray-200">
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
                className="w-full min-h-[280px] p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
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
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
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
                    className="px-4 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
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
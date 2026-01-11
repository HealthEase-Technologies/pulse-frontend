"use client";

import { useEffect, useState } from "react";
import { getMyDoctorNotes, markNoteAsRead } from "@/services/api_calls";
import RoleProtection from "@/components/RoleProtection";
import { USER_ROLES } from "@/hooks/useUserRole";

function formatTimestamp(date) {
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function ProviderNotesPage() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [markingId, setMarkingId] = useState(null);

  // ✅ Single loader function (used by useEffect + optional reload fallback)
  const loadNotes = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getMyDoctorNotes();
      console.log("Doctor notes received:", data);

      setNotes(data?.notes || data || []);
    } catch (err) {
      console.error("Failed to load doctor recommendations:", err);
      setError(err?.message || "Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  };

  // ✅ No auto-mark. Just load notes.
  useEffect(() => {
    loadNotes();
  }, []);

  // ✅ Tick/checkbox marking (one-way: unread -> read)
  const handleToggleRead = async (noteId, nextChecked) => {
    // If backend only supports "mark as read", don't allow unchecking.
    if (!nextChecked) return;

    try {
      setMarkingId(String(noteId));
      await markNoteAsRead(noteId);

      // Optimistic UI update
      setNotes((prev) =>
        prev.map((n) => (String(n.id) === String(noteId) ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark as read:", err);
      // fallback: reload to keep UI consistent
      await loadNotes();
    } finally {
      setMarkingId(null);
    }
  };

  if (loading) {
    return (
      <RoleProtection allowedRoles={[USER_ROLES.PATIENT]}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </RoleProtection>
    );
  }

  return (
    <RoleProtection allowedRoles={[USER_ROLES.PATIENT]}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📋 Provider Notes</h1>
          <p className="text-gray-600">
            View clinical notes and recommendations from your healthcare provider
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
            <p className="font-semibold">Error loading notes</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && notes.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Notes Yet</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Your healthcare provider hasn&apos;t added any notes yet. Check back after your next
              consultation.
            </p>
          </div>
        )}

        {/* Notes List */}
        {notes.length > 0 && (
          <div className="space-y-6">
            {notes.map((note) => {
              const noteId = String(note.id);
              const isRead = Boolean(note.is_read);

              return (
                <div
                  key={noteId}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* layout: content + right-side panel */}
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_240px]">
                    {/* LEFT: note body */}
                    <div>
                      {/* Note Header */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                            <svg
                              className="w-6 h-6 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 8 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                          </div>

                          <div>
                            <p className="font-semibold text-gray-900">
                              {note?.provider?.full_name || note.full_name || "Your Healthcare Provider"}
                            </p>
                            <p className="text-sm text-gray-600">
                              {formatTimestamp(note.created_at || note.createdAt)}
                            </p>
                          </div>

                          {/* Note Type Badge */}
                          {note.note_type && (
                            <span className="ml-auto inline-flex px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {note.note_type.replace(/_/g, " ").toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Note Content */}
                      <div className="px-6 py-6">
                        <div
                          className="prose prose-blue max-w-none text-gray-800"
                          dangerouslySetInnerHTML={{
                            __html: note.content || note.html || note.note_text || note.text,
                          }}
                        />
                      </div>

                      {/* Note Footer */}
                      {note.updated_at && note.updated_at !== note.created_at && (
                        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                          <p className="text-xs text-gray-500">
                            Last updated: {formatTimestamp(note.updated_at)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* RIGHT: tick box (no auto-mark) */}
                    <div className="border-t md:border-t-0 md:border-l border-gray-200 bg-white flex items-center justify-center p-6">
                      <div className="w-full space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Read</span>

                          <input
                            type="checkbox"
                            checked={isRead}
                            disabled={isRead || markingId === noteId}
                            onChange={(e) => handleToggleRead(noteId, e.target.checked)}
                            className="h-5 w-5 accent-blue-900"
                            title={isRead ? "Already read" : "Mark as read"}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleRead(noteId, true)}
                          disabled={isRead || markingId === noteId}
                          className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                            isRead
                              ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                              : "bg-blue-900 text-white hover:bg-blue-800"
                          }`}
                        >
                          {markingId === noteId ? "Marking..." : isRead ? "Read" : "Mark as Read"}
                        </button>

                        <p className="text-xs text-gray-500 text-center">
                          Status:{" "}
                          <span
                            className={
                              isRead ? "text-green-700 font-medium" : "text-amber-700 font-medium"
                            }
                          >
                            {isRead ? "Read" : "Unread"}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info Box */}
        {notes.length > 0 && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <svg
                className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-900">About These Notes</p>
                <p className="text-sm text-blue-800 mt-1">
                  These notes are written by your healthcare provider to help guide your health journey. If you
                  have questions, please contact your provider directly.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleProtection>
  );
}
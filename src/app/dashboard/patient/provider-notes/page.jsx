"use client";

import { useEffect, useState } from "react";
import { getMyDoctorNotes, markNoteAsRead } from "@/services/api_calls";
import RoleProtection from "@/components/RoleProtection";
import { USER_ROLES } from "@/hooks/useUserRole";

/* ─── helpers ────────────────────────────────────────────────────── */
const fmtDate = (ts) => {
  if (!ts) return "—";
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString(undefined, { year:"numeric", month:"long", day:"numeric", hour:"2-digit", minute:"2-digit" });
};

/* ─── main ───────────────────────────────────────────────────────── */
export default function ProviderNotesPage() {
  const [notes,     setNotes]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [markingId, setMarkingId] = useState(null);
  const [filter,    setFilter]    = useState("all"); // all | unread | read

  const loadNotes = async () => {
    setLoading(true); setError("");
    try {
      const data = await getMyDoctorNotes();
      setNotes(data?.notes || data || []);
    } catch (err) { setError(err?.message || "Failed to load notes"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadNotes(); }, []);

  const handleMarkRead = async (id) => {
    setMarkingId(String(id));
    try {
      await markNoteAsRead(id);
      setNotes((prev) => prev.map((n) => String(n.id) === String(id) ? { ...n, is_read: true } : n));
    } catch (_) {}
    finally { setMarkingId(null); }
  };

  const filtered = notes.filter((n) => {
    if (filter === "unread") return !n.is_read;
    if (filter === "read")   return  n.is_read;
    return true;
  });

  const unreadCount = notes.filter((n) => !n.is_read).length;

  return (
    <RoleProtection allowedRoles={[USER_ROLES.PATIENT]}>
      <div className="max-w-3xl mx-auto pb-10 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-[family-name:var(--font-serif)] text-white text-3xl font-bold">Provider Notes</h1>
            <p className="text-white/40 text-sm mt-1">Notes and messages from your healthcare provider.</p>
          </div>
          {unreadCount > 0 && (
            <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
              {unreadCount} unread
            </span>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {["all","unread","read"].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors capitalize ${filter === f ? "bg-indigo-500/15 border-indigo-500/25 text-indigo-300" : "bg-white/[0.03] border-white/[0.07] text-white/40 hover:text-white/60"}`}>
              {f}
            </button>
          ))}
        </div>

        {error && <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-white/[0.03] border border-white/[0.05] animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/[0.1] p-8 text-center text-white/25 text-sm">
            {filter === "unread" ? "No unread notes." : "No notes yet."}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((n) => (
              <div key={n.id} className={`rounded-2xl border p-5 space-y-3 transition-colors ${n.is_read ? "border-white/[0.07] bg-white/[0.02]" : "border-indigo-500/15 bg-indigo-500/[0.04]"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.is_read ? "bg-white/15" : "bg-indigo-400"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white/60 text-sm font-semibold truncate">
                        {n.provider?.full_name || n.provider_name || "Your Provider"}
                      </p>
                      <p className="text-white/25 text-xs">{fmtDate(n.created_at)}</p>
                    </div>
                  </div>
                  {!n.is_read && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      disabled={markingId === String(n.id)}
                      className="px-3 py-1 rounded-lg text-xs bg-white/[0.05] border border-white/[0.09] text-white/35 hover:text-white/55 transition-colors disabled:opacity-40 flex-shrink-0"
                    >
                      {markingId === String(n.id) ? "…" : "Mark read"}
                    </button>
                  )}
                </div>

                {n.content && (
                  <div className="text-white/60 text-sm leading-relaxed prose prose-invert prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: n.content }} />
                )}

                {/* Recommendation tags */}
                {n.recommendation_type && (
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.07] text-white/30 capitalize">
                      {n.recommendation_type}
                    </span>
                    {n.biomarker_type && (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/15 text-indigo-400/70">
                        {n.biomarker_type.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </RoleProtection>
  );
}

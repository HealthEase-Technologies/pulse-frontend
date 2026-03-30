"use client";

import { useEffect, useState } from "react";
import RoleProtection from "@/components/RoleProtection";
import { USER_ROLES } from "@/hooks/useUserRole";
import {
  getActiveRecommendations, submitRecommendationFeedback, dismissRecommendation,
} from "@/services/api_calls";

/* ─── constants ──────────────────────────────────────────────────── */
const BIO_META = {
  heart_rate:               { label: "Heart Rate",  color: "#f87171" },
  blood_pressure_systolic:  { label: "BP Systolic", color: "#fb923c" },
  blood_pressure_diastolic: { label: "BP Diastolic",color: "#fbbf24" },
  glucose:                  { label: "Glucose",     color: "#34d399" },
  steps:                    { label: "Steps",       color: "#60a5fa" },
  sleep:                    { label: "Sleep",       color: "#a78bfa" },
};

const fmtDate = (ts) => {
  if (!ts) return "";
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

/* ─── main ───────────────────────────────────────────────────────── */
export default function AIRecommendationsPage() {
  const [recs,      setRecs]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");

  /* feedback */
  const [feedbackId,   setFeedbackId]   = useState(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(null);
  const [submitting,   setSubmitting]   = useState(false);
  const [feedbackDone, setFeedbackDone] = useState(new Set());

  /* dismiss */
  const [dismissingId, setDismissingId] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await getActiveRecommendations();
        const list = Array.isArray(data) ? data : data?.recommendations || [];
        setRecs(list);
      } catch (err) { setError(err?.message || "Failed to load recommendations"); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleDismiss = async (id) => {
    setDismissingId(id);
    try {
      await dismissRecommendation(id);
      setRecs((prev) => prev.filter((r) => r.id !== id));
    } catch (_) {}
    finally { setDismissingId(null); }
  };

  const handleFeedback = async (id) => {
    if (!feedbackRating && !feedbackText.trim()) return;
    setSubmitting(true);
    try {
      await submitRecommendationFeedback(id, { rating: feedbackRating, comment: feedbackText.trim() });
      setFeedbackDone((prev) => new Set(prev).add(id));
      setFeedbackId(null); setFeedbackText(""); setFeedbackRating(null);
    } catch (_) {}
    finally { setSubmitting(false); }
  };

  return (
    <RoleProtection allowedRoles={[USER_ROLES.PATIENT]}>
      <div className="max-w-3xl mx-auto pb-10 space-y-6">

        {/* Header */}
        <div>
          <h1 className="font-[family-name:var(--font-serif)] text-white text-3xl font-bold">AI Recommendations</h1>
          <p className="text-white/40 text-sm mt-1">Personalized guidance based on your health data.</p>
        </div>

        {error && <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-white/[0.03] border border-white/[0.05] animate-pulse" />)}
          </div>
        ) : recs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/[0.1] p-10 text-center">
            <p className="text-white/25 text-sm">No active recommendations right now.</p>
            <p className="text-white/15 text-xs mt-1">Keep logging your biomarkers to get personalized insights.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-white/30 text-xs">{recs.length} recommendation{recs.length !== 1 ? "s" : ""}</p>

            {recs.map((r) => {
              const bio    = r.biomarker_type || r.category;
              const bioM   = BIO_META[bio] || { label: bio || "General", color: "#818cf8" };
              const isFbOpen = feedbackId === r.id;
              const fbDone   = feedbackDone.has(r.id);

              return (
                <div key={r.id} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 space-y-4">
                  {/* Card header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: bioM.color }}>
                        {bioM.label}
                      </p>
                      <p className="text-white/80 font-semibold leading-snug">
                        {r.recommendation || r.title || "Recommendation"}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDismiss(r.id)}
                      disabled={dismissingId === r.id}
                      className="p-1.5 rounded-lg text-white/20 hover:text-white/45 hover:bg-white/[0.05] transition-colors flex-shrink-0 disabled:opacity-40"
                      title="Dismiss"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Details */}
                  {r.explanation && (
                    <p className="text-white/45 text-sm leading-relaxed">{r.explanation}</p>
                  )}

                  {/* Steps / action items */}
                  {Array.isArray(r.action_steps) && r.action_steps.length > 0 && (
                    <ul className="space-y-1.5">
                      {r.action_steps.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-white/55">
                          <span className="w-4 h-4 rounded-full bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-semibold">{i+1}</span>
                          {s.instruction || s}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Meta pills */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {r.created_at && (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.07] text-white/30">
                        {fmtDate(r.created_at)}
                      </span>
                    )}
                    {r.priority && (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.07] text-white/30 capitalize">
                        {r.priority} priority
                      </span>
                    )}
                    {r.goal && (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        Goal-related
                      </span>
                    )}
                  </div>

                  {/* Feedback section */}
                  {!fbDone ? (
                    isFbOpen ? (
                      <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 space-y-3">
                        <p className="text-white/40 text-xs font-semibold uppercase tracking-widest">Leave Feedback</p>
                        <div className="flex gap-2">
                          {[1,2,3,4,5].map((n) => (
                            <button key={n} onClick={() => setFeedbackRating(n)}
                              className={`w-8 h-8 rounded-full text-sm font-bold border transition-colors ${feedbackRating === n ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-300" : "border-white/[0.08] text-white/25 hover:border-white/20"}`}>
                              {n}
                            </button>
                          ))}
                          <span className="text-white/25 text-xs self-center ml-1">/5</span>
                        </div>
                        <textarea
                          rows={2}
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                          placeholder="Optional comment…"
                          className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white/70 placeholder-white/20 text-sm resize-none focus:outline-none focus:border-indigo-500/50"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleFeedback(r.id)} disabled={submitting}
                            className="px-4 py-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-xs font-semibold disabled:opacity-40">
                            {submitting ? "Submitting…" : "Submit"}
                          </button>
                          <button onClick={() => { setFeedbackId(null); setFeedbackText(""); setFeedbackRating(null); }}
                            className="px-4 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.07] text-white/40 text-xs">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setFeedbackId(r.id)}
                        className="text-white/25 text-xs hover:text-white/45 transition-colors">
                        Leave feedback →
                      </button>
                    )
                  ) : (
                    <p className="text-green-400/60 text-xs">Feedback submitted. Thank you!</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </RoleProtection>
  );
}

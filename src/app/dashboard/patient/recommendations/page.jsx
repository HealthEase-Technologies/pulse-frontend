"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getMyRecommendations, generateRecommendations,
  startRecommendation, toggleActionStep, completeRecommendation,
  dismissRecommendation, submitRecommendationFeedback,
} from "@/services/api_calls";
import RoleProtection from "@/components/RoleProtection";
import { USER_ROLES } from "@/hooks/useUserRole";

/* ─── constants ──────────────────────────────────────────────────── */
const CATEGORIES = [
  { key: "all",          label: "All",       icon: "M4 6h16M4 12h16M4 18h16",              color: "#818cf8" },
  { key: "nutrition",    label: "Nutrition", icon: "M12 6v6m0 0v6m0-6h6m-6 0H6",           color: "#22c55e" },
  { key: "exercise",     label: "Exercise",  icon: "M13 10V3L4 14h7v7l9-11h-7z",           color: "#3b82f6" },
  { key: "sleep",        label: "Sleep",     icon: "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z", color: "#8b5cf6" },
  { key: "hydration",    label: "Hydration", icon: "M12 3c-4.97 0-9 3.59-9 8.02 0 4.42 4.03 7.98 9 7.98s9-3.56 9-7.98C21 6.59 16.97 3 12 3z", color: "#06b6d4" },
  { key: "mental_health",label: "Mental",    icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z", color: "#14b8a6" },
  { key: "lifestyle",    label: "Lifestyle", icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z", color: "#ec4899" },
];

const PRIORITY_CLS = {
  urgent: "bg-red-500/10 border-red-500/20 text-red-400",
  high:   "bg-orange-500/10 border-orange-500/20 text-orange-400",
  medium: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  low:    "bg-green-500/10 border-green-500/20 text-green-400",
};

const STATUS_CLS = {
  active:      "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
  in_progress: "bg-blue-500/10   border-blue-500/20   text-blue-400",
  completed:   "bg-green-500/10  border-green-500/20  text-green-400",
  dismissed:   "bg-white/[0.05]  border-white/[0.08]  text-white/25",
};

const STATUS_LABEL = { active:"New", in_progress:"In Progress", completed:"Completed", dismissed:"Dismissed" };

/* ─── main ───────────────────────────────────────────────────────── */
export default function RecommendationsPage() {
  const [recs,       setRecs]       = useState([]);
  const [stats,      setStats]      = useState({});
  const [loading,    setLoading]    = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error,      setError]      = useState("");
  const [category,   setCategory]   = useState("all");
  const [actionLoad, setActionLoad] = useState({});
  const [expanded,   setExpanded]   = useState(null);

  const fetchRecs = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const cat  = category === "all" ? null : category;
      const data = await getMyRecommendations(cat);
      if (data && !data.detail) {
        setRecs(data.recommendations || []);
        setStats({
          total:      data.total_count      || 0,
          urgent:     data.urgent_count     || 0,
          newCount:   data.new_count        || 0,
          inProgress: data.in_progress_count|| 0,
        });
      }
    } catch { setError("Failed to load recommendations"); }
    finally { setLoading(false); }
  }, [category]);

  useEffect(() => { fetchRecs(); }, [fetchRecs]);

  const setLoad = (id, v) => setActionLoad((p) => ({ ...p, [id]: v }));

  const handleGenerate = async () => {
    setGenerating(true); setError("");
    try {
      const data = await generateRecommendations({ force_regenerate: true, max_recommendations: 5 });
      if (!data?.detail) await fetchRecs();
      else setError(data.detail || "Failed to generate");
    } catch { setError("Failed to generate recommendations"); }
    finally { setGenerating(false); }
  };

  const handleStart = async (id) => {
    setLoad(id, true);
    try { const u = await startRecommendation(id); if (u && !u.detail) setRecs((p) => p.map((r) => r.id === id ? u : r)); }
    catch { setError("Failed to start"); }
    finally { setLoad(id, false); }
  };

  const handleToggleStep = async (recId, step) => {
    const key = `${recId}-step-${step}`;
    setLoad(key, true);
    try { const u = await toggleActionStep(recId, step); if (u && !u.detail) setRecs((p) => p.map((r) => r.id === recId ? u : r)); }
    catch { setError("Failed to update step"); }
    finally { setLoad(key, false); }
  };

  const handleComplete = async (id) => {
    setLoad(id, true);
    try { const u = await completeRecommendation(id); if (u && !u.detail) setRecs((p) => p.map((r) => r.id === id ? u : r)); }
    catch { setError("Failed to complete"); }
    finally { setLoad(id, false); }
  };

  const handleDismiss = async (id) => {
    setLoad(id + "-dismiss", true);
    try { await dismissRecommendation(id); setRecs((p) => p.filter((r) => r.id !== id)); }
    catch { setError("Failed to dismiss"); }
    finally { setLoad(id + "-dismiss", false); }
  };

  const catColor = (key) => CATEGORIES.find((c) => c.key === key)?.color || "#818cf8";

  return (
    <RoleProtection allowedRoles={[USER_ROLES.PATIENT]}>
      <div className="max-w-4xl mx-auto pb-10 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>

            <h1 className="font-[family-name:var(--font-serif)] text-white text-3xl font-bold">Recommendations</h1>
            <p className="text-white/40 text-sm mt-1">Personalized action plans to improve your health.</p>
          </div>
          <button onClick={handleGenerate} disabled={generating}
            className="px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium hover:bg-indigo-500/20 transition-colors disabled:opacity-40 flex items-center gap-2">
            {generating ? (
              <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Generating…</>
            ) : "Generate New"}
          </button>
        </div>

        {/* Stats row */}
        {stats.total > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total",       val: stats.total,      cls: "text-white/60"   },
              { label: "In Progress", val: stats.inProgress, cls: "text-blue-400"   },
              { label: "Urgent",      val: stats.urgent,     cls: "text-red-400"    },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 text-center">
                <p className="text-white/30 text-xs uppercase tracking-widest">{s.label}</p>
                <p className={`text-2xl font-bold mt-1 ${s.cls}`}>{s.val}</p>
              </div>
            ))}
          </div>
        )}

        {/* Category filter */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const isActive = category === c.key;
            return (
              <button key={c.key} onClick={() => setCategory(c.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${isActive ? "border-opacity-40 text-white/80" : "border-white/[0.07] text-white/35 hover:border-white/20"}`}
                style={isActive ? { borderColor: c.color + "60", background: c.color + "15", color: c.color } : {}}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={c.icon} /></svg>
                {c.label}
              </button>
            );
          })}
        </div>

        {error && <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-white/[0.03] border border-white/[0.05] animate-pulse" />)}
          </div>
        ) : recs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/[0.1] p-10 text-center">
            <p className="text-white/25 text-sm">No recommendations yet.</p>
            <button onClick={handleGenerate} disabled={generating} className="mt-3 text-indigo-400 text-sm hover:underline disabled:opacity-40">
              {generating ? "Generating…" : "Generate recommendations →"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {recs.map((r) => {
              const color    = catColor(r.category);
              const isExp    = expanded === r.id;
              const doneSteps= (r.action_steps || []).filter((s) => s.completed).length;
              const totalSteps = (r.action_steps || []).length;
              const pct      = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

              return (
                <div key={r.id} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 space-y-4">
                  {/* Card header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color }}>{r.category || "General"}</p>
                        {r.priority && (
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${PRIORITY_CLS[r.priority] || PRIORITY_CLS.medium}`}>{r.priority}</span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_CLS[r.status] || STATUS_CLS.active}`}>
                          {STATUS_LABEL[r.status] || r.status}
                        </span>
                      </div>
                      <p className="text-white/80 font-semibold leading-snug">{r.title || r.recommendation}</p>
                    </div>
                    <button onClick={() => handleDismiss(r.id)} disabled={!!actionLoad[r.id + "-dismiss"]}
                      className="p-1.5 rounded-lg text-white/20 hover:text-white/45 hover:bg-white/[0.05] transition-colors flex-shrink-0 disabled:opacity-30"
                      title="Dismiss">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>

                  {/* Description */}
                  {r.description && <p className="text-white/45 text-sm leading-relaxed">{r.description}</p>}

                  {/* Progress bar */}
                  {totalSteps > 0 && (
                    <div>
                      <div className="flex justify-between text-xs text-white/30 mb-1">
                        <span>{doneSteps} / {totalSteps} steps</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  )}

                  {/* Expand/collapse steps */}
                  {totalSteps > 0 && (
                    <button onClick={() => setExpanded(isExp ? null : r.id)}
                      className="text-xs text-white/30 hover:text-white/50 transition-colors">
                      {isExp ? "Hide steps ↑" : `Show ${totalSteps} steps ↓`}
                    </button>
                  )}

                  {isExp && (r.action_steps || []).length > 0 && (
                    <ul className="space-y-2">
                      {r.action_steps.map((s, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <button
                            onClick={() => handleToggleStep(r.id, s.step_number ?? i + 1)}
                            disabled={!!actionLoad[`${r.id}-step-${s.step_number ?? i + 1}`]}
                            className={`w-5 h-5 rounded-full border flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${s.completed ? "border-green-500 bg-green-500" : "border-white/25 hover:border-indigo-400"}`}
                          >
                            {s.completed && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                          </button>
                          <p className={`text-sm ${s.completed ? "text-white/30 line-through" : "text-white/60"}`}>{s.instruction || s.description || s.text}</p>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-1">
                    {r.status === "active" && (
                      <button onClick={() => handleStart(r.id)} disabled={!!actionLoad[r.id]}
                        className="px-4 py-1.5 rounded-lg text-xs font-semibold border border-indigo-500/25 bg-indigo-500/[0.08] text-indigo-300 hover:bg-indigo-500/15 transition-colors disabled:opacity-40">
                        {actionLoad[r.id] ? "…" : "Start"}
                      </button>
                    )}
                    {r.status === "in_progress" && (
                      <button onClick={() => handleComplete(r.id)} disabled={!!actionLoad[r.id]}
                        className="px-4 py-1.5 rounded-lg text-xs font-semibold border border-green-500/25 bg-green-500/[0.08] text-green-300 hover:bg-green-500/15 transition-colors disabled:opacity-40">
                        {actionLoad[r.id] ? "…" : "Mark Complete"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </RoleProtection>
  );
}

"use client";

import { useState, useEffect } from "react";
import {
  getPatientProfile, updatePatientProfile,
  markGoalComplete, unmarkGoalComplete, getGoalCompletions,
  getGoalStats, initializeDailyGoals,
} from "@/services/api_calls";
import RoleProtection from "@/components/RoleProtection";
import { USER_ROLES } from "@/hooks/useUserRole";

/* ─── helpers ────────────────────────────────────────────────────── */
const inputCls = "w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white/80 placeholder-white/20 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors";
const FREQ_OPTS = ["daily","weekly","monthly"];
const FREQ_CLS = {
  daily:   "bg-indigo-500/10 border-indigo-500/20 text-indigo-300",
  weekly:  "bg-violet-500/10 border-violet-500/20 text-violet-300",
  monthly: "bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-300",
};

export default function MyGoalsPage() {
  const [healthGoals,        setHealthGoals]        = useState([]);
  const [healthRestrictions, setHealthRestrictions] = useState([]);
  const [loading,            setLoading]            = useState(true);
  const [error,              setError]              = useState("");
  const [success,            setSuccess]            = useState("");

  /* add goal */
  const [newGoal,      setNewGoal]      = useState("");
  const [newGoalFreq,  setNewGoalFreq]  = useState("daily");

  /* add restriction */
  const [newRestriction, setNewRestriction] = useState("");

  /* edit goal */
  const [editIdx,    setEditIdx]    = useState(null);
  const [editText,   setEditText]   = useState("");
  const [editFreq,   setEditFreq]   = useState("daily");

  /* edit restriction */
  const [editRIdx,   setEditRIdx]   = useState(null);
  const [editRText,  setEditRText]  = useState("");

  /* tracking */
  const [todayDone,  setTodayDone]  = useState(new Set());
  const [stats,      setStats]      = useState(null);
  const [statsLoad,  setStatsLoad]  = useState(false);

  /* active tab */
  const [tab, setTab] = useState("goals"); // goals | restrictions | stats

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const profile = await getPatientProfile();
      let goals = profile.health_goals || [];
      if (typeof goals === "string") {
        goals = goals.split(",").filter(Boolean).map((g) => ({ goal: g.trim(), frequency: "daily" }));
      } else if (!Array.isArray(goals)) goals = [];
      setHealthGoals(goals);
      setHealthRestrictions(profile.health_restrictions || []);
      await initializeDailyGoals();
      await loadTracking();
    } catch (err) { setError(err.message || "Failed to load goals"); }
    finally { setLoading(false); }
  };

  const loadTracking = async () => {
    setStatsLoad(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const [compData, statsData] = await Promise.allSettled([
        getGoalCompletions(),
        getGoalStats(),
      ]);
      if (compData.status === "fulfilled") {
        const done = new Set();
        (compData.value?.completions || []).forEach((c) => {
          if (c.completion_date === today && c.status === "completed") done.add(c.goal_text);
        });
        setTodayDone(done);
      }
      if (statsData.status === "fulfilled") setStats(statsData.value);
    } catch (_) {}
    finally { setStatsLoad(false); }
  };

  const saveProfile = async (goals, restrictions) => {
    try {
      await updatePatientProfile({ health_goals: goals, health_restrictions: restrictions });
      await initializeDailyGoals();
      await loadTracking();
    } catch (err) { setError(err.message || "Failed to save"); }
  };

  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); };

  /* goal toggle */
  const handleToggle = async (goalObj) => {
    const done = todayDone.has(goalObj.goal);
    try {
      if (done) await unmarkGoalComplete(goalObj.goal);
      else      await markGoalComplete(goalObj.goal, goalObj.frequency);
      await loadTracking();
      flash(done ? "Goal unmarked." : "Great job! Goal marked complete.");
    } catch (err) { setError(err.message || "Failed to update"); }
  };

  /* add goal */
  const addGoal = () => {
    if (!newGoal.trim()) return;
    const updated = [...healthGoals, { goal: newGoal.trim(), frequency: newGoalFreq }];
    setHealthGoals(updated); setNewGoal("");
    saveProfile(updated, healthRestrictions);
    flash("Goal added.");
  };

  /* remove goal */
  const removeGoal = (idx) => {
    const updated = healthGoals.filter((_, i) => i !== idx);
    setHealthGoals(updated);
    saveProfile(updated, healthRestrictions);
  };

  /* save edit goal */
  const saveEditGoal = () => {
    if (!editText.trim()) return;
    const updated = [...healthGoals];
    updated[editIdx] = { goal: editText.trim(), frequency: editFreq };
    setHealthGoals(updated); setEditIdx(null);
    saveProfile(updated, healthRestrictions);
    flash("Goal updated.");
  };

  /* add restriction */
  const addRestriction = () => {
    if (!newRestriction.trim()) return;
    const updated = [...healthRestrictions, newRestriction.trim()];
    setHealthRestrictions(updated); setNewRestriction("");
    saveProfile(healthGoals, updated);
    flash("Restriction added.");
  };

  /* remove restriction */
  const removeRestriction = (idx) => {
    const updated = healthRestrictions.filter((_, i) => i !== idx);
    setHealthRestrictions(updated);
    saveProfile(healthGoals, updated);
  };

  /* save edit restriction */
  const saveEditRestriction = () => {
    if (!editRText.trim()) return;
    const updated = [...healthRestrictions];
    updated[editRIdx] = editRText.trim();
    setHealthRestrictions(updated); setEditRIdx(null);
    saveProfile(healthGoals, updated);
    flash("Restriction updated.");
  };

  const todayTotal   = healthGoals.filter((g) => g.frequency === "daily" || !g.frequency).length;
  const todayPct     = todayTotal > 0 ? Math.round((todayDone.size / todayTotal) * 100) : 0;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin" />
    </div>
  );

  return (
    <RoleProtection allowedRoles={[USER_ROLES.PATIENT]}>
      <div className="max-w-3xl mx-auto pb-10 space-y-6">

        {/* Header */}
        <div>
          <h1 className="font-[family-name:var(--font-serif)] text-white text-3xl font-bold">Goals & Restrictions</h1>
          <p className="text-white/40 text-sm mt-1">Track your daily health goals and dietary restrictions.</p>
        </div>

        {/* Today's progress */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-white/60 text-sm font-semibold">Today's Progress</p>
            <span className="text-white/40 text-sm">{todayDone.size} / {todayTotal} daily goals</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${todayPct}%`,
                background: todayPct >= 80 ? "#10b981" : todayPct >= 40 ? "#f59e0b" : "#6366f1",
              }}
            />
          </div>
          <p className="text-white/25 text-xs mt-2">{todayPct}% complete</p>
        </div>

        {error   && <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
        {success && <div className="px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">{success}</div>}

        {/* Tabs */}
        <div className="flex gap-2">
          {["goals","restrictions","stats"].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors capitalize ${tab === t ? "bg-indigo-500/15 border-indigo-500/25 text-indigo-300" : "bg-white/[0.03] border-white/[0.07] text-white/40 hover:text-white/60"}`}>
              {t}
            </button>
          ))}
        </div>

        {/* ── Goals tab ── */}
        {tab === "goals" && (
          <div className="space-y-4">
            {healthGoals.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/[0.1] p-8 text-center text-white/25 text-sm">
                No goals yet. Add one below.
              </div>
            ) : (
              <div className="space-y-2">
                {healthGoals.map((g, idx) => {
                  const done   = todayDone.has(g.goal);
                  const isEdit = editIdx === idx;
                  const freq   = g.frequency || "daily";
                  return (
                    <div key={idx} className={`rounded-xl border p-4 transition-colors ${done ? "border-green-500/20 bg-green-500/[0.04]" : "border-white/[0.07] bg-white/[0.03]"}`}>
                      {isEdit ? (
                        <div className="space-y-3">
                          <input value={editText} onChange={(e) => setEditText(e.target.value)} className={inputCls} />
                          <div className="flex gap-2">
                            {FREQ_OPTS.map((f) => (
                              <button key={f} onClick={() => setEditFreq(f)}
                                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors capitalize ${editFreq === f ? FREQ_CLS[f] : "border-white/[0.07] text-white/30"}`}>
                                {f}
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <button onClick={saveEditGoal} className="px-4 py-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-xs font-semibold">Save</button>
                            <button onClick={() => setEditIdx(null)} className="px-4 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.07] text-white/40 text-xs">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <button onClick={() => handleToggle(g)}
                              className={`w-5 h-5 rounded-full border flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${done ? "bg-green-500 border-green-500" : "border-white/25 hover:border-indigo-400"}`}>
                              {done && (
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                            <div>
                              <p className={`text-sm font-medium ${done ? "text-white/35 line-through" : "text-white/75"}`}>{g.goal}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full border mt-1 inline-block ${FREQ_CLS[freq] || "border-white/10 text-white/30"}`}>{freq}</span>
                            </div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button onClick={() => { setEditIdx(idx); setEditText(g.goal); setEditFreq(freq); }}
                              className="p-1.5 rounded-lg text-white/25 hover:text-white/50 hover:bg-white/[0.05] transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button onClick={() => removeGoal(idx)}
                              className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/[0.08] transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add goal */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
              <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-3">Add Goal</p>
              <div className="flex gap-2 mb-3">
                <input value={newGoal} onChange={(e) => setNewGoal(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addGoal()}
                  placeholder="e.g. Walk 10,000 steps" className={`${inputCls} flex-1`} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-2">
                  {FREQ_OPTS.map((f) => (
                    <button key={f} onClick={() => setNewGoalFreq(f)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors capitalize ${newGoalFreq === f ? FREQ_CLS[f] : "border-white/[0.07] text-white/30 hover:border-white/20"}`}>
                      {f}
                    </button>
                  ))}
                </div>
                <button onClick={addGoal} disabled={!newGoal.trim()}
                  className="px-4 py-1.5 rounded-xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-sm font-semibold hover:bg-indigo-500/20 transition-colors disabled:opacity-40">
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Restrictions tab ── */}
        {tab === "restrictions" && (
          <div className="space-y-4">
            {healthRestrictions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/[0.1] p-8 text-center text-white/25 text-sm">
                No restrictions yet. Add any dietary or activity restrictions.
              </div>
            ) : (
              <div className="space-y-2">
                {healthRestrictions.map((r, idx) => {
                  const isEdit = editRIdx === idx;
                  return (
                    <div key={idx} className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
                      {isEdit ? (
                        <div className="flex gap-2">
                          <input value={editRText} onChange={(e) => setEditRText(e.target.value)} className={`${inputCls} flex-1`} />
                          <button onClick={saveEditRestriction} className="px-3 py-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-xs font-semibold">Save</button>
                          <button onClick={() => setEditRIdx(null)} className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.07] text-white/40 text-xs">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-white/70 text-sm">{r}</p>
                          <div className="flex gap-1">
                            <button onClick={() => { setEditRIdx(idx); setEditRText(r); }}
                              className="p-1.5 rounded-lg text-white/25 hover:text-white/50 hover:bg-white/[0.05] transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button onClick={() => removeRestriction(idx)}
                              className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/[0.08] transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
              <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-3">Add Restriction</p>
              <div className="flex gap-2">
                <input value={newRestriction} onChange={(e) => setNewRestriction(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addRestriction()}
                  placeholder="e.g. Gluten-free, No caffeine" className={`${inputCls} flex-1`} />
                <button onClick={addRestriction} disabled={!newRestriction.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-sm font-semibold hover:bg-indigo-500/20 transition-colors disabled:opacity-40">
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Stats tab ── */}
        {tab === "stats" && (
          <div className="space-y-4">
            {statsLoad ? (
              <div className="flex items-center justify-center py-12 gap-2 text-white/30 text-sm">
                <div className="w-5 h-5 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin" />
                Loading stats…
              </div>
            ) : !stats ? (
              <div className="rounded-2xl border border-dashed border-white/[0.1] p-8 text-center text-white/25 text-sm">No stats yet.</div>
            ) : (
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { label: "Current Streak",   value: stats.current_streak   ?? 0, suffix: "days",  color: "text-indigo-400" },
                  { label: "Longest Streak",   value: stats.longest_streak   ?? 0, suffix: "days",  color: "text-violet-400" },
                  { label: "Completion Rate",  value: stats.completion_rate  != null ? `${Math.round(stats.completion_rate * 100)}%` : "--", suffix: "", color: "text-green-400" },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
                    <p className="text-white/30 text-xs uppercase tracking-widest mb-1">{s.label}</p>
                    <p className={`text-3xl font-bold ${s.color}`}>{s.value}<span className="text-white/30 text-sm ml-1">{s.suffix}</span></p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </RoleProtection>
  );
}

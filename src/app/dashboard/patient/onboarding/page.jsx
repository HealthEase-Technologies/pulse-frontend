"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { completeOnboarding } from "@/services/api_calls";
import RoleProtection from "@/components/RoleProtection";
import { USER_ROLES } from "@/hooks/useUserRole";

/* ─── helpers ────────────────────────────────────────────────────── */
const inputCls = "w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white/80 placeholder-white/20 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors";
const labelCls = "block text-white/40 text-xs font-semibold uppercase tracking-widest mb-1.5";
const FREQ_OPTS = ["daily","weekly","monthly","never"];
const FREQ_CLS  = { daily:"bg-indigo-500/10 border-indigo-500/20 text-indigo-300", weekly:"bg-violet-500/10 border-violet-500/20 text-violet-300", monthly:"bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-300", never:"bg-white/[0.05] border-white/[0.08] text-white/30" };
const EMPTY_CONTACT = { name: "", phone: "", relationship: "" };

/* ─── steps ──────────────────────────────────────────────────────── */
const STEPS = ["Basic Info","Goals","Emergency Contacts","Done"];

export default function PatientOnboarding() {
  const router = useRouter();
  const [step,    setStep]    = useState(0);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const [form, setForm] = useState({
    date_of_birth: "", weight_kg: "", height_cm: "",
    health_goals: [], health_restrictions: [],
    reminder_frequency: "daily",
    emergency_contacts: [{ ...EMPTY_CONTACT }, { ...EMPTY_CONTACT }, { ...EMPTY_CONTACT }],
  });

  const [newGoal,      setNewGoal]      = useState("");
  const [newGoalFreq,  setNewGoalFreq]  = useState("daily");
  const [newRestrict,  setNewRestrict]  = useState("");

  const set = (field, val) => setForm((p) => ({ ...p, [field]: val }));
  const setContact = (i, field, val) =>
    setForm((p) => ({ ...p, emergency_contacts: p.emergency_contacts.map((c, idx) => idx === i ? { ...c, [field]: val } : c) }));

  const addGoal = () => {
    if (!newGoal.trim()) return;
    if (form.health_goals.some((g) => g.goal === newGoal.trim())) return;
    set("health_goals", [...form.health_goals, { goal: newGoal.trim(), frequency: newGoalFreq }]);
    setNewGoal(""); setNewGoalFreq("daily");
  };
  const removeGoal = (g) => set("health_goals", form.health_goals.filter((x) => x.goal !== g.goal));

  const addRestriction = () => {
    if (!newRestrict.trim() || form.health_restrictions.includes(newRestrict.trim())) return;
    set("health_restrictions", [...form.health_restrictions, newRestrict.trim()]);
    setNewRestrict("");
  };
  const removeRestriction = (r) => set("health_restrictions", form.health_restrictions.filter((x) => x !== r));

  const handleSubmit = async () => {
    if (!form.date_of_birth || !form.weight_kg || !form.height_cm) { setError("Please fill in date of birth, weight, and height."); return; }
    if (form.health_goals.length === 0) { setError("Please add at least one health goal."); return; }
    setLoading(true); setError("");
    try {
      const validContacts = form.emergency_contacts.filter((c) => c.name && c.phone && c.relationship);
      await completeOnboarding({
        date_of_birth:      form.date_of_birth,
        weight_kg:          parseFloat(form.weight_kg),
        height_cm:          parseFloat(form.height_cm),
        health_goals:       form.health_goals,
        health_restrictions:form.health_restrictions,
        reminder_frequency: form.reminder_frequency,
        emergency_contacts: validContacts,
      });
      router.push("/dashboard/patient");
    } catch (err) { setError(err.message || "Failed to complete onboarding"); }
    finally { setLoading(false); }
  };

  const nextStep = () => {
    setError("");
    if (step === 0) {
      if (!form.date_of_birth || !form.weight_kg || !form.height_cm) { setError("Please fill in date of birth, weight, and height."); return; }
    }
    if (step === 1) {
      if (form.health_goals.length === 0) { setError("Please add at least one health goal."); return; }
    }
    setStep((s) => s + 1);
  };

  return (
    <RoleProtection allowedRoles={[USER_ROLES.PATIENT]}>
      <div className="max-w-2xl mx-auto pb-10 space-y-6">

        {/* Header */}
        <div>
          <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-1">Welcome</p>
          <h1 className="font-[family-name:var(--font-serif)] text-white text-3xl font-bold">Let's get you set up</h1>
          <p className="text-white/40 text-sm mt-1">Complete your profile to start tracking your health.</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-colors ${i < step ? "bg-indigo-500 text-white" : i === step ? "bg-indigo-500/20 border border-indigo-500/40 text-indigo-300" : "bg-white/[0.05] border border-white/[0.08] text-white/25"}`}>
                {i < step ? (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                ) : i + 1}
              </div>
              <span className={`text-xs font-medium ${i === step ? "text-white/60" : "text-white/25"}`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`flex-1 h-px mx-1 ${i < step ? "bg-indigo-500/40" : "bg-white/[0.07]"}`} />}
            </div>
          ))}
        </div>

        {error && <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

        {/* ── Step 0: Basic Info ── */}
        {step === 0 && (
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 space-y-5">
            <p className="text-white/60 text-sm font-semibold">Basic Information</p>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Date of Birth *</label>
                <input type="date" value={form.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)} className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}>Weight (kg) *</label>
                <input type="number" step="0.1" min="0" max="500" value={form.weight_kg} onChange={(e) => set("weight_kg", e.target.value)} placeholder="70" className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}>Height (cm) *</label>
                <input type="number" step="0.1" min="0" max="300" value={form.height_cm} onChange={(e) => set("height_cm", e.target.value)} placeholder="175" className={inputCls} required />
              </div>
            </div>
            <div>
              <label className={labelCls}>Reminder Frequency</label>
              <div className="flex flex-wrap gap-2">
                {FREQ_OPTS.map((f) => (
                  <button key={f} type="button" onClick={() => set("reminder_frequency", f)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors capitalize ${form.reminder_frequency === f ? FREQ_CLS[f] : "border-white/[0.07] text-white/30 hover:border-white/20"}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 1: Goals ── */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Goals */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 space-y-4">
              <p className="text-white/60 text-sm font-semibold">Health Goals *</p>
              {form.health_goals.length > 0 && (
                <div className="space-y-2">
                  {form.health_goals.map((g, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2">
                      <div>
                        <p className="text-white/65 text-sm">{g.goal}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full border mt-0.5 inline-block capitalize ${FREQ_CLS[g.frequency] || "border-white/10 text-white/30"}`}>{g.frequency}</span>
                      </div>
                      <button type="button" onClick={() => removeGoal(g)} className="text-white/20 hover:text-red-400 transition-colors p-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input value={newGoal} onChange={(e) => setNewGoal(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addGoal())}
                  placeholder="e.g. Walk 10,000 steps" className={`${inputCls} flex-1`} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-2">
                  {["daily","weekly","monthly"].map((f) => (
                    <button key={f} type="button" onClick={() => setNewGoalFreq(f)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors capitalize ${newGoalFreq === f ? FREQ_CLS[f] : "border-white/[0.07] text-white/30 hover:border-white/20"}`}>
                      {f}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={addGoal} disabled={!newGoal.trim()}
                  className="px-4 py-1.5 rounded-xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-xs font-semibold hover:bg-indigo-500/20 disabled:opacity-40 transition-colors">
                  Add Goal
                </button>
              </div>
            </div>

            {/* Restrictions */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 space-y-4">
              <p className="text-white/60 text-sm font-semibold">Health Restrictions <span className="text-white/25 font-normal">(optional)</span></p>
              {form.health_restrictions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.health_restrictions.map((r, i) => (
                    <span key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/50 text-xs">
                      {r}
                      <button type="button" onClick={() => removeRestriction(r)} className="text-white/25 hover:text-red-400 transition-colors">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input value={newRestrict} onChange={(e) => setNewRestrict(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addRestriction())}
                  placeholder="e.g. Gluten-free, No caffeine" className={`${inputCls} flex-1`} />
                <button type="button" onClick={addRestriction} disabled={!newRestrict.trim()}
                  className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.07] text-white/40 text-sm hover:bg-white/[0.07] disabled:opacity-40 transition-colors">
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Emergency Contacts ── */}
        {step === 2 && (
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 space-y-5">
            <p className="text-white/60 text-sm font-semibold">Emergency Contacts <span className="text-white/25 font-normal">(optional)</span></p>
            {form.emergency_contacts.map((c, i) => (
              <div key={i} className="rounded-xl border border-white/[0.06] p-4 space-y-3">
                <p className="text-white/30 text-xs font-semibold uppercase tracking-widest">Contact {i + 1}</p>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Name</label>
                    <input value={c.name} onChange={(e) => setContact(i, "name", e.target.value)} placeholder="Full name" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Phone</label>
                    <input type="tel" value={c.phone} onChange={(e) => setContact(i, "phone", e.target.value)} placeholder="+1 555 0000" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Relationship</label>
                    <input value={c.relationship} onChange={(e) => setContact(i, "relationship", e.target.value)} placeholder="e.g. Parent" className={inputCls} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Step 3: Done ── */}
        {step === 3 && (
          <div className="rounded-2xl border border-green-500/20 bg-green-500/[0.05] p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-green-500/15 border border-green-500/20 flex items-center justify-center mx-auto">
              <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-white/80 text-lg font-bold">All set!</p>
              <p className="text-white/40 text-sm mt-1">Your profile is complete. Let's start your health journey.</p>
            </div>
            <div className="text-left space-y-2 max-w-xs mx-auto">
              {[
                { label: "Goals",        val: `${form.health_goals.length} added`            },
                { label: "Restrictions", val: form.health_restrictions.length > 0 ? `${form.health_restrictions.length} added` : "None" },
                { label: "Reminders",    val: form.reminder_frequency                        },
              ].map((s) => (
                <div key={s.label} className="flex justify-between text-sm">
                  <span className="text-white/30">{s.label}</span>
                  <span className="text-white/60 font-medium capitalize">{s.val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          {step > 0 && step < 3 && (
            <button type="button" onClick={() => { setError(""); setStep((s) => s - 1); }}
              className="px-5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.07] text-white/40 text-sm hover:bg-white/[0.07] hover:text-white/60 transition-colors">
              Back
            </button>
          )}
          {step < 2 && (
            <button type="button" onClick={nextStep}
              className="flex-1 py-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-sm font-semibold hover:bg-indigo-500/20 transition-colors">
              Continue
            </button>
          )}
          {step === 2 && (
            <button type="button" onClick={() => { setError(""); setStep(3); }}
              className="flex-1 py-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-sm font-semibold hover:bg-indigo-500/20 transition-colors">
              Continue
            </button>
          )}
          {step === 3 && (
            <button type="button" onClick={handleSubmit} disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-sm font-semibold hover:bg-indigo-500/20 transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
              {loading ? (
                <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Saving…</>
              ) : "Launch Dashboard →"}
            </button>
          )}
        </div>
      </div>
    </RoleProtection>
  );
}

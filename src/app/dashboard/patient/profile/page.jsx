"use client";

import { useState, useEffect } from "react";
import { getCurrentUser, getPatientProfile, updatePatientProfile } from "@/services/api_calls";
import RoleProtection from "@/components/RoleProtection";
import { USER_ROLES } from "@/hooks/useUserRole";

/* ─── helpers ────────────────────────────────────────────────────── */
const inputCls = "w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white/80 placeholder-white/20 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors";
const labelCls = "block text-white/40 text-xs font-semibold uppercase tracking-widest mb-1.5";
const FREQ_OPTS = ["daily","weekly","monthly","never"];

const EMPTY_CONTACT = { name: "", phone: "", relationship: "" };

export default function PatientProfile() {
  const [userInfo, setUserInfo] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");

  const [form, setForm] = useState({
    date_of_birth:      "",
    weight_kg:          "",
    height_cm:          "",
    reminder_frequency: "daily",
    emergency_contacts: [EMPTY_CONTACT, EMPTY_CONTACT, EMPTY_CONTACT],
  });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [user, profile] = await Promise.all([getCurrentUser(), getPatientProfile()]);
      setUserInfo(user);
      const contacts = Array.isArray(profile.emergency_contacts) && profile.emergency_contacts.length > 0
        ? [...profile.emergency_contacts.map((c) => ({ ...c })), ...Array.from({ length: Math.max(0, 3 - profile.emergency_contacts.length) }, () => ({ ...EMPTY_CONTACT }))].slice(0, 3)
        : [{ ...EMPTY_CONTACT }, { ...EMPTY_CONTACT }, { ...EMPTY_CONTACT }];
      setForm({
        date_of_birth:      profile.date_of_birth      || "",
        weight_kg:          profile.weight_kg           != null ? String(profile.weight_kg)  : "",
        height_cm:          profile.height_cm           != null ? String(profile.height_cm)  : "",
        reminder_frequency: profile.reminder_frequency || "daily",
        emergency_contacts: contacts,
      });
    } catch (err) { setError(err.message || "Failed to load profile"); }
    finally { setLoading(false); }
  };

  const set = (field, val) => setForm((p) => ({ ...p, [field]: val }));
  const setContact = (i, field, val) =>
    setForm((p) => ({ ...p, emergency_contacts: p.emergency_contacts.map((c, idx) => idx === i ? { ...c, [field]: val } : c) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(""); setSuccess("");
    try {
      const validContacts = form.emergency_contacts.filter((c) => c.name && c.phone && c.relationship);
      await updatePatientProfile({
        date_of_birth:      form.date_of_birth      || null,
        weight_kg:          form.weight_kg !== ""   ? parseFloat(form.weight_kg)  : null,
        height_cm:          form.height_cm !== ""   ? parseFloat(form.height_cm)  : null,
        reminder_frequency: form.reminder_frequency,
        emergency_contacts: validContacts,
      });
      setSuccess("Profile saved successfully.");
      setTimeout(() => setSuccess(""), 3000);
      await load();
    } catch (err) { setError(err.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin" />
    </div>
  );

  const bmi = form.weight_kg && form.height_cm
    ? (parseFloat(form.weight_kg) / Math.pow(parseFloat(form.height_cm) / 100, 2)).toFixed(1)
    : null;

  return (
    <RoleProtection allowedRoles={[USER_ROLES.PATIENT]}>
      <div className="max-w-2xl mx-auto pb-10 space-y-6">

        {/* Header */}
        <div>
          <h1 className="font-[family-name:var(--font-serif)] text-white text-3xl font-bold">My Profile</h1>
          <p className="text-white/40 text-sm mt-1">Update your personal health information.</p>
        </div>

        {/* Account info (read-only) */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
          <p className="text-white/60 text-sm font-semibold mb-4 pb-3 border-b border-white/[0.07]">Account</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-1">Full Name</p>
              <p className="text-white/70 text-sm">{userInfo?.full_name || "—"}</p>
            </div>
            <div>
              <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-1">Email</p>
              <p className="text-white/70 text-sm">{userInfo?.email || "—"}</p>
            </div>
            <div>
              <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-1">Username</p>
              <p className="text-white/70 text-sm">{userInfo?.username || "—"}</p>
            </div>
            <div>
              <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-1">Role</p>
              <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-semibold">Patient</span>
            </div>
          </div>
        </div>

        {error   && <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
        {success && <div className="px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Health Info */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
            <p className="text-white/60 text-sm font-semibold mb-5 pb-3 border-b border-white/[0.07]">Health Information</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Date of Birth</label>
                <input type="date" value={form.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Weight (kg)</label>
                <input type="number" step="0.1" min="0" max="500" value={form.weight_kg} onChange={(e) => set("weight_kg", e.target.value)} placeholder="e.g. 70" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Height (cm)</label>
                <input type="number" step="0.1" min="0" max="300" value={form.height_cm} onChange={(e) => set("height_cm", e.target.value)} placeholder="e.g. 175" className={inputCls} />
              </div>
              <div>
                <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-1.5">BMI</p>
                <div className="px-3 py-2.5 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                  <p className={`text-sm font-semibold ${bmi ? (parseFloat(bmi) < 18.5 || parseFloat(bmi) >= 25 ? "text-amber-400" : "text-green-400") : "text-white/25"}`}>
                    {bmi || "—"}
                  </p>
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Reminder Frequency</label>
                <div className="flex flex-wrap gap-2">
                  {FREQ_OPTS.map((f) => (
                    <button key={f} type="button" onClick={() => set("reminder_frequency", f)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors capitalize ${form.reminder_frequency === f ? "bg-indigo-500/15 border-indigo-500/25 text-indigo-300" : "border-white/[0.07] text-white/30 hover:border-white/20 hover:text-white/50"}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Contacts */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
            <p className="text-white/60 text-sm font-semibold mb-5 pb-3 border-b border-white/[0.07]">Emergency Contacts</p>
            <div className="space-y-5">
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
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-sm font-semibold hover:bg-indigo-500/20 transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
              {saving ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving…
                </>
              ) : "Save Profile"}
            </button>
          </div>
        </form>
      </div>
    </RoleProtection>
  );
}

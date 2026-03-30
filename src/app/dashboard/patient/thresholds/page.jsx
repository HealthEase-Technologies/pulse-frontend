"use client";

import { useEffect, useState } from "react";
import RoleProtection from "@/components/RoleProtection";
import { USER_ROLES } from "@/hooks/useUserRole";
import {
  getEffectiveThresholds, getMyThresholds, setMyThreshold,
  deleteMyThreshold, getBiomarkerRanges,
} from "@/services/api_calls";

/* ─── meta ───────────────────────────────────────────────────────── */
const BIO_META = {
  heart_rate:               { label: "Heart Rate",   unit: "bpm",   color: "#f87171" },
  blood_pressure_systolic:  { label: "BP Systolic",  unit: "mmHg",  color: "#fb923c" },
  blood_pressure_diastolic: { label: "BP Diastolic", unit: "mmHg",  color: "#fbbf24" },
  glucose:                  { label: "Glucose",      unit: "mg/dL", color: "#34d399" },
  steps:                    { label: "Steps",        unit: "steps", color: "#60a5fa" },
  sleep:                    { label: "Sleep",        unit: "hrs",   color: "#a78bfa" },
};

const ORDER = ["heart_rate","blood_pressure_systolic","blood_pressure_diastolic","glucose","steps","sleep"];

const inputCls = "w-full px-2.5 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/70 placeholder-white/20 text-xs focus:outline-none focus:border-indigo-500/50 transition-colors";

/* ─── range bar ──────────────────────────────────────────────────── */
function RangeBar({ warningLow, warningHigh, criticalLow, criticalHigh }) {
  return (
    <div className="flex h-2 rounded-full overflow-hidden gap-px" title="Critical / Warning / Normal / Warning / Critical">
      <div className="flex-1 bg-red-500/40 rounded-l-full" />
      <div className="flex-1 bg-amber-500/40" />
      <div className="flex-[2] bg-green-500/40" />
      <div className="flex-1 bg-amber-500/40" />
      <div className="flex-1 bg-red-500/40 rounded-r-full" />
    </div>
  );
}

/* ─── main ───────────────────────────────────────────────────────── */
export default function ThresholdsPage() {
  const [effective,   setEffective]   = useState([]);
  const [custom,      setCustom]      = useState([]);
  const [globalRanges, setGlobalRanges] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(null);
  const [editMode,    setEditMode]    = useState({});
  const [toast,       setToast]       = useState(null);

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 4000); };

  const loadData = async () => {
    setLoading(true);
    try {
      const [eff, cust, ranges] = await Promise.allSettled([
        getEffectiveThresholds(),
        getMyThresholds(),
        getBiomarkerRanges(),
      ]);
      if (eff.status     === "fulfilled") setEffective(Array.isArray(eff.value)     ? eff.value     : []);
      if (cust.status    === "fulfilled") setCustom(Array.isArray(cust.value)       ? cust.value    : []);
      if (ranges.status  === "fulfilled") setGlobalRanges(Array.isArray(ranges.value) ? ranges.value : []);
    } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const getEff  = (bt) => effective.find((t) => t.biomarker_type === bt) || {};
  const getCust = (bt) => custom.find((t) => t.biomarker_type === bt && t.set_by_role === "patient");
  const getGlob = (bt) => globalRanges.find((r) => r.biomarker_type === bt) || {};

  const startEdit = (bt) => {
    const eff = getEff(bt);
    setEditMode((p) => ({ ...p, [bt]: {
      warning_low:   eff.warning_low  ?? "",
      warning_high:  eff.warning_high ?? "",
      critical_low:  eff.critical_low ?? "",
      critical_high: eff.critical_high ?? "",
    }}));
  };

  const cancelEdit = (bt) => setEditMode((p) => { const n = { ...p }; delete n[bt]; return n; });
  const updateField = (bt, field, val) => setEditMode((p) => ({ ...p, [bt]: { ...p[bt], [field]: val } }));

  const handleSave = async (bt) => {
    const vals = editMode[bt];
    if (!vals) return;
    setSaving(bt);
    try {
      await setMyThreshold({
        biomarker_type: bt,
        warning_low:   vals.warning_low   === "" ? null : Number(vals.warning_low),
        warning_high:  vals.warning_high  === "" ? null : Number(vals.warning_high),
        critical_low:  vals.critical_low  === "" ? null : Number(vals.critical_low),
        critical_high: vals.critical_high === "" ? null : Number(vals.critical_high),
      });
      showToast("success", `${BIO_META[bt]?.label} thresholds saved.`);
      cancelEdit(bt);
      await loadData();
    } catch (err) { showToast("error", err.message || "Failed to save"); }
    finally { setSaving(null); }
  };

  const handleReset = async (bt) => {
    const c = getCust(bt);
    if (!c) return;
    setSaving(bt);
    try {
      await deleteMyThreshold(c.id);
      showToast("success", `${BIO_META[bt]?.label} reset to default.`);
      cancelEdit(bt);
      await loadData();
    } catch (err) { showToast("error", err.message || "Failed to reset"); }
    finally { setSaving(null); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin" />
    </div>
  );

  return (
    <RoleProtection allowedRoles={[USER_ROLES.PATIENT]}>
      <div className="max-w-4xl mx-auto pb-10 space-y-6">

        {/* Header */}
        <div>
          <h1 className="font-[family-name:var(--font-serif)] text-white text-3xl font-bold">Alert Thresholds</h1>
          <p className="text-white/40 text-sm mt-1">Customize when you receive alerts for each biomarker.</p>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`px-4 py-3 rounded-xl text-sm border ${toast.type === "success" ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
            {toast.msg}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          {ORDER.map((bt) => {
            const meta   = BIO_META[bt] || { label: bt, unit: "", color: "#818cf8" };
            const eff    = getEff(bt);
            const cust   = getCust(bt);
            const glob   = getGlob(bt);
            const isEdit = !!editMode[bt];
            const isSaving = saving === bt;

            return (
              <div key={bt} className={`rounded-2xl border p-5 space-y-4 transition-colors ${isEdit ? "border-indigo-500/20 bg-indigo-500/[0.04]" : "border-white/[0.07] bg-white/[0.03]"}`}>

                {/* Card header */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: meta.color }}>{meta.label}</p>
                    <p className="text-white/30 text-xs mt-0.5">{meta.unit}</p>
                  </div>
                  <div className="flex gap-1.5">
                    {cust && !isEdit && (
                      <button onClick={() => handleReset(bt)} disabled={isSaving}
                        className="px-2.5 py-1 rounded-lg text-white/25 hover:text-red-400 text-xs border border-white/[0.07] hover:border-red-500/20 transition-colors disabled:opacity-40">
                        Reset
                      </button>
                    )}
                    {isEdit ? (
                      <>
                        <button onClick={() => handleSave(bt)} disabled={isSaving}
                          className="px-3 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-xs font-semibold disabled:opacity-40">
                          {isSaving ? "Saving…" : "Save"}
                        </button>
                        <button onClick={() => cancelEdit(bt)}
                          className="px-3 py-1 rounded-lg bg-white/[0.04] border border-white/[0.07] text-white/40 text-xs">
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button onClick={() => startEdit(bt)}
                        className="px-3 py-1 rounded-lg bg-white/[0.04] border border-white/[0.07] text-white/40 text-xs hover:text-white/60 transition-colors">
                        Edit
                      </button>
                    )}
                  </div>
                </div>

                {/* Range bar */}
                <RangeBar {...eff} />

                {/* Source badge */}
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cust ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" : "bg-white/[0.05] border-white/[0.08] text-white/30"}`}>
                    {cust ? "Custom" : "Default"}
                  </span>
                  {glob.normal_min != null && (
                    <span className="text-white/20 text-xs">Default normal: {glob.normal_min}–{glob.normal_max} {meta.unit}</span>
                  )}
                </div>

                {/* Current values */}
                {!isEdit && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { label: "Warn Low",   val: eff.warning_low,   cls: "text-amber-400" },
                      { label: "Warn High",  val: eff.warning_high,  cls: "text-amber-400" },
                      { label: "Crit Low",   val: eff.critical_low,  cls: "text-red-400"   },
                      { label: "Crit High",  val: eff.critical_high, cls: "text-red-400"   },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between px-2.5 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                        <span className="text-white/30">{item.label}</span>
                        <span className={item.val != null ? item.cls : "text-white/20"}>{item.val ?? "—"}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Edit form */}
                {isEdit && (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { field: "warning_low",   label: "Warning Low"   },
                      { field: "warning_high",  label: "Warning High"  },
                      { field: "critical_low",  label: "Critical Low"  },
                      { field: "critical_high", label: "Critical High" },
                    ].map(({ field, label }) => (
                      <div key={field}>
                        <label className="block text-white/30 text-xs mb-1">{label}</label>
                        <input
                          type="number" step="any"
                          value={editMode[bt][field]}
                          onChange={(e) => updateField(bt, field, e.target.value)}
                          placeholder="—"
                          className={inputCls}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </RoleProtection>
  );
}

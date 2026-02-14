"use client";

import { useEffect, useState } from "react";
import RoleProtection from "@/components/RoleProtection";
import { USER_ROLES } from "@/hooks/useUserRole";
import {
  getEffectiveThresholds,
  getMyThresholds,
  setMyThreshold,
  deleteMyThreshold,
  getBiomarkerRanges,
} from "@/services/api_calls";

const BIOMARKER_META = {
  heart_rate: { label: "Heart Rate", unit: "bpm", icon: "H", gradient: "from-rose-50 to-orange-50", border: "border-rose-200", accent: "text-rose-600" },
  blood_pressure_systolic: { label: "BP Systolic", unit: "mmHg", icon: "S", gradient: "from-indigo-50 to-blue-50", border: "border-indigo-200", accent: "text-indigo-600" },
  blood_pressure_diastolic: { label: "BP Diastolic", unit: "mmHg", icon: "D", gradient: "from-indigo-50 to-blue-50", border: "border-indigo-200", accent: "text-indigo-600" },
  glucose: { label: "Glucose", unit: "mg/dL", icon: "G", gradient: "from-amber-50 to-orange-50", border: "border-amber-200", accent: "text-amber-600" },
  steps: { label: "Steps", unit: "steps", icon: "W", gradient: "from-emerald-50 to-teal-50", border: "border-emerald-200", accent: "text-emerald-600" },
  sleep: { label: "Sleep", unit: "hours", icon: "Z", gradient: "from-slate-50 to-indigo-50", border: "border-slate-200", accent: "text-slate-600" },
};

function ThresholdRangeBar({ warningLow, warningHigh, criticalLow, criticalHigh }) {
  // Visual range bar showing green/yellow/red zones
  if (!criticalLow && !criticalHigh && !warningLow && !warningHigh) {
    return <div className="h-3 bg-gray-100 rounded-full" />;
  }

  return (
    <div className="flex h-3 rounded-full overflow-hidden gap-px">
      <div className="flex-1 bg-red-400 rounded-l-full" title={`Critical Low: < ${criticalLow ?? "—"}`} />
      <div className="flex-1 bg-amber-400" title={`Warning Low: < ${warningLow ?? "—"}`} />
      <div className="flex-[2] bg-emerald-400" title="Normal / Optimal" />
      <div className="flex-1 bg-amber-400" title={`Warning High: > ${warningHigh ?? "—"}`} />
      <div className="flex-1 bg-red-400 rounded-r-full" title={`Critical High: > ${criticalHigh ?? "—"}`} />
    </div>
  );
}

export default function ThresholdsPage() {
  const [effective, setEffective] = useState([]);
  const [customThresholds, setCustomThresholds] = useState([]);
  const [globalRanges, setGlobalRanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [editMode, setEditMode] = useState({}); // {biomarker_type: {warning_low, ...}}
  const [toast, setToast] = useState(null);

  function showToast(type, message) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  async function loadData() {
    try {
      setLoading(true);
      const [eff, custom, ranges] = await Promise.all([
        getEffectiveThresholds(),
        getMyThresholds(),
        getBiomarkerRanges(),
      ]);
      setEffective(eff);
      setCustomThresholds(custom);
      setGlobalRanges(ranges);
    } catch (e) {
      console.error("Failed to load thresholds:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  function getCustomForType(bt) {
    return customThresholds.find(
      (t) => t.biomarker_type === bt && t.set_by_role === "patient"
    );
  }

  function getProviderForType(bt) {
    return customThresholds.find(
      (t) => t.biomarker_type === bt && t.set_by_role === "provider"
    );
  }

  function getEffectiveForType(bt) {
    return effective.find((t) => t.biomarker_type === bt) || {};
  }

  function getGlobalForType(bt) {
    return globalRanges.find((r) => r.biomarker_type === bt) || {};
  }

  function startEdit(bt) {
    const eff = getEffectiveForType(bt);
    setEditMode((prev) => ({
      ...prev,
      [bt]: {
        warning_low: eff.warning_low ?? "",
        warning_high: eff.warning_high ?? "",
        critical_low: eff.critical_low ?? "",
        critical_high: eff.critical_high ?? "",
      },
    }));
  }

  function cancelEdit(bt) {
    setEditMode((prev) => {
      const next = { ...prev };
      delete next[bt];
      return next;
    });
  }

  function updateEditField(bt, field, value) {
    setEditMode((prev) => ({
      ...prev,
      [bt]: { ...prev[bt], [field]: value },
    }));
  }

  async function handleSave(bt) {
    const values = editMode[bt];
    if (!values) return;

    setSaving(bt);
    try {
      await setMyThreshold({
        biomarker_type: bt,
        warning_low: values.warning_low === "" ? null : Number(values.warning_low),
        warning_high: values.warning_high === "" ? null : Number(values.warning_high),
        critical_low: values.critical_low === "" ? null : Number(values.critical_low),
        critical_high: values.critical_high === "" ? null : Number(values.critical_high),
      });
      showToast("success", `${BIOMARKER_META[bt]?.label} thresholds saved`);
      cancelEdit(bt);
      await loadData();
    } catch (e) {
      showToast("error", e.message || "Failed to save");
    } finally {
      setSaving(null);
    }
  }

  async function handleReset(bt) {
    const custom = getCustomForType(bt);
    if (!custom) return;

    setSaving(bt);
    try {
      await deleteMyThreshold(custom.id);
      showToast("success", `${BIOMARKER_META[bt]?.label} reset to default`);
      cancelEdit(bt);
      await loadData();
    } catch (e) {
      showToast("error", e.message || "Failed to reset");
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <RoleProtection allowedRoles={[USER_ROLES.PATIENT]}>
        <div className="max-w-5xl mx-auto p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="grid md:grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-48 bg-gray-100 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </RoleProtection>
    );
  }

  return (
    <RoleProtection allowedRoles={[USER_ROLES.PATIENT]}>
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Health Thresholds</h1>
          <p className="text-gray-600 text-sm mt-1">
            Customize your warning and critical thresholds for each biomarker. Provider-set thresholds take priority.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-6 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-400" />
            <span className="text-gray-600">Critical</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-amber-400" />
            <span className="text-gray-600">Warning</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-emerald-400" />
            <span className="text-gray-600">Normal</span>
          </div>
        </div>

        {/* Biomarker Cards Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {Object.entries(BIOMARKER_META).map(([bt, meta]) => {
            const eff = getEffectiveForType(bt);
            const providerSet = getProviderForType(bt);
            const patientSet = getCustomForType(bt);
            const global = getGlobalForType(bt);
            const isEditing = bt in editMode;
            const isSaving = saving === bt;

            const sourceLabel =
              eff.source === "provider"
                ? "Set by Provider"
                : eff.source === "patient"
                ? "Set by You"
                : "Default";

            const sourceBadge =
              eff.source === "provider"
                ? "bg-purple-100 text-purple-700"
                : eff.source === "patient"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600";

            return (
              <div
                key={bt}
                className={`bg-gradient-to-br ${meta.gradient} rounded-xl border ${meta.border} p-5`}
              >
                {/* Card Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg bg-white/70 flex items-center justify-center font-bold ${meta.accent}`}>
                      {meta.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{meta.label}</h3>
                      <span className="text-xs text-gray-500">{meta.unit}</span>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${sourceBadge}`}>
                    {eff.source === "provider" && (
                      <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    )}
                    {sourceLabel}
                  </span>
                </div>

                {/* Range Bar */}
                <ThresholdRangeBar
                  warningLow={eff.warning_low}
                  warningHigh={eff.warning_high}
                  criticalLow={eff.critical_low}
                  criticalHigh={eff.critical_high}
                />

                {/* Current Values */}
                {!isEditing ? (
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white/60 rounded p-2">
                      <span className="text-gray-500">Critical Low</span>
                      <p className="font-semibold text-red-600">{eff.critical_low ?? "—"}</p>
                    </div>
                    <div className="bg-white/60 rounded p-2">
                      <span className="text-gray-500">Warning Low</span>
                      <p className="font-semibold text-amber-600">{eff.warning_low ?? "—"}</p>
                    </div>
                    <div className="bg-white/60 rounded p-2">
                      <span className="text-gray-500">Warning High</span>
                      <p className="font-semibold text-amber-600">{eff.warning_high ?? "—"}</p>
                    </div>
                    <div className="bg-white/60 rounded p-2">
                      <span className="text-gray-500">Critical High</span>
                      <p className="font-semibold text-red-600">{eff.critical_high ?? "—"}</p>
                    </div>
                  </div>
                ) : (
                  /* Edit Mode */
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    {["critical_low", "warning_low", "warning_high", "critical_high"].map((field) => (
                      <div key={field} className="bg-white/80 rounded p-2">
                        <label className="text-gray-500 capitalize">{field.replace("_", " ")}</label>
                        <input
                          type="number"
                          step="any"
                          value={editMode[bt][field]}
                          onChange={(e) => updateEditField(bt, field, e.target.value)}
                          className="w-full mt-1 px-2 py-1 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                          placeholder={global[field] ?? "—"}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3">
                  {eff.source === "provider" && !isEditing ? (
                    <p className="text-xs text-purple-600 italic">
                      Provider-set thresholds cannot be edited
                    </p>
                  ) : !isEditing ? (
                    <>
                      <button
                        onClick={() => startEdit(bt)}
                        className="text-xs px-3 py-1.5 bg-white/70 hover:bg-white border border-gray-200 rounded-lg text-gray-700 font-medium transition-colors"
                      >
                        Customize
                      </button>
                      {patientSet && (
                        <button
                          onClick={() => handleReset(bt)}
                          disabled={isSaving}
                          className="text-xs px-3 py-1.5 text-gray-500 hover:text-red-600 transition-colors"
                        >
                          Reset to Default
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleSave(bt)}
                        disabled={isSaving}
                        className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {isSaving ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={() => cancelEdit(bt)}
                        className="text-xs px-3 py-1.5 text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
            <div
              className={`min-w-[300px] rounded-lg border shadow-lg p-4 ${
                toast.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-rose-50 border-rose-200 text-rose-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{toast.type === "success" ? "✓" : "✕"}</span>
                <span className="text-sm font-medium">{toast.message}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleProtection>
  );
}

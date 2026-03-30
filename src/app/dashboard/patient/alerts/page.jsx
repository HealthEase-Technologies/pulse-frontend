"use client";

import { useEffect, useState } from "react";
import RoleProtection from "@/components/RoleProtection";
import { USER_ROLES } from "@/hooks/useUserRole";
import { getAlertHistory, acknowledgeAlert } from "@/services/api_calls";

/* ─── constants ──────────────────────────────────────────────────── */
const BIO_LABELS = {
  heart_rate:               "Heart Rate",
  blood_pressure_systolic:  "BP Systolic",
  blood_pressure_diastolic: "BP Diastolic",
  glucose:                  "Glucose",
  steps:                    "Steps",
  sleep:                    "Sleep",
};

const SEVERITY_CLS = {
  critical: "bg-red-500/10 border-red-500/20 text-red-400",
  warning:  "bg-amber-500/10 border-amber-500/20 text-amber-400",
  info:     "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
};

const FILTERS = [
  { key: "all",             label: "All"             },
  { key: "critical",        label: "Critical"        },
  { key: "warning",         label: "Warning"         },
  { key: "unacknowledged",  label: "Unread"          },
];

const LIMIT = 20;

/* ─── helpers ────────────────────────────────────────────────────── */
const fmtDate = (ts) => {
  if (!ts) return "—";
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString(undefined, { month:"short", day:"numeric", year:"numeric", hour:"2-digit", minute:"2-digit" });
};

/* ─── main ───────────────────────────────────────────────────────── */
export default function AlertsPage() {
  const [alerts,       setAlerts]       = useState([]);
  const [total,        setTotal]        = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [filter,       setFilter]       = useState("all");
  const [offset,       setOffset]       = useState(0);
  const [acking,       setAcking]       = useState(null);

  const loadAlerts = async (reset = false) => {
    if (reset) setLoading(true);
    try {
      const cur  = reset ? 0 : offset;
      const params = { limit: LIMIT, offset: cur };
      if (filter === "warning")        params.alertType = "warning";
      if (filter === "critical")       params.alertType = "critical";
      if (filter === "unacknowledged") params.status    = "notified";
      const result = await getAlertHistory(params);
      if (reset) { setAlerts(result.alerts || []); setOffset(LIMIT); }
      else       { setAlerts((p) => [...p, ...(result.alerts || [])]); setOffset((p) => p + LIMIT); }
      setTotal(result.total_count || 0);
    } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => { loadAlerts(true); }, [filter]);

  const handleAck = async (id) => {
    setAcking(id);
    try {
      await acknowledgeAlert(id);
      setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, acknowledged_at: new Date().toISOString() } : a));
    } catch (_) {}
    finally { setAcking(null); }
  };

  const unread = alerts.filter((a) => !a.acknowledged_at).length;

  return (
    <RoleProtection allowedRoles={[USER_ROLES.PATIENT]}>
      <div className="max-w-3xl mx-auto pb-10 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-[family-name:var(--font-serif)] text-white text-3xl font-bold">Alerts</h1>
            <p className="text-white/40 text-sm mt-1">Your biomarker alert history.</p>
          </div>
          {unread > 0 && (
            <span className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
              {unread} unread
            </span>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${filter === f.key ? "bg-indigo-500/15 border-indigo-500/25 text-indigo-300" : "bg-white/[0.03] border-white/[0.07] text-white/40 hover:text-white/60"}`}>
              {f.label}
            </button>
          ))}
          <span className="ml-auto text-white/25 text-xs self-center">{total} total</span>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-white/[0.03] border border-white/[0.05] animate-pulse" />)}
          </div>
        ) : alerts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/[0.1] p-8 text-center text-white/25 text-sm">
            No alerts found.
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((a) => {
              const sev = a.alert_type || (a.value > (a.threshold_max ?? Infinity) ? "critical" : "warning");
              return (
                <div key={a.id} className={`rounded-2xl border p-4 ${a.acknowledged_at ? "border-white/[0.07] bg-white/[0.02]" : "border-white/12 bg-white/[0.04]"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${a.acknowledged_at ? "bg-white/15" : "bg-red-400"}`} />
                      <div>
                        <p className="text-white/70 text-sm font-medium">
                          {BIO_LABELS[a.biomarker_type] || a.biomarker_type || "Alert"}
                          {a.value != null && <span className="text-white/40 font-normal"> — {a.value} {a.unit || ""}</span>}
                        </p>
                        <p className="text-white/40 text-xs mt-0.5 leading-snug">{a.message || "Threshold exceeded."}</p>
                        <p className="text-white/25 text-xs mt-1">{fmtDate(a.triggered_at || a.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${SEVERITY_CLS[sev] || SEVERITY_CLS.warning}`}>
                        {sev?.charAt(0).toUpperCase() + sev?.slice(1) || "Alert"}
                      </span>
                      {!a.acknowledged_at && (
                        <button onClick={() => handleAck(a.id)} disabled={acking === a.id}
                          className="px-3 py-1 rounded-lg text-xs bg-white/[0.05] border border-white/[0.09] text-white/40 hover:text-white/60 transition-colors disabled:opacity-40">
                          {acking === a.id ? "…" : "Dismiss"}
                        </button>
                      )}
                      {a.acknowledged_at && (
                        <span className="text-white/20 text-xs">Dismissed</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load more */}
        {!loading && alerts.length < total && (
          <div className="flex justify-center">
            <button onClick={() => loadAlerts(false)}
              className="px-6 py-2 rounded-xl bg-white/[0.04] border border-white/[0.07] text-white/40 text-sm hover:bg-white/[0.07] hover:text-white/60 transition-colors">
              Load more
            </button>
          </div>
        )}
      </div>
    </RoleProtection>
  );
}

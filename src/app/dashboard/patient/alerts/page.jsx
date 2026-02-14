"use client";

import { useEffect, useState } from "react";
import RoleProtection from "@/components/RoleProtection";
import { USER_ROLES } from "@/hooks/useUserRole";
import { getAlertHistory, acknowledgeAlert } from "@/services/api_calls";

const BIOMARKER_LABELS = {
  heart_rate: "Heart Rate",
  blood_pressure_systolic: "BP Systolic",
  blood_pressure_diastolic: "BP Diastolic",
  glucose: "Glucose",
  steps: "Steps",
  sleep: "Sleep",
};

const BIOMARKER_ICONS = {
  heart_rate: "H",
  blood_pressure_systolic: "S",
  blood_pressure_diastolic: "D",
  glucose: "G",
  steps: "W",
  sleep: "Z",
};

function formatDate(dateString) {
  if (!dateString) return "—";
  const d = new Date(dateString);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, warning, critical, unacknowledged
  const [offset, setOffset] = useState(0);
  const [acknowledging, setAcknowledging] = useState(null);
  const LIMIT = 20;

  async function loadAlerts(reset = false) {
    try {
      if (reset) setLoading(true);
      const currentOffset = reset ? 0 : offset;

      const params = { limit: LIMIT, offset: currentOffset };
      if (filter === "warning") params.alertType = "warning";
      if (filter === "critical") params.alertType = "critical";
      if (filter === "unacknowledged") params.status = "notified";

      const result = await getAlertHistory(params);

      if (reset) {
        setAlerts(result.alerts || []);
        setOffset(LIMIT);
      } else {
        setAlerts((prev) => [...prev, ...(result.alerts || [])]);
        setOffset((prev) => prev + LIMIT);
      }
      setTotalCount(result.total_count || 0);
    } catch (e) {
      console.error("Failed to load alerts:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAlerts(true);
  }, [filter]);

  async function handleAcknowledge(alertId) {
    setAcknowledging(alertId);
    try {
      await acknowledgeAlert(alertId);
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alertId
            ? { ...a, status: "acknowledged", acknowledged_at: new Date().toISOString() }
            : a
        )
      );
    } catch (e) {
      console.error("Failed to acknowledge:", e);
    } finally {
      setAcknowledging(null);
    }
  }

  const filters = [
    { key: "all", label: "All Alerts" },
    { key: "critical", label: "Critical" },
    { key: "warning", label: "Warning" },
    { key: "unacknowledged", label: "Unacknowledged" },
  ];

  return (
    <RoleProtection allowedRoles={[USER_ROLES.PATIENT]}>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Alert History</h1>
          <p className="text-gray-600 text-sm mt-1">
            View all health alerts triggered by your biomarker readings.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === f.key
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-gray-100 rounded-xl p-6">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : alerts.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
            <div className="text-4xl mb-3">
              {filter === "all" ? "🔔" : filter === "critical" ? "🚨" : "⚠️"}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">No alerts found</h3>
            <p className="text-gray-500 text-sm mt-1">
              {filter === "all"
                ? "No health alerts have been triggered yet."
                : `No ${filter} alerts found.`}
            </p>
          </div>
        ) : (
          /* Alert List */
          <div className="space-y-3">
            {alerts.map((alert) => {
              const isCritical = alert.alert_type === "critical";
              const isAcknowledged = alert.status === "acknowledged" || alert.status === "resolved";
              const isUnread = alert.status === "triggered" || alert.status === "notified";

              return (
                <div
                  key={alert.id}
                  className={`rounded-xl border p-5 transition-all ${
                    isCritical
                      ? isUnread
                        ? "bg-red-50 border-red-300 shadow-sm"
                        : "bg-red-50/50 border-red-200"
                      : isUnread
                      ? "bg-amber-50 border-amber-300 shadow-sm"
                      : "bg-amber-50/50 border-amber-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      {/* Icon */}
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                          isCritical
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {BIOMARKER_ICONS[alert.biomarker_type] || "?"}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Title */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                              isCritical
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {isCritical ? "CRITICAL" : "WARNING"}
                          </span>
                          <h3 className="font-semibold text-gray-900">
                            {BIOMARKER_LABELS[alert.biomarker_type] || alert.biomarker_type}
                          </h3>
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                          )}
                        </div>

                        {/* Details */}
                        <p className="text-sm text-gray-700 mt-1">
                          Reading of{" "}
                          <strong>
                            {alert.value} {alert.unit}
                          </strong>{" "}
                          is {alert.alert_direction === "high" ? "above" : "below"} the{" "}
                          {alert.alert_type} threshold of{" "}
                          <strong>
                            {alert.threshold_value} {alert.unit}
                          </strong>
                        </p>

                        {/* Meta */}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 flex-wrap">
                          <span>{formatDate(alert.created_at)}</span>
                          <span className="capitalize">Source: {alert.threshold_source}</span>
                          {alert.notification_channels?.length > 0 && (
                            <span>
                              Notified via: {alert.notification_channels.join(", ")}
                            </span>
                          )}
                          {isAcknowledged && (
                            <span className="text-green-600 font-medium">
                              Acknowledged {alert.acknowledged_at ? formatDate(alert.acknowledged_at) : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Acknowledge Button */}
                    {isUnread && (
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        disabled={acknowledging === alert.id}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          acknowledging === alert.id
                            ? "bg-gray-100 text-gray-400"
                            : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {acknowledging === alert.id ? "..." : "Acknowledge"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Load More */}
            {alerts.length < totalCount && (
              <button
                onClick={() => loadAlerts(false)}
                className="w-full py-3 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-xl border border-blue-200 transition-colors"
              >
                Load More ({alerts.length} of {totalCount})
              </button>
            )}
          </div>
        )}
      </div>
    </RoleProtection>
  );
}

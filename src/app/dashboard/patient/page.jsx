"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, checkOnboardingStatus, getBiomarkerDashboard, getAllBiomarkers, getBiomarkerHistory } from "@/services/api_calls";
import RoleProtection from "@/components/RoleProtection";
import { USER_ROLES } from "@/hooks/useUserRole";

export default function PatientDashboard() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [biomarkers, setBiomarkers] = useState([]);
  const [biomarkersLoading, setBiomarkersLoading] = useState(false);
  const [biomarkersError, setBiomarkersError] = useState(null);
  const [fallbackUsed, setFallbackUsed] = useState(false);
  const [order, setOrder] = useState([]);
  const [ordering, setOrdering] = useState(false);
  const [graphModal, setGraphModal] = useState({ open: false, biomarkerType: null, unit: null, data: [], loading: false, error: null });

  useEffect(() => {
    checkOnboardingAndLoadInfo();
  }, []);

  useEffect(() => {
    loadBiomarkerSummary();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("biomarkerSummaryOrder");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setOrder(parsed);
      } catch (e) {
        console.warn("Failed to parse biomarker order", e);
      }
    }
  }, []);

  const checkOnboardingAndLoadInfo = async () => {
    try {
      // Check onboarding status first
      const onboardingStatus = await checkOnboardingStatus();

      // If onboarding not completed, redirect to onboarding page
      if (!onboardingStatus.completed) {
        router.push("/dashboard/patient/onboarding");
        return;
      }

      // Load user info if onboarding is complete
      const user = await getCurrentUser();
      setUserInfo(user);
    } catch (err) {
      console.error("Failed to load user info:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadBiomarkerSummary = async () => {
    try {
      setBiomarkersLoading(true);
      setBiomarkersError(null);
      setFallbackUsed(false);

      const data = await getBiomarkerDashboard();
      let items = Array.isArray(data) ? data : [];

      // Fallback to most recent values across all time if no data in last 24h
      if (items.length === 0) {
        const all = await getAllBiomarkers({ limit: 500 });
        const list = Array.isArray(all) ? all : [];
        const latestByType = new Map();

        list.forEach((rec) => {
          const key = rec.biomarker_type;
          if (!key) return;
          const ts = new Date(rec.recorded_at || 0).getTime();
          const prev = latestByType.get(key);
          if (!prev || ts > prev.ts) {
            latestByType.set(key, { ...rec, ts });
          }
        });

        items = Array.from(latestByType.values());
        if (items.length > 0) {
          setFallbackUsed(true);
        }
      }

      const mergedOrder = mergeOrder(order, items);
      const orderedItems = applyOrdering(items, mergedOrder);
      const enriched = orderedItems.map((it) => ({ ...it, status: it?.status || computeStatus(it) }));
      setOrder(mergedOrder);
      persistOrder(mergedOrder);
      setBiomarkers(enriched);
    } catch (err) {
      setBiomarkersError(err?.message || "Failed to load biomarker summary");
    } finally {
      setBiomarkersLoading(false);
    }
  };

  const moveCard = (type, delta) => {
    setOrder((prev) => {
      const idx = prev.indexOf(type);
      if (idx === -1) return prev;
      const target = idx + delta;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      persistOrder(next);
      setBiomarkers((current) => applyOrdering(current, next));
      return next;
    });
  };

  const openGraphModal = async (type) => {
    setGraphModal({ open: true, biomarkerType: type, unit: null, data: [], loading: true, error: null });
    try {
      const raw = await getBiomarkerHistory(type, { limit: 300 });
      const list = Array.isArray(raw) ? raw : [];
      const unit = list.find((r) => r?.unit)?.unit || null;
      const cutoff = Date.now() - 3 * 24 * 60 * 60 * 1000;
      const recent = list
        .filter((r) => {
          const ts = new Date(r.recorded_at || 0).getTime();
          return Number.isFinite(ts) && ts >= cutoff;
        })
        .sort((a, b) => new Date(a.recorded_at || 0) - new Date(b.recorded_at || 0));
      setGraphModal({ open: true, biomarkerType: type, unit, data: recent, loading: false, error: null });
    } catch (err) {
      setGraphModal({ open: true, biomarkerType: type, unit: null, data: [], loading: false, error: err?.message || "Failed to load graph data" });
    }
  };

  const closeGraphModal = () => setGraphModal({ open: false, biomarkerType: null, unit: null, data: [], loading: false, error: null });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <RoleProtection allowedRoles={[USER_ROLES.PATIENT]}>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Patient Dashboard</h1>
        <p className="text-gray-600 mb-8">Welcome, {userInfo?.full_name}</p>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Biomarker summary</h2>
              <p className="text-gray-600 text-sm">
                One most recent value per biomarker type (prefers last 24h).
                {fallbackUsed && " Showing latest available because none were found in the last 24h."}
                {ordering && " Ordering mode: use the arrows to move cards, then click Order again to finish."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOrdering((v) => !v)}
                className={`rounded-lg border px-3 py-2 text-sm font-semibold shadow-sm ${
                  ordering
                    ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {ordering ? "Done" : "Order"}
              </button>
              <button
                onClick={loadBiomarkerSummary}
                disabled={biomarkersLoading}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-60"
              >
                Refresh
              </button>
            </div>
          </div>

          {biomarkersError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 mb-4">
              {biomarkersError}
            </div>
          )}

          {biomarkersLoading ? (
            <div className="flex items-center justify-center py-10 text-gray-600 text-sm">Loading summary...</div>
          ) : biomarkers.length === 0 ? (
            <div className="flex items-center justify-center py-10 text-gray-600 text-sm">No biomarker data in the last 24 hours.</div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {biomarkers.map((b, idx) => (
                <div
                  key={b.biomarker_type}
                  className={`rounded-xl border px-5 py-4 flex flex-col gap-3 bg-gradient-to-br ${metaFor(b).bg} ${metaFor(b).border} shadow-sm`}
                >
                  <div className="flex items-start justify-between text-base text-gray-700">
                    <span className="inline-flex items-center gap-2.5 font-semibold text-gray-900">
                      <BiomarkerIcon type={b.biomarker_type} className={metaFor(b).iconColor} />
                      {formatLabel(b.biomarker_type)}
                    </span>
                    {ordering && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveCard(b.biomarker_type, -1)}
                          disabled={idx === 0}
                          className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 hover:text-gray-700 disabled:opacity-40"
                          aria-label="Move up"
                          title="Move up"
                        >
                          <ArrowUpIcon />
                        </button>
                        <button
                          onClick={() => moveCard(b.biomarker_type, 1)}
                          disabled={idx === biomarkers.length - 1}
                          className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 hover:text-gray-700 disabled:opacity-40"
                          aria-label="Move down"
                          title="Move down"
                        >
                          <ArrowDownIcon />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-semibold text-gray-900">
                        {b.value !== undefined && b.value !== null
                          ? b.biomarker_type === "steps"
                            ? Math.round(Number(b.value))
                            : b.value
                          : "--"}
                      </span>
                      {b.unit && <span className="text-sm text-gray-700">{b.unit}</span>}
                    </div>
                    <span className="text-sm text-gray-600 whitespace-nowrap">{formatTime(b.recorded_at)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      {b.status && <StatusBadge status={b.status} />}
                      {b.source && <span>Source: {formatLabel(b.source)}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openGraphModal(b.biomarker_type)}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-sm hover:bg-gray-50"
                      >
                        View 3-day graph
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <GraphModal
        open={graphModal.open}
        biomarkerType={graphModal.biomarkerType}
        unit={graphModal.unit}
        data={graphModal.data}
        loading={graphModal.loading}
        error={graphModal.error}
        onClose={closeGraphModal}
      />
    </RoleProtection>
  );
}

function GraphModal({ open, biomarkerType, unit, data, loading, error, onClose }) {
  if (!open) return null;

  const label = formatLabel(biomarkerType);
  const style = (() => {
    const key = String(biomarkerType || "").toLowerCase();
    if (key === "steps" || key === "sleep") {
      return { showBars: true, showLine: false, showScatter: false };
    }
    if (key === "heart_rate") {
      return { showBars: false, showLine: true, showScatter: true };
    }
    if (key === "blood_pressure_systolic" || key === "blood_pressure_diastolic") {
      // Back to line charts with points
      return { showBars: false, showLine: true, showScatter: true };
    }
    // Default: line + bars + points
    return { showBars: true, showLine: true, showScatter: true };
  })();
  const key = String(biomarkerType || "").toLowerCase();
  const parsed = data
    .map((d) => ({
      ts: new Date(d.recorded_at || 0).getTime(),
      value: key === "steps" ? Math.round(Number(d.value)) : Number(d.value),
    }))
    .filter((d) => Number.isFinite(d.ts) && Number.isFinite(d.value));

  // Aggregate daily for bar-only charts to avoid overlapping timestamps on the same day.
  const bars =
    style.showBars && !style.showLine
      ? Array.from(
          parsed
            .reduce((map, item) => {
              const dayKey = new Date(item.ts).toDateString();
              const entry = map.get(dayKey) || { ts: new Date(dayKey).getTime(), value: 0 };
              entry.value += item.value;
              map.set(dayKey, entry);
              return map;
            }, new Map())
            .values()
        ).sort((a, b) => a.ts - b.ts)
      : parsed;

  const xSeries = style.showBars && !style.showLine ? bars : parsed;
  const ySeries = style.showBars && !style.showLine ? bars : parsed;

  const width = 520;
  const height = 260;
  const pad = 36;
  const xs = xSeries.map((p) => p.ts);
  const ys = ySeries.map((p) => p.value);
  const xMin = xs.length ? Math.min(...xs) : 0;
  const xMax = xs.length ? Math.max(...xs) : 1;
  const rawMin = ys.length ? Math.min(...ys) : 0;
  const rawMax = ys.length ? Math.max(...ys) : 0;
  const yMin = style.showBars ? Math.min(0, rawMin) : rawMin;
  const yMax = rawMax;
  const headroom = style.showBars ? (yMax - yMin > 0 ? (yMax - yMin) * 0.1 : 1) : 0;
  const yMaxAdj = yMax + headroom;
  const scaleX = (v) => pad + ((v - xMin) / (xMax - xMin || 1)) * (width - pad * 2);
  const scaleY = (v) => height - pad - ((v - yMin) / (yMaxAdj - yMin || 1)) * (height - pad * 2);
  const baseLineY = scaleY(style.showBars ? 0 : yMin);

  const xPositions = bars.map((p) => scaleX(p.ts)).sort((a, b) => a - b);
  const spacing = (width - pad * 2) / Math.max(bars.length, 1);
  const minDelta = xPositions.length > 1 ? Math.min(...xPositions.slice(1).map((x, i) => x - xPositions[i])) : spacing;
  const barW = Math.max(14, Math.min(36, Math.min(spacing * 0.6, (minDelta || spacing) * 0.8)));

  const linePath = parsed
    .map((p, idx) => `${idx === 0 ? "M" : "L"}${scaleX(p.ts)},${scaleY(p.value)}`)
    .join(" ");

  const areaPath =
    style.showLine && parsed.length > 0
      ? [
          `M${scaleX(parsed[0].ts)},${baseLineY}`,
          ...parsed.map((p) => `L${scaleX(p.ts)},${scaleY(p.value)}`),
          `L${scaleX(parsed[parsed.length - 1].ts)},${baseLineY}`,
          "Z",
        ].join(" ")
      : "";

  const formatDateTick = (ts) => {
    const d = new Date(ts);
    return Number.isNaN(d.getTime())
      ? ""
      : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const xTicks = parsed.length >= 2 ? [xMin, (xMin + xMax) / 2, xMax] : [xMin];
  const yTicks = parsed.length ? [yMin, (yMin + yMaxAdj) / 2, yMaxAdj] : [0];

  const yLabel = unit ? `Values (${unit})` : "Values";
  const xLabel = "Date";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{label} — last 3 days</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>

        {loading && <div className="flex h-48 items-center justify-center text-gray-600 text-sm">Loading graph…</div>}
        {error && !loading && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
        )}
        {!loading && !error && parsed.length === 0 && (
          <div className="flex h-48 items-center justify-center text-gray-600 text-sm">No data in the last 3 days.</div>
        )}

        {!loading && !error && parsed.length > 0 && (
          <div className="space-y-2">
            <div className="relative overflow-hidden rounded-xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-indigo-50 shadow-sm">
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[260px]">
                <defs>
                  <linearGradient id="barFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity="0.4" />
                  </linearGradient>
                  <linearGradient id="lineArea" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.05" />
                  </linearGradient>
                </defs>
                {/* grid background */}
                {yTicks.map((t, idx) => (
                  <line
                    key={`grid-y-${idx}`}
                    x1={pad}
                    x2={width - pad}
                    y1={scaleY(t)}
                    y2={scaleY(t)}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                    strokeDasharray="3 4"
                  />
                ))}
                {xTicks.map((t, idx) => (
                  <line
                    key={`grid-x-${idx}`}
                    x1={scaleX(t)}
                    x2={scaleX(t)}
                    y1={pad}
                    y2={height - pad}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                    strokeDasharray="3 4"
                  />
                ))}

                {/* axes */}
                <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#d1d5db" strokeWidth="1" />
                <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="#d1d5db" strokeWidth="1" />

                {/* axis ticks and labels */}
                {xTicks.map((t, idx) => (
                  <g key={`xt-${idx}`}>
                    <line x1={scaleX(t)} x2={scaleX(t)} y1={height - pad} y2={height - pad + 6} stroke="#9ca3af" strokeWidth="1" />
                    <text x={scaleX(t)} y={height - pad + 18} textAnchor="middle" fontSize="10" fill="#4b5563">
                      {formatDateTick(t)}
                    </text>
                  </g>
                ))}
                {yTicks.map((t, idx) => (
                  <g key={`yt-${idx}`}>
                    <line x1={pad - 6} x2={pad} y1={scaleY(t)} y2={scaleY(t)} stroke="#9ca3af" strokeWidth="1" />
                    <text x={pad - 10} y={scaleY(t) + 4} textAnchor="end" fontSize="10" fill="#4b5563">
                      {key === "steps" ? Math.round(t) : t.toFixed(1)}
                    </text>
                  </g>
                ))}

                <text x={width / 2} y={height - 4} textAnchor="middle" fontSize="11" fill="#0f172a" fontWeight="600">
                  {xLabel}
                </text>
                <text
                  x={4}
                  y={height / 2}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#0f172a"
                  fontWeight="600"
                  transform={`rotate(-90 4 ${height / 2})`}
                >
                  {yLabel}
                </text>

                {/* bars */}
                {style.showBars &&
                  bars.map((p, idx) => {
                    const x = scaleX(p.ts);
                    const yVal = scaleY(p.value);
                    const topY = Math.min(baseLineY, yVal);
                    const h = Math.max(2, Math.abs(baseLineY - yVal));
                    return (
                      <rect
                        key={`bar-${idx}`}
                        x={x - barW / 2}
                        y={topY}
                        width={barW}
                        height={h}
                        fill="url(#barFill)"
                        rx={Math.min(10, barW / 2)}
                      />
                    );
                  })}

                {/* line area & stroke */}
                {style.showLine && areaPath && (
                  <path d={areaPath} fill="url(#lineArea)" stroke="none" opacity="0.85" />
                )}
                {style.showLine && (
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                )}

                {/* dots / scatter points */}
                {(style.showLine || style.showScatter) &&
                  parsed.map((p, idx) => (
                    <circle key={`dot-${idx}`} cx={scaleX(p.ts)} cy={scaleY(p.value)} r="3" fill="#1d4ed8" />
                  ))}
              </svg>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
              <Stat label="Samples" value={parsed.length} />
              <Stat label="Min" value={key === "steps" ? Math.round(rawMin) : rawMin.toFixed(2)} />
              <Stat label="Max" value={key === "steps" ? Math.round(rawMax) : rawMax.toFixed(2)} />
              <Stat label="Range" value={key === "steps" ? Math.round(rawMax - rawMin) : (rawMax - rawMin).toFixed(2)} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 flex items-center justify-between">
      <span className="text-xs uppercase tracking-wide text-gray-500">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}

function formatLabel(value) {
  return String(value || "")
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatTime(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

function mergeOrder(existingOrder, items) {
  const next = Array.isArray(existingOrder) ? [...existingOrder] : [];
  items.forEach((i) => {
    if (i?.biomarker_type && !next.includes(i.biomarker_type)) {
      next.push(i.biomarker_type);
    }
  });
  return next;
}

function applyOrdering(items, ord) {
  const orderMap = new Map();
  ord.forEach((t, idx) => orderMap.set(t, idx));
  return [...items].sort((a, b) => {
    const ia = orderMap.has(a.biomarker_type) ? orderMap.get(a.biomarker_type) : Number.MAX_SAFE_INTEGER;
    const ib = orderMap.has(b.biomarker_type) ? orderMap.get(b.biomarker_type) : Number.MAX_SAFE_INTEGER;
    return ia - ib;
  });
}

function persistOrder(ord) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem("biomarkerSummaryOrder", JSON.stringify(ord));
  } catch (e) {
    console.warn("Failed to persist biomarker order", e);
  }
}

const META = {
  heart_rate: { bg: "from-rose-50 to-orange-50", border: "border-rose-200", iconColor: "text-rose-600" },
  blood_pressure_systolic: { bg: "from-indigo-50 to-blue-50", border: "border-indigo-200", iconColor: "text-indigo-600" },
  blood_pressure_diastolic: { bg: "from-indigo-50 to-blue-50", border: "border-indigo-200", iconColor: "text-indigo-600" },
  glucose: { bg: "from-amber-50 to-amber-100", border: "border-amber-200", iconColor: "text-amber-600" },
  steps: { bg: "from-emerald-50 to-teal-50", border: "border-emerald-200", iconColor: "text-emerald-600" },
  sleep: { bg: "from-slate-50 to-slate-100", border: "border-slate-200", iconColor: "text-slate-600" },
};

function metaFor(item) {
  return META[item?.biomarker_type] || { bg: "from-gray-50 to-gray-100", border: "border-gray-200", iconColor: "text-gray-500" };
}

function computeStatus(item) {
  const type = String(item?.biomarker_type || "").toLowerCase();
  const val = Number(item?.value);
  if (!Number.isFinite(val)) return undefined;

  const ranges = {
    heart_rate: { optimal: [60, 80], normal: [60, 100], criticalLow: 40, criticalHigh: 120 },
    blood_pressure_systolic: { optimal: [90, 120], normal: [90, 140], criticalLow: 70, criticalHigh: 180 },
    blood_pressure_diastolic: { optimal: [60, 80], normal: [60, 90], criticalLow: 40, criticalHigh: 120 },
    glucose: { optimal: [70, 100], normal: [70, 140], criticalLow: 54, criticalHigh: 200 },
    sleep: { optimal: [7, 9], normal: [6, 10], criticalLow: 4, criticalHigh: 14 },
    steps: { optimal: [7000, 10000], normal: [5000, 15000], criticalLow: 0, criticalHigh: 50000 },
  };

  const r = ranges[type];
  if (!r) return undefined;

  if (val < r.criticalLow) return "critical_low";
  if (val > r.criticalHigh) return "critical_high";
  if (val >= r.optimal[0] && val <= r.optimal[1]) return "optimal";
  if (val >= r.normal[0] && val <= r.normal[1]) return "normal";
  return "unknown";
}

function statusMeta(status) {
  const key = String(status || "").toLowerCase();
  const map = {
    optimal: { label: "Optimal", bg: "bg-emerald-50", text: "text-emerald-700", border: "border border-emerald-200" },
    normal: { label: "Normal", bg: "bg-blue-50", text: "text-blue-700", border: "border border-blue-200" },
    critical: { label: "Critical", bg: "bg-red-50", text: "text-red-700", border: "border border-red-200" },
    critical_low: { label: "Critical Low", bg: "bg-red-50", text: "text-red-700", border: "border border-red-200" },
    critical_high: { label: "Critical High", bg: "bg-red-50", text: "text-red-700", border: "border border-red-200" },
    warning: { label: "Warning", bg: "bg-amber-50", text: "text-amber-700", border: "border border-amber-200" },
  };
  return map[key] || { label: "Unknown", bg: "bg-gray-100", text: "text-gray-700", border: "border border-gray-200" };
}

function StatusBadge({ status }) {
  const meta = statusMeta(status);
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.bg} ${meta.text} ${meta.border}`}>{meta.label}</span>;
}

function ArrowUpIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path fillRule="evenodd" d="M10 3.5a.75.75 0 0 1 .53.22l5 5a.75.75 0 1 1-1.06 1.06L10.75 6.56v9.69a.75.75 0 0 1-1.5 0V6.56l-3.72 3.22a.75.75 0 1 1-1.06-1.06l5-5A.75.75 0 0 1 10 3.5" clipRule="evenodd" />
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path fillRule="evenodd" d="M10 16.5a.75.75 0 0 1-.53-.22l-5-5a.75.75 0 0 1 1.06-1.06l3.72 3.22V3.75a.75.75 0 0 1 1.5 0v9.69l3.72-3.22a.75.75 0 0 1 1.06 1.06l-5 5a.75.75 0 0 1-.53.22" clipRule="evenodd" />
    </svg>
  );
}

function BiomarkerIcon({ type, className = "" }) {
  const key = String(type || "").toLowerCase();
  const cls = `h-5 w-5 ${className}`;

  if (key.includes("heart")) {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={cls}>
        <path
          fill="currentColor"
          d="M12 21s-6.5-4.35-9.14-8.38C.6 9.87 1.4 6.3 4 4.65a4.7 4.7 0 0 1 5.6.7L12 7l2.4-1.65A4.7 4.7 0 0 1 20 4.65c2.6 1.65 3.4 5.22 1.14 7.97C18.5 16.65 12 21 12 21z"
        />
      </svg>
    );
  }
  if (key.includes("blood_pressure")) {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={cls}>
        <path
          fill="currentColor"
          d="M12 3a9 9 0 1 0 9 9 9 9 0 0 0-9-9m0 1.5a7.5 7.5 0 1 1-7.5 7.5A7.5 7.5 0 0 1 12 4.5m3.54 9.15-2.72-2.72a1.75 1.75 0 1 0-2.47 2.47l2.72 2.72a5.25 5.25 0 1 1 2.47-2.47"
        />
      </svg>
    );
  }
  if (key.includes("glucose")) {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={cls}>
        <path
          fill="currentColor"
          d="M12 3.5 7 9.44a6 6 0 1 0 10 0zm0 9.75a.75.75 0 0 1-.75-.75V10a.75.75 0 0 1 1.5 0v2.5A.75.75 0 0 1 12 13.25m0 2a.75.75 0 1 1 .75-.75.75.75 0 0 1-.75.75"
        />
      </svg>
    );
  }
  if (key.includes("steps")) {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={cls}>
        <path
          fill="currentColor"
          d="M8.5 3.75a2.75 2.75 0 0 1 2.7 2.22l.21 1.03a2.75 2.75 0 0 1-2.32 3.27l-2.13.34a2.75 2.75 0 0 1-3.07-2l-.21-1.04A2.75 2.75 0 0 1 5.5 3.75zm8.96 5.44a2.25 2.25 0 0 1 2.64 1.66l.53 2.22a2.25 2.25 0 0 1-1.78 2.73l-4.58.93a2.25 2.25 0 0 1-2.64-1.66l-.53-2.22a2.25 2.25 0 0 1 1.78-2.73z"
        />
      </svg>
    );
  }
  if (key.includes("sleep")) {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={cls}>
        <path
          fill="currentColor"
          d="M14 3a8 8 0 0 0 0 16 8 8 0 0 0 5.66-2.34.5.5 0 0 0-.48-.84 6 6 0 0 1-6.71-9.68.5.5 0 0 0-.47-.84A8 8 0 0 0 14 3"
        />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={cls}>
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}
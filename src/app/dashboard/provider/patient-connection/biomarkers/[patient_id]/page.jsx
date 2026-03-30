"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPatientHistoryForProvider } from "@/services/api_calls";

const TYPE_META = {
  heart_rate:               { label: "Heart Rate",                   unit: "bpm"   },
  blood_pressure_systolic:  { label: "Blood Pressure (Systolic)",    unit: "mmHg"  },
  blood_pressure_diastolic: { label: "Blood Pressure (Diastolic)",   unit: "mmHg"  },
  glucose:                  { label: "Glucose",                      unit: "mg/dL" },
  steps:                    { label: "Steps",                        unit: "steps" },
  sleep:                    { label: "Sleep",                        unit: "hours" },
};

const ORDER = ["heart_rate", "blood_pressure_systolic", "blood_pressure_diastolic", "glucose", "steps", "sleep"];

const inputCls = "px-2 py-1 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/60 text-xs focus:outline-none focus:border-indigo-500/50 transition-colors";

export default function ProviderPatientBiomarkersPage() {
  const { patient_id: patientId } = useParams();
  const router = useRouter();

  const [historyModal,   setHistoryModal]   = useState({ open: false, type: null });
  const [historyData,    setHistoryData]    = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError,   setHistoryError]   = useState("");
  const [historyMode,    setHistoryMode]    = useState("list");
  const [rangeFrom,      setRangeFrom]      = useState("");
  const [rangeTo,        setRangeTo]        = useState("");

  const openHistory = async (type) => {
    setHistoryModal({ open: true, type });
    setHistoryMode("list"); setRangeFrom(""); setRangeTo("");
    try {
      setHistoryLoading(true); setHistoryError("");
      const raw  = await getPatientHistoryForProvider(patientId, type, { limit: 200 });
      const list = Array.isArray(raw) ? raw : [];
      list.sort((a, b) => new Date(a.recorded_at || 0) - new Date(b.recorded_at || 0));
      setHistoryData(list);
    } catch (err) {
      setHistoryError(err?.message || "Failed to load history");
      setHistoryData([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const filteredHistory = useMemo(() => {
    return historyData.filter((row) => {
      if (!rangeFrom && !rangeTo) return true;
      if (!row.recorded_at) return false;
      const d = new Date(row.recorded_at);
      if (Number.isNaN(d.getTime())) return false;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (rangeFrom && key < rangeFrom) return false;
      if (rangeTo   && key > rangeTo)   return false;
      return true;
    });
  }, [historyData, rangeFrom, rangeTo]);

  const chartPath = useMemo(() => {
    if (historyMode !== "graph" || !filteredHistory.length) return null;
    const points = filteredHistory
      .map((row) => ({ x: new Date(row.recorded_at || 0).getTime(), y: Number(row.value) }))
      .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
      .sort((a, b) => a.x - b.x);
    if (!points.length) return null;
    const W = 420, H = 200, pad = 28;
    const xs = points.map((p) => p.x), ys = points.map((p) => p.y);
    const xMin = Math.min(...xs), xMax = Math.max(...xs);
    let yMin = Math.min(...ys), yMax = Math.max(...ys);
    if (yMin === yMax) { yMin -= 1; yMax += 1; } else { const s = yMax - yMin; yMin -= s * 0.05; yMax += s * 0.05; }
    const scaleX = (v) => pad + ((v - xMin) / (xMax - xMin || 1)) * (W - pad * 2);
    const scaleY = (v) => H - pad - ((v - yMin) / (yMax - yMin || 1)) * (H - pad * 2);
    const path   = points.map((p, i) => `${i === 0 ? "M" : "L"}${scaleX(p.x)},${scaleY(p.y)}`).join(" ");
    return {
      W, H, d: path,
      points: points.map((p) => ({ x: scaleX(p.x), y: scaleY(p.y) })),
      xTicks: points.length >= 2 ? [xMin, (xMin + xMax) / 2, xMax] : [xMin],
      yTicks: [yMin, (yMin + yMax) / 2, yMax],
      scaleX, scaleY,
      yLabel: TYPE_META[historyModal.type]?.unit || "",
    };
  }, [filteredHistory, historyMode, historyModal.type]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-1">Provider</p>
          <h1 className="font-[family-name:var(--font-serif)] text-white text-3xl font-bold">Biomarker History</h1>
          <p className="text-white/40 text-sm mt-1">Choose a biomarker to review historical readings.</p>
        </div>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.07] text-white/40 text-sm font-medium hover:bg-white/[0.07] hover:text-white/60 transition-colors"
        >
          Back
        </button>
      </div>

      {/* Biomarker grid */}
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ORDER.map((key) => {
            const meta = TYPE_META[key];
            const isOpen = historyModal.open && historyModal.type === key;
            return (
              <div key={key} className={`rounded-xl border p-4 flex flex-col gap-3 transition-colors ${isOpen ? "border-indigo-500/25 bg-indigo-500/[0.07]" : "border-white/[0.07] bg-white/[0.03]"}`}>
                <p className="text-white/40 text-xs uppercase tracking-widest">{meta.label}</p>
                <button
                  type="button"
                  onClick={() => openHistory(key)}
                  className="py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold hover:bg-indigo-500/20 transition-colors"
                >
                  View history
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* History panel */}
      {historyModal.open && (
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 space-y-4">

          {/* Panel header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-white/25 text-xs uppercase tracking-widest mb-0.5">History</p>
              <p className="text-white font-semibold">{TYPE_META[historyModal.type]?.label || "Biomarker"}</p>
            </div>
            <button
              type="button"
              onClick={() => { setHistoryModal({ open: false, type: null }); setHistoryData([]); setHistoryError(""); }}
              className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center text-white/40 hover:text-white/70 transition-colors text-lg"
            >
              ×
            </button>
          </div>

          {/* View mode toggle */}
          <div className="flex gap-2">
            {["list", "graph"].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setHistoryMode(mode)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-colors capitalize ${historyMode === mode ? "bg-indigo-500/15 border-indigo-500/25 text-indigo-300" : "bg-white/[0.03] border-white/[0.07] text-white/40 hover:text-white/60"}`}
              >
                {mode} view
              </button>
            ))}
          </div>

          {/* Quick ranges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-white/25 text-xs font-semibold">Quick:</span>
            {[7, 30, 60, 90].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => {
                  const today = new Date();
                  const end   = today.toISOString().slice(0, 10);
                  const start = new Date(today); start.setDate(start.getDate() - (days - 1));
                  setRangeFrom(start.toISOString().slice(0, 10)); setRangeTo(end);
                }}
                className="px-2.5 py-1 rounded-full border border-white/[0.07] bg-white/[0.03] text-white/35 text-xs font-medium hover:border-white/20 hover:text-white/55 transition-colors"
              >
                Last {days}d
              </button>
            ))}
          </div>

          {/* Date range inputs */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2">
              <label className="text-white/25 font-medium">From</label>
              <input type="date" value={rangeFrom} onChange={(e) => setRangeFrom(e.target.value)} className={inputCls} />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-white/25 font-medium">To</label>
              <input type="date" value={rangeTo} onChange={(e) => setRangeTo(e.target.value)} className={inputCls} />
            </div>
            <button
              type="button"
              onClick={() => { setRangeFrom(""); setRangeTo(""); }}
              className="text-white/30 hover:text-white/50 text-xs"
            >
              Clear
            </button>
          </div>

          {/* States */}
          {historyLoading && (
            <div className="flex items-center justify-center py-8 gap-2 text-white/30 text-sm">
              <div className="w-5 h-5 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin" />
              Loading history…
            </div>
          )}

          {historyError && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{historyError}</div>
          )}

          {!historyLoading && !historyError && !filteredHistory.length && (
            <p className="text-white/25 text-sm">No history found for this range.</p>
          )}

          {!historyLoading && !historyError && filteredHistory.length > 0 && (
            <div className="space-y-4">
              {/* Graph view */}
              {historyMode === "graph" && chartPath && (
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
                  <div className="flex items-center justify-between text-xs text-white/30 mb-2 px-1">
                    <span>Value over time</span>
                    <span>{chartPath.yLabel}</span>
                  </div>
                  <svg viewBox={`0 0 ${chartPath.W} ${chartPath.H}`} className="w-full h-52">
                    {chartPath.yTicks.map((t, i) => (
                      <line key={`gy-${i}`}
                        x1={chartPath.scaleX(chartPath.xTicks[0]) - 4} x2={chartPath.W - 8}
                        y1={chartPath.scaleY(t)} y2={chartPath.scaleY(t)}
                        stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3 4"
                      />
                    ))}
                    <path d={`M0,${chartPath.H - 28} H${chartPath.W}`} stroke="rgba(255,255,255,0.06)" strokeWidth="1" fill="none" />
                    <path d={chartPath.d} stroke="#818cf8" strokeWidth="2" fill="none" />
                    {chartPath.points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill="#818cf8" />)}
                    {chartPath.xTicks.map((t, i) => (
                      <text key={`xt-${i}`} x={chartPath.scaleX(t)} y={chartPath.H - 12} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.25)">
                        {new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </text>
                    ))}
                    {chartPath.yTicks.map((t, i) => (
                      <text key={`yt-${i}`} x={14} y={chartPath.scaleY(t) + 4} textAnchor="start" fontSize="10" fill="rgba(255,255,255,0.25)">
                        {t.toFixed(1)}
                      </text>
                    ))}
                  </svg>
                </div>
              )}

              {/* List view */}
              {historyMode === "list" && (
                <div className="max-h-64 overflow-y-auto rounded-xl border border-white/[0.07] divide-y divide-white/[0.05]">
                  {filteredHistory.slice().reverse().map((row) => (
                    <div key={row.id} className="px-4 py-3 flex items-center justify-between text-sm hover:bg-white/[0.02] transition-colors">
                      <div>
                        <p className="text-white/70 font-medium">{row.value} <span className="text-white/30 font-normal">{row.unit}</span></p>
                        <p className="text-white/25 text-xs">{row.source}</p>
                      </div>
                      <span className="text-white/25 text-xs">{new Date(row.recorded_at).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

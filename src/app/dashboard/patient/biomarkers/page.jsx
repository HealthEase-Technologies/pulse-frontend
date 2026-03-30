"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, ResponsiveContainer,
  CartesianGrid, XAxis, YAxis, Tooltip, ReferenceLine,
} from "recharts";
import {
  getAllBiomarkers, getBiomarkerHistory, getBiomarkerRanges,
  insertBiomarkerData, getMyDevices,
} from "@/services/api_calls";
import RoleProtection from "@/components/RoleProtection";
import { USER_ROLES } from "@/hooks/useUserRole";

/* ─── meta ───────────────────────────────────────────────────────── */
const BIO_META = {
  heart_rate:               { label: "Heart Rate",           unit: "bpm",   color: "#f87171", stroke: "#ef4444", tag: "Vitals"    },
  blood_pressure_systolic:  { label: "BP Systolic",          unit: "mmHg",  color: "#fb923c", stroke: "#f97316", tag: "BP"        },
  blood_pressure_diastolic: { label: "BP Diastolic",         unit: "mmHg",  color: "#fbbf24", stroke: "#f59e0b", tag: "BP"        },
  glucose:                  { label: "Glucose",              unit: "mg/dL", color: "#34d399", stroke: "#10b981", tag: "Metabolic" },
  steps:                    { label: "Steps",                unit: "steps", color: "#60a5fa", stroke: "#3b82f6", tag: "Activity"  },
  sleep:                    { label: "Sleep",                unit: "hrs",   color: "#a78bfa", stroke: "#8b5cf6", tag: "Recovery"  },
};

const TYPE_OPTIONS = [
  { value: "heart_rate",              label: "Heart Rate"       },
  { value: "blood_pressure",          label: "Blood Pressure"   },
  { value: "glucose",                 label: "Glucose"          },
  { value: "steps",                   label: "Steps"            },
  { value: "sleep",                   label: "Sleep"            },
];

const inputCls  = "w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white/80 placeholder-white/20 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors";
const labelCls  = "block text-white/40 text-xs font-semibold uppercase tracking-widest mb-1.5";

/* ─── helpers ────────────────────────────────────────────────────── */
const prettifyDevice = (raw) => {
  if (!raw || raw === "manual") return "Manual";
  return String(raw).replace(/[_.-]+/g, " ").split(" ").filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
};

const fmtVal  = (type, v) => type === "steps" ? Math.round(Number(v)).toLocaleString() : Number(v).toFixed(1);
const fmtDate = (ts) => {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};
const fmtTs = (ts) => {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};

const isoNow = () => new Date().toISOString().slice(0, 16);

/* ─── tooltip ────────────────────────────────────────────────────── */
function DarkTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0a0f1e] border border-white/[0.12] rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-white/40 mb-1">{fmtTs(label)}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill }} className="font-semibold">
          {p.value != null ? fmtVal("", p.value) : "--"} {unit}
        </p>
      ))}
    </div>
  );
}

/* ─── main ───────────────────────────────────────────────────────── */
export default function PatientBiomarkersPage() {
  const [latest,        setLatest]        = useState([]);
  const [latestLoading, setLatestLoading] = useState(true);
  const [devices,       setDevices]       = useState([]);

  const [selectedType,  setSelectedType]  = useState(null);
  const [histData,      setHistData]      = useState([]);
  const [ranges,        setRanges]        = useState(null);
  const [histLoading,   setHistLoading]   = useState(false);
  const [histError,     setHistError]     = useState("");
  const [viewMode,      setViewMode]      = useState("area");
  const [rangeFrom,     setRangeFrom]     = useState("");
  const [rangeTo,       setRangeTo]       = useState("");
  const [filterSrc,     setFilterSrc]     = useState(["all"]);

  const [insertOpen,    setInsertOpen]    = useState(false);
  const [insertType,    setInsertType]    = useState("heart_rate");
  const [insertVal,     setInsertVal]     = useState("");
  const [insertVal2,    setInsertVal2]    = useState(""); // diastolic for BP
  const [insertTs,      setInsertTs]      = useState(isoNow);
  const [insertSrc,     setInsertSrc]     = useState("manual");
  const [insertLoading, setInsertLoading] = useState(false);
  const [insertError,   setInsertError]   = useState("");
  const [insertSuccess, setInsertSuccess] = useState("");

  /* load latest */
  useEffect(() => {
    (async () => {
      setLatestLoading(true);
      try {
        const [allRes, devRes] = await Promise.allSettled([
          getAllBiomarkers({ limit: 500 }),
          getMyDevices().catch(() => []),
        ]);
        if (allRes.status === "fulfilled") {
          const list = Array.isArray(allRes.value) ? allRes.value : [];
          const map  = new Map();
          list.forEach((r) => {
            if (!r.biomarker_type) return;
            const ts = new Date(r.recorded_at || 0).getTime();
            if (!map.has(r.biomarker_type) || ts > map.get(r.biomarker_type).ts)
              map.set(r.biomarker_type, { ...r, ts });
          });
          setLatest(Array.from(map.values()));
        }
        if (devRes.status === "fulfilled") setDevices(Array.isArray(devRes.value) ? devRes.value : []);
      } finally { setLatestLoading(false); }
    })();
  }, []);

  /* load history when type selected */
  const loadHistory = useCallback(async (type) => {
    if (!type) return;
    setHistLoading(true); setHistError(""); setHistData([]);
    try {
      const [histRes, rangeRes] = await Promise.allSettled([
        getBiomarkerHistory(type, { limit: 300 }),
        getBiomarkerRanges(type).catch(() => null),
      ]);
      if (histRes.status === "fulfilled") {
        const list = Array.isArray(histRes.value) ? histRes.value : [];
        const pts  = list
          .filter((r) => r.value != null)
          .map((r) => ({ ts: new Date(r.recorded_at || 0).getTime(), v: Number(r.value), src: r.source, deviceId: r.device_id }))
          .filter((p) => Number.isFinite(p.ts) && Number.isFinite(p.v))
          .sort((a, b) => a.ts - b.ts);
        setHistData(pts);
      }
      if (rangeRes.status === "fulfilled") setRanges(rangeRes.value);
      else setRanges(null);
    } catch (err) { setHistError(err?.message || "Failed to load history"); }
    finally { setHistLoading(false); }
  }, []);

  const selectType = (type) => {
    setSelectedType(type);
    setRangeFrom(""); setRangeTo(""); setFilterSrc(["all"]);
    loadHistory(type);
  };

  /* resolve device label from deviceId */
  const deviceLabel = (deviceId) => {
    if (!deviceId) return "Device";
    const dev = devices.find((d) => d.id === deviceId);
    return dev ? (dev.device_name || dev.display_name || prettifyDevice(dev.device_type)) : "Device";
  };

const toggleFilterSrc = (src) => {
    setFilterSrc((prev) => {
      const prevArr = Array.isArray(prev) ? prev : ["all"];
      if (src === "all") return ["all"];
      const without = prevArr.filter((s) => s !== "all");
      const next = without.includes(src) ? without.filter((s) => s !== src) : [...without, src];
      return next.length === 0 ? ["all"] : next;
    });
  };

  const filtered = useMemo(() => {
    const fs = Array.isArray(filterSrc) ? filterSrc : ["all"];
    const isAll = fs.includes("all") || fs.length === 0;
    return histData.filter((p) => {
      const src = p.src || "manual";
      if (!isAll) {
        const deviceIds = fs.filter((f) => f !== "manual" && f !== "all");
        const keepManual = fs.includes("manual") && src === "manual";
        const keepDevice = deviceIds.length > 0 && src === "device" && (!p.deviceId || deviceIds.includes(p.deviceId));
        if (!keepManual && !keepDevice) return false;
      }
      if (!rangeFrom && !rangeTo) return true;
      const d   = new Date(p.ts);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
      if (rangeFrom && key < rangeFrom) return false;
      if (rangeTo   && key > rangeTo)   return false;
      return true;
    });
  }, [histData, rangeFrom, rangeTo, filterSrc]);

  /* insert handler */
  const handleInsert = async (e) => {
    e.preventDefault();
    setInsertLoading(true); setInsertError(""); setInsertSuccess("");
    try {
      const isBP = insertType === "blood_pressure";
      if (isBP) {
        await insertBiomarkerData({ biomarker_type: "blood_pressure_systolic",  value: parseFloat(insertVal),  unit: "mmHg", source: insertSrc, recorded_at: new Date(insertTs).toISOString() });
        await insertBiomarkerData({ biomarker_type: "blood_pressure_diastolic", value: parseFloat(insertVal2), unit: "mmHg", source: insertSrc, recorded_at: new Date(insertTs).toISOString() });
      } else {
        const meta = BIO_META[insertType] || {};
        await insertBiomarkerData({ biomarker_type: insertType, value: parseFloat(insertVal), unit: meta.unit || "", source: insertSrc, recorded_at: new Date(insertTs).toISOString() });
      }
      setInsertSuccess("Recorded successfully.");
      setInsertVal(""); setInsertVal2("");
      setInsertTs(isoNow());
      if (selectedType === insertType || (selectedType && insertType === "blood_pressure" && selectedType.startsWith("blood_pressure")))
        await loadHistory(selectedType);
    } catch (err) { setInsertError(err?.message || "Failed to record."); }
    finally { setInsertLoading(false); }
  };

  const meta = selectedType ? (BIO_META[selectedType] || { label: selectedType, unit: "", color: "#818cf8", stroke: "#6366f1" }) : null;

  return (
    <RoleProtection allowedRoles={[USER_ROLES.PATIENT]}>
      <div className="max-w-6xl mx-auto pb-10 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-[family-name:var(--font-serif)] text-white text-3xl font-bold">Biomarkers</h1>
            <p className="text-white/40 text-sm mt-1">Track and analyze your health data over time.</p>
          </div>
          <button
            onClick={() => { setInsertOpen((v) => !v); setInsertError(""); setInsertSuccess(""); }}
            className="px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium hover:bg-indigo-500/20 transition-colors"
          >
            {insertOpen ? "Cancel" : "+ Record Reading"}
          </button>
        </div>

        {/* Insert form */}
        {insertOpen && (
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6">
            <p className="text-white/60 text-sm font-semibold mb-5">Record a New Reading</p>
            {insertError   && <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{insertError}</div>}
            {insertSuccess && <div className="mb-4 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">{insertSuccess}</div>}
            <form onSubmit={handleInsert} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className={labelCls}>Type</label>
                <select value={insertType} onChange={(e) => setInsertType(e.target.value)} className={`${inputCls} appearance-none`}>
                  {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value} className="bg-[#0d1525]">{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>{insertType === "blood_pressure" ? "Systolic" : "Value"}</label>
                <input type="number" step="any" value={insertVal} onChange={(e) => setInsertVal(e.target.value)} required placeholder="e.g. 72" className={inputCls} />
              </div>
              {insertType === "blood_pressure" && (
                <div>
                  <label className={labelCls}>Diastolic</label>
                  <input type="number" step="any" value={insertVal2} onChange={(e) => setInsertVal2(e.target.value)} required placeholder="e.g. 80" className={inputCls} />
                </div>
              )}
              <div>
                <label className={labelCls}>Recorded At</label>
                <input type="datetime-local" value={insertTs} onChange={(e) => setInsertTs(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Source</label>
                <select value={insertSrc} onChange={(e) => setInsertSrc(e.target.value)} className={`${inputCls} appearance-none`}>
                  <option value="manual"    className="bg-[#0d1525]">Manual</option>
                  {devices.map((d) => <option key={d.id} value={d.device_id || d.id} className="bg-[#0d1525]">{d.device_name || d.name || d.device_id}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2 lg:col-span-1 flex items-end">
                <button
                  type="submit"
                  disabled={insertLoading}
                  className="w-full py-2 rounded-xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-sm font-semibold hover:bg-indigo-500/20 transition-colors disabled:opacity-40"
                >
                  {insertLoading ? "Saving…" : "Save Reading"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid lg:grid-cols-4 gap-6">

          {/* Type picker */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
              <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-3">Select Biomarker</p>
              {latestLoading ? (
                <div className="space-y-2">
                  {[...Array(6)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-white/[0.03] animate-pulse" />)}
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(BIO_META).map(([key, m]) => {
                    const rec  = latest.find((r) => r.biomarker_type === key);
                    const isOn = selectedType === key;
                    return (
                      <button
                        key={key}
                        onClick={() => selectType(key)}
                        className={`w-full text-left rounded-xl border p-3 transition-colors ${isOn ? "border-indigo-500/25 bg-indigo-500/[0.07]" : "border-white/[0.07] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"}`}
                      >
                        <p className={`text-xs font-semibold ${isOn ? "text-indigo-300" : "text-white/50"}`}>{m.label}</p>
                        {rec ? (
                          <p className="text-xs mt-0.5" style={{ color: isOn ? m.color : "rgba(255,255,255,0.3)" }}>
                            {fmtVal(key, rec.value)} <span className="text-white/25">{m.unit}</span>
                          </p>
                        ) : (
                          <p className="text-white/20 text-xs mt-0.5">No data</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* History panel */}
          <div className="lg:col-span-3">
            {!selectedType ? (
              <div className="rounded-2xl border border-dashed border-white/[0.08] h-full min-h-[300px] flex items-center justify-center">
                <p className="text-white/20 text-sm">Select a biomarker to view history.</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 space-y-5">

                {/* Panel header */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white/25 text-xs uppercase tracking-widest">History</p>
                    <p className="text-white font-semibold mt-0.5">{meta?.label}</p>
                  </div>
                  <div className="flex gap-2">
                    {["area","bar","list"].map((m) => (
                      <button key={m} onClick={() => setViewMode(m)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors capitalize ${viewMode === m ? "bg-indigo-500/15 border-indigo-500/25 text-indigo-300" : "bg-white/[0.03] border-white/[0.07] text-white/40 hover:text-white/60"}`}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick range */}
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-white/25 text-xs font-semibold">Quick:</span>
                  {[7,14,30,90].map((d) => (
                    <button key={d} onClick={() => {
                      const today = new Date();
                      const end   = today.toISOString().slice(0,10);
                      const start = new Date(today); start.setDate(start.getDate()-(d-1));
                      setRangeFrom(start.toISOString().slice(0,10)); setRangeTo(end);
                    }}
                      className="px-2.5 py-1 rounded-full border border-white/[0.07] bg-white/[0.03] text-white/35 text-xs hover:border-white/20 hover:text-white/55 transition-colors">
                      {d}d
                    </button>
                  ))}
                  <input type="date" value={rangeFrom} onChange={(e)=>setRangeFrom(e.target.value)}
                    className="px-2 py-1 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/50 text-xs focus:outline-none focus:border-indigo-500/50" />
                  <span className="text-white/25 text-xs">–</span>
                  <input type="date" value={rangeTo} onChange={(e)=>setRangeTo(e.target.value)}
                    className="px-2 py-1 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/50 text-xs focus:outline-none focus:border-indigo-500/50" />
                  {(rangeFrom||rangeTo) && (
                    <button onClick={()=>{setRangeFrom("");setRangeTo("");}} className="text-white/30 hover:text-white/50 text-xs">Clear</button>
                  )}
                </div>

                {/* Source filter */}
                {(devices.length > 0 || histData.some((r) => r.src && r.src !== "manual")) && (
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-white/25 text-xs font-semibold flex-shrink-0">Source:</span>
                    {[{ value: "all", label: "All" }, { value: "manual", label: "Manual" },
                      ...devices.map((d) => ({ value: d.id, label: d.device_name || d.display_name || prettifyDevice(d.device_type) }))
                    ].map(({ value, label }) => (
                      <button key={value} onClick={() => toggleFilterSrc(value)}
                        className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${filterSrc.includes(value) ? "bg-indigo-500/15 border-indigo-500/25 text-indigo-300" : "border-white/[0.07] text-white/35 hover:border-white/20 hover:text-white/55"}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Normal range reference */}
                {ranges && (
                  <div className="flex flex-wrap gap-2">
                    {ranges.normal_min != null && <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">Min: {ranges.normal_min} {meta?.unit}</span>}
                    {ranges.normal_max != null && <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">Max: {ranges.normal_max} {meta?.unit}</span>}
                  </div>
                )}

                {histLoading && (
                  <div className="flex items-center justify-center py-12 gap-2 text-white/30 text-sm">
                    <div className="w-5 h-5 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin" />
                    Loading history…
                  </div>
                )}
                {histError && <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{histError}</div>}

                {!histLoading && !histError && filtered.length === 0 && (
                  <p className="text-white/25 text-sm text-center py-8">No readings for this range.</p>
                )}

                {!histLoading && !histError && filtered.length > 0 && (
                  <>
                    {/* Area / Bar chart */}
                    {(viewMode === "area" || viewMode === "bar") && (
                      <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                        <ResponsiveContainer width="100%" height={240}>
                          {viewMode === "area" ? (
                            <AreaChart data={filtered} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                              <defs>
                                <linearGradient id="bioGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%"  stopColor={meta.color} stopOpacity={0.3} />
                                  <stop offset="95%" stopColor={meta.color} stopOpacity={0}   />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 4" stroke="rgba(255,255,255,0.05)" />
                              <XAxis dataKey="ts" type="number" scale="time" domain={["auto","auto"]} tickCount={5}
                                tickFormatter={fmtDate} tick={{ fill:"rgba(255,255,255,0.25)", fontSize:10 }} axisLine={false} tickLine={false} />
                              <YAxis tick={{ fill:"rgba(255,255,255,0.25)", fontSize:10 }} axisLine={false} tickLine={false} />
                              <Tooltip content={<DarkTooltip unit={meta.unit} />} />
                              {ranges?.normal_min != null && <ReferenceLine y={ranges.normal_min} stroke="rgba(52,211,153,0.3)" strokeDasharray="4 3" />}
                              {ranges?.normal_max != null && <ReferenceLine y={ranges.normal_max} stroke="rgba(248,113,113,0.3)" strokeDasharray="4 3" />}
                              <Area type="monotone" dataKey="v" stroke={meta.stroke} strokeWidth={2} fill="url(#bioGrad)" dot={filtered.length < 30 ? { r:3, fill:meta.stroke, strokeWidth:0 } : false} />
                            </AreaChart>
                          ) : (
                            <BarChart data={filtered} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 4" stroke="rgba(255,255,255,0.05)" />
                              <XAxis dataKey="ts" type="number" scale="time" domain={["auto","auto"]} tickCount={5}
                                tickFormatter={fmtDate} tick={{ fill:"rgba(255,255,255,0.25)", fontSize:10 }} axisLine={false} tickLine={false} />
                              <YAxis tick={{ fill:"rgba(255,255,255,0.25)", fontSize:10 }} axisLine={false} tickLine={false} />
                              <Tooltip content={<DarkTooltip unit={meta.unit} />} />
                              <Bar dataKey="v" fill={meta.color} radius={[3,3,0,0]} />
                            </BarChart>
                          )}
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* List view */}
                    {viewMode === "list" && (
                      <div className="max-h-80 overflow-y-auto rounded-xl border border-white/[0.07] divide-y divide-white/[0.05]">
                        {[...filtered].reverse().map((r, i) => {
                          const isManual = !r.src || r.src === "manual";
                          const label    = isManual ? "Manual" : deviceLabel(r.deviceId);
                          return (
                            <div key={i} className="px-4 py-3 flex items-center justify-between text-sm hover:bg-white/[0.02] transition-colors">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div>
                                  <span className="font-semibold" style={{ color: meta.color }}>{fmtVal(selectedType, r.v)}</span>
                                  <span className="text-white/30 ml-1.5 text-xs">{meta.unit}</span>
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${isManual ? "bg-white/[0.04] border-white/[0.08] text-white/35" : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"}`}>
                                  {isManual ? "✋ Manual" : `📱 ${label}`}
                                </span>
                              </div>
                              <span className="text-white/25 text-xs flex-shrink-0 ml-2">{fmtTs(r.ts)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <p className="text-white/25 text-xs">{filtered.length} reading{filtered.length !== 1 ? "s" : ""}</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </RoleProtection>
  );
}

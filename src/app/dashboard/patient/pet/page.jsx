"use client";

import { useEffect, useRef, useState } from "react";
import { useRive, Layout, Fit, Alignment } from "@rive-app/react-canvas";
import { getMyPet, getHealthScore, getPetCatalog, selectPet, customizePet, getPetTimeline } from "@/services/api_calls";
import RoleProtection from "@/components/RoleProtection";
import { USER_ROLES } from "@/hooks/useUserRole";
import ShareHealthCard from "@/components/ShareHealthCard";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceArea,
} from "recharts";

/* ─── constants ──────────────────────────────────────────────────── */
const BACKGROUNDS = [
  { key: "park",   label: "Park",   emoji: "🌳" },
  { key: "home",   label: "Home",   emoji: "🏠" },
  { key: "beach",  label: "Beach",  emoji: "🏖️" },
  { key: "garden", label: "Garden", emoji: "🌸" },
  { key: "space",  label: "Space",  emoji: "🚀" },
];

const COLORS = [
  { key: "light",  label: "Light",  dot: "bg-amber-200 border border-amber-300" },
  { key: "medium", label: "Medium", dot: "bg-amber-400" },
  { key: "dark",   label: "Dark",   dot: "bg-amber-700" },
];

const SCORE_META = (s) =>
  s >= 70 ? { label: "Excellent",      color: "text-green-400",  bar: "#10b981", badgeCls: "bg-green-500/10 border-green-500/20 text-green-400" }
  : s >= 55 ? { label: "Good",         color: "text-indigo-400", bar: "#6366f1", badgeCls: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" }
  : s >= 40 ? { label: "Fair",         color: "text-amber-400",  bar: "#f59e0b", badgeCls: "bg-amber-500/10 border-amber-500/20 text-amber-400" }
  :           { label: "Needs Attention", color: "text-red-400", bar: "#ef4444", badgeCls: "bg-red-500/10 border-red-500/20 text-red-400" };

const EMOTION_BADGE = {
  happy:   "bg-green-500/10 border-green-500/20 text-green-400",
  neutral: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  sad:     "bg-red-500/10   border-red-500/20   text-red-400",
};

const BG_GRADIENT = {
  space:  "linear-gradient(to bottom,#1e1b4b,#312e81)",
  beach:  "linear-gradient(to bottom,#0c4a6e,#0369a1)",
  garden: "linear-gradient(to bottom,#4a1942,#7c3f6b)",
  home:   "linear-gradient(to bottom,#1c1917,#292524)",
  park:   "linear-gradient(to bottom,#14532d,#166534)",
};

/* ─── sub-components ─────────────────────────────────────────────── */
function RivePet({ url, onCanvas }) {
  const { RiveComponent, canvas } = useRive({
    src: url, autoplay: true,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
  });
  useEffect(() => { if (canvas && onCanvas) onCanvas(canvas); }, [canvas]); // eslint-disable-line
  if (!url) return <PetPlaceholder />;
  return <RiveComponent className="w-full h-full" />;
}

function PetPlaceholder() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-white/[0.04] rounded-lg">
      <span className="text-4xl">🐾</span>
    </div>
  );
}

function DarkTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = new Date(label);
  const dateStr = Number.isNaN(d.getTime()) ? label : d.toLocaleDateString(undefined, { month:"short", day:"numeric" });
  return (
    <div className="bg-[#0a0f1e] border border-white/[0.12] rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-white/40 mb-1">{dateStr}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.stroke }} className="font-semibold">{p.name}: {p.value}</p>
      ))}
    </div>
  );
}

/* ─── page ───────────────────────────────────────────────────────── */
export default function PetPage() {
  const [pet,      setPet]     = useState(null);
  const [score,    setScore]   = useState(null);
  const [catalog,  setCatalog] = useState([]);
  const [loading,  setLoading] = useState(true);
  const [saving,   setSaving]  = useState(false);
  const [petName,  setPetName] = useState("");
  const [nameErr,  setNameErr] = useState("");
  const [tab,      setTab]     = useState("overview");
  const [sharing,  setSharing] = useState(false);
  const [timeline, setTimeline]= useState(null);
  const [tlLoad,   setTlLoad]  = useState(false);
  const [petSnap,  setPetSnap] = useState(null);
  const petCanvasRef           = useRef(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pR, sR, cR] = await Promise.allSettled([getMyPet(), getHealthScore(), getPetCatalog()]);
      if (pR.status === "fulfilled") { setPet(pR.value); setPetName(pR.value.pet_name || ""); }
      if (sR.status === "fulfilled") setScore(sR.value);
      if (cR.status === "fulfilled") setCatalog(cR.value);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const fetchTimeline = async () => {
    if (timeline) return;
    setTlLoad(true);
    try { setTimeline(await getPetTimeline(30)); }
    catch { setTimeline({ events: [], score_series: [] }); }
    finally { setTlLoad(false); }
  };

  const handleSelectPet = async (key) => {
    setSaving(true);
    try { setPet(await selectPet(key)); setTab("overview"); }
    finally { setSaving(false); }
  };

  const handleSaveName = async () => {
    if (!/^[A-Za-z0-9 ]{1,15}$/.test(petName.trim())) { setNameErr("Max 15 characters, letters and numbers only"); return; }
    setNameErr(""); setSaving(true);
    try { setPet(await customizePet({ pet_name: petName.trim() })); }
    finally { setSaving(false); }
  };

  const scoreMeta = SCORE_META(Number(pet?.current_score ?? 0));
  const scoreNum  = Number(pet?.current_score ?? 0);

  return (
    <RoleProtection allowedRoles={[USER_ROLES.PATIENT]}>
      <div className="max-w-5xl mx-auto pb-10 space-y-6">

        {sharing && pet && (
          <ShareHealthCard pet={pet} score={scoreNum} petImageDataUrl={petSnap} onClose={() => setSharing(false)} />
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-[family-name:var(--font-serif)] text-white text-3xl font-bold">My Pet</h1>
            <p className="text-white/40 text-sm mt-1">Your pet's mood reflects your daily health score. Keep it happy!</p>
          </div>
          {pet && (
            <button
              onClick={() => {
                try { const snap = petCanvasRef.current?.toDataURL("image/png") || null; setPetSnap(snap); } catch { setPetSnap(null); }
                setSharing(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-sm font-semibold hover:bg-indigo-500/20 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4" strokeWidth={2}>
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Share
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin" />
          </div>
        ) : !pet ? (
          /* ── Pet selection ── */
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-8 text-center">
            <p className="text-white/70 text-lg font-semibold mb-1">Choose your companion!</p>
            <p className="text-white/30 text-sm mb-8">Pick a pet to get started. You can change it anytime.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {catalog.map((item) => (
                <button key={item.pet_key} onClick={() => handleSelectPet(item.pet_key)} disabled={saving}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/[0.07] bg-white/[0.02] hover:border-indigo-500/30 hover:bg-indigo-500/[0.07] transition-all disabled:opacity-40">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-white/[0.04]">
                    {item.selection_asset_url ? <RivePet url={item.selection_asset_url} /> : <PetPlaceholder />}
                  </div>
                  <span className="text-white/55 text-sm font-medium">{item.display_name}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">

            {/* ── Left panel ── */}
            <div className="lg:col-span-1 flex flex-col gap-4">

              {/* Pet display */}
              <div className="rounded-2xl border border-white/[0.07] overflow-hidden">
                <div className="relative h-52 flex items-center justify-center"
                  style={{ background: BG_GRADIENT[pet.background_theme || "park"] }}>
                  <div className="w-36 h-36">
                    {pet.riv_url ? <RivePet url={pet.riv_url} onCanvas={(c) => { petCanvasRef.current = c; }} /> : <PetPlaceholder />}
                  </div>
                  <span className={`absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${EMOTION_BADGE[pet.current_emotion] || "bg-white/10 border-white/20 text-white/50"}`}>
                    {pet.current_emotion}
                  </span>
                  {pet.streak_days > 0 && (
                    <span className="absolute top-3 left-3 text-xs font-semibold px-2 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-300">
                      🔥 {pet.streak_days}d
                    </span>
                  )}
                </div>
                <div className="p-4 text-center border-t border-white/[0.07] bg-white/[0.02]">
                  <h2 className="text-white/80 text-base font-bold">{pet.pet_name || pet.display_name}</h2>
                  <p className="text-white/25 text-xs capitalize mt-0.5">{pet.pet_key}</p>
                </div>
              </div>

              {/* Health score */}
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white/50 text-sm font-semibold">Health Score</span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${scoreMeta.badgeCls}`}>{scoreMeta.label}</span>
                </div>
                <div className="flex items-end gap-1 mb-3">
                  <span className={`text-5xl font-black ${scoreMeta.color}`}>{scoreNum.toFixed(0)}</span>
                  <span className="text-white/30 mb-1.5 text-sm">/100</span>
                </div>
                <div className="w-full bg-white/[0.06] rounded-full h-2">
                  <div className="h-2 rounded-full transition-all" style={{ width: `${scoreNum}%`, background: scoreMeta.bar }} />
                </div>
                <button onClick={() => setTab("score")} className="mt-3 text-indigo-400 text-xs hover:text-indigo-300 transition-colors">
                  View breakdown →
                </button>
              </div>

              {/* Accessories */}
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
                <p className="text-white/50 text-sm font-semibold mb-1">Accessories</p>
                {pet.accessory_unlocked ? (
                  <p className="text-green-400 text-sm">🎉 Accessories unlocked!</p>
                ) : (
                  <div>
                    <p className="text-white/30 text-xs">Reach a 7-day goal streak to unlock.</p>
                    {pet.streak_days > 0 && (
                      <div className="mt-2">
                        <div className="w-full bg-white/[0.06] rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-orange-400" style={{ width: `${Math.min((pet.streak_days / 7) * 100, 100)}%` }} />
                        </div>
                        <p className="text-white/25 text-xs mt-1">{pet.streak_days}/7 days</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Right panel ── */}
            <div className="lg:col-span-2 rounded-2xl border border-white/[0.07] bg-white/[0.03] overflow-hidden flex flex-col">
              {/* Tab bar */}
              <div className="flex border-b border-white/[0.07]">
                {[
                  { key: "overview",  label: "Overview"   },
                  { key: "timeline",  label: "Timeline"   },
                  { key: "customize", label: "Customize"  },
                  { key: "switch",    label: "Switch Pet" },
                  { key: "score",     label: "Score"      },
                ].map((t) => (
                  <button key={t.key}
                    onClick={() => { setTab(t.key); if (t.key === "timeline") fetchTimeline(); }}
                    className={`flex-1 py-3 text-xs font-semibold transition-colors border-b-2 ${tab === t.key ? "text-indigo-300 border-indigo-500/60 bg-indigo-500/[0.05]" : "text-white/35 border-transparent hover:text-white/55"}`}>
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-5">

                {/* Overview */}
                {tab === "overview" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Emotion", value: pet.current_emotion,       extra: "capitalize" },
                        { label: "Score",   value: `${scoreNum.toFixed(0)}/100`                   },
                        { label: "Streak",  value: `${pet.streak_days} days`                      },
                      ].map(({ label, value, extra }) => (
                        <div key={label} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 text-center">
                          <p className="text-white/25 text-xs mb-1">{label}</p>
                          <p className={`text-sm font-bold text-white/70 ${extra || ""}`}>{value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-xl border border-indigo-500/15 bg-indigo-500/[0.05] p-4">
                      <p className="text-indigo-300 text-sm font-semibold mb-1">How is the score calculated?</p>
                      <p className="text-white/35 text-xs leading-relaxed">
                        Your daily health score (0–100) is based on 5 biomarkers: heart rate, blood pressure, glucose, steps, and sleep. Each contributes up to 20 points based on how close your readings are to optimal ranges.
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                      <p className="text-white/50 text-sm font-semibold mb-2">Pet Emotion Guide</p>
                      <div className="space-y-1.5">
                        {[
                          { range:"70–100", emotion:"Happy",   dot:"bg-green-500",  cls:"text-green-400"  },
                          { range:"40–69",  emotion:"Neutral", dot:"bg-amber-500",  cls:"text-amber-400"  },
                          { range:"0–39",   emotion:"Sad",     dot:"bg-red-500",    cls:"text-red-400"    },
                        ].map((e) => (
                          <div key={e.emotion} className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${e.dot}`} />
                            <span className={`text-xs font-medium ${e.cls}`}>{e.emotion}</span>
                            <span className="text-white/25 text-xs">— score {e.range}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Customize */}
                {tab === "customize" && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-white/40 text-xs font-semibold uppercase tracking-widest mb-2">Pet Name</label>
                      <div className="flex gap-2">
                        <input value={petName} onChange={(e) => { setPetName(e.target.value); setNameErr(""); }}
                          maxLength={15} placeholder="Max 15 chars, letters & numbers"
                          className="flex-1 px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white/70 placeholder-white/20 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors" />
                        <button onClick={handleSaveName} disabled={saving}
                          className="px-4 py-2 rounded-xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-sm font-semibold hover:bg-indigo-500/20 disabled:opacity-40 transition-colors">
                          Save
                        </button>
                      </div>
                      {nameErr && <p className="text-red-400 text-xs mt-1">{nameErr}</p>}
                    </div>

                    <div>
                      <label className="block text-white/40 text-xs font-semibold uppercase tracking-widest mb-2">Color Variant</label>
                      <div className="flex gap-2">
                        {COLORS.map((c) => (
                          <button key={c.key} onClick={() => customizePet({ color_variant: c.key }).then(setPet)}
                            className={`flex-1 py-2.5 px-3 rounded-xl border text-sm font-medium flex items-center gap-2 transition-all ${pet.color_variant === c.key ? "border-indigo-500/30 bg-indigo-500/[0.08] text-indigo-300" : "border-white/[0.07] text-white/35 hover:border-white/20"}`}>
                            <div className={`w-3.5 h-3.5 rounded-full ${c.dot}`} />{c.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-white/40 text-xs font-semibold uppercase tracking-widest mb-2">Background Scene</label>
                      <div className="grid grid-cols-5 gap-2">
                        {BACKGROUNDS.map((b) => (
                          <button key={b.key} onClick={() => customizePet({ background_theme: b.key }).then(setPet)}
                            className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border transition-all ${pet.background_theme === b.key ? "border-indigo-500/30 bg-indigo-500/[0.08]" : "border-white/[0.07] bg-white/[0.02] hover:border-white/20"}`}>
                            <span className="text-xl">{b.emoji}</span>
                            <span className="text-white/30 text-[11px]">{b.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Switch Pet */}
                {tab === "switch" && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {catalog.map((item) => (
                      <button key={item.pet_key} onClick={() => handleSelectPet(item.pet_key)}
                        disabled={saving || item.id === pet.pet_catalog_id}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${item.id === pet.pet_catalog_id ? "border-indigo-500/30 bg-indigo-500/[0.08]" : "border-white/[0.07] bg-white/[0.02] hover:border-indigo-500/20 hover:bg-indigo-500/[0.05]"}`}>
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/[0.04]">
                          {item.selection_asset_url ? <RivePet url={item.selection_asset_url} /> : <PetPlaceholder />}
                        </div>
                        <span className="text-white/50 text-xs font-medium">{item.display_name}</span>
                        {item.id === pet.pet_catalog_id && <span className="text-indigo-400 text-[10px] font-semibold">Current</span>}
                      </button>
                    ))}
                  </div>
                )}

                {/* Timeline */}
                {tab === "timeline" && (
                  <div className="space-y-4">
                    {tlLoad ? (
                      <div className="flex justify-center py-12">
                        <div className="w-8 h-8 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin" />
                      </div>
                    ) : !timeline || (!timeline.score_series?.length && !timeline.events?.length) ? (
                      <p className="text-white/25 text-sm text-center py-8">No history yet — log biomarkers daily to build your timeline!</p>
                    ) : (
                      <>
                        {timeline.score_series?.length > 0 && (
                          <div>
                            <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-2">Health Score (Last 30 Days)</p>
                            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                              <ResponsiveContainer width="100%" height={180}>
                                <AreaChart data={timeline.score_series} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                                  <defs>
                                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
                                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.25)" }}
                                    tickFormatter={(d) => { const dt = new Date(d); return `${dt.getMonth()+1}/${dt.getDate()}`; }} />
                                  <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "rgba(255,255,255,0.25)" }} />
                                  <Tooltip content={<DarkTooltip />} />
                                  <ReferenceArea y1={70} y2={100} fill="rgba(16,185,129,0.08)"  />
                                  <ReferenceArea y1={40} y2={70}  fill="rgba(245,158,11,0.08)"  />
                                  <ReferenceArea y1={0}  y2={40}  fill="rgba(239,68,68,0.08)"   />
                                  <ReferenceLine y={70} stroke="rgba(16,185,129,0.35)" strokeDasharray="4 2" />
                                  <ReferenceLine y={40} stroke="rgba(245,158,11,0.35)" strokeDasharray="4 2" />
                                  <Area dataKey="score" name="Score" stroke="#6366f1" strokeWidth={2}
                                    fill="url(#scoreGrad)" dot={{ r: 3, fill: "#6366f1", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                                </AreaChart>
                              </ResponsiveContainer>
                              <div className="flex gap-4 justify-center mt-2">
                                {[
                                  { color: "bg-green-500/30", label: "Happy (70–100)" },
                                  { color: "bg-amber-500/30", label: "Neutral (40–69)" },
                                  { color: "bg-red-500/30",   label: "Sad (0–39)"     },
                                ].map(({ color, label }) => (
                                  <div key={label} className="flex items-center gap-1">
                                    <div className={`w-2.5 h-2.5 rounded-sm ${color}`} />
                                    <span className="text-white/25 text-[10px]">{label}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Mood changes */}
                        {(() => {
                          const changes = (timeline.events || []).filter((e) => e.previous_emotion !== e.new_emotion).reverse();
                          if (!changes.length) return <p className="text-white/20 text-xs text-center py-4">No mood changes yet.</p>;
                          const EMO_DOT = { happy: "bg-green-500", neutral: "bg-amber-500", sad: "bg-red-500" };
                          const catEntry = catalog.find((c) => c.id === pet?.pet_catalog_id);
                          const petAssetUrl = catEntry?.selection_asset_url || pet?.riv_url;
                          return (
                            <div>
                              <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-2">Mood Changes — {changes.length}</p>
                              <div className="space-y-2">
                                {changes.map((e, idx) => {
                                  const ts = new Date(e.created_at);
                                  const dateLabel = Number.isNaN(ts.getTime()) ? "" : ts.toLocaleDateString(undefined, { month:"short", day:"numeric", year:"numeric" });
                                  const breakdown = e.input_snapshot?.breakdown || [];
                                  const topReasons = breakdown.sort((a, b) => b.score - a.score).slice(0, 2);
                                  return (
                                    <div key={idx} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                                      <div className="flex gap-3">
                                        {petAssetUrl && (
                                          <div className="relative flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-white/[0.04]">
                                            <RivePet url={petAssetUrl} />
                                          </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2">
                                              <span className={`w-2 h-2 rounded-full ${EMO_DOT[e.previous_emotion] || "bg-white/20"}`} />
                                              <span className="text-white/40 text-xs capitalize">{e.previous_emotion}</span>
                                              <span className="text-white/20 text-xs">→</span>
                                              <span className={`w-2 h-2 rounded-full ${EMO_DOT[e.new_emotion] || "bg-white/20"}`} />
                                              <span className="text-white/60 text-xs font-semibold capitalize">{e.new_emotion}</span>
                                            </div>
                                            <span className="text-white/25 text-xs">{dateLabel}</span>
                                          </div>
                                          <div className="flex items-center gap-2 mb-1.5">
                                            <span className="text-white/60 text-sm font-bold">{Math.round(e.final_score)}/100</span>
                                            <div className="flex-1 bg-white/[0.06] rounded-full h-1.5">
                                              <div className={`h-1.5 rounded-full ${EMO_DOT[e.new_emotion] || "bg-indigo-500"}`} style={{ width: `${e.final_score}%` }} />
                                            </div>
                                          </div>
                                          {topReasons.length > 0 && (
                                            <div className="space-y-0.5">
                                              {topReasons.map((b) => (
                                                <div key={b.biomarker_type} className="flex items-center gap-1.5">
                                                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${b.score >= 16 ? "bg-green-500" : b.score >= 10 ? "bg-amber-500" : "bg-red-400"}`} />
                                                  <span className="text-white/30 text-[11px] capitalize">
                                                    {b.biomarker_type.replace(/_/g, " ")} — {b.reason} ({Math.round(b.score)}/20)
                                                  </span>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                      </>
                    )}
                  </div>
                )}

                {/* Score Breakdown */}
                {tab === "score" && score && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white/50 text-sm font-semibold">Today's Breakdown</span>
                      <span className={`text-2xl font-black ${scoreMeta.color}`}>{score.score.toFixed(0)}/100</span>
                    </div>
                    {(score.breakdown || []).map((b) => (
                      <div key={b.biomarker_type} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-white/60 text-xs font-medium capitalize">{b.biomarker_type.replace(/_/g, " ")}</span>
                          <div className="flex items-center gap-2">
                            {b.value != null && <span className="text-white/30 text-xs">{b.value}</span>}
                            <span className={`text-xs font-bold ${b.score >= 16 ? "text-green-400" : b.score >= 10 ? "text-amber-400" : "text-red-400"}`}>
                              {b.score.toFixed(0)}/20
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-white/[0.06] rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${b.score >= 16 ? "bg-green-500" : b.score >= 10 ? "bg-amber-500" : "bg-red-400"}`}
                            style={{ width: `${(b.score / 20) * 100}%` }} />
                        </div>
                        <p className="text-white/25 text-[11px] mt-1">{b.reason}</p>
                      </div>
                    ))}
                  </div>
                )}
                {tab === "score" && !score && (
                  <p className="text-white/25 text-sm text-center py-8">No score data yet. Log some biomarkers first!</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleProtection>
  );
}

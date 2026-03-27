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
  s >= 70 ? { label: "Excellent",       color: "text-green-600",  bar: "bg-green-500",  badge: "bg-green-100 text-green-700" }
  : s >= 55 ? { label: "Good",          color: "text-blue-600",   bar: "bg-blue-500",   badge: "bg-blue-100 text-blue-700"   }
  : s >= 40 ? { label: "Fair",          color: "text-yellow-600", bar: "bg-yellow-500", badge: "bg-yellow-100 text-yellow-700"}
  : { label: "Needs Attention",         color: "text-red-600",    bar: "bg-red-500",    badge: "bg-red-100 text-red-700"     };

const EMOTION_BADGE = {
  happy:   "bg-green-100 text-green-700",
  neutral: "bg-yellow-100 text-yellow-700",
  sad:     "bg-red-100 text-red-700",
};

const BG_GRADIENT = {
  space:  "linear-gradient(to bottom,#1e1b4b,#312e81)",
  beach:  "linear-gradient(to bottom,#bae6fd,#7dd3fc)",
  garden: "linear-gradient(to bottom,#fce7f3,#fbcfe8)",
  home:   "linear-gradient(to bottom,#fef3c7,#fde68a)",
  park:   "linear-gradient(to bottom,#d1fae5,#6ee7b7)",
};

function RivePet({ url, onCanvas }) {
  const { RiveComponent, canvas } = useRive({
    src: url,
    autoplay: true,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
  });
  useEffect(() => {
    if (canvas && onCanvas) onCanvas(canvas);
  }, [canvas]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!url) return <PetPlaceholder />;
  return <RiveComponent className="w-full h-full" />;
}

function PetPlaceholder() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
      <span className="text-4xl">🐾</span>
    </div>
  );
}

export default function PetPage() {
  const [pet, setPet]             = useState(null);
  const [score, setScore]         = useState(null);
  const [catalog, setCatalog]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [petName, setPetName]     = useState("");
  const [nameError, setNameError] = useState("");
  const [activeTab, setActiveTab]   = useState("overview");
  const [sharing, setSharing]       = useState(false);
  const [timeline, setTimeline]     = useState(null);
  const [tlLoading, setTlLoading]   = useState(false);
  const [petSnap, setPetSnap]     = useState(null);
  const petCanvasRef              = useRef(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [petRes, scoreRes, catRes] = await Promise.allSettled([
        getMyPet(), getHealthScore(), getPetCatalog()
      ]);
      if (petRes.status === "fulfilled") {
        setPet(petRes.value);
        setPetName(petRes.value.pet_name || "");
      }
      if (scoreRes.status === "fulfilled") setScore(scoreRes.value);
      if (catRes.status === "fulfilled")   setCatalog(catRes.value);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const fetchTimeline = async () => {
    if (timeline) return;
    setTlLoading(true);
    try { setTimeline(await getPetTimeline(30)); }
    catch { setTimeline({ events: [], score_series: [] }); }
    finally { setTlLoading(false); }
  };

  const handleSelectPet = async (petKey) => {
    setSaving(true);
    try { setPet(await selectPet(petKey)); setActiveTab("overview"); }
    finally { setSaving(false); }
  };

  const handleSaveName = async () => {
    if (!/^[A-Za-z0-9 ]{1,15}$/.test(petName.trim())) {
      setNameError("Max 15 characters, letters and numbers only");
      return;
    }
    setNameError("");
    setSaving(true);
    try { setPet(await customizePet({ pet_name: petName.trim() })); }
    finally { setSaving(false); }
  };

  const scoreMeta = SCORE_META(Number(pet?.current_score ?? 0));
  const scoreNum  = Number(pet?.current_score ?? 0);

  return (
    <RoleProtection allowedRoles={[USER_ROLES.PATIENT]}>
      <div>
        {sharing && pet && (
          <ShareHealthCard pet={pet} score={scoreNum} petImageDataUrl={petSnap} onClose={() => setSharing(false)} />
        )}

        {/* Page header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Pet</h1>
            <p className="text-sm text-gray-500 mt-1">
              Your pet's mood reflects your daily health score. Keep it happy!
            </p>
          </div>
          {pet && (
            <button
              onClick={() => {
                try {
                  const snap = petCanvasRef.current?.toDataURL("image/png") || null;
                  setPetSnap(snap);
                } catch { setPetSnap(null); }
                setSharing(true);
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow transition-all"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4" strokeWidth={2}>
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Share Status
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : !pet ? (
          /* ── Pet selection ── */
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-lg font-semibold text-gray-800 mb-2">Choose your companion!</p>
            <p className="text-sm text-gray-500 mb-8">
              Pick a pet to get started. You can change it anytime.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {catalog.map((item) => (
                <button
                  key={item.pet_key}
                  onClick={() => handleSelectPet(item.pet_key)}
                  disabled={saving}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all disabled:opacity-50"
                >
                  <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden">
                    {item.selection_asset_url
                      ? <RivePet url={item.selection_asset_url} />
                      : <PetPlaceholder />
                    }
                  </div>
                  <span className="text-sm font-medium text-gray-700">{item.display_name}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Left: Pet card + Score ── */}
            <div className="lg:col-span-1 flex flex-col gap-4">

              {/* Pet display card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div
                  className="relative h-52 flex items-center justify-center"
                  style={{ background: BG_GRADIENT[pet.background_theme || "park"] }}
                >
                  <div className="w-36 h-36">
                    {pet.riv_url
                      ? <RivePet url={pet.riv_url} onCanvas={(c) => { petCanvasRef.current = c; }} />
                      : <PetPlaceholder />
                    }
                  </div>
                  <span className={`absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${EMOTION_BADGE[pet.current_emotion] || "bg-gray-100 text-gray-700"}`}>
                    {pet.current_emotion}
                  </span>
                  {pet.streak_days > 0 && (
                    <span className="absolute top-3 left-3 text-xs font-semibold px-2 py-1 rounded-full bg-orange-100 text-orange-700">
                      🔥 {pet.streak_days}d streak
                    </span>
                  )}
                </div>
                <div className="p-4 text-center border-t border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900">{pet.pet_name || pet.display_name}</h2>
                  <p className="text-xs text-gray-400 capitalize mt-0.5">{pet.pet_key}</p>
                </div>
              </div>

              {/* Health score card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-700">Health Score</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${scoreMeta.badge}`}>
                    {scoreMeta.label}
                  </span>
                </div>
                <div className="flex items-end gap-1 mb-3">
                  <span className={`text-5xl font-black ${scoreMeta.color}`}>{scoreNum.toFixed(0)}</span>
                  <span className="text-gray-400 mb-1.5 text-sm">/100</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all ${scoreMeta.bar}`}
                       style={{ width: `${scoreNum}%` }} />
                </div>
                <button onClick={() => setActiveTab("score")}
                        className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-medium">
                  View breakdown →
                </button>
              </div>

              {/* Accessory status */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <p className="text-sm font-semibold text-gray-700 mb-1">Accessories</p>
                {pet.accessory_unlocked
                  ? <p className="text-sm text-green-600">🎉 Accessories unlocked!</p>
                  : <div>
                      <p className="text-sm text-gray-500">
                        Reach a 7-day goal streak to unlock accessories.
                      </p>
                      {pet.streak_days > 0 && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full bg-orange-400"
                                 style={{ width: `${Math.min((pet.streak_days / 7) * 100, 100)}%` }} />
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{pet.streak_days}/7 days</p>
                        </div>
                      )}
                    </div>
                }
              </div>
            </div>

            {/* ── Right: Tabs ── */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              {/* Tab bar */}
              <div className="flex border-b border-gray-200">
                {[
                  { key: "overview",  label: "Overview"        },
                  { key: "timeline",  label: "Timeline"        },
                  { key: "customize", label: "Customize"       },
                  { key: "switch",    label: "Switch Pet"      },
                  { key: "score",     label: "Score Breakdown" },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => { setActiveTab(t.key); if (t.key === "timeline") fetchTimeline(); }}
                    className={`flex-1 py-3 text-xs font-semibold transition-colors border-b-2
                      ${activeTab === t.key
                        ? "text-blue-600 border-blue-600 bg-blue-50/50"
                        : "text-gray-500 border-transparent hover:text-gray-700"}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-5">

                {/* Overview */}
                {activeTab === "overview" && (
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Emotion", value: pet.current_emotion, extra: "capitalize" },
                        { label: "Score",   value: `${scoreNum.toFixed(0)}/100` },
                        { label: "Streak",  value: `${pet.streak_days} days` },
                      ].map(({ label, value, extra }) => (
                        <div key={label} className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                          <p className="text-xs text-gray-400 mb-1">{label}</p>
                          <p className={`text-sm font-bold text-gray-800 ${extra || ""}`}>{value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                      <p className="text-sm font-semibold text-blue-800 mb-1">How is the score calculated?</p>
                      <p className="text-xs text-blue-600 leading-relaxed">
                        Your daily health score (0–100) is based on 5 biomarkers: heart rate,
                        blood pressure, glucose, steps, and sleep. Each contributes up to 20 points
                        based on how close your readings are to optimal ranges.
                      </p>
                    </div>

                    <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                      <p className="text-sm font-semibold text-gray-700 mb-1">Pet Emotion Guide</p>
                      <div className="flex flex-col gap-1.5 mt-2">
                        {[
                          { range: "70–100", emotion: "Happy",   color: "text-green-600",  dot: "bg-green-500"  },
                          { range: "40–69",  emotion: "Neutral", color: "text-yellow-600", dot: "bg-yellow-500" },
                          { range: "0–39",   emotion: "Sad",     color: "text-red-600",    dot: "bg-red-500"    },
                        ].map((e) => (
                          <div key={e.emotion} className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${e.dot}`} />
                            <span className={`text-xs font-medium ${e.color}`}>{e.emotion}</span>
                            <span className="text-xs text-gray-400">— score {e.range}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Customize */}
                {activeTab === "customize" && (
                  <div className="flex flex-col gap-5">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pet Name</label>
                      <div className="flex gap-2">
                        <input
                          value={petName}
                          onChange={(e) => { setPetName(e.target.value); setNameError(""); }}
                          maxLength={15}
                          placeholder="Max 15 chars, letters & numbers"
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={handleSaveName}
                          disabled={saving}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 rounded-lg disabled:opacity-50 transition-colors"
                        >
                          Save
                        </button>
                      </div>
                      {nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}
                    </div>

                    {/* Color */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Color Variant</label>
                      <div className="flex gap-3">
                        {COLORS.map((c) => (
                          <button
                            key={c.key}
                            onClick={() => customizePet({ color_variant: c.key }).then(setPet)}
                            className={`flex-1 py-2.5 px-3 rounded-lg border text-sm font-medium flex items-center gap-2 transition-all
                              ${pet.color_variant === c.key
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"}`}
                          >
                            <div className={`w-3.5 h-3.5 rounded-full ${c.dot}`} />
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Background */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Background Scene</label>
                      <div className="grid grid-cols-5 gap-2">
                        {BACKGROUNDS.map((b) => (
                          <button
                            key={b.key}
                            onClick={() => customizePet({ background_theme: b.key }).then(setPet)}
                            className={`flex flex-col items-center gap-1 py-2.5 rounded-lg border transition-all
                              ${pet.background_theme === b.key
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 bg-gray-50 hover:border-gray-300"}`}
                          >
                            <span className="text-xl">{b.emoji}</span>
                            <span className="text-[11px] text-gray-500">{b.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Switch Pet */}
                {activeTab === "switch" && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {catalog.map((item) => (
                      <button
                        key={item.pet_key}
                        onClick={() => handleSelectPet(item.pet_key)}
                        disabled={saving || item.id === pet.pet_catalog_id}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all
                          ${item.id === pet.pet_catalog_id
                            ? "border-blue-500 bg-blue-50 ring-1 ring-blue-400"
                            : "border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/50"}`}
                      >
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                          {item.selection_asset_url
                            ? <RivePet url={item.selection_asset_url} />
                            : <PetPlaceholder />
                          }
                        </div>
                        <span className="text-xs font-medium text-gray-700">{item.display_name}</span>
                        {item.id === pet.pet_catalog_id && (
                          <span className="text-[10px] text-blue-600 font-semibold">Current</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Timeline */}
                {activeTab === "timeline" && (
                  <div className="flex flex-col gap-4">
                    {tlLoading ? (
                      <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                      </div>
                    ) : !timeline || (!timeline.score_series?.length && !timeline.events?.length) ? (
                      <p className="text-sm text-gray-400 text-center py-8">
                        No history yet — log biomarkers daily to build your timeline!
                      </p>
                    ) : (
                      <>
                        {/* Score chart */}
                        {timeline.score_series?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                              Health Score Journey (Last 30 Days)
                            </p>
                            <div className="bg-gray-50 rounded-xl border border-gray-100 p-3">
                              <ResponsiveContainer width="100%" height={180}>
                                <AreaChart data={timeline.score_series} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                                  <defs>
                                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.15} />
                                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#94a3b8" }}
                                    tickFormatter={(d) => { const dt = new Date(d); return `${dt.getMonth()+1}/${dt.getDate()}`; }} />
                                  <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "#94a3b8" }} />
                                  <Tooltip
                                    contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e2e8f0" }}
                                    formatter={(v) => [`${v}/100`, "Score"]}
                                    labelFormatter={(l) => new Date(l).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                  />
                                  {/* Emotion zones */}
                                  <ReferenceArea y1={70} y2={100} fill="#dcfce7" fillOpacity={0.4} />
                                  <ReferenceArea y1={40} y2={70}  fill="#fef3c7" fillOpacity={0.4} />
                                  <ReferenceArea y1={0}  y2={40}  fill="#fee2e2" fillOpacity={0.4} />
                                  <ReferenceLine y={70} stroke="#16a34a" strokeDasharray="4 2" strokeWidth={1} label={{ value: "Happy", position: "right", fontSize: 8, fill: "#16a34a" }} />
                                  <ReferenceLine y={40} stroke="#b45309" strokeDasharray="4 2" strokeWidth={1} label={{ value: "Neutral", position: "right", fontSize: 8, fill: "#b45309" }} />
                                  <Area dataKey="score" stroke="#2563eb" strokeWidth={2}
                                    fill="url(#scoreGrad)" dot={{ r: 3, fill: "#2563eb", strokeWidth: 0 }}
                                    activeDot={{ r: 5 }} />
                                </AreaChart>
                              </ResponsiveContainer>
                              {/* Legend */}
                              <div className="flex gap-4 justify-center mt-1">
                                {[
                                  { color: "bg-green-200", label: "Happy (70–100)" },
                                  { color: "bg-yellow-200", label: "Neutral (40–69)" },
                                  { color: "bg-red-200",   label: "Sad (0–39)" },
                                ].map(({ color, label }) => (
                                  <div key={label} className="flex items-center gap-1">
                                    <div className={`w-2.5 h-2.5 rounded-sm ${color}`} />
                                    <span className="text-[10px] text-gray-500">{label}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* State change events */}
                        {(() => {
                          const changes = (timeline.events || []).filter(
                            (e) => e.previous_emotion !== e.new_emotion
                          ).reverse();
                          if (!changes.length) return (
                            <p className="text-xs text-gray-400 text-center py-4">
                              No mood changes yet in this period.
                            </p>
                          );
                          const EMO_COLORS = {
                            happy:   { bg: "bg-green-50 border-green-200",  bar: "bg-green-500",  txt: "text-green-700",  dot: "bg-green-500"  },
                            neutral: { bg: "bg-yellow-50 border-yellow-200", bar: "bg-yellow-500", txt: "text-yellow-700", dot: "bg-yellow-500" },
                            sad:     { bg: "bg-red-50 border-red-200",      bar: "bg-red-500",    txt: "text-red-700",    dot: "bg-red-500"    },
                          };
                          return (
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                Mood Changes — {changes.length} event{changes.length !== 1 ? "s" : ""}
                              </p>
                              <div className="flex flex-col gap-2">
                                {changes.map((e, idx) => {
                                  const nc  = EMO_COLORS[e.new_emotion]  || EMO_COLORS.neutral;
                                  const pc  = EMO_COLORS[e.previous_emotion] || EMO_COLORS.neutral;
                                  const ts  = new Date(e.created_at);
                                  const dateLabel = ts.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                                  const breakdown = e.input_snapshot?.breakdown || [];
                                  const topReasons = breakdown
                                    .sort((a, b) => b.score - a.score)
                                    .slice(0, 2);
                                  const catEntry = catalog.find((c) => c.id === pet?.pet_catalog_id);
                                  const petAssetUrl = catEntry?.selection_asset_url || pet?.riv_url;
                                  const EMO_EMOJI = { happy: "😊", neutral: "😐", sad: "😢" };
                                  return (
                                    <div key={idx} className={`rounded-xl border p-3 ${nc.bg}`}>
                                      <div className="flex gap-3">
                                        {/* Pet image */}
                                        {petAssetUrl && (
                                          <div className="relative flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-white/60 border border-white/80 shadow-sm">
                                            <RivePet url={petAssetUrl} />
                                            <span className="absolute bottom-0.5 right-0.5 text-[13px] leading-none">
                                              {EMO_EMOJI[e.new_emotion] || "🐾"}
                                            </span>
                                          </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2">
                                              {/* Transition pills */}
                                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-white border ${pc.txt} border-current capitalize`}>
                                                {e.previous_emotion}
                                              </span>
                                              <span className="text-gray-400 text-xs">→</span>
                                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${nc.bar} text-white capitalize`}>
                                                {e.new_emotion}
                                              </span>
                                            </div>
                                            <span className="text-xs text-gray-400">{dateLabel}</span>
                                          </div>
                                          {/* Score bar */}
                                          <div className="flex items-center gap-2 mb-2">
                                            <span className={`text-sm font-black ${nc.txt}`}>
                                              {Math.round(e.final_score)}/100
                                            </span>
                                            <div className="flex-1 bg-white/70 rounded-full h-1.5">
                                              <div className={`h-1.5 rounded-full ${nc.bar}`}
                                                   style={{ width: `${e.final_score}%` }} />
                                            </div>
                                          </div>
                                          {/* Top biomarker reasons */}
                                          {topReasons.length > 0 && (
                                            <div className="flex flex-col gap-0.5">
                                              {topReasons.map((b) => (
                                                <div key={b.biomarker_type} className="flex items-center gap-1.5">
                                                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                                    b.score >= 16 ? "bg-green-500" : b.score >= 10 ? "bg-yellow-500" : "bg-red-400"
                                                  }`} />
                                                  <span className="text-[11px] text-gray-600">
                                                    <span className="font-medium capitalize">{b.biomarker_type.replace(/_/g, " ")}</span>
                                                    {" "}— {b.reason} ({Math.round(b.score)}/20)
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
                {activeTab === "score" && score && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-700">Today's Breakdown</span>
                      <span className={`text-2xl font-black ${scoreMeta.color}`}>
                        {score.score.toFixed(0)}/100
                      </span>
                    </div>
                    {score.breakdown.map((b) => (
                      <div key={b.biomarker_type} className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium text-gray-700 capitalize">
                            {b.biomarker_type.replace(/_/g, " ")}
                          </span>
                          <div className="flex items-center gap-2">
                            {b.value != null && (
                              <span className="text-xs text-gray-400">{b.value}</span>
                            )}
                            <span className={`text-xs font-bold ${
                              b.score >= 16 ? "text-green-600" : b.score >= 10 ? "text-yellow-600" : "text-red-500"
                            }`}>
                              {b.score.toFixed(0)}/20
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${
                              b.score >= 16 ? "bg-green-500" : b.score >= 10 ? "bg-yellow-500" : "bg-red-400"
                            }`}
                            style={{ width: `${(b.score / 20) * 100}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1">{b.reason}</p>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "score" && !score && (
                  <p className="text-sm text-gray-400 text-center py-8">
                    No score data yet. Log some biomarkers first!
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleProtection>
  );
}

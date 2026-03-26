"use client";

import { useEffect, useRef, useState } from "react";
import { useRive, Layout, Fit, Alignment } from "@rive-app/react-canvas";
import { getMyPet, customizePet, getPetCatalog, selectPet } from "@/services/api_calls";
import ShareHealthCard from "@/components/ShareHealthCard";

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

const EMOTION_STYLE = {
  happy:   { ring: "ring-green-400",  badge: "bg-green-500",  label: "Happy"   },
  neutral: { ring: "ring-yellow-400", badge: "bg-yellow-500", label: "Neutral" },
  sad:     { ring: "ring-blue-400",   badge: "bg-blue-500",   label: "Sad"     },
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
  if (!url) return null;
  return <RiveComponent className="w-full h-full" />;
}

export default function PetWidget() {
  const [pet, setPet]             = useState(null);
  const [loading, setLoading]     = useState(true);
  const [open, setOpen]           = useState(false);
  const [tab, setTab]             = useState("pet");
  const [sharing, setSharing]     = useState(false);
  const [petSnap, setPetSnap]     = useState(null);
  const petCanvasRef              = useRef(null);
  const [catalog, setCatalog]     = useState([]);
  const [petName, setPetName]     = useState("");
  const [nameError, setNameError] = useState("");
  const [saving, setSaving]       = useState(false);

  const fetchPet = async () => {
    try {
      const data = await getMyPet();
      setPet(data);
      setPetName(data.pet_name || "");
    } catch {
      setPet(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPet(); }, []);

  const openCatalog = async () => {
    setTab("change");
    if (catalog.length === 0) {
      try { setCatalog(await getPetCatalog()); } catch { /* ignore */ }
    }
  };

  const handleSelectPet = async (petKey) => {
    setSaving(true);
    try {
      setPet(await selectPet(petKey));
      setTab("pet");
    } finally { setSaving(false); }
  };

  const handleSaveName = async () => {
    if (!/^[A-Za-z0-9 ]{1,15}$/.test(petName.trim())) {
      setNameError("Max 15 chars, letters & numbers only");
      return;
    }
    setNameError("");
    setSaving(true);
    try { setPet(await customizePet({ pet_name: petName.trim() })); }
    finally { setSaving(false); }
  };

  const handleSaveBackground = async (bg) => {
    try { setPet(await customizePet({ background_theme: bg })); } catch { /* ignore */ }
  };

  const handleSaveColor = async (cv) => {
    try { setPet(await customizePet({ color_variant: cv })); } catch { /* ignore */ }
  };

  const emo   = EMOTION_STYLE[pet?.current_emotion || "neutral"];
  const score = pet?.current_score ?? 0;

  if (loading) return null;

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-1 group"
          title="My Pet"
        >
          <div className={`relative w-20 h-20 rounded-2xl bg-white shadow-2xl ring-4 ${emo.ring} overflow-hidden transition-transform group-hover:scale-105`}>
            {pet?.riv_url
              ? <RivePet url={pet.riv_url} />
              : pet?.image_url
              ? <RivePet url={pet.image_url} />
              : <div className="w-full h-full flex items-center justify-center text-3xl bg-gray-50">🐾</div>
            }
            <span className={`absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${emo.badge}`} />
          </div>
          <span className="text-xs font-semibold text-gray-700 bg-white/90 shadow rounded-full px-2 py-0.5">
            {Number(score).toFixed(0)}/100
          </span>
        </button>
      )}

      {/* Share Modal */}
      {sharing && (
        <ShareHealthCard pet={pet} score={score} petImageDataUrl={petSnap} onClose={() => setSharing(false)} />
      )}

      {/* Panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-80 rounded-2xl overflow-hidden shadow-2xl border border-gray-200 flex flex-col bg-white"
             style={{ maxHeight: "88vh" }}>

          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white drop-shadow">
                {pet?.pet_name || pet?.display_name || "My Pet"}
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full text-white ${emo.badge}`}>
                {emo.label}
              </span>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white text-lg leading-none">✕</button>
          </div>

          {/* Tabs */}
          <div className="flex bg-white border-b border-gray-200">
            {[
              { key: "pet",       label: "Pet"       },
              { key: "customize", label: "Customize"  },
              { key: "change",    label: "Switch"     },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setTab(key); if (key === "change") openCatalog(); }}
                className={`flex-1 py-2 text-xs font-semibold transition-colors border-b-2
                  ${tab === key ? "text-blue-600 border-blue-600 bg-blue-50/50" : "text-gray-500 border-transparent hover:text-gray-700"}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto bg-white">

            {/* ── Pet Tab ── */}
            {tab === "pet" && (
              <div className="flex flex-col items-center p-4 gap-3">
                <div className={`relative w-44 h-44 rounded-2xl overflow-hidden ring-4 ${emo.ring} bg-gray-100`}>
                  {pet?.riv_url
                    ? <RivePet url={pet.riv_url} onCanvas={(c) => { petCanvasRef.current = c; }} />
                    : <div className="w-full h-full flex items-center justify-center text-6xl">🐾</div>
                  }
                </div>

                <div className="text-center">
                  <p className={`text-4xl font-black ${score >= 70 ? "text-green-600" : score >= 40 ? "text-yellow-600" : "text-blue-600"}`}>
                    {Number(score).toFixed(0)}
                    <span className="text-lg font-medium text-gray-400">/100</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Today's Health Score</p>
                </div>

                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${score >= 70 ? "bg-green-500" : score >= 40 ? "bg-yellow-500" : "bg-blue-500"}`}
                    style={{ width: `${score}%` }}
                  />
                </div>

                <p className="text-xs text-gray-500 text-center px-2">
                  {pet?.current_emotion === "happy"
                    ? `${pet?.pet_name || "Your pet"} is thriving! Keep it up!`
                    : pet?.current_emotion === "neutral"
                    ? `${pet?.pet_name || "Your pet"} is doing okay. Keep going!`
                    : `${pet?.pet_name || "Your pet"} needs your attention. Log your health data!`}
                </p>

                {pet?.streak_days > 0 && (
                  <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-full px-3 py-1">
                    <span className="text-sm">🔥</span>
                    <span className="text-xs font-semibold text-orange-600">
                      {pet.streak_days}-day streak
                    </span>
                    {!pet.accessory_unlocked && pet.streak_days < 7 && (
                      <span className="text-xs text-orange-400">· {7 - pet.streak_days}d left</span>
                    )}
                    {pet.accessory_unlocked && (
                      <span className="text-xs text-green-600">· Unlocked!</span>
                    )}
                  </div>
                )}

                <button
                  onClick={() => {
                    try {
                      const snap = petCanvasRef.current?.toDataURL("image/png") || null;
                      setPetSnap(snap);
                    } catch { setPetSnap(null); }
                    setSharing(true);
                  }}
                  className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow transition-all"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-3.5 h-3.5" strokeWidth={2}>
                    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Share Status
                </button>
              </div>
            )}

            {/* ── Customize Tab ── */}
            {tab === "customize" && (
              <div className="p-4 flex flex-col gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Pet Name</label>
                  <div className="flex gap-2">
                    <input
                      value={petName}
                      onChange={(e) => { setPetName(e.target.value); setNameError(""); }}
                      maxLength={15}
                      placeholder="e.g. Buddy"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleSaveName}
                      disabled={saving}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 rounded-lg disabled:opacity-50"
                    >
                      Save
                    </button>
                  </div>
                  {nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-2">Color Variant</label>
                  <div className="flex gap-2">
                    {COLORS.map((c) => (
                      <button
                        key={c.key}
                        onClick={() => handleSaveColor(c.key)}
                        className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all flex flex-col items-center gap-1
                          ${pet?.color_variant === c.key
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300"}`}
                      >
                        <div className={`w-4 h-4 rounded-full ${c.dot}`} />
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-2">Background</label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {BACKGROUNDS.map((b) => (
                      <button
                        key={b.key}
                        onClick={() => handleSaveBackground(b.key)}
                        className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg border transition-all
                          ${pet?.background_theme === b.key
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 bg-gray-50 hover:border-gray-300"}`}
                      >
                        <span className="text-base">{b.emoji}</span>
                        <span className="text-[10px] text-gray-500">{b.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                  <p className="text-xs font-semibold text-gray-600 mb-1">Accessories</p>
                  {pet?.accessory_unlocked
                    ? <p className="text-xs text-green-600">🎉 Accessories unlocked!</p>
                    : <p className="text-xs text-gray-400">
                        Reach a 7-day goal streak to unlock accessories.
                        {pet?.streak_days > 0 && ` (${pet.streak_days}/7)`}
                      </p>
                  }
                </div>
              </div>
            )}

            {/* ── Switch Tab ── */}
            {tab === "change" && (
              <div className="p-3 grid grid-cols-2 gap-2">
                {catalog.map((item) => (
                  <button
                    key={item.pet_key}
                    onClick={() => handleSelectPet(item.pet_key)}
                    disabled={saving || item.id === pet?.pet_catalog_id}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all
                      ${item.id === pet?.pet_catalog_id
                        ? "border-blue-500 bg-blue-50 ring-1 ring-blue-400"
                        : "border-gray-200 bg-gray-50 hover:border-blue-300"}`}
                  >
                    <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden">
                      {item.selection_asset_url
                        ? <RivePet url={item.selection_asset_url} />
                        : <div className="w-full h-full flex items-center justify-center text-2xl">🐾</div>
                      }
                    </div>
                    <span className="text-xs font-medium text-gray-700">{item.display_name}</span>
                    {item.id === pet?.pet_catalog_id && (
                      <span className="text-[10px] text-blue-600 font-semibold">Current</span>
                    )}
                  </button>
                ))}
                {catalog.length === 0 && (
                  <div className="col-span-2 text-center text-xs text-gray-400 py-6">Loading...</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useRive, Layout, Fit, Alignment } from "@rive-app/react-canvas";
import { getMyPet } from "@/services/api_calls";
import ShareHealthCard from "@/components/ShareHealthCard";

const EMOTION_STYLE = {
  happy:   { ring: "ring-emerald-500/60",  badge: "bg-emerald-500",  label: "Happy",   scoreColor: "text-emerald-400",  barColor: "bg-emerald-500"  },
  neutral: { ring: "ring-amber-500/60",    badge: "bg-amber-500",    label: "Neutral", scoreColor: "text-amber-400",    barColor: "bg-amber-500"    },
  sad:     { ring: "ring-indigo-500/60",   badge: "bg-indigo-500",   label: "Sad",     scoreColor: "text-indigo-400",   barColor: "bg-indigo-500"   },
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
  const router        = useRouter();
  const [pet,     setPet]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [open,    setOpen]    = useState(false);
  const [sharing, setSharing] = useState(false);
  const [petSnap, setPetSnap] = useState(null);
  const petCanvasRef          = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getMyPet();
        setPet(data);
      } catch {
        setPet(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
          <div className={`relative w-20 h-20 rounded-2xl bg-[#0d1525] border border-white/[0.1] shadow-2xl ring-2 ${emo.ring} overflow-hidden transition-transform group-hover:scale-105`}>
            {pet?.riv_url
              ? <RivePet url={pet.riv_url} />
              : pet?.image_url
              ? <RivePet url={pet.image_url} />
              : <div className="w-full h-full flex items-center justify-center text-3xl">🐾</div>
            }
            <span className={`absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full border-2 border-[#0d1525] ${emo.badge}`} />
          </div>
          <span className="text-xs font-semibold text-white/60 bg-[#0d1525]/90 border border-white/[0.08] shadow rounded-full px-2 py-0.5">
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
        <div
          className="fixed bottom-6 right-6 z-50 w-72 rounded-2xl overflow-hidden shadow-2xl border border-white/[0.1] flex flex-col"
          style={{ background: "#0d1525" }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 flex items-center justify-between border-b border-white/[0.08]"
            style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(139,92,246,0.12) 100%)" }}
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
              <span className="text-sm font-bold text-white/90">
                {pet?.pet_name || pet?.display_name || "My Pet"}
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full text-white ${emo.badge}`}>
                {emo.label}
              </span>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white/80 text-lg leading-none transition-colors">✕</button>
          </div>

          {/* Pet view */}
          <div className="flex flex-col items-center p-4 gap-3">

            {/* Pet animation */}
            <div className={`relative w-40 h-40 rounded-2xl overflow-hidden ring-2 ${emo.ring} bg-white/[0.04] border border-white/[0.07]`}>
              {pet?.riv_url
                ? <RivePet url={pet.riv_url} onCanvas={(c) => { petCanvasRef.current = c; }} />
                : <div className="w-full h-full flex items-center justify-center text-6xl">🐾</div>
              }
            </div>

            {/* Score */}
            <div className="text-center">
              <p className={`text-4xl font-black ${emo.scoreColor}`}>
                {Number(score).toFixed(0)}
                <span className="text-lg font-medium text-white/25">/100</span>
              </p>
              <p className="text-xs text-white/30 mt-0.5">Today's Health Score</p>
            </div>

            {/* Score bar */}
            <div className="w-full bg-white/[0.06] rounded-full h-1.5">
              <div className={`h-1.5 rounded-full transition-all ${emo.barColor}`} style={{ width: `${score}%` }} />
            </div>

            {/* Mood message */}
            <p className="text-xs text-white/35 text-center px-1">
              {pet?.current_emotion === "happy"
                ? `${pet?.pet_name || "Your pet"} is thriving! Keep it up!`
                : pet?.current_emotion === "neutral"
                ? `${pet?.pet_name || "Your pet"} is doing okay. Keep going!`
                : `${pet?.pet_name || "Your pet"} needs your attention. Log your health data!`}
            </p>

            {/* Streak */}
            {pet?.streak_days > 0 && (
              <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full px-3 py-1">
                <span className="text-sm">🔥</span>
                <span className="text-xs font-semibold text-orange-400">{pet.streak_days}-day streak</span>
                {!pet.accessory_unlocked && pet.streak_days < 7 && (
                  <span className="text-xs text-orange-500/50">· {7 - pet.streak_days}d left</span>
                )}
                {pet.accessory_unlocked && (
                  <span className="text-xs text-emerald-400">· Unlocked!</span>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="w-full flex flex-col gap-2 pt-1">
              {/* Share */}
              <button
                onClick={() => {
                  try { setPetSnap(petCanvasRef.current?.toDataURL("image/png") || null); }
                  catch { setPetSnap(null); }
                  setSharing(true);
                }}
                className="flex items-center justify-center gap-2 bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-3.5 h-3.5" strokeWidth={2}>
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Share Status
              </button>

              {/* Go to pet page */}
              <button
                onClick={() => { setOpen(false); router.push("/dashboard/patient/pet"); }}
                className="flex items-center justify-center gap-2 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] text-white/55 hover:text-white/80 text-xs font-semibold px-4 py-2 rounded-xl transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Customize & Switch Pet
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

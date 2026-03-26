"use client";

import { useState, useCallback } from "react";

// ─── Colour maps (shared by preview + canvas generator) ──────────────────────
const BG_COLOR = {
  space: "#312e81", beach: "#bae6fd", garden: "#fbcfe8", home: "#fde68a", park: "#bbf7d0",
};
const TOP_COLOR = {
  space: "#1e1b4b", beach: "#7dd3fc", garden: "#f9a8d4", home: "#fcd34d", park: "#4ade80",
};
const EMO_MAP = {
  happy:   { emoji: "😊", label: "Happy",   bar: "#16a34a", badgeBg: "#dcfce7", badgeText: "#14532d" },
  neutral: { emoji: "😐", label: "Neutral",  bar: "#ca8a04", badgeBg: "#fef9c3", badgeText: "#713f12" },
  sad:     { emoji: "😢", label: "Sad",      bar: "#2563eb", badgeBg: "#dbeafe", badgeText: "#1e3a8a" },
};

// ─── Canvas 2D card generator ─────────────────────────────────────────────────
// Generates a 1080×1080 PNG with the actual Rive pet frame (or emoji fallback).
async function buildCardCanvas(pet, scoreNum, petImageDataUrl) {
  const W = 1080, H = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  const theme   = pet?.background_theme || "park";
  const emotion = pet?.current_emotion  || "neutral";
  const name    = (pet?.pet_name || pet?.display_name || "My Pet").slice(0, 20);
  const bg      = BG_COLOR[theme]  || BG_COLOR.park;
  const topBg   = TOP_COLOR[theme] || TOP_COLOR.park;
  const emo     = EMO_MAP[emotion] || EMO_MAP.neutral;
  const isDark  = theme === "space";
  const textMain  = isDark ? "#ffffff" : "#111827";
  const textMuted = isDark ? "#c7d2fe" : "#6b7280";
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  // Rounded rect helper
  const rr = (x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y,     x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x,     y + h, r);
    ctx.arcTo(x,     y + h, x,     y,     r);
    ctx.arcTo(x,     y,     x + w, y,     r);
    ctx.closePath();
  };

  // ── Background ──────────────────────────────────────────────────────────────
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ── Top bar ─────────────────────────────────────────────────────────────────
  ctx.fillStyle = topBg;
  ctx.fillRect(0, 0, W, 118);

  // Logo square
  ctx.fillStyle = "#2563eb";
  rr(52, 30, 58, 58, 14); ctx.fill();
  ctx.fillStyle = "white";
  ctx.beginPath(); ctx.arc(81, 59, 11, 0, Math.PI * 2); ctx.fill();

  // "Pulse"
  ctx.fillStyle = "white";
  ctx.font = "bold 44px Arial";
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillText("Pulse", 126, 59);

  // Date
  ctx.fillStyle = isDark ? "#a5b4fc" : "rgba(55,65,81,0.85)";
  ctx.font = "26px Arial";
  ctx.textAlign = "right";
  ctx.fillText(today, W - 52, 59);

  // ── "MEET MY COMPANION" ──────────────────────────────────────────────────────
  ctx.fillStyle = textMuted;
  ctx.font = "bold 20px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("MEET MY COMPANION", W / 2, 162);

  // ── Pet name ─────────────────────────────────────────────────────────────────
  ctx.fillStyle = textMain;
  ctx.font = "bold 86px Arial";
  ctx.fillText(name, W / 2, 258);

  // ── Pet image box ─────────────────────────────────────────────────────────────
  const petX = W / 2 - 115, petY = 298, petSz = 230;
  ctx.fillStyle = "white";
  rr(petX, petY, petSz, petSz, 50); ctx.fill();

  if (petImageDataUrl) {
    try {
      const img = new Image();
      img.src = petImageDataUrl;
      await new Promise((res) => { img.onload = res; img.onerror = res; });
      ctx.save();
      rr(petX, petY, petSz, petSz, 50);
      ctx.clip();
      ctx.drawImage(img, petX, petY, petSz, petSz);
      ctx.restore();
    } catch { /* fall through to emoji */ }
  }

  if (!petImageDataUrl) {
    ctx.font = "120px Arial";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText(emo.emoji, W / 2, petY + petSz / 2);
  }

  // ── Score card ───────────────────────────────────────────────────────────────
  const cX = 52, cY = 562, cW = W - 104, cH = 320;
  ctx.fillStyle = "white";
  rr(cX, cY, cW, cH, 36); ctx.fill();

  // "Daily Health Score" label
  ctx.fillStyle = "#374151";
  ctx.font = "bold 28px Arial";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("Daily Health Score", cX + 44, cY + 50);

  // Emotion badge
  ctx.font = "bold 22px Arial";
  const bLabel = emo.label;
  const bW = ctx.measureText(bLabel).width + 44;
  const bH = 42, bX = cX + cW - 44 - bW, bY = cY + 29;
  ctx.fillStyle = emo.badgeBg;
  rr(bX, bY, bW, bH, 21); ctx.fill();
  ctx.fillStyle = emo.badgeText;
  ctx.textAlign = "center";
  ctx.fillText(bLabel, bX + bW / 2, bY + bH / 2);

  // Score number
  ctx.fillStyle = "#111827";
  ctx.font = "bold 132px Arial";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(scoreNum.toFixed(0), cX + 44, cY + 216);

  // /100
  const numW = ctx.measureText(scoreNum.toFixed(0)).width;
  ctx.fillStyle = "#9ca3af";
  ctx.font = "42px Arial";
  ctx.fillText("/100", cX + 44 + numW + 8, cY + 204);

  // Bar track
  const bTrackX = cX + 44, bTrackY = cY + 244, bTrackW = cW - 88, bTrackH = 22;
  ctx.fillStyle = "#e5e7eb";
  rr(bTrackX, bTrackY, bTrackW, bTrackH, 11); ctx.fill();

  // Bar fill
  ctx.fillStyle = emo.bar;
  rr(bTrackX, bTrackY, Math.max((scoreNum / 100) * bTrackW, 10), bTrackH, 11);
  ctx.fill();

  // ── Tagline ───────────────────────────────────────────────────────────────────
  ctx.fillStyle = textMuted;
  ctx.font = "22px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Track your health · Keep your pet happy · getpulse.app", W / 2, 932);

  return canvas;
}


// ─── Preview card (CSS-only, display in modal) ────────────────────────────────
function PreviewCard({ pet, score, petImageDataUrl }) {
  const scoreNum  = Number(score ?? pet?.current_score ?? 0);
  const theme     = pet?.background_theme || "park";
  const emotion   = pet?.current_emotion  || "neutral";
  const bg        = BG_COLOR[theme]  || BG_COLOR.park;
  const topBg     = TOP_COLOR[theme] || TOP_COLOR.park;
  const emo       = EMO_MAP[emotion] || EMO_MAP.neutral;
  const isDark    = theme === "space";
  const textMain  = isDark ? "#fff" : "#111827";
  const textMuted = isDark ? "#c7d2fe" : "#6b7280";
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <div style={{ width: 400, height: 400, backgroundColor: bg, borderRadius: 24, overflow: "hidden", fontFamily: "Arial, Helvetica, sans-serif", display: "flex", flexDirection: "column", flexShrink: 0 }}>
      {/* Top bar */}
      <div style={{ backgroundColor: topBg, padding: "12px 18px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <div style={{ width: 26, height: 26, backgroundColor: "#2563eb", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <div style={{ width: 9, height: 9, backgroundColor: "white", borderRadius: "50%" }} />
        </div>
        <span style={{ color: "white", fontWeight: 700, fontSize: 15 }}>Pulse</span>
        <span style={{ color: isDark ? "#a5b4fc" : "rgba(255,255,255,0.8)", fontSize: 11, marginLeft: "auto" }}>{today}</span>
      </div>
      {/* Name */}
      <div style={{ textAlign: "center", padding: "14px 20px 0", flexShrink: 0 }}>
        <p style={{ margin: 0, fontSize: 10, color: textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>Meet my companion</p>
        <p style={{ margin: "5px 0 0", fontSize: 24, fontWeight: 900, color: textMain, lineHeight: 1 }}>{pet?.pet_name || pet?.display_name || "My Pet"}</p>
      </div>
      {/* Pet image */}
      <div style={{ width: 96, height: 96, margin: "10px auto", backgroundColor: "white", borderRadius: 18, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, flexShrink: 0 }}>
        {petImageDataUrl
          ? <img src={petImageDataUrl} alt="pet" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          : emo.emoji
        }
      </div>
      {/* Score */}
      <div style={{ padding: "0 16px", flexShrink: 0 }}>
        <div style={{ backgroundColor: "white", borderRadius: 14, padding: "10px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#374151" }}>Daily Health Score</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: emo.badgeText, backgroundColor: emo.badgeBg, padding: "2px 7px", borderRadius: 20 }}>{emo.emoji} {emo.label}</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 2, marginBottom: 6 }}>
            <span style={{ fontSize: 38, fontWeight: 900, color: "#111827", lineHeight: 1 }}>{scoreNum.toFixed(0)}</span>
            <span style={{ fontSize: 12, color: "#9ca3af", paddingBottom: 3 }}>/100</span>
          </div>
          <div style={{ backgroundColor: "#e5e7eb", borderRadius: 99, height: 7 }}>
            <div style={{ width: `${Math.max(scoreNum, 2)}%`, height: 7, backgroundColor: emo.bar, borderRadius: 99 }} />
          </div>
        </div>
      </div>
      <p style={{ textAlign: "center", margin: "8px 20px 0", fontSize: 8, color: textMuted }}>Track your health · Keep your pet happy · getpulse.app</p>
    </div>
  );
}


// ─── Share Modal ───────────────────────────────────────────────────────────────
export default function ShareHealthCard({ pet, score, petImageDataUrl, onClose }) {
  const [status, setStatus]   = useState("idle"); // idle | loading | done | error
  const [copied, setCopied]   = useState(false);

  const scoreNum = Number(score ?? pet?.current_score ?? 0);
  const petName  = pet?.pet_name || pet?.display_name || "my pet";
  const emotion  = pet?.current_emotion || "neutral";
  const appUrl   = "https://getpulse.app";

  const paw   = "\uD83D\uDC3E";
  const smile = "\uD83D\uDE0A";
  const fire  = "\uD83D\uDD25";
  const shareText = `${paw} My Pulse health score today is ${scoreNum.toFixed(0)}/100!\n${petName} is feeling ${emotion} ${smile}\n\n${fire} Track your health and keep your pet happy!\n${appUrl}`;

  // ── Generate the PNG blob from Canvas 2D ─────────────────────────────────────
  const generateBlob = useCallback(async () => {
    setStatus("loading");
    try {
      const canvas = await buildCardCanvas(pet, scoreNum, petImageDataUrl);
      const blob   = await new Promise((res) => canvas.toBlob(res, "image/png"));
      setStatus("done");
      return blob;
    } catch {
      setStatus("error");
      return null;
    }
  }, [pet, scoreNum, petImageDataUrl]);

  const makeFile = (blob) =>
    new File([blob], `pulse-health-${new Date().toISOString().slice(0, 10)}.png`, { type: "image/png" });

  const download = (blob) => {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement("a");
    a.href = url;
    a.download = `pulse-health-${new Date().toISOString().slice(0, 10)}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // ── Try Web Share API with file (mobile native share sheet) ──────────────────
  const nativeShare = async (blob, text) => {
    const file = makeFile(blob);
    if (!navigator.canShare?.({ files: [file] })) return false;
    try {
      await navigator.share({ files: [file], text, title: "My Pulse Health Status" });
      return true;
    } catch { return false; }
  };

  // ── Platform handlers ─────────────────────────────────────────────────────────
  const handleWhatsApp = async () => {
    const blob = await generateBlob();
    if (!blob) return;
    // Mobile: native share sheet attaches image directly to WhatsApp
    const shared = await nativeShare(blob, shareText);
    if (!shared) {
      // Desktop: download card + open WhatsApp with text
      download(blob);
      setTimeout(() => window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank"), 400);
    }
  };

  const handleLinkedIn = async () => {
    const blob = await generateBlob();
    if (!blob) return;
    // Mobile: native share sheet (user can pick LinkedIn)
    const shared = await nativeShare(blob, `My health score: ${scoreNum.toFixed(0)}/100 on Pulse\n${appUrl}`);
    if (!shared) {
      // Desktop: download card + open LinkedIn share
      download(blob);
      setTimeout(() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(appUrl)}`, "_blank"), 400);
    }
  };

  const handleInstagram = async () => {
    const blob = await generateBlob();
    if (!blob) return;
    const shared = await nativeShare(blob, shareText);
    if (!shared) {
      download(blob);
      setTimeout(() => window.open("https://www.instagram.com", "_blank"), 600);
    }
  };

  const handleCopyText = async () => {
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const isLoading = status === "loading";

  const PLATFORMS = [
    {
      key: "whatsapp",
      label: "WhatsApp",
      mobileHint: "Attaches image directly",
      desktopHint: "Downloads card + opens WhatsApp",
      color: "text-green-700",
      border: "border-green-200",
      bg: "bg-green-50 hover:bg-green-100",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-9 h-9 text-green-500">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      ),
      onClick: handleWhatsApp,
    },
    {
      key: "linkedin",
      label: "LinkedIn",
      mobileHint: "Attaches image directly",
      desktopHint: "Downloads card + opens LinkedIn",
      color: "text-blue-700",
      border: "border-blue-200",
      bg: "bg-blue-50 hover:bg-blue-100",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-9 h-9 text-blue-600">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
      onClick: handleLinkedIn,
    },
    {
      key: "instagram",
      label: "Instagram",
      mobileHint: "Attaches image directly",
      desktopHint: "Downloads card + opens Instagram",
      color: "text-pink-600",
      border: "border-pink-200",
      bg: "bg-pink-50 hover:bg-pink-100",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-9 h-9 text-pink-500">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      ),
      onClick: handleInstagram,
    },
  ];

  // Detect mobile for hint text
  const isMobile = typeof navigator !== "undefined" && /Mobi|Android/i.test(navigator.userAgent);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col" style={{ maxHeight: "90vh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">Share Health Status</h2>
            <p className="text-xs text-gray-400 mt-0.5">Show off {petName}'s mood today</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* Preview */}
          <div className="flex justify-center bg-gray-50 border-b border-gray-100" style={{ padding: "20px 0 8px" }}>
            <div style={{ transform: "scale(0.64)", transformOrigin: "top center", width: 400, height: 256, flexShrink: 0 }}>
              <PreviewCard pet={pet} score={score} petImageDataUrl={petImageDataUrl} />
            </div>
          </div>

          {/* Platform buttons */}
          <div className="p-5 flex flex-col gap-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Share to</p>

            {PLATFORMS.map((p) => (
              <button
                key={p.key}
                onClick={p.onClick}
                disabled={isLoading}
                className={`flex items-center gap-4 w-full px-4 py-3.5 rounded-xl border transition-all text-left disabled:opacity-50 disabled:cursor-wait ${p.bg} ${p.border}`}
              >
                {p.icon}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold ${p.color}`}>{p.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {isLoading ? "Generating card…" : isMobile ? p.mobileHint : p.desktopHint}
                  </p>
                </div>
                {isLoading
                  ? <svg className="animate-spin w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={`w-4 h-4 flex-shrink-0 ${p.color}`} strokeWidth={2}>
                      {isMobile
                        ? <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" strokeLinecap="round" strokeLinejoin="round" />
                        : <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" />
                      }
                    </svg>
                }
              </button>
            ))}

            {/* Copy text */}
            <button onClick={handleCopyText}
              className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-all text-left">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5 text-gray-400">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth={2} />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeWidth={2} />
              </svg>
              <p className="text-sm font-medium text-gray-600">{copied ? "✓ Copied!" : "Copy share text"}</p>
            </button>

            <p className="text-center text-xs text-gray-300 pt-1">
              On mobile, image is shared directly via the native share sheet
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

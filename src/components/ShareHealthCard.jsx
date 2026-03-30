"use client";

import { useState, useCallback } from "react";

// ─── Emotion map ──────────────────────────────────────────────────────────────
const EMO_MAP = {
  happy:   { emoji: "😊", label: "Happy",   bar: "#10b981", badgeBg: "rgba(16,185,129,0.15)", badgeText: "#34d399" },
  neutral: { emoji: "😐", label: "Neutral",  bar: "#f59e0b", badgeBg: "rgba(245,158,11,0.15)", badgeText: "#fbbf24" },
  sad:     { emoji: "😢", label: "Sad",      bar: "#6366f1", badgeBg: "rgba(99,102,241,0.15)", badgeText: "#818cf8" },
};

// ─── ECG heartbeat path helper for canvas ────────────────────────────────────
// M22 12h-4l-3 9L9 3l-3 9H2  scaled to fit a given box
function drawEcgIcon(ctx, cx, cy, size) {
  const s = size / 24;
  ctx.save();
  ctx.translate(cx - size / 2, cy - size / 2);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(22, 12);
  ctx.lineTo(18, 12);
  ctx.lineTo(15, 21);
  ctx.lineTo(9, 3);
  ctx.lineTo(6, 12);
  ctx.lineTo(2, 12);
  ctx.restore();
}

// ─── Canvas 2D card generator ─────────────────────────────────────────────────
async function buildCardCanvas(pet, scoreNum, petImageDataUrl) {
  const W = 1080, H = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  const emotion = pet?.current_emotion || "neutral";
  const name    = (pet?.pet_name || pet?.display_name || "My Pet").slice(0, 20);
  const emo     = EMO_MAP[emotion] || EMO_MAP.neutral;
  const today   = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

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
  ctx.fillStyle = "#030712";
  ctx.fillRect(0, 0, W, H);

  // Subtle radial glow
  const grd = ctx.createRadialGradient(W / 2, H * 0.35, 0, W / 2, H * 0.35, W * 0.6);
  grd.addColorStop(0, "rgba(99,102,241,0.12)");
  grd.addColorStop(1, "rgba(3,7,18,0)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);

  // ── Top bar ─────────────────────────────────────────────────────────────────
  ctx.fillStyle = "rgba(255,255,255,0.03)";
  rr(0, 0, W, 118, 0); ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.07)";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, 118); ctx.lineTo(W, 118); ctx.stroke();

  // Logo square (indigo)
  ctx.fillStyle = "#6366f1";
  rr(52, 30, 58, 58, 14); ctx.fill();

  // ECG heartbeat icon in logo
  ctx.strokeStyle = "white";
  ctx.lineWidth = 3;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  drawEcgIcon(ctx, 81, 59, 36);
  ctx.stroke();

  // "Pulse"
  ctx.fillStyle = "white";
  ctx.font = "bold 44px Arial";
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillText("Pulse", 126, 59);

  // Date
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = "26px Arial";
  ctx.textAlign = "right";
  ctx.fillText(today, W - 52, 59);

  // ── "MEET MY COMPANION" ──────────────────────────────────────────────────────
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.font = "bold 20px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("MEET MY COMPANION", W / 2, 162);

  // ── Pet name ─────────────────────────────────────────────────────────────────
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "bold 86px Arial";
  ctx.fillText(name, W / 2, 258);

  // ── Pet image box ─────────────────────────────────────────────────────────────
  const petX = W / 2 - 115, petY = 298, petSz = 230;
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  rr(petX - 2, petY - 2, petSz + 4, petSz + 4, 52); ctx.fill();
  ctx.strokeStyle = "rgba(99,102,241,0.4)";
  ctx.lineWidth = 3;
  rr(petX - 2, petY - 2, petSz + 4, petSz + 4, 52); ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.03)";
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
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  rr(cX, cY, cW, cH, 36); ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  rr(cX, cY, cW, cH, 36); ctx.stroke();

  // "Daily Health Score" label
  ctx.fillStyle = "rgba(255,255,255,0.55)";
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
  ctx.strokeStyle = emo.bar + "50";
  ctx.lineWidth = 1;
  rr(bX, bY, bW, bH, 21); ctx.stroke();
  ctx.fillStyle = emo.badgeText;
  ctx.textAlign = "center";
  ctx.fillText(bLabel, bX + bW / 2, bY + bH / 2);

  // Score number
  ctx.fillStyle = "rgba(255,255,255,0.90)";
  ctx.font = "bold 132px Arial";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(scoreNum.toFixed(0), cX + 44, cY + 216);

  // /100
  const numW = ctx.measureText(scoreNum.toFixed(0)).width;
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.font = "42px Arial";
  ctx.fillText("/100", cX + 44 + numW + 8, cY + 204);

  // Bar track
  const bTrackX = cX + 44, bTrackY = cY + 244, bTrackW = cW - 88, bTrackH = 22;
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  rr(bTrackX, bTrackY, bTrackW, bTrackH, 11); ctx.fill();

  // Bar fill
  ctx.fillStyle = emo.bar;
  rr(bTrackX, bTrackY, Math.max((scoreNum / 100) * bTrackW, 10), bTrackH, 11);
  ctx.fill();

  // ── Tagline ───────────────────────────────────────────────────────────────────
  ctx.fillStyle = "rgba(255,255,255,0.20)";
  ctx.font = "22px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Track your health · Keep your pet happy · getpulse.app", W / 2, 932);

  return canvas;
}


// ─── Preview card (CSS-only) ──────────────────────────────────────────────────
function PreviewCard({ pet, score, petImageDataUrl }) {
  const scoreNum = Number(score ?? pet?.current_score ?? 0);
  const emotion  = pet?.current_emotion || "neutral";
  const emo      = EMO_MAP[emotion] || EMO_MAP.neutral;
  const today    = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <div style={{
      width: 400, height: 400, backgroundColor: "#030712", borderRadius: 24, overflow: "hidden",
      fontFamily: "Arial, Helvetica, sans-serif", display: "flex", flexDirection: "column", flexShrink: 0,
      border: "1px solid rgba(255,255,255,0.08)",
    }}>
      {/* Top bar */}
      <div style={{ backgroundColor: "rgba(255,255,255,0.03)", padding: "10px 16px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ width: 26, height: 26, backgroundColor: "#6366f1", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        </div>
        <span style={{ color: "rgba(255,255,255,0.85)", fontWeight: 700, fontSize: 15 }}>Pulse</span>
        <span style={{ color: "rgba(255,255,255,0.30)", fontSize: 11, marginLeft: "auto" }}>{today}</span>
      </div>
      {/* Name */}
      <div style={{ textAlign: "center", padding: "12px 20px 0", flexShrink: 0 }}>
        <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.25)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>Meet my companion</p>
        <p style={{ margin: "5px 0 0", fontSize: 24, fontWeight: 900, color: "rgba(255,255,255,0.85)", lineHeight: 1 }}>{pet?.pet_name || pet?.display_name || "My Pet"}</p>
      </div>
      {/* Pet image */}
      <div style={{ width: 86, height: 86, margin: "10px auto", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 18, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 42, flexShrink: 0, border: "1px solid rgba(99,102,241,0.35)" }}>
        {petImageDataUrl
          ? <img src={petImageDataUrl} alt="pet" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          : emo.emoji
        }
      </div>
      {/* Score */}
      <div style={{ padding: "0 14px", flexShrink: 0 }}>
        <div style={{ backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 14, padding: "10px 14px", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.45)" }}>Daily Health Score</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: emo.badgeText, backgroundColor: emo.badgeBg, padding: "2px 7px", borderRadius: 20 }}>{emo.emoji} {emo.label}</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 2, marginBottom: 6 }}>
            <span style={{ fontSize: 38, fontWeight: 900, color: "rgba(255,255,255,0.85)", lineHeight: 1 }}>{scoreNum.toFixed(0)}</span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", paddingBottom: 3 }}>/100</span>
          </div>
          <div style={{ backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 99, height: 6 }}>
            <div style={{ width: `${Math.max(scoreNum, 2)}%`, height: 6, backgroundColor: emo.bar, borderRadius: 99 }} />
          </div>
        </div>
      </div>
      <p style={{ textAlign: "center", margin: "8px 20px 0", fontSize: 8, color: "rgba(255,255,255,0.18)" }}>Track your health · Keep your pet happy · getpulse.app</p>
    </div>
  );
}


// ─── Share Modal ───────────────────────────────────────────────────────────────
export default function ShareHealthCard({ pet, score, petImageDataUrl, onClose }) {
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [copied, setCopied] = useState(false);

  const scoreNum = Number(score ?? pet?.current_score ?? 0);
  const petName  = pet?.pet_name || pet?.display_name || "my pet";
  const emotion  = pet?.current_emotion || "neutral";
  const appUrl   = "https://getpulse.app";

  const paw   = "\uD83D\uDC3E";
  const smile = "\uD83D\uDE0A";
  const fire  = "\uD83D\uDD25";
  const shareText = `${paw} My Pulse health score today is ${scoreNum.toFixed(0)}/100!\n${petName} is feeling ${emotion} ${smile}\n\n${fire} Track your health and keep your pet happy!\n${appUrl}`;

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

  const nativeShare = async (blob, text) => {
    const file = makeFile(blob);
    if (!navigator.canShare?.({ files: [file] })) return false;
    try {
      await navigator.share({ files: [file], text, title: "My Pulse Health Status" });
      return true;
    } catch { return false; }
  };

  const handleWhatsApp = async () => {
    const blob = await generateBlob();
    if (!blob) return;
    const shared = await nativeShare(blob, shareText);
    if (!shared) {
      download(blob);
      setTimeout(() => window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank"), 400);
    }
  };

  const handleLinkedIn = async () => {
    const blob = await generateBlob();
    if (!blob) return;
    const shared = await nativeShare(blob, `My health score: ${scoreNum.toFixed(0)}/100 on Pulse\n${appUrl}`);
    if (!shared) {
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
  const isMobile  = typeof navigator !== "undefined" && /Mobi|Android/i.test(navigator.userAgent);

  const PLATFORMS = [
    {
      key: "whatsapp",
      label: "WhatsApp",
      mobileHint: "Attaches image directly",
      desktopHint: "Downloads card + opens WhatsApp",
      color: "text-emerald-300",
      border: "border-emerald-500/30",
      bg: "bg-emerald-500/10 hover:bg-emerald-500/[0.16]",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-9 h-9 text-emerald-400">
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
      color: "text-blue-300",
      border: "border-blue-500/30",
      bg: "bg-blue-500/10 hover:bg-blue-500/[0.16]",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-9 h-9 text-blue-400">
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
      color: "text-pink-300",
      border: "border-pink-500/30",
      bg: "bg-pink-500/10 hover:bg-pink-500/[0.16]",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-9 h-9 text-pink-400">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      ),
      onClick: handleInstagram,
    },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="rounded-2xl shadow-2xl w-full max-w-md flex flex-col border border-white/[0.09]"
           style={{ maxHeight: "90vh", background: "#0d1525" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/80 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-white/85">Share Health Status</h2>
              <p className="text-xs text-white/30 mt-0.5">Show off {petName}'s mood today</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition-colors">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* Preview */}
          <div className="flex justify-center border-b border-white/[0.06] bg-black/20" style={{ padding: "20px 0 8px" }}>
            <div style={{ transform: "scale(0.64)", transformOrigin: "top center", width: 400, height: 256, flexShrink: 0 }}>
              <PreviewCard pet={pet} score={score} petImageDataUrl={petImageDataUrl} />
            </div>
          </div>

          {/* Platform buttons */}
          <div className="p-5 flex flex-col gap-3">
            <p className="text-xs font-semibold text-white/25 uppercase tracking-wide">Share to</p>

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
                  <p className="text-xs text-white/45 mt-0.5">
                    {isLoading ? "Generating card…" : isMobile ? p.mobileHint : p.desktopHint}
                  </p>
                </div>
                {isLoading
                  ? <svg className="animate-spin w-4 h-4 text-white/30 flex-shrink-0" fill="none" viewBox="0 0 24 24">
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
              className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] transition-all text-left">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5 text-white/30">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth={2} />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeWidth={2} />
              </svg>
              <p className="text-sm font-medium text-white/45">{copied ? "✓ Copied!" : "Copy share text"}</p>
            </button>

            <p className="text-center text-xs text-white/15 pt-1">
              On mobile, image is shared directly via the native share sheet
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

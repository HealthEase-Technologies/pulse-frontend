import { ImageResponse } from "next/og";

export const runtime = "edge";

const BG = {
  space:  "#312e81",
  beach:  "#bae6fd",
  garden: "#fbcfe8",
  home:   "#fde68a",
  park:   "#bbf7d0",
};

const BAR_BG = {
  space:  "#1e1b4b",
  beach:  "#93c5fd",
  garden: "#f9a8d4",
  home:   "#fcd34d",
  park:   "#4ade80",
};

const EMO = {
  happy:   { emoji: "😊", label: "Happy",   bar: "#16a34a", badgeBg: "#dcfce7", badgeText: "#14532d" },
  neutral: { emoji: "😐", label: "Neutral",  bar: "#ca8a04", badgeBg: "#fef9c3", badgeText: "#713f12" },
  sad:     { emoji: "😢", label: "Sad",      bar: "#2563eb", badgeBg: "#dbeafe", badgeText: "#1e3a8a" },
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const name    = (searchParams.get("name")    || "My Pet").slice(0, 20);
  const score   = Math.min(100, Math.max(0, parseInt(searchParams.get("score") || "0", 10)));
  const emotion = searchParams.get("emotion") || "neutral";
  const theme   = searchParams.get("theme")   || "park";

  const today = new Date().toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });

  const bg    = BG[theme]    || BG.park;
  const topBg = BAR_BG[theme] || BAR_BG.park;
  const emo   = EMO[emotion]  || EMO.neutral;

  const isDark    = theme === "space";
  const textMain  = isDark ? "#ffffff" : "#111827";
  const textMuted = isDark ? "#c7d2fe" : "#6b7280";
  const brandText = isDark ? "#a5b4fc" : "#374151";

  return new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 1080,
          backgroundColor: bg,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ── Branding bar ── */}
        <div
          style={{
            backgroundColor: topBg,
            padding: "32px 52px",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {/* Logo */}
          <div
            style={{
              width: 58,
              height: 58,
              backgroundColor: "#2563eb",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 16,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                backgroundColor: "white",
                borderRadius: "50%",
              }}
            />
          </div>
          <span style={{ color: "white", fontWeight: 800, fontSize: 44, lineHeight: 1 }}>
            Pulse
          </span>
          <span
            style={{
              color: brandText,
              fontSize: 28,
              marginLeft: "auto",
              opacity: 0.8,
            }}
          >
            {today}
          </span>
        </div>

        {/* ── Pet name ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "48px 52px 0",
          }}
        >
          <span
            style={{
              fontSize: 22,
              color: textMuted,
              fontWeight: 700,
              letterSpacing: 4,
              textTransform: "uppercase",
            }}
          >
            Meet my companion
          </span>
          <span
            style={{
              fontSize: 88,
              fontWeight: 900,
              color: textMain,
              marginTop: 10,
              lineHeight: 1,
            }}
          >
            {name}
          </span>
        </div>

        {/* ── Emoji box ── */}
        <div
          style={{
            width: 220,
            height: 220,
            backgroundColor: "white",
            borderRadius: 48,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 120,
            alignSelf: "center",
            marginTop: 36,
          }}
        >
          {emo.emoji}
        </div>

        {/* ── Score card ── */}
        <div
          style={{
            margin: "36px 52px 0",
            backgroundColor: "white",
            borderRadius: 36,
            padding: "32px 44px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Label row */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 18,
            }}
          >
            <span style={{ fontSize: 30, fontWeight: 700, color: "#374151" }}>
              Daily Health Score
            </span>
            <div
              style={{
                backgroundColor: emo.badgeBg,
                borderRadius: 40,
                padding: "8px 24px",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 26, marginRight: 8 }}>{emo.emoji}</span>
              <span style={{ fontSize: 26, fontWeight: 700, color: emo.badgeText }}>
                {emo.label}
              </span>
            </div>
          </div>

          {/* Number */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-end",
              marginBottom: 20,
            }}
          >
            <span style={{ fontSize: 128, fontWeight: 900, color: "#111827", lineHeight: 1 }}>
              {score}
            </span>
            <span style={{ fontSize: 44, color: "#9ca3af", paddingBottom: 14, marginLeft: 8 }}>
              /100
            </span>
          </div>

          {/* Progress bar track */}
          <div
            style={{
              width: "100%",
              height: 22,
              backgroundColor: "#e5e7eb",
              borderRadius: 99,
              display: "flex",
            }}
          >
            {/* Progress bar fill */}
            <div
              style={{
                width: `${Math.max(score, 2)}%`,
                height: 22,
                backgroundColor: emo.bar,
                borderRadius: 99,
              }}
            />
          </div>
        </div>

        {/* ── Tagline ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "24px 52px 0",
          }}
        >
          <span style={{ fontSize: 24, color: textMuted, fontWeight: 500 }}>
            Track your health · Keep your pet happy · getpulse.app
          </span>
        </div>
      </div>
    ),
    { width: 1080, height: 1080 }
  );
}

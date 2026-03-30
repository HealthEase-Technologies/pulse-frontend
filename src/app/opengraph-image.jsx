import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#030712",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow blob */}
        <div
          style={{
            position: "absolute",
            top: 80,
            left: "50%",
            transform: "translateX(-50%)",
            width: 600,
            height: 300,
            background:
              "radial-gradient(ellipse, rgba(99,102,241,0.35) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />

        {/* Bottom glow */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            left: "50%",
            transform: "translateX(-50%)",
            width: 400,
            height: 200,
            background:
              "radial-gradient(ellipse, rgba(6,106,171,0.2) 0%, transparent 70%)",
            filter: "blur(50px)",
          }}
        />

        {/* Icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 80,
            height: 80,
            borderRadius: 20,
            background: "rgba(99,102,241,0.15)",
            border: "1px solid rgba(99,102,241,0.3)",
            marginBottom: 28,
          }}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6366f1"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        </div>

        {/* Wordmark */}
        <div
          style={{
            fontSize: 80,
            fontWeight: 400,
            color: "#ffffff",
            letterSpacing: "-2px",
            marginBottom: 16,
            fontFamily: "serif",
          }}
        >
          Pulse
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 26,
            color: "rgba(255,255,255,0.5)",
            textAlign: "center",
            maxWidth: 600,
            lineHeight: 1.5,
            marginBottom: 40,
          }}
        >
          All your health data,{" "}
          <span style={{ color: "rgba(255,255,255,0.85)", fontStyle: "italic" }}>
            finally in one place.
          </span>
        </div>

        {/* Divider */}
        <div
          style={{
            width: 480,
            height: 1,
            background:
              "linear-gradient(to right, transparent, rgba(255,255,255,0.12), transparent)",
            marginBottom: 28,
          }}
        />

        {/* Bottom row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            color: "rgba(255,255,255,0.3)",
            fontSize: 16,
          }}
        >
          <span>getpulse.app</span>
          <span style={{ color: "rgba(99,102,241,0.5)" }}>·</span>
          <span>Real-Time Health Monitoring</span>
          <span style={{ color: "rgba(99,102,241,0.5)" }}>·</span>
          <span>HealthEase Technologies LLC</span>
        </div>
      </div>
    ),
    { ...size }
  );
}

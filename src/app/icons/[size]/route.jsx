import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";

export const runtime = "edge";

const ALLOWED = new Set(["192", "512"]);

export async function GET(request, { params }) {
  const size = params.size;

  if (!ALLOWED.has(size)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const dim = parseInt(size, 10);
  const iconSize = dim === 192 ? 96 : 256;
  const strokeWidth = dim === 192 ? 2 : 1.8;
  const radius = dim === 192 ? 48 : 120;

  return new ImageResponse(
    (
      <div
        style={{
          width: dim,
          height: dim,
          borderRadius: radius,
          background: "#030712",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow */}
        <div
          style={{
            position: "absolute",
            top: dim * 0.1,
            left: "50%",
            transform: "translateX(-50%)",
            width: dim * 0.7,
            height: dim * 0.5,
            background:
              "radial-gradient(ellipse, rgba(99,102,241,0.45) 0%, transparent 70%)",
            filter: `blur(${dim * 0.1}px)`,
          }}
        />
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#6366f1"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      </div>
    ),
    { width: dim, height: dim }
  );
}

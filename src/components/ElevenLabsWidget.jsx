"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

const AGENT_ID = "agent_1701kmprg1wrer59nv7zmc1f7ct1";

export default function ElevenLabsWidget() {
  const pathname      = usePathname();
  const containerRef  = useRef(null);
  const mounted       = useRef(false);

  // Don't render inside the dashboard
  if (pathname?.startsWith("/dashboard")) return null;

  return (
    <>
      <Script
        src="https://unpkg.com/@elevenlabs/convai-widget-embed"
        strategy="afterInteractive"
        onLoad={() => {
          if (mounted.current || !containerRef.current) return;
          mounted.current = true;
          const el = document.createElement("elevenlabs-convai");
          el.setAttribute("agent-id", AGENT_ID);
          containerRef.current.appendChild(el);
        }}
      />
      <div ref={containerRef} />
    </>
  );
}

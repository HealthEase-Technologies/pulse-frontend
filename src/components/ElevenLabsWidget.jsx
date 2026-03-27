"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

const AGENT_ID = "agent_1701kmprg1wrer59nv7zmc1f7ct1";

export default function ElevenLabsWidget() {
  const containerRef = useRef(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current || !containerRef.current) return;
    mounted.current = true;

    const el = document.createElement("elevenlabs-convai");
    el.setAttribute("agent-id", AGENT_ID);
    containerRef.current.appendChild(el);
  }, []);

  return (
    <>
      <Script
        src="https://unpkg.com/@elevenlabs/convai-widget-embed"
        strategy="afterInteractive"
      />
      <div ref={containerRef} />
    </>
  );
}

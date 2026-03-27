"use client";

import { useEffect, useRef } from "react";

export default function CustomCursor() {
  const dotRef  = useRef(null);
  const ringRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    const dot  = dotRef.current;
    const ring = ringRef.current;
    const wrap = wrapRef.current;
    if (!dot || !ring || !wrap) return;

    let mouseX = -200, mouseY = -200;
    let ringX  = -200, ringY  = -200;
    let raf;

    const move = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      wrap.style.transform = `translate(${mouseX}px,${mouseY}px)`;
    };

    const loop = () => {
      ringX += (mouseX - ringX) * 0.14;
      ringY += (mouseY - ringY) * 0.14;
      ring.style.transform = `translate(${ringX - mouseX}px,${ringY - mouseY}px) translate(-50%,-50%)`;
      raf = requestAnimationFrame(loop);
    };

    const over = (e) => {
      const t = e.target;
      const hoverable = t.closest("a,button,[role='button'],input,textarea,select,label,[data-hover]");
      if (hoverable) wrap.classList.add("pulse-cursor--hover");
      else           wrap.classList.remove("pulse-cursor--hover");
    };

    const down = () => wrap.classList.add("pulse-cursor--click");
    const up   = () => wrap.classList.remove("pulse-cursor--click");

    document.addEventListener("mousemove", move, { passive: true });
    document.addEventListener("mouseover", over, { passive: true });
    document.addEventListener("mousedown", down);
    document.addEventListener("mouseup",   up);
    raf = requestAnimationFrame(loop);

    return () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseover", over);
      document.removeEventListener("mousedown", down);
      document.removeEventListener("mouseup",   up);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={wrapRef} className="pulse-cursor" aria-hidden="true">
      <div ref={ringRef} className="absolute pulse-cursor__ring" />
      <div ref={dotRef}  className="absolute pulse-cursor__dot"  />
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const S3 = "https://pulse-hw-public-assets.s3.us-east-1.amazonaws.com/device-icons";

/* ─── Real device icons from S3 ─── */
const DEVICES = [
  { label: "Apple Watch",      src: `${S3}/apple_watch.jpg`      },
  { label: "Fitbit",           src: `${S3}/fitbit.jpg`           },
  { label: "Whoop",            src: `${S3}/whoop.jpg`            },
  { label: "Omron BP",         src: `${S3}/omron_bp.jpg`         },
  { label: "FreeStyle Libre",  src: `${S3}/freestyle_libre.jpg`  },
];

/* ─── Pulse logo mark ─── */
function LogoMark() {
  return (
    <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-white/15 border border-white/25 backdrop-blur-sm">
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-3.5 h-3.5">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}


export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [scrolled, setScrolled]   = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access-token");
    if (token) router.push("/dashboard");
    else setIsLoading(false);
  }, [router]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-950">

      {/* ── Video background ── */}
      <video
        autoPlay muted loop playsInline
        className="absolute inset-0 w-full h-full object-cover z-0 scale-105"
        style={{ filter: "brightness(0.9)" }}
      >
        <source src="/hero.mp4" type="video/mp4" />
      </video>

      {/* ── Gradient overlay: top dark, bottom very dark ── */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/55 via-black/40 to-black/75" />
      {/* Extra vignette on edges */}
      <div className="absolute inset-0 z-10"
        style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)" }} />

      {/* ─────────────────────────────── NAVBAR ─────────────────────────────── */}
      <nav
        className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between px-3 py-1.5 rounded-full transition-all duration-300
          ${scrolled
            ? "bg-white/12 backdrop-blur-2xl border border-white/20 shadow-xl shadow-black/30"
            : "bg-white/8  backdrop-blur-xl  border border-white/15"
          }`}
        style={{ width: "min(780px, calc(100vw - 28px))" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2">
          <LogoMark />
          <span className="text-white font-bold text-[15px] tracking-tight">Pulse</span>
        </div>

        {/* Nav links — hidden on mobile */}
        <div className="hidden md:flex items-center gap-5">
          {["Features", "Security", "For Providers", "About"].map((item) => (
            <a key={item} href="#"
               className="text-white/60 text-xs font-medium hover:text-white transition-colors duration-150">
              {item}
            </a>
          ))}
        </div>

        {/* Auth */}
        <div className="flex items-center gap-1">
          <Link href="/login"
            className="text-white/80 text-xs font-semibold px-3.5 py-1.5 rounded-full hover:text-white hover:bg-white/10 transition-all duration-150">
            Sign In
          </Link>
          <Link href="/register"
            className="bg-white text-gray-900 text-xs font-bold px-4 py-1.5 rounded-full hover:bg-gray-100 transition-all duration-150 shadow-md shadow-black/20">
            Get Started
          </Link>
        </div>
      </nav>

      {/* ─────────────────────────────── HERO ─────────────────────────────── */}
      <section className="relative z-20 min-h-screen flex flex-col items-center justify-center px-4 pt-16 pb-14 text-center">

        {/* ── Headline ── */}
        <h1 className="font-serif text-[clamp(2.2rem,5.5vw,4.8rem)] text-white leading-[1.06] mb-4 max-w-3xl">
          Your health,{" "}
          <br className="hidden sm:block" />
          <span className="font-serif-italic text-white/90">finally</span>{" "}
          in one place.
        </h1>

        {/* ── Subheading ── */}
        <p className="text-white/55 text-[clamp(0.875rem,1.6vw,1.05rem)] max-w-lg leading-relaxed mb-8">
          Monitor vitals, collaborate with your care team, and stay ahead
          of your health — all from one intelligent platform built for you.
        </p>

        {/* ── CTA buttons ── */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <Link href="/register"
            className="group bg-white text-gray-900 font-bold text-sm px-7 py-3 rounded-full hover:bg-gray-50 transition-all duration-200 shadow-2xl shadow-black/30 hover:shadow-black/40 hover:-translate-y-0.5 transform flex items-center gap-2">
            Start for Free
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform">
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd"/>
            </svg>
          </Link>
          <Link href="/login"
            className="text-white font-semibold text-sm px-7 py-3 rounded-full border border-white/25 hover:bg-white/10 hover:border-white/40 backdrop-blur-sm transition-all duration-200">
            Sign In
          </Link>
        </div>

        {/* ── Devices + compliance — pinned to bottom ── */}
        <div className="absolute bottom-7 left-0 right-0 flex flex-col items-center gap-3">
          <div className="flex items-center">
            {DEVICES.map((d, i) => (
              <div
                key={d.label}
                title={d.label}
                className="w-10 h-10 rounded-full overflow-hidden border border-white/15 shadow-lg bg-white/10 backdrop-blur-md transition-all duration-200 hover:scale-110 hover:z-10 cursor-default"
                style={{ marginLeft: i === 0 ? 0 : "-12px", zIndex: DEVICES.length - i }}
              >
                <img
                  src={d.src}
                  alt={d.label}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              </div>
            ))}
            <span className="ml-4 text-white/35 text-xs font-medium tracking-wide">& more devices</span>
          </div>

          {/* ── Compliance strip ── */}
          <div className="inline-flex items-center bg-white/[0.06] backdrop-blur-xl border border-white/[0.08] rounded-full px-1 py-1">
            {[
              { label: "HIPAA Compliant" },
              { label: "GDPR Compliant"  },
              { label: "SOC 2 Ready"     },
            ].map((item, i) => (
              <div key={item.label} className="flex items-center">
                {i > 0 && <div className="w-px h-3 bg-white/10 mx-0.5" />}
                <div className="flex items-center gap-1.5 px-4 py-1.5">
                  <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3 flex-shrink-0">
                    <circle cx="6" cy="6" r="5.5" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
                    <path d="M3.5 6l1.8 1.8L8.5 4.5" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-white/40 text-[11px] font-medium tracking-wide whitespace-nowrap">{item.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </section>
    </div>
  );
}

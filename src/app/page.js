"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useRive } from "@rive-app/react-canvas";
import { translations } from "@/lib/i18n";

const S3       = "https://pulse-hw-public-assets.s3.us-east-1.amazonaws.com/device-icons";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/* ─── Device list (top 5) ─── */
const DEVICES = [
  { label: "Apple Watch",     src: `${S3}/apple_watch.jpg`     },
  { label: "Fitbit",          src: `${S3}/fitbit.jpg`          },
  { label: "Whoop",           src: `${S3}/whoop.jpg`           },
  { label: "Omron BP",        src: `${S3}/omron_bp.jpg`        },
  { label: "FreeStyle Libre", src: `${S3}/freestyle_libre.jpg` },
];

/* ─── Features ─── */
const FEATURES = [
  {
    tag: "Core",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-5 h-5">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Live Vitals, All in One Place",
    body: "Heart rate, blood pressure, glucose, sleep, steps — unified from every device you own. No toggling apps. No guessing.",
    mock: (
      <div className="w-full h-44 rounded-xl bg-white/[0.04] border border-white/[0.08] p-4 overflow-hidden">
        <p className="text-white/25 text-[10px] uppercase tracking-widest font-semibold mb-3">Live Dashboard</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Heart Rate", value: "72", unit: "bpm",   color: "text-red-400"    },
            { label: "BP Sys.",    value: "118", unit: "mmHg",  color: "text-blue-400"   },
            { label: "Glucose",    value: "94", unit: "mg/dL",  color: "text-amber-400"  },
            { label: "Sleep",      value: "7.2", unit: "hrs",   color: "text-indigo-400" },
            { label: "Steps",      value: "6.4k", unit: "today", color: "text-green-400" },
            { label: "Score",      value: "82", unit: "/100",   color: "text-white"      },
          ].map((v) => (
            <div key={v.label} className="bg-white/[0.05] rounded-lg p-2">
              <p className="text-white/30 text-[9px] mb-0.5 truncate">{v.label}</p>
              <p className={`text-sm font-bold ${v.color}`}>{v.value}<span className="text-white/20 text-[9px] ml-0.5">{v.unit}</span></p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-end gap-0.5 h-8">
          {[35,50,45,70,60,80,72,85,78,90,82,88].map((h, i) => (
            <div key={i} className="flex-1 rounded-sm bg-red-500/25" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    ),
  },
  {
    tag: "AI",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-5 h-5">
        <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round"/>
      </svg>
    ),
    title: "Your Health Score Has a Face",
    body: "The Pulse Pet reflects your actual health in real time. Happy when you're thriving, honest when you're not. Data you'll actually act on.",
    mock: (
      <div className="w-full h-44 rounded-xl bg-white/[0.04] border border-white/[0.08] p-4 flex items-center gap-4 overflow-hidden">
        <div className="w-20 h-20 flex-shrink-0 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/20 flex items-center justify-center text-4xl">🐼</div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <p className="text-white text-sm font-semibold">Bubbles</p>
            <span className="text-[10px] bg-green-500/15 text-green-400 border border-green-500/20 rounded-full px-2 py-0.5 font-medium">Happy</span>
          </div>
          <p className="text-white/30 text-[11px] mb-2">Health Score</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-white/[0.08] overflow-hidden">
              <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-green-500 to-emerald-400" />
            </div>
            <span className="text-white font-bold text-sm">82</span>
          </div>
          <p className="text-white/25 text-[10px] mt-2">↑ 4 pts from yesterday · 7-day streak 🔥</p>
        </div>
      </div>
    ),
  },
  {
    tag: "Alerts",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-5 h-5">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Alerts Before Things Go Wrong",
    body: "Set custom thresholds. Get notified when something's off — before it becomes an emergency. Your HCP sees it too, instantly.",
    mock: (
      <div className="w-full h-44 rounded-xl bg-white/[0.04] border border-white/[0.08] p-4 space-y-2 overflow-hidden">
        <p className="text-white/25 text-[10px] uppercase tracking-widest font-semibold mb-2">Active Alerts</p>
        {[
          { icon: "🔴", label: "BP Systolic",  value: "148 mmHg", sub: "Above threshold: 140",  time: "2 min ago"  },
          { icon: "🟡", label: "Resting HR",   value: "94 bpm",   sub: "Elevated baseline",       time: "1 hr ago"   },
          { icon: "🟢", label: "Glucose",      value: "98 mg/dL", sub: "Back in optimal range",   time: "Resolved"   },
        ].map((a) => (
          <div key={a.label} className="flex items-center justify-between bg-white/[0.04] rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">{a.icon}</span>
              <div>
                <p className="text-white text-[11px] font-medium">{a.label} · <span className="text-white/50">{a.value}</span></p>
                <p className="text-white/30 text-[10px]">{a.sub}</p>
              </div>
            </div>
            <span className="text-white/25 text-[10px] whitespace-nowrap">{a.time}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    tag: "Reports",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-5 h-5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    title: "Reports Your HCP Actually Reads",
    body: "One-tap PDF health reports with biomarker trends, goal progress, and AI summaries. Walk into any appointment prepared.",
    mock: (
      <div className="w-full h-44 rounded-xl bg-white/[0.04] border border-white/[0.08] p-4 overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-white text-xs font-semibold">Health Report</p>
            <p className="text-white/30 text-[10px]">March 2025 · 30 days</p>
          </div>
          <div className="text-[10px] bg-blue-500/15 text-blue-400 border border-blue-500/20 rounded px-2 py-0.5">PDF Ready</div>
        </div>
        <div className="space-y-1.5">
          {[
            { label: "Avg Heart Rate",   val: "74 bpm",   status: "Optimal"  },
            { label: "BP Average",       val: "122/78",   status: "Normal"   },
            { label: "Sleep Average",    val: "6.9 hrs",  status: "Low"      },
            { label: "Daily Steps",      val: "7,841",    status: "Good"     },
          ].map((r) => (
            <div key={r.label} className="flex items-center justify-between text-[11px]">
              <span className="text-white/40">{r.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-white font-medium">{r.val}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium
                  ${r.status === "Optimal" || r.status === "Good" ? "bg-green-500/15 text-green-400" :
                    r.status === "Normal" ? "bg-blue-500/15 text-blue-400" :
                    "bg-yellow-500/15 text-yellow-400"}`}>{r.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

/* ─── Testimonials ─── */
const TESTIMONIALS = [
  { name: "Dr. Sarah Mitchell",   role: "Cardiologist · NYC Health",        body: "I caught a critical BP spike on a Tuesday at 11pm — the patient was asleep. Pulse alerted me. That's the only tool I trust for remote monitoring.", avatar: "SM" },
  { name: "James Okonkwo",        role: "Marathon Runner · Dubai",           body: "I don't have a doctor on retainer but I train like I do. Pulse tracks my recovery metrics daily and my Fitbit actually means something now.", avatar: "JO" },
  { name: "Dr. Aisha Al-Farsi",   role: "Endocrinologist · Medcare Dubai",  body: "My diabetic patients send me 30-day glucose trend PDFs before every appointment. I can do more in 10 minutes than I used to in an hour.", avatar: "AA" },
  { name: "Priya Nair",           role: "Wellness Coach · Bangalore",        body: "I use Pulse with 14 clients. The goals feature and weekly check-ins keep them accountable in a way I never could on my own.", avatar: "PN" },
  { name: "Marcus Rodriguez",     role: "Amateur Cyclist · Madrid",          body: "The AI told me my resting HR spiked 18% three days before I fell sick. I thought it was crazy. It was right.", avatar: "MR" },
  { name: "Dr. Ravi Mehta",       role: "General Physician · Apollo",        body: "Pulse health reports replaced the 20-minute history-taking I used to do. My patients are more engaged with their own health than ever.", avatar: "RM" },
  { name: "Sophie Beaumont",      role: "New Mum · London",                  body: "After my pregnancy I needed to track my recovery. No doctor visits needed — Pulse told me when I was ready to start exercising again.", avatar: "SB" },
  { name: "Yusuf Al-Mansoori",    role: "Healthcare Admin · SEHA",           body: "Deploying Pulse across 3 clinics was the easiest integration we've done in five years. HIPAA compliance was a genuine concern — Pulse delivered.", avatar: "YA" },
];

/* ─── Pet scatter positions for footer floor ─── */
const PET_SPOTS = [
  { left: "4%",  rot: -13, scale: 1.0  },
  { left: "15%", rot:   9, scale: 1.05 },
  { left: "26%", rot:  -5, scale: 0.95 },
  { left: "37%", rot:  17, scale: 1.0  },
  { left: "48%", rot:  -2, scale: 1.08 },
  { left: "59%", rot:  11, scale: 0.97 },
  { left: "70%", rot: -14, scale: 1.02 },
  { left: "81%", rot:  16, scale: 0.96 },
];

/* ─── AI chat script ─── */
const CHAT_SCRIPT = [
  { from: "ai",   text: "Hey! I'm your Pulse AI. Ask me anything about your health — I'm looking at your real-time data right now." },
  { from: "user", text: "My resting heart rate was 94 bpm last night. Is that normal?" },
  { from: "ai",   text: "Your 7-day average is 81 bpm — last night was 16% above baseline.\n\nThis usually signals one of: dehydration, elevated stress, or disrupted sleep. Your sleep data shows 5.2 hrs last night, vs your 7hr target.\n\nWant me to set a hydration reminder and adjust tonight's bedtime goal?" },
  { from: "user", text: "Yes please. Also set me an 8,000 step goal for today." },
  { from: "ai",   text: "Done.\n✓ Hydration reminder — every 2 hrs from 9 AM\n✓ Bedtime goal — 10:30 PM tonight\n✓ Step goal set — 8,000 steps today\n\nYour Pulse Pet is already excited about the steps. Let's move 🐾" },
];

/* ─── Logo mark ─── */
function LogoMark() {
  return (
    <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-white/15 border border-white/25 backdrop-blur-sm">
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-3.5 h-3.5">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

/* ─── Testimonial card ─── */
function TestiCard({ t }) {
  return (
    <div className="flex-shrink-0 w-72 bg-white/[0.05] border border-white/[0.09] backdrop-blur-md rounded-2xl p-5 mx-3">
      <p className="text-white/65 text-sm leading-relaxed mb-4">"{t.body}"</p>
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
          {t.avatar}
        </div>
        <div>
          <p className="text-white text-xs font-semibold leading-tight">{t.name}</p>
          <p className="text-white/40 text-[11px] leading-tight">{t.role}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── AI Chat Demo ─── */
function AIChatDemo() {
  const [visible, setVisible] = useState([0]);
  const [typing, setTyping]   = useState(false);
  const [loop, setLoop]       = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setVisible([0]);
    setTyping(false);

    const delays = [0, 1800, 3200, 5400, 7200, 9600];

    const timers = [];
    for (let i = 1; i < CHAT_SCRIPT.length; i++) {
      const typingTimer = setTimeout(() => {
        if (!cancelled) setTyping(true);
      }, delays[i] - 700);
      const revealTimer = setTimeout(() => {
        if (!cancelled) {
          setTyping(false);
          setVisible((v) => [...v, i]);
        }
      }, delays[i]);
      timers.push(typingTimer, revealTimer);
    }

    const resetTimer = setTimeout(() => {
      if (!cancelled) setLoop((l) => l + 1);
    }, 12000);
    timers.push(resetTimer);

    return () => { cancelled = true; timers.forEach(clearTimeout); };
  }, [loop]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visible, typing]);

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Chat window — Mac chrome */}
      <div className="bg-[#111318] border border-white/[0.12] rounded-2xl overflow-hidden shadow-2xl shadow-black/60">
        {/* macOS title bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-white/[0.03] border-b border-white/[0.07]">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57] shadow-sm" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e] shadow-sm" />
            <div className="w-3 h-3 rounded-full bg-[#28c840] shadow-sm" />
          </div>
          <div className="flex-1 mx-4">
            <div className="bg-white/[0.07] rounded-md px-3 py-1 text-center text-[11px] text-white/25 flex items-center justify-center gap-1.5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3 text-white/20">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4" strokeLinecap="round"/>
              </svg>
              pulse-health.io/ai
            </div>
          </div>
        </div>
        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/[0.07] bg-white/[0.02]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-4 h-4">
              <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/>
              <path d="M12 8v4l3 3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="text-white text-xs font-semibold">Pulse AI</p>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <p className="text-white/40 text-[10px]">Connected to your live data</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="h-64 overflow-y-auto p-3 space-y-2.5 scroll-smooth chat-scroll">
          {CHAT_SCRIPT.map((msg, i) =>
            visible.includes(i) ? (
              <div key={`${loop}-${i}`}
                className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
                style={{ animation: "msgIn 0.3s ease forwards" }}>
                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-line
                  ${msg.from === "user"
                    ? "bg-white text-gray-900 rounded-br-sm font-medium"
                    : "bg-white/[0.08] text-white/85 rounded-bl-sm border border-white/[0.07]"
                  }`}>
                  {msg.text}
                </div>
              </div>
            ) : null
          )}

          {typing && (
            <div className="flex justify-start" style={{ animation: "msgIn 0.3s ease forwards" }}>
              <div className="bg-white/[0.08] border border-white/[0.07] rounded-xl rounded-bl-sm px-3 py-2.5 flex gap-1">
                {[0, 0.2, 0.4].map((d, i) => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full bg-white/40"
                    style={{ animation: `typingDot 1.2s ease-in-out ${d}s infinite` }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="px-3 py-2.5 border-t border-white/[0.07] flex items-center gap-2">
          <div className="flex-1 bg-white/[0.06] rounded-lg px-3 py-1.5 text-white/25 text-xs">
            Ask anything about your health…
          </div>
          <div className="w-6 h-6 rounded-lg bg-indigo-500/80 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-3 h-3">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-1.5 mt-3 justify-center">
        {["Set a goal", "Create alert", "Generate report", "Check trends"].map((action) => (
          <div key={action}
            className="bg-white/[0.05] border border-white/[0.09] text-white/45 text-[11px] rounded-full px-3 py-1 font-medium">
            {action}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Rive pet for footer ─── */
function FooterPetRive({ src }) {
  const { RiveComponent } = useRive({ src, autoplay: true });
  return <div className="w-full h-full"><RiveComponent /></div>;
}

/* ─── Footer pet — falls and rests ─── */
function FooterPet({ src, label, index, triggered }) {
  const ref      = useRef(null);
  const done     = useRef(false);
  const spot     = PET_SPOTS[index % PET_SPOTS.length];

  useEffect(() => {
    if (!triggered || done.current || !ref.current) return;
    done.current = true;
    const el = ref.current;

    import("gsap").then(({ gsap }) => {
      const startY = -(200 + index * 18);
      gsap.fromTo(
        el,
        {
          y: startY,
          rotation: index % 2 === 0 ? 140 : -140,
          scale: spot.scale,
          opacity: 1,
        },
        {
          y: 0,
          rotation: spot.rot,
          scale: spot.scale,
          opacity: 1,
          ease: "bounce.out",
          duration: 1.6 + index * 0.07,
          delay: index * 0.13,
        }
      );
    });
  }, [triggered, index, spot]);

  return (
    <div
      ref={ref}
      className="absolute bottom-0 w-24 h-24 md:w-28 md:h-28"
      style={{ left: spot.left, transform: "translateY(-9999px)", transformOrigin: "bottom center", willChange: "transform" }}
      title={label}
    >
      <FooterPetRive src={src} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════════════════ */
export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading]       = useState(true);
  const [scrolled, setScrolled]         = useState(false);
  const [petCatalog, setPetCatalog]     = useState([]);
  const [petsTriggered, setPetsTriggered] = useState(false);
  const [lang, setLang]                 = useState("en");
  const [mobileOpen, setMobileOpen]     = useState(false);
  const petFloorRef = useRef(null);
  const t = translations[lang];

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

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/pets/catalog`)
      .then((r) => r.ok ? r.json() : [])
      .then((d) => setPetCatalog(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const el = petFloorRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setPetsTriggered(true); },
      { threshold: 0.05 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [petCatalog]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  const row1 = [...TESTIMONIALS, ...TESTIMONIALS];
  const row2 = [...TESTIMONIALS.slice(4), ...TESTIMONIALS.slice(0, 4), ...TESTIMONIALS.slice(4), ...TESTIMONIALS.slice(0, 4)];

  return (
    <div className="relative bg-gray-950 text-white overflow-x-hidden">

      {/* ══ NAVBAR ══ */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50" style={{ width: "min(860px, calc(100vw - 24px))" }}>
        <nav className={`flex items-center justify-between px-3 py-1.5 rounded-full transition-all duration-300
          ${scrolled
            ? "bg-white/12 backdrop-blur-2xl border border-white/20 shadow-xl shadow-black/30"
            : "bg-white/8  backdrop-blur-xl  border border-white/15"
          }`}>
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <LogoMark />
            <span className="text-white font-bold text-[15px] tracking-tight">Pulse</span>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-4">
            {[
              { label: t.nav.features, href: "#features" },
              { label: t.nav.pricing,  href: "#pricing"  },
              { label: t.nav.forHcps,  href: "#hcp"      },
              { label: t.nav.blog,     href: "/blog"     },
              { label: t.nav.about,    href: "/about"    },
              { label: t.nav.contact,  href: "/contact"  },
            ].map((item) => (
              <a key={item.href} href={item.href}
                 className="text-white/60 text-xs font-medium hover:text-white transition-colors duration-150 whitespace-nowrap">
                {item.label}
              </a>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Language toggle */}
            <button
              onClick={() => setLang(l => l === "en" ? "ar" : "en")}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all duration-150 text-[11px] font-bold"
              aria-label="Switch language"
            >
              {lang === "en" ? "ع" : "EN"}
            </button>
            <Link href="/login"
              className="hidden sm:block text-white/80 text-xs font-semibold px-3 py-1.5 rounded-full hover:text-white hover:bg-white/10 transition-all duration-150 whitespace-nowrap">
              {t.nav.signIn}
            </Link>
            <Link href="/register"
              className="hidden sm:block bg-white text-gray-900 text-xs font-bold px-4 py-1.5 rounded-full hover:bg-gray-100 transition-all duration-150 shadow-md shadow-black/20 whitespace-nowrap">
              {t.nav.getStarted}
            </Link>
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileOpen(o => !o)}
              className="md:hidden w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all duration-150"
              aria-label="Toggle menu"
            >
              {mobileOpen
                ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/></svg>
                : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
              }
            </button>
          </div>
        </nav>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="md:hidden mt-2 rounded-2xl bg-white/10 backdrop-blur-2xl border border-white/15 shadow-xl shadow-black/30 overflow-hidden">
            <div className="px-4 py-3 space-y-0.5">
              {[
                { label: t.nav.features, href: "#features" },
                { label: t.nav.pricing,  href: "#pricing"  },
                { label: t.nav.forHcps,  href: "#hcp"      },
                { label: t.nav.blog,     href: "/blog"     },
                { label: t.nav.about,    href: "/about"    },
                { label: t.nav.contact,  href: "/contact"  },
              ].map((item) => (
                <a key={item.href} href={item.href}
                   onClick={() => setMobileOpen(false)}
                   className="block text-white/70 text-sm font-medium py-2.5 px-3 rounded-xl hover:bg-white/10 hover:text-white transition-all duration-150">
                  {item.label}
                </a>
              ))}
            </div>
            <div className="border-t border-white/10 px-4 py-3 flex items-center gap-2">
              <Link href="/login" onClick={() => setMobileOpen(false)}
                className="flex-1 text-center text-white/80 text-xs font-semibold py-2 px-3 rounded-xl bg-white/[0.06] hover:bg-white/10 transition-all border border-white/10">
                {t.nav.signIn}
              </Link>
              <Link href="/register" onClick={() => setMobileOpen(false)}
                className="flex-1 text-center bg-white text-gray-900 text-xs font-bold py-2 px-3 rounded-xl hover:bg-gray-100 transition-all shadow-sm">
                {t.nav.getStarted}
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ══ HERO ══ */}
      <section className="relative min-h-screen overflow-hidden bg-gray-950 flex flex-col">
        <video autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover z-0 scale-105"
          style={{ filter: "brightness(0.9)" }}>
          <source src="/hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/55 via-black/40 to-black/75" />
        <div className="absolute inset-0 z-10"
          style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)" }} />

        <div className="relative z-20 flex-1 flex flex-col items-center justify-center px-4 py-28 text-center">
          <h1 className="font-serif text-[clamp(2.2rem,5.5vw,4.8rem)] text-white leading-[1.06] mb-5 max-w-3xl">
            {t.hero.headline}<br className="hidden sm:block" />
            <span className="font-serif-italic text-white/85"> {t.hero.headlineItalic}</span>
          </h1>

          <p className="text-white/55 text-[clamp(0.875rem,1.6vw,1.05rem)] max-w-xl leading-relaxed mb-8">
            {t.hero.sub}
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <Link href="/register"
              className="group bg-white text-gray-900 font-bold text-sm px-7 py-3 rounded-full hover:bg-gray-50 transition-all duration-200 shadow-2xl shadow-black/30 hover:-translate-y-0.5 transform flex items-center gap-2">
              {t.hero.cta1}
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform">
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd"/>
              </svg>
            </Link>
            <a href="#hcp"
              className="text-white font-semibold text-sm px-7 py-3 rounded-full border border-white/25 hover:bg-white/10 hover:border-white/40 backdrop-blur-sm transition-all duration-200">
              {t.hero.cta2}
            </a>
          </div>

          {/* Device stack */}
          <div className="mt-10 flex items-center justify-center">
            {DEVICES.map((d, i) => (
              <div key={d.label} title={d.label}
                className="w-11 h-11 rounded-full overflow-hidden border border-white/20 shadow-lg bg-white/10 backdrop-blur-md hover:scale-110 hover:z-10 transition-all duration-200 cursor-default"
                style={{ marginLeft: i === 0 ? 0 : "-10px", zIndex: DEVICES.length - i }}>
                <img src={d.src} alt={d.label} className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = "none"; }} />
              </div>
            ))}
            <span className="ml-4 text-white/35 text-xs font-medium tracking-wide">{t.hero.moreDevices}</span>
          </div>

          {/* Compliance strip */}
          <div className="mt-4 inline-flex items-center bg-white/[0.05] backdrop-blur-xl border border-white/[0.07] rounded-full px-1 py-1">
            {[t.hero.hipaa, t.hero.gdpr, t.hero.soc].map((label, i) => (
              <div key={label} className="flex items-center">
                {i > 0 && <div className="w-px h-3 bg-white/10 mx-0.5" />}
                <div className="flex items-center gap-1.5 px-4 py-1.5">
                  <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3 flex-shrink-0">
                    <circle cx="6" cy="6" r="5.5" stroke="rgba(255,255,255,0.18)" strokeWidth="1"/>
                    <path d="M3.5 6l1.8 1.8L8.5 4.5" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-white/35 text-[11px] font-medium tracking-wide whitespace-nowrap">{label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FOR EVERYONE — DUAL AUDIENCE ══ */}
      <section className="relative py-20 px-4 bg-gradient-to-b from-black/60 via-gray-950 to-gray-950">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-5">
          {/* B2C */}
          <div className="group relative bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.09] rounded-2xl p-7 transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
              style={{ background: "radial-gradient(circle at 30% 30%, rgba(34,197,94,0.07) 0%, transparent 70%)" }} />
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-4 text-lg">🏃</div>
              <h3 className="font-serif text-xl text-white mb-2">For You</h3>
              <p className="text-white/45 text-sm leading-relaxed mb-5">
                Whether you're an athlete chasing a PB, someone managing a chronic condition, or simply taking health seriously — Pulse works on its own. No doctor required.
              </p>
              <ul className="space-y-2 mb-6">
                {["Connect your wearables in 2 minutes", "AI coach that reads your data daily", "Set goals, track progress, earn streaks", "Free plan · Premium from $9/mo"].map((i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-white/55">
                    <span className="w-1 h-1 rounded-full bg-green-400 flex-shrink-0" />
                    {i}
                  </li>
                ))}
              </ul>
              <Link href="/register"
                className="inline-flex items-center gap-1.5 text-white/70 text-sm font-semibold hover:text-white transition-colors">
                Start solo — it's free
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd"/>
                </svg>
              </Link>
            </div>
          </div>

          {/* B2B / HCP */}
          <div id="hcp" className="group relative bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.09] rounded-2xl p-7 transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
              style={{ background: "radial-gradient(circle at 70% 30%, rgba(99,102,241,0.07) 0%, transparent 70%)" }} />
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 text-lg">🩺</div>
              <h3 className="font-serif text-xl text-white mb-2">With Your HCP</h3>
              <p className="text-white/45 text-sm leading-relaxed mb-5">
                Connect with a verified Healthcare Provider directly on Pulse. Share your live data, get personalised recommendations, and attend virtual or in-person consultations.
              </p>
              <ul className="space-y-2 mb-6">
                {["Browse & book verified HCPs", "Share your real-time vitals securely", "Get threshold alerts sent to your HCP", "HCPs start from AED 150/session"].map((i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-white/55">
                    <span className="w-1 h-1 rounded-full bg-indigo-400 flex-shrink-0" />
                    {i}
                  </li>
                ))}
              </ul>
              <a href="#hcp-section"
                className="inline-flex items-center gap-1.5 text-white/70 text-sm font-semibold hover:text-white transition-colors">
                Explore HCP features
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FEATURES ══ */}
      <section id="features" className="relative py-24 px-4 bg-gray-950">
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-gray-950/50 to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex justify-center mb-4">
            <span className="inline-flex items-center gap-2 bg-white/[0.06] border border-white/[0.1] rounded-full px-4 py-1.5 text-xs text-white/50 font-medium tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              {t.features.badge}
            </span>
          </div>
          <h2 className="font-serif text-[clamp(1.8rem,4vw,3.2rem)] text-white text-center leading-tight mb-4 max-w-2xl mx-auto">
            {t.features.heading}
          </h2>
          <p className="text-white/40 text-center text-sm max-w-md mx-auto mb-14 leading-relaxed">
            {t.features.sub}
          </p>

          <div className="grid sm:grid-cols-2 gap-5">
            {FEATURES.map((f, i) => (
              <div key={i}
                className="group relative bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.14] rounded-2xl p-6 transition-all duration-300">
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: "radial-gradient(circle at 25% 30%, rgba(99,102,241,0.06) 0%, transparent 70%)" }} />
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.07] border border-white/[0.1] flex items-center justify-center text-white/70">
                      {f.icon}
                    </div>
                    <span className="text-[10px] font-semibold text-white/25 uppercase tracking-widest border border-white/[0.08] rounded px-2 py-0.5">{f.tag}</span>
                  </div>
                  <h3 className="text-white font-semibold text-base mb-2">{f.title}</h3>
                  <p className="text-white/45 text-sm leading-relaxed mb-4">{f.body}</p>
                  {f.mock}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ AI CHATBOT DEMO ══ */}
      <section className="relative py-24 px-4 bg-gradient-to-b from-gray-950 via-[#080d1c] to-gray-950 overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] opacity-15 pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.7) 0%, transparent 70%)", filter: "blur(70px)" }} />

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <div>
              <div className="inline-flex items-center gap-2 bg-white/[0.06] border border-white/[0.1] rounded-full px-4 py-1.5 text-xs text-white/50 font-medium tracking-wide mb-6">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3 text-indigo-400">
                  <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/><path d="M12 8v4l3 3" strokeLinecap="round"/>
                </svg>
                AI Health Companion
              </div>
              <h2 className="font-serif text-[clamp(1.8rem,3.5vw,2.8rem)] text-white leading-tight mb-5">
                Ask anything.<br />
                <span className="font-serif-italic text-white/75">Get answers from your data.</span>
              </h2>
              <p className="text-white/45 text-sm leading-relaxed mb-6 max-w-sm">
                Your Pulse AI doesn't just answer questions — it reads your real-time vitals, spots patterns, and takes action. Set goals, create alerts, generate reports — all in one conversation.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { icon: "🎯", label: "Set health goals"          },
                  { icon: "⏰", label: "Create smart reminders"   },
                  { icon: "📊", label: "Analyse your trends"       },
                  { icon: "📋", label: "Generate HCP reports"      },
                ].map((c) => (
                  <div key={c.label} className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-2.5">
                    <span className="text-base">{c.icon}</span>
                    <span className="text-white/55 text-xs font-medium">{c.label}</span>
                  </div>
                ))}
              </div>
              <Link href="/register"
                className="inline-flex items-center gap-2 text-white/60 text-sm font-semibold hover:text-white transition-colors">
                Try the AI companion free
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd"/>
                </svg>
              </Link>
            </div>

            {/* Chat demo */}
            <AIChatDemo />
          </div>
        </div>
      </section>

      {/* ══ FOR HCPs ══ */}
      <section id="hcp-section" className="relative py-24 px-4 bg-gradient-to-b from-gray-950 to-[#060b18]">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          {/* Mock HCP dashboard */}
          <div className="relative order-2 md:order-1">
            <div className="bg-white/[0.04] border border-white/[0.09] rounded-2xl p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-white/30 text-[11px] uppercase tracking-widest font-semibold">Patient Panel</p>
                  <p className="text-white text-sm font-semibold">Dr. Al-Farsi · 12 patients</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-red-400">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              {[
                { name: "James O.",  vital: "BP 148/94",   status: "Alert",   color: "text-red-400",    dot: "bg-red-400"    },
                { name: "Sara M.",   vital: "HR 62 bpm",   status: "Optimal", color: "text-green-400",  dot: "bg-green-400"  },
                { name: "Ali K.",    vital: "Gluc 132 mg", status: "Warning", color: "text-yellow-400", dot: "bg-yellow-400" },
                { name: "Priya N.",  vital: "Sleep 5.1h",  status: "Low",     color: "text-orange-400", dot: "bg-orange-400" },
              ].map((p) => (
                <div key={p.name} className="flex items-center justify-between py-2.5 border-b border-white/[0.05] last:border-0">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
                    <div>
                      <p className="text-white text-xs font-medium">{p.name}</p>
                      <p className="text-white/30 text-[10px]">{p.vital}</p>
                    </div>
                  </div>
                  <span className={`text-[11px] font-semibold ${p.color}`}>{p.status}</span>
                </div>
              ))}
              <div className="mt-4 flex items-center justify-between">
                <div className="text-[11px] text-white/25">Avg health score this week</div>
                <div className="flex items-end gap-0.5 h-8">
                  {[55, 60, 58, 72, 68, 80, 74].map((h, i) => (
                    <div key={i} className="w-4 rounded-sm bg-indigo-500/30" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute -top-3 -right-3 bg-red-500 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg shadow-red-500/30">
              BP Alert · James O.
            </div>
          </div>

          {/* Text */}
          <div className="order-1 md:order-2">
            <div className="inline-flex items-center gap-2 bg-white/[0.06] border border-white/[0.1] rounded-full px-4 py-1.5 text-xs text-white/50 font-medium tracking-wide mb-6">
              For Healthcare Providers
            </div>
            <h2 className="font-serif text-[clamp(1.8rem,3.5vw,2.8rem)] text-white leading-tight mb-5">
              Your patients between<br />
              <span className="font-serif-italic text-white/75">appointments matter too.</span>
            </h2>
            <p className="text-white/45 text-sm leading-relaxed mb-6 max-w-sm">
              Monitor multiple patients from one dashboard. Receive instant alerts when something's off. Generate consultation-ready reports in one tap. Spend less time gathering data and more time on care.
            </p>
            <ul className="space-y-2.5 mb-8">
              {[
                "Multi-patient vitals dashboard",
                "Custom threshold alerts per patient",
                "One-tap PDF health reports",
                "Secure, HIPAA-compliant messaging",
                "AI-assisted notes and summaries",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-white/60">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-indigo-400 flex-shrink-0">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd"/>
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/register"
              className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold text-sm px-6 py-2.5 rounded-full hover:bg-gray-100 transition-all duration-200 shadow-lg shadow-black/20">
              Join as an HCP
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd"/>
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ══ */}
      <section className="relative py-20 overflow-hidden bg-gray-950">
        <div className="absolute inset-y-0 left-0 w-24 z-10 bg-gradient-to-r from-gray-950 to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-24 z-10 bg-gradient-to-l from-gray-950 to-transparent pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 text-center mb-12">
          <div className="flex justify-center mb-4">
            <span className="inline-flex items-center gap-2 bg-white/[0.06] border border-white/[0.1] rounded-full px-4 py-1.5 text-xs text-white/50 font-medium tracking-wide">
              {t.testimonials.badge}
            </span>
          </div>
          <h2 className="font-serif text-[clamp(1.8rem,4vw,3.2rem)] text-white leading-tight">
            {t.testimonials.heading}
          </h2>
        </div>

        <div className="flex mb-4 overflow-hidden">
          <div className="flex animate-marquee-left">
            {row1.map((t, i) => <TestiCard key={`r1-${i}`} t={t} />)}
          </div>
        </div>
        <div className="flex overflow-hidden">
          <div className="flex animate-marquee-right">
            {row2.map((t, i) => <TestiCard key={`r2-${i}`} t={t} />)}
          </div>
        </div>
      </section>

      {/* ══ PRICING ══ */}
      <section id="pricing" className="relative py-24 px-4 bg-gray-950 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] opacity-[0.06]"
            style={{ background: "radial-gradient(ellipse, rgba(99,102,241,1) 0%, transparent 70%)", filter: "blur(80px)" }} />
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex justify-center mb-4">
            <span className="inline-flex items-center gap-2 bg-white/[0.06] border border-white/[0.1] rounded-full px-4 py-1.5 text-xs text-white/50 font-medium tracking-wide">
              {t.pricing.badge}
            </span>
          </div>
          <h2 className="font-serif text-[clamp(1.8rem,4vw,3.2rem)] text-white text-center leading-tight mb-3">
            {t.pricing.heading1} <span className="font-serif-italic text-white/75">{t.pricing.heading2}</span>
          </h2>
          <p className="text-white/40 text-sm text-center max-w-md mx-auto mb-14 leading-relaxed">
            {t.pricing.sub}
          </p>

          {/* Pricing grid */}
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">

            {/* Free */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 flex flex-col">
              <div className="mb-5">
                <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-3">Free</p>
                <div className="flex items-end gap-1.5 mb-1">
                  <span className="font-serif text-4xl text-white">$0</span>
                </div>
                <p className="text-white/30 text-xs">Forever free. No card needed.</p>
              </div>
              <ul className="space-y-2.5 mb-7 flex-1">
                {[
                  "1 wearable connection",
                  "7-day data history",
                  "Heart rate, steps & sleep",
                  "Pulse Pet (basic)",
                  "Manual biomarker entry",
                  "5 AI responses / month",
                  "Email alerts",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-white/45">
                    <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 text-white/25 flex-shrink-0 mt-0.5">
                      <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm3.78 5.28-4.5 4.5a.75.75 0 0 1-1.06 0l-2-2a.75.75 0 1 1 1.06-1.06L6.75 9.19l3.97-3.97a.75.75 0 1 1 1.06 1.06z"/>
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/register"
                className="w-full text-center text-white/60 font-semibold text-sm py-2.5 rounded-xl border border-white/[0.12] hover:border-white/25 hover:text-white transition-all duration-200">
                Get Started Free
              </Link>
            </div>

            {/* Pro — most popular */}
            <div className="relative bg-white/[0.06] border border-indigo-500/40 rounded-2xl p-6 flex flex-col shadow-xl shadow-indigo-500/10">
              {/* Popular badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg shadow-indigo-500/40 whitespace-nowrap">
                Most Popular
              </div>
              <div className="mb-5">
                <p className="text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-3">Pro</p>
                <div className="flex items-end gap-1.5 mb-1">
                  <span className="font-serif text-4xl text-white">$12</span>
                  <span className="text-white/35 text-sm mb-1.5">/month</span>
                </div>
                <p className="text-white/30 text-xs">AED 44 / month · save 20% annually</p>
              </div>
              <ul className="space-y-2.5 mb-7 flex-1">
                {[
                  "Unlimited device connections",
                  "Full data history",
                  "All 6 biomarkers (incl. BP & glucose)",
                  "Full Pulse Pet + streaks & accessories",
                  "Unlimited AI health companion",
                  "AI-powered recommendations",
                  "Custom smart alerts & thresholds",
                  "Monthly PDF + CSV health reports",
                  "Connect with 1 Healthcare Provider",
                  "Emergency contact alerts",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-white/65">
                    <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5">
                      <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm3.78 5.28-4.5 4.5a.75.75 0 0 1-1.06 0l-2-2a.75.75 0 1 1 1.06-1.06L6.75 9.19l3.97-3.97a.75.75 0 1 1 1.06 1.06z"/>
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/register"
                className="w-full text-center bg-white text-gray-900 font-bold text-sm py-2.5 rounded-xl hover:bg-gray-100 transition-all duration-200 shadow-lg shadow-black/20">
                Start Pro Free
              </Link>
              <p className="text-white/20 text-[10px] text-center mt-2">14-day trial · no card required</p>
            </div>

            {/* HCP */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 flex flex-col">
              <div className="mb-5">
                <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-3">Healthcare Provider</p>
                <div className="flex items-end gap-1.5 mb-1">
                  <span className="font-serif text-4xl text-white">$49</span>
                  <span className="text-white/35 text-sm mb-1.5">/month</span>
                </div>
                <p className="text-white/30 text-xs">AED 180 / month · per provider account</p>
              </div>
              <ul className="space-y-2.5 mb-7 flex-1">
                {[
                  "Everything in Pro (for yourself)",
                  "Monitor up to 20 patients",
                  "Real-time patient biomarker access",
                  "Per-patient custom alert thresholds",
                  "Clinical notes system",
                  "Patient PDF report generation",
                  "Priority alert notifications",
                  "Patient connection management",
                  "License verification included",
                  "Recommendations view per patient",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-white/45">
                    <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5">
                      <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm3.78 5.28-4.5 4.5a.75.75 0 0 1-1.06 0l-2-2a.75.75 0 1 1 1.06-1.06L6.75 9.19l3.97-3.97a.75.75 0 1 1 1.06 1.06z"/>
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/register"
                className="w-full text-center text-white/60 font-semibold text-sm py-2.5 rounded-xl border border-white/[0.12] hover:border-white/25 hover:text-white transition-all duration-200">
                Join as HCP
              </Link>
            </div>

            {/* Clinic / Enterprise */}
            <div className="bg-gradient-to-b from-white/[0.05] to-white/[0.02] border border-white/[0.1] rounded-2xl p-6 flex flex-col">
              <div className="mb-5">
                <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-3">Clinic / Enterprise</p>
                <div className="flex items-end gap-1.5 mb-1">
                  <span className="font-serif text-3xl text-white">Custom</span>
                </div>
                <p className="text-white/30 text-xs">Tailored to your clinic's scale</p>
              </div>
              <ul className="space-y-2.5 mb-7 flex-1">
                {[
                  "Unlimited patient capacity",
                  "Multiple HCP accounts",
                  "Centralised clinic dashboard",
                  "Bulk report generation",
                  "API access & custom integrations",
                  "Dedicated account manager",
                  "SLA-backed uptime guarantee",
                  "Staff onboarding & training",
                  "HIPAA + GDPR compliance support",
                  "Custom billing & invoicing",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-white/45">
                    <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5">
                      <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm3.78 5.28-4.5 4.5a.75.75 0 0 1-1.06 0l-2-2a.75.75 0 1 1 1.06-1.06L6.75 9.19l3.97-3.97a.75.75 0 1 1 1.06 1.06z"/>
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/contact"
                className="w-full text-center text-white/60 font-semibold text-sm py-2.5 rounded-xl border border-white/[0.12] hover:border-white/25 hover:text-white transition-all duration-200">
                Contact Sales
              </Link>
            </div>
          </div>

          {/* FAQ footnote */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6 text-center">
            {[
              { q: "Cancel anytime",       icon: "✓" },
              { q: "No setup fees",         icon: "✓" },
              { q: "HIPAA & GDPR compliant", icon: "✓" },
              { q: "14-day Pro trial",      icon: "✓" },
            ].map((n) => (
              <div key={n.q} className="flex items-center gap-1.5 text-white/30 text-xs">
                <span className="text-white/20">{n.icon}</span>
                {n.q}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA BANNER ══ */}
      <section className="relative py-24 px-4 overflow-hidden bg-[#060b18]">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[300px] rounded-full opacity-20"
            style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.6) 0%, transparent 70%)", filter: "blur(60px)" }} />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-[clamp(2rem,5vw,3.8rem)] text-white leading-tight mb-5">
            {t.cta.heading1}<br />
            <span className="font-serif-italic text-white/75">{t.cta.heading2}</span>
          </h2>
          <p className="text-white/40 text-sm max-w-md mx-auto mb-8 leading-relaxed">
            Join thousands of patients and HCPs already using Pulse to stay ahead of their health. Start free. No credit card. Cancel anytime.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register"
              className="group bg-white text-gray-900 font-bold text-sm px-8 py-3 rounded-full hover:bg-gray-100 transition-all duration-200 shadow-2xl shadow-indigo-500/20 hover:-translate-y-0.5 transform flex items-center gap-2">
              {t.cta.button}
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform">
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd"/>
              </svg>
            </Link>
            <Link href="/login"
              className="text-white/60 font-medium text-sm px-8 py-3 rounded-full border border-white/15 hover:border-white/30 hover:text-white transition-all duration-200">
              Sign in to existing account
            </Link>
          </div>
          <p className="mt-8 text-white/20 text-[11px] tracking-wide">
            A product of HealthEase Technologies LLC · JLT Towers, Dubai
          </p>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="relative bg-black overflow-x-hidden">
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#060b18] to-transparent pointer-events-none z-10" />

        {/* Footer links */}
        <div className="relative z-20 max-w-5xl mx-auto px-6 pt-16 pb-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <LogoMark />
              <span className="text-white font-bold text-[15px] tracking-tight">Pulse</span>
            </div>
            <p className="text-white/30 text-xs leading-relaxed max-w-[200px]">
              Unified health monitoring by HealthEase Technologies LLC, JLT Towers, Dubai.
            </p>
          </div>
          <div>
            <p className="text-white/25 text-[11px] font-semibold uppercase tracking-widest mb-3">{t.footer.product}</p>
            <ul className="space-y-2">
              {[
                { l: t.footer.links.features, h: "#features" },
                { l: t.footer.links.forHcps,  h: "#hcp"      },
                { l: t.footer.links.pricing,  h: "#pricing"  },
                { l: t.footer.links.security, h: "#"         },
              ].map((i) => (
                <li key={i.h}><a href={i.h} className="text-white/45 text-xs hover:text-white transition-colors">{i.l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-white/25 text-[11px] font-semibold uppercase tracking-widest mb-3">{t.footer.company}</p>
            <ul className="space-y-2">
              {[
                { l: t.footer.links.about,   h: "/about"   },
                { l: t.footer.links.blog,    h: "/blog"    },
                { l: t.footer.links.careers, h: "#"        },
                { l: t.footer.links.contact, h: "/contact" },
              ].map((i) => (
                <li key={i.h}><Link href={i.h} className="text-white/45 text-xs hover:text-white transition-colors">{i.l}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-white/25 text-[11px] font-semibold uppercase tracking-widest mb-3">{t.footer.legal}</p>
            <ul className="space-y-2">
              {[
                t.footer.links.privacy,
                t.footer.links.terms,
                t.footer.links.hipaa,
                t.footer.links.cookie,
              ].map((item) => (
                <li key={item}><a href="#" className="text-white/45 text-xs hover:text-white transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="relative z-20 border-t border-white/[0.06] px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 max-w-5xl mx-auto">
          <p className="text-white/20 text-[11px]">{t.footer.copy(new Date().getFullYear())}</p>
          <div className="flex items-center gap-4">
            {["HIPAA", "GDPR", "SOC 2"].map((b) => (
              <span key={b} className="text-white/20 text-[11px] border border-white/[0.08] rounded px-2 py-0.5">{b}</span>
            ))}
          </div>
        </div>

      </footer>

      {/* ── PET FLOOR ── overlaps footer top via negative margin; mask fades the top so pets appear to fall in from footer */}
      <div
        ref={petFloorRef}
        className="relative bg-black w-full overflow-hidden"
        style={{
          height: "220px",
          marginTop: "-120px",
          zIndex: 20,
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 45%)",
          maskImage: "linear-gradient(to bottom, transparent 0%, black 45%)",
        }}
      >
        {/* Ground ambient glow */}
        <div className="absolute bottom-0 inset-x-0 h-16 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(99,102,241,0.15) 0%, transparent 70%)" }} />

        {petCatalog.length > 0
          ? petCatalog.slice(0, 8).map((pet, i) => {
              const src = pet.happy_asset_url || pet.selection_asset_url || "";
              if (!src) return null;
              return (
                <FooterPet
                  key={pet.id || i}
                  src={src}
                  label={pet.display_name || pet.pet_key || `Pet ${i + 1}`}
                  index={i}
                  triggered={petsTriggered}
                />
              );
            })
          : /* Fallback emoji pets */
            ["🐱", "🐶", "🐘", "🦁", "🦉", "🐼", "🐧", "🦝"].map((emoji, i) => {
              const spot = PET_SPOTS[i];
              return (
                <div key={i}
                  className="absolute bottom-0 w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-4xl shadow-xl shadow-black/50"
                  style={{
                    left: spot.left,
                    transform: petsTriggered
                      ? `translateY(0) rotate(${spot.rot}deg) scale(${spot.scale})`
                      : "translateY(-9999px)",
                    transition: petsTriggered
                      ? `transform 1.6s cubic-bezier(0.215,0.61,0.355,1) ${i * 0.13}s`
                      : "none",
                    transformOrigin: "bottom center",
                  }}>
                  {emoji}
                </div>
              );
            })
        }
      </div>

    </div>
  );
}

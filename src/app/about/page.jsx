import MarketingNav from "@/components/MarketingNav";
import Link from "next/link";

export const metadata = {
  title: "About · Pulse",
  description: "Learn about HealthEase Technologies LLC and the people building Pulse — the unified health monitoring platform.",
};

const TEAM = [
  {
    name:     "Rhea Menezes",
    role:     "CEO & Founding Member",
    bio:      "Drives the vision and strategy behind Pulse. A relentless builder who believes proactive healthcare should be accessible to everyone — not just those who can afford a concierge physician.",
    initials: "RM",
  },
  {
    name:     "Huzaifa Mohammed",
    role:     "CTO & Founding Member",
    bio:      "Architects the entire Pulse stack — from real-time biomarker pipelines to the AI health scoring engine. Obsessed with systems that are fast, private, and clinically honest.",
    initials: "HM",
  },
  {
    name:     "Tehan Miskin",
    role:     "Founding Member · Frontend & Research",
    bio:      "Shapes how Pulse looks and feels, and grounds product decisions in user research. Believes a health platform is only as good as the experience it delivers under stress.",
    initials: "TM",
  },
  {
    name:     "Zeeshan Khan",
    role:     "Founding Member · Backend & Cybersecurity",
    bio:      "Keeps Pulse's infrastructure bulletproof. Every HIPAA control, every encryption layer, every penetration test — Zeeshan owns it. Health data security isn't a feature; it's the foundation.",
    initials: "ZK",
  },
  {
    name:     "Simon Girma",
    role:     "Founding Member · Frontend & Research",
    bio:      "Builds the interfaces patients and HCPs actually use. Combines deep frontend craft with a researcher's instinct for what real users need — not just what they say they need.",
    initials: "SG",
  },
  {
    name:     "Patrick Abella",
    role:     "Founding Member · UI/UX & Research",
    bio:      "Designs the systems and flows that make complex health data feel intuitive. Patrick's work is the reason Pulse doesn't feel like medical software — it feels like something you want to use.",
    initials: "PA",
  },
  {
    name:     "Krisha Bhandari",
    role:     "Founding Member · UI/UX & Research",
    bio:      "Brings precision and warmth to every screen. Krisha ensures Pulse communicates clearly at its most important moments — when someone's health data is telling them something serious.",
    initials: "KB",
  },
  {
    name:     "Kamo Peacock",
    role:     "Founding Member · Backend",
    bio:      "The quiet engine behind Pulse's reliability. Kamo builds the services and data flows that run 24/7 — the systems that have to work when a patient's health alert fires at 2 AM.",
    initials: "KP",
  },
];

const VALUES = [
  {
    icon: "🔬",
    title: "Clinically honest",
    body: "We won't tell you you're fine if you're not. Our health scoring is based on peer-reviewed ranges, not optimistic defaults designed to retain users.",
  },
  {
    icon: "🔒",
    title: "Privacy by design",
    body: "Your health data belongs to you. We don't sell it, we don't aggregate it for advertising, and our architecture is built so that even we can't read it.",
  },
  {
    icon: "🌍",
    title: "Access, not exclusivity",
    body: "Proactive healthcare shouldn't cost a premium. We built a free tier that's genuinely useful, and our HCP marketplace is priced for the real world — not just Silicon Valley.",
  },
  {
    icon: "⚡",
    title: "Speed over perfection",
    body: "A health alert that arrives two minutes late is a useless alert. We prioritise real-time reliability above all else — including aesthetics.",
  },
];

export default function AboutPage() {
  return (
    <div className="relative bg-gray-950 text-white min-h-screen overflow-x-hidden">
      <MarketingNav />

      {/* ── Hero ── */}
      <section className="relative pt-40 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-10"
            style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.8) 0%, transparent 70%)", filter: "blur(70px)" }} />
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/[0.06] border border-white/[0.1] rounded-full px-4 py-1.5 text-xs text-white/50 font-medium tracking-wide mb-6">
            HealthEase Technologies LLC · Dubai, UAE
          </div>
          <h1 className="font-serif text-[clamp(2rem,5vw,4rem)] text-white leading-tight mb-6">
            We built Pulse because<br />
            <span className="font-serif-italic text-white/80">waiting is dangerous.</span>
          </h1>
          <p className="text-white/50 text-base leading-relaxed max-w-2xl mx-auto">
            Most people learn something is wrong with their health at a doctor's appointment — which happens, at best, twice a year.
            We believe that's not good enough anymore. The data exists in your wearables, in your daily patterns, in the numbers your body produces every second.
            Pulse makes that data work for you, in real time, whether or not you have a doctor on speed dial.
          </p>
        </div>
      </section>

      {/* ── Origin story ── */}
      <section className="py-16 px-4 border-t border-white/[0.06]">
        <div className="max-w-3xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              { stat: "2026", label: "Launched in Dubai" },
              { stat: "10+",  label: "Wearable integrations" },
              { stat: "HIPAA + GDPR", label: "Compliant from day one" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-serif text-3xl text-white mb-1">{s.stat}</p>
                <p className="text-white/40 text-sm">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="prose max-w-none">
            <div className="space-y-5 text-white/55 text-sm leading-relaxed">
              <p>
                Pulse started with a frustration shared by most of the founding team: health data existed everywhere — wearables, labs, devices — and yet it was completely siloed. You'd get a heart rate notification from your watch and have no idea if it meant anything. You'd visit a doctor and spend the first ten minutes answering questions that your phone already knew the answers to.
              </p>
              <p>
                Eight people came together to build the platform they wanted to use themselves. Rhea and Huzaifa led the product and engineering vision. Zeeshan locked down the security and backend infrastructure from day one. Tehan, Simon, Patrick, and Krisha shaped the experience and research. Kamo built the services that keep it all running.
              </p>
              <p>
                We're based in JLT Towers, Dubai — and we're building for patients and HCPs across the Middle East, South Asia, and beyond. Markets where access to proactive healthcare is still a privilege, not a right. That's the problem we're here to fix.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-950 to-[#070c1a]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif text-[clamp(1.6rem,3vw,2.4rem)] text-white mb-3">What we believe</h2>
            <p className="text-white/40 text-sm max-w-md mx-auto">These aren't values we wrote for an about page. They're the arguments we have in product reviews.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {VALUES.map((v) => (
              <div key={v.title} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
                <div className="text-2xl mb-3">{v.icon}</div>
                <h3 className="text-white font-semibold text-base mb-2">{v.title}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team ── */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif text-[clamp(1.6rem,3vw,2.4rem)] text-white mb-3">The team</h2>
            <p className="text-white/40 text-sm">Engineers, designers, and researchers who care about building something that actually matters.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {TEAM.map((p) => (
              <div key={p.name} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/40 to-blue-600/40 border border-indigo-500/20 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {p.initials}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{p.name}</p>
                  <p className="text-indigo-400 text-[11px] font-medium mb-2">{p.role}</p>
                  <p className="text-white/40 text-xs leading-relaxed">{p.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Advisor ── */}
      <section className="py-16 px-4 border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-serif text-[clamp(1.4rem,2.5vw,2rem)] text-white mb-2">Academic Advisory</h2>
            <p className="text-white/35 text-sm">Grounding our work in rigorous research and institutional expertise.</p>
          </div>
          <div className="max-w-sm mx-auto">
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 flex gap-4 items-start">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/30 to-orange-500/20 border border-amber-500/20 flex items-center justify-center text-amber-300 text-sm font-bold flex-shrink-0">
                PT
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Prof. Talal</p>
                <p className="text-amber-400/80 text-[11px] font-medium mb-2">Academic Advisor</p>
                <p className="text-white/40 text-xs leading-relaxed">
                  Heriot-Watt University Dubai Campus. Providing academic rigour and research guidance to ensure Pulse's health scoring and clinical methodology is grounded in peer-reviewed science.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-4 border-t border-white/[0.06] text-center">
        <h2 className="font-serif text-[clamp(1.6rem,3vw,2.4rem)] text-white mb-4">
          Want to work with us?
        </h2>
        <p className="text-white/40 text-sm max-w-md mx-auto mb-7 leading-relaxed">
          We're always looking for people who care about health, hate unnecessary complexity, and want to build something real.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/contact"
            className="bg-white text-gray-900 font-bold text-sm px-7 py-2.5 rounded-full hover:bg-gray-100 transition-all duration-200 shadow-lg shadow-black/20">
            Get in Touch
          </Link>
          <Link href="/register"
            className="text-white/60 font-medium text-sm px-7 py-2.5 rounded-full border border-white/15 hover:border-white/30 hover:text-white transition-all duration-200">
            Try Pulse Free
          </Link>
        </div>
      </section>

      {/* ── Minimal footer ── */}
      <div className="border-t border-white/[0.06] px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-5xl mx-auto">
        <p className="text-white/20 text-[11px]">© {new Date().getFullYear()} HealthEase Technologies LLC. All rights reserved.</p>
        <div className="flex items-center gap-4">
          {[{ l: "Privacy", h: "#" }, { l: "Terms", h: "#" }, { l: "Contact", h: "/contact" }].map((i) => (
            <Link key={i.l} href={i.h} className="text-white/25 text-[11px] hover:text-white/60 transition-colors">{i.l}</Link>
          ))}
        </div>
      </div>
    </div>
  );
}

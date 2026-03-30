"use client";

import MarketingNav from "@/components/MarketingNav";
import Link from "next/link";

function Check({ color = "text-indigo-400" }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={`w-3.5 h-3.5 ${color} flex-shrink-0 mt-0.5`}>
      <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm3.78 5.28-4.5 4.5a.75.75 0 0 1-1.06 0l-2-2a.75.75 0 1 1 1.06-1.06L6.75 9.19l3.97-3.97a.75.75 0 1 1 1.06 1.06z"/>
    </svg>
  );
}

export default function PartnersPage() {
  return (
    <div className="relative bg-gray-950 text-white min-h-screen overflow-x-hidden">
      <MarketingNav />

      {/* ── Hero ── */}
      <section className="relative min-h-[60vh] flex items-end pb-16 overflow-hidden">
        {/* Background video */}
        <video
          autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover z-0 scale-105"
          style={{ filter: "brightness(0.85)" }}
        >
          <source src="/partnerhero.mp4" type="video/mp4" />
        </video>
        {/* Gradient overlay fading into page bg */}
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/40 via-black/30 to-gray-950" />
        {/* Subtle indigo tint */}
        <div className="absolute inset-0 z-10 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(99,102,241,0.15) 0%, transparent 65%)" }} />

        <div className="relative z-20 max-w-2xl mx-auto text-center px-4 pt-40">
          <span className="inline-flex items-center gap-2 bg-white/[0.08] border border-white/[0.15] rounded-full px-4 py-1.5 text-xs text-white/60 font-medium tracking-wide mb-6 backdrop-blur-sm">
            Partner Programme
          </span>
          <h1 className="font-serif text-[clamp(2.2rem,5vw,4rem)] text-white leading-tight mb-5 drop-shadow-lg">
            Bring Pulse to your<br />
            <span className="font-serif italic text-white/80">patients and practice.</span>
          </h1>
          <p className="text-white/60 text-sm leading-relaxed max-w-lg mx-auto drop-shadow">
            Whether you're a hospital licensing Pulse for your entire patient population or an independent practitioner joining our marketplace — there's a partnership built for you.
          </p>
        </div>
      </section>

      {/* ── Two partner tracks ── */}
      <section className="pb-8 px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">

          {/* Hospital & Clinic */}
          <div className="relative bg-white/[0.03] border border-white/[0.08] rounded-3xl p-8 flex flex-col overflow-hidden">
            {/* Coming soon ribbon */}
            <div className="absolute top-5 right-5 bg-amber-500/15 border border-amber-500/25 text-amber-400 text-[10px] font-bold px-2.5 py-1 rounded-full">
              Coming Soon
            </div>

            {/* Icon */}
            <div className="w-11 h-11 rounded-2xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center mb-5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 text-white/50">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4"/>
              </svg>
            </div>

            <p className="text-white/35 text-[10px] font-semibold uppercase tracking-widest mb-2">For Hospitals &amp; Clinics</p>
            <h2 className="font-serif text-2xl text-white mb-3 leading-snug">
              License Pulse for your entire institution.
            </h2>
            <p className="text-white/40 text-sm leading-relaxed mb-6">
              Your hospital pays a single institutional licence. Patients and staff log in with their existing hospital credentials — no separate account creation, no per-user billing.
            </p>

            <ul className="space-y-3 mb-8 flex-1">
              {[
                "Patients access Pulse free under hospital sponsorship",
                "Staff log in via hospital SSO / credentials",
                "Patients connect only with their assigned hospital doctors",
                "Centralised admin dashboard for your IT team",
                "Custom SLA, HIPAA & GDPR compliance support",
                "Dedicated onboarding & training for clinical staff",
                "Bulk PDF report generation across all patients",
                "API access for EHR and system integrations",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-white/50">
                  <Check color="text-amber-400/70" />
                  {f}
                </li>
              ))}
            </ul>

            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 mb-6">
              <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-1">Pricing</p>
              <p className="text-white text-lg font-semibold">Custom — contact us</p>
              <p className="text-white/30 text-xs mt-0.5">Tailored to your patient volume and infrastructure needs</p>
            </div>

            <Link href="/contact?reason=clinic"
              className="w-full text-center text-white/60 font-semibold text-sm py-3 rounded-xl border border-white/[0.12] hover:border-white/25 hover:text-white transition-all duration-200">
              Register Your Hospital's Interest →
            </Link>
          </div>

          {/* Independent HCP */}
          <div className="relative bg-white/[0.04] border border-green-500/20 rounded-3xl p-8 flex flex-col overflow-hidden">
            {/* Live badge */}
            <div className="absolute top-5 right-5 flex items-center gap-1.5 bg-green-500/10 border border-green-500/25 text-green-400 text-[10px] font-bold px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Live Now
            </div>

            {/* Icon */}
            <div className="w-11 h-11 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 text-green-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z"/>
              </svg>
            </div>

            <p className="text-green-400/70 text-[10px] font-semibold uppercase tracking-widest mb-2">For Independent Providers</p>
            <h2 className="font-serif text-2xl text-white mb-3 leading-snug">
              Build your practice on the Pulse marketplace.
            </h2>
            <p className="text-white/40 text-sm leading-relaxed mb-6">
              Register as an independent HCP, get listed on the Pulse marketplace, and monitor your patients remotely — all from one dashboard. You bring the expertise; we bring the patients and the data.
            </p>

            <ul className="space-y-3 mb-6 flex-1">
              {[
                "Listed on the Pulse HCP marketplace",
                "Patients discover, connect and book with you",
                "Real-time access to connected patient biomarkers",
                "Per-patient custom alert thresholds",
                "Clinical notes, care plans & consultation tools",
                "AI-assisted recommendations for your patients",
                "One-tap patient PDF & CSV health reports",
                "Care+ patients — ongoing async chat & care revenue",
                "License verification handled by Pulse",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-white/55">
                  <Check color="text-green-400" />
                  {f}
                </li>
              ))}
            </ul>

            <div className="bg-green-500/[0.05] border border-green-500/15 rounded-2xl p-4 mb-4">
              <p className="text-green-400/60 text-xs font-semibold uppercase tracking-widest mb-1">Pricing</p>
              <div className="flex items-end gap-1.5">
                <p className="text-white text-3xl font-serif">$49</p>
                <p className="text-white/40 text-sm mb-1">/month</p>
              </div>
              <p className="text-white/30 text-xs mt-0.5">AED 180/mo · 14-day free trial, no card required</p>
            </div>

            {/* Earnings callout */}
            <div className="bg-green-500/[0.07] border border-green-500/15 rounded-xl px-4 py-3 mb-6 space-y-2">
              <p className="text-green-400 text-sm font-semibold">💰 How you earn on Pulse</p>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                <p className="text-white/40 text-xs leading-relaxed"><span className="text-white/60 font-medium">Consultations:</span> Keep 80% of every session fee. Set your own rate ($20–$50/session).</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 flex-shrink-0" />
                <p className="text-white/40 text-xs leading-relaxed"><span className="text-white/60 font-medium">Care+ patients:</span> Earn 60–70% of their monthly Care+ subscription for ongoing async care.</p>
              </div>
            </div>

            <Link href="/register?role=hcp"
              className="w-full text-center bg-white text-gray-900 font-bold text-sm py-3 rounded-xl hover:bg-gray-100 transition-all duration-200 shadow-lg shadow-black/20">
              Join as a Healthcare Provider →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Why partner ── */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-white/25 text-[11px] font-semibold uppercase tracking-widest text-center mb-10">Why partner with Pulse</p>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 text-indigo-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z"/>
                  </svg>
                ),
                title: "Real-time patient data",
                body: "Monitor vitals between appointments. Catch issues before they become emergencies.",
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 text-indigo-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4h8z"/>
                  </svg>
                ),
                title: "HIPAA & GDPR compliant",
                body: "Built for clinical environments from day one. Your patients' data is always protected.",
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 text-indigo-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                ),
                title: "Up and running fast",
                body: "Independent HCPs can be live in minutes. Hospital deployments include full onboarding support.",
              },
            ].map((item) => (
              <div key={item.title} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
                <div className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <p className="text-white text-sm font-semibold mb-2">{item.title}</p>
                <p className="text-white/40 text-xs leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="pb-24 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-10">
            <h3 className="font-serif text-2xl text-white mb-3">Not sure which fits?</h3>
            <p className="text-white/40 text-sm leading-relaxed mb-6 max-w-sm mx-auto">
              Drop us a message and we'll help you figure out the right path — whether you're a solo GP, a specialist clinic, or a hospital system.
            </p>
            <Link href="/contact"
              className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold text-sm px-8 py-3 rounded-full hover:bg-gray-100 transition-all duration-200 shadow-lg shadow-black/20">
              Talk to us
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd"/>
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
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

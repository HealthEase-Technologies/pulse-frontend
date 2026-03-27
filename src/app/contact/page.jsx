"use client";

import MarketingNav from "@/components/MarketingNav";
import Link from "next/link";
import { useState } from "react";

const CONTACT_REASONS = [
  { value: "patient",      label: "I'm a patient / individual user"  },
  { value: "hcp",          label: "I'm a Healthcare Provider (HCP)"  },
  { value: "clinic",       label: "I represent a clinic or hospital"  },
  { value: "partnership",  label: "Partnership or integration inquiry" },
  { value: "press",        label: "Press or media inquiry"            },
  { value: "other",        label: "Something else"                    },
];

const inputCls = "w-full bg-white/[0.05] border border-white/[0.1] text-white placeholder:text-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30 focus:bg-white/[0.08] transition-all duration-150";
const labelCls = "block text-[11px] font-semibold text-white/35 uppercase tracking-widest mb-1.5";

export default function ContactPage() {
  const [form, setForm]         = useState({ name: "", email: "", reason: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/contact/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      if (!res.ok) throw new Error("Submission failed");
      setSubmitted(true);
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative bg-gray-950 text-white min-h-screen overflow-x-hidden">
      <MarketingNav />

      {/* ── Header ── */}
      <section className="relative pt-40 pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] h-[250px] opacity-10"
            style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.8) 0%, transparent 70%)", filter: "blur(70px)" }} />
        </div>
        <div className="max-w-xl mx-auto text-center relative z-10">
          <h1 className="font-serif text-[clamp(2rem,5vw,3.8rem)] text-white leading-tight mb-4">
            Let's talk.
          </h1>
          <p className="text-white/45 text-sm leading-relaxed">
            Whether you're a patient with a question, an HCP exploring Pulse for your practice, or a clinic looking for a partnership — we read every message.
          </p>
        </div>
      </section>

      {/* ── Main content ── */}
      <section className="pb-24 px-4">
        <div className="max-w-4xl mx-auto grid md:grid-cols-5 gap-10">

          {/* Contact info */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <p className="text-white/25 text-[11px] font-semibold uppercase tracking-widest mb-4">HealthEase Technologies LLC</p>
              <div className="space-y-3">
                {[
                  {
                    icon: (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                    ),
                    label: "Address",
                    value: "JLT Towers, Cluster I\nJumeirah Lake Towers\nDubai, UAE",
                  },
                  {
                    icon: (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                      </svg>
                    ),
                    label: "General",
                    value: "hello@getpulse.app",
                  },
                  {
                    icon: (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                      </svg>
                    ),
                    label: "HCP & Clinic Sales",
                    value: "providers@getpulse.app",
                  },
                  {
                    icon: (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                      </svg>
                    ),
                    label: "Press",
                    value: "press@getpulse.app",
                  },
                ].map((c) => (
                  <div key={c.label} className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.09] flex items-center justify-center text-white/40 flex-shrink-0 mt-0.5">
                      {c.icon}
                    </div>
                    <div>
                      <p className="text-white/30 text-[11px] font-semibold uppercase tracking-wider">{c.label}</p>
                      <p className="text-white/60 text-xs leading-relaxed whitespace-pre-line">{c.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5">
              <p className="text-white text-sm font-semibold mb-1">Response times</p>
              <div className="space-y-2 mt-3">
                {[
                  { type: "General queries",   time: "Within 24 hours" },
                  { type: "HCP / Clinic sales", time: "Within 4 hours"  },
                  { type: "Technical support",  time: "Within 2 hours"  },
                ].map((r) => (
                  <div key={r.type} className="flex items-center justify-between text-xs">
                    <span className="text-white/40">{r.type}</span>
                    <span className="text-white/60 font-medium">{r.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="md:col-span-3">
            {submitted ? (
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-10 flex flex-col items-center text-center gap-5">
                <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                  <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-serif text-xl text-white mb-2">Message received.</h3>
                  <p className="text-white/45 text-sm leading-relaxed max-w-xs">
                    We'll get back to you at {form.email} — usually within 24 hours. For urgent clinical matters, call us directly.
                  </p>
                </div>
                <Link href="/"
                  className="text-white/50 text-sm hover:text-white transition-colors font-medium">
                  ← Back to Pulse
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit}
                className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-7 space-y-4">

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className={labelCls}>Your Name</label>
                    <input id="name" type="text" required placeholder="Dr. Jane Smith"
                      value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor="email" className={labelCls}>Email Address</label>
                    <input id="email" type="email" required placeholder="you@example.com"
                      value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className={inputCls} />
                  </div>
                </div>

                <div>
                  <label htmlFor="reason" className={labelCls}>What's this about?</label>
                  <select id="reason" required
                    value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    className={`${inputCls} bg-white/[0.05]`}>
                    <option value="" disabled className="bg-gray-900">Select a reason…</option>
                    {CONTACT_REASONS.map((r) => (
                      <option key={r.value} value={r.value} className="bg-gray-900">{r.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className={labelCls}>Message</label>
                  <textarea id="message" required rows={5}
                    placeholder="Tell us what you're working on or what you need…"
                    value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className={`${inputCls} resize-none`} />
                </div>

                <button type="submit" disabled={loading}
                  className="w-full bg-white text-gray-900 font-bold text-sm py-3 rounded-xl hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-black/20 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3"/>
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                      </svg>
                      Sending…
                    </>
                  ) : "Send Message"}
                </button>

                <p className="text-white/20 text-[11px] text-center">
                  We only use your information to respond to your enquiry.{" "}
                  <a href="#" className="underline hover:text-white/40 transition-colors">Privacy Policy</a>
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Minimal footer */}
      <div className="border-t border-white/[0.06] px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-5xl mx-auto">
        <p className="text-white/20 text-[11px]">© {new Date().getFullYear()} HealthEase Technologies LLC. All rights reserved.</p>
        <div className="flex items-center gap-4">
          {[{ l: "Privacy", h: "#" }, { l: "Terms", h: "#" }, { l: "About", h: "/about" }].map((i) => (
            <Link key={i.l} href={i.h} className="text-white/25 text-[11px] hover:text-white/60 transition-colors">{i.l}</Link>
          ))}
        </div>
      </div>
    </div>
  );
}

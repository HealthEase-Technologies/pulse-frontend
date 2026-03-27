"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import Link from "next/link";

const inputCls = "w-full bg-white/[0.07] border border-white/[0.1] text-white placeholder:text-white/25 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-white/30 focus:bg-white/[0.1] transition-all duration-150";
const labelCls = "block text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-1.5";

const Spinner = () => (
  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const STEPS = {
  1: { title: "Forgot your password?",    sub: "Enter your email and we'll send you a reset code."              },
  2: { title: "Check your email.",         sub: "Enter the 6-digit code we sent along with your new password."   },
  3: { title: "Password updated.",         sub: "You're all set — sign in with your new password."               },
};

export default function ResetPassword() {
  const { forgotPassword, confirmPassword } = useAuth();
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [step, setStep]             = useState(1);
  const [email, setEmail]           = useState("");
  const [code, setCode]             = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await forgotPassword(email);
      setStep(2);
    } catch (err) {
      setError(err.message || "Failed to send reset code");
    } finally { setLoading(false); }
  };

  const handleConfirmReset = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await confirmPassword(email, code, newPassword);
      setStep(3);
    } catch (err) {
      setError(err.message || "Failed to reset password");
    } finally { setLoading(false); }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="bg-white/[0.07] backdrop-blur-2xl border border-white/[0.11] rounded-2xl p-6 shadow-2xl shadow-black/40">

        {/* Back link */}
        {step < 3 && (
          <Link href="/login" className="inline-flex items-center gap-1.5 text-white/35 text-xs font-medium hover:text-white/60 transition-colors mb-5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to sign in
          </Link>
        )}

        {/* Header */}
        <div className="mb-5">
          <h1 className="font-serif text-2xl text-white leading-tight mb-1">{STEPS[step].title}</h1>
          <p className="text-white/45 text-xs">{STEPS[step].sub}</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Step 1 — Email */}
        {step === 1 && (
          <form onSubmit={handleRequestReset} className="space-y-3">
            <div>
              <label htmlFor="email" className={labelCls}>Email Address</label>
              <input
                id="email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" required
                className={inputCls}
              />
            </div>
            <button type="submit" disabled={loading}
              className="w-full mt-1 bg-white text-gray-900 font-bold text-sm py-3 rounded-xl hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-black/20">
              {loading ? <span className="flex items-center justify-center gap-2"><Spinner />Sending…</span> : "Send Reset Code"}
            </button>
          </form>
        )}

        {/* Step 2 — Code + new password */}
        {step === 2 && (
          <form onSubmit={handleConfirmReset} className="space-y-3">
            <div>
              <label htmlFor="code" className={labelCls}>Reset Code</label>
              <input
                id="code" type="text" value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="6-digit code" required
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="newPassword" className={labelCls}>New Password</label>
              <input
                id="newPassword" type="password" value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••" required minLength={8}
                className={inputCls}
              />
              <p className="mt-1.5 text-[11px] text-white/25">8+ chars · uppercase · lowercase · number · special character</p>
            </div>
            <button type="submit" disabled={loading}
              className="w-full mt-1 bg-white text-gray-900 font-bold text-sm py-3 rounded-xl hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-black/20">
              {loading ? <span className="flex items-center justify-center gap-2"><Spinner />Resetting…</span> : "Reset Password"}
            </button>
          </form>
        )}

        {/* Step 3 — Success */}
        {step === 3 && (
          <div className="flex flex-col items-center text-center gap-6">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
              <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <Link href="/login"
              className="w-full bg-white text-gray-900 font-bold text-sm py-3 rounded-xl hover:bg-gray-100 transition-all shadow-lg shadow-black/20 text-center">
              Continue to Sign In
            </Link>
          </div>
        )}

        {/* Footer */}
        {step < 3 && (
          <div className="mt-4 pt-4 border-t border-white/[0.08] text-center">
            <p className="text-white/35 text-sm">
              Remember it?{" "}
              <Link href="/login" className="text-white/65 font-semibold hover:text-white transition-colors">Sign in</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

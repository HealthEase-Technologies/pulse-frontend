"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CognitoUser } from "amazon-cognito-identity-js";
import UserPool from "@/lib/cognito";

const Spinner = () => (
  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

function VerifyContent() {
  const [otp, setOtp]         = useState(new Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);
  const inputRefs             = useRef([]);
  const router                = useRouter();
  const searchParams          = useSearchParams();
  const username              = searchParams.get("username");

  useEffect(() => { if (!username) router.push("/login"); }, [username, router]);

  const handleChange = (e, index) => {
    const val = e.target.value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = val;
    setOtp(next);
    if (val && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const nums = e.clipboardData.getData("text/plain").replace(/\D/g, "").slice(0, 6);
    if (!nums) return;
    const next = new Array(6).fill("").map((_, i) => nums[i] || "");
    setOtp(next);
    inputRefs.current[Math.min(nums.length, 5)]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { setError("Please enter all 6 digits"); return; }
    setLoading(true); setError("");
    try {
      const cognitoUser = new CognitoUser({ Username: username, Pool: UserPool });
      await new Promise((resolve, reject) => {
        cognitoUser.confirmRegistration(code, true, (err, result) => {
          if (err) reject(err); else resolve(result);
        });
      });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError(err.message || "Verification failed");
    } finally { setLoading(false); }
  };

  /* ── Success ── */
  if (success) {
    return (
      <div className="w-full max-w-sm">
        <div className="bg-white/[0.07] backdrop-blur-2xl border border-white/[0.11] rounded-2xl p-10 shadow-2xl shadow-black/40 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <h2 className="font-serif text-2xl text-white mb-2">Verified.</h2>
          <p className="text-white/45 text-sm">Your account is confirmed. Taking you to sign in…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-white/[0.07] backdrop-blur-2xl border border-white/[0.11] rounded-2xl p-6 shadow-2xl shadow-black/40">

        {/* Header */}
        <div className="mb-6 text-center">
          {/* Email icon */}
          <div className="w-10 h-10 rounded-xl bg-white/[0.08] border border-white/[0.1] flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 text-white/50">
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="font-serif text-2xl text-white leading-tight mb-1">Verify your email.</h1>
          <p className="text-white/45 text-xs leading-relaxed">
            We sent a 6-digit code to your email.<br />Enter it below to activate your account.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* OTP boxes */}
          <div className="flex gap-2 justify-center" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                onFocus={(e) => e.target.select()}
                className={`w-11 h-13 py-3 text-center text-xl font-bold rounded-xl border transition-all duration-150 focus:outline-none
                  bg-white/[0.07] text-white
                  ${digit
                    ? "border-white/30 bg-white/[0.1]"
                    : "border-white/[0.1] placeholder:text-white/20"
                  }
                  focus:border-white/40 focus:bg-white/[0.12]
                  ${error ? "border-red-500/40" : ""}`}
              />
            ))}
          </div>

          <p className="text-[11px] text-white/25 text-center">
            Paste your code or type each digit
          </p>

          <button type="submit" disabled={loading || otp.join("").length < 6}
            className="w-full bg-white text-gray-900 font-bold text-sm py-3 rounded-xl hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-black/20">
            {loading
              ? <span className="flex items-center justify-center gap-2"><Spinner />Verifying…</span>
              : "Verify Account"}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-white/[0.08] text-center">
          <p className="text-white/35 text-sm">
            Wrong account?{" "}
            <Link href="/login" className="text-white/65 font-semibold hover:text-white transition-colors">Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-sm">
        <div className="bg-white/[0.07] backdrop-blur-2xl border border-white/[0.11] rounded-2xl p-10 shadow-2xl shadow-black/40 flex items-center justify-center">
          <Spinner />
        </div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";

const EyeOpen = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOff = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

const inputCls = "w-full bg-white/[0.07] border border-white/[0.1] text-white placeholder:text-white/25 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-white/30 focus:bg-white/[0.1] transition-all duration-150";
const labelCls = "block text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-1.5";

export default function RegisterPage() {
  const [loading, setLoading]           = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData]         = useState({ username: "", fullName: "", email: "", password: "", role: "1" });
  const [error, setError]               = useState("");
  const [success, setSuccess]           = useState(false);

  const { signup } = useAuth();
  const router = useRouter();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const validatePassword = (pw) => {
    if (pw.length < 8)            return "At least 8 characters required";
    if (!/[A-Z]/.test(pw))        return "Include at least one uppercase letter";
    if (!/[a-z]/.test(pw))        return "Include at least one lowercase letter";
    if (!/[0-9]/.test(pw))        return "Include at least one number";
    if (!/[^A-Za-z0-9]/.test(pw)) return "Include at least one special character";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const pwErr = validatePassword(formData.password);
    if (pwErr) { setError(pwErr); setLoading(false); return; }
    try {
      await signup(formData.username, formData.email, formData.password, formData.fullName, parseInt(formData.role));
      setSuccess(true);
      setTimeout(() => router.push(`/verify?username=${encodeURIComponent(formData.username)}`), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ── Success state ── */
  if (success) {
    return (
      <div className="w-full max-w-sm">
        <div className="bg-white/[0.07] backdrop-blur-2xl border border-white/[0.11] rounded-2xl p-10 shadow-2xl shadow-black/40 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="font-serif text-2xl text-white mb-2">You're in.</h2>
          <p className="text-white/45 text-sm leading-relaxed">
            Check your email to verify your account. Redirecting you now…
          </p>
        </div>
      </div>
    );
  }

  /* ── Form ── */
  return (
    <div className="w-full max-w-sm">
      <div className="bg-white/[0.07] backdrop-blur-2xl border border-white/[0.11] rounded-2xl p-6 shadow-2xl shadow-black/40">

        {/* Header */}
        <div className="mb-5">
          <h1 className="font-serif text-2xl text-white leading-tight mb-1">Create your account.</h1>
          <p className="text-white/45 text-xs">Join Pulse and take control of your health</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">

          {/* Username + Full Name — side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="username" className={labelCls}>Username</label>
              <input
                id="username" name="username" type="text"
                value={formData.username} onChange={handleChange}
                placeholder="johndoe" required
                pattern="^[a-zA-Z0-9_]+$"
                title="Letters, numbers, and underscores only"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="fullName" className={labelCls}>Full Name</label>
              <input
                id="fullName" name="fullName" type="text"
                value={formData.fullName} onChange={handleChange}
                placeholder="John Doe" required
                className={inputCls}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className={labelCls}>Email</label>
            <input
              id="email" name="email" type="email"
              value={formData.email} onChange={handleChange}
              placeholder="you@example.com" required
              className={inputCls}
            />
          </div>

          {/* Role */}
          <div>
            <label htmlFor="role" className={labelCls}>I am a</label>
            <div className="grid grid-cols-2 gap-2">
              {[{ value: "1", label: "Patient" }, { value: "2", label: "Provider" }].map((r) => (
                <button
                  key={r.value} type="button"
                  onClick={() => setFormData({ ...formData, role: r.value })}
                  className={`py-2.5 rounded-xl text-xs font-semibold border transition-all duration-150
                    ${formData.role === r.value
                      ? "bg-white/15 border-white/30 text-white"
                      : "bg-white/[0.04] border-white/[0.08] text-white/40 hover:text-white/60 hover:border-white/15"
                    }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className={labelCls}>Password</label>
            <div className="relative">
              <input
                id="password" name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password} onChange={handleChange}
                placeholder="••••••••" required minLength={8}
                className={`${inputCls} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showPassword ? <EyeOff /> : <EyeOpen />}
              </button>
            </div>
            <p className="mt-1.5 text-[11px] text-white/25 leading-relaxed">
              8+ chars · uppercase · lowercase · number · special character
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit" disabled={loading}
            className="w-full mt-1 bg-white text-gray-900 font-bold text-sm py-2.5 rounded-xl hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 shadow-lg shadow-black/20"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Creating account…
              </span>
            ) : "Create Account"}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-white/[0.08] text-center">
          <p className="text-white/35 text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-white/65 font-semibold hover:text-white transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

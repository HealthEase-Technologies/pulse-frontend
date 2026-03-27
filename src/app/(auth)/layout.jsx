"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AuthLayout({ children }) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0a0f1a 0%, #0d1520 40%, #0a1228 70%, #080d18 100%)" }}
    >
      {/* ── Depth layers ── */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 20% 50%, rgba(30,58,100,0.35) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(15,35,70,0.3) 0%, transparent 55%), radial-gradient(ellipse at 60% 80%, rgba(8,20,45,0.4) 0%, transparent 50%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.6) 100%)" }}
      />

      {/* ── Floating navbar — matches hero exactly ── */}
      <nav
        className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between px-3 py-1.5 rounded-full bg-white/8 backdrop-blur-xl border border-white/15"
        style={{ width: "min(780px, calc(100vw - 28px))" }}
      >
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-white/15 border border-white/25 backdrop-blur-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-3.5 h-3.5">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-white font-bold text-[15px] tracking-tight">Pulse</span>
        </Link>

        <div className="hidden md:flex items-center gap-5">
          {["Features", "Security", "For Providers", "About"].map((item) => (
            <a key={item} href="/#" className="text-white/55 text-xs font-medium hover:text-white transition-colors duration-150">
              {item}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-1">
          {isLogin ? (
            <>
              <span className="text-white/35 text-xs font-medium px-2.5">New here?</span>
              <Link href="/register" className="bg-white text-gray-900 text-xs font-bold px-4 py-1.5 rounded-full hover:bg-gray-100 transition-all duration-150 shadow-md shadow-black/20">
                Sign Up
              </Link>
            </>
          ) : (
            <>
              <span className="text-white/35 text-xs font-medium px-2.5">Have an account?</span>
              <Link href="/login" className="bg-white text-gray-900 text-xs font-bold px-4 py-1.5 rounded-full hover:bg-gray-100 transition-all duration-150 shadow-md shadow-black/20">
                Sign In
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ── Page content ── */}
      <div className="relative z-20 min-h-screen flex items-center justify-center px-4 py-24">
        {children}
      </div>
    </div>
  );
}

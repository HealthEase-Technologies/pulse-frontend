"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

function LogoMark() {
  return (
    <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-white/15 border border-white/25 backdrop-blur-sm">
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-3.5 h-3.5">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

const NAV_LINKS = [
  { label: "Features",  href: "/#features" },
  { label: "Pricing",   href: "/#pricing"  },
  { label: "For HCPs",  href: "/#hcp"      },
  { label: "Partners",  href: "/partners"  },
  { label: "Blog",      href: "/blog"      },
  { label: "About",     href: "/about"     },
  { label: "Contact",   href: "/contact"   },
];

export default function MarketingNav({ lang, onLangChange, authMode = false }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isLogin = pathname === "/login";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50" style={{ width: "min(860px, calc(100vw - 24px))" }}>
      <nav className={`flex items-center justify-between px-3 py-1.5 rounded-full transition-all duration-300
        ${scrolled
          ? "bg-white/12 backdrop-blur-2xl border border-white/20 shadow-xl shadow-black/30"
          : "bg-white/8 backdrop-blur-xl border border-white/15"
        }`}>
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <LogoMark />
          <span className="text-white font-bold text-[15px] tracking-tight">Pulse</span>
        </Link>

        <div className="hidden md:flex items-center gap-4">
          {NAV_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-xs font-medium transition-colors duration-150 whitespace-nowrap
                ${pathname === item.href ? "text-white" : "text-white/60 hover:text-white"}`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {onLangChange && (
            <button
              onClick={() => onLangChange((l) => (l === "en" ? "ar" : "en"))}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all duration-150 text-[11px] font-bold"
              aria-label="Switch language"
            >
              {lang === "en" ? "AR" : "EN"}
            </button>
          )}

          {authMode ? (
            <>
              <span className="hidden sm:block text-white/35 text-xs font-medium px-2.5">
                {isLogin ? "New here?" : "Have an account?"}
              </span>
              <Link
                href={isLogin ? "/register" : "/login"}
                className="bg-white text-gray-900 text-xs font-bold px-4 py-1.5 rounded-full hover:bg-gray-100 transition-all duration-150 shadow-md shadow-black/20 whitespace-nowrap"
              >
                {isLogin ? "Sign Up" : "Sign In"}
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:block text-white/80 text-xs font-semibold px-3 py-1.5 rounded-full hover:text-white hover:bg-white/10 transition-all duration-150 whitespace-nowrap"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="hidden sm:block bg-white text-gray-900 text-xs font-bold px-4 py-1.5 rounded-full hover:bg-gray-100 transition-all duration-150 shadow-md shadow-black/20 whitespace-nowrap"
              >
                Get Started
              </Link>
            </>
          )}

          <button
            onClick={() => setMobileOpen((open) => !open)}
            className="md:hidden w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all duration-150"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            )}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="md:hidden mt-2 rounded-2xl bg-white/10 backdrop-blur-2xl border border-white/15 shadow-xl shadow-black/30 overflow-hidden">
          <div className="px-4 py-3 space-y-0.5">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block text-white/70 text-sm font-medium py-2.5 px-3 rounded-xl hover:bg-white/10 hover:text-white transition-all duration-150"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="border-t border-white/10 px-4 py-3 flex items-center gap-2">
            {authMode ? (
              <Link
                href={isLogin ? "/register" : "/login"}
                onClick={() => setMobileOpen(false)}
                className="flex-1 text-center bg-white text-gray-900 text-xs font-bold py-2 px-3 rounded-xl hover:bg-gray-100 transition-all shadow-sm"
              >
                {isLogin ? "Sign Up" : "Sign In"}
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center text-white/80 text-xs font-semibold py-2 px-3 rounded-xl bg-white/[0.06] hover:bg-white/10 transition-all border border-white/10"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center bg-white text-gray-900 text-xs font-bold py-2 px-3 rounded-xl hover:bg-gray-100 transition-all shadow-sm"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

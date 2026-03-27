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

export default function MarketingNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between px-3 py-1.5 rounded-full transition-all duration-300
        ${scrolled
          ? "bg-white/12 backdrop-blur-2xl border border-white/20 shadow-xl shadow-black/30"
          : "bg-white/8  backdrop-blur-xl  border border-white/15"
        }`}
      style={{ width: "min(780px, calc(100vw - 28px))" }}
    >
      <Link href="/" className="flex items-center gap-2">
        <LogoMark />
        <span className="text-white font-bold text-[15px] tracking-tight">Pulse</span>
      </Link>

      <div className="hidden md:flex items-center gap-5">
        {[
          { label: "Features",  href: "/#features" },
          { label: "For HCPs",  href: "/#hcp"      },
          { label: "Blog",      href: "/blog"       },
          { label: "About",     href: "/about"      },
          { label: "Contact",   href: "/contact"    },
        ].map((item) => (
          <Link key={item.label} href={item.href}
            className={`text-xs font-medium transition-colors duration-150
              ${pathname === item.href ? "text-white" : "text-white/60 hover:text-white"}`}>
            {item.label}
          </Link>
        ))}
      </div>

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
  );
}

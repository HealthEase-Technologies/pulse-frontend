"use client";

import MarketingNav from "@/components/MarketingNav";

export default function AuthLayout({ children }) {
  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0a0f1a 0%, #0d1520 40%, #0a1228 70%, #080d18 100%)" }}
    >
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

      <MarketingNav />

      <div className="relative z-20 min-h-screen flex items-center justify-center px-4 py-24">
        {children}
      </div>
    </div>
  );
}

import { Inter, Instrument_Serif, Cairo } from "next/font/google";
import { Providers } from "@/components/Providers";
import ElevenLabsWidget from "@/components/ElevenLabsWidget";
import CustomCursor from "@/components/CustomCursor";
import PostHogProvider from "@/components/PostHogProvider";
import PostHogPageView from "@/components/PostHogPageView";
import { Suspense } from "react";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  weight: ["400", "500", "600", "700"],
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-arabic",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-serif",
});

export const metadata = {
  title: "Pulse",
  description: "Pulse - Unified Healthcare Monitoring Platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.className} ${instrumentSerif.variable} ${cairo.variable} antialiased`} suppressHydrationWarning>
      <body>
        <PostHogProvider>
          <Providers>{children}</Providers>
          <Suspense fallback={null}>
            <PostHogPageView />
          </Suspense>
          <ElevenLabsWidget />
          <CustomCursor />
        </PostHogProvider>
      </body>
    </html>
  );
}
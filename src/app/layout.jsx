import { Inter, Instrument_Serif, Cairo } from "next/font/google";
import { Providers } from "@/components/Providers";
import ElevenLabsWidget from "@/components/ElevenLabsWidget";
import CustomCursor from "@/components/CustomCursor";
import PostHogProvider from "@/components/PostHogProvider";
import PostHogPageView from "@/components/PostHogPageView";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
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
  title: {
    default: "Pulse — Real-Time Health Monitoring",
    template: "%s | Pulse",
  },
  description:
    "Stream your vitals in real time, solo or alongside your Healthcare Provider. AI-powered health insights, HCP connections, and personalised recommendations.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  ),
  openGraph: {
    type: "website",
    url: "https://getpulse.app",
    siteName: "Pulse",
    title: "Pulse — Real-Time Health Monitoring",
    description:
      "Your health is happening right now. Stream your vitals in real time with Pulse.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Pulse — Real-Time Health Monitoring",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pulse — Real-Time Health Monitoring",
    description:
      "Your health is happening right now. Stream your vitals in real time with Pulse.",
    images: ["/opengraph-image"],
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Pulse",
  },
  icons: {
    icon: [{ url: "/icon", type: "image/png" }],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport = {
  themeColor: "#6366f1",
  width: "device-width",
  initialScale: 1,
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
          <ServiceWorkerRegistrar />
        </PostHogProvider>
      </body>
    </html>
  );
}
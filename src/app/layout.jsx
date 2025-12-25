import { Inter } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "Pulse",
  description:
    "Pulse - Unified Healthcare Monitoring Platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.className} antialiased`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
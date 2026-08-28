import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kairo-heatshield.vercel.app"),
  title: { default: "KAIRO HeatShield", template: "%s · KAIRO HeatShield" },
  description: "KAIRO turns FortyGuard hyperlocal temperature into clear, evidence-backed priorities for urban heat resilience.",
  openGraph: {
    type: "website",
    title: "KAIRO HeatShield · From temperature to priority",
    description: "A judge-ready urban heat decision system built on verified FortyGuard temperature intelligence.",
    url: "/",
    siteName: "KAIRO HeatShield",
    images: [{ url: "/visuals/kairo-thermal-twin.avif", width: 1400, height: 900, alt: "KAIRO thermal digital twin of Phoenix" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "KAIRO HeatShield · From temperature to priority",
    description: "Verified temperature intelligence, explainable priorities, and assessment-first urban heat actions.",
    images: ["/visuals/kairo-thermal-twin.avif"],
  },
  icons: {
    icon: [{ url: "/visuals/logo.svg", type: "image/svg+xml" }],
    apple: [{ url: "/visuals/logo.svg" }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body>
        <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
      </body>
    </html>
  );
}

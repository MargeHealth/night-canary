import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://night-canary.heysalad-o.workers.dev"),
  title: {
    default: "NightCanary — Sleep Apnoea Screening",
    template: "%s · NightCanary",
  },
  applicationName: "NightCanary",
  description: "Catch sleep apnoea before it catches you. A self-screening tool that prepares a structured letter for your GP.",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "NightCanary — Sleep Apnoea Screening",
    description: "Catch sleep apnoea before it catches you. A self-screening tool that prepares a structured letter for your GP.",
    images: [{ url: "/brand/night-canary-mark.png", width: 512, height: 512, alt: "NightCanary crescent bird mark" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-slate-900">{children}</body>
    </html>
  );
}

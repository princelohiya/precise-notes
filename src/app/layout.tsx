import type { Metadata, Viewport } from "next";
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

// Upgraded metadata tailored to the project for better SEO and browser tabs
export const metadata: Metadata = {
  title: "Precise Notes | Local AI Lecture Synthesizer",
  description:
    "An intelligent, privacy-first lecture synthesizer. Process massive local video files completely in your browser via WebAssembly and Gemini AI.",
  icons: {
    icon: "/favicon.ico",
  },
};

// Separating viewport configurations is a Next.js 14+ best practice
export const viewport: Viewport = {
  themeColor: "#0a0a0a", // Matches bg-neutral-950
  colorScheme: "dark",
};

// Replaced the custom LayoutProps with standard Next.js Readonly ReactNode typing
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning // Prevents hydration mismatch warnings if browser extensions inject styles
      className={`${geistSans.variable} ${geistMono.variable} antialiased h-full`}
    >
      <body className="min-h-full flex flex-col bg-neutral-950 text-neutral-100 selection:bg-sky-500/30 selection:text-sky-200">
        {children}
      </body>
    </html>
  );
}

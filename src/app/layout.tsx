import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

// Display serif for chapter titles only (OFL). Self-hosted by next/font at build time; no runtime request to Google.
const display = Instrument_Serif({ weight: "400", style: ["normal", "italic"], subsets: ["latin"], variable: "--font-instrument", display: "swap" });

export const metadata: Metadata = {
  title: "Spatial DOM Transition Lab — Code-to-Component Morph Engine",
  description: "Watch matching pieces move from a fixed code example to a component.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} ${display.variable}`}><body>{children}</body></html>;
}

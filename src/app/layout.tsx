import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spatial DOM Transition Lab — Code-to-Component Morph Engine",
  description: "Watch matching pieces move from a fixed code example to a component.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

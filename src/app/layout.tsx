import type { Metadata } from "next";
import { Hanken_Grotesk, Instrument_Serif } from "next/font/google";
import "./globals.css";

const body = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
});

const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "AI Saathi | Dukaan ka hisaab, ab baat karke",
  description:
    "AI business assistant for small shop owners in Pakistan: stock, sales aur udhaar ke sawal Roman Urdu mein.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}

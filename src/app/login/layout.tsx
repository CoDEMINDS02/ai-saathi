import { Instrument_Serif, Hanken_Grotesk } from "next/font/google";

const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});
const body = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${display.variable} ${body.variable}`}>{children}</div>;
}

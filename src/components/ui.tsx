import Link from "next/link";
import type { ReactNode } from "react";
import Nav from "@/components/Nav";

export const rs = (n: number) => `Rs ${n.toLocaleString("en-US")}`;

export function PageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <header className="mb-7">
          <h1 className="font-display text-4xl leading-tight text-ink">{title}</h1>
          {subtitle && <p className="mt-1.5 text-muted">{subtitle}</p>}
        </header>
        {children}
      </main>
    </>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-line bg-white shadow-sm shadow-ink/5 ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  count,
  href,
  hrefLabel,
}: {
  title: string;
  count?: number;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
      <div className="flex items-center gap-2.5">
        <h2 className="text-base font-semibold">{title}</h2>
        {count !== undefined && (
          <span className="rounded-full bg-paper px-2 py-0.5 text-xs font-medium tabular-nums text-muted ring-1 ring-line">
            {count}
          </span>
        )}
      </div>
      {href && (
        <Link href={href} className="text-sm font-medium text-ink-2 hover:underline">
          {hrefLabel ?? "Sab dekhein"}
        </Link>
      )}
    </div>
  );
}

type Tone = "default" | "bad" | "warn" | "good";

const statText: Record<Tone, string> = {
  default: "text-ink",
  bad: "text-bad",
  warn: "text-warn",
  good: "text-good",
};
const statBar: Record<Tone, string> = {
  default: "bg-ink",
  bad: "bg-bad",
  warn: "bg-amber",
  good: "bg-good",
};

export function Stat({
  label,
  value,
  sub,
  tone = "default",
  href,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: Tone;
  href?: string;
}) {
  const inner = (
    <div className="relative h-full p-5">
      <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-1 ${statBar[tone]}`} />
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tracking-tight tabular-nums ${statText[tone]}`}>
        {value}
      </p>
      <p className="mt-1 text-sm text-muted">{sub}</p>
    </div>
  );
  const base = "block overflow-hidden rounded-xl border border-line bg-white shadow-sm shadow-ink/5";
  if (href) {
    return (
      <Link
        href={href}
        className={`${base} transition duration-150 hover:-translate-y-0.5 hover:border-line-2 hover:shadow-md`}
      >
        {inner}
      </Link>
    );
  }
  return <div className={base}>{inner}</div>;
}

const badgeTone = {
  good: "bg-good-bg text-good",
  bad: "bg-bad-bg text-bad",
  warn: "bg-warn-bg text-warn",
  neutral: "bg-paper text-muted ring-1 ring-line",
} as const;

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: keyof typeof badgeTone;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeTone[tone]}`}
    >
      <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current" />
      {children}
    </span>
  );
}

export function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink text-xs font-semibold text-paper">
      {initials}
    </span>
  );
}

export const th = "px-4 py-3 font-medium";
export const td = "px-4 py-3.5";

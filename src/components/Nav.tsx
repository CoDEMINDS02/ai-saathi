"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/assistant", label: "Assistant" },
  { href: "/inventory", label: "Inventory" },
  { href: "/customers", label: "Customers" },
  { href: "/payments", label: "Payments" },
];

function BrandMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <rect x="3" y="2" width="22" height="24" rx="3" fill="#14213D" />
      <path d="M8 9h12M8 14h12M8 19h7" stroke="#F7F8FC" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="21" cy="20" r="3.2" fill="#F2A900" />
    </svg>
  );
}

export default function Nav() {
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function logout() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      let res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.status === 405) res = await fetch("/api/auth/logout", { method: "GET" });
      if (res.ok) {
        window.location.assign("/login");
        return;
      }
      setError("Logout nahi hua");
    } catch {
      setError("Logout nahi hua");
    }
    setBusy(false);
  }

  return (
    <nav
      aria-label="Main"
      className="sticky top-0 z-20 h-16 border-b border-line bg-white/90 backdrop-blur"
    >
      <div className="mx-auto flex h-full w-full max-w-5xl items-center gap-3 px-4 sm:gap-5 sm:px-6">
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2.5">
          <BrandMark />
          <span className="hidden text-lg font-semibold tracking-tight sm:inline">AI Saathi</span>
        </Link>

        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {links.map((l) => {
            const active = pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  active ? "bg-ink text-white" : "text-soft hover:bg-paper hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {error && (
            <span role="alert" className="hidden text-xs text-bad sm:inline">
              {error}
            </span>
          )}
          <button
            type="button"
            onClick={logout}
            disabled={busy}
            className="rounded-lg border border-line-2 px-3 py-1.5 text-sm font-medium text-soft transition-colors hover:border-ink hover:text-ink disabled:cursor-wait disabled:opacity-60"
          >
            {busy ? "Ruk jayein..." : "Logout"}
          </button>
        </div>
      </div>
    </nav>
  );
}

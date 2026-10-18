import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSalesSummary } from "@/services/sales.service";
import { getLowStock } from "@/services/inventory.service";
import { listPendingAccounts, listOverdueAccounts } from "@/services/credit.service";
import { Card, CardHeader, PageShell, Stat, rs } from "@/components/ui";

export const dynamic = "force-dynamic";

function notNull<T>(x: T | null | undefined): x is T {
  return x !== null && x !== undefined;
}

const labels: Record<string, string> = {
  REMINDER_DRAFTED: "Reminder ka draft bana",
  REMINDER_APPROVED: "Reminder manzoor hua",
  REMINDER_REJECTED: "Reminder radd hua",
};

const dots: Record<string, string> = {
  REMINDER_DRAFTED: "bg-amber",
  REMINDER_APPROVED: "bg-good",
  REMINDER_REJECTED: "bg-bad",
};

export default async function DashboardPage() {
  const [sales, pendingRaw, overdueRaw, lowRaw, activity] = await Promise.all([
    getSalesSummary("today"),
    listPendingAccounts(),
    listOverdueAccounts(),
    getLowStock(),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const pending = pendingRaw.filter(notNull);
  const overdue = overdueRaw.filter(notNull);
  const low = lowRaw.filter(notNull);
  const totalPending = pending.reduce((s, a) => s + a.totalOutstanding, 0);
  const overdueTotal = overdue.reduce((s, a) => s + a.overdueAmount, 0);

  const today = new Date().toLocaleDateString("en-GB", {
    timeZone: "Asia/Karachi",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <PageShell title="Dashboard" subtitle={today}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          href="/assistant"
          label="Aaj ki sales"
          value={rs(sales.totalSales)}
          sub={`${sales.transactionCount} sales`}
        />
        <Stat
          href="/payments"
          label="Pending payments"
          value={rs(totalPending)}
          sub={`${pending.length} customers`}
          tone="warn"
        />
        <Stat
          href="/payments"
          label="Overdue"
          value={rs(overdueTotal)}
          sub={`${overdue.length} customers`}
          tone="bad"
        />
        <Stat
          href="/inventory"
          label="Low stock"
          value={`${low.length} products`}
          sub="Inventory dekhein"
          tone="warn"
        />
      </div>

      <Link
        href="/assistant"
        className="group my-6 flex items-center justify-between gap-4 rounded-xl bg-ink px-5 py-4 text-paper transition-colors hover:bg-ink-2"
      >
        <span>
          <span className="font-display block text-2xl">AI Saathi se poochein</span>
          <span className="mt-1 block text-sm text-paper/75">
            &quot;Mera low stock batao&quot; &middot; &quot;Kin customers ki payments pending
            hain?&quot;
          </span>
        </span>
        <span
          aria-hidden="true"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-amber text-ink transition-transform group-hover:translate-x-0.5"
        >
          &rarr;
        </span>
      </Link>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Low stock" count={low.length} href="/inventory" hrefLabel="Inventory" />
          {low.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted">Sab products ka stock theek hai.</p>
          ) : (
            <ul className="divide-y divide-line px-5">
              {low.map((p) => {
                const pct =
                  p.reorderLevel > 0
                    ? Math.max(4, Math.min(100, Math.round((p.stock / p.reorderLevel) * 100)))
                    : 0;
                return (
                  <li key={p.name} className="py-3.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-medium">{p.name}</span>
                      <span className="shrink-0 text-sm tabular-nums text-muted">
                        <span className="font-semibold text-bad">{p.stock} bacha</span> &middot;
                        level {p.reorderLevel}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                      <div
                        className={`h-full rounded-full ${pct < 35 ? "bg-bad" : "bg-amber"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Haal ki activity" />
          {activity.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted">Abhi koi activity nahi.</p>
          ) : (
            <ul className="divide-y divide-line px-5">
              {activity.map((a) => (
                <li key={a.id} className="flex items-start gap-3 py-3.5">
                  <span
                    aria-hidden="true"
                    className={`mt-1.5 size-2 shrink-0 rounded-full ${dots[a.action] ?? "bg-muted"}`}
                  />
                  <div>
                    <p className="font-medium">{labels[a.action] ?? a.action}</p>
                    <p className="mt-0.5 text-xs tabular-nums text-muted">
                      {a.createdAt.toLocaleString("en-GB", { timeZone: "Asia/Karachi" })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </PageShell>
  );
}

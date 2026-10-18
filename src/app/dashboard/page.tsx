import Link from "next/link";
import Nav from "@/components/Nav";
import { prisma } from "@/lib/prisma";
import { getSalesSummary } from "@/services/sales.service";
import { getLowStock } from "@/services/inventory.service";
import { listPendingAccounts, listOverdueAccounts } from "@/services/credit.service";

export const dynamic = "force-dynamic";

const rs = (n: number) => `Rs ${n.toLocaleString("en-US")}`;

function notNull<T>(x: T | null | undefined): x is T {
  return x !== null && x !== undefined;
}

const card = {
  border: "1px solid #fff",
  borderRadius: 12,
  padding: 16,
  color: "#fff",
  textDecoration: "none",
  display: "block",
} as const;

const labels: Record<string, string> = {
  REMINDER_DRAFTED: "Reminder ka draft bana",
  REMINDER_APPROVED: "Reminder manzoor hua",
  REMINDER_REJECTED: "Reminder radd hua",
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

  return (
    <main style={{ color: "#fff", minHeight: "100vh" }}>
      <Nav />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 48px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 20 }}>Dashboard</h1>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 16, marginBottom: 24 }}>
          <Link href="/assistant" style={card}>
            <div style={{ opacity: 0.7, fontSize: 14 }}>Aaj ki sales</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{rs(sales.totalSales)}</div>
            <div style={{ opacity: 0.7, fontSize: 13 }}>{sales.transactionCount} sales</div>
          </Link>
          <Link href="/payments" style={card}>
            <div style={{ opacity: 0.7, fontSize: 14 }}>Pending payments</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{rs(totalPending)}</div>
            <div style={{ opacity: 0.7, fontSize: 13 }}>{pending.length} customers</div>
          </Link>
          <Link href="/payments" style={card}>
            <div style={{ opacity: 0.7, fontSize: 14 }}>Overdue</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#ff8a8a" }}>{rs(overdueTotal)}</div>
            <div style={{ opacity: 0.7, fontSize: 13 }}>{overdue.length} customers</div>
          </Link>
          <Link href="/inventory" style={card}>
            <div style={{ opacity: 0.7, fontSize: 14 }}>Low stock</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#ffb86b" }}>{low.length} products</div>
            <div style={{ opacity: 0.7, fontSize: 13 }}>Inventory dekhein</div>
          </Link>
        </div>

        <Link
          href="/assistant"
          style={{ display: "block", background: "#2b3a67", color: "#fff", textDecoration: "none", borderRadius: 12, padding: "14px 18px", marginBottom: 24, fontWeight: 600 }}
        >
          AI Saathi se poochein: &quot;Mera low stock batao&quot;, &quot;Kin customers ki payments pending hain?&quot;
        </Link>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
          <div style={{ border: "1px solid #fff", borderRadius: 12, padding: 16 }}>
            <h2 style={{ fontSize: 18, marginBottom: 12 }}>Low stock ({low.length})</h2>
            {low.length === 0 && <div style={{ opacity: 0.7 }}>Sab products ka stock theek hai.</div>}
            {low.map((p) => (
              <div key={p.name} style={{ padding: "6px 0", borderBottom: "1px solid #333" }}>
                {p.name}: {p.stock} bacha (level {p.reorderLevel})
              </div>
            ))}
          </div>

          <div style={{ border: "1px solid #fff", borderRadius: 12, padding: 16 }}>
            <h2 style={{ fontSize: 18, marginBottom: 12 }}>Haal ki activity</h2>
            {activity.length === 0 && <div style={{ opacity: 0.7 }}>Abhi koi activity nahi.</div>}
            {activity.map((a) => (
              <div key={a.id} style={{ padding: "6px 0", borderBottom: "1px solid #333" }}>
                <div>{labels[a.action] ?? a.action}</div>
                <div style={{ opacity: 0.6, fontSize: 12 }}>
                  {a.createdAt.toLocaleString("en-GB", { timeZone: "Asia/Karachi" })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

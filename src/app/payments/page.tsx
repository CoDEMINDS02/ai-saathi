import Nav from "@/components/Nav";
import { listPendingAccounts, listOverdueAccounts } from "@/services/credit.service";

export const dynamic = "force-dynamic";

const cell = { padding: "10px 12px", borderBottom: "1px solid #333", textAlign: "left" } as const;
const rs = (n: number) => `Rs ${n.toLocaleString("en-US")}`;
const card = { border: "1px solid #fff", borderRadius: 12, padding: 16, minWidth: 180 } as const;

export default async function PaymentsPage() {
  const notNull = <T,>(x: T | null): x is T => x !== null;
  const [pendingRaw, overdueRaw] = await Promise.all([listPendingAccounts(), listOverdueAccounts()]);
  const pending = pendingRaw.filter(notNull);
  const overdue = overdueRaw.filter(notNull);
  const total = pending.reduce((s, a) => s + a.totalOutstanding, 0);
  const overdueTotal = overdue.reduce((s, a) => s + a.overdueAmount, 0);

  return (
    <main style={{ color: "#fff", minHeight: "100vh" }}>
      <Nav />
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px 48px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 20 }}>Payments</h1>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
          <div style={card}>
            <div style={{ opacity: 0.7, fontSize: 14 }}>Total baqi</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{rs(total)}</div>
            <div style={{ opacity: 0.7, fontSize: 13 }}>{pending.length} customers</div>
          </div>
          <div style={card}>
            <div style={{ opacity: 0.7, fontSize: 14 }}>Overdue</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#ff8a8a" }}>{rs(overdueTotal)}</div>
            <div style={{ opacity: 0.7, fontSize: 13 }}>{overdue.length} customers</div>
          </div>
        </div>

        <div style={{ overflowX: "auto", border: "1px solid #fff", borderRadius: 12 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={cell}>Customer</th>
                <th style={cell}>Total baqi</th>
                <th style={cell}>Overdue</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((a) => (
                <tr key={a.name}>
                  <td style={cell}>{a.name}</td>
                  <td style={cell}>{rs(a.totalOutstanding)}</td>
                  <td style={{ ...cell, color: a.overdueAmount > 0 ? "#ff8a8a" : "inherit" }}>
                    {a.overdueAmount > 0 ? rs(a.overdueAmount) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}


import Nav from "@/components/Nav";
import { prisma } from "@/lib/prisma";
import { listPendingAccounts } from "@/services/credit.service";

export const dynamic = "force-dynamic";

const cell = { padding: "10px 12px", borderBottom: "1px solid #333", textAlign: "left" } as const;
const rs = (n: number) => `Rs ${n.toLocaleString("en-US")}`;

export default async function CustomersPage() {
  const [customers, pending] = await Promise.all([
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    listPendingAccounts(),
  ]);
  const owed = new Map(pending.flatMap((a) => (a ? [[a.name, a] as const] : [])));

  return (
    <main style={{ color: "#fff", minHeight: "100vh" }}>
      <Nav />
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px 48px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>Customers</h1>
        <p style={{ opacity: 0.7, margin: "8px 0 20px" }}>{customers.length} customers</p>
        <div style={{ overflowX: "auto", border: "1px solid #fff", borderRadius: 12 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={cell}>Naam</th>
                <th style={cell}>Phone</th>
                <th style={cell}>Baqi</th>
                <th style={cell}>Overdue</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => {
                const a = owed.get(c.name);
                return (
                  <tr key={c.id}>
                    <td style={cell}>{c.name}</td>
                    <td style={cell}>{c.phone ?? "-"}</td>
                    <td style={cell}>{a ? rs(a.totalOutstanding) : "-"}</td>
                    <td style={{ ...cell, color: a && a.overdueAmount > 0 ? "#ff8a8a" : "inherit" }}>
                      {a && a.overdueAmount > 0 ? rs(a.overdueAmount) : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}


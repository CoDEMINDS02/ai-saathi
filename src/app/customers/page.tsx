import { prisma } from "@/lib/prisma";
import { listPendingAccounts } from "@/services/credit.service";
import { Avatar, Badge, Card, PageShell, rs, td, th } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const [customers, pending] = await Promise.all([
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    listPendingAccounts(),
  ]);
  const owed = new Map(pending.flatMap((a) => (a ? [[a.name, a] as const] : [])));

  return (
    <PageShell title="Customers" subtitle={`${customers.length} customers`}>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left text-sm">
            <thead className="bg-paper text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className={th}>Naam</th>
                <th className={th}>Phone</th>
                <th className={`${th} text-right`}>Baqi</th>
                <th className={`${th} text-right`}>Overdue</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => {
                const a = owed.get(c.name);
                const hasOverdue = !!a && a.overdueAmount > 0;
                return (
                  <tr key={c.id} className="border-t border-line transition-colors hover:bg-paper/70">
                    <td className={td}>
                      <div className="flex items-center gap-3">
                        <Avatar name={c.name} />
                        <span className="font-medium">{c.name}</span>
                      </div>
                    </td>
                    <td className={`${td} tabular-nums text-muted`}>{c.phone ?? "-"}</td>
                    <td className={`${td} text-right tabular-nums`}>
                      {a ? rs(a.totalOutstanding) : <span className="text-muted">-</span>}
                    </td>
                    <td className={`${td} text-right`}>
                      {hasOverdue ? (
                        <Badge tone="bad">{rs(a.overdueAmount)}</Badge>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </PageShell>
  );
}

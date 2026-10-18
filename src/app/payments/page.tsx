import { listPendingAccounts, listOverdueAccounts } from "@/services/credit.service";
import { Avatar, Badge, Card, PageShell, Stat, rs, td, th } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const notNull = <T,>(x: T | null): x is T => x !== null;
  const [pendingRaw, overdueRaw] = await Promise.all([listPendingAccounts(), listOverdueAccounts()]);
  const pending = pendingRaw.filter(notNull);
  const overdue = overdueRaw.filter(notNull);
  const total = pending.reduce((s, a) => s + a.totalOutstanding, 0);
  const overdueTotal = overdue.reduce((s, a) => s + a.overdueAmount, 0);

  return (
    <PageShell title="Payments" subtitle="Customers ka baqi udhaar aur overdue hisaab.">
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:max-w-xl">
        <Stat label="Total baqi" value={rs(total)} sub={`${pending.length} customers`} tone="warn" />
        <Stat label="Overdue" value={rs(overdueTotal)} sub={`${overdue.length} customers`} tone="bad" />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-left text-sm">
            <thead className="bg-paper text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className={th}>Customer</th>
                <th className={`${th} text-right`}>Total baqi</th>
                <th className={`${th} text-right`}>Overdue</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((a) => (
                <tr key={a.name} className="border-t border-line transition-colors hover:bg-paper/70">
                  <td className={td}>
                    <div className="flex items-center gap-3">
                      <Avatar name={a.name} />
                      <span className="font-medium">{a.name}</span>
                    </div>
                  </td>
                  <td className={`${td} text-right tabular-nums`}>{rs(a.totalOutstanding)}</td>
                  <td className={`${td} text-right`}>
                    {a.overdueAmount > 0 ? (
                      <Badge tone="bad">{rs(a.overdueAmount)}</Badge>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </PageShell>
  );
}

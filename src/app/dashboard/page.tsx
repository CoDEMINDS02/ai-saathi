import { getSalesSummary } from "@/services/sales.service";
import { getLowStock } from "@/services/inventory.service";
import { listPendingAccounts, listOverdueAccounts } from "@/services/credit.service";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [today, lowStock, pending, overdue] = await Promise.all([
    getSalesSummary("today"),
    getLowStock(),
    listPendingAccounts(),
    listOverdueAccounts(),
  ]);

  const pendingTotal = pending.reduce((s, b) => s + b!.totalOutstanding, 0);

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">AI Saathi dashboard</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border p-4">
          <p className="text-sm text-gray-500">Aaj ki sales</p>
          <p className="text-xl font-semibold">Rs {today.totalSales.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-sm text-gray-500">Pending payments</p>
          <p className="text-xl font-semibold">Rs {pendingTotal.toLocaleString()}</p>
          <p className="text-sm text-gray-500">{overdue.length} overdue</p>
        </div>
      </div>

      <div className="rounded-xl border p-4">
        <p className="mb-2 font-medium">Low stock ({lowStock.length})</p>
        <ul className="space-y-1 text-sm">
          {lowStock.map((p) => (
            <li key={p.id}>
              {p.name}: {p.stock} bacha (level {p.reorderLevel})
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

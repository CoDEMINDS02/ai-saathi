import { NextResponse } from "next/server";
import { getSalesSummary } from "@/services/sales.service";
import { getLowStock, getInventorySummary } from "@/services/inventory.service";
import { listPendingAccounts, listOverdueAccounts } from "@/services/credit.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const [today, week, lowStock, inventory, pending, overdue] = await Promise.all([
    getSalesSummary("today"),
    getSalesSummary("week"),
    getLowStock(),
    getInventorySummary(),
    listPendingAccounts(),
    listOverdueAccounts(),
  ]);

  return NextResponse.json({
    sales: { today, week },
    inventory: { ...inventory, lowStock },
    payments: {
      pendingTotal: pending.reduce((s, b) => s + b!.totalOutstanding, 0),
      pendingCount: pending.length,
      overdueCount: overdue.length,
    },
  });
}
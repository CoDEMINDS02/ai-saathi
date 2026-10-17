import { prisma } from "@/lib/prisma";

export type Period = "today" | "week" | "month";

export async function getSalesSummary(period: Period = "today") {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (period === "week") start.setDate(start.getDate() - 6);
  if (period === "month") start.setDate(start.getDate() - 29);

  const sales = await prisma.sale.findMany({ where: { date: { gte: start } } });

  return {
    period,
    totalSales: sales.reduce((s, x) => s + x.total, 0),
    transactionCount: sales.length,
  };
}
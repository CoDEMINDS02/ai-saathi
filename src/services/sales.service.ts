import { prisma } from "@/lib/prisma";
import { logAction } from "./audit.service";

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

export type SaleInput = {
  items: { productId: string; quantity: number }[];
  paymentType: "CASH" | "CREDIT";
  customerId?: string;
};

export async function createSale(input: SaleInput) {
  if (input.paymentType === "CREDIT" && !input.customerId) {
    throw new Error("Udhaar sale ke liye customer chunna zaroori hai.");
  }

  const sale = await prisma.$transaction(
    async (tx) => {
      let total = 0;
      const lines: { productId: string; quantity: number; unitPrice: number }[] = [];

      for (const item of input.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) throw new Error("Product nahi mila.");
        if (product.stock < item.quantity) {
          throw new Error(`${product.name} ka stock kam hai (sirf ${product.stock} bacha hai).`);
        }
        await tx.product.update({
          where: { id: product.id },
          data: { stock: { decrement: item.quantity } },
        });
        total += product.price * item.quantity;
        lines.push({ productId: product.id, quantity: item.quantity, unitPrice: product.price });
      }

      const created = await tx.sale.create({
        data: {
          total,
          paymentType: input.paymentType,
          customerId: input.customerId,
          items: { create: lines },
        },
      });

      if (input.paymentType === "CREDIT" && input.customerId) {
        await tx.creditEntry.create({
          data: {
            customerId: input.customerId,
            amount: total,
            dueDate: new Date(Date.now() + 15 * 86400000),
          },
        });
      }
      return created;
    },
    { timeout: 20000 }
  );

  await logAction("SALE_CREATED", `sale=${sale.id} total=${sale.total}`);
  return sale;
}

export async function listRecentSales(limit = 20) {
  return prisma.sale.findMany({
    orderBy: { date: "desc" },
    take: limit,
    include: { customer: true, items: { include: { product: true } } },
  });
}
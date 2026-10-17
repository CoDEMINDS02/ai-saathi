import { prisma } from "@/lib/prisma";

const outstanding = (e: { amount: number; paidAmount: number }) =>
  e.amount - e.paidAmount;

export async function getCustomerBalance(customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: { credits: { orderBy: { dueDate: "asc" } } },
  });
  if (!customer) return null;

  const now = new Date();
  const open = customer.credits.filter((c) => outstanding(c) > 0);
  const overdue = open.filter((c) => c.dueDate < now);

  return {
    customerId: customer.id,
    name: customer.name,
    phone: customer.phone,
    totalOutstanding: open.reduce((s, c) => s + outstanding(c), 0),
    overdueAmount: overdue.reduce((s, c) => s + outstanding(c), 0),
    nextDueDate: open[0]?.dueDate ?? null,
    entries: open.map((c) => ({
      id: c.id,
      outstanding: outstanding(c),
      dueDate: c.dueDate,
      isOverdue: c.dueDate < now,
    })),
  };
}

export async function listPendingAccounts() {
  const customers = await prisma.customer.findMany({ select: { id: true } });
  const balances = await Promise.all(customers.map((c) => getCustomerBalance(c.id)));
  return balances
    .filter((b) => b && b.totalOutstanding > 0)
    .sort((a, b) => b!.totalOutstanding - a!.totalOutstanding);
}

export async function listOverdueAccounts() {
  const pending = await listPendingAccounts();
  return pending.filter((b) => b!.overdueAmount > 0);
}
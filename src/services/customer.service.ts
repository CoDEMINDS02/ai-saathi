import { prisma } from "@/lib/prisma";
import { getCustomerBalance } from "./credit.service";

export async function listCustomers() {
  const customers = await prisma.customer.findMany({ orderBy: { name: "asc" } });
  const balances = await Promise.all(customers.map((c) => getCustomerBalance(c.id)));
  return balances.filter((b) => b !== null);
}

export async function findCustomersByName(name: string) {
  return prisma.customer.findMany({
    where: { name: { contains: name.trim(), mode: "insensitive" } },
    take: 5,
  });
}

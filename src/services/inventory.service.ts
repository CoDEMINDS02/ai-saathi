import { prisma } from "@/lib/prisma";

export async function getLowStock() {
  const products = await prisma.product.findMany({ orderBy: { stock: "asc" } });
  return products
    .filter((p) => p.stock < p.reorderLevel)
    .map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      stock: p.stock,
      reorderLevel: p.reorderLevel,
      suggestedReorderQty: Math.max(p.reorderLevel * 2 - p.stock, 1),
    }));
}

export async function searchProducts(query: string) {
  return prisma.product.findMany({
    where: { name: { contains: query, mode: "insensitive" } },
    orderBy: { name: "asc" },
    take: 20,
  });
}

export async function getInventorySummary() {
  const products = await prisma.product.findMany();
  const lowStock = products.filter((p) => p.stock < p.reorderLevel);
  return {
    totalProducts: products.length,
    lowStockCount: lowStock.length,
    stockValue: products.reduce((sum, p) => sum + p.stock * p.price, 0),
  };
}
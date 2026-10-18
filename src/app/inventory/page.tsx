import { prisma } from "@/lib/prisma";
import { Badge, Card, PageShell, td, th } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const all = await prisma.product.findMany({ orderBy: { name: "asc" } });
  // Low stock pehle, baqi naam ke hisaab se
  const products = [...all].sort(
    (a, b) => Number(b.stock < b.reorderLevel) - Number(a.stock < a.reorderLevel)
  );
  const low = all.filter((p) => p.stock < p.reorderLevel).length;

  return (
    <PageShell
      title="Inventory"
      subtitle={`${all.length} products, ${low} ka stock reorder level se neeche hai.`}
    >
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead className="bg-paper text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className={th}>Product</th>
                <th className={th}>SKU</th>
                <th className={`${th} text-right`}>Stock</th>
                <th className={`${th} text-right`}>Reorder level</th>
                <th className={`${th} text-right`}>Price</th>
                <th className={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const isLow = p.stock < p.reorderLevel;
                return (
                  <tr
                    key={p.id}
                    className={`border-t border-line transition-colors hover:bg-paper/70 ${
                      isLow ? "bg-bad-bg/40" : ""
                    }`}
                  >
                    <td className={`${td} font-medium`}>{p.name}</td>
                    <td className={`${td} font-mono text-xs text-muted`}>{p.sku}</td>
                    <td
                      className={`${td} text-right tabular-nums ${
                        isLow ? "font-semibold text-bad" : ""
                      }`}
                    >
                      {p.stock}
                    </td>
                    <td className={`${td} text-right tabular-nums text-muted`}>{p.reorderLevel}</td>
                    <td className={`${td} text-right tabular-nums`}>
                      Rs {p.price.toLocaleString("en-US")}
                    </td>
                    <td className={td}>
                      {isLow ? (
                        <Badge tone="bad">Kam: {p.reorderQty} mangwayen</Badge>
                      ) : (
                        <Badge tone="good">Theek</Badge>
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

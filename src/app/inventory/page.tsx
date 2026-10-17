import Nav from "@/components/Nav";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const cell = { padding: "10px 12px", borderBottom: "1px solid #333", textAlign: "left" } as const;

export default async function InventoryPage() {
  const products = await prisma.product.findMany({ orderBy: { name: "asc" } });
  const low = products.filter((p) => p.stock < p.reorderLevel).length;

  return (
    <main style={{ color: "#fff", minHeight: "100vh" }}>
      <Nav />
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px 48px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>Inventory</h1>
        <p style={{ opacity: 0.7, margin: "8px 0 20px" }}>
          {products.length} products, {low} ka stock reorder level se neeche hai.
        </p>
        <div style={{ overflowX: "auto", border: "1px solid #fff", borderRadius: 12 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={cell}>Product</th>
                <th style={cell}>SKU</th>
                <th style={cell}>Stock</th>
                <th style={cell}>Reorder level</th>
                <th style={cell}>Price</th>
                <th style={cell}>Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const isLow = p.stock < p.reorderLevel;
                return (
                  <tr key={p.id}>
                    <td style={cell}>{p.name}</td>
                    <td style={cell}>{p.sku}</td>
                    <td style={cell}>{p.stock}</td>
                    <td style={cell}>{p.reorderLevel}</td>
                    <td style={cell}>Rs {p.price.toLocaleString("en-US")}</td>
                    <td style={{ ...cell, color: isLow ? "#ff8a8a" : "#6fdc9c" }}>
                      {isLow ? `Kam: ${p.reorderQty} mangwayen` : "Theek"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

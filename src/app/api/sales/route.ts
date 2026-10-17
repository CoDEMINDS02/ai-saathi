import { NextResponse } from "next/server";
import { saleSchema } from "@/validators/schemas";
import { createSale, listRecentSales } from "@/services/sales.service";

export async function GET() {
  return NextResponse.json(await listRecentSales());
}

export async function POST(req: Request) {
  const parsed = saleSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Sale ka data sahi nahi hai." }, { status: 400 });
  }
  try {
    const sale = await createSale(parsed.data);
    return NextResponse.json(sale, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Sale save nahi ho saki.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

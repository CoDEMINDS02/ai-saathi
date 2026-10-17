import { NextResponse } from "next/server";
import { getCustomerBalance } from "@/services/credit.service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const balance = await getCustomerBalance(id);
  if (!balance) return NextResponse.json({ error: "Customer nahi mila." }, { status: 404 });
  return NextResponse.json(balance);
}
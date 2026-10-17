import { NextResponse } from "next/server";
import { getLowStock } from "@/services/inventory.service";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getLowStock());
}
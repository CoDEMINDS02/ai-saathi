import { NextResponse } from "next/server";
import { listOverdueAccounts } from "@/services/credit.service";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await listOverdueAccounts());
}
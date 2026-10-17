import { NextResponse } from "next/server";
import { listPendingAccounts } from "@/services/credit.service";

export async function GET() {
  return NextResponse.json(await listPendingAccounts());
}
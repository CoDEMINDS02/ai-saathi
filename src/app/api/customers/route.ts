import { NextResponse } from "next/server";
import { listCustomers } from "@/services/customer.service";

export async function GET() {
  return NextResponse.json(await listCustomers());
}
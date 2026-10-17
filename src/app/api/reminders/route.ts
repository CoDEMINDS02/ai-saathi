import { NextResponse } from "next/server";
import { reminderSchema } from "@/validators/schemas";
import { draftPaymentReminder } from "@/services/reminder.service";

export async function POST(req: Request) {
  const parsed = reminderSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "customerId zaroori hai." }, { status: 400 });
  }
  const result = await draftPaymentReminder(parsed.data.customerId);
  if (!result) return NextResponse.json({ error: "Customer nahi mila." }, { status: 404 });
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json(result, { status: 201 });
}

import { NextResponse } from "next/server";
import { approveReminder } from "@/services/reminder.service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    return NextResponse.json(await approveReminder(id));
  } catch {
    return NextResponse.json({ error: "Reminder nahi mila." }, { status: 404 });
  }
}
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rejectReminder } from "@/services/reminder.service";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await prisma.reminder.findUnique({ where: { id } });
  if (!r) return NextResponse.json({ error: "Reminder nahi mila." }, { status: 404 });
  if (r.status !== "DRAFT") {
    return NextResponse.json({ error: `Ye reminder pehle se ${r.status} hai.` }, { status: 409 });
  }
  const updated = await rejectReminder(id);
  return NextResponse.json({ id: updated.id, status: updated.status });
}

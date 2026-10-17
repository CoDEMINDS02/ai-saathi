import { NextResponse } from "next/server";
import { z } from "zod";
import { runFallback } from "@/agent/fallback";

const schema = z.object({ message: z.string().trim().min(1).max(500) });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Apna sawal likhein." }, { status: 400 });
  }
  try {
    return NextResponse.json(await runFallback(parsed.data.message));
  } catch {
    return NextResponse.json({ error: "Abhi jawab nahi ban saka. Dobara koshish karein." }, { status: 500 });
  }
}

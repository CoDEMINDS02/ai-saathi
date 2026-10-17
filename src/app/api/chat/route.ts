import { NextResponse } from "next/server";
import { z } from "zod";
import { runAgent } from "@/agent/runAgent";

const schema = z.object({
  message: z.string().trim().min(1).max(500),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().max(2000) }))
    .max(10)
    .optional(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Apna sawal likhein." }, { status: 400 });
  }
  try {
    return NextResponse.json(await runAgent(parsed.data.message, parsed.data.history ?? []));
  } catch {
    return NextResponse.json({ error: "Abhi jawab nahi ban saka. Dobara koshish karein." }, { status: 500 });
  }
}

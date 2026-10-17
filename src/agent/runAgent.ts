import { GoogleGenAI } from "@google/genai";
import { toolDefinitions, executeTool } from "./tools";
import { SYSTEM_PROMPT } from "./prompts";
import { runFallback } from "./fallback";
import type { AgentResult } from "./fallback";

export type ChatTurn = { role: "user" | "assistant"; text: string };

const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const MAX_STEPS = 5;
const TIMEOUT_MS = 45000;
const QUOTA_PAUSE_MS = 15 * 60 * 1000;

// quota khatam ho to kuch der Gemini ko call hi na karein
let blockedUntil = 0;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Gemini timeout")), ms)),
  ]);
}

// sirf 503 (high demand) par ek baar dobara koshish; 429 par retry bekaar hai
async function callWithRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await withTimeout(fn(), TIMEOUT_MS);
  } catch (e) {
    const msg = String((e as Error)?.message ?? e);
    if (/429|RESOURCE_EXHAUSTED/i.test(msg)) throw e;
    if (/503|UNAVAILABLE|fetch failed/i.test(msg)) {
      console.log("[agent] Gemini busy, 1.5s baad dobara koshish");
      await new Promise((r) => setTimeout(r, 1500));
      return await withTimeout(fn(), TIMEOUT_MS);
    }
    throw e;
  }
}

export async function runAgent(message: string, history: ChatTurn[] = []): Promise<AgentResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || process.env.AGENT_MODE === "fallback") return runFallback(message);
  if (Date.now() < blockedUntil) {
    console.log("[agent] Gemini quota khatam, seedha fallback");
    return runFallback(message);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // pichli baat shamil karein; Gemini ko pehla message "user" ka chahiye
    const turns = history.slice(-6);
    while (turns.length && turns[0].role === "assistant") turns.shift();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contents: any[] = [
      ...turns.map((t) => ({ role: t.role === "assistant" ? "model" : "user", parts: [{ text: t.text }] })),
      { role: "user", parts: [{ text: message }] },
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const functionDeclarations: any[] = toolDefinitions.map((t) => ({
      name: t.name,
      description: t.description,
      ...(Object.keys(t.input_schema.properties).length
        ? { parametersJsonSchema: t.input_schema }
        : {}),
    }));

    let lastTool: string | undefined;
    let lastData: unknown;

    for (let step = 0; step < MAX_STEPS; step++) {
      const t0 = Date.now();
      console.log(`[agent] step ${step + 1}: Gemini ko call ja rahi hai`);
      const res = await callWithRetry(() =>
        ai.models.generateContent({
          model: MODEL,
          contents,
          config: {
            systemInstruction: SYSTEM_PROMPT,
            tools: [{ functionDeclarations }],
            thinkingConfig: { thinkingLevel: "low" as never },
          },
        })
      );
      console.log(`[agent] step ${step + 1} mukammal: ${Date.now() - t0}ms`);

      const calls = res.functionCalls;
      if (!calls || calls.length === 0) {
        if (!res.text) break;
        return { reply: res.text, tool: lastTool, data: lastData };
      }

      contents.push(res.candidates?.[0]?.content);
      const parts = [];
      for (const call of calls) {
        const name = call.name ?? "";
        console.log(`[agent] tool chala: ${name}`);
        const result = await executeTool(name, call.args ?? {});
        lastTool = name;
        lastData = result;
        parts.push({ functionResponse: { name, response: { result } } });
      }
      contents.push({ role: "user", parts });
    }
    return runFallback(message);
  } catch (e) {
    const msg = String((e as Error)?.message ?? e);
    if (/429|RESOURCE_EXHAUSTED/i.test(msg)) {
      blockedUntil = Date.now() + QUOTA_PAUSE_MS;
      console.error("[agent] Gemini quota khatam. 15 minute fallback chalega.");
    } else {
      console.error("LLM fail hua, fallback chal raha hai:", msg.slice(0, 300));
    }
    return runFallback(message);
  }
}

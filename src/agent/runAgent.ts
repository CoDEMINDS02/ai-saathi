import { GoogleGenAI } from "@google/genai";
import { toolDefinitions, executeTool } from "./tools";
import { SYSTEM_PROMPT } from "./prompts";
import { runFallback } from "./fallback";
import type { AgentResult } from "./fallback";

export type ChatTurn = { role: "user" | "assistant"; text: string };

// har model ka apna quota hota hai; ek khatam ho to agla chalta hai
const MODELS = (process.env.GEMINI_MODELS || "gemini-3.5-flash-lite,gemini-3.1-flash-lite,gemini-3.8-flash")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);
const MAX_STEPS = 5;
const TIMEOUT_MS = 30000;
const QUOTA_PAUSE_MS = 15 * 60 * 1000;
const MISSING_PAUSE_MS = 24 * 60 * 60 * 1000;

const blockedUntil = new Map<string, number>();

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Gemini timeout")), ms)),
  ]);
}

// sirf 503 (high demand) par ek baar dobara koshish
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

async function generate(
  ai: GoogleGenAI,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contents: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  functionDeclarations: any[]
) {
  for (const model of MODELS) {
    if (Date.now() < (blockedUntil.get(model) ?? 0)) continue;
    try {
      const res = await callWithRetry(() =>
        ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction: SYSTEM_PROMPT,
            tools: [{ functionDeclarations }],
            ...(/lite/i.test(model) ? {} : { thinkingConfig: { thinkingLevel: "low" as never } }),
          },
        })
      );
      return { res, model };
    } catch (e) {
      const msg = String((e as Error)?.message ?? e);
      if (/429|RESOURCE_EXHAUSTED/i.test(msg)) {
        blockedUntil.set(model, Date.now() + QUOTA_PAUSE_MS);
        console.error(`[agent] ${model} ka quota khatam, agla model try ho raha hai`);
        continue;
      }
      if (/404|NOT_FOUND/i.test(msg)) {
        blockedUntil.set(model, Date.now() + MISSING_PAUSE_MS);
        console.error(`[agent] ${model} maujood nahi, agla model try ho raha hai`);
        continue;
      }
      throw e;
    }
  }
  throw new Error("Sab models ka quota khatam");
}

const fb = async (message: string): Promise<AgentResult> => ({
  ...(await runFallback(message)),
  source: "fallback",
});

export async function runAgent(message: string, history: ChatTurn[] = []): Promise<AgentResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || process.env.AGENT_MODE === "fallback") return fb(message);

  try {
    const ai = new GoogleGenAI({ apiKey });

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
      const { res, model } = await generate(ai, contents, functionDeclarations);
      console.log(`[agent] step ${step + 1} (${model}): ${Date.now() - t0}ms`);

      const calls = res.functionCalls;
      if (!calls || calls.length === 0) {
        if (!res.text) break;
        return { reply: res.text, tool: lastTool, data: lastData, source: model };
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
    return fb(message);
  } catch (e) {
    console.error("[agent] Gemini fail hua, fallback chal raha hai:", String((e as Error)?.message ?? e).slice(0, 300));
    return fb(message);
  }
}


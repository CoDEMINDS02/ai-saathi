import { prisma } from "@/lib/prisma";
import { executeTool } from "./tools";

export type AgentResult = { reply: string; tool?: string; data?: unknown };

type LowItem = { name: string; stock: number; reorderLevel: number; suggestedReorderQty: number };
type Account = { name: string; totalOutstanding: number; overdueAmount: number };
type Balance = { name: string; totalOutstanding: number; overdueAmount: number };
type ErrorShape = { error?: string; matches?: string[] };

const rs = (n: number) => `Rs ${n.toLocaleString("en-US")}`;

async function findCustomerName(text: string) {
  const customers = await prisma.customer.findMany({ select: { name: true } });
  const words = new Set(text.split(/[^a-z]+/));
  return customers.find((c) =>
    c.name.toLowerCase().split(" ").some((token) => words.has(token))
  )?.name;
}

export async function runFallback(message: string): Promise<AgentResult> {
  const text = message.toLowerCase();
  const has = (...words: string[]) => words.some((w) => text.includes(w));

  // 1. Payment reminder (draft only, never sent)
  if (has("reminder", "yaad dahani")) {
    const name = await findCustomerName(text);
    if (!name) {
      return { reply: 'Kis customer ka reminder banana hai? Naam likhein, jaise "Ali ko payment reminder bana do".' };
    }
    const tool = "draft_payment_reminder";
    const data = (await executeTool(tool, { customer_name: name })) as ErrorShape & { message?: string };
    if (data.error) return { reply: data.error, tool, data };
    return {
      reply: `${name} ke liye ye draft tayyar hai. Bhejne se pehle aap ki manzoori zaroori hai:\n\n${data.message}`,
      tool,
      data,
    };
  }

  // 2. Sales
  if (has("sales", "sale", "bikri")) {
    const period = has("hafte", "haftay", "week") ? "week" : has("mahine", "mahinay", "month") ? "month" : "today";
    const label = period === "today" ? "Aaj" : period === "week" ? "Pichle 7 din" : "Pichle 30 din";
    const tool = "get_sales_summary";
    const data = (await executeTool(tool, { period })) as { totalSales: number; transactionCount: number };
    return { reply: `${label} ki total sales ${rs(data.totalSales)} hain (${data.transactionCount} sales).`, tool, data };
  }

  // 3. Overdue
  if (has("overdue", "muddat", "guzar")) {
    const tool = "list_overdue_accounts";
    const data = (await executeTool(tool, {})) as Account[];
    if (!data.length) return { reply: "Abhi kisi customer ki payment overdue nahi hai.", tool, data };
    const lines = data.map((a) => `- ${a.name}: ${rs(a.overdueAmount)} overdue`);
    return { reply: `${data.length} customers ki payment overdue hai:\n${lines.join("\n")}`, tool, data };
  }

  // 4. One customer's balance
  const name = await findCustomerName(text);
  if (name && has("balance", "kitna", "kitne", "baqi", "udhaar", "udhar")) {
    const tool = "get_customer_balance";
    const data = (await executeTool(tool, { customer_name: name })) as ErrorShape & Balance;
    if (data.error) return { reply: data.error, tool, data };
    const overdue = data.overdueAmount > 0 ? ` Is mein se ${rs(data.overdueAmount)} overdue hai.` : "";
    return { reply: `${data.name} ka ${rs(data.totalOutstanding)} baqi hai.${overdue}`, tool, data };
  }

  // 5. All pending payments
  if (has("pending", "udhaar", "udhar", "baqi", "payment")) {
    const tool = "list_pending_accounts";
    const data = (await executeTool(tool, {})) as Account[];
    if (!data.length) return { reply: "Abhi kisi customer ka balance baqi nahi hai.", tool, data };
    const total = data.reduce((s, a) => s + a.totalOutstanding, 0);
    const lines = data.map((a) => `- ${a.name}: ${rs(a.totalOutstanding)}`);
    return { reply: `${data.length} customers ka total ${rs(total)} baqi hai:\n${lines.join("\n")}`, tool, data };
  }

  // 6. Low stock
  if (has("stock", "kam", "khatam", "reorder")) {
    const tool = "get_low_stock";
    const data = (await executeTool(tool, {})) as LowItem[];
    if (!data.length) return { reply: "Sab products ka stock theek hai.", tool, data };
    const lines = data.map((p) => `- ${p.name}: ${p.stock} bacha, ${p.suggestedReorderQty} mangwana chahiye`);
    return { reply: `${data.length} products reorder level se neeche hain:\n${lines.join("\n")}`, tool, data };
  }

  return {
    reply:
      'Main stock, sales aur customers ki payments mein madad kar sakta hoon. Poochein: "Mera low stock batao", "Aaj ki sales kitni hain?" ya "Kin customers ki payments pending hain?"',
  };
}

import { z } from "zod";
import { getLowStock, searchProducts, getInventorySummary } from "@/services/inventory.service";
import { getSalesSummary } from "@/services/sales.service";
import { getCustomerBalance, listOverdueAccounts, listPendingAccounts } from "@/services/credit.service";
import { findCustomersByName } from "@/services/customer.service";
import { draftPaymentReminder } from "@/services/reminder.service";

export const toolDefinitions = [
  {
    name: "get_inventory_summary",
    description: "Total products, low stock count, and total stock value.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get_low_stock",
    description: "Products whose stock is below their reorder level, with suggested reorder quantity.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "search_products",
    description: "Find products by name and see their stock and price.",
    input_schema: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    },
  },
  {
    name: "get_sales_summary",
    description: "Total sales and number of transactions for today, the last 7 days, or the last 30 days.",
    input_schema: {
      type: "object",
      properties: { period: { type: "string", enum: ["today", "week", "month"] } },
      required: ["period"],
    },
  },
  {
    name: "list_pending_accounts",
    description: "All customers with an unpaid balance, largest first.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "list_overdue_accounts",
    description: "Customers whose payment due date has passed.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get_customer_balance",
    description: "Outstanding balance and due dates for one customer, found by name.",
    input_schema: {
      type: "object",
      properties: { customer_name: { type: "string" } },
      required: ["customer_name"],
    },
  },
  {
    name: "draft_payment_reminder",
    description:
      "Create a DRAFT payment reminder for a customer found by name. It is never sent; the shop owner must review and approve it.",
    input_schema: {
      type: "object",
      properties: { customer_name: { type: "string" } },
      required: ["customer_name"],
    },
  },
] as const;

async function resolveCustomer(name: string) {
  const raw = await findCustomersByName(name);
  const words = name.toLowerCase().split(/\s+/).filter(Boolean);
  const strict = raw.filter((c) => {
    const tokens = c.name.toLowerCase().split(/\s+/);
    return words.every((w) => tokens.some((t) => t.startsWith(w)));
  });
  const matches = strict.length ? strict : raw;
  if (matches.length === 0) return { error: `"${name}" naam ka koi customer nahi mila.` };
  if (matches.length > 1) {
    return {
      error: "Ek se zyada customers mile, naam wazeh karein.",
      matches: matches.map((m) => m.name),
    };
  }
  return { customer: matches[0] };
}

export async function executeTool(name: string, input: unknown): Promise<unknown> {
  try {
    switch (name) {
      case "get_inventory_summary":
        return await getInventorySummary();
      case "get_low_stock":
        return await getLowStock();
      case "search_products": {
        const { query } = z.object({ query: z.string().min(1) }).parse(input);
        return await searchProducts(query);
      }
      case "get_sales_summary": {
        const { period } = z
          .object({ period: z.enum(["today", "week", "month"]) })
          .parse(input);
        return await getSalesSummary(period);
      }
      case "list_pending_accounts":
        return await listPendingAccounts();
      case "list_overdue_accounts":
        return await listOverdueAccounts();
      case "get_customer_balance": {
        const { customer_name } = z.object({ customer_name: z.string().min(1) }).parse(input);
        const found = await resolveCustomer(customer_name);
        if ("error" in found) return found;
        return await getCustomerBalance(found.customer.id);
      }
      case "draft_payment_reminder": {
        const { customer_name } = z.object({ customer_name: z.string().min(1) }).parse(input);
        const found = await resolveCustomer(customer_name);
        if ("error" in found) return found;
        const draft = await draftPaymentReminder(found.customer.id);
        if (!draft || "error" in draft) return draft ?? { error: "Customer nahi mila." };
        return {
          reminderId: draft.id,
          customerName: found.customer.name,
          message: draft.message,
          status: "DRAFT",
          note: "Ye sirf draft hai. Owner ki manzoori ke baghair nahi bheja jayega.",
        };
      }
      default:
        return { error: "Ye tool maujood nahi hai." };
    }
  } catch {
    return { error: "Tool chalane mein masla aaya." };
  }
}


import { prisma } from "@/lib/prisma";

export async function logAction(action: string, details?: string, userId?: string) {
  return prisma.auditLog.create({ data: { action, details, userId } });
}
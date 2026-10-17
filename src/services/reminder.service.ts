import { prisma } from "@/lib/prisma";
import { getCustomerBalance } from "./credit.service";
import { logAction } from "./audit.service";

export async function draftPaymentReminder(customerId: string) {
  const balance = await getCustomerBalance(customerId);
  if (!balance) return null;
  if (balance.totalOutstanding <= 0) {
    return { error: "Is customer ka koi balance baqi nahi hai." };
  }

  const overdueLine =
    balance.overdueAmount > 0
      ? ` Is mein se Rs ${balance.overdueAmount} ki muddat guzar chuki hai.`
      : "";

  const message =
    `Assalam o Alaikum ${balance.name}, aap ka Rs ${balance.totalOutstanding} ka hisaab baqi hai.` +
    `${overdueLine} Meharbani farma kar jald adaigi kar dein. Shukriya.`;

  const reminder = await prisma.reminder.create({
    data: { customerId, message, status: "DRAFT" },
  });
  await logAction("REMINDER_DRAFTED", `reminder=${reminder.id} customer=${customerId}`);
  return reminder;
}

export async function approveReminder(reminderId: string) {
  const reminder = await prisma.reminder.update({
    where: { id: reminderId },
    data: { status: "APPROVED", approvedAt: new Date() },
  });
  await logAction("REMINDER_APPROVED", `reminder=${reminderId}`);
  return reminder;
}
export async function rejectReminder(reminderId: string) {
  const reminder = await prisma.reminder.update({
    where: { id: reminderId },
    data: { status: "REJECTED" },
  });
  await logAction("REMINDER_REJECTED", `reminder=${reminderId}`);
  return reminder;
}

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const daysFromNow = (d: number) => new Date(Date.now() + d * 86400000);

async function main() {
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.reminder.deleteMany();
  await prisma.creditEntry.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({
    data: {
      name: "Demo Owner",
      email: "demo@aisaathi.pk",
      passwordHash: await bcrypt.hash("demo1234", 10),
    },
  });

  const productData: [string, string, number, number, number][] = [
    ["Basmati Rice 5kg", "RICE-5", 4, 10, 1450],
    ["Cooking Oil 1L", "OIL-1", 6, 15, 520],
    ["Sugar 1kg", "SUG-1", 40, 20, 160],
    ["Tapal Danedar 190g", "TEA-190", 3, 12, 350],
    ["Atta 10kg", "ATTA-10", 18, 10, 1500],
    ["Surf Excel 1kg", "SURF-1", 9, 8, 640],
    ["Lux Soap", "LUX-1", 55, 20, 110],
    ["Dalda Ghee 1kg", "GHEE-1", 5, 10, 780],
    ["Milk Pack 1L", "MILK-1", 30, 20, 290],
    ["Biscuits Pack", "BISC-1", 60, 25, 50],
    ["Daal Chana 1kg", "DAAL-C", 14, 10, 320],
    ["Daal Masoor 1kg", "DAAL-M", 2, 10, 300],
    ["Salt 800g", "SALT-1", 35, 15, 70],
    ["Red Chilli Powder 200g", "CHIL-2", 22, 10, 240],
    ["Colgate Paste", "COLG-1", 12, 8, 210],
  ];

  const products = [];
  for (const [name, sku, stock, reorderLevel, price] of productData) {
    products.push(
      await prisma.product.create({
        data: {
          name,
          sku,
          stock,
          reorderLevel,
          reorderQty: reorderLevel * 2,
          price,
        },
      })
    );
  }

  const customerNames: [string, string][] = [
    ["Ali Raza", "03001234567"],
    ["Bilal Ahmed", "03211234567"],
    ["Sana Khan", "03331234567"],
    ["Usman Tariq", "03451234567"],
    ["Fatima Noor", "03011234567"],
    ["Hamza Sheikh", "03121234567"],
    ["Ayesha Malik", "03471234567"],
    ["Kamran Ali", "03151234567"],
  ];
  const customers = [];
  for (const [name, phone] of customerNames) {
    customers.push(await prisma.customer.create({ data: { name, phone } }));
  }

  // [customerIndex, amount, paid, dueInDays, status]
  const credits: [number, number, number, number, string][] = [
    [0, 4500, 0, -12, "PENDING"],
    [1, 2800, 1000, -5, "PARTIAL"],
    [2, 6200, 0, -20, "PENDING"],
    [3, 1500, 0, 4, "PENDING"],
    [4, 3300, 0, 9, "PENDING"],
    [5, 900, 900, -3, "PAID"],
    [6, 5100, 2000, -8, "PARTIAL"],
  ];
  for (const [ci, amount, paidAmount, due, status] of credits) {
    await prisma.creditEntry.create({
      data: {
        customerId: customers[ci].id,
        amount,
        paidAmount,
        dueDate: daysFromNow(due),
        status,
      },
    });
  }

  for (let d = 0; d < 7; d++) {
    const salesToday = 3 + (d % 3);
    for (let s = 0; s < salesToday; s++) {
      const p1 = products[(d + s) % products.length];
      const p2 = products[(d + s * 2 + 3) % products.length];
      const q1 = 1 + (s % 3);
      const q2 = 1 + (d % 2);
      const date = daysFromNow(-d);
      date.setHours(10 + s * 2, 0, 0, 0);
      await prisma.sale.create({
        data: {
          date,
          total: p1.price * q1 + p2.price * q2,
          paymentType: "CASH",
          items: {
            create: [
              { productId: p1.id, quantity: q1, unitPrice: p1.price },
              { productId: p2.id, quantity: q2, unitPrice: p2.price },
            ],
          },
        },
      });
    }
  }

  console.log("Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
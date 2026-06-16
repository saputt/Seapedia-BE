import { PrismaClient, DiscountType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const discounts = [
    {
      code: "HEMAT10",
      type: DiscountType.VOUCHER,
      value: 10,
      isPercent: true,
      maxUses: 100,
      expiredAt: new Date("2027-12-31T23:59:59Z"),
    },
    {
      code: "DISKON20RB",
      type: DiscountType.VOUCHER,
      value: 20000,
      isPercent: false,
      maxUses: 50,
      expiredAt: new Date("2027-12-31T23:59:59Z"),
    },
    {
      code: "PROMO50",
      type: DiscountType.PROMO,
      value: 50,
      isPercent: true,
      maxUses: 25,
      expiredAt: new Date("2027-06-30T23:59:59Z"),
    },
    {
      code: "FLAT5RB",
      type: DiscountType.PROMO,
      value: 5000,
      isPercent: false,
      maxUses: 200,
      expiredAt: new Date("2027-12-31T23:59:59Z"),
    },
    {
      code: "WELCOME25",
      type: DiscountType.VOUCHER,
      value: 25,
      isPercent: true,
      maxUses: 500,
      expiredAt: new Date("2026-12-31T23:59:59Z"),
    },
  ];

  for (const discount of discounts) {
    const existing = await prisma.discount.findUnique({
      where: { code: discount.code },
    });
    if (!existing) {
      await prisma.discount.create({ data: discount });
      console.log(`  ✓ Created discount: ${discount.code}`);
    } else {
      console.log(`  - Skipped (exists): ${discount.code}`);
    }
  }

  console.log("\nSeeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

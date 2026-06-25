import { PrismaClient, DiscountType, RoleName, ProductCategory } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@seapedia.com";
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
    include: { roles: true },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await prisma.user.create({
      data: {
        username: "Admin Seapedia",
        email: adminEmail,
        password: hashedPassword,
        lastActiveRole: RoleName.ADMIN,
        roles: {
          create: [
            { roleName: RoleName.ADMIN },
          ],
        },
      },
    });
    console.log("  ✓ Created admin user: admin@seapedia.com / admin123");
  } else {
    console.log("  - Skipped (exists): admin@seapedia.com");
  }

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

  // ─── SEED: Seller + Store + 50 Products ─────────────────────────────

  const sellerEmail = "seller@seapedia.com";
  let seller = await prisma.user.findUnique({ where: { email: sellerEmail } });

  if (!seller) {
    const hashedPassword = await bcrypt.hash("seller123", 10);
    seller = await prisma.user.create({
      data: {
        username: "Toko Seapedia",
        email: sellerEmail,
        password: hashedPassword,
        lastActiveRole: RoleName.SELLER,
        roles: {
          create: [
            { roleName: RoleName.SELLER },
            { roleName: RoleName.BUYER },
          ],
        },
      },
    });
    console.log("  ✓ Created seller user: seller@seapedia.com / seller123");
  } else {
    console.log("  - Skipped (exists): seller@seapedia.com");
  }

  let store = await prisma.store.findFirst({ where: { userId: seller.id } });

  if (!store) {
    store = await prisma.store.create({
      data: {
        storeName: "Toko Seapedia",
        description: "Toko resmi Seapedia — menyediakan berbagai produk berkualitas dengan harga terbaik.",
        address: "Jl. Merdeka No. 123, Jakarta",
        userId: seller.id,
      },
    });
    console.log(`  ✓ Created store: ${store.storeName} (${store.id})`);
  } else {
    console.log(`  - Skipped (exists): ${store.storeName}`);
  }

  const existingProductCount = await prisma.product.count({ where: { storeId: store.id } });

  if (existingProductCount >= 50) {
    console.log(`  - Skipped (${existingProductCount} products already exist for this store)`);
  } else {
    const categories = Object.values(ProductCategory);

    const productNames: { name: string; desc: string; cat: ProductCategory; basePrice: number }[] = [
      // ELECTRONICS
      { name: "Smartphone X1 Pro", desc: "Smartphone flagship dengan layar AMOLED 6.7 inci, chipset terbaru, dan kamera 108MP.", cat: ProductCategory.ELECTRONICS, basePrice: 7999000 },
      { name: "Laptop UltraBook 14", desc: "Laptop tipis dan ringan dengan prosesor Intel i7, RAM 16GB, SSD 512GB.", cat: ProductCategory.ELECTRONICS, basePrice: 12999000 },
      { name: "Wireless Earbuds Pro", desc: "Earbuds nirkabel dengan active noise cancellation dan baterai tahan 8 jam.", cat: ProductCategory.ELECTRONICS, basePrice: 1299000 },
      { name: "Smartwatch Series 5", desc: "Jam tangan pintar dengan monitor detak jantung, GPS, dan layar selalu aktif.", cat: ProductCategory.ELECTRONICS, basePrice: 2499000 },
      { name: "Power Bank 20000mAh", desc: "Power bank kapasitas besar dengan fast charging 65W untuk semua perangkat.", cat: ProductCategory.ELECTRONICS, basePrice: 349000 },
      { name: "Bluetooth Speaker Mini", desc: "Speaker portabel dengan suara jernih dan bass yang menggelegar.", cat: ProductCategory.ELECTRONICS, basePrice: 299000 },
      { name: "Mouse Wireless Gaming", desc: "Mouse gaming nirkabel dengan sensor 16000 DPI dan RGB customizable.", cat: ProductCategory.ELECTRONICS, basePrice: 499000 },
      { name: "Mechanical Keyboard RGB", desc: "Keyboard mekanikal dengan switch blue dan pencahayaan RGB per-key.", cat: ProductCategory.ELECTRONICS, basePrice: 599000 },
      { name: "Monitor 27 inch 4K", desc: "Monitor UHD 4K dengan panel IPS dan HDR10 untuk pengalaman visual maksimal.", cat: ProductCategory.ELECTRONICS, basePrice: 4999000 },
      { name: "Tablet Android 11", desc: "Tablet 10.5 inci dengan layar 2K, cocok untuk bekerja dan hiburan.", cat: ProductCategory.ELECTRONICS, basePrice: 3499000 },
      { name: "Kamera Mirrorless", desc: "Kamera mirrorless dengan sensor APS-C 24MP dan lensa kit 18-55mm.", cat: ProductCategory.ELECTRONICS, basePrice: 8499000 },
      { name: "Webcam 4K", desc: "Webcam 4K dengan autofocus dan mikrofon stereo untuk video call profesional.", cat: ProductCategory.ELECTRONICS, basePrice: 799000 },
      { name: "Charger Wireless Fast", desc: "Charger nirkabel 15W dengan desain ramping dan kompatibel semua perangkat.", cat: ProductCategory.ELECTRONICS, basePrice: 199000 },
      // FASHION
      { name: "Jaket Denim Pria", desc: "Jaket denim premium dengan bahan katun berkualitas tinggi, cocok untuk gaya kasual.", cat: ProductCategory.FASHION, basePrice: 349000 },
      { name: "Sepatu Sneakers White", desc: "Sneakers putih klasik dengan sol karet nyaman untuk aktivitas sehari-hari.", cat: ProductCategory.FASHION, basePrice: 459000 },
      { name: "Tas Ransel Wanita", desc: "Tas ransel wanita dengan bahan kanvas, kompartemen laptop, dan desain时尚.", cat: ProductCategory.FASHION, basePrice: 279000 },
      { name: "Kemeja Flanel Pria", desc: "Kemeja flanel kotak-kotak dengan bahan lembut dan nyaman dipakai.", cat: ProductCategory.FASHION, basePrice: 189000 },
      { name: "Gaun Muslim Modern", desc: "Gaun muslim wanita dengan potongan modern dan bahan katun adem.", cat: ProductCategory.FASHION, basePrice: 299000 },
      { name: "Topi Baseball Casual", desc: "Topi baseball dengan desain simpel, adjustable strap, nyaman dipakai.", cat: ProductCategory.FASHION, basePrice: 89000 },
      { name: "Celana Chino Slim Fit", desc: "Celana chino slim fit pria dengan bahan stretch dan nyaman sepanjang hari.", cat: ProductCategory.FASHION, basePrice: 229000 },
      { name: "Jam Tangan Analog", desc: "Jam tangan analog dengan tali kulit asli dan desain klasik elegan.", cat: ProductCategory.FASHION, basePrice: 399000 },
      { name: "Kacamata Hitam Premium", desc: "Kacamata hitam dengan lensa UV400 dan bingkai titanium ringan.", cat: ProductCategory.FASHION, basePrice: 159000 },
      { name: "Sabuk Kulit Pria", desc: "Sabuk kulit asli dengan buckle perak, cocok untuk gaya formal.", cat: ProductCategory.FASHION, basePrice: 149000 },
      { name: "Hoodie Polos", desc: "Hoodie katun polos dengan hoodie besar dan kantong kanguru.", cat: ProductCategory.FASHION, basePrice: 199000 },
      { name: "Sandal Jepit Kulit", desc: "Sandal jepit berbahan kulit asli dengan sol karet anti-slip.", cat: ProductCategory.FASHION, basePrice: 119000 },
      { name: "Scarf Sutra", desc: "Scarf sutra premium dengan motif elegan, cocok untuk berbagai acara.", cat: ProductCategory.FASHION, basePrice: 179000 },
      // HOME
      { name: "Lampu Meja LED", desc: "Lampu meja LED dengan kecerahan adjustable dan desain minimalis.", cat: ProductCategory.HOME, basePrice: 149000 },
      { name: "Set Peralatan Masak", desc: "Set panci dan wajan anti-lengket 6 pcs untuk kebutuhan dapur Anda.", cat: ProductCategory.HOME, basePrice: 599000 },
      { name: "Bantal Memori", desc: "Bantal memory foam dengan contour ergonomis untuk tidur nyenyak.", cat: ProductCategory.HOME, basePrice: 249000 },
      { name: "Karpet Ruang Tamu", desc: "Karpet besar untuk ruang tamu dengan bahan lembut dan motif modern.", cat: ProductCategory.HOME, basePrice: 459000 },
      { name: "Rak Buku Minimalis", desc: "Rak buku kayu 5 tingkat dengan desain minimalis untuk ruangan Anda.", cat: ProductCategory.HOME, basePrice: 379000 },
      { name: "Vas Bunga Keramik", desc: "Vas bunga keramik buatan tangan dengan glasir mengkilap.", cat: ProductCategory.HOME, basePrice: 129000 },
      { name: "Set Handuk Premium", desc: "Set handuk katun premium 3 pcs dengan daya serap tinggi dan lembut.", cat: ProductCategory.HOME, basePrice: 199000 },
      { name: "Tempat Lilin Aromaterapi", desc: "Tempat lilin kaca dengan aroma lavender untuk relaksasi.", cat: ProductCategory.HOME, basePrice: 89000 },
      { name: "Gorden Blackout", desc: "Gorden anti tembus cahaya dengan bahan tebal dan desain elegan.", cat: ProductCategory.HOME, basePrice: 329000 },
      // FOOD
      { name: "Kopi Arabika Premium", desc: "Biji kopi arabika pilihan dari dataran tinggi Jawa, 250 gram.", cat: ProductCategory.FOOD, basePrice: 85000 },
      { name: "Madu Murni Asli", desc: "Madu murni langsung dari peternak lebah lokal, 500 ml.", cat: ProductCategory.FOOD, basePrice: 95000 },
      { name: "Cokelat Belgian Dark", desc: "Cokelat dark Belgian 70% kakao, kemasan 200 gram.", cat: ProductCategory.FOOD, basePrice: 65000 },
      { name: "Kacang Almond Panggang", desc: "Kacang almond panggang dengan garam laut, 500 gram.", cat: ProductCategory.FOOD, basePrice: 75000 },
      { name: "Teh Hijau Jepang", desc: "Teh hijau premium dari Jepang, kemasan 100 gram.", cat: ProductCategory.FOOD, basePrice: 55000 },
      { name: "Minyak Zaitun Extra Virgin", desc: "Minyak zaitun extra virgin asli Italia, 500 ml.", cat: ProductCategory.FOOD, basePrice: 125000 },
      { name: "Granola Bowl Sehat", desc: "Granola dengan campuran oat, kacang, dan buah kering, 400 gram.", cat: ProductCategory.FOOD, basePrice: 68000 },
      { name: "Sambal Botol Pedas", desc: "Sambal botol pedas dengan cabai asli, tanpa pengawet, 200 ml.", cat: ProductCategory.FOOD, basePrice: 25000 },
      // HOBBY
      { name: "Set Cat Akrilik 24 Warna", desc: "Cat akrilik berkualitas tinggi 24 warna dalam tube 12ml.", cat: ProductCategory.HOBBY, basePrice: 145000 },
      { name: "Puzzle 1000 Potong", desc: "Puzzle pemandangan 1000 potong untuk mengisi waktu luang.", cat: ProductCategory.HOBBY, basePrice: 135000 },
      { name: "Buku Sketsa A4", desc: "Buku sketsa ukuran A4 dengan kertas tebal 120 gram, 50 lembar.", cat: ProductCategory.HOBBY, basePrice: 49000 },
      { name: "Yoga Mat Premium", desc: "Matras yoga tebal 6mm dengan permukaan anti-slip untuk latihan nyaman.", cat: ProductCategory.HOBBY, basePrice: 199000 },
      { name: "Set Alat Berkebun", desc: "Set alat berkebun lengkap 5 pcs dengan tas penyimpanan.", cat: ProductCategory.HOBBY, basePrice: 169000 },
      { name: "Gitar Akustik", desc: "Gitar akustik ukuran standar dengan senar nilon, cocok untuk pemula.", cat: ProductCategory.HOBBY, basePrice: 599000 },
      { name: "Board Game Catur", desc: "Papan catur kayu dengan buah catur magnetik ukuran portable.", cat: ProductCategory.HOBBY, basePrice: 89000 },
      { name: "Teleskop Astronomi", desc: "Teleskop 70mm untuk pengamatan bintang dengan tripod dan lensa okuler.", cat: ProductCategory.HOBBY, basePrice: 899000 },
    ];

    const productsToCreate = productNames.slice(0, 50).map((p, i) => ({
      name: p.name,
      description: p.desc,
      price: p.basePrice + Math.floor(Math.random() * 50000),
      stock: Math.floor(Math.random() * 80) + 10,
      imageUrl: `https://picsum.photos/seed/produk${i + 1}/400/400`,
      category: p.cat,
      storeId: store!.id,
    }));

    const existingNames = await prisma.product.findMany({
      where: { storeId: store!.id, name: { in: productsToCreate.map((p) => p.name) } },
      select: { name: true },
    });
    const existingNameSet = new Set(existingNames.map((p) => p.name));
    const newProducts = productsToCreate.filter((p) => !existingNameSet.has(p.name));

    if (newProducts.length > 0) {
      await prisma.product.createMany({ data: newProducts });
      console.log(`  ✓ Created ${newProducts.length} products for ${store!.storeName}`);
    } else {
      console.log("  - All 50 products already exist for this store");
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

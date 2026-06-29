import { PrismaClient, DiscountType, RoleName, ProductCategory, OrderStatus, ShippingMethod, WalletType } from "@prisma/client";
import * as bcrypt from "bcrypt";

const dbUrl = new URL(process.env.DATABASE_URL!);
dbUrl.searchParams.set('connection_limit', '3');
const prisma = new PrismaClient({ datasources: { db: { url: dbUrl.toString() } } });

const PRODUCT_NAMES: { name: string; desc: string; cat: ProductCategory; basePrice: number }[] = [
  // ELECTRONICS (40)
  { name: "Smartphone X1 Pro", desc: "Smartphone flagship dengan layar AMOLED 6.7 inci dan kamera 108MP.", cat: ProductCategory.ELECTRONICS, basePrice: 7999000 },
  { name: "Laptop UltraBook 14", desc: "Laptop tipis ringan Intel i7, RAM 16GB, SSD 512GB.", cat: ProductCategory.ELECTRONICS, basePrice: 12999000 },
  { name: "Wireless Earbuds Pro", desc: "Earbuds ANC dengan baterai 8 jam dan charging case.", cat: ProductCategory.ELECTRONICS, basePrice: 1299000 },
  { name: "Smartwatch Series 5", desc: "Jam tangan pintar dengan monitor detak jantung dan GPS.", cat: ProductCategory.ELECTRONICS, basePrice: 2499000 },
  { name: "Power Bank 20000mAh", desc: "Power bank fast charging 65W untuk semua perangkat.", cat: ProductCategory.ELECTRONICS, basePrice: 349000 },
  { name: "Bluetooth Speaker Mini", desc: "Speaker portabel dengan suara jernih dan bass menggelegar.", cat: ProductCategory.ELECTRONICS, basePrice: 299000 },
  { name: "Mouse Wireless Gaming", desc: "Mouse gaming nirkabel 16000 DPI dengan RGB.", cat: ProductCategory.ELECTRONICS, basePrice: 499000 },
  { name: "Mechanical Keyboard RGB", desc: "Keyboard mekanikal switch blue dengan RGB per-key.", cat: ProductCategory.ELECTRONICS, basePrice: 599000 },
  { name: "Monitor 27 inch 4K", desc: "Monitor UHD 4K panel IPS dengan HDR10.", cat: ProductCategory.ELECTRONICS, basePrice: 4999000 },
  { name: "Tablet Android 11", desc: "Tablet 10.5 inci layar 2K untuk kerja dan hiburan.", cat: ProductCategory.ELECTRONICS, basePrice: 3499000 },
  { name: "Kamera Mirrorless", desc: "Kamera mirrorless APS-C 24MP dengan lensa kit.", cat: ProductCategory.ELECTRONICS, basePrice: 8499000 },
  { name: "Webcam 4K Pro", desc: "Webcam 4K autofocus dengan mikrofon stereo.", cat: ProductCategory.ELECTRONICS, basePrice: 799000 },
  { name: "Charger Wireless Fast", desc: "Charger nirkabel 15W dengan desain ramping.", cat: ProductCategory.ELECTRONICS, basePrice: 199000 },
  { name: "Headphone Over-Ear", desc: "Headphone over-ear dengan noise cancelling dan baterai 30 jam.", cat: ProductCategory.ELECTRONICS, basePrice: 1899000 },
  { name: "Smart Speaker AI", desc: "Smart speaker dengan asisten suara dan kontrol rumah pintar.", cat: ProductCategory.ELECTRONICS, basePrice: 799000 },
  { name: "USB-C Hub 7-in-1", desc: "Hub USB-C dengan HDMI, SD card, USB 3.0, dan PD charging.", cat: ProductCategory.ELECTRONICS, basePrice: 299000 },
  { name: "External SSD 1TB", desc: "SSD eksternal portabel 1TB dengan kecepatan baca 1050MB/s.", cat: ProductCategory.ELECTRONICS, basePrice: 1499000 },
  { name: "Drone Kamera 4K", desc: "Drone lipat dengan kamera 4K dan stabilisasi gimbal 3-axis.", cat: ProductCategory.ELECTRONICS, basePrice: 4999000 },
  { name: "VR Headset", desc: "Headset realitas virtual dengan resolusi 4K per mata.", cat: ProductCategory.ELECTRONICS, basePrice: 6999000 },
  { name: "Action Camera", desc: "Kamera aksi tahan air 10m dengan video 4K 60fps.", cat: ProductCategory.ELECTRONICS, basePrice: 2999000 },
  { name: "E-Reader 6 inch", desc: "E-Reader dengan layar e-ink 6 inci dan lampu belakang adjustable.", cat: ProductCategory.ELECTRONICS, basePrice: 1499000 },
  { name: "Portable Projector", desc: "Proyektor portabel HD dengan koreksi keystone otomatis.", cat: ProductCategory.ELECTRONICS, basePrice: 3999000 },
  { name: "Fitness Tracker", desc: "Pelacak kebugaran dengan monitor tidur, langkah, dan kalori.", cat: ProductCategory.ELECTRONICS, basePrice: 499000 },
  { name: "Smart Doorbell", desc: "Bel pintar dengan kamera 1080p dan deteksi gerakan.", cat: ProductCategory.ELECTRONICS, basePrice: 899000 },
  { name: "Robot Vacuum", desc: "Robot vacuum pembersih lantai dengan navigasi laser dan mapping.", cat: ProductCategory.ELECTRONICS, basePrice: 3999000 },
  { name: "IP Camera CCTV", desc: "Kamera CCTV indoor 2K dengan night vision dan deteksi gerak.", cat: ProductCategory.ELECTRONICS, basePrice: 399000 },
  { name: "Graphics Card RTX", desc: "Kartu grafis dengan 12GB VRAM untuk gaming dan rendering.", cat: ProductCategory.ELECTRONICS, basePrice: 8999000 },
  { name: "RAM DDR5 32GB", desc: "RAM DDR5 32GB (2x16GB) dengan kecepatan 5600MHz.", cat: ProductCategory.ELECTRONICS, basePrice: 1899000 },
  { name: "Motherboard ATX", desc: "Motherboard ATX dengan chipset terbaru dan WiFi 6E.", cat: ProductCategory.ELECTRONICS, basePrice: 2999000 },
  { name: "CPU Cooler Liquid", desc: "Pendingin cairan CPU 240mm dengan RGB dan kipas senyap.", cat: ProductCategory.ELECTRONICS, basePrice: 1299000 },
  { name: "UPS 1200VA", desc: "Uninterruptible Power Supply 1200VA untuk perlindungan perangkat.", cat: ProductCategory.ELECTRONICS, basePrice: 1499000 },
  { name: "Cable Management Kit", desc: "Kit pengelolaan kabel lengkap dengan ties, clip, dan sleeve.", cat: ProductCategory.ELECTRONICS, basePrice: 89000 },
  { name: "Laptop Stand Adjustable", desc: "Penyangga laptop adjustable dengan material aluminium.", cat: ProductCategory.ELECTRONICS, basePrice: 249000 },
  { name: "Mouse Pad XL", desc: "Mouse pad ukuran besar 90x40cm dengan permukaan halus.", cat: ProductCategory.ELECTRONICS, basePrice: 149000 },
  { name: "Mic Studio Condenser", desc: "Mikrofon condenser USB untuk streaming dan podcast.", cat: ProductCategory.ELECTRONICS, basePrice: 899000 },
  { name: "Drawing Tablet", desc: "Tablet gambar 10x6 inci dengan 8192 tingkat tekanan.", cat: ProductCategory.ELECTRONICS, basePrice: 2499000 },
  { name: "WiFi Router Mesh", desc: "Router mesh WiFi 6 untuk jangkauan seluruh rumah.", cat: ProductCategory.ELECTRONICS, basePrice: 1999000 },
  { name: "Smart Plug WiFi", desc: "Stopkontak pintar WiFi dengan kontrol jarak jauh dan jadwal.", cat: ProductCategory.ELECTRONICS, basePrice: 99000 },
  { name: "Electric Toothbrush", desc: "Sikat gigi elektrik dengan pengatur waktu dan sensor tekanan.", cat: ProductCategory.ELECTRONICS, basePrice: 399000 },
  { name: "Hair Dryer Professional", desc: "Pengering rambut profesional 2000W dengan ion conditioning.", cat: ProductCategory.ELECTRONICS, basePrice: 599000 },
  // FASHION (40)
  { name: "Jaket Denim Pria", desc: "Jaket denim premium bahan katun berkualitas tinggi.", cat: ProductCategory.FASHION, basePrice: 349000 },
  { name: "Sepatu Sneakers White", desc: "Sneakers putih klasik sol karet nyaman sehari-hari.", cat: ProductCategory.FASHION, basePrice: 459000 },
  { name: "Tas Ransel Wanita", desc: "Tas ransel bahan kanvas dengan kompartemen laptop.", cat: ProductCategory.FASHION, basePrice: 279000 },
  { name: "Kemeja Flanel Pria", desc: "Kemeja flanel kotak-kotak bahan lembut dan nyaman.", cat: ProductCategory.FASHION, basePrice: 189000 },
  { name: "Gaun Muslim Modern", desc: "Gaun muslim wanita potongan modern bahan katun adem.", cat: ProductCategory.FASHION, basePrice: 299000 },
  { name: "Topi Baseball Casual", desc: "Topi baseball simpel dengan adjustable strap.", cat: ProductCategory.FASHION, basePrice: 89000 },
  { name: "Celana Chino Slim Fit", desc: "Celana chino slim fit pria bahan stretch nyaman.", cat: ProductCategory.FASHION, basePrice: 229000 },
  { name: "Jam Tangan Analog", desc: "Jam tangan analog tali kulit asli desain klasik.", cat: ProductCategory.FASHION, basePrice: 399000 },
  { name: "Kacamata Hitam Premium", desc: "Kacamata hitam lensa UV400 bingkai titanium ringan.", cat: ProductCategory.FASHION, basePrice: 159000 },
  { name: "Sabuk Kulit Pria", desc: "Sabuk kulit asli buckle perak untuk gaya formal.", cat: ProductCategory.FASHION, basePrice: 149000 },
  { name: "Hoodie Polos Premium", desc: "Hoodie katun polos dengan hoodie besar dan kantong kanguru.", cat: ProductCategory.FASHION, basePrice: 199000 },
  { name: "Sandal Jepit Kulit", desc: "Sandal jepit bahan kulit asli sol karet anti-slip.", cat: ProductCategory.FASHION, basePrice: 119000 },
  { name: "Scarf Sutra Elegan", desc: "Scarf sutra premium motif elegan untuk berbagai acara.", cat: ProductCategory.FASHION, basePrice: 179000 },
  { name: "Kaos Oblong Cotton", desc: "Kaos oblong katun 100% dengan potongan relaxed fit.", cat: ProductCategory.FASHION, basePrice: 99000 },
  { name: "Celana Jeans Skinny", desc: "Celana jeans skinny stretch untuk pria dengan bahan denim.", cat: ProductCategory.FASHION, basePrice: 299000 },
  { name: "Blazer Formal Pria", desc: "Blazer formal pria bahan wool blend untuk acara resmi.", cat: ProductCategory.FASHION, basePrice: 599000 },
  { name: "Dress Batik Modern", desc: "Dress batik modern dengan potongan A-line dan bahan katun.", cat: ProductCategory.FASHION, basePrice: 279000 },
  { name: "Sweater Rajut", desc: "Sweater rajut hangat untuk pria dan wanita dengan motif klasik.", cat: ProductCategory.FASHION, basePrice: 229000 },
  { name: "Tas Selempang Kulit", desc: "Tas selempang kulit asli dengan resleting dan kompartemen ganda.", cat: ProductCategory.FASHION, basePrice: 349000 },
  { name: "Dompet Pria RFID", desc: "Dompet pria kulit dengan pelindung RFID untuk keamanan kartu.", cat: ProductCategory.FASHION, basePrice: 179000 },
  { name: "Ikat Pinggang Kanvas", desc: "Ikat pinggang kanvas dengan buckle kuningan gaya kasual.", cat: ProductCategory.FASHION, basePrice: 89000 },
  { name: "Kemeja Putih Formal", desc: "Kemeja putih formal bahan katun twill untuk kantor.", cat: ProductCategory.FASHION, basePrice: 159000 },
  { name: "Cardigan Rajut Panjang", desc: "Cardigan rajut panjang dengan kancing depan dan kantong.", cat: ProductCategory.FASHION, basePrice: 259000 },
  { name: "Celana Pendek Cargo", desc: "Celana pendek cargo dengan banyak kantong bahan katun.", cat: ProductCategory.FASHION, basePrice: 169000 },
  { name: "Pyjama Set Katun", desc: "Set pyjama katun nyaman untuk tidur dengan motif polos.", cat: ProductCategory.FASHION, basePrice: 149000 },
  { name: "Kaos Polo Pria", desc: "Kaos polo pria bahan pique cotton dengan kerah rapi.", cat: ProductCategory.FASHION, basePrice: 139000 },
  { name: "Legging Wanita", desc: "Legging wanita bahan spandex tebal untuk olahraga dan sehari-hari.", cat: ProductCategory.FASHION, basePrice: 119000 },
  { name: "Vest Rompi Outdoor", desc: "Rompi outdoor dengan banyak kantong untuk traveling dan hiking.", cat: ProductCategory.FASHION, basePrice: 199000 },
  { name: "Bandana Motif Batik", desc: "Bandana motif batik dengan bahan katun lembut dan jahitan rapi.", cat: ProductCategory.FASHION, basePrice: 49000 },
  { name: "Sepatu Boots Pria", desc: "Sepatu boots pria kulit sintetis dengan sol tebal dan grip kuat.", cat: ProductCategory.FASHION, basePrice: 399000 },
  { name: "Flat Shoes Wanita", desc: "Flat shoes wanita dengan pita dan sol empuk nyaman.", cat: ProductCategory.FASHION, basePrice: 179000 },
  { name: "Tas Tote Kanvas", desc: "Tas tote kanvas besar dengan kompartemen utama dan saku dalam.", cat: ProductCategory.FASHION, basePrice: 129000 },
  { name: "Kopiah Peci Hitam", desc: "Peci hitam beludru dengan jahitan rapi dan nyaman dipakai.", cat: ProductCategory.FASHION, basePrice: 59000 },
  { name: "Sarung Dewasa", desc: "Sarung dewasa bahan katun dengan motif kotak-kotak klasik.", cat: ProductCategory.FASHION, basePrice: 129000 },
  { name: "Kemeja Batik Pria", desc: "Kemeja batik pria lengan panjang dengan motif elegan.", cat: ProductCategory.FASHION, basePrice: 199000 },
  { name: "Celana Kulot Wanita", desc: "Celana kulot wanita bahan flowy dengan pinggang elastis.", cat: ProductCategory.FASHION, basePrice: 189000 },
  { name: "Jaket Bomber", desc: "Jaket bomber bahan parasut ringan dengan ribbing rajut.", cat: ProductCategory.FASHION, basePrice: 299000 },
  { name: "Sepatu Olahraga Pria", desc: "Sepatu olahraga pria dengan bantalan empuk dan sol fleksibel.", cat: ProductCategory.FASHION, basePrice: 349000 },
  { name: "Hijab Pashmina", desc: "Hijab pashmina ceruty dengan tekstur lembut dan jatuh.", cat: ProductCategory.FASHION, basePrice: 69000 },
  { name: "Set Koko Muslim", desc: "Set koko muslim lengan pendek dengan peci dan sarung.", cat: ProductCategory.FASHION, basePrice: 249000 },
  // HOME (40)
  { name: "Lampu Meja LED", desc: "Lampu meja LED dengan kecerahan adjustable dan desain minimalis.", cat: ProductCategory.HOME, basePrice: 149000 },
  { name: "Set Peralatan Masak 6 Pcs", desc: "Set panci dan wajan anti-lengket 6 pcs untuk kebutuhan dapur.", cat: ProductCategory.HOME, basePrice: 599000 },
  { name: "Bantal Memori", desc: "Bantal memory foam contour ergonomis untuk tidur nyenyak.", cat: ProductCategory.HOME, basePrice: 249000 },
  { name: "Karpet Ruang Tamu", desc: "Karpet besar ruang tamu bahan lembut motif modern.", cat: ProductCategory.HOME, basePrice: 459000 },
  { name: "Rak Buku Minimalis 5 Tingkat", desc: "Rak buku kayu 5 tingkat minimalis untuk ruangan.", cat: ProductCategory.HOME, basePrice: 379000 },
  { name: "Vas Bunga Keramik", desc: "Vas bunga keramik buatan tangan dengan glasir mengkilap.", cat: ProductCategory.HOME, basePrice: 129000 },
  { name: "Set Handuk Premium 3 Pcs", desc: "Set handuk katun premium 3 pcs daya serap tinggi dan lembut.", cat: ProductCategory.HOME, basePrice: 199000 },
  { name: "Gorden Blackout", desc: "Gorden anti tembus cahaya bahan tebal desain elegan.", cat: ProductCategory.HOME, basePrice: 329000 },
  { name: "Tempat Lilin Aromaterapi", desc: "Tempat lilin kaca aroma lavender untuk relaksasi.", cat: ProductCategory.HOME, basePrice: 89000 },
  { name: "Sapu dan Pel Set", desc: "Set sapu dan pel lengkap dengan ember dan wringer.", cat: ProductCategory.HOME, basePrice: 199000 },
  { name: "Tempat Tisu Premium", desc: "Tempat tisu meja bahan keramik dengan desain elegan.", cat: ProductCategory.HOME, basePrice: 79000 },
  { name: "Frame Foto 10R", desc: "Bingkai foto ukuran 10R bahan kayu dengan kaca pelindung.", cat: ProductCategory.HOME, basePrice: 99000 },
  { name: "Jam Dinding Minimalis", desc: "Jam dinding minimalis diameter 30cm dengan gerakan senyap.", cat: ProductCategory.HOME, basePrice: 129000 },
  { name: "Set Meja dan Kursi Tamu", desc: "Set meja tamu dengan 2 kursi bahan rotan sintetis.", cat: ProductCategory.HOME, basePrice: 2499000 },
  { name: "Rak Sepatu 3 Tingkat", desc: "Rak sepatu 3 tingkat dengan pintu bahan bambu.", cat: ProductCategory.HOME, basePrice: 299000 },
  { name: "Tempat Sampah Tutup", desc: "Tempat sampah stainless steel dengan tutup injak 10L.", cat: ProductCategory.HOME, basePrice: 149000 },
  { name: "Gantungan Baju Berdiri", desc: "Gantungan baju berdiri dengan 2 tingkat dan rak sepatu.", cat: ProductCategory.HOME, basePrice: 259000 },
  { name: "Set Sendok Garpu 12 Pcs", desc: "Set sendok garpu stainless steel 12 pcs dengan kotak.", cat: ProductCategory.HOME, basePrice: 149000 },
  { name: "Piring Keramik Set 6", desc: "Set piring keramik 6 pcs diameter 25cm motif polos.", cat: ProductCategory.HOME, basePrice: 259000 },
  { name: "Gelas Kaca Tebal 6 Pcs", desc: "Set gelas kaca tebal 6 pcs kapasitas 350ml.", cat: ProductCategory.HOME, basePrice: 119000 },
  { name: "Lampu Hias Gantung", desc: "Lampu hias gantung dengan macrame untuk dekorasi ruangan.", cat: ProductCategory.HOME, basePrice: 199000 },
  { name: "Tikar Lipat Besar", desc: "Tikar lipat ukuran besar 180x120cm untuk piknik atau sholat.", cat: ProductCategory.HOME, basePrice: 169000 },
  { name: "Bantal Sofa Dekoratif", desc: "Bantal sofa dekoratif 45x45cm dengan motif tribal.", cat: ProductCategory.HOME, basePrice: 89000 },
  { name: "Selimut Bulu Tebal", desc: "Selimut bulu tebal ukuran 180x200cm untuk cuaca dingin.", cat: ProductCategory.HOME, basePrice: 299000 },
  { name: "Tempat Makanan Kedap Udara", desc: "Set tempat makanan kedap udara 5 pcs berbagai ukuran.", cat: ProductCategory.HOME, basePrice: 169000 },
  { name: "Papan Potong Kayu", desc: "Papan potong kayu jati ukuran besar 40x30cm.", cat: ProductCategory.HOME, basePrice: 99000 },
  { name: "Ceret Teh Kaca", desc: "Ceret teh kaca tahan panas 1L dengan saringan stainless.", cat: ProductCategory.HOME, basePrice: 129000 },
  { name: "Tatakan Gelas Silikon", desc: "Set tatakan gelas silikon 6 pcs anti panas motif minimalis.", cat: ProductCategory.HOME, basePrice: 49000 },
  { name: "Pot Bunga Gantung", desc: "Pot bunga gantung plastik tebal diameter 25cm.", cat: ProductCategory.HOME, basePrice: 39000 },
  { name: "Pengharum Ruangan Elektrik", desc: "Pengharum ruangan elektrik dengan refill minyak aromaterapi.", cat: ProductCategory.HOME, basePrice: 129000 },
  { name: "Set Sprei Bed Cover", desc: "Set sprei bed cover queen size dengan 2 sarung bantal.", cat: ProductCategory.HOME, basePrice: 399000 },
  { name: "Tirai Bambu", desc: "Tirai bambu ukuran 120x200cm untuk jendela dan pintu.", cat: ProductCategory.HOME, basePrice: 249000 },
  { name: "Kap Lampu Gantung Rotan", desc: "Kap lampu gantung rotan alami diameter 30cm.", cat: ProductCategory.HOME, basePrice: 179000 },
  { name: "Nampan Kayu Bundar", desc: "Nampan kayu bundar diameter 40cm untuk penyajian.", cat: ProductCategory.HOME, basePrice: 89000 },
  { name: "Rak Dapur Tempel", desc: "Rak dapur tempel stainless steel 3 tingkat untuk bumbu.", cat: ProductCategory.HOME, basePrice: 169000 },
  { name: "Tempat Sabun Cair", desc: "Tempat sabun cair keramik 300ml dengan pompa.", cat: ProductCategory.HOME, basePrice: 69000 },
  { name: "Sikat Pembersih Serbaguna", desc: "Sikat pembersih serbaguna dengan gagang panjang dan kepala bisa diganti.", cat: ProductCategory.HOME, basePrice: 89000 },
  { name: "Keset Karet Aksara", desc: "Keset karet motif aksara dengan daya serap tinggi.", cat: ProductCategory.HOME, basePrice: 99000 },
  { name: "Laci Plastik 3 Susun", desc: "Laci plastik 3 susun untuk penyimpanan barang kecil.", cat: ProductCategory.HOME, basePrice: 149000 },
  // FOOD (40)
  { name: "Kopi Arabika Premium 250g", desc: "Biji kopi arabika pilihan dari dataran tinggi Jawa.", cat: ProductCategory.FOOD, basePrice: 85000 },
  { name: "Madu Murni Asli 500ml", desc: "Madu murni langsung dari peternak lebah lokal.", cat: ProductCategory.FOOD, basePrice: 95000 },
  { name: "Cokelat Belgian Dark 200g", desc: "Cokelat dark Belgian 70% kakao kemasan 200 gram.", cat: ProductCategory.FOOD, basePrice: 65000 },
  { name: "Kacang Almond Panggang 500g", desc: "Kacang almond panggang dengan garam laut.", cat: ProductCategory.FOOD, basePrice: 75000 },
  { name: "Teh Hijau Jepang 100g", desc: "Teh hijau premium dari Jepang kemasan 100 gram.", cat: ProductCategory.FOOD, basePrice: 55000 },
  { name: "Minyak Zaitun EVOO 500ml", desc: "Minyak zaitun extra virgin asli Italia.", cat: ProductCategory.FOOD, basePrice: 125000 },
  { name: "Granola Bowl Sehat 400g", desc: "Granola campuran oat, kacang, dan buah kering.", cat: ProductCategory.FOOD, basePrice: 68000 },
  { name: "Sambal Botol Pedas 200ml", desc: "Sambal botol pedas cabai asli tanpa pengawet.", cat: ProductCategory.FOOD, basePrice: 25000 },
  { name: "Roti Tawar Gandum", desc: "Roti tawar gandum utuh kaya serap 500 gram.", cat: ProductCategory.FOOD, basePrice: 35000 },
  { name: "Selai Kacang Premium 250g", desc: "Selai kacang creamy tanpa gula tambahan.", cat: ProductCategory.FOOD, basePrice: 45000 },
  { name: "Sereal Oatmeal Instant 1kg", desc: "Oatmeal instan kaya serat kemasan 1kg.", cat: ProductCategory.FOOD, basePrice: 65000 },
  { name: "Beras Organik 5kg", desc: "Beras organik premium pulen dari petani lokal.", cat: ProductCategory.FOOD, basePrice: 85000 },
  { name: "Mie Instan Sehat 10 Pack", desc: "Mie instan sehat rendah lemak kemasan 10 pack.", cat: ProductCategory.FOOD, basePrice: 45000 },
  { name: "Kecap Manis Botol 600ml", desc: "Kecap manis asli dengan rasa legit khas Indonesia.", cat: ProductCategory.FOOD, basePrice: 35000 },
  { name: "Saos Sambal Botol 500ml", desc: "Saos sambal dengan tingkat kepedasan sedang.", cat: ProductCategory.FOOD, basePrice: 28000 },
  { name: "Biskuit Coklat 200g", desc: "Biskuit coklat renyah dengan isian krim coklat.", cat: ProductCategory.FOOD, basePrice: 25000 },
  { name: "Permen Jahe Tradisional", desc: "Permen jahe tradisional untuk menghangatkan tubuh.", cat: ProductCategory.FOOD, basePrice: 15000 },
  { name: "Keripik Singkong Pedas 250g", desc: "Keripik singkong pedas renyah kemasan 250 gram.", cat: ProductCategory.FOOD, basePrice: 22000 },
  { name: "Abon Sapi Asli 200g", desc: "Abon sapi asli dengan cita rasa gurih khas.", cat: ProductCategory.FOOD, basePrice: 55000 },
  { name: "Dodol Betawi 500g", desc: "Dodol betawi legit dan lembut kemasan 500 gram.", cat: ProductCategory.FOOD, basePrice: 65000 },
  { name: "Susu Bubuk Full Cream 1kg", desc: "Susu bubuk full cream kaya kalsium dan vitamin.", cat: ProductCategory.FOOD, basePrice: 95000 },
  { name: "Sirup Markisa 500ml", desc: "Sirup markisa segar dengan rasa buah asli.", cat: ProductCategory.FOOD, basePrice: 35000 },
  { name: "Agar-Agar Plain 7gr", desc: "Agar-agar plain kemasan 7 gram tanpa rasa.", cat: ProductCategory.FOOD, basePrice: 8000 },
  { name: "Tepung Terigu Serbaguna 1kg", desc: "Tepung terigu serbaguna untuk kue dan roti.", cat: ProductCategory.FOOD, basePrice: 15000 },
  { name: "Gula Kelapa Organik 500g", desc: "Gula kelapa organik rendah glikemik kemasan 500 gram.", cat: ProductCategory.FOOD, basePrice: 35000 },
  { name: "Kurma Ajwa Premium 1kg", desc: "Kurma ajwa premium dari Madinah kemasan 1kg.", cat: ProductCategory.FOOD, basePrice: 125000 },
  { name: "Coklat Bubuk Premium 250g", desc: "Coklat bubuk premium untuk minuman dan kue.", cat: ProductCategory.FOOD, basePrice: 45000 },
  { name: "Matcha Bubuk Jepang 100g", desc: "Matcha bubuk grade A dari Jepang kemasan 100g.", cat: ProductCategory.FOOD, basePrice: 85000 },
  { name: "Kerupuk Udang 500g", desc: "Kerupuk udang tradisional kemasan 500 gram.", cat: ProductCategory.FOOD, basePrice: 28000 },
  { name: "Emping Melinjo 250g", desc: "Emping melinjo gurih dan renyah kemasan 250 gram.", cat: ProductCategory.FOOD, basePrice: 32000 },
  { name: "Bubur Bayi Organik 200g", desc: "Bubur bayi organik tanpa pengawet kemasan 200 gram.", cat: ProductCategory.FOOD, basePrice: 45000 },
  { name: "Sarden Kaleng 3 Pack", desc: "Sarden dalam kaleng saus tomat kemasan 3 pack.", cat: ProductCategory.FOOD, basePrice: 55000 },
  { name: "Corned Beef Kaleng", desc: "Corned beef sapi asli kemasan kaleng 200 gram.", cat: ProductCategory.FOOD, basePrice: 35000 },
  { name: "Bihun Jagung 400g", desc: "Bihun jagung sehat tanpa pengawet kemasan 400 gram.", cat: ProductCategory.FOOD, basePrice: 18000 },
  { name: "Mie Telur 500g", desc: "Mie telur kering untuk mie goreng atau mie rebus.", cat: ProductCategory.FOOD, basePrice: 22000 },
  { name: "Saos Tiram Botol 300ml", desc: "Saos tiram untuk tumisan dan marinasi daging.", cat: ProductCategory.FOOD, basePrice: 28000 },
  { name: "Bumbu Rendang Instan 100g", desc: "Bumbu rendang instan praktis dengan rempah asli.", cat: ProductCategory.FOOD, basePrice: 15000 },
  { name: "Kopi Luwak Premium 100g", desc: "Kopi luwak premium asli kemasan 100 gram.", cat: ProductCategory.FOOD, basePrice: 175000 },
  { name: "Teh Melati Wangi 50 Kantong", desc: "Teh melati wangi kemasan 50 kantong celup.", cat: ProductCategory.FOOD, basePrice: 35000 },
  { name: "Jelly Serbuk Aneka Rasa 100g", desc: "Jelly serbuk aneka rasa buah kemasan 100 gram.", cat: ProductCategory.FOOD, basePrice: 12000 },
  // HOBBY (50)
  { name: "Set Cat Akrilik 24 Warna", desc: "Cat akrilik berkualitas 24 warna tube 12ml.", cat: ProductCategory.HOBBY, basePrice: 145000 },
  { name: "Puzzle 1000 Potong", desc: "Puzzle pemandangan 1000 potong untuk waktu luang.", cat: ProductCategory.HOBBY, basePrice: 135000 },
  { name: "Buku Sketsa A4 50 Lembar", desc: "Buku sketsa A4 kertas tebal 120 gram 50 lembar.", cat: ProductCategory.HOBBY, basePrice: 49000 },
  { name: "Yoga Mat Premium 6mm", desc: "Matras yoga tebal 6mm anti-slip untuk latihan.", cat: ProductCategory.HOBBY, basePrice: 199000 },
  { name: "Set Alat Berkebun 5 Pcs", desc: "Set alat berkebun lengkap 5 pcs dengan tas.", cat: ProductCategory.HOBBY, basePrice: 169000 },
  { name: "Gitar Akustik Pemula", desc: "Gitar akustik ukuran standar senar nilon untuk pemula.", cat: ProductCategory.HOBBY, basePrice: 599000 },
  { name: "Board Game Catur Kayu", desc: "Papan catur kayu dengan buah magnetik portable.", cat: ProductCategory.HOBBY, basePrice: 89000 },
  { name: "Teleskop Astronomi 70mm", desc: "Teleskop 70mm dengan tripod untuk pengamatan bintang.", cat: ProductCategory.HOBBY, basePrice: 899000 },
  { name: "Set Kuas Lukis 12 Pcs", desc: "Kuas lukis berbagai ukuran untuk cat air dan akrilik.", cat: ProductCategory.HOBBY, basePrice: 79000 },
  { name: "Kanvas Lukis 50x60cm", desc: "Kanvas lukis ukuran 50x60cm dengan rangka kayu.", cat: ProductCategory.HOBBY, basePrice: 65000 },
  { name: "Bola Basket Outdoor", desc: "Bola basket ukuran 7 untuk outdoor dengan grip kuat.", cat: ProductCategory.HOBBY, basePrice: 199000 },
  { name: "Raket Badminton Set", desc: "Set raket badminton 2 pcs dengan shuttlecock 3 buah.", cat: ProductCategory.HOBBY, basePrice: 149000 },
  { name: "Dumbbell Set 10kg", desc: "Set dumbbell 10kg adjustable untuk latihan di rumah.", cat: ProductCategory.HOBBY, basePrice: 299000 },
  { name: "Teka Teki Rubik 3x3", desc: "Rubik 3x3 speed cube dengan mekanisme halus.", cat: ProductCategory.HOBBY, basePrice: 49000 },
  { name: "Origami Paper Set 200 Lembar", desc: "Kertas origami 200 lembar berbagai warna dan motif.", cat: ProductCategory.HOBBY, basePrice: 35000 },
  { name: "Buku Mewarnai Dewasa", desc: "Buku mewarnai untuk dewasa dengan motif mandala.", cat: ProductCategory.HOBBY, basePrice: 45000 },
  { name: "Harmonika 16 Lubang", desc: "Harmonika 16 lubang untuk pemula dengan suara jernih.", cat: ProductCategory.HOBBY, basePrice: 85000 },
  { name: "Kompas Outdoor", desc: "Kompas outdoor presisi tinggi untuk hiking dan camping.", cat: ProductCategory.HOBBY, basePrice: 69000 },
  { name: "Teropong Binocular 12x50", desc: "Teropong binocular 12x50 untuk birdwatching dan olahraga.", cat: ProductCategory.HOBBY, basePrice: 349000 },
  { name: "Set Pahat Kayu 6 Pcs", desc: "Set pahat kayu 6 pcs dengan gagang kayu untuk ukiran.", cat: ProductCategory.HOBBY, basePrice: 169000 },
  { name: "Lilin Mainan 24 Warna", desc: "Lilin mainan modeling clay 24 warna tidak lengket.", cat: ProductCategory.HOBBY, basePrice: 85000 },
  { name: "Papan Tulis Magnetik", desc: "Papan tulis magnetik 60x90cm dengan spidol dan penghapus.", cat: ProductCategory.HOBBY, basePrice: 149000 },
  { name: "Drone Mainan RC", desc: "Drone mainan remote control dengan kamera dan lampu LED.", cat: ProductCategory.HOBBY, basePrice: 249000 },
  { name: "Mobil RC Offroad", desc: "Mobil remote control offroad 4WD dengan baterai isi ulang.", cat: ProductCategory.HOBBY, basePrice: 299000 },
  { name: "Pistol Air Softgun", desc: "Pistol air softgun spring dengan peluru BB 100 butir.", cat: ProductCategory.HOBBY, basePrice: 179000 },
  { name: "Buku Novel Best Seller", desc: "Novel best seller terbaru dengan cerita yang memikat.", cat: ProductCategory.HOBBY, basePrice: 85000 },
  { name: "Alat Memancing Set", desc: "Set alat pancing lengkap dengan joran, reel, dan umpan.", cat: ProductCategory.HOBBY, basePrice: 399000 },
  { name: "Kendang Tradisional", desc: "Kendang tradisional ukuran sedang untuk latihan gamelan.", cat: ProductCategory.HOBBY, basePrice: 499000 },
  { name: "Seruling Bambu", desc: "Seruling bambu tradisional dengan nada merdu.", cat: ProductCategory.HOBBY, basePrice: 49000 },
  { name: "Kamera Film Analog", desc: "Kamera film analog 35mm dengan desain retro.", cat: ProductCategory.HOBBY, basePrice: 599000 },
  { name: "Stempel Karet Custom", desc: "Stempel karet custom nama dengan tinta warna-warni.", cat: ProductCategory.HOBBY, basePrice: 35000 },
  { name: "Kotak Penyimpanan Craft", desc: "Kotak penyimpanan multifungsi 15 kompartemen untuk craft.", cat: ProductCategory.HOBBY, basePrice: 99000 },
  { name: "Benang Rajut 10 Warna", desc: "Benang rajut katun 10 warna berbeda panjang 50m per gulung.", cat: ProductCategory.HOBBY, basePrice: 65000 },
  { name: "Jarum Rajut Set 10", desc: "Set jarum rajut 10 ukuran dengan kotak penyimpanan.", cat: ProductCategory.HOBBY, basePrice: 79000 },
  { name: "Boneka Rajut DIY Kit", desc: "Kit boneka rajut DIY lengkap dengan benang dan pola.", cat: ProductCategory.HOBBY, basePrice: 89000 },
  { name: "Scrapbook Album 30 Lembar", desc: "Album scrapbook 30 lembar dengan dekorasi dan stiker.", cat: ProductCategory.HOBBY, basePrice: 99000 },
  { name: "Clay Polymer 12 Warna", desc: "Polymer clay 12 warna untuk membuat aksesoris dan patung mini.", cat: ProductCategory.HOBBY, basePrice: 75000 },
  { name: "Glitter Powder Set 10", desc: "Set glitter powder 10 warna untuk kerajinan dan dekorasi.", cat: ProductCategory.HOBBY, basePrice: 35000 },
  { name: "Lem Tembak Mini", desc: "Lem tembak mini dengan 10 stick lem untuk kerajinan.", cat: ProductCategory.HOBBY, basePrice: 55000 },
  { name: "Washi Tape Set 20 Roll", desc: "Washi tape set 20 roll berbagai motif untuk dekorasi.", cat: ProductCategory.HOBBY, basePrice: 65000 },
  { name: "Pensil Warna 48 Warna", desc: "Pensil warna 48 warna berkualitas tinggi untuk mewarnai.", cat: ProductCategory.HOBBY, basePrice: 199000 },
  { name: "Spatula Clay Set 10", desc: "Set spatula clay 10 model untuk membentuk tanah liat.", cat: ProductCategory.HOBBY, basePrice: 55000 },
  { name: "Frame Pajangan Dinding", desc: "Frame pajangan dinding 6 lubang untuk foto polaroid.", cat: ProductCategory.HOBBY, basePrice: 89000 },
  { name: "Bola Sepak Size 5", desc: "Bola sepak ukuran 5 bahan PU untuk latihan dan pertandingan.", cat: ProductCategory.HOBBY, basePrice: 149000 },
  { name: "Alat Musik Ukulele", desc: "Ukulele soprano 4 senar untuk pemula dengan tuner.", cat: ProductCategory.HOBBY, basePrice: 299000 },
  { name: "Kotak Musik Kayu", desc: "Kotak musik kayu dengan putaran ballerina dan lagu klasik.", cat: ProductCategory.HOBBY, basePrice: 199000 },
  { name: "Globe Dunia 30cm", desc: "Globe dunia diameter 30cm dengan pencahayaan LED.", cat: ProductCategory.HOBBY, basePrice: 249000 },
  { name: "Tas Alat Lukis", desc: "Tas penyimpanan alat lukis dengan banyak kompartemen.", cat: ProductCategory.HOBBY, basePrice: 129000 },
  { name: "Roller Skate Dewasa", desc: "Sepatu roda dewasa adjustable ukuran 36-42 dengan rem.", cat: ProductCategory.HOBBY, basePrice: 349000 },
  { name: "Yoyo Profesional", desc: "Yoyo profesional dengan bearing responsive untuk trik.", cat: ProductCategory.HOBBY, basePrice: 89000 },
];

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  SEAPEDIA — Database Seeder");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // ─── CLEAR EXISTING DATA ────────────────────────────
  console.log("Clearing existing data...");
  await prisma.driverJob.deleteMany();
  await prisma.driverReview.deleteMany();
  await prisma.productReview.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.orderStatusLog.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.walletTransaction.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.address.deleteMany();
  await prisma.product.deleteMany();
  await prisma.store.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.user.deleteMany();
  await prisma.discount.deleteMany();
  console.log("  ✓ All data cleared\n");

  // ─── USERS ──────────────────────────────────────────
  const hash = (pw: string) => bcrypt.hash(pw, 10);

  const admin = await prisma.user.create({
    data: {
      username: "Admin Seapedia",
      email: "admin@seapedia.com",
      password: await hash("admin123"),
      lastActiveRole: RoleName.ADMIN,
      roles: { create: [{ roleName: RoleName.ADMIN }] },
    },
  });
  console.log("  ✓ Admin: admin@seapedia.com / admin123");

  const seller = await prisma.user.create({
    data: {
      username: "Toko Seapedia",
      email: "seller@seapedia.com",
      password: await hash("seller123"),
      lastActiveRole: RoleName.SELLER,
      roles: { create: [{ roleName: RoleName.SELLER }, { roleName: RoleName.BUYER }] },
    },
  });
  console.log("  ✓ Seller: seller@seapedia.com / seller123");

  const buyer = await prisma.user.create({
    data: {
      username: "Buyer Demo",
      email: "buyer@seapedia.com",
      password: await hash("buyer123"),
      lastActiveRole: RoleName.BUYER,
      roles: { create: [{ roleName: RoleName.BUYER }] },
    },
  });
  console.log("  ✓ Buyer: buyer@seapedia.com / buyer123");

  const driverUser = await prisma.user.create({
    data: {
      username: "Driver Demo",
      email: "driver@seapedia.com",
      password: await hash("driver123"),
      lastActiveRole: RoleName.DRIVER,
      roles: { create: [{ roleName: RoleName.DRIVER }] },
    },
  });
  console.log("  ✓ Driver: driver@seapedia.com / driver123");

  const multiRole = await prisma.user.create({
    data: {
      username: "Multi Role User",
      email: "multirole@seapedia.com",
      password: await hash("multirole123"),
      lastActiveRole: RoleName.BUYER,
      roles: { create: [{ roleName: RoleName.BUYER }, { roleName: RoleName.SELLER }, { roleName: RoleName.DRIVER }] },
    },
  });
  console.log("  ✓ Multi Role: multirole@seapedia.com / multirole123\n");

  // ─── WALLETS ─────────────────────────────────────────
  const createWallet = async (userId: string, balance: number) => {
    await prisma.wallet.create({ data: { userId, balance } });
  };

  await createWallet(buyer.id, 500000);
  await createWallet(multiRole.id, 1000000);
  await createWallet(seller.id, 5000000);
  await createWallet(driverUser.id, 200000);
  console.log("  ✓ Wallets created\n");

  // ─── GET WALLET IDS ──────────────────────────────────
  const wallets = await prisma.wallet.findMany();
  const walletByUser = Object.fromEntries(wallets.map((w) => [w.userId, w.id]));

  // ─── ADDRESSES ───────────────────────────────────────
  const buyerAddress = await prisma.address.create({
    data: {
      userId: multiRole.id,
      label: "Rumah",
      completeAddress: "Jl. Merdeka No. 45, RT.03/RW.07, Kel. Gambir, Kec. Gambir, Jakarta Pusat, DKI Jakarta 10110",
      
      
      lastUsed: true,
    },
  });
  console.log("  ✓ Address created\n");

  // ─── DISCOUNTS ───────────────────────────────────────
  const discounts = [
    { code: "HEMAT10", type: DiscountType.VOUCHER, value: 10, isPercent: true, maxUses: 100, expiredAt: new Date("2027-12-31") },
    { code: "DISKON20RB", type: DiscountType.VOUCHER, value: 20000, isPercent: false, maxUses: 50, expiredAt: new Date("2027-12-31") },
    { code: "PROMO50", type: DiscountType.PROMO, value: 50, isPercent: true, maxUses: 25, expiredAt: new Date("2027-12-31") },
    { code: "FLAT5RB", type: DiscountType.PROMO, value: 5000, isPercent: false, maxUses: 200, expiredAt: new Date("2027-12-31") },
    { code: "WELCOME25", type: DiscountType.VOUCHER, value: 25, isPercent: true, maxUses: 500, expiredAt: new Date("2027-12-31") },
  ];
  await prisma.discount.createMany({ data: discounts });
  console.log("  ✓ Discounts created\n");

  // ─── STORE ───────────────────────────────────────────
  const store = await prisma.store.create({
    data: {
      storeName: "Toko Seapedia",
      description: "Toko resmi Seapedia — menyediakan berbagai produk berkualitas dengan harga terbaik.",
      address: "Jl. Merdeka No. 123, Jakarta",
      userId: seller.id,
    },
  });
  // Store for multiRole user
  const multiRoleStore = await prisma.store.create({
    data: {
      storeName: "Toko Multi Role",
      description: "Toko milik multirole user — menyediakan berbagai produk berkualitas.",
      address: "Jl. Sudirman No. 78, Jakarta",
      userId: multiRole.id,
    },
  });
  console.log(`  ✓ Store: ${multiRoleStore.storeName} (for multirole)\n`);

  // ─── PRODUCTS (210) ──────────────────────────────────
  const products = PRODUCT_NAMES.map((p, i) => ({
    name: p.name,
    description: p.desc,
    price: p.basePrice + randomInt(0, 50000),
    stock: randomInt(5, 100),
    imageUrl: `https://picsum.photos/seed/${slugify(p.name)}/400/400`,
    category: p.cat,
    storeId: store.id,
  }));

  await prisma.product.createMany({ data: products });
  const createdProducts = await prisma.product.findMany({ where: { storeId: store.id }, orderBy: { createdAt: "asc" } });
  console.log(`  ✓ ${createdProducts.length} products created\n`);

  // ─── ORDER + REVIEW + DRIVER FLOW ─────────────────────
  // Create orders for multiRole user buying from the store
  // We create orders with various statuses for a realistic demo

  const statuses = [OrderStatus.PENDING, OrderStatus.READY_FOR_DELIVERY, OrderStatus.ON_DELIVERY, OrderStatus.DELIVERED, OrderStatus.CANCELLED];

  // Helper: create past date
  function daysAgo(days: number): Date {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
  }

  // Pick random products for each order
  const orderConfigs = [
    { days: 30, status: OrderStatus.DELIVERED, items: 3, shipping: ShippingMethod.REGULAR, discountCode: "HEMAT10" },
    { days: 25, status: OrderStatus.DELIVERED, items: 2, shipping: ShippingMethod.INSTANT, discountCode: null },
    { days: 20, status: OrderStatus.DELIVERED, items: 4, shipping: ShippingMethod.REGULAR, discountCode: "FLAT5RB" },
    { days: 15, status: OrderStatus.DELIVERED, items: 1, shipping: ShippingMethod.NEXT_DAY, discountCode: null },
    { days: 10, status: OrderStatus.DELIVERED, items: 2, shipping: ShippingMethod.REGULAR, discountCode: null },
    { days: 7, status: OrderStatus.ON_DELIVERY, items: 3, shipping: ShippingMethod.INSTANT, discountCode: "PROMO50" },
    { days: 5, status: OrderStatus.READY_FOR_DELIVERY, items: 2, shipping: ShippingMethod.REGULAR, discountCode: null },
    { days: 3, status: OrderStatus.PENDING, items: 1, shipping: ShippingMethod.REGULAR, discountCode: null },
    { days: 12, status: OrderStatus.CANCELLED, items: 2, shipping: ShippingMethod.REGULAR, discountCode: null },
    { days: 2, status: OrderStatus.PENDING, items: 3, shipping: ShippingMethod.NEXT_DAY, discountCode: "WELCOME25" },
    { days: 8, status: OrderStatus.DELIVERED, items: 1, shipping: ShippingMethod.INSTANT, discountCode: null },
    { days: 6, status: OrderStatus.DELIVERED, items: 2, shipping: ShippingMethod.REGULAR, discountCode: "DISKON20RB" },
    { days: 4, status: OrderStatus.PENDING, items: 4, shipping: ShippingMethod.REGULAR, discountCode: null },
    { days: 1, status: OrderStatus.PENDING, items: 2, shipping: ShippingMethod.NEXT_DAY, discountCode: null },
  ];

  const shippingPrices: Record<string, number> = { INSTANT: 25000, NEXT_DAY: 15000, REGULAR: 10000 };
  const TAX_RATE = 0.12;

  // Use driverUser for driver assignments
  const usedProductIndices = new Set<number>();

  for (const cfg of orderConfigs) {
    const orderDate = daysAgo(cfg.days);

    // Pick random items from products
    const itemIndices: number[] = [];
    for (let i = 0; i < cfg.items; i++) {
      let idx: number;
      do { idx = randomInt(0, createdProducts.length - 1); } while (itemIndices.includes(idx));
      itemIndices.push(idx);
    }

    const orderItems = itemIndices.map((idx) => ({
      product: createdProducts[idx],
      quantity: randomInt(1, 3),
    }));

    const subtotal = orderItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    // Calculate discount
    let discountValue = 0;
    let discountId: string | null = null;
    if (cfg.discountCode) {
      const discount = await prisma.discount.findUnique({ where: { code: cfg.discountCode } });
      if (discount) {
        discountId = discount.id;
        if (discount.isPercent) {
          discountValue = Math.min(Math.round(subtotal * discount.value / 100), subtotal);
        } else {
          discountValue = Math.min(discount.value, subtotal);
        }
        await prisma.discount.update({ where: { id: discount.id }, data: { usedCount: { increment: 1 } } });
      }
    }

    const shippingFee = shippingPrices[cfg.shipping] || 10000;
    const taxableAmount = Math.max(0, subtotal - discountValue);
    const taxFee = Math.round(taxableAmount * TAX_RATE);
    const totalPrice = taxableAmount + shippingFee + taxFee;

    const order = await prisma.order.create({
      data: {
        buyerId: multiRole.id,
        storeId: store.id,
        addressLabel: "Rumah",
        addressSnapshot: "Jl. Merdeka No. 45, Jakarta Pusat",
        storeAddress: store.address!,
        discountId,
        shippingMethod: cfg.shipping,
        subtotal,
        discountValue,
        shippingFee,
        taxFee,
        totalPrice,
        status: cfg.status === OrderStatus.CANCELLED ? OrderStatus.CANCELLED : cfg.status,
        createdAt: orderDate,
        updatedAt: orderDate,
      },
    });

    // Create order items
    for (const item of orderItems) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
        },
      });
    }

    // Create status logs
    const statusFlow: OrderStatus[] = [OrderStatus.PENDING];
    if (cfg.status !== OrderStatus.PENDING && cfg.status !== OrderStatus.CANCELLED) {
      statusFlow.push(OrderStatus.READY_FOR_DELIVERY);
    }
    if (cfg.status === OrderStatus.ON_DELIVERY || cfg.status === OrderStatus.DELIVERED) {
      statusFlow.push(OrderStatus.ON_DELIVERY);
    }
    if (cfg.status === OrderStatus.DELIVERED) {
      statusFlow.push(OrderStatus.DELIVERED);
    }

    for (let s = 0; s < statusFlow.length; s++) {
      const logDate = new Date(orderDate);
      logDate.setHours(logDate.getHours() + s * 2);
      await prisma.orderStatusLog.create({
        data: {
          orderId: order.id,
          status: statusFlow[s],
          changedAt: logDate,
        },
      });
    }

    // Create driver job for delivered orders
    if (cfg.status === OrderStatus.DELIVERED || cfg.status === OrderStatus.ON_DELIVERY) {
      const jobDate = new Date(orderDate);
      jobDate.setDate(jobDate.getDate() + 1);

      const jobData: any = {
        orderId: order.id,
        driverId: driverUser.id,
        earning: shippingFee,
      };
      if (cfg.status === OrderStatus.DELIVERED) {
        jobData.doneAt = new Date(jobDate);
      }

      await prisma.driverJob.create({ data: jobData });
    }

    // Create product reviews for DELIVERED orders
    if (cfg.status === OrderStatus.DELIVERED) {
      const reviewDate = new Date(orderDate);
      reviewDate.setDate(reviewDate.getDate() + 2);

      for (const item of orderItems) {
        await prisma.productReview.create({
          data: {
            productId: item.product.id,
            buyerId: multiRole.id,
            orderId: order.id,
            rating: randomInt(4, 5),
            comment: "Produknya bagus sesuai deskripsi, pengiriman cepat. Recomended!",
            createdAt: reviewDate,
          },
        });
      }

      // Create driver review for delivered orders
      await prisma.driverReview.create({
        data: {
          driverId: driverUser.id,
          buyerId: multiRole.id,
          orderId: order.id,
          rating: randomInt(4, 5),
          comment: "Driver ramah dan tepat waktu. Terima kasih!",
          createdAt: reviewDate,
        },
      });
    }

    // Reduce product stock
    for (const item of orderItems) {
      await prisma.product.update({
        where: { id: item.product.id },
        data: { stock: { decrement: item.quantity } },
      });
    }

    // Wallet transaction for DELIVERED orders
    if (cfg.status === OrderStatus.DELIVERED) {
      const txDate = new Date(orderDate);

      // Buyer payment (safe: only deduct if balance is sufficient)
      const paid = await prisma.wallet.updateMany({
        where: { id: walletByUser[multiRole.id], balance: { gte: totalPrice } },
        data: { balance: { decrement: totalPrice } },
      });

      if (paid.count > 0) {
        await prisma.walletTransaction.create({
          data: {
            walletId: walletByUser[multiRole.id],
            amount: totalPrice,
            type: WalletType.PAYMENT,
            description: `Pembayaran pesanan #${order.id.slice(0, 8)}`,
          },
        });

        // Driver earning
        await prisma.walletTransaction.create({
          data: {
            walletId: walletByUser[driverUser.id],
            amount: shippingFee,
            type: WalletType.DRIVER_EARNING,
            description: `Pendapatan pengiriman pesanan #${order.id.slice(0, 8)}`,
          },
        });
        await prisma.wallet.update({
          where: { id: walletByUser[driverUser.id] },
          data: { balance: { increment: shippingFee } },
        });

        // Seller earning (subtotal - discount)
        const sellerEarning = subtotal - discountValue;
        await prisma.walletTransaction.create({
          data: {
            walletId: walletByUser[seller.id],
            amount: sellerEarning,
            type: WalletType.SELLER_EARNING,
            description: `Pendapatan penjualan pesanan #${order.id.slice(0, 8)}`,
          },
        });
        await prisma.wallet.update({
          where: { id: walletByUser[seller.id] },
          data: { balance: { increment: sellerEarning } },
        });
      }
    }
  }

  console.log(`  ✓ ${orderConfigs.length} orders created with realistic status flow`);
  console.log("  ✓ Product reviews and driver reviews created");
  console.log("  ✓ Wallet transactions for payments and earnings\n");

  // ─── TOP-UP TRANSACTION ──────────────────────────────
  await prisma.walletTransaction.create({
    data: {
      walletId: walletByUser[multiRole.id],
      amount: 1000000,
      type: WalletType.TOP_UP,
      description: "Top up saldo awal",
    },
  });

  await prisma.walletTransaction.create({
    data: {
      walletId: walletByUser[buyer.id],
      amount: 500000,
      type: WalletType.TOP_UP,
      description: "Top up saldo awal",
    },
  });

  console.log("  ✓ Top-up transactions created\n");

  // ─── WALLET BALANCE VERIFICATION ─────────────────────
  const finalWallets = await prisma.wallet.findMany({
    include: { user: { select: { email: true } } },
  });
  console.log("  ── Wallet Balances ──");
  for (const w of finalWallets) {
    const sign = w.balance < 0 ? " ⚠️ NEGATIVE" : "";
    console.log(`  ${w.user.email.padEnd(30)} Rp${w.balance.toLocaleString("id-ID")}${sign}`);
  }
  console.log("");

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Seeding complete!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

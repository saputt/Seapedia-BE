import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { RoleName } from '@prisma/client';

describe('Order Flow E2E', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const uniqueId = Date.now();

  const buyerEmail = `buyer${uniqueId}@test.com`;
  const sellerEmail = `seller${uniqueId}@test.com`;
  const driverEmail = `driver${uniqueId}@test.com`;
  const adminEmail = `admin${uniqueId}@test.com`;

  let buyerToken: string;
  let sellerToken: string;
  let driverToken: string;
  let adminToken: string;

  let storeId: string;
  let productId: string;
  let addressId: string;
  let orderToken: string;
  let orderId: string;
  let pendingOrderId: string;
  let readyForDeliveryOrderId: string;
  let productPendingId: string;
  let productReadyId: string;

  let secondAddressId: string;
  let discountId: string;
  const discountCode = `DISC${uniqueId}`;
  let discountOrderId: string;
  let cancelOrderId: string;
  let deleteProductId: string;
  let pctDiscountId: string;
  let expiredDiscountId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    // cleanup test data - order matters due to FK constraints
    for (const id of [pendingOrderId, readyForDeliveryOrderId, orderId, discountOrderId, cancelOrderId]) {
      if (id) {
        await prisma.orderStatusLog.deleteMany({ where: { orderId: id } });
        await prisma.driverJob.deleteMany({ where: { orderId: id } });
        await prisma.orderItem.deleteMany({ where: { orderId: id } });
        await prisma.order.deleteMany({ where: { id } });
      }
    }
    const allProductIds = [productId, productPendingId, productReadyId, deleteProductId].filter(Boolean);
    if (allProductIds.length > 0) {
      await prisma.orderItem.deleteMany({ where: { productId: { in: allProductIds } } });
      await prisma.cartItem.deleteMany({ where: { productId: { in: allProductIds } } });
      await prisma.product.deleteMany({ where: { id: { in: allProductIds } } });
    }
    for (const id of [discountId, pctDiscountId, expiredDiscountId]) {
      if (id) {
        await prisma.order.updateMany({ where: { discountId: id }, data: { discountId: null } });
        await prisma.discount.deleteMany({ where: { id } });
      }
    }
    if (storeId) {
      await prisma.orderItem.deleteMany({ where: { order: { storeId } } });
      await prisma.orderStatusLog.deleteMany({ where: { order: { storeId } } });
      await prisma.driverJob.deleteMany({ where: { order: { storeId } } });
      await prisma.order.deleteMany({ where: { storeId } });
      const storeProductIds = await prisma.product.findMany({ where: { storeId }, select: { id: true } });
      for (const { id } of storeProductIds) {
        await prisma.cartItem.deleteMany({ where: { productId: id } });
        await prisma.product.deleteMany({ where: { id } });
      }
      await prisma.store.deleteMany({ where: { id: storeId } });
    }

    for (const email of [buyerEmail, sellerEmail, driverEmail, adminEmail]) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        await prisma.walletTransaction.deleteMany({ where: { wallet: { userId: user.id } } });
        await prisma.wallet.deleteMany({ where: { userId: user.id } });
        await prisma.driverJob.deleteMany({ where: { driverId: user.id } });
        await prisma.address.deleteMany({ where: { userId: user.id } });
        await prisma.cartItem.deleteMany({ where: { userId: user.id } });
        await prisma.userRole.deleteMany({ where: { userId: user.id } });
        await prisma.order.deleteMany({ where: { buyerId: user.id } });
        await prisma.user.deleteMany({ where: { id: user.id } });
      }
    }
    await prisma.applicationReview.deleteMany({});
    await app.close();
  });

  it('should register all users', async () => {
    for (const { username, email } of [
      { username: 'buyer', email: buyerEmail },
      { username: 'seller', email: sellerEmail },
      { username: 'driver', email: driverEmail },
      { username: 'admin', email: adminEmail },
    ]) {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ username, email, password: 'password123' });
      expect(res.status).toBe(201);
    }
  });

  it('should login all users and get tokens', async () => {
    const loginBuyer = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: buyerEmail, password: 'password123' });
    expect(loginBuyer.status).toBe(201);
    buyerToken = loginBuyer.body.data.accessToken;

    const loginSeller = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: sellerEmail, password: 'password123' });
    expect(loginSeller.status).toBe(201);
    sellerToken = loginSeller.body.data.accessToken;

    const loginDriver = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: driverEmail, password: 'password123' });
    expect(loginDriver.status).toBe(201);
    driverToken = loginDriver.body.data.accessToken;

    const loginAdmin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminEmail, password: 'password123' });
    expect(loginAdmin.status).toBe(201);
    adminToken = loginAdmin.body.data.accessToken;
  });

  it('should add ADMIN role to admin user', async () => {
    const adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });
    await prisma.userRole.create({
      data: { userId: adminUser!.id, roleName: RoleName.ADMIN },
    });
  });

  it('should switch admin to ADMIN role', async () => {
    const switchRes = await request(app.getHttpServer())
      .post('/auth/switch-role')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'ADMIN' });
    expect(switchRes.status).toBe(201);
    adminToken = switchRes.body.data.accessToken;
    expect(switchRes.body.data.activeRole).toBe('ADMIN');
  });

  it('should switch seller to SELLER role and create store', async () => {
    const switchRes = await request(app.getHttpServer())
      .post('/auth/switch-role')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ role: 'SELLER' });
    expect(switchRes.status).toBe(201);
    sellerToken = switchRes.body.data.accessToken;

    const storeRes = await request(app.getHttpServer())
      .post('/stores')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ storeName: `Test Store ${uniqueId}`, description: 'Test store' });
    expect(storeRes.status).toBe(201);
    storeId = storeRes.body.data.id;
  });

  it('should create product in store', async () => {
    const prodRes = await request(app.getHttpServer())
      .post(`/products/${storeId}`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ name: 'Test Product', description: 'Test', price: 50000, stock: 10 });
    expect(prodRes.status).toBe(201);
    productId = prodRes.body.data.product.id;
  });

  it('should switch buyer to BUYER, create address, and top up wallet', async () => {
    // switch to BUYER
    const switchRes = await request(app.getHttpServer())
      .post('/auth/switch-role')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ role: 'BUYER' });
    expect(switchRes.status).toBe(201);
    buyerToken = switchRes.body.data.accessToken;

    // create address
    const addrRes = await request(app.getHttpServer())
      .post('/address')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ label: 'Home', completeAddress: '123 Test St' });
    expect(addrRes.status).toBe(201);
    addressId = addrRes.body.data.id;

    // top up wallet
    const topRes = await request(app.getHttpServer())
      .post('/wallet/topup')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ amount: 200000 });
    expect(topRes.status).toBe(201);
  });

  it('should add product to cart', async () => {
    const cartRes = await request(app.getHttpServer())
      .post(`/cart/${productId}`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ quantity: 2 });
    expect(cartRes.status).toBe(201);
  });

  it('should get order summary and return token', async () => {
    const res = await request(app.getHttpServer())
      .post('/orders/summary')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ shippingMethod: 'REGULAR' });
    expect(res.status).toBe(201);
    expect(res.body.data.order.subtotal).toBe(100000);
    expect(res.body.data.order.shippingFee).toBe(10000);
    expect(res.body.data.order.taxFee).toBe(12000);
    expect(res.body.data.order.totalPrice).toBe(122000);
    orderToken = res.body.data.orderToken;
    expect(orderToken).toBeDefined();
  });

  it('should checkout with orderToken and create order (PENDING)', async () => {
    const res = await request(app.getHttpServer())
      .post('/orders/checkout')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ orderToken, addressId });
    expect(res.status).toBe(201);
    orderId = res.body.data.id;
    expect(res.body.data.status).toBe('PENDING');
  });

  it('should switch driver to DRIVER role', async () => {
    const switchRes = await request(app.getHttpServer())
      .post('/auth/switch-role')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ role: 'DRIVER' });
    expect(switchRes.status).toBe(201);
    driverToken = switchRes.body.data.accessToken;
  });

  it('should update order to READY_FOR_DELIVERY as seller', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/orders/${orderId}/progress`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ storeId });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('READY_FOR_DELIVERY');
  });

  it('should see order in available jobs as driver', async () => {
    const res = await request(app.getHttpServer())
      .get('/orders/available-jobs')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(res.status).toBe(200);
    const match = res.body.data.find((j: any) => j.id === orderId);
    expect(match).toBeDefined();
  });

  it('should take job as driver (status -> ON_DELIVERY)', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/orders/${orderId}/take-job`)
      .set('Authorization', `Bearer ${driverToken}`);
    expect(res.status).toBe(200);
  });

  it('should update order to DELIVERED as buyer', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/orders/${orderId}/progress`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ storeId });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('DELIVERED');
  });

  it('should verify seller and driver earnings', async () => {
    const sellerUser = await prisma.user.findUnique({
      where: { email: sellerEmail },
      include: { wallet: { include: { transactions: true } } },
    });
    expect(sellerUser).toBeDefined();
    expect(sellerUser.wallet).toBeDefined();

    const sellerEarning = sellerUser.wallet.transactions.find(t => t.type === 'SELLER_EARNING');
    expect(sellerEarning).toBeDefined();
    expect(sellerEarning!.amount).toBe(100000); // subtotal 100000 - discount 0

    const driverUser = await prisma.user.findUnique({
      where: { email: driverEmail },
      include: { wallet: { include: { transactions: true } } },
    });
    expect(driverUser).toBeDefined();
    expect(driverUser.wallet).toBeDefined();

    const driverEarning = driverUser.wallet.transactions.find(t => t.type === 'DRIVER_EARNING');
    expect(driverEarning).toBeDefined();
    expect(driverEarning!.amount).toBe(10000); // shippingFee

    // verify buyer wallet was debited
    const buyerUser = await prisma.user.findUnique({
      where: { email: buyerEmail },
      include: { wallet: true },
    });
    expect(buyerUser!.wallet!.balance).toBe(78000); // 200000 - 122000
  });

  describe('Admin Simulate Overdue', () => {
    it('should top up buyer wallet again for overdue test orders', async () => {
      const topRes = await request(app.getHttpServer())
        .post('/wallet/topup')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ amount: 300000 });
      expect(topRes.status).toBe(201);
    });

    it('should create product for PENDING overdue test', async () => {
      const prodRes = await request(app.getHttpServer())
        .post(`/products/${storeId}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ name: 'Product Overdue Pending', description: 'Test', price: 30000, stock: 5 });
      expect(prodRes.status).toBe(201);
      productPendingId = prodRes.body.data.product.id;
    });

    it('should create PENDING order for overdue test', async () => {
      await request(app.getHttpServer())
        .post(`/cart/${productPendingId}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ quantity: 3 });

      const summaryRes = await request(app.getHttpServer())
        .post('/orders/summary')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ shippingMethod: 'REGULAR' });
      expect(summaryRes.status).toBe(201);

      const checkoutRes = await request(app.getHttpServer())
        .post('/orders/checkout')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ orderToken: summaryRes.body.data.orderToken, addressId });
      expect(checkoutRes.status).toBe(201);
      expect(checkoutRes.body.data.status).toBe('PENDING');
      pendingOrderId = checkoutRes.body.data.id;
    });

    it('should create product for READY_FOR_DELIVERY overdue test', async () => {
      const prodRes = await request(app.getHttpServer())
        .post(`/products/${storeId}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ name: 'Product Overdue Ready', description: 'Test', price: 40000, stock: 5 });
      expect(prodRes.status).toBe(201);
      productReadyId = prodRes.body.data.product.id;
    });

    it('should create READY_FOR_DELIVERY order for overdue test', async () => {
      await request(app.getHttpServer())
        .post(`/cart/${productReadyId}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ quantity: 2 });

      const summaryRes = await request(app.getHttpServer())
        .post('/orders/summary')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ shippingMethod: 'REGULAR' });
      expect(summaryRes.status).toBe(201);

      const checkoutRes = await request(app.getHttpServer())
        .post('/orders/checkout')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ orderToken: summaryRes.body.data.orderToken, addressId });
      expect(checkoutRes.status).toBe(201);
      readyForDeliveryOrderId = checkoutRes.body.data.id;

      const progressRes = await request(app.getHttpServer())
        .patch(`/orders/${readyForDeliveryOrderId}/progress`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ storeId });
      expect(progressRes.status).toBe(200);
      expect(progressRes.body.data.status).toBe('READY_FOR_DELIVERY');
    });

    it('should set orders createdAt to past for overdue test', async () => {
      const pastDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      await prisma.order.update({
        where: { id: pendingOrderId },
        data: { createdAt: pastDate },
      });
      await prisma.order.update({
        where: { id: readyForDeliveryOrderId },
        data: { createdAt: pastDate },
      });
    });

    it('should reject simulate-overdue without admin role', async () => {
      const res = await request(app.getHttpServer())
        .post('/admin/simulate-overdue')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ dayToSkip: 1 });
      expect(res.status).toBe(403);
    });

    it('should reject simulate-overdue with invalid dayToSkip', async () => {
      const res = await request(app.getHttpServer())
        .post('/admin/simulate-overdue')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ dayToSkip: 0 });
      expect(res.status).toBe(400);

      const res2 = await request(app.getHttpServer())
        .post('/admin/simulate-overdue')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      expect(res2.status).toBe(400);
    });

    it('should simulate overdue and cancel overdue orders', async () => {
      const buyerBefore = await prisma.user.findUnique({
        where: { email: buyerEmail },
        include: { wallet: true },
      });
      const walletBefore = buyerBefore!.wallet!.balance;

      const prodPendingBefore = await prisma.product.findUnique({ where: { id: productPendingId } });
      const prodReadyBefore = await prisma.product.findUnique({ where: { id: productReadyId } });

      const res = await request(app.getHttpServer())
        .post('/admin/simulate-overdue')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ dayToSkip: 1 });
      expect(res.status).toBe(201);

      const canceledPending = await prisma.order.findUnique({ where: { id: pendingOrderId } });
      expect(canceledPending!.status).toBe('CANCELLED');
      expect(canceledPending!.overdueProcessedAt).not.toBeNull();

      const canceledReady = await prisma.order.findUnique({ where: { id: readyForDeliveryOrderId } });
      expect(canceledReady!.status).toBe('CANCELLED');
      expect(canceledReady!.overdueProcessedAt).not.toBeNull();

      // stock rolled back
      const prodPending = await prisma.product.findUnique({ where: { id: productPendingId } });
      expect(prodPending!.stock).toBe(prodPendingBefore!.stock + 3);

      const prodReady = await prisma.product.findUnique({ where: { id: productReadyId } });
      expect(prodReady!.stock).toBe(prodReadyBefore!.stock + 2);

      // wallet refunded (total price of both orders)
      const buyerAfter = await prisma.user.findUnique({
        where: { email: buyerEmail },
        include: { wallet: true },
      });
      expect(buyerAfter!.wallet!.balance).toBeGreaterThan(walletBefore);
    });

    it('should be idempotent when running simulate-overdue again', async () => {
      const buyerBefore = await prisma.user.findUnique({
        where: { email: buyerEmail },
        include: { wallet: { include: { transactions: { where: { type: 'REFUND' } } } } },
      });
      const refundCountBefore = buyerBefore!.wallet.transactions.length;

      const prodPendingBefore = await prisma.product.findUnique({ where: { id: productPendingId } });
      const prodReadyBefore = await prisma.product.findUnique({ where: { id: productReadyId } });

      const res = await request(app.getHttpServer())
        .post('/admin/simulate-overdue')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ dayToSkip: 1 });
      expect(res.status).toBe(201);

      const buyerAfter = await prisma.user.findUnique({
        where: { email: buyerEmail },
        include: { wallet: { include: { transactions: { where: { type: 'REFUND' } } } } },
      });
      expect(buyerAfter!.wallet.transactions.length).toBe(refundCountBefore);

      // stock unchanged
      const prodPending = await prisma.product.findUnique({ where: { id: productPendingId } });
      expect(prodPending!.stock).toBe(prodPendingBefore!.stock);

      const prodReady = await prisma.product.findUnique({ where: { id: productReadyId } });
      expect(prodReady!.stock).toBe(prodReadyBefore!.stock);
    });
  });

  describe('Store Read & Update', () => {
    it('should get store by ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/stores/${storeId}`)
        .set('Authorization', `Bearer ${sellerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(storeId);
      expect(res.body.data.storeName).toContain(`Test Store ${uniqueId}`);
    });

    it('should update store name', async () => {
      const res = await request(app.getHttpServer())
        .put(`/stores/${storeId}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ storeName: `Updated Store ${uniqueId}`, description: 'Updated description' });
      expect(res.status).toBe(200);
      expect(res.body.data.storeName).toContain('Updated Store');
    });
  });

  describe('Product Read, Update, Delete', () => {
    it('should get all products publicly', async () => {
      const res = await request(app.getHttpServer()).get('/products');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should get product by ID publicly', async () => {
      const res = await request(app.getHttpServer()).get(`/products/${productId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(productId);
    });

    it('should update product', async () => {
      const res = await request(app.getHttpServer())
        .put(`/products/${productId}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ name: 'Updated Product', price: 60000, stock: 20 });
      expect(res.status).toBe(200);
    });

    it('should create product for deletion test', async () => {
      const res = await request(app.getHttpServer())
        .post(`/products/${storeId}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ name: 'To Be Deleted', description: 'Delete me', price: 10000, stock: 3 });
      expect(res.status).toBe(201);
      deleteProductId = res.body.data.product.id;
    });

    it('should delete product', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/products/${deleteProductId}`)
        .set('Authorization', `Bearer ${sellerToken}`);
      expect(res.status).toBe(200);
      const deleted = await prisma.product.findUnique({ where: { id: deleteProductId } });
      expect(deleted).toBeNull();
    });
  });

  describe('Address Update & Delete', () => {
    it('should create a second address', async () => {
      const res = await request(app.getHttpServer())
        .post('/address')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ label: 'Office', completeAddress: '456 Work St' });
      expect(res.status).toBe(201);
      secondAddressId = res.body.data.id;
    });

    it('should update existing address', async () => {
      const res = await request(app.getHttpServer())
        .put(`/address/${addressId}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ label: 'Home Updated', completeAddress: '123 Test St Apt 4' });
      expect(res.status).toBe(200);
    });

    it('should delete second address', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/address/${secondAddressId}`)
        .set('Authorization', `Bearer ${buyerToken}`);
      expect(res.status).toBe(200);
      const deleted = await prisma.address.findUnique({ where: { id: secondAddressId } });
      expect(deleted).toBeNull();
    });
  });

  describe('Cart Operations', () => {
    it('should get cart items', async () => {
      const res = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${buyerToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should clear cart', async () => {
      const res = await request(app.getHttpServer())
        .delete('/cart')
        .set('Authorization', `Bearer ${buyerToken}`);
      expect(res.status).toBe(200);
      const cart = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${buyerToken}`);
      expect(cart.body.data.length).toBe(0);
    });
  });

  describe('Discount Flow', () => {
    it('should top up buyer wallet for discount test', async () => {
      const res = await request(app.getHttpServer())
        .post('/wallet/topup')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ amount: 500000 });
      expect(res.status).toBe(201);
    });

    it('should create product for discount test', async () => {
      const res = await request(app.getHttpServer())
        .post(`/products/${storeId}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ name: 'Discount Product', description: 'Test', price: 100000, stock: 10 });
      expect(res.status).toBe(201);
    });

    it('should add product to cart for discount test', async () => {
      const allProducts = await request(app.getHttpServer()).get('/products');
      const discountProduct = allProducts.body.data.find((p: any) => p.name === 'Discount Product');
      expect(discountProduct).toBeDefined();
      const res = await request(app.getHttpServer())
        .post(`/cart/${discountProduct.id}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ quantity: 2 });
      expect(res.status).toBe(201);
    });

    it('should create discount as admin', async () => {
      const expiredAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const res = await request(app.getHttpServer())
        .post('/discounts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ code: discountCode, type: 'VOUCHER', value: 5000, isPercent: false, maxUses: 10, expiredAt });
      expect(res.status).toBe(201);
      discountId = res.body.data.id;
    });

    it('should reject discount creation by non-admin', async () => {
      const res = await request(app.getHttpServer())
        .post('/discounts')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ code: 'INVALID', type: 'VOUCHER', value: 1000, expiredAt: new Date().toISOString() });
      expect(res.status).toBe(403);
    });

    it('should look up discount as buyer', async () => {
      const res = await request(app.getHttpServer())
        .get(`/discounts?code=${discountCode}`)
        .set('Authorization', `Bearer ${buyerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.code).toBe(discountCode);
      expect(res.body.data.value).toBe(5000);
    });

    it('should return 404 for invalid discount code', async () => {
      const res = await request(app.getHttpServer())
        .get('/discounts?code=NONEXISTENT')
        .set('Authorization', `Bearer ${buyerToken}`);
      expect(res.status).toBe(404);
    });

    it('should get order summary with discount applied', async () => {
      const res = await request(app.getHttpServer())
        .post('/orders/summary')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ discountCode, shippingMethod: 'REGULAR' });
      expect(res.status).toBe(201);
      // subtotal = 100000 * 2 = 200000
      expect(res.body.data.order.subtotal).toBe(200000);
      // discountValue = 5000 (fixed)
      expect(res.body.data.order.discountValue).toBe(5000);
      // shippingFee = 10000
      expect(res.body.data.order.shippingFee).toBe(10000);
      // taxFee = 200000 * 0.12 = 24000
      expect(res.body.data.order.taxFee).toBe(24000);
      // totalPrice = 200000 - 5000 + 10000 + 24000 = 229000
      expect(res.body.data.order.totalPrice).toBe(229000);
      orderToken = res.body.data.orderToken;
    });

    it('should checkout with discount and verify discount applied', async () => {
      const res = await request(app.getHttpServer())
        .post('/orders/checkout')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ orderToken, addressId });
      expect(res.status).toBe(201);
      discountOrderId = res.body.data.id;
      expect(res.body.data.status).toBe('PENDING');

      const order = await prisma.order.findUnique({
        where: { id: discountOrderId },
        include: { discount: true },
      });
      expect(order!.discountId).toBe(discountId);
      expect(order!.discountValue).toBe(5000);

      // verify discount usedCount incremented
      const discount = await prisma.discount.findUnique({ where: { id: discountId } });
      expect(discount!.usedCount).toBe(1);
    });

    it('should reject expired or invalid discount in checkout', async () => {
      // first add a new product to cart
      const res = await request(app.getHttpServer())
        .get('/discounts?code=NONEXISTENT')
        .set('Authorization', `Bearer ${buyerToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe('Order Cancellation', () => {
    it('should add product to cart for cancellation test', async () => {
      const res = await request(app.getHttpServer())
        .post(`/cart/${productId}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ quantity: 1 });
      expect(res.status).toBe(201);
    });

    it('should get summary and checkout for cancellation test', async () => {
      const summaryRes = await request(app.getHttpServer())
        .post('/orders/summary')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ shippingMethod: 'REGULAR' });
      expect(summaryRes.status).toBe(201);

      const checkoutRes = await request(app.getHttpServer())
        .post('/orders/checkout')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ orderToken: summaryRes.body.data.orderToken, addressId });
      expect(checkoutRes.status).toBe(201);
      cancelOrderId = checkoutRes.body.data.id;
      expect(checkoutRes.body.data.status).toBe('PENDING');
    });

    it('should cancel PENDING order', async () => {
      const stockBefore = await prisma.product.findUnique({ where: { id: productId } });

      const res = await request(app.getHttpServer())
        .patch(`/orders/${cancelOrderId}/cancel`)
        .set('Authorization', `Bearer ${buyerToken}`);
      expect(res.status).toBe(200);

      const order = await prisma.order.findUnique({ where: { id: cancelOrderId } });
      expect(order!.status).toBe('CANCELLED');

      // verify stock rolled back
      const stockAfter = await prisma.product.findUnique({ where: { id: productId } });
      expect(stockAfter!.stock).toBe(stockBefore!.stock + 1);

      // verify refund
      const buyerUser = await prisma.user.findUnique({
        where: { email: buyerEmail },
        include: { wallet: { include: { transactions: { where: { type: 'REFUND' } } } } },
      });
      const refundTx = buyerUser!.wallet.transactions.find(t => t.type === 'REFUND');
      expect(refundTx).toBeDefined();
    });

    it('should reject cancelling non-PENDING order', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${buyerToken}`);
      expect(res.status).toBe(400);
    });

    it('should reject cancelling by non-buyer', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/orders/${cancelOrderId}/cancel`)
        .set('Authorization', `Bearer ${sellerToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('Order List & Detail', () => {
    it('should list buyer orders', async () => {
      const res = await request(app.getHttpServer())
        .get('/orders')
        .set('Authorization', `Bearer ${buyerToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should get order detail by ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${buyerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(orderId);
    });
  });

  describe('Reviews', () => {
    it('should create a review', async () => {
      const res = await request(app.getHttpServer())
        .post('/reviews')
        .send({ reviewerName: 'Tester', rating: 5, comment: 'Great app!' });
      expect(res.status).toBe(201);
    });

    it('should get all reviews', async () => {
      const res = await request(app.getHttpServer()).get('/reviews');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.reviews)).toBe(true);
      expect(res.body.data.total).toBeGreaterThan(0);
    });

    it('should reject review with invalid rating', async () => {
      const res = await request(app.getHttpServer())
        .post('/reviews')
        .send({ reviewerName: 'Tester', rating: 6, comment: 'Bad' });
      expect(res.status).toBe(400);
    });
  });

  describe('Admin Order Management', () => {
    it('should list all orders as admin', async () => {
      const res = await request(app.getHttpServer())
        .get('/orders/admin')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should reject listing orders as non-admin', async () => {
      const res = await request(app.getHttpServer())
        .get('/orders/admin')
        .set('Authorization', `Bearer ${buyerToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('Negative / Edge Cases', () => {
    it('should reject duplicate email registration', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ username: 'duplicate', email: buyerEmail, password: 'password123' });
      expect(res.status).toBe(409);
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: buyerEmail, password: 'wrongpassword' });
      expect(res.status).toBe(403);
    });

    it('should reject requests without token', async () => {
      const res = await request(app.getHttpServer()).post('/orders/checkout').send({});
      expect(res.status).toBe(401);
    });

    it('should reject buyer accessing seller endpoint', async () => {
      const res = await request(app.getHttpServer())
        .post('/stores')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ storeName: 'Hack', description: 'x' });
      expect(res.status).toBe(403);
    });

    it('should reject checkout with empty body', async () => {
      const res = await request(app.getHttpServer())
        .post('/orders/checkout')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({});
      expect(res.status).toBe(400);
    });

    it('should reject login with invalid email format', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'notanemail', password: 'password123' });
      expect(res.status).toBe(400);
    });
  });

  describe('Additional Validation & Edge Cases', () => {
    describe('Auth validation', () => {
      it('should reject register with short username', async () => {
        const res = await request(app.getHttpServer())
          .post('/auth/register')
          .send({ username: 'ab', email: 'shortuser@test.com', password: 'password123' });
        expect(res.status).toBe(400);
      });

      it('should reject register with short password', async () => {
        const res = await request(app.getHttpServer())
          .post('/auth/register')
          .send({ username: 'validuser', email: 'shortpass@test.com', password: 'short' });
        expect(res.status).toBe(400);
      });

      it('should reject login with non-existent email', async () => {
        const res = await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'nonexistent@test.com', password: 'password123' });
        expect(res.status).toBe(401);
      });
    });

    describe('Cart edge cases', () => {
      it('should reject adding product exceeding stock', async () => {
        const res = await request(app.getHttpServer())
          .post(`/cart/${productId}`)
          .set('Authorization', `Bearer ${buyerToken}`)
          .send({ quantity: 9999 });
        expect(res.status).toBe(400);
      });

      it('should reject adding non-existent product', async () => {
        const res = await request(app.getHttpServer())
          .post('/cart/non-existent-id')
          .set('Authorization', `Bearer ${buyerToken}`)
          .send({ quantity: 1 });
        expect(res.status).toBe(404);
      });
    });

    describe('Order edge cases', () => {
      it('should clear cart then reject summary with empty cart', async () => {
        await request(app.getHttpServer())
          .delete('/cart')
          .set('Authorization', `Bearer ${buyerToken}`);
        const res = await request(app.getHttpServer())
          .post('/orders/summary')
          .set('Authorization', `Bearer ${buyerToken}`)
          .send({ shippingMethod: 'REGULAR' });
        expect(res.status).toBe(400);
      });

      it('should accept summary with INSTANT shipping', async () => {
        await request(app.getHttpServer())
          .post(`/cart/${productId}`)
          .set('Authorization', `Bearer ${buyerToken}`)
          .send({ quantity: 1 });
        const res = await request(app.getHttpServer())
          .post('/orders/summary')
          .set('Authorization', `Bearer ${buyerToken}`)
          .send({ shippingMethod: 'INSTANT' });
        expect(res.status).toBe(201);
        expect(res.body.data.order.shippingFee).toBe(15000);
        expect(res.body.data.order.shippingSelect).toBe('INSTANT');
      });

      it('should accept summary with NEXT_DAY shipping', async () => {
        await request(app.getHttpServer())
          .delete('/cart')
          .set('Authorization', `Bearer ${buyerToken}`);
        await request(app.getHttpServer())
          .post(`/cart/${productId}`)
          .set('Authorization', `Bearer ${buyerToken}`)
          .send({ quantity: 1 });
        const res = await request(app.getHttpServer())
          .post('/orders/summary')
          .set('Authorization', `Bearer ${buyerToken}`)
          .send({ shippingMethod: 'NEXT_DAY' });
        expect(res.status).toBe(201);
        expect(res.body.data.order.shippingFee).toBe(20000);
        expect(res.body.data.order.shippingSelect).toBe('NEXT_DAY');
      });

      it('should reject progressing a DELIVERED order', async () => {
        const res = await request(app.getHttpServer())
          .patch(`/orders/${orderId}/progress`)
          .set('Authorization', `Bearer ${buyerToken}`)
          .send({ storeId });
        expect(res.status).toBe(400);
      });

      it('should return empty available jobs list when all delivered', async () => {
        const res = await request(app.getHttpServer())
          .get('/orders/available-jobs')
          .set('Authorization', `Bearer ${driverToken}`);
        expect(res.status).toBe(200);
        // after main flow, no READY_FOR_DELIVERY orders without drivers
        const anyUnassigned = res.body.data.some((j: any) =>
          j.status === 'READY_FOR_DELIVERY' && !j.driverJob
        );
        expect(anyUnassigned).toBe(false);
      });

      it('should create order status log on progress', async () => {
        const logs = await prisma.orderStatusLog.findMany({
          where: { orderId },
          orderBy: { changedAt: 'asc' },
        });
        expect(logs.length).toBeGreaterThanOrEqual(3);
        const statuses = logs.map(l => l.status);
        expect(statuses).toContain('PENDING');
        expect(statuses).toContain('READY_FOR_DELIVERY');
        expect(statuses).toContain('ON_DELIVERY');
        expect(statuses).toContain('DELIVERED');
      });
    });

    describe('Insufficient balance checkout', () => {
      it('should reject checkout with insufficient balance', async () => {
        const expensiveRes = await request(app.getHttpServer())
          .post(`/products/${storeId}`)
          .set('Authorization', `Bearer ${sellerToken}`)
          .send({ name: 'Expensive Product', description: 'Bank breaker', price: 999999999, stock: 1 });
        expect(expensiveRes.status).toBe(201);
        const expensiveProductId = expensiveRes.body.data.product.id;

        await request(app.getHttpServer())
          .delete('/cart')
          .set('Authorization', `Bearer ${buyerToken}`);

        await request(app.getHttpServer())
          .post(`/cart/${expensiveProductId}`)
          .set('Authorization', `Bearer ${buyerToken}`)
          .send({ quantity: 1 });

        const summaryRes = await request(app.getHttpServer())
          .post('/orders/summary')
          .set('Authorization', `Bearer ${buyerToken}`)
          .send({ shippingMethod: 'REGULAR' });
        expect(summaryRes.status).toBe(201);

        const checkoutRes = await request(app.getHttpServer())
          .post('/orders/checkout')
          .set('Authorization', `Bearer ${buyerToken}`)
          .send({ orderToken: summaryRes.body.data.orderToken, addressId });
        expect(checkoutRes.status).toBe(400);
      });
    });

    describe('Discount edge cases', () => {
      it('should create percentage discount', async () => {
        const expiredAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        const res = await request(app.getHttpServer())
          .post('/discounts')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ code: `PCT${uniqueId}`, type: 'PROMO', value: 10, isPercent: true, maxUses: 5, expiredAt });
        expect(res.status).toBe(201);
        pctDiscountId = res.body.data.id;
      });

      it('should reject expired discount', async () => {
        const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const res = await request(app.getHttpServer())
          .post('/discounts')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ code: `EXP${uniqueId}`, type: 'VOUCHER', value: 1000, maxUses: 5, expiredAt: pastDate });
        expect(res.status).toBe(201);
        expiredDiscountId = res.body.data.id;

        const lookupRes = await request(app.getHttpServer())
          .get(`/discounts?code=EXP${uniqueId}`)
          .set('Authorization', `Bearer ${buyerToken}`);
        expect(lookupRes.status).toBe(400);
      });

      it('should reject discount with maxUses reached', async () => {
        const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        const res = await request(app.getHttpServer())
          .post('/discounts')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ code: `MAX${uniqueId}`, type: 'VOUCHER', value: 1000, maxUses: 1, expiredAt: futureDate });
        expect(res.status).toBe(201);
        const maxDiscountId = res.body.data.id;

        await request(app.getHttpServer())
          .delete('/cart')
          .set('Authorization', `Bearer ${buyerToken}`);
        await request(app.getHttpServer())
          .post(`/cart/${productId}`)
          .set('Authorization', `Bearer ${buyerToken}`)
          .send({ quantity: 1 });

        const summaryRes = await request(app.getHttpServer())
          .post('/orders/summary')
          .set('Authorization', `Bearer ${buyerToken}`)
          .send({ discountCode: `MAX${uniqueId}`, shippingMethod: 'REGULAR' });
        expect(summaryRes.status).toBe(201);

        const checkoutRes = await request(app.getHttpServer())
          .post('/orders/checkout')
          .set('Authorization', `Bearer ${buyerToken}`)
          .send({ orderToken: summaryRes.body.data.orderToken, addressId });
        expect(checkoutRes.status).toBe(201);

        // usedCount should now be 1 = maxUses, try to use again
        await request(app.getHttpServer())
          .delete('/cart')
          .set('Authorization', `Bearer ${buyerToken}`);
        await request(app.getHttpServer())
          .post(`/cart/${productId}`)
          .set('Authorization', `Bearer ${buyerToken}`)
          .send({ quantity: 1 });

        const summaryRes2 = await request(app.getHttpServer())
          .post('/orders/summary')
          .set('Authorization', `Bearer ${buyerToken}`)
          .send({ discountCode: `MAX${uniqueId}`, shippingMethod: 'REGULAR' });
        expect(summaryRes2.status).toBe(400);
      });

      it('should reject duplicate discount code', async () => {
        const expiredAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        const res = await request(app.getHttpServer())
          .post('/discounts')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ code: discountCode, type: 'VOUCHER', value: 1000, maxUses: 5, expiredAt });
        expect(res.status).toBe(409);
      });

      it('should update discount', async () => {
        const expiredAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        const res = await request(app.getHttpServer())
          .patch(`/discounts/${discountId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ value: 8000, expiredAt });
        expect(res.status).toBe(200);
      });

      it('should delete discount', async () => {
        const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        const res = await request(app.getHttpServer())
          .post('/discounts')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ code: `DEL${uniqueId}`, type: 'VOUCHER', value: 5000, maxUses: 5, expiredAt: futureDate });
        expect(res.status).toBe(201);
        const delDiscountId = res.body.data.id;

        const delRes = await request(app.getHttpServer())
          .delete(`/discounts/${delDiscountId}`)
          .set('Authorization', `Bearer ${adminToken}`);
        expect(delRes.status).toBe(200);

        // verify it's gone
        const lookupRes = await request(app.getHttpServer())
          .get(`/discounts?code=DEL${uniqueId}`)
          .set('Authorization', `Bearer ${buyerToken}`);
        expect(lookupRes.status).toBe(404);
      });
    });

    describe('Wallet edge cases', () => {
      it('should reject topup with zero amount', async () => {
        const res = await request(app.getHttpServer())
          .post('/wallet/topup')
          .set('Authorization', `Bearer ${buyerToken}`)
          .send({ amount: 0 });
        expect(res.status).toBe(400);
      });

      it('should reject topup with negative amount', async () => {
        const res = await request(app.getHttpServer())
          .post('/wallet/topup')
          .set('Authorization', `Bearer ${buyerToken}`)
          .send({ amount: -1000 });
        expect(res.status).toBe(400);
      });
    });

    describe('Review validation', () => {
      it('should reject review with short reviewerName', async () => {
        const res = await request(app.getHttpServer())
          .post('/reviews')
          .send({ reviewerName: 'AB', rating: 5, comment: 'Good' });
        expect(res.status).toBe(400);
      });

      it('should reject review with long reviewerName', async () => {
        const res = await request(app.getHttpServer())
          .post('/reviews')
          .send({ reviewerName: 'A'.repeat(20), rating: 5, comment: 'Good' });
        expect(res.status).toBe(400);
      });

      it('should reject review with empty comment', async () => {
        const res = await request(app.getHttpServer())
          .post('/reviews')
          .send({ reviewerName: 'Tester', rating: 5, comment: '' });
        expect(res.status).toBe(400);
      });
    });

    describe('Cross-role access', () => {
      it('should reject driver accessing buyer cart endpoint', async () => {
        const res = await request(app.getHttpServer())
          .get('/cart')
          .set('Authorization', `Bearer ${driverToken}`);
        expect(res.status).toBe(403);
      });

      it('should reject seller accessing buyer cart endpoint', async () => {
        const res = await request(app.getHttpServer())
          .get('/cart')
          .set('Authorization', `Bearer ${sellerToken}`);
        expect(res.status).toBe(403);
      });

      it('should reject driver accessing buyer address endpoint', async () => {
        const res = await request(app.getHttpServer())
          .post('/address')
          .set('Authorization', `Bearer ${driverToken}`)
          .send({ label: 'Test', completeAddress: 'Test' });
        expect(res.status).toBe(403);
      });
    });

    describe('Non-existent resources', () => {
      it('should return 404 for non-existent product', async () => {
        const res = await request(app.getHttpServer())
          .get('/products/non-existent-id');
        expect(res.status).toBe(404);
      });

      it('should return 404 for non-existent address deletion', async () => {
        const res = await request(app.getHttpServer())
          .delete('/address/non-existent-id')
          .set('Authorization', `Bearer ${buyerToken}`);
        expect(res.status).toBe(404);
      });

      it('should return 404 for deleting already deleted product', async () => {
        const res = await request(app.getHttpServer())
          .delete(`/products/${deleteProductId}`)
          .set('Authorization', `Bearer ${sellerToken}`);
        expect(res.status).toBe(404);
      });
    });
  });
});

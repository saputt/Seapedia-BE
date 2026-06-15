import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';

describe('Order Flow E2E', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const uniqueId = Date.now();

  const buyerEmail = `buyer${uniqueId}@test.com`;
  const sellerEmail = `seller${uniqueId}@test.com`;
  const driverEmail = `driver${uniqueId}@test.com`;

  let buyerToken: string;
  let sellerToken: string;
  let driverToken: string;

  let storeId: string;
  let productId: string;
  let addressId: string;
  let orderId: string;

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
    if (orderId) {
      await prisma.orderStatusLog.deleteMany({ where: { orderId } });
      await prisma.driverJob.deleteMany({ where: { orderId } });
      await prisma.orderItem.deleteMany({ where: { orderId } });
      await prisma.order.deleteMany({ where: { id: orderId } });
    }
    if (productId) {
      await prisma.cartItem.deleteMany({ where: { productId } });
      await prisma.product.deleteMany({ where: { id: productId } });
    }
    if (storeId) {
      await prisma.store.deleteMany({ where: { id: storeId } });
    }

    for (const email of [buyerEmail, sellerEmail, driverEmail]) {
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
    await app.close();
  });

  it('should register all users', async () => {
    for (const { username, email } of [
      { username: 'buyer', email: buyerEmail },
      { username: 'seller', email: sellerEmail },
      { username: 'driver', email: driverEmail },
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
      .post('/buyer/address')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ label: 'Home', completeAddress: '123 Test St' });
    expect(addrRes.status).toBe(201);
    addressId = addrRes.body.data.id;

    // top up wallet
    const topRes = await request(app.getHttpServer())
      .post('/buyer/wallet/topup')
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

  it('should get order summary', async () => {
    const res = await request(app.getHttpServer())
      .post('/orders/summary')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ shippingMethod: 'REGULAR' });
    expect(res.status).toBe(201);
    expect(res.body.data.subtotal).toBe(100000);
    expect(res.body.data.shippingFee).toBe(10000);
    expect(res.body.data.taxFee).toBe(12000);
    expect(res.body.data.totalPrice).toBe(122000);
  });

  it('should checkout and create order (PENDING)', async () => {
    const res = await request(app.getHttpServer())
      .post('/orders/checkout')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ shippingMethod: 'REGULAR', storeId, addressId });
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
});

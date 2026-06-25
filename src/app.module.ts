import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductModule } from './product/product.module';
import { StoreModule } from './store/store.module';
import { ReviewModule } from './review/review.module';
import { ProductReviewModule } from './product-review/product-review.module';
import { CartModule } from './cart/cart.module';
import { AddressModule } from './address/address.module';
import { WalletModule } from './wallet/wallet.module';
import { OrderModule } from './order/order.module';
import { DiscountModule } from './discount/discount.module';
import { AdminModule } from './admin/admin.module';
import { UserModule } from './user/user.module';
import { UploadModule } from './upload/upload.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { validationSchema } from './common/config/validation';
import { TokenBlacklistGuard } from './auth/guards/token-blacklist.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema,
      isGlobal: true,
      validationOptions: { allowUnknown: true },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    AuthModule,
    PrismaModule,
    ProductModule,
    StoreModule,
    ReviewModule,
    ProductReviewModule,
    CartModule,
    AddressModule,
    WalletModule,
    OrderModule,
    DiscountModule,
    AdminModule,
    UserModule,
    UploadModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: TokenBlacklistGuard },
  ],
})
export class AppModule {}

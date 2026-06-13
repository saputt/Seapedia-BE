import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductModule } from './product/product.module';
import { StoreModule } from './store/store.module';
import { ReviewModule } from './review/review.module';
import { CartModule } from './cart/cart.module';
import { AddressModule } from './address/address.module';
import { WalletModule } from './wallet/wallet.module';

@Module({
  imports: [AuthModule, PrismaModule, ProductModule, StoreModule, ReviewModule, CartModule, AddressModule, WalletModule],
})
export class AppModule {}

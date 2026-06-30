import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminSchedulerService } from './admin-scheduler.service';
import { AdminRepository } from './admin.repository';
import { PrismaModule } from 'src/prisma/prisma.module';
import { OrderModule } from 'src/order/order.module';
import { ProductModule } from 'src/product/product.module';
import { WalletModule } from 'src/wallet/wallet.module';

@Module({
  providers: [AdminService, AdminSchedulerService, AdminRepository],
  controllers: [AdminController],
  imports: [PrismaModule, OrderModule, ProductModule, WalletModule],
})
export class AdminModule {}

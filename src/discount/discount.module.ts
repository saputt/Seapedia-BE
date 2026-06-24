import { Module } from '@nestjs/common';
import { DiscountService } from './discount.service';
import { DiscountRepository } from './discount.repository';
import { DiscountController } from './discount.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  providers: [DiscountService, DiscountRepository],
  controllers: [DiscountController],
  exports: [DiscountService],
  imports: [PrismaModule],
})
export class DiscountModule {}

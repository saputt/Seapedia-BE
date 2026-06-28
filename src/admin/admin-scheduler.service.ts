import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AdminService } from './admin.service';

@Injectable()
export class AdminSchedulerService {
  private readonly logger = new Logger(AdminSchedulerService.name);

  constructor(private adminService: AdminService) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleOverdueOrders() {
    this.logger.log('Memeriksa pesanan overdue...');
    try {
      const result = await this.adminService.processOverdueOrders();
      if (result.totalProcessed > 0) {
        this.logger.log(
          `Diproses ${result.totalProcessed} pesanan overdue, total refund: Rp${result.totalRefund.toLocaleString('id-ID')}`,
        );
      } else {
        this.logger.log('Tidak ada pesanan overdue');
      }
    } catch (error) {
      this.logger.error('Gagal memproses pesanan overdue', error);
    }
  }
}

import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RoleName } from '@prisma/client';
import { RoleGuard } from 'src/common/guards/role.guard';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RoleGuard(RoleName.ADMIN))
@ApiBearerAuth()
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard stats' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved' })
  async getDashboard() {
    const data = await this.adminService.getDashboard();
    return { message: 'get dashboard success', data };
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users (Admin)' })
  @ApiResponse({ status: 200, description: 'Users retrieved' })
  async getUsers(@Query('page') page?: number, @Query('limit') limit?: number) {
    const safePage = Math.max(1, page ?? 1);
    const safeLimit = Math.min(100, Math.max(1, limit ?? 20));
    const result = await this.adminService.getUsers(safePage, safeLimit);
    return { message: 'get users success', data: result };
  }

  @Get('stores')
  @ApiOperation({ summary: 'Get all stores (Admin)' })
  @ApiResponse({ status: 200, description: 'Stores retrieved' })
  async getStores(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const safePage = Math.max(1, page ?? 1);
    const safeLimit = Math.min(100, Math.max(1, limit ?? 20));
    const result = await this.adminService.getStores(safePage, safeLimit);
    return { message: 'get stores success', data: result };
  }

  @Get('products')
  @ApiOperation({ summary: 'Get all products (Admin)' })
  @ApiResponse({ status: 200, description: 'Products retrieved' })
  async getProducts(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const safePage = Math.max(1, page ?? 1);
    const safeLimit = Math.min(100, Math.max(1, limit ?? 20));
    const result = await this.adminService.getProducts(safePage, safeLimit);
    return { message: 'get products success', data: result };
  }

  @Get('drivers')
  @ApiOperation({ summary: 'Get all drivers (Admin)' })
  @ApiResponse({ status: 200, description: 'Drivers retrieved' })
  async getDrivers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const safePage = Math.max(1, page ?? 1);
    const safeLimit = Math.min(100, Math.max(1, limit ?? 20));
    const result = await this.adminService.getDrivers(safePage, safeLimit);
    return { message: 'get drivers success', data: result };
  }

  @Patch('drivers/:id/toggle-suspend')
  @ApiOperation({ summary: 'Toggle driver suspension status (Admin)' })
  @ApiResponse({ status: 200, description: 'Driver suspension toggled' })
  async toggleDriverSuspend(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason?: string,
  ) {
    const result = await this.adminService.toggleDriverSuspend(id, reason);
    return { message: 'toggle driver suspend success', data: result };
  }

  @Patch('stores/:id/toggle-active')
  @ApiOperation({ summary: 'Toggle store active status (Admin)' })
  @ApiResponse({ status: 200, description: 'Store status toggled' })
  async toggleStoreActive(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason?: string,
  ) {
    const result = await this.adminService.toggleStoreActive(id, reason);
    return { message: 'toggle store active success', data: result };
  }

  @Patch('products/:id/toggle-hidden')
  @ApiOperation({ summary: 'Toggle product hidden status (Admin)' })
  @ApiResponse({ status: 200, description: 'Product hidden status toggled' })
  async toggleProductHidden(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.adminService.toggleProductHidden(id);
    return { message: 'toggle product hidden success', data: result };
  }

  @Get('simulation/status')
  @ApiOperation({ summary: 'Get current simulation status' })
  @ApiResponse({ status: 200, description: 'Simulation status' })
  getSimulationStatus() {
    const simulatedDate = this.adminService.getSimulatedDate();
    return {
      message: 'get simulation status success',
      data: {
        simulatedDate: simulatedDate.toISOString(),
        totalDaysSkipped: Math.round(
          (simulatedDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000),
        ),
      },
    };
  }

  @Post('simulation/overdue')
  @ApiOperation({
    summary: 'Advance simulated time and process overdue orders',
  })
  @ApiResponse({ status: 201, description: 'Simulation completed' })
  async simulateOverdue(@Body('daysToSkip') daysToSkip?: number) {
    const safeDaysToSkip = Math.min(365, Math.max(1, daysToSkip ?? 1));
    const data = await this.adminService.simulateOverdue(safeDaysToSkip);
    return { message: 'simulation success', data };
  }

  @Post('simulation/reset')
  @ApiOperation({ summary: 'Reset simulated time back to real time' })
  @ApiResponse({ status: 200, description: 'Simulation reset' })
  resetSimulation() {
    const data = this.adminService.resetSimulation();
    return { message: 'reset success', data };
  }
}

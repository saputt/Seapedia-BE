import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AdminGuard } from 'src/common/guards/admin.guard';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
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
    const result = await this.adminService.getUsers(page ?? 1, limit ?? 20);
    return { message: 'get users success', data: result };
  }

  @Get('simulation/status')
  @ApiOperation({ summary: 'Get current simulation status' })
  @ApiResponse({ status: 200, description: 'Simulation status' })
  async getSimulationStatus() {
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
    const data = await this.adminService.simulateOverdue(daysToSkip ?? 1);
    return { message: 'simulation success', data };
  }

  @Post('simulation/reset')
  @ApiOperation({ summary: 'Reset simulated time back to real time' })
  @ApiResponse({ status: 200, description: 'Simulation reset' })
  async resetSimulation() {
    const data = this.adminService.resetSimulation();
    return { message: 'reset success', data };
  }
}

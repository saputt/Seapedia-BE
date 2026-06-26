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
import { OrderService } from './order.service';
import { CheckoutDto } from './dto/checkout.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { OrderSummaryDto } from './dto/order-summary.dto';
import { RoleName } from '@prisma/client';
import { RoleGuard } from 'src/common/guards/role.guard';
import { UpdateStatusOrderDto } from './dto/update-status-order.dto';
import { FilterOrderDto } from './dto/filter-order.dto';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrderController {
  constructor(private orderService: OrderService) {}

  @Get('available-jobs')
  @UseGuards(RoleGuard(RoleName.DRIVER))
  @ApiOperation({ summary: 'Get available delivery jobs (Driver)' })
  @ApiResponse({ status: 200, description: 'Available jobs retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Only driver can access',
  })
  async getAvailableJobs() {
    const getAvailableJobsResult = await this.orderService.getAvailableJobs();
    return {
      message: 'get available jobs success',
      data: getAvailableJobsResult,
    };
  }

  @Get('admin')
  @UseGuards(RoleGuard(RoleName.ADMIN))
  @ApiOperation({ summary: 'Get all orders for admin (Admin)' })
  @ApiResponse({ status: 200, description: 'All orders retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden. Only admin can access' })
  async getAllOrdersForAdmin(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    const getAllOrdersForAdminResult =
      await this.orderService.getAllOrdersForAdmin(page ?? 1, limit ?? 10, status);
    return {
      message: 'get all orders success',
      data: getAllOrdersForAdminResult,
    };
  }

  @Get('buyer')
  @UseGuards(RoleGuard(RoleName.BUYER))
  @ApiOperation({ summary: 'Get all buyer orders (Buyer)' })
  @ApiResponse({ status: 200, description: 'Orders retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden. Only buyer can access' })
  async getAllOrders(@GetUser('id') userId: string) {
    const getAllOrdersResult = await this.orderService.getAllOrders(userId);
    return {
      message: 'get all orders success',
      data: getAllOrdersResult,
    };
  }

  @Get('seller')
  @UseGuards(RoleGuard(RoleName.SELLER))
  async getOrdersForSeller(
    @GetUser('id') sellerId: string,
    @Query() filter: FilterOrderDto,
  ) {
    const getOrdersForSellerResult = await this.orderService.getOrdersForSeller(
      sellerId,
      filter,
    );
    return {
      message: 'get my orders success',
      data: getOrdersForSellerResult,
    };
  }

  @Get('driver/my-jobs')
  @UseGuards(RoleGuard(RoleName.DRIVER))
  @ApiOperation({ summary: 'Get my delivery jobs (Driver)' })
  @ApiResponse({ status: 200, description: 'My jobs retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Only driver can access',
  })
  async getMyDriverJobs(@GetUser('id') driverId: string) {
    const getMyJobsResult = await this.orderService.getMyJobs(driverId);
    return {
      message: 'get my driver jobs success',
      data: getMyJobsResult,
    };
  }

  @Get(':orderId')
  @UseGuards(RoleGuard(RoleName.BUYER))
  @ApiOperation({ summary: 'Get order by ID (Buyer)' })
  @ApiResponse({ status: 200, description: 'Order retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden. Not your order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrderById(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @GetUser('id') userId: string,
  ) {
    const getOrderByIdResult = await this.orderService.getOrderById(
      orderId,
      userId,
    );
    return {
      message: `get order with id : ${orderId} success`,
      data: getOrderByIdResult,
    };
  }

  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('checkout')
  @UseGuards(RoleGuard(RoleName.BUYER))
  @ApiOperation({ summary: 'Checkout cart (Buyer)' })
  @ApiResponse({ status: 201, description: 'Order created' })
  @ApiResponse({ status: 400, description: 'Invalid order token or expired' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden. Token user mismatch' })
  @ApiResponse({ status: 404, description: 'Store or address not found' })
  @ApiResponse({
    status: 429,
    description: 'Too many requests (rate limit exceeded)',
  })
  async checkout(@Body() dto: CheckoutDto, @GetUser('id') userId: string) {
    const checkoutResult = await this.orderService.checkout(dto, userId);
    return {
      message: `checkout cart success`,
      data: checkoutResult,
    };
  }

  @Post('summary')
  @UseGuards(RoleGuard(RoleName.BUYER))
  @ApiOperation({ summary: 'Get order summary (Buyer)' })
  @ApiResponse({ status: 200, description: 'Order summary generated' })
  @ApiResponse({ status: 400, description: 'Cannot checkout an empty cart' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden. Only buyer can access' })
  async orderSummary(
    @Body() dto: OrderSummaryDto,
    @GetUser('id') userId: string,
  ) {
    const orderSummaryResult = await this.orderService.orderSummary(
      dto,
      userId,
    );
    return {
      message: 'get order summary success',
      data: orderSummaryResult,
    };
  }

  @Patch(':orderId/progress')
  @ApiOperation({ summary: 'Update order status (role-based progression)' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  @ApiResponse({
    status: 400,
    description: 'Cannot update status anymore or driver not assigned',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Not your order or store',
  })
  @ApiResponse({ status: 404, description: 'Store or order not found' })
  async updateStatusOrder(
    @Body() dto: UpdateStatusOrderDto,
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @GetUser('id') userId: string,
    @GetUser('role') userRole: RoleName,
  ) {
    const updateStatusOrderResult = await this.orderService.updateStatusOrder(
      dto.storeId,
      orderId,
      userId,
      userRole,
    );
    return {
      message: `update status order with id ${orderId} success`,
      data: updateStatusOrderResult,
    };
  }

  @Patch(':orderId/cancel')
  @UseGuards(RoleGuard(RoleName.BUYER))
  @ApiOperation({ summary: 'Cancel order (Buyer)' })
  @ApiResponse({
    status: 200,
    description: 'Order cancelled and refund processed',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot cancel order anymore (not PENDING)',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden. Not your order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async cancelOrder(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @GetUser('id') userId: string,
  ) {
    const cancelOrderResult = await this.orderService.cancelOrder(
      userId,
      orderId,
    );
    return {
      message: `cancel order with id : ${cancelOrderResult.id} success`,
      data: cancelOrderResult,
    };
  }

  @Patch(':orderId/take-job')
  @UseGuards(RoleGuard(RoleName.DRIVER))
  @ApiOperation({ summary: 'Take delivery job (Driver)' })
  @ApiResponse({ status: 200, description: 'Job taken' })
  @ApiResponse({ status: 400, description: 'Job is cannot be take' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Only driver can access',
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async takeJob(
    @GetUser('id') driverId: string,
    @GetUser('role') userRole: RoleName,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    const takeJobResult = await this.orderService.takeJob(
      orderId,
      driverId,
      userRole,
    );
    return {
      message: `take driver job with id order : ${takeJobResult.orderId} success`,
      data: takeJobResult,
    };
  }

  @Patch(':orderId/delivery-done')
  @UseGuards(RoleGuard(RoleName.DRIVER))
  @ApiOperation({ summary: 'Mark delivery as done (Driver)' })
  @ApiResponse({ status: 200, description: 'Delivery marked as done' })
  @ApiResponse({ status: 400, description: 'Order is not in delivery' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden. Not your delivery' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async deliveryDone(
    @GetUser('id') driverId: string,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    const deliveryDoneResult = await this.orderService.deliveryDone(
      orderId,
      driverId,
    );
    return {
      message: 'delivery marked as done',
      data: deliveryDoneResult,
    };
  }
}

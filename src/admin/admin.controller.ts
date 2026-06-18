import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AdminService } from "./admin.service";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { AdminGuard } from "src/common/guards/admin.guard";
import { SimulateOverdueDto } from "./dto/simulate-overdue.dto";

@ApiTags("Admin")
@Controller("admin")
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminController {
    constructor(private adminService : AdminService) {}

    @Get("dashboard")
    @ApiOperation({ summary : "Get admin dashboard stats" })
    @ApiResponse({ status : 200, description : "Dashboard data retrieved" })
    async getDashboard() {
        const data = await this.adminService.getDashboard()
        return { message : "get dashboard success", data }
    }

    @Get("users")
    @ApiOperation({ summary : "Get all users (Admin)" })
    @ApiResponse({ status : 200, description : "Users retrieved" })
    async getUsers(@Query("page") page? : number, @Query("limit") limit? : number) {
        const result = await this.adminService.getUsers(page ?? 1, limit ?? 20)
        return { message : "get users success", data : result }
    }

    @Post("simulate-overdue")
    @ApiOperation({ summary : "Simulate overdue orders (Admin)" })
    @ApiResponse({ status : 201, description : "Simulation completed" })
    async simulateOverdue(@Body() dto : SimulateOverdueDto) {
        await this.adminService.simulateOverdue(dto.dayToSkip)
        return { message : "simulate success", data : null }
    }
}

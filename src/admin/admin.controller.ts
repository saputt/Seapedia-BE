import { Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AdminService } from "./admin.service";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { AdminGuard } from "src/common/guards/admin.guard";

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

    @Post("simulation/overdue")
    @ApiOperation({ summary : "Run SLA overdue simulation (Admin)" })
    @ApiResponse({ status : 201, description : "Simulation completed" })
    async simulateOverdue() {
        const data = await this.adminService.simulateOverdue()
        return { message : "simulation success", data }
    }
}

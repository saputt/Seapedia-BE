import { Body, Controller, Post, UseGuards } from "@nestjs/common";
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

    @Post("simulate-overdue")
    @ApiOperation({ summary : "Simulate overdue orders (Admin)" })
    @ApiResponse({ status : 201, description : "Simulation completed" })
    @ApiResponse({ status : 401, description : "Unauthorized" })
    @ApiResponse({ status : 403, description : "Forbidden. Only admin can access" })
    async simulateOverdue(@Body() dto : SimulateOverdueDto) {
        await this.adminService.simulateOverdue(dto.dayToSkip)
        return {
            message : "simulate success",
            data : null
        }
    }
}
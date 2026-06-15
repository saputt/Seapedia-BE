import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { AdminGuard } from "src/common/guards/admin.guard";
import { SimulateOverdueDto } from "./dto/simulate-overdue.dto";

@Controller("admin")
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
    constructor(private adminService : AdminService) {}

    @Post("simulate-overdue")
    async simulateOverdue(@Body() dto : SimulateOverdueDto) {
        await this.adminService.simulateOverdue(dto.dayToSkip)
        return {
            message : "simulate success",
            data : null
        }
    }
}
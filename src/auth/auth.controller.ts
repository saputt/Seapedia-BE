import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { SwitchRoleDto } from "./dto/switch-role.dto";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { GetUser } from "src/common/decorators/get-user.decorator";
import { Throttle } from "@nestjs/throttler";

@Controller("auth")
export class AuthController {
    constructor(private authService : AuthService) {}

    @Throttle({ default : { ttl : 60000, limit : 5 } })
    @Post("login")
    async login(@Body() dto : LoginDto) {
        const loginResult = await this.authService.login(dto)
        return {
            message : "login successfull",
            data : loginResult
        }
    }

    @Post("register")
    async register(@Body() dto : RegisterDto) {
        const registerResult = await this.authService.register(dto)
        return {
            message : "register successfull",
            data : registerResult
        }
    }

    @Post("switch-role")
    @UseGuards(JwtAuthGuard)
    async switchRole(@Body() dto : SwitchRoleDto, @GetUser("email") email : string) {
        const switchRoleResult = await this.authService.switchRole(dto, email)
        return {
            message : `switch role to ${dto.role} successful`,
            data : switchRoleResult
        }
    }
}
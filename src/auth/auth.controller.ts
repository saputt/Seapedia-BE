import { Body, Controller, Headers, Post, UnauthorizedException, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { SwitchRoleDto } from "./dto/switch-role.dto";
import { AddRoleDto } from "./dto/add-role.dto";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { GetUser } from "src/common/decorators/get-user.decorator";
import { TokenBlacklistService } from "./token-blacklist.service";
import { JwtService } from "@nestjs/jwt";

@Controller("auth")
export class AuthController {
    constructor(
        private authService: AuthService,
        private tokenBlacklistService: TokenBlacklistService,
        private jwtService: JwtService,
    ) {}

    @Post("login")
    async login(@Body() dto : LoginDto) {
        const loginResult = await this.authService.login(dto)
        return {
            message : "login successfully",
            data : loginResult
        }
    }

    @Post("register")
    async register(@Body() dto : RegisterDto) {
        const registerResult = await this.authService.register(dto)
        return {
            message : "register successfully",
            data : registerResult
        }
    }

    @Post("logout")
    @UseGuards(JwtAuthGuard)
    async logout(@Headers("authorization") authHeader: string) {
        const token = this.tokenBlacklistService.extractTokenFromHeader(authHeader);
        if (!token) throw new UnauthorizedException("No token provided");

        const decoded = this.jwtService.decode(token) as { exp: number } | null;
        if (!decoded) throw new UnauthorizedException("Invalid token");

        const expiresAt = new Date(decoded.exp * 1000);
        await this.tokenBlacklistService.blacklistToken(token, expiresAt);
        return { message: "logout successful" };
    }

    @Post("roles")
    @UseGuards(JwtAuthGuard)
    async addRole(@Body() dto : AddRoleDto, @GetUser("email") email : string) {
        const addRoleResult = await this.authService.addRole(dto, email)
        return {
            message : addRoleResult.message,
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
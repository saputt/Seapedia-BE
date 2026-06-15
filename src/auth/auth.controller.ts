import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { SwitchRoleDto } from "./dto/switch-role.dto";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { GetUser } from "src/common/decorators/get-user.decorator";
import { Throttle } from "@nestjs/throttler";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
    constructor(private authService : AuthService) {}

    @Throttle({ default : { ttl : 60000, limit : 30 } })
    @Post("login")
    @ApiOperation({ summary : "Login with email and password" })
    @ApiResponse({ status : 201, description : "Login successful. Returns access token, active role, and available roles" })
    @ApiResponse({ status : 400, description : "Validation error (invalid email format)" })
    @ApiResponse({ status : 401, description : "Invalid credentials (email not found)" })
    @ApiResponse({ status : 403, description : "Wrong password" })
    @ApiResponse({ status : 429, description : "Too many requests (rate limit exceeded)" })
    async login(@Body() dto : LoginDto) {
        const loginResult = await this.authService.login(dto)
        return {
            message : "login successfull",
            data : loginResult
        }
    }

    @Post("register")
    @ApiOperation({ summary : "Register a new user account" })
    @ApiResponse({ status : 201, description : "User registered successfully. Returns user id, username, email, and roles" })
    @ApiResponse({ status : 400, description : "Validation error (invalid input)" })
    @ApiResponse({ status : 409, description : "Email already registered" })
    async register(@Body() dto : RegisterDto) {
        const registerResult = await this.authService.register(dto)
        return {
            message : "register successfull",
            data : registerResult
        }
    }

    @Post("switch-role")
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary : "Switch user active role and get new JWT token" })
    @ApiResponse({ status : 201, description : "Role switched successfully. Returns new access token and active role" })
    @ApiResponse({ status : 401, description : "Unauthorized (invalid/missing JWT token or role not assigned)" })
    async switchRole(@Body() dto : SwitchRoleDto, @GetUser("email") email : string) {
        const switchRoleResult = await this.authService.switchRole(dto, email)
        return {
            message : `switch role to ${dto.role} successful`,
            data : switchRoleResult
        }
    }
}
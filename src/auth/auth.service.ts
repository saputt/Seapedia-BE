import { ConflictException, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthRepository } from "./auth.repository";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { RoleName, User } from "@prisma/client";
import { JwtService } from "@nestjs/jwt";
import { SwitchRoleDto } from "./dto/switch-role.dto";
import { hashing } from "src/common/helpers/hash.helper";
import { ConfigService } from "@nestjs/config";

/**
 * Service untuk autentikasi pengguna.
 * Menangani login, registrasi, dan pergantian peran (role) pengguna.
 * Saat registrasi, pengguna otomatis mendapatkan peran BUYER, DRIVER, dan SELLER.
 * Token JWT dibuat dengan masa berlaku 7 hari.
 */
@Injectable()
export class AuthService {
    constructor(
        private authRepo : AuthRepository,
        private jwt : JwtService,
        private configService : ConfigService
    ) {}

    async findUserOrThrow(email : string) {
        const user = await this.authRepo.findUserByEmail(email)
        if (!user) throw new UnauthorizedException("Invalid credential")
        return user
    }

    async findUserById(userId : string) {
        const user = await this.authRepo.findUserById(userId)
        if (!user) throw new UnauthorizedException("Invalid credential")
        return user
    }

    async isEmailAlreadyExist(email : string) {
        const user = await this.authRepo.findUserByEmail(email)
        if (user) throw new ConflictException("email already exist")
        return false
    }

    async isCorrectPassword(password : string, hashPassword : string) {
        const isCorrect = await hashing.compare(password, hashPassword)
        if (!isCorrect) throw new ForbiddenException("invalid credential")
        return true
    }

    async signToken(payloadToken : {id : string, email : string, role : RoleName}) {
        return await this.jwt.signAsync(payloadToken, {
            secret : this.configService.get<string>("SECRET_JWT"),
            expiresIn : "7d"
        })
    }

    async login(loginDto : LoginDto) {
        const userExist = await this.findUserOrThrow(loginDto.email)
        const userRoles = userExist.roles.map(r => r.roleName)
        await this.isCorrectPassword(loginDto.password, userExist.password)
        const userPayload = {
            id : userExist.id,
            email : userExist.email,
            role : userExist.lastActiveRole
        }
        return {
            accessToken : await this.signToken(userPayload),
            activeRole : userExist.lastActiveRole,
            userRoles,
            username : userExist.username
        }
    }

    async register(registerDto : RegisterDto) {
        await this.isEmailAlreadyExist(registerDto.email)
        const hashedPassword = await hashing.hash(registerDto.password)
        const userPayload = {
            email : registerDto.email,
            username : registerDto.username,
            password : hashedPassword
        }
        return await this.authRepo.createUser(userPayload)
    }

    async switchRole(switchRoleDto : SwitchRoleDto, email : string) {
        const user = await this.findUserOrThrow(email)
        const hasRole = user.roles.some(r => r.roleName === switchRoleDto.role)
        
        if (!hasRole) throw new UnauthorizedException(`unauthorized role access`)
        
        await this.authRepo.updateLastActiveRole(user.id, switchRoleDto.role)

        const userPayload = {
            id : user.id,
            email : user.email,
            role : switchRoleDto.role
        }
        const newToken = await this.signToken(userPayload)
        return {
            accessToken : newToken,
            activeRole : switchRoleDto.role
        }
    }
}
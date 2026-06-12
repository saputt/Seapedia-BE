import { ConflictException, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthRepository } from "./auth.repository";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { RoleName, User } from "@prisma/client";
import { JwtService } from "@nestjs/jwt";
import { SwitchRoleDto } from "./dto/switch-role.dto";
import { hashing } from "src/common/helpers/hash.helper";

@Injectable()
export class AuthService {
    constructor(
        private authRepo : AuthRepository,
        private jwt : JwtService
    ) {}

    async findUserOrThrow(email : string) {
        const user = await this.authRepo.findUserByEmail(email)
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
            secret : process.env.SECRET_JWT,
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
            role : RoleName.BUYER
        }
        return {
            accessToken : await this.signToken(userPayload),
            activeRole : RoleName.BUYER,
            userRoles
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
        return {
            user : await this.authRepo.createUser(userPayload)
        }
    }

    async switchRole(switchRoleDto : SwitchRoleDto, email : string) {
        const user = await this.findUserOrThrow(email)
        const hasRole = user.roles.some(r => r.roleName === switchRoleDto.role)
        
        if (!hasRole) throw new UnauthorizedException(`unauthorized role access`)

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
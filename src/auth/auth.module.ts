import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PrismaModule } from "src/prisma/prisma.module";
import { AuthService } from "./auth.service";
import { AuthRepository } from "./auth.repository";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./strategy/jwt.strategy";

@Module({
    controllers : [AuthController],
    providers : [AuthService, AuthRepository, JwtStrategy],
    imports : [
        PrismaModule,
        JwtModule.register({
            secret : process.env.SECRET_JWT,
            signOptions : { expiresIn : "7d"}
        })
    ]
})
export class AuthModule {}
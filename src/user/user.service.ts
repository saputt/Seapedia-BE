import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { UserRepository } from "./user.repository";
import { hashing } from "src/common/helpers/hash.helper";

@Injectable()
export class UserService {
    constructor(private userRepo : UserRepository) {}

    async getProfile(userId : string) {
        const user = await this.userRepo.findById(userId)
        if (!user) throw new NotFoundException("User not found")
        const { password, ...profile } = user
        return profile
    }

    async updateProfile(userId : string, username : string) {
        const user = await this.userRepo.findById(userId)
        if (!user) throw new NotFoundException("User not found")
        return this.userRepo.updateUsername(userId, username)
    }

    async changePassword(userId : string, oldPassword : string, newPassword : string) {
        const user = await this.userRepo.findById(userId)
        if (!user) throw new NotFoundException("User not found")

        const isCorrect = await hashing.compare(oldPassword, user.password)
        if (!isCorrect) throw new UnauthorizedException("Current password is incorrect")

        const hashedPassword = await hashing.hash(newPassword)
        return this.userRepo.updatePassword(userId, hashedPassword)
    }
}

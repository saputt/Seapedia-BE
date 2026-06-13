import { CanActivate, ExecutionContext, ForbiddenException } from "@nestjs/common";

export class SellerGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest()
        const user = req.user
        if (user.role !== "SELLER") throw new ForbiddenException('Access denied. Seller only')
        return true
    }
}
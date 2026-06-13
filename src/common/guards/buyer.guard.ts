import { CanActivate, ExecutionContext, ForbiddenException } from "@nestjs/common";

export class BuyerGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest()
        const user = req.user
        if (user.role !== "BUYER") throw new ForbiddenException('Access denied. Buyer only')
        return true
    }
}
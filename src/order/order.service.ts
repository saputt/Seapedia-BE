import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { OrderRepository } from "./order.repository";
import { CheckoutDto } from "./dto/checkout.dto";
import { StoreService } from "src/store/store.service";
import { ProductService } from "src/product/product.service";
import { Discount, OrderStatus, RoleName } from "@prisma/client";
import { DiscountService } from "src/discount/discount.service";
import { AddressService } from "src/address/address.service";
import { WalletService } from "src/wallet/wallet.service";
import { OrderSummaryDto } from "./dto/order-summary.dto";
import { PrismaService } from "src/prisma/prisma.service";
import { CartService } from "src/cart/cart.service";
import { UpdateStatusOrderDto } from "./dto/update-status-order.dto";

const SHIPING_LIST = [
    {
        id : "REGULAR",
        price : 10000,
        name : "Regular",
        description : "regular mantap"
    },
    {
        id : "INSTANT",
        price : 15000,
        name : "Instant",
        description : "regular mantap"
    },
    {
        id : "NEXT_DAY",
        price : 20000,
        name : "Next Day",
        description : "regular mantap"
    },
]

@Injectable()
export class OrderService {
    constructor(
        private orderRepo : OrderRepository,
        private storeService : StoreService,
        private cartService : CartService,
        private discountService : DiscountService,
        private addressService : AddressService,
        private walletService : WalletService,
        private prisma : PrismaService,
        private productService : ProductService,
    ) {}

    async orderSummary(dto : OrderSummaryDto, userId : string) {
        const cart = await this.cartService.getUserCart(userId)
        if (cart.length == 0) throw new BadRequestException("cannot checkout an empty cart")
        
        const storeId = cart[0].product.storeId
        await this.storeService.findStoreOrThrow(storeId)
        const subtotal = cart.reduce((total, item) => {
            return total + (item.product.price * item.quantity)
        }, 0)

        let discountValue = 0
        let discount : Discount = null
        if (dto.discountCode) {
            discount = await this.discountService.isDiscountAvailable(dto.discountCode)
            if (discount.isPercent) {
                discountValue = subtotal * (discount.value / 100)
            } else {
                discountValue = discount.value
            }
        }
        let shippingMethod = "REGULAR"
        if (dto.shippingMethod) {
            shippingMethod = dto.shippingMethod
        }
        const shippingFee = SHIPING_LIST.find(s => s.id === shippingMethod)?.price ?? 0
        const taxFee = Math.round(subtotal * 0.12)
        const totalPrice = subtotal - discountValue + shippingFee + taxFee

        const orderData = {
            shippingMethods : SHIPING_LIST,
            shippingSelect : shippingMethod,
            products : cart.map((item) => ({
                productId : item.productId,
                name : item.product.name,
                price : item.product.price,
                quantity : item.quantity,
                totalItemPrice : item.product.price * item.quantity,
                imageUrl : item.product.imageUrl
            })),
            subtotal,
            discountValue,
            shippingFee,
            taxFee,
            totalPrice
        }

        return orderData
    }

    async checkout(dto : CheckoutDto, userId : string) {
        const cart = await this.cartService.getUserCart(userId)
        if (cart.length == 0) throw new BadRequestException("cannot checkout an empty cart")
        
        const storeId = cart[0].product.storeId
        await this.storeService.findStoreOrThrow(storeId)
        const address = await this.addressService.isAddressMine(dto.addressId, userId)
        const subtotal = cart.reduce((total, item) => {
            return total + (item.product.price * item.quantity)
        }, 0)
        
        let discountValue = 0
        let discount : Discount = null
        if (dto.discountCode) {
            discount = await this.discountService.isDiscountAvailable(dto.discountCode)
            if (discount.isPercent) {
                discountValue = subtotal * (discount.value / 100)
            } else {
                discountValue = discount.value
            }
        }
        const shippingFee = SHIPING_LIST.find(s => s.id === dto.shippingMethod)?.price ?? 0

        const taxFee = Math.round(subtotal * 0.12)
        const totalPrice = subtotal - discountValue + shippingFee + taxFee

        return await this.prisma.$transaction(async (tx) => {
            await this.walletService.verifyAndReduceBalance(tx, userId, totalPrice)

            for (const item of cart) {
                await this.productService.verifyAndReduceStock(tx, item.productId, item.quantity)
            }

            const orderData = {
                buyerId : userId,
                storeId,
                addressId : dto.addressId,
                discountId : discount?.id ?? null,
                shippingMethod : dto.shippingMethod,
                addressSnapshot : address.completeAddress,
                subtotal,
                discountValue,
                shippingFee,
                taxFee,
                totalPrice
            }
            
            const order = await this.orderRepo.createOrder(orderData, tx)

            const orderItemsData = cart.map((item) => {
                return {
                    orderId : order.id,
                    productId : item.productId,
                    quantity : item.quantity,
                    price : item.product.price
                }
            })

            await this.orderRepo.createOrderItems(orderItemsData, tx)

            await this.cartService.clearUserCart(userId, tx)

            return order
        })
    }

    async findOrderOrThrow(orderId : string) {
        const order = await this.orderRepo.findOrderById(orderId)
        if (!order) throw new NotFoundException(`order with id : ${orderId} not found`)
        return order
    }

    async updateStatusOrder(dto : UpdateStatusOrderDto, orderId : string, userId : string, userRole : RoleName) {
        const store = await this.storeService.findStoreOrThrow(dto.storeId)
        const order = await this.findOrderOrThrow(orderId)
        let statusUpdate : OrderStatus
        if(order.status === OrderStatus.PENDING) {
            if (userRole !== RoleName.SELLER || userId !== store.userId) throw new ForbiddenException("You cannot update status this order")
            if (dto.storeId !== order.storeId) throw new ForbiddenException("You cannot update status this order")
            statusUpdate = OrderStatus.READY_FOR_DELIVERY
        } else if(order.status === OrderStatus.READY_FOR_DELIVERY) {
            if (userRole !== RoleName.DRIVER) throw new ForbiddenException("Forbidden Access. You cannot update this store. Driver only")
            if (!order.driverJob) throw new BadRequestException("Bad request. Driver still empty")
            if (userId !== order.driverJob.driverId) throw new BadRequestException("Forbidden Access. Only driver in this order can update")
            statusUpdate = OrderStatus.ON_DELIVERY
        } else if(order.status === OrderStatus.ON_DELIVERY) {
            if (userRole !== RoleName.BUYER || userId!== order.buyerId) throw new ForbiddenException("Forbidden Access. You cannot update this store. Buyer only")
            statusUpdate = OrderStatus.DELIVERED
        } else {
            throw new BadRequestException("You cannot update status order anymore")
        }
        return this.orderRepo.updateOrderStatus(orderId, statusUpdate)
    }
}
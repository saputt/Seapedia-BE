import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { OrderRepository } from "./order.repository";
import { CheckoutDto } from "./dto/checkout.dto";
import { StoreService } from "src/store/store.service";
import { ProductService } from "src/product/product.service";
import { Discount, OrderStatus, Prisma, RoleName, ShippingMethod, WalletType } from "@prisma/client";
import { DiscountService } from "src/discount/discount.service";
import { AddressService } from "src/address/address.service";
import { WalletService } from "src/wallet/wallet.service";
import { OrderSummaryDto } from "./dto/order-summary.dto";
import { PrismaService } from "src/prisma/prisma.service";
import { CartService } from "src/cart/cart.service";
import { JwtService } from "@nestjs/jwt";
import { FilterOrderDto } from "./dto/filter-order.dto";
import { ConfigService } from "@nestjs/config";

/**
 * Service utama untuk mengelola pesanan (order).
 * Menangani seluruh alur pesanan dari ringkasan checkout hingga pengiriman.
 *
 * Fitur utama:
 * - Ringkasan order: menghitung subtotal, diskon, pajak (12%), dan ongkir
 * - Checkout: memproses pembayaran dari wallet, mengurangi stok, membuat pesanan
 * - Pembaruan status: PENDING → READY_FOR_DELIVERY → ON_DELIVERY → DELIVERED
 * - Pembatalan: mengembalikan stok dan saldo pembeli
 * - Manajemen pekerjaan driver: mengambil dan menyelesaikan pekerjaan pengiriman
 * - Filter pesanan untuk seller berdasarkan status
 *
 * Menggunakan token JWT sementara (5 menit) untuk mengamankan data ringkasan checkout
 * sebelum pembayaran diproses.
 */
export interface IShippingMethodItem {
  id: ShippingMethod;          
  price: number;
  name: string;
  description: string;
}

export interface IOrderProductItem {
  productId: string;
  name: string;
  price: number;       
  quantity: number;
  totalItemPrice: number;
  imageUrl: string | null;
}

export interface IOrderSummaryPayload {
  userId: string;
  storeId: string;
  discountId: string | null;
  shippingMethods: IShippingMethodItem[];
  shippingSelect: ShippingMethod;
  products: IOrderProductItem[];
  subtotal: number;
  discountValue: number;
  shippingFee: number;
  taxFee: number;
  totalPrice: number;
}

const SHIPING_LIST : IShippingMethodItem[] = [
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
        private jwtService : JwtService,
        private configService : ConfigService
    ) {}

    async createOrderToken(orderPayload : IOrderSummaryPayload) {
        return this.jwtService.sign(orderPayload, {
            secret : this.configService.get<string>("SECRET_ORDER"),
            expiresIn : "5m"
        })
    }

    async verifyOrderToken(orderToken : string) {
        return this.jwtService.verify(orderToken, {
            secret : this.configService.get<string>("SECRET_ORDER")
        })
    }

    async findOrderOrThrow(orderId : string, tx? : Prisma.TransactionClient) {
        const order = await this.orderRepo.findOrderById(orderId, tx)
        if (!order) throw new NotFoundException(`order with id : ${orderId} not found`)
        return order
    }

    async getOrderById(orderId : string, userId : string) {
        const order = await this.findOrderOrThrow(orderId)
        if (userId && order.buyerId !== userId) throw new ForbiddenException("Forbidden. you cannot see this order")
        return order
    }

    async getAllOrders(userId : string) {
        return this.orderRepo.findOrdersByUserId(userId)
    }

    async getAllOrdersForAdmin(page = 1, limit = 10) {
        return this.orderRepo.findAllOrdersForAdmin(page, limit)
    }

    async getOverdueOrders(orderStatus : OrderStatus, tresholdDate : Date, tx? : Prisma.TransactionClient) {
        return this.orderRepo.getOverdueOrders(orderStatus, tresholdDate, tx)
    }

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
                if (discount.value > 100) throw new BadRequestException("Discount percent cannot more than 100")
                discountValue = subtotal * (discount.value / 100)
            } else {
                discountValue = discount.value
            }
        }
        let shippingMethod : ShippingMethod = "REGULAR"
        if (dto.shippingMethod) {
            shippingMethod = dto.shippingMethod
        }
        const shippingFee = SHIPING_LIST.find(s => s.id === shippingMethod)?.price ?? 0
        const taxFee = Math.round(subtotal * 0.12)
        const totalPrice = subtotal - discountValue + shippingFee + taxFee

        const orderPayload : IOrderSummaryPayload = {
            userId,
            storeId,
            discountId : discount?.id ?? null,
            shippingMethods : SHIPING_LIST,
            shippingSelect : shippingMethod,
            products : cart.map((item) => ({
                productId : item.productId,
                name : item.product.name,
                price : item.product.price,
                quantity : item.quantity,
                totalItemPrice : item.product.price * item.quantity,
                imageUrl : item.product.imageUrl ?? null
            })),
            subtotal,
            discountValue,
            shippingFee,
            taxFee,
            totalPrice
        }

        const orderToken = await this.createOrderToken(orderPayload)

        return {
            order : orderPayload,
            orderToken 
        }
    }

    async checkout(dto : CheckoutDto, userId : string) {
        let orderPayload : IOrderSummaryPayload
        try {
            orderPayload = await this.verifyOrderToken(dto.orderToken)
        } catch (error) {
            throw new BadRequestException("Order token not valid or expired")
        }
        
        await this.storeService.findStoreOrThrow(orderPayload.storeId)

        if (orderPayload.userId !== userId) throw new ForbiddenException("Access denied. this is not your order")

        if (orderPayload.products.length <= 0) throw new BadRequestException("Order products cannot be empty")

        const address = await this.addressService.isAddressMine(dto.addressId, userId)

        if (orderPayload.discountId) {
            const discount = await this.discountService.findDiscountOrThrow(orderPayload.discountId)
            await this.discountService.isDiscountAvailable(discount.code)
        }

        return await this.prisma.$transaction(async (tx) => {
            await this.walletService.verifyAndReduceBalance(tx, userId, orderPayload.totalPrice, WalletType.PAYMENT)

            for (const item of orderPayload.products) {
                await this.productService.verifyAndReduceStock(tx, item.productId, item.quantity)
            }

            const orderData = {
                buyerId : userId,
                storeId : orderPayload.storeId,
                addressId : dto.addressId,
                discountId : orderPayload.discountId ?? null,
                shippingMethod : orderPayload.shippingSelect,
                addressSnapshot : address.completeAddress,
                subtotal : orderPayload.subtotal,
                discountValue : orderPayload.discountValue ?? 0,
                shippingFee : orderPayload.shippingFee,
                taxFee : orderPayload.taxFee,
                totalPrice : orderPayload.totalPrice
            }
            
            const order = await this.orderRepo.createOrder(orderData, tx)

            const orderItemsData = orderPayload.products.map((item) => {
                return {
                    orderId : order.id,
                    productId : item.productId,
                    quantity : item.quantity,
                    price : item.price
                }
            })

            await this.orderRepo.createOrderItems(orderItemsData, tx)

            if (orderPayload.discountId) {
                await this.discountService.updateDiscountUsedCount(tx, orderPayload.discountId)
            }

            await this.orderRepo.createOrderStatusLog(order.id, OrderStatus.PENDING, tx)

            await this.cartService.clearUserCart(userId, tx)

            await this.addressService.markAsLastUsed(dto.addressId, userId, tx)

            return order
        })
    }

    async updateStatusOrder(storeId : string, orderId : string, userId : string, userRole : RoleName, tx? : Prisma.TransactionClient) {
        const store = await this.storeService.findStoreOrThrow(storeId, tx)
        const order = await this.findOrderOrThrow(orderId, tx)

        const execute = async (tx : Prisma.TransactionClient) => {
            let statusUpdate : OrderStatus
            if(order.status === OrderStatus.PENDING) {
                if (userRole !== RoleName.SELLER || userId !== store.userId) throw new ForbiddenException("You cannot update status this order")
                if (storeId !== order.storeId) throw new ForbiddenException("You cannot update status this order")
                statusUpdate = OrderStatus.READY_FOR_DELIVERY
            } else if(order.status === OrderStatus.READY_FOR_DELIVERY) {
                if (userRole !== RoleName.DRIVER) throw new ForbiddenException("Forbidden Access. You cannot update this store. Driver only")
                if (!order.driverJob) throw new BadRequestException("Bad request. Driver still empty")
                if (userId !== order.driverJob.driverId) throw new BadRequestException("Forbidden Access. Only driver in this order can update")
                statusUpdate = OrderStatus.ON_DELIVERY
            } else if(order.status === OrderStatus.ON_DELIVERY) {
                if (userRole !== RoleName.BUYER || userId!== order.buyerId) throw new ForbiddenException("Forbidden Access. You cannot update this store. Buyer only")
                statusUpdate = OrderStatus.DELIVERED
                
                const driverEarning = order.shippingFee

                await this.walletService.increaseBalance(driverEarning, order.driverJob.driverId, WalletType.DRIVER_EARNING, tx)

                const sellerEarning = order.subtotal - order.discountValue
                
                await this.walletService.increaseBalance(sellerEarning, store.userId, WalletType.SELLER_EARNING, tx)
            } else {
                throw new BadRequestException("You cannot update status order anymore")
            }
            await this.orderRepo.createOrderStatusLog(order.id, statusUpdate, tx)
            return this.orderRepo.updateOrderStatus(orderId, statusUpdate, tx)
        }

        if (tx) return execute(tx)

        return await this.prisma.$transaction(execute)
    }

    async cancelOrder(userId : string, orderId : string) {
        const order = await this.findOrderOrThrow(orderId)
        if (order.buyerId !== userId) throw new ForbiddenException("Forbidden. you cannot see this order")
        if (order.status !== OrderStatus.PENDING) throw new BadRequestException("Bad Request. You cannot cancel this order anymore")
        return this.prisma.$transaction(async (tx) => {
            for (const item of order.orderItems) {
                await this.productService.verifyAndRollbackStock(tx, item.productId, item.quantity)
            }

            const totalMoneyBack = order.totalPrice

            await this.walletService.verifyAndRollbackBalance(tx, userId, totalMoneyBack, WalletType.REFUND)  
            
            const orderUpdated = await this.orderRepo.updateOrderStatus(orderId, OrderStatus.CANCELLED, tx)

            await this.orderRepo.createOrderStatusLog(orderId, OrderStatus.CANCELLED, tx)

            return orderUpdated
        })
    }

    async createOrderStatusLog(orderId : string, orderStatus : OrderStatus, tx? : Prisma.TransactionClient) {
        return this.orderRepo.createOrderStatusLog(orderId, orderStatus, tx)
    }

    async isJobOrderAvailable(orderId : string) {
        const jobOrder = await this.orderRepo.findJobAvailable(orderId)
        if (!jobOrder) throw new BadRequestException("Job is cannot be take")
        return jobOrder
    }

    async getMyJobs(driverId : string) {
        return this.orderRepo.findOrdersByDriverId(driverId)
    }

    async getAvailableJobs() {
        return this.orderRepo.findAvailableJobs()
    }

    async takeJob(orderId : string, driverId : string, userRole : RoleName) {
        const order = await this.isJobOrderAvailable(orderId)
        const jobData = {
            earning : order.shippingFee,
            takenAt : new Date()
        }
        return await this.prisma.$transaction(async (tx) => {
            const job = await this.orderRepo.createDriverJob(jobData, driverId, orderId, tx)
            await this.updateStatusOrder(order.storeId, orderId, driverId, userRole, tx)
            return job
        })
    }

    async deliveryDone(orderId : string, driverId : string) {
        const order = await this.findOrderOrThrow(orderId)
        if (order.status !== OrderStatus.ON_DELIVERY) throw new BadRequestException("Order is not in delivery")
        if (!order.driverJob || order.driverJob.driverId !== driverId) throw new ForbiddenException("You are not the driver for this order")
        return this.orderRepo.setDriverJobDone(orderId)
    }

    async cancelOrderOverdue(orderId : string, tx? : Prisma.TransactionClient, overdue? : Date) {
        return this.orderRepo.updateOrderStatus(orderId, OrderStatus.CANCELLED, tx, overdue)
    }

    async getOrdersForSeller(userId : string, filter : FilterOrderDto) {
        const { orderBy, status } = filter
        
        const store = await this.storeService.findUserStore(userId)

        const whereOptions : any = {}

        if (status) {
            whereOptions.status = status
        }

        return this.orderRepo.getOrdersSeller(store.id, whereOptions, orderBy)
    }
}
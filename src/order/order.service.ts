import { BadRequestException, Injectable } from "@nestjs/common";
import { OrderRepository } from "./order.repository";
import { CheckoutDto } from "./dto/checkout.dto";
import { StoreService } from "src/store/store.service";
import { ProductService } from "src/product/product.service";
import { CartRepository } from "src/cart/cart.repository";
import { Discount, ShippingMethod } from "@prisma/client";
import { DiscountService } from "src/discount/discount.service";
import { AddressService } from "src/address/address.service";
import { WalletRepository } from "src/wallet/wallet.repository";

@Injectable()
export class OrderService {
    constructor(
        private orderRepo : OrderRepository,
        private storeService : StoreService,
        private cartRepo : CartRepository,
        private discountService : DiscountService,
        private addressService : AddressService,
        private walletRepo : WalletRepository
    ) {}


    async checkout(dto : CheckoutDto, userId : string) {
        const SHIPPING_PRICES = {
            REGULAR: 10000,
            INSTANT: 15000,
            NEXT_DAY: 20000
        };
        const cart = await this.cartRepo.findUserCartItems(userId)
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
            discount = await this.discountService.isDiscountStillAvailable(dto.discountCode)
            if (discount.isPercent) {
                discountValue = subtotal * (discount.value / 100)
            } else {
                discountValue = discount.value
            }
        }
        const shippingFee = SHIPPING_PRICES[dto.shippingMethod]
        const taxFee = Math.round(subtotal * 0.12)
        const totalPrice = subtotal - discountValue + shippingFee + taxFee
        const orderData = {
            buyerId : userId,
            storeId,
            addressId : dto.addressId,
            discountId : discount.id ? discount.id : null,
            shippingMethod : dto.shippingMethod,
            addressSnapshot : address.completeAddress,
            subtotal,
            discountValue,
            shippingFee,
            taxFee,
            totalPrice
        }

        const order = await this.orderRepo.createOrder(orderData)
        const orderItemsData = cart.map((item) => {
            return{
                orderId : order.id,
                productId : item.productId,
                quantity : item.quantity,
                price : item.product.price
            }
        })
        return await this.orderRepo.createOrderItems(orderItemsData)
    }
}
import { ShippingMethod } from '@prisma/client';

/**
 * Interface untuk metode pengiriman.
 */
export interface IShippingMethodItem {
  id: ShippingMethod;
  price: number;
  name: string;
  description: string;
}

/**
 * Interface untuk item produk dalam order.
 */
export interface IOrderProductItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  totalItemPrice: number;
  imageUrl: string | null;
}

/**
 * Interface untuk payload ringkasan order.
 */
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

/**
 * Daftar metode pengiriman yang tersedia.
 */
export const SHIPPING_LIST: IShippingMethodItem[] = [
  {
    id: 'REGULAR',
    price: 10000,
    name: 'Regular',
    description: 'Pengiriman reguler dalam 3 hari',
  },
  {
    id: 'INSTANT',
    price: 15000,
    name: 'Instant',
    description: 'Pengiriman instan dalam 1 hari',
  },
  {
    id: 'NEXT_DAY',
    price: 20000,
    name: 'Next Day',
    description: 'Pengiriman keesokan hari',
  },
];

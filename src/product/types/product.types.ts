import { Product, Store } from '@prisma/client';

/**
 * Tipe produk dengan statistik review.
 * Digunakan untuk response produk yang dilengkapi dengan rating dan jumlah review.
 */
export interface ProductWithStats extends Product {
  store: Pick<Store, 'id' | 'storeName' | 'imageUrl' | 'address'> & {
    products?: { id: string }[];
  };
  reviewCount: number;
  averageRating: number;
  soldCount: number;
}

/**
 * Tipe produk dasar dari database.
 */
export type ProductBasic = Product & {
  store: Pick<Store, 'id' | 'storeName' | 'imageUrl' | 'address'> & {
    products?: { id: string }[];
  };
};

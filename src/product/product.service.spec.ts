import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from './product.service';
import { ProductRepository } from './product.repository';
import { StoreService } from 'src/store/store.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

describe('ProductService', () => {
  let service: ProductService;
  let productRepo: {
    findProductById: jest.Mock;
    createProduct: jest.Mock;
    updateProductById: jest.Mock;
    deleteProductById: jest.Mock;
    findAllProducts: jest.Mock;
    countProducts: jest.Mock;
    reduceStockAtomically: jest.Mock;
    increaseStock: jest.Mock;
  };
  let storeService: { findStoreOrThrow: jest.Mock; findUserStore: jest.Mock };
  let prisma: {
    productReview: { groupBy: jest.Mock; aggregate: jest.Mock };
    orderItem: { groupBy: jest.Mock; aggregate: jest.Mock };
  };

  beforeEach(async () => {
    productRepo = {
      findProductById: jest.fn(),
      createProduct: jest.fn(),
      updateProductById: jest.fn(),
      deleteProductById: jest.fn(),
      findAllProducts: jest.fn(),
      countProducts: jest.fn(),
      reduceStockAtomically: jest.fn(),
      increaseStock: jest.fn(),
    };
    storeService = { findStoreOrThrow: jest.fn(), findUserStore: jest.fn() };
    prisma = {
      productReview: { groupBy: jest.fn().mockResolvedValue([]), aggregate: jest.fn().mockResolvedValue({ _count: { id: 0 }, _avg: { rating: null } }) },
      orderItem: { groupBy: jest.fn().mockResolvedValue([]), aggregate: jest.fn().mockResolvedValue({ _sum: { quantity: null } }) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        { provide: ProductRepository, useValue: productRepo },
        { provide: StoreService, useValue: storeService },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(ProductService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findProductOrThrow', () => {
    it('should return product when found', async () => {
      productRepo.findProductById.mockResolvedValue({ id: 'p1', name: 'Product' });
      const result = await service.findProductOrThrow('p1');
      expect(result.name).toBe('Product');
    });

    it('should throw NotFoundException when not found', async () => {
      productRepo.findProductById.mockResolvedValue(null);
      await expect(service.findProductOrThrow('p1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createProduct', () => {
    it('should create product', async () => {
      storeService.findStoreOrThrow.mockResolvedValue({ id: 's1' });
      productRepo.createProduct.mockResolvedValue({ id: 'p1', name: 'Product' });

      const result = await service.createProduct({ name: 'Product', price: 10000, stock: 10, description: 'Desc', imageUrl: 'url', category: 'ELECTRONICS' } as any, 's1');
      expect(result.product.name).toBe('Product');
    });
  });

  describe('updateProduct', () => {
    it('should update product after ownership check', async () => {
      productRepo.findProductById.mockResolvedValue({ id: 'p1', storeId: 's1' });
      storeService.findStoreOrThrow.mockResolvedValue({ id: 's1', userId: 'u1' });
      productRepo.updateProductById.mockResolvedValue({ id: 'p1', name: 'New' });

      const result = await service.updateProduct({ name: 'New' } as any, 'p1', 'u1');
      expect(result.name).toBe('New');
    });

    it('should throw ForbiddenException when not owner', async () => {
      productRepo.findProductById.mockResolvedValue({ id: 'p1', storeId: 's1' });
      storeService.findStoreOrThrow.mockResolvedValue({ id: 's1', userId: 'u2' });

      await expect(service.updateProduct({ name: 'New' } as any, 'p1', 'u1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteProduct', () => {
    it('should delete product after ownership check', async () => {
      productRepo.findProductById.mockResolvedValue({ id: 'p1', storeId: 's1' });
      storeService.findStoreOrThrow.mockResolvedValue({ id: 's1', userId: 'u1' });
      productRepo.deleteProductById.mockResolvedValue({});

      await service.deleteProduct('p1', 'u1');
      expect(productRepo.deleteProductById).toHaveBeenCalledWith('p1');
    });
  });

  describe('getProduct', () => {
    it('should return product with review stats', async () => {
      productRepo.findProductById.mockResolvedValue({ id: 'p1', name: 'Product' });
      prisma.productReview.aggregate.mockResolvedValue({ _count: { id: 3 }, _avg: { rating: 4.5 } });
      prisma.orderItem.aggregate.mockResolvedValue({ _sum: { quantity: 10 } });

      const result = await service.getProduct('p1');
      expect(result.reviewCount).toBe(3);
      expect(result.averageRating).toBe(4.5);
      expect(result.soldCount).toBe(10);
    });
  });

  describe('getAllProducts', () => {
    it('should return paginated products', async () => {
      productRepo.findAllProducts.mockResolvedValue([{ id: 'p1', storeId: 's1' }]);
      productRepo.countProducts.mockResolvedValue(1);
      prisma.productReview.groupBy.mockResolvedValue([]);
      prisma.orderItem.groupBy.mockResolvedValue([]);

      const result = await service.getAllProducts({ page: 1, limit: 10, sortBy: 'newest' } as any);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });
  });

  describe('verifyAndReduceStock', () => {
    it('should reduce stock atomically', async () => {
      productRepo.reduceStockAtomically.mockResolvedValue({ count: 1 });
      await service.verifyAndReduceStock({} as any, 'p1', 2);
      expect(productRepo.reduceStockAtomically).toHaveBeenCalled();
    });

    it('should throw when out of stock', async () => {
      productRepo.reduceStockAtomically.mockResolvedValue({ count: 0 });
      await expect(service.verifyAndReduceStock({} as any, 'p1', 2)).rejects.toThrow(BadRequestException);
    });
  });
});

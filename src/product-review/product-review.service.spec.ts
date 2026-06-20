import { Test, TestingModule } from '@nestjs/testing';
import { ProductReviewService } from './product-review.service';
import { ProductReviewRepository } from './product-review.repository';
import { ProductService } from 'src/product/product.service';
import { OrderService } from 'src/order/order.service';
import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

describe('ProductReviewService', () => {
  let service: ProductReviewService;
  let reviewRepo: {
    findReviewByOrderAndProduct: jest.Mock;
    createReview: jest.Mock;
    findReviewsByProduct: jest.Mock;
  };
  let productService: { findProductOrThrow: jest.Mock };
  let orderService: { findOrderOrThrow: jest.Mock };

  beforeEach(async () => {
    reviewRepo = {
      findReviewByOrderAndProduct: jest.fn(),
      createReview: jest.fn(),
      findReviewsByProduct: jest.fn(),
    };
    productService = { findProductOrThrow: jest.fn() };
    orderService = { findOrderOrThrow: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductReviewService,
        { provide: ProductReviewRepository, useValue: reviewRepo },
        { provide: ProductService, useValue: productService },
        { provide: OrderService, useValue: orderService },
      ],
    }).compile();

    service = module.get(ProductReviewService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('createReview', () => {
    it('should create review for delivered order', async () => {
      productService.findProductOrThrow.mockResolvedValue({ id: 'p1' });
      orderService.findOrderOrThrow.mockResolvedValue({
        id: 'o1', buyerId: 'u1', status: OrderStatus.DELIVERED,
        orderItems: [{ productId: 'p1' }],
      });
      reviewRepo.findReviewByOrderAndProduct.mockResolvedValue(null);
      reviewRepo.createReview.mockResolvedValue({ id: 'r1', rating: 5 });

      const result = await service.createReview('p1', 'u1', { orderId: 'o1', rating: 5, comment: 'Great' } as any);
      expect(result.rating).toBe(5);
    });

    it('should throw when order not belong to buyer', async () => {
      productService.findProductOrThrow.mockResolvedValue({ id: 'p1' });
      orderService.findOrderOrThrow.mockResolvedValue({
        id: 'o1', buyerId: 'u2', status: OrderStatus.DELIVERED,
        orderItems: [{ productId: 'p1' }],
      });

      await expect(
        service.createReview('p1', 'u1', { orderId: 'o1', rating: 5, comment: 'Great' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when order not delivered', async () => {
      productService.findProductOrThrow.mockResolvedValue({ id: 'p1' });
      orderService.findOrderOrThrow.mockResolvedValue({
        id: 'o1', buyerId: 'u1', status: OrderStatus.PENDING,
        orderItems: [{ productId: 'p1' }],
      });

      await expect(
        service.createReview('p1', 'u1', { orderId: 'o1', rating: 5, comment: 'Great' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when product not in order', async () => {
      productService.findProductOrThrow.mockResolvedValue({ id: 'p1' });
      orderService.findOrderOrThrow.mockResolvedValue({
        id: 'o1', buyerId: 'u1', status: OrderStatus.DELIVERED,
        orderItems: [{ productId: 'p2' }],
      });

      await expect(
        service.createReview('p1', 'u1', { orderId: 'o1', rating: 5, comment: 'Great' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when already reviewed', async () => {
      productService.findProductOrThrow.mockResolvedValue({ id: 'p1' });
      orderService.findOrderOrThrow.mockResolvedValue({
        id: 'o1', buyerId: 'u1', status: OrderStatus.DELIVERED,
        orderItems: [{ productId: 'p1' }],
      });
      reviewRepo.findReviewByOrderAndProduct.mockResolvedValue({ id: 'r1' });

      await expect(
        service.createReview('p1', 'u1', { orderId: 'o1', rating: 5, comment: 'Great' } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getProductReviews', () => {
    it('should return reviews for product', async () => {
      productService.findProductOrThrow.mockResolvedValue({ id: 'p1' });
      reviewRepo.findReviewsByProduct.mockResolvedValue([{ id: 'r1' }]);

      const result = await service.getProductReviews('p1');
      expect(result.total).toBe(1);
    });
  });
});

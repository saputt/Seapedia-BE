import { Test, TestingModule } from '@nestjs/testing';
import { ProductReviewController } from './product-review.controller';
import { ProductReviewService } from './product-review.service';

describe('ProductReviewController', () => {
  let controller: ProductReviewController;
  let service: { createReview: jest.Mock; getProductReviews: jest.Mock };

  beforeEach(async () => {
    service = { createReview: jest.fn(), getProductReviews: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductReviewController],
      providers: [{ provide: ProductReviewService, useValue: service }],
    }).compile();

    controller = module.get(ProductReviewController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('createReview', () => {
    it('should create product review', async () => {
      service.createReview.mockResolvedValue({ id: 'r1', rating: 5 });
      const result = await controller.createReview('p1', 'u1', {
        orderId: 'o1',
        rating: 5,
        comment: 'Great',
      });
      expect(result.message).toContain('created');
    });
  });

  describe('getReviews', () => {
    it('should return product reviews', async () => {
      service.getProductReviews.mockResolvedValue({ reviews: [], total: 0 });
      const result = await controller.getReviews('p1');
      expect(result.data.total).toBe(0);
    });
  });
});

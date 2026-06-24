import { Test, TestingModule } from '@nestjs/testing';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';

describe('ReviewController', () => {
  let controller: ReviewController;
  let service: { createReview: jest.Mock; getAllReviews: jest.Mock };

  beforeEach(async () => {
    service = { createReview: jest.fn(), getAllReviews: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewController],
      providers: [{ provide: ReviewService, useValue: service }],
    }).compile();

    controller = module.get(ReviewController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('createReview', () => {
    it('should create review', async () => {
      service.createReview.mockResolvedValue({ id: 'r1' });
      const result = await controller.createReview({
        rating: 5,
        name: 'User',
        comment: 'Great',
      } as any);
      expect(result.message).toContain('successful');
    });
  });

  describe('getAllReviews', () => {
    it('should return all reviews', async () => {
      service.getAllReviews.mockResolvedValue({ reviews: [], total: 0 });
      const result = await controller.getAllReviews();
      expect(result.data.total).toBe(0);
    });
  });
});

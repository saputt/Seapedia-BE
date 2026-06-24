import { Test, TestingModule } from '@nestjs/testing';
import { ReviewService } from './review.service';
import { ReviewRepository } from './review.repository';

describe('ReviewService', () => {
  let service: ReviewService;
  let repo: { createReview: jest.Mock; findAllReview: jest.Mock };

  beforeEach(async () => {
    repo = { createReview: jest.fn(), findAllReview: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ReviewService, { provide: ReviewRepository, useValue: repo }],
    }).compile();

    service = module.get(ReviewService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('createReview', () => {
    it('should create review', async () => {
      repo.createReview.mockResolvedValue({ id: 'r1', rating: 5 });
      const result = await service.createReview({
        rating: 5,
        name: 'User',
        comment: 'Great',
      } as any);
      expect(result.rating).toBe(5);
    });
  });

  describe('getAllReviews', () => {
    it('should return reviews with total', async () => {
      repo.findAllReview.mockResolvedValue([{ id: 'r1' }, { id: 'r2' }]);
      const result = await service.getAllReviews();
      expect(result.total).toBe(2);
    });
  });
});

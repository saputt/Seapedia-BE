import { Test, TestingModule } from '@nestjs/testing';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';

describe('ProductController', () => {
  let controller: ProductController;
  let service: {
    createProduct: jest.Mock;
    updateProduct: jest.Mock;
    deleteProduct: jest.Mock;
    getProduct: jest.Mock;
    getAllProducts: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      createProduct: jest.fn(),
      updateProduct: jest.fn(),
      deleteProduct: jest.fn(),
      getProduct: jest.fn(),
      getAllProducts: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [{ provide: ProductService, useValue: service }],
    }).compile();

    controller = module.get(ProductController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('createProduct', () => {
    it('should create product', async () => {
      service.createProduct.mockResolvedValue({
        product: { id: 'p1', name: 'Product' },
      });
      const result = await controller.createProduct(
        { storeId: 's1' } as any,
        { name: 'Product' } as any,
      );
      expect(result.data.product.name).toBe('Product');
    });
  });

  describe('getProduct', () => {
    it('should return product', async () => {
      service.getProduct.mockResolvedValue({ id: 'p1', name: 'Product' });
      const result = await controller.getProduct('p1');
      expect(result.data.name).toBe('Product');
    });
  });

  describe('getAllProducts', () => {
    it('should return products', async () => {
      service.getAllProducts.mockResolvedValue({
        products: [],
        total: 0,
        page: 1,
        totalPages: 0,
      });
      const result = await controller.getAllProducts({
        page: 1,
        limit: 10,
      } as any);
      expect(result.data.total).toBe(0);
    });
  });

  describe('updateProduct', () => {
    it('should update product', async () => {
      service.updateProduct.mockResolvedValue({ id: 'p1', name: 'New' });
      const result = await controller.updateProduct(
        'p1',
        { name: 'New' },
        'u1',
      );
      expect(result.data.name).toBe('New');
    });
  });

  describe('deleteProduct', () => {
    it('should delete product', async () => {
      service.deleteProduct.mockResolvedValue({ name: 'Product' });
      const result = await controller.deleteProduct('p1', 'u1');
      expect(result.message).toContain('success');
    });
  });
});

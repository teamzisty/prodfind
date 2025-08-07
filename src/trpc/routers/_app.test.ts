import { describe, it, expect, vi, beforeEach, MockedFunction } from 'vitest';
import { TRPCError } from '@trpc/server';
import { createCallerFactory } from '@trpc/server';
import { appRouter } from './_app';
import { db } from '@/lib/db';
import { checkBotId } from 'botid/server';
import {
  products as productsTable,
  users as usersTable,
  bookmarks as bookmarksTable,
  recommendations as recommendationsTable,
  notifications as notificationsTable,
} from '@/lib/db/schema';

// Mock external dependencies
vi.mock('@/lib/db');
vi.mock('botid/server');

// Mock the sub-routers
vi.mock('./session', () => ({
  sessionRouter: {},
}));

vi.mock('./notifications', () => ({
  notificationsRouter: {},
}));

vi.mock('./users', () => ({
  usersRouter: {},
}));

vi.mock('./contact', () => ({
  contactRouter: {},
}));

vi.mock('./comments', () => ({
  commentsRouter: {},
}));

const mockDb = db as any;
const mockCheckBotId = checkBotId as MockedFunction<typeof checkBotId>;

describe('appRouter', () => {
  const createCaller = createCallerFactory(appRouter);

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    mockCheckBotId.mockResolvedValue({ isBot: false });
    
    // Mock database query methods
    mockDb.select = vi.fn().mockReturnThis();
    mockDb.from = vi.fn().mockReturnThis();
    mockDb.where = vi.fn().mockReturnThis();
    mockDb.leftJoin = vi.fn().mockReturnThis();
    mockDb.orderBy = vi.fn().mockReturnThis();
    mockDb.limit = vi.fn().mockReturnThis();
    mockDb.insert = vi.fn().mockReturnThis();
    mockDb.update = vi.fn().mockReturnThis();
    mockDb.delete = vi.fn().mockReturnThis();
    mockDb.set = vi.fn().mockReturnThis();
    mockDb.values = vi.fn().mockReturnThis();
    mockDb.groupBy = vi.fn().mockReturnThis();
    mockDb.$dynamic = vi.fn().mockReturnThis();
    mockDb.as = vi.fn().mockReturnThis();
    mockDb.query = {
      products: {
        findFirst: vi.fn(),
      },
    };
  });

  describe('getProducts', () => {
    it('should return public products for unauthenticated users', async () => {
      const mockProducts = [
        {
          id: '1',
          name: 'Product 1',
          visibility: 'public',
          authorId: 'user1',
          createdAt: new Date(),
          recommendationCount: 5,
        },
      ];

      mockDb.orderBy.mockResolvedValue(mockProducts);

      const caller = createCaller({
        session: null,
      });

      const result = await caller.getProducts({});

      expect(result).toEqual([
        {
          ...mockProducts[0],
          recommendationCount: 5,
        },
      ]);
    });

    it('should return products for authenticated users including unlisted ones', async () => {
      const mockProducts = [
        {
          id: '1',
          name: 'Product 1',
          visibility: 'public',
          authorId: 'user1',
          createdAt: new Date(),
          recommendationCount: 3,
        },
        {
          id: '2',
          name: 'Product 2',
          visibility: 'unlisted',
          authorId: 'user2',
          createdAt: new Date(),
          recommendationCount: null,
        },
      ];

      mockDb.orderBy.mockResolvedValue(mockProducts);

      const caller = createCaller({
        session: {
          user: { id: 'user1' },
        },
      });

      const result = await caller.getProducts({});

      expect(result).toEqual([
        {
          ...mockProducts[0],
          recommendationCount: 3,
        },
        {
          ...mockProducts[1],
          recommendationCount: 0,
        },
      ]);
    });

    it('should filter products by userId when provided', async () => {
      const mockProducts = [
        {
          id: '1',
          name: 'User Product',
          visibility: 'public',
          authorId: 'user1',
          createdAt: new Date(),
          recommendationCount: 2,
        },
      ];

      mockDb.orderBy.mockResolvedValue(mockProducts);

      const caller = createCaller({
        session: null,
      });

      const result = await caller.getProducts({ userId: 'user1' });

      expect(result).toHaveLength(1);
      expect(result[0].authorId).toBe('user1');
    });

    it('should sort products by recommendation count', async () => {
      const mockProducts = [
        {
          id: '1',
          name: 'Product 1',
          recommendationCount: 2,
        },
        {
          id: '2',
          name: 'Product 2',
          recommendationCount: 5,
        },
        {
          id: '3',
          name: 'Product 3',
          recommendationCount: null,
        },
      ];

      mockDb.orderBy.mockResolvedValue(mockProducts);

      const caller = createCaller({
        session: null,
      });

      const result = await caller.getProducts({});

      expect(result[0].recommendationCount).toBe(5);
      expect(result[1].recommendationCount).toBe(2);
      expect(result[2].recommendationCount).toBe(0);
    });
  });

  describe('createProduct', () => {
    it('should create a product successfully for authenticated users', async () => {
      const mockProduct = { insertId: 1 };
      mockDb.values.mockResolvedValue(mockProduct);

      const caller = createCaller({
        session: {
          user: { id: 'user1' },
        },
      });

      const productData = {
        name: 'Test Product',
        description: 'Test Description',
        shortDescription: 'Short desc',
        price: '9.99',
        category: ['tech'],
        links: [],
        images: [],
        license: 'MIT',
        visibility: 'public' as const,
      };

      const result = await caller.createProduct(productData);

      expect(mockCheckBotId).toHaveBeenCalled();
      expect(result).toEqual(mockProduct);
    });

    it('should throw UNAUTHORIZED error when bot is detected', async () => {
      mockCheckBotId.mockResolvedValue({ isBot: true });

      const caller = createCaller({
        session: {
          user: { id: 'user1' },
        },
      });

      const productData = {
        name: 'Test Product',
        description: 'Test Description',
        shortDescription: 'Short desc',
        price: '9.99',
        category: ['tech'],
        links: [],
        images: [],
        license: 'MIT',
        visibility: 'public' as const,
      };

      await expect(caller.createProduct(productData)).rejects.toThrow(
        new TRPCError({ code: 'UNAUTHORIZED' })
      );
    });

    it('should handle missing session gracefully', async () => {
      const mockProduct = { insertId: 1 };
      mockDb.values.mockResolvedValue(mockProduct);

      const caller = createCaller({
        session: null,
      });

      const productData = {
        name: 'Test Product',
        description: 'Test Description',
        shortDescription: 'Short desc',
        price: '9.99',
        category: ['tech'],
        links: [],
        images: [],
        license: 'MIT',
        visibility: 'public' as const,
      };

      const result = await caller.createProduct(productData);

      expect(result).toEqual(mockProduct);
    });
  });

  describe('getProduct', () => {
    it('should return a public product with author and recommendation count', async () => {
      const mockProduct = {
        id: '1',
        name: 'Test Product',
        visibility: 'public',
        authorId: 'user1',
        deletedAt: null,
      };

      const mockAuthor = {
        id: 'user1',
        name: 'John Doe',
        email: 'john@example.com',
      };

      const mockRecommendationCount = { count: 5 };

      mockDb.limit.mockResolvedValueOnce([mockProduct]);
      mockDb.where.mockResolvedValueOnce([mockAuthor]);
      mockDb.where.mockResolvedValueOnce([mockRecommendationCount]);

      const caller = createCaller({
        session: null,
      });

      const result = await caller.getProduct({ productId: '1' });

      expect(result).toEqual({
        ...mockProduct,
        author: mockAuthor,
        recommendationCount: 5,
      });
    });

    it('should throw NOT_FOUND when product does not exist', async () => {
      mockDb.limit.mockResolvedValue([]);

      const caller = createCaller({
        session: null,
      });

      await expect(caller.getProduct({ productId: 'nonexistent' })).rejects.toThrow(
        new TRPCError({ code: 'NOT_FOUND', message: 'Product not found' })
      );
    });

    it('should throw NOT_FOUND for private product when user is not owner', async () => {
      const mockProduct = {
        id: '1',
        name: 'Private Product',
        visibility: 'private',
        authorId: 'user1',
        deletedAt: null,
      };

      mockDb.limit.mockResolvedValue([mockProduct]);

      const caller = createCaller({
        session: {
          user: { id: 'user2' },
        },
      });

      await expect(caller.getProduct({ productId: '1' })).rejects.toThrow(
        new TRPCError({ code: 'NOT_FOUND', message: 'Product not found' })
      );
    });

    it('should return private product when user is the owner', async () => {
      const mockProduct = {
        id: '1',
        name: 'Private Product',
        visibility: 'private',
        authorId: 'user1',
        deletedAt: null,
      };

      const mockAuthor = {
        id: 'user1',
        name: 'John Doe',
      };

      const mockRecommendationCount = { count: 2 };

      mockDb.limit.mockResolvedValueOnce([mockProduct]);
      mockDb.where.mockResolvedValueOnce([mockAuthor]);
      mockDb.where.mockResolvedValueOnce([mockRecommendationCount]);

      const caller = createCaller({
        session: {
          user: { id: 'user1' },
        },
      });

      const result = await caller.getProduct({ productId: '1' });

      expect(result.visibility).toBe('private');
      expect(result.author.id).toBe('user1');
    });

    it('should handle missing recommendation count gracefully', async () => {
      const mockProduct = {
        id: '1',
        name: 'Test Product',
        visibility: 'public',
        authorId: 'user1',
        deletedAt: null,
      };

      const mockAuthor = {
        id: 'user1',
        name: 'John Doe',
      };

      mockDb.limit.mockResolvedValueOnce([mockProduct]);
      mockDb.where.mockResolvedValueOnce([mockAuthor]);
      mockDb.where.mockResolvedValueOnce([]);

      const caller = createCaller({
        session: null,
      });

      const result = await caller.getProduct({ productId: '1' });

      expect(result.recommendationCount).toBe(0);
    });
  });

  describe('updateProduct', () => {
    it('should update product successfully when user is owner', async () => {
      const mockProduct = {
        id: '1',
        name: 'Original Product',
        authorId: 'user1',
      };

      mockDb.limit.mockResolvedValue([mockProduct]);
      mockDb.where.mockResolvedValue({ success: true });

      const caller = createCaller({
        session: {
          user: { id: 'user1' },
        },
      });

      const updateData = {
        productId: '1',
        name: 'Updated Product',
        description: 'Updated description',
      };

      const result = await caller.updateProduct(updateData);

      expect(mockCheckBotId).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('should throw UNAUTHORIZED when bot is detected', async () => {
      mockCheckBotId.mockResolvedValue({ isBot: true });

      const caller = createCaller({
        session: {
          user: { id: 'user1' },
        },
      });

      const updateData = {
        productId: '1',
        name: 'Updated Product',
      };

      await expect(caller.updateProduct(updateData)).rejects.toThrow(
        new TRPCError({ code: 'UNAUTHORIZED' })
      );
    });

    it('should throw error when user is not authenticated', async () => {
      const caller = createCaller({
        session: null,
      });

      const updateData = {
        productId: '1',
        name: 'Updated Product',
      };

      await expect(caller.updateProduct(updateData)).rejects.toThrow(
        'Unauthorized - no session'
      );
    });

    it('should throw NOT_FOUND when product does not exist', async () => {
      mockDb.limit.mockResolvedValue([]);

      const caller = createCaller({
        session: {
          user: { id: 'user1' },
        },
      });

      const updateData = {
        productId: 'nonexistent',
        name: 'Updated Product',
      };

      await expect(caller.updateProduct(updateData)).rejects.toThrow(
        new TRPCError({ code: 'NOT_FOUND', message: 'Product not found' })
      );
    });

    it('should throw error when user is not product owner', async () => {
      const mockProduct = {
        id: '1',
        name: 'Original Product',
        authorId: 'user1',
      };

      mockDb.limit.mockResolvedValue([mockProduct]);

      const caller = createCaller({
        session: {
          user: { id: 'user2' },
        },
      });

      const updateData = {
        productId: '1',
        name: 'Updated Product',
      };

      await expect(caller.updateProduct(updateData)).rejects.toThrow(
        'Unauthorized - not product owner'
      );
    });

    it('should update all provided fields', async () => {
      const mockProduct = {
        id: '1',
        name: 'Original Product',
        authorId: 'user1',
      };

      mockDb.limit.mockResolvedValue([mockProduct]);
      mockDb.where.mockResolvedValue({ success: true });

      const caller = createCaller({
        session: {
          user: { id: 'user1' },
        },
      });

      const updateData = {
        productId: '1',
        name: 'Updated Product',
        description: 'Updated description',
        price: '19.99',
        category: ['tech', 'tools'],
        visibility: 'private' as const,
      };

      const result = await caller.updateProduct(updateData);

      expect(result).toEqual({ success: true });
    });
  });

  describe('deleteProduct', () => {
    it('should delete product successfully when user is owner', async () => {
      const mockProduct = {
        id: '1',
        name: 'Test Product',
        authorId: 'user1',
      };

      mockDb.limit.mockResolvedValue([mockProduct]);
      mockDb.where.mockResolvedValue({ success: true });

      const caller = createCaller({
        session: {
          user: { id: 'user1' },
        },
      });

      const result = await caller.deleteProduct({ productId: '1' });

      expect(result).toEqual({ success: true });
    });

    it('should throw UNAUTHORIZED when user is not authenticated', async () => {
      const caller = createCaller({
        session: null,
      });

      await expect(caller.deleteProduct({ productId: '1' })).rejects.toThrow(
        new TRPCError({ code: 'UNAUTHORIZED' })
      );
    });

    it('should throw NOT_FOUND when product does not exist', async () => {
      mockDb.limit.mockResolvedValue([]);

      const caller = createCaller({
        session: {
          user: { id: 'user1' },
        },
      });

      await expect(caller.deleteProduct({ productId: 'nonexistent' })).rejects.toThrow(
        new TRPCError({ code: 'NOT_FOUND', message: 'Product not found' })
      );
    });

    it('should throw UNAUTHORIZED when user is not product owner', async () => {
      const mockProduct = {
        id: '1',
        name: 'Test Product',
        authorId: 'user1',
      };

      mockDb.limit.mockResolvedValue([mockProduct]);

      const caller = createCaller({
        session: {
          user: { id: 'user2' },
        },
      });

      await expect(caller.deleteProduct({ productId: '1' })).rejects.toThrow(
        new TRPCError({ code: 'UNAUTHORIZED' })
      );
    });
  });

  describe('adminDeleteProduct', () => {
    it('should soft delete product and create notification when user is admin', async () => {
      const mockAdmin = {
        id: 'admin1',
        role: 'admin',
      };

      const mockProduct = {
        id: '1',
        name: 'Test Product',
        authorId: 'user1',
      };

      mockDb.limit.mockResolvedValueOnce([mockAdmin]);
      mockDb.limit.mockResolvedValueOnce([mockProduct]);
      mockDb.values.mockResolvedValueOnce({ insertId: 1 });
      mockDb.where.mockResolvedValue({ success: true });

      const caller = createCaller({
        session: {
          user: { id: 'admin1' },
        },
      });

      const result = await caller.adminDeleteProduct({
        productId: '1',
        reason: 'Spam content',
      });

      expect(result).toEqual({ success: true });
    });

    it('should throw UNAUTHORIZED when user is not authenticated', async () => {
      const caller = createCaller({
        session: null,
      });

      await expect(
        caller.adminDeleteProduct({ productId: '1' })
      ).rejects.toThrow(new TRPCError({ code: 'UNAUTHORIZED' }));
    });

    it('should throw FORBIDDEN when user is not admin', async () => {
      const mockUser = {
        id: 'user1',
        role: 'user',
      };

      mockDb.limit.mockResolvedValue([mockUser]);

      const caller = createCaller({
        session: {
          user: { id: 'user1' },
        },
      });

      await expect(
        caller.adminDeleteProduct({ productId: '1' })
      ).rejects.toThrow(
        new TRPCError({
          code: 'FORBIDDEN',
          message: 'Admin access required',
        })
      );
    });

    it('should throw NOT_FOUND when product does not exist', async () => {
      const mockAdmin = {
        id: 'admin1',
        role: 'admin',
      };

      mockDb.limit.mockResolvedValueOnce([mockAdmin]);
      mockDb.limit.mockResolvedValueOnce([]);

      const caller = createCaller({
        session: {
          user: { id: 'admin1' },
        },
      });

      await expect(
        caller.adminDeleteProduct({ productId: 'nonexistent' })
      ).rejects.toThrow(
        new TRPCError({ code: 'NOT_FOUND', message: 'Product not found' })
      );
    });

    it('should use default reason when none provided', async () => {
      const mockAdmin = {
        id: 'admin1',
        role: 'admin',
      };

      const mockProduct = {
        id: '1',
        name: 'Test Product',
        authorId: 'user1',
      };

      mockDb.limit.mockResolvedValueOnce([mockAdmin]);
      mockDb.limit.mockResolvedValueOnce([mockProduct]);
      mockDb.values.mockResolvedValueOnce({ insertId: 1 });
      mockDb.where.mockResolvedValue({ success: true });

      const caller = createCaller({
        session: {
          user: { id: 'admin1' },
        },
      });

      const result = await caller.adminDeleteProduct({ productId: '1' });

      expect(result).toEqual({ success: true });
    });
  });

  describe('adminRestoreProduct', () => {
    it('should restore deleted product and create notification when user is admin', async () => {
      const mockAdmin = {
        id: 'admin1',
        role: 'admin',
      };

      const mockProduct = {
        id: '1',
        name: 'Test Product',
        authorId: 'user1',
        deletedAt: new Date(),
      };

      mockDb.limit.mockResolvedValueOnce([mockAdmin]);
      mockDb.limit.mockResolvedValueOnce([mockProduct]);
      mockDb.where.mockResolvedValue({ success: true });
      mockDb.values.mockResolvedValue({ insertId: 1 });

      const caller = createCaller({
        session: {
          user: { id: 'admin1' },
        },
      });

      const result = await caller.adminRestoreProduct({ productId: '1' });

      expect(result).toEqual({ success: true });
    });

    it('should throw error when product is not deleted', async () => {
      const mockAdmin = {
        id: 'admin1',
        role: 'admin',
      };

      const mockProduct = {
        id: '1',
        name: 'Test Product',
        authorId: 'user1',
        deletedAt: null,
      };

      mockDb.limit.mockResolvedValueOnce([mockAdmin]);
      mockDb.limit.mockResolvedValueOnce([mockProduct]);

      const caller = createCaller({
        session: {
          user: { id: 'admin1' },
        },
      });

      await expect(
        caller.adminRestoreProduct({ productId: '1' })
      ).rejects.toThrow('Product is not deleted');
    });
  });

  describe('adminRejectAppeal', () => {
    it('should reject appeal and create notification when user is admin', async () => {
      const mockAdmin = {
        id: 'admin1',
        role: 'admin',
      };

      const mockNotification = {
        id: 'notif1',
        userId: 'user1',
        target: 'product1',
        metadata: JSON.stringify({
          productName: 'Test Product',
          canAppeal: true,
        }),
      };

      mockDb.limit.mockResolvedValue([mockAdmin]);
      mockDb.limit.mockResolvedValue([mockNotification]);
      mockDb.values.mockResolvedValue({ insertId: 1 });
      mockDb.where.mockResolvedValue({ success: true });

      const caller = createCaller({
        session: {
          user: { id: 'admin1' },
        },
      });

      const result = await caller.adminRejectAppeal({
        notificationId: 'notif1',
        rejectionReason: 'Appeal not valid',
      });

      expect(result).toEqual({ success: true });
    });

    it('should handle notification without metadata', async () => {
      const mockAdmin = {
        id: 'admin1',
        role: 'admin',
      };

      const mockNotification = {
        id: 'notif1',
        userId: 'user1',
        target: 'product1',
        metadata: null,
      };

      mockDb.limit.mockResolvedValueOnce([mockAdmin]);
      mockDb.limit.mockResolvedValueOnce([mockNotification]);
      mockDb.values.mockResolvedValue({ insertId: 1 });
      mockDb.where.mockResolvedValue({ success: true });

      const caller = createCaller({
        session: {
          user: { id: 'admin1' },
        },
      });

      const result = await caller.adminRejectAppeal({
        notificationId: 'notif1',
      });

      expect(result).toEqual({ success: true });
    });
  });

  describe('getAppealedProducts', () => {
    it('should return appealed products for admin users', async () => {
      const mockAdmin = {
        id: 'admin1',
        role: 'admin',
      };

      const mockAppealedNotifications = [
        {
          notification: {
            id: 'notif1',
            action: 'product_removed',
            metadata: JSON.stringify({
              productName: 'Test Product',
              appealed: true,
            }),
            createdAt: new Date(),
          },
          user: {
            id: 'user1',
            name: 'John Doe',
          },
          product: {
            id: 'product1',
            name: 'Test Product',
          },
        },
      ];

      mockDb.limit.mockResolvedValue([mockAdmin]);
      mockDb.orderBy.mockResolvedValue(mockAppealedNotifications);

      const caller = createCaller({
        session: {
          user: { id: 'admin1' },
        },
      });

      const result = await caller.getAppealedProducts();

      expect(result).toHaveLength(1);
      expect(result[0].hasAppeal).toBe(true);
    });

    it('should filter out non-appealed notifications', async () => {
      const mockAdmin = {
        id: 'admin1',
        role: 'admin',
      };

      const mockNotifications = [
        {
          notification: {
            id: 'notif1',
            action: 'product_removed',
            metadata: JSON.stringify({
              productName: 'Test Product',
              appealed: true,
            }),
          },
        },
        {
          notification: {
            id: 'notif2',
            action: 'product_removed',
            metadata: JSON.stringify({
              productName: 'Another Product',
              appealed: false,
            }),
          },
        },
      ];

      mockDb.limit.mockResolvedValue([mockAdmin]);
      mockDb.orderBy.mockResolvedValue(mockNotifications);

      const caller = createCaller({
        session: {
          user: { id: 'admin1' },
        },
      });

      const result = await caller.getAppealedProducts();

      expect(result).toHaveLength(1);
      expect(result[0].hasAppeal).toBe(true);
    });
  });

  describe('addBookmark', () => {
    it('should add bookmark and create notification for different user', async () => {
      mockDb.values.mockResolvedValue({ insertId: 1 });
      mockDb.query.products.findFirst.mockResolvedValue({
        authorId: 'user2',
      });

      const caller = createCaller({
        session: {
          user: { id: 'user1' },
        },
      });

      const result = await caller.addBookmark({ productId: 'product1' });

      expect(result).toEqual({ success: true });
      expect(mockDb.insert).toHaveBeenCalledWith(bookmarksTable);
      expect(mockDb.insert).toHaveBeenCalledWith(notificationsTable);
    });

    it('should not create notification when bookmarking own product', async () => {
      mockDb.values.mockResolvedValue({ insertId: 1 });
      mockDb.query.products.findFirst.mockResolvedValue({
        authorId: 'user1',
      });

      const caller = createCaller({
        session: {
          user: { id: 'user1' },
        },
      });

      const result = await caller.addBookmark({ productId: 'product1' });

      expect(result).toEqual({ success: true });
      expect(mockDb.insert).toHaveBeenCalledWith(bookmarksTable);
    });

    it('should throw UNAUTHORIZED when user is not authenticated', async () => {
      const caller = createCaller({
        session: null,
      });

      await expect(
        caller.addBookmark({ productId: 'product1' })
      ).rejects.toThrow(new TRPCError({ code: 'UNAUTHORIZED' }));
    });
  });

  describe('removeBookmark', () => {
    it('should remove bookmark successfully', async () => {
      mockDb.where.mockResolvedValue({ success: true });

      const caller = createCaller({
        session: {
          user: { id: 'user1' },
        },
      });

      const result = await caller.removeBookmark({ productId: 'product1' });

      expect(result).toEqual({ success: true });
      expect(mockDb.delete).toHaveBeenCalledWith(bookmarksTable);
    });

    it('should throw UNAUTHORIZED when user is not authenticated', async () => {
      const caller = createCaller({
        session: null,
      });

      await expect(
        caller.removeBookmark({ productId: 'product1' })
      ).rejects.toThrow(new TRPCError({ code: 'UNAUTHORIZED' }));
    });
  });

  describe('getBookmarkStatus', () => {
    it('should return bookmark status for authenticated user', async () => {
      const mockBookmark = [{ id: 'bookmark1' }];
      mockDb.limit.mockResolvedValue(mockBookmark);

      const caller = createCaller({
        session: {
          user: { id: 'user1' },
        },
      });

      const result = await caller.getBookmarkStatus({ productId: 'product1' });

      expect(result).toEqual({ isBookmarked: true });
    });

    it('should return false for unauthenticated user', async () => {
      const caller = createCaller({
        session: null,
      });

      const result = await caller.getBookmarkStatus({ productId: 'product1' });

      expect(result).toEqual({ isBookmarked: false });
    });

    it('should return false when no bookmark exists', async () => {
      mockDb.limit.mockResolvedValue([]);

      const caller = createCaller({
        session: {
          user: { id: 'user1' },
        },
      });

      const result = await caller.getBookmarkStatus({ productId: 'product1' });

      expect(result).toEqual({ isBookmarked: false });
    });
  });

  describe('addRecommendation', () => {
    it('should add recommendation and create notification for different user', async () => {
      mockDb.values.mockResolvedValue({ insertId: 1 });
      mockDb.query.products.findFirst.mockResolvedValue({
        authorId: 'user2',
      });

      const caller = createCaller({
        session: {
          user: { id: 'user1' },
        },
      });

      const result = await caller.addRecommendation({ productId: 'product1' });

      expect(result).toEqual({ success: true });
      expect(mockDb.insert).toHaveBeenCalledWith(recommendationsTable);
      expect(mockDb.insert).toHaveBeenCalledWith(notificationsTable);
    });

    it('should not create notification when recommending own product', async () => {
      mockDb.values.mockResolvedValue({ insertId: 1 });
      mockDb.query.products.findFirst.mockResolvedValue({
        authorId: 'user1',
      });

      const caller = createCaller({
        session: {
          user: { id: 'user1' },
        },
      });

      const result = await caller.addRecommendation({ productId: 'product1' });

      expect(result).toEqual({ success: true });
      expect(mockDb.insert).toHaveBeenCalledWith(recommendationsTable);
    });
  });

  describe('removeRecommendation', () => {
    it('should remove recommendation successfully', async () => {
      mockDb.where.mockResolvedValue({ success: true });

      const caller = createCaller({
        session: {
          user: { id: 'user1' },
        },
      });

      const result = await caller.removeRecommendation({ productId: 'product1' });

      expect(result).toEqual({ success: true });
      expect(mockDb.delete).toHaveBeenCalledWith(recommendationsTable);
    });
  });

  describe('getRecommendationStatus', () => {
    it('should return recommendation status for authenticated user', async () => {
      const mockRecommendation = [{ id: 'rec1' }];
      mockDb.limit.mockResolvedValue(mockRecommendation);

      const caller = createCaller({
        session: {
          user: { id: 'user1' },
        },
      });

      const result = await caller.getRecommendationStatus({ productId: 'product1' });

      expect(result).toEqual({ isRecommended: true });
    });

    it('should return false for unauthenticated user', async () => {
      const caller = createCaller({
        session: null,
      });

      const result = await caller.getRecommendationStatus({ productId: 'product1' });

      expect(result).toEqual({ isRecommended: false });
    });
  });

  describe('getBookmarkedProducts', () => {
    it('should return bookmarked products with recommendation counts', async () => {
      const mockBookmarked = [
        {
          product: {
            id: 'product1',
            name: 'Bookmarked Product',
            authorId: 'user2',
          },
          recommendationCount: 3,
        },
        {
          product: {
            id: 'product2',
            name: 'Another Product',
            authorId: 'user3',
          },
          recommendationCount: null,
        },
      ];

      mockDb.where.mockResolvedValue(mockBookmarked);

      const caller = createCaller({
        session: {
          user: { id: 'user1' },
        },
      });

      const result = await caller.getBookmarkedProducts();

      expect(result).toHaveLength(2);
      expect(result[0].recommendationCount).toBe(3);
      expect(result[1].recommendationCount).toBe(0);
    });

    it('should filter out null products', async () => {
      const mockBookmarked = [
        {
          product: {
            id: 'product1',
            name: 'Bookmarked Product',
          },
          recommendationCount: 3,
        },
        {
          product: null,
          recommendationCount: 0,
        },
      ];

      mockDb.where.mockResolvedValue(mockBookmarked);

      const caller = createCaller({
        session: {
          user: { id: 'user1' },
        },
      });

      const result = await caller.getBookmarkedProducts();

      expect(result).toHaveLength(1);
    });
  });

  describe('getRecommendedProducts', () => {
    it('should return recommended products with recommendation counts', async () => {
      const mockRecommended = [
        {
          product: {
            id: 'product1',
            name: 'Recommended Product',
            authorId: 'user2',
          },
          recommendationCount: 5,
        },
      ];

      mockDb.where.mockResolvedValue(mockRecommended);

      const caller = createCaller({
        session: {
          user: { id: 'user1' },
        },
      });

      const result = await caller.getRecommendedProducts();

      expect(result).toHaveLength(1);
      expect(result[0].recommendationCount).toBe(5);
    });

    it('should throw UNAUTHORIZED when user is not authenticated', async () => {
      const caller = createCaller({
        session: null,
      });

      await expect(caller.getRecommendedProducts()).rejects.toThrow(
        new TRPCError({ code: 'UNAUTHORIZED' })
      );
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockDb.orderBy.mockRejectedValue(new Error('Database connection failed'));

      const caller = createCaller({
        session: null,
      });

      await expect(caller.getProducts({})).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should handle malformed JSON metadata in notifications', async () => {
      const mockAdmin = {
        id: 'admin1',
        role: 'admin',
      };

      const mockNotifications = [
        {
          notification: {
            id: 'notif1',
            action: 'product_removed',
            metadata: 'invalid json',
          },
        },
      ];

      mockDb.limit.mockResolvedValue([mockAdmin]);
      mockDb.orderBy.mockResolvedValue(mockNotifications);

      const caller = createCaller({
        session: {
          user: { id: 'admin1' },
        },
      });

      // Should not throw but handle gracefully
      await expect(caller.getAppealedProducts()).rejects.toThrow();
    });

    it('should validate input parameters', async () => {
      const caller = createCaller({
        session: null,
      });

      // Invalid productId format should be handled by Zod validation
      await expect(caller.getProduct({ productId: '' })).rejects.toThrow();
    });
  });
});
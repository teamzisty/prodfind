import { z } from "zod";
import { authedProcedure, baseProcedure, createTRPCRouter } from "@/trpc/init";
import { db } from "@/lib/db";
import { eq, sql, desc, getTableColumns, and, isNull, SQL } from "drizzle-orm";
import {
  products as productsTable,
  users as usersTable,
  bookmarks as bookmarksTable,
  recommendations as recommendationsTable,
  notifications as notificationsTable,
  SAFE_USER_COLUMNS,
} from "@/lib/db/schema";
import {
  ProductSchema,
  ProductLinkSchema,
  ProductImageSchema,
  ProductVisibilitySchema,
} from "@/types/product";
import { checkBotId } from "botid/server";
import { sessionRouter } from "./session";
import { notificationsRouter } from "./notifications";
import { TRPCError } from "@trpc/server";
import { usersRouter } from "./users";
import { contactRouter } from "./contact";
import { commentsRouter } from "./comments";
import { SafeUser } from "@/types/user";

const CreateProductSchema = ProductSchema.omit({
  id: true,
  authorId: true,
  createdAt: true,
  updatedAt: true,
});

const recommendationCountsSubquery = db
  .select({
    productId: recommendationsTable.productId,
    count: sql<number>`count(${recommendationsTable.id})`
      .mapWith(Number)
      .as("count"),
  })
  .from(recommendationsTable)
  .groupBy(recommendationsTable.productId)
  .as("recommendationCounts");

/**
 * Api Router definition
 */
export const appRouter = createTRPCRouter({
  users: usersRouter,
  session: sessionRouter,
  notifications: notificationsRouter,
  contact: contactRouter,
  comments: commentsRouter,
  /**
   * Get products
   */
  getProducts: baseProcedure
    .input(
      z.object({
        userId: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      let qb = db
        .select({
          ...getTableColumns(productsTable),
          recommendationCount: recommendationCountsSubquery.count,
        })
        .from(productsTable)
        .leftJoin(
          recommendationCountsSubquery,
          eq(productsTable.id, recommendationCountsSubquery.productId),
        )
        .$dynamic();

      // Build where conditions
      const whereConditions: SQL<unknown>[] = [isNull(productsTable.deletedAt)];

      if (input.userId) {
        whereConditions.push(eq(productsTable.authorId, input.userId));
      } else {
        // If not viewing a specific user's products, filter by visibility
        if (ctx.session?.user?.id) {
          // Logged in users can see public, unlisted, and their own private products
          whereConditions.push(
            sql`(${productsTable.visibility} = 'public' OR ${productsTable.visibility} = 'unlisted' OR (${productsTable.visibility} = 'private' AND ${productsTable.authorId} = ${ctx.session.user.id}))`,
          );
        } else {
          // Non-logged in users can only see public products
          whereConditions.push(eq(productsTable.visibility, "public"));
        }
      }

      qb = qb.where(and(...whereConditions));

      const products = await qb.orderBy(desc(productsTable.createdAt));


      return products
        .map((p) => ({
          ...p,
          recommendationCount: p.recommendationCount || 0,
        }))
        .sort(
          (a, b) => (b.recommendationCount || 0) - (a.recommendationCount || 0),
        );
    }),
  /**
   * Create product
   */
  createProduct: authedProcedure
    .input(CreateProductSchema)
    .mutation(async ({ ctx, input }) => {
      const verification = await checkBotId();

      if (verification.isBot) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      const product = await db.insert(productsTable).values({
        ...input,
        authorId: ctx.session?.user?.id ?? "unknown",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return product;
    }),
  /**
   * Get single product by ID
   */
  getProduct: baseProcedure
    .input(
      z.object({
        productId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const product = await db
        .select()
        .from(productsTable)
        .where(
          and(
            eq(productsTable.id, input.productId),
            isNull(productsTable.deletedAt),
          ),
        )
        .limit(1);

      if (!product[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      const productData = product[0];

      // Check visibility permissions
      if (
        productData.visibility === "private" &&
        productData.authorId !== ctx.session?.user?.id
      ) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      const author = await db
        .select(SAFE_USER_COLUMNS)
        .from(usersTable)
        .where(eq(usersTable.id, productData.authorId));

      const recommendationCount = await db
        .select({
          count: sql<number>`count(${recommendationsTable.id})`.mapWith(Number),
        })
        .from(recommendationsTable)
        .where(eq(recommendationsTable.productId, input.productId));

      return {
        ...productData,
        author: author[0] as unknown as SafeUser,
        recommendationCount: recommendationCount[0]?.count || 0,
      };
    }),
  /**
   * Update product
   */
  updateProduct: baseProcedure
    .input(
      z.object({
        productId: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        shortDescription: z.string().optional(),
        price: z.string().optional(),
        category: z.array(z.string()).optional(),
        links: z.array(ProductLinkSchema.omit({ id: true })).optional(),
        images: z.array(ProductImageSchema.omit({ id: true })).optional(),
        license: z.string().optional(),
        visibility: ProductVisibilitySchema.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const verification = await checkBotId();

      if (verification.isBot) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      if (!ctx.session?.user?.id) {
        throw new Error("Unauthorized - no session");
      }

      const product = await db
        .select()
        .from(productsTable)
        .where(eq(productsTable.id, input.productId))
        .limit(1);

      if (!product[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      if (product[0].authorId !== ctx.session.user.id) {
        throw new Error("Unauthorized - not product owner");
      }

      const { productId, ...updateData } = input;

      await db
        .update(productsTable)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(productsTable.id, productId));

      return { success: true };
    }),
  /**
   * Delete product
   */
  deleteProduct: baseProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const product = await db
        .select()
        .from(productsTable)
        .where(eq(productsTable.id, input.productId))
        .limit(1);

      if (!product[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      if (product[0].authorId !== ctx.session.user.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      await db
        .delete(productsTable)
        .where(eq(productsTable.id, input.productId));

      return { success: true };
    }),

  /**
   * Admin delete product (for ToS violations)
   */
  adminDeleteProduct: authedProcedure
    .input(
      z.object({
        productId: z.string(),
        reason: z.string().default("Violates Terms of Service"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Check if user has admin role
      const user = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, ctx.session.user.id))
        .limit(1);

      if (!user[0] || user[0].role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const product = await db
        .select()
        .from(productsTable)
        .where(eq(productsTable.id, input.productId))
        .limit(1);

      if (!product[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      // Create notification for the product author
      await db.insert(notificationsTable).values({
        userId: product[0].authorId,
        action: "product_removed",
        target: input.productId,
        read: false,
        createdAt: new Date(),
        actorId: ctx.session.user.id,
        metadata: JSON.stringify({
          productName: product[0].name,
          reason: input.reason,
          canAppeal: true,
        }),
      });

      // Soft delete the product
      await db
        .update(productsTable)
        .set({
          deletedAt: new Date(),
          deletedBy: ctx.session.user.id,
          deletionReason: input.reason,
          updatedAt: new Date(),
        })
        .where(eq(productsTable.id, input.productId));

      return { success: true };
    }),

  /**
   * Admin restore product (approve appeal)
   */
  adminRestoreProduct: authedProcedure
    .input(
      z.object({
        productId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Check if user has admin role
      const user = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, ctx.session.user.id))
        .limit(1);

      if (!user[0] || user[0].role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const product = await db
        .select()
        .from(productsTable)
        .where(eq(productsTable.id, input.productId))
        .limit(1);

      if (!product[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      if (!product[0].deletedAt) {
        throw new Error("Product is not deleted");
      }

      // Restore the product
      await db
        .update(productsTable)
        .set({
          deletedAt: null,
          deletedBy: null,
          deletionReason: null,
          updatedAt: new Date(),
        })
        .where(eq(productsTable.id, input.productId));

      // Create notification for the product author
      await db.insert(notificationsTable).values({
        userId: product[0].authorId,
        action: "product_restored",
        target: input.productId,
        read: false,
        createdAt: new Date(),
        actorId: ctx.session.user.id,
        metadata: JSON.stringify({
          productName: product[0].name,
          message:
            "Your appeal was approved and your product has been restored",
        }),
      });

      return { success: true };
    }),

  /**
   * Admin reject appeal
   */
  adminRejectAppeal: authedProcedure
    .input(
      z.object({
        notificationId: z.string(),
        rejectionReason: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Check if user has admin role
      const user = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, ctx.session.user.id))
        .limit(1);

      if (!user[0] || user[0].role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const notification = await db
        .select()
        .from(notificationsTable)
        .where(eq(notificationsTable.id, input.notificationId))
        .limit(1);

      if (!notification[0]) {
        throw new Error("Notification not found");
      }

      const metadata = notification[0].metadata
        ? JSON.parse(notification[0].metadata)
        : {};

      await db.insert(notificationsTable).values({
        userId: notification[0].userId,
        action: "appeal_rejected",
        target: notification[0].target,
        read: false,
        createdAt: new Date(),
        actorId: ctx.session.user.id,
        metadata: JSON.stringify({
          productName: metadata.productName,
          message: "Your appeal was reviewed and rejected",
        }),
      });

      // Update the metadata to mark appeal as rejected
      await db
        .update(notificationsTable)
        .set({
          metadata: JSON.stringify({
            ...metadata,
            appealRejected: true,
            rejectionReason:
              input.rejectionReason || "Appeal was reviewed and rejected",
            rejectedBy: ctx.session.user.id,
            rejectedAt: new Date().toISOString(),
          }),
        })
        .where(eq(notificationsTable.id, input.notificationId));

      return { success: true };
    }),

  /**
   * Get appealed product removals for admin review
   */
  getAppealedProducts: authedProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user?.id) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    // Check if user has admin role
    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, ctx.session.user.id))
      .limit(1);

    if (!user[0] || user[0].role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Admin access required",
      });
    }

    // Get notifications where products were removed and appeals were submitted
    const appealedNotifications = await db
      .select({
        notification: notificationsTable,
        user: {
          id: usersTable.id,
          name: usersTable.name,
          image: usersTable.image,
          createdAt: usersTable.createdAt,
        },
        product: productsTable,
      })
      .from(notificationsTable)
      .leftJoin(usersTable, eq(notificationsTable.userId, usersTable.id))
      .leftJoin(productsTable, eq(notificationsTable.target, productsTable.id))
      .where(eq(notificationsTable.action, "product_removed"))
      .orderBy(desc(notificationsTable.createdAt));

    // Filter for appeals that have been submitted
    return appealedNotifications
      .map((item) => {
        const metadata = item.notification.metadata
          ? JSON.parse(item.notification.metadata)
          : {};
        return {
          ...item,
          metadata,
          hasAppeal: !!metadata.appealed,
        };
      })
      .filter((item) => item.hasAppeal);
  }),

  addBookmark: baseProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      await db.insert(bookmarksTable).values({
        productId: input.productId,
        userId: ctx.session.user.id,
        createdAt: new Date(),
      });

      const product = await db.query.products.findFirst({
        where: eq(productsTable.id, input.productId),
        columns: {
          authorId: true,
        },
      });

      if (product && product.authorId !== ctx.session.user.id) {
        await db.insert(notificationsTable).values({
          userId: product.authorId,
          action: "bookmark",
          target: input.productId,
          read: false,
          createdAt: new Date(),
          actorId: ctx.session.user.id,
        });
      }

      return { success: true };
    }),

  removeBookmark: baseProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      await db
        .delete(bookmarksTable)
        .where(
          and(
            eq(bookmarksTable.productId, input.productId),
            eq(bookmarksTable.userId, ctx.session.user.id),
          ),
        );
      return { success: true };
    }),

  getBookmarkStatus: baseProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        return { isBookmarked: false };
      }
      const bookmark = await db
        .select()
        .from(bookmarksTable)
        .where(
          and(
            eq(bookmarksTable.productId, input.productId),
            eq(bookmarksTable.userId, ctx.session.user.id),
          ),
        )
        .limit(1);
      return { isBookmarked: !!bookmark[0] };
    }),

  addRecommendation: baseProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      await db.insert(recommendationsTable).values({
        productId: input.productId,
        userId: ctx.session.user.id,
        createdAt: new Date(),
      });

      const product = await db.query.products.findFirst({
        where: eq(productsTable.id, input.productId),
        columns: {
          authorId: true,
        },
      });

      if (product && product.authorId !== ctx.session.user.id) {
        await db.insert(notificationsTable).values({
          userId: product.authorId,
          action: "recommendation",
          target: input.productId,
          read: false,
          createdAt: new Date(),
          actorId: ctx.session.user.id,
        });
      }

      return { success: true };
    }),

  removeRecommendation: baseProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      await db
        .delete(recommendationsTable)
        .where(
          and(
            eq(recommendationsTable.productId, input.productId),
            eq(recommendationsTable.userId, ctx.session.user.id),
          ),
        );
      return { success: true };
    }),

  getRecommendationStatus: baseProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        return { isRecommended: false };
      }
      const recommendation = await db
        .select()
        .from(recommendationsTable)
        .where(
          and(
            eq(recommendationsTable.productId, input.productId),
            eq(recommendationsTable.userId, ctx.session.user.id),
          ),
        )
        .limit(1);
      return { isRecommended: !!recommendation[0] };
    }),

  getBookmarkedProducts: baseProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user?.id) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const bookmarked = await db
      .select({
        product: productsTable,
        recommendationCount: recommendationCountsSubquery.count,
      })
      .from(bookmarksTable)
      .leftJoin(productsTable, eq(bookmarksTable.productId, productsTable.id))
      .leftJoin(
        recommendationCountsSubquery,
        eq(productsTable.id, recommendationCountsSubquery.productId),
      )
      .where(eq(bookmarksTable.userId, ctx.session.user.id));

    return bookmarked
      .filter((item) => item.product)
      .map((item) => ({
        ...item.product!,
        recommendationCount: item.recommendationCount || 0,
      }));
  }),

  getRecommendedProducts: baseProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user?.id) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const recommended = await db
      .select({
        product: productsTable,
        recommendationCount: recommendationCountsSubquery.count,
      })
      .from(recommendationsTable)
      .leftJoin(
        productsTable,
        eq(recommendationsTable.productId, productsTable.id),
      )
      .leftJoin(
        recommendationCountsSubquery,
        eq(productsTable.id, recommendationCountsSubquery.productId),
      )
      .where(eq(recommendationsTable.userId, ctx.session.user.id));

    return recommended
      .filter((item) => item.product)
      .map((item) => ({
        ...item.product!,
        recommendationCount: item.recommendationCount || 0,
      }));
  }),
});

// export type definition of API
export type AppRouter = typeof appRouter;

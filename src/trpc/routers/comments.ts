import { z } from 'zod';
import { authedProcedure, baseProcedure, createTRPCRouter } from '@/trpc/init';
import { db } from '@/lib/db';
import { eq, desc, and, isNull, inArray } from 'drizzle-orm';
import {
  comments as commentsTable,
  users as usersTable,
  products as productsTable,
  notifications as notificationsTable,
  SAFE_USER_COLUMNS,
} from '@/lib/db/schema';
import { CommentSchema, CommentWithAuthor } from '@/types/comment';
import { checkBotId } from 'botid/server';
import { TRPCError } from '@trpc/server';


const CreateCommentSchema = CommentSchema.omit({
  id: true,
  authorId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  deletedBy: true,
  deletionReason: true,
});

export const commentsRouter = createTRPCRouter({
  getByProductId: baseProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ input }) => {
      const comments = await db
        .select({
          comment: commentsTable,
          author: SAFE_USER_COLUMNS,
        })
        .from(commentsTable)
        .leftJoin(usersTable, eq(commentsTable.authorId, usersTable.id))
        .where(and(
          eq(commentsTable.productId, input.productId),
          isNull(commentsTable.deletedAt),
          isNull(commentsTable.parentId)
        ))
        .orderBy(desc(commentsTable.createdAt));

      const commentIds = comments.map(c => c.comment.id);
      
      const replies = commentIds.length > 0 ? await db
        .select({
          comment: commentsTable,
          author: SAFE_USER_COLUMNS,
        })
        .from(commentsTable)
        .leftJoin(usersTable, eq(commentsTable.authorId, usersTable.id))
        .where(and(
          inArray(commentsTable.parentId, commentIds),
          isNull(commentsTable.deletedAt)
        ))
        .orderBy(commentsTable.createdAt) : [];

      const repliesMap = new Map<string, typeof replies>();
      replies.forEach(reply => {
        const parentId = reply.comment.parentId!;
        if (!repliesMap.has(parentId)) {
          repliesMap.set(parentId, []);
        }
        repliesMap.get(parentId)!.push(reply);
      });

      const buildCommentTree = (comment: typeof comments[0]): CommentWithAuthor => {
        const childReplies = repliesMap.get(comment.comment.id) || [];
        return {
          ...comment.comment,
          author: comment.author!,
          replies: childReplies.map(buildCommentTree),
        };
      };

      return comments.map(buildCommentTree);
    }),

  create: authedProcedure
    .input(CreateCommentSchema)
    .mutation(async ({ input, ctx }) => {
      const botCheck = await checkBotId();
      if (botCheck.isBot) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Bot verification failed',
        });
      }

      const [comment] = await db
        .insert(commentsTable)
        .values({
          ...input,
          authorId: ctx.user.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      if (!input.parentId) {
        const [product] = await db
          .select({ authorId: productsTable.authorId })
          .from(productsTable)
          .where(eq(productsTable.id, input.productId));

        if (product && product.authorId !== ctx.user.id) {
          await db.insert(notificationsTable).values({
            userId: product.authorId,
            action: 'comment',
            target: input.productId,
            actorId: ctx.user.id,
            metadata: JSON.stringify({
              type: 'comment',
              title: 'New comment on your product',
              message: `${ctx.user.name || 'Someone'} commented on your product`,
            }),
            createdAt: new Date(),
          });
        }
      } else {
        const [parentComment] = await db
          .select({ authorId: commentsTable.authorId })
          .from(commentsTable)
          .where(eq(commentsTable.id, input.parentId));

        if (parentComment && parentComment.authorId !== ctx.user.id) {
          await db.insert(notificationsTable).values({
            userId: parentComment.authorId,
            action: 'reply',
            target: input.productId,
            actorId: ctx.user.id,
            metadata: JSON.stringify({
              type: 'reply',
              title: 'New reply to your comment',
              message: `${ctx.user.name || 'Someone'} replied to your comment`,
            }),
            createdAt: new Date(),
          });
        }
      }

      return comment;
    }),

  update: authedProcedure
    .input(z.object({
      id: z.string(),
      content: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const botCheck = await checkBotId();
      if (botCheck.isBot) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Bot verification failed',
        });
      }

      const [existingComment] = await db
        .select()
        .from(commentsTable)
        .where(eq(commentsTable.id, input.id));

      if (!existingComment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Comment not found',
        });
      }

      if (existingComment.authorId !== ctx.user.id && ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only edit your own comments',
        });
      }

      const [updatedComment] = await db
        .update(commentsTable)
        .set({
          content: input.content,
          updatedAt: new Date(),
        })
        .where(eq(commentsTable.id, input.id))
        .returning();

      return updatedComment;
    }),

  delete: authedProcedure
    .input(z.object({
      id: z.string(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const botCheck = await checkBotId();
      if (botCheck.isBot) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Bot verification failed',
        });
      }

      const [existingComment] = await db
        .select()
        .from(commentsTable)
        .where(eq(commentsTable.id, input.id));

      if (!existingComment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Comment not found',
        });
      }

      if (existingComment.authorId !== ctx.user.id && ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only delete your own comments',
        });
      }

      const [deletedComment] = await db
        .update(commentsTable)
        .set({
          deletedAt: new Date(),
          deletedBy: ctx.user.id,
          deletionReason: input.reason,
        })
        .where(eq(commentsTable.id, input.id))
        .returning();

      return deletedComment;
    }),
});
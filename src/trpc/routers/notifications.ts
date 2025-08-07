import { createTRPCRouter, authedProcedure } from "@/trpc/init";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";

export const notificationsRouter = createTRPCRouter({
  get: authedProcedure.query(async ({ ctx }) => {
    const data = await db.query.notifications.findMany({
      where: eq(notifications.userId, ctx.user.id),
      with: {
        actor: {
          columns: {
            id: true,
            name: true,
            image: true,
            createdAt: true
          }
        },
        product: true,
      },
      orderBy: [desc(notifications.createdAt)],
    });
    return data;
  }),

  markAsRead: authedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .update(notifications)
        .set({ read: true })
        .where(
          and(
            eq(notifications.id, input.id),
            eq(notifications.userId, ctx.user.id)
          )
        );
      return true;
    }),

  markAllAsRead: authedProcedure.mutation(async ({ ctx }) => {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, ctx.user.id));
    return true;
  }),

  appealProductRemoval: authedProcedure
    .input(z.object({ 
      notificationId: z.string(),
      appealMessage: z.string().min(10, "Appeal message must be at least 10 characters")
    }))
    .mutation(async ({ ctx, input }) => {
      // Get the notification
      const notification = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.id, input.notificationId),
            eq(notifications.userId, ctx.user.id),
            eq(notifications.action, "product_removed")
          )
        )
        .limit(1);

      if (!notification[0]) {
        throw new Error("Notification not found or cannot be appealed");
      }

      const metadata = notification[0].metadata ? JSON.parse(notification[0].metadata) : {};
      
      if (!metadata.canAppeal) {
        throw new Error("This product removal cannot be appealed");
      }

      // Update the metadata to mark as appealed
      await db
        .update(notifications)
        .set({
          metadata: JSON.stringify({
            ...metadata,
            appealed: true,
            appealMessage: input.appealMessage,
            appealDate: new Date().toISOString()
          })
        })
        .where(eq(notifications.id, input.notificationId));

      return { success: true, message: "Appeal submitted successfully" };
    }),
}); 
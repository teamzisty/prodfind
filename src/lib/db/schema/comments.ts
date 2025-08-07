import {
    pgTable,
    text,
    timestamp,
    AnyPgColumn,
    index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./auth";
import { products } from "./products";

export const comments = pgTable("comments", {
    id: text("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),

    productId: text("product_id")
        .notNull()
        .references(() => products.id, { onDelete: "cascade" }),

    authorId: text("author_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),

    parentId: text("parent_id").references(
        (): AnyPgColumn => comments.id,
        { onDelete: "cascade" },
    ),

    content: text("content").notNull(),

    createdAt: timestamp("created_at")
        .notNull()
        .default(sql`now()`),

    updatedAt: timestamp("updated_at")
        .notNull()
        .default(sql`now()`),

    deletedAt: timestamp("deleted_at"),
    deletedBy: text("deleted_by"),
    deletionReason: text("deletion_reason"),
},
    (table) => [
        index("comments_product_id_idx").on(table.productId),
        index("comments_parent_id_idx").on(table.parentId),
        index("comments_created_at_idx").on(table.createdAt),
    ],);
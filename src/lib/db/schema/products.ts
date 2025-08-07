import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { sql } from "drizzle-orm";

export const products = pgTable("products", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  authorId: text("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  shortDescription: text("short_description"),
  price: text("price").notNull(),
  images: jsonb("images"),
  icon: text("icon"),
  links: jsonb("links"),
  category: jsonb("category").array(),
  license: text("license"),
  visibility: text("visibility").notNull().default("public"), // 'public', 'private', 'unlisted'
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  deletedAt: timestamp("deleted_at"),
  deletedBy: text("deleted_by"),
  deletionReason: text("deletion_reason"),
});

import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const verification = sqliteTable("verification", {
  id: integer().primaryKey({ autoIncrement: true }).unique(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: integer({ mode: "timestamp" }).notNull(),
  createdAt: integer({ mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

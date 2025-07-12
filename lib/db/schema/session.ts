import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { user } from "./auth.ts";

export const session = sqliteTable("session", {
  id: integer().primaryKey({ autoIncrement: true }).unique(),
  expiresAt: integer({ mode: "timestamp" }).notNull(),
  token: text().notNull().unique(),
  createdAt: integer({ mode: "timestamp" }).notNull(),
  updatedAt: integer({ mode: "timestamp" }).notNull(),
  ipAddress: text(),
  userAgent: text(),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

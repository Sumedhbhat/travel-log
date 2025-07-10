import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const location = sqliteTable("location", {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  slug: text().notNull().unique(),
  description: text(),
  lat: real(),
  long: real(),
  createdAt: integer({ mode: "timestamp" }).notNull().$default(() => new Date()),
  updatedAt: integer({ mode: "timestamp" }).notNull().$default(() => new Date()).$onUpdate(() => new Date()),
});

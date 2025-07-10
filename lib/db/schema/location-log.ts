import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { location } from "./location";

export const locationLog = sqliteTable("locationLog", {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  slug: text().notNull().unique(),
  description: text(),
  lat: real(),
  long: real(),
  locationId: integer().references(() => location.id).notNull(),
  createdAt: integer({ mode: "timestamp" }).notNull().$default(() => new Date()),
  updatedAt: integer({ mode: "timestamp" }).notNull().$default(() => new Date()).$onUpdate(() => new Date()),
});

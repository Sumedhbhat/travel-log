import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { locationLog } from "./location-log";

export const locationLogImage = sqliteTable("locationLogImage", {
  id: integer().primaryKey({ autoIncrement: true }),
  key: text().notNull(),
  locationLogId: integer().references(() => locationLog.id).notNull(),
  createdAt: integer({ mode: "timestamp" }).notNull().$default(() => new Date()),
  updatedAt: integer({ mode: "timestamp" }).notNull().$default(() => new Date()).$onUpdate(() => new Date()),
});

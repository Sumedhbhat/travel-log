import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { user } from "./auth.ts";
import { locationLog } from "./location-log.ts";

export const locationLogImage = sqliteTable("locationLogImage", {
  id: integer().primaryKey({ autoIncrement: true }),
  key: text().notNull(),
  locationLogId: integer()
    .references(() => locationLog.id)
    .notNull(),
  userId: integer().references(() => user.id),
  createdAt: integer({ mode: "timestamp" })
    .notNull()
    .$default(() => new Date()),
  updatedAt: integer({ mode: "timestamp" })
    .notNull()
    .$default(() => new Date())
    .$onUpdate(() => new Date()),
});

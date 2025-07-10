import { drizzle } from "drizzle-orm/libsql";

import env from "../env";
import * as schema from "./schema";

export const db = drizzle({
  schema,
  casing: "snake_case",
  connection: {
    url: env.TURSO_DATABASE_URL!,
    authToken: env.TURSO_AUTH_TOKEN!,
  },
});

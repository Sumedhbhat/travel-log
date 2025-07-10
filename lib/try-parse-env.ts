import type { ZodObject, ZodRawShape } from "zod";

import { ZodError } from "zod";

export default function tryParseEnv<T extends ZodRawShape>(
  EnvSchema: ZodObject<T>,
  // eslint-disable-next-line node/no-process-env
  buildEnv: Record<string, string | undefined> = process.env,
) {
  try {
    EnvSchema.parse(buildEnv);
  }
  catch (error) {
    if (error instanceof ZodError) {
      let message = "Missing required values in .env";
      error.issues.forEach((issue) => {
        message += `\n- ${issue.path.join(".")}: ${issue.message}`;
      });
      const e = new Error(message);
      e.stack = "";
      throw e;
    }
    else {
      console.error("Unexpected error while parsing environment variables:", error);
    }
  }
}

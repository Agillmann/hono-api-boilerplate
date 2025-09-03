import { type Context, Hono } from "hono";
import { logger } from "@/services/logger";
import type { AuthType } from "../lib/auth";
import { auth } from "../lib/auth";

const authRouter = new Hono<{ Variables: AuthType }>({
	strict: false,
});

authRouter.on(["POST", "GET"], "/*", async (c: Context) => {
	logger.info(`Auth request: ${c.req.method} ${c.req.path}`);
	return auth.handler(c.req.raw);
});

export default authRouter;

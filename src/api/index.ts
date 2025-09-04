import { Hono } from "hono";
import type { AuthType } from "../lib/auth";
import { auth } from "../lib/auth";
import { systemLogger } from "../services/logger";
import adminRouter from "./admin";
import authRouter from "./auth";
import apiOpenApiRouter from "./index.openapi";
import meRouter from "./me";
import organizationRouter from "./organizations";

const apiRouter = new Hono<{ Variables: AuthType }>({
	strict: false,
});

// Add better-auth middleware to parse sessions for all routes
apiRouter.use("*", async (c, next) => {
	try {
		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});

		if (session) {
			c.set("user", session.user);
			c.set("session", session.session);
		}
	} catch (error) {
		// Session parsing failed, continue without session
		systemLogger.debug({ err: error }, "Session parsing failed");
	}

	await next();
});

// Add OpenAPI documented routes (health, system endpoints with full documentation)
apiRouter.route("/", apiOpenApiRouter);

// Public routes (no authentication required)
apiRouter.route("/auth", authRouter);

// Protected routes (authentication required)
apiRouter.use("/me/*", async (c, next) => {
	const session = c.get("session");
	systemLogger.debug({ session }, "Session details");
	if (!session) {
		return c.json({ error: "Unauthorized" }, 401);
	}
	await next();
});

apiRouter.route("/me", meRouter);

// Admin routes (require admin role)
apiRouter.route("/admin", adminRouter);

// Organization routes (require authentication)
apiRouter.use("/organizations/*", async (c, next) => {
	const session = c.get("session");
	if (!session) {
		return c.json({ error: "Unauthorized" }, 401);
	}
	await next();
});

apiRouter.route("/organizations", organizationRouter);

export default apiRouter;

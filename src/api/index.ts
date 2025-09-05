import { Hono } from "hono";
import adminRouter from "@/api/admin/admin";
import organizationRouter from "@/api/admin/organizations";
import authRouter from "@/api/auth/auth";
import meRouter from "@/api/auth/me";
import docsRouter from "@/api/docs";
import systemRouter from "@/api/system";
import type { AuthType } from "@/lib/auth";
import { auth } from "@/lib/auth";
import { systemLogger } from "@/services/logger";

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

apiRouter.route("/", systemRouter);
apiRouter.route("/auth", authRouter);
apiRouter.route("/docs", docsRouter);
apiRouter.route("/me", meRouter);
apiRouter.route("/admin", adminRouter);
apiRouter.route("/organizations", organizationRouter);

export default apiRouter;

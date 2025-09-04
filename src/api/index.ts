import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { prisma } from "prisma/prisma-client";
import type { AuthType } from "../lib/auth";
import { auth } from "../lib/auth";
import { requirePermission, requireRole } from "../lib/middleware/rbac";
import adminRouter from "./admin";
import authRouter from "./auth";
import meRouter from "./me";
import organizationRouter from "./organizations";

const apiRouter = new Hono<{ Variables: AuthType }>({
	strict: false,
});

apiRouter.get("/health/db", async (c) => {
	await prisma.$connect();
	return c.json({ status: "Database connected successfully" });
});

apiRouter.get("/health/api", async (c) => c.json({ status: "API is running" }));

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
		console.log("Session parsing failed:", error);
	}

	await next();
});

// Public routes (no authentication required)
apiRouter.route("/auth", authRouter);

// Protected routes (authentication required)
apiRouter.use("/me/*", async (c, next) => {
	const session = c.get("session");
	console.log("session", session);
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

// =============================================================================
// SYSTEM ROUTES (demonstrating RBAC features)
// =============================================================================

/**
 * GET /system/stats - Public system stats (no auth required)
 */
apiRouter.get("/system/stats", async (c) => {
	try {
		const [totalUsers, totalOrganizations] = await Promise.all([
			prisma.user.count({
				where: { banned: false },
			}),
			prisma.organization.count(),
		]);

		return c.json({
			stats: {
				totalUsers,
				totalOrganizations,
				timestamp: new Date().toISOString(),
			},
		});
	} catch (error) {
		console.error("Failed to fetch system stats:", error);
		throw new HTTPException(500, { message: "Failed to fetch system stats" });
	}
});

/**
 * GET /system/permissions - Get current user's permissions (auth required)
 */
apiRouter.get("/system/permissions", async (c) => {
	const user = c.get("user");
	const session = c.get("session");

	if (!user || !session) {
		return c.json({ error: "Authentication required" }, 401);
	}

	try {
		// Get user's role and basic permissions
		const userWithRole = await prisma.user.findUnique({
			where: { id: user.id },
			select: {
				id: true,
				name: true,
				email: true,
				role: true,
				banned: true,
			},
		});

		// Get user's organization memberships
		const organizationMemberships = await prisma.organizationMember.findMany({
			where: { userId: user.id },
			include: {
				organization: {
					select: { id: true, name: true, slug: true },
				},
			},
		});

		return c.json({
			user: userWithRole,
			organizationMemberships,
			hasSystemPermissions:
				userWithRole?.role === "admin" && !userWithRole?.banned,
		});
	} catch (error) {
		console.error("Failed to fetch user permissions:", error);
		throw new HTTPException(500, {
			message: "Failed to fetch user permissions",
		});
	}
});

/**
 * GET /system/user-count - Get user count (requires admin permission)
 */
apiRouter.get(
	"/system/user-count",
	requirePermission("user", "read"),
	async (c) => {
		try {
			const [totalUsers, activeUsers, bannedUsers] = await Promise.all([
				prisma.user.count(),
				prisma.user.count({ where: { banned: false } }),
				prisma.user.count({ where: { banned: true } }),
			]);

			return c.json({
				totalUsers,
				activeUsers,
				bannedUsers,
			});
		} catch (error) {
			console.error("Failed to fetch user count:", error);
			throw new HTTPException(500, { message: "Failed to fetch user count" });
		}
	},
);

/**
 * GET /system/admin-only - Admin only test route
 */
apiRouter.get("/system/admin-only", requireRole("admin"), async (c) => {
	const user = c.get("user");

	return c.json({
		message: "This is an admin-only endpoint",
		user: {
			id: user?.id,
			name: user?.name,
			email: user?.email,
		},
		timestamp: new Date().toISOString(),
	});
});

export default apiRouter;

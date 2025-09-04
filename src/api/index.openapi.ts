import { HTTPException } from "hono/http-exception";
import { prisma } from "prisma/prisma-client";
import { auth } from "../lib/auth";
import { requirePermission, requireRole } from "../lib/middleware/rbac";
import {
	CommonResponses,
	createOpenAPIApp,
	createRoute,
	DatabaseHealthSchema,
	ErrorSchema,
	HealthSchema,
	SystemStatsSchema,
	UserCountSchema,
} from "../lib/openapi";
import { logError, systemLogger } from "../services/logger";

// Create OpenAPI router
const apiRouter = createOpenAPIApp();

// =============================================================================
// HEALTH ROUTES
// =============================================================================

/**
 * GET /health/api - API Health Check
 */
const healthApiRoute = createRoute({
	method: "get",
	path: "/health/api",
	tags: ["Health"],
	summary: "API Health Check",
	description: "Check if the API is running and responding",
	responses: {
		200: {
			content: {
				"application/json": {
					schema: HealthSchema,
				},
			},
			description: "API is running",
		},
		500: CommonResponses[500],
	},
});

apiRouter.openapi(healthApiRoute, async (c) => {
	return c.json({ status: "API is running" }, 200);
});

/**
 * GET /health/db - Database Health Check
 */
const healthDbRoute = createRoute({
	method: "get",
	path: "/health/db",
	tags: ["Health"],
	summary: "Database Health Check",
	description: "Check database connectivity",
	responses: {
		200: {
			content: {
				"application/json": {
					schema: DatabaseHealthSchema,
				},
			},
			description: "Database is connected",
		},
		500: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "Database connection failed",
		},
	},
});

apiRouter.openapi(healthDbRoute, async (c) => {
	try {
		await prisma.$connect();
		return c.json({ status: "Database connected successfully" }, 200);
	} catch (error) {
		logError(error as Error, { operation: "database_health_check" });
		throw new HTTPException(500, { message: "Database connection failed" });
	}
});

// =============================================================================
// SYSTEM ROUTES
// =============================================================================

/**
 * GET /system/stats - Public System Statistics
 */
const systemStatsRoute = createRoute({
	method: "get",
	path: "/system/stats",
	tags: ["System"],
	summary: "Public System Statistics",
	description:
		"Get public system statistics including user and organization counts",
	responses: {
		200: {
			content: {
				"application/json": {
					schema: SystemStatsSchema,
				},
			},
			description: "System statistics",
		},
		500: CommonResponses[500],
	},
});

apiRouter.openapi(systemStatsRoute, async (c) => {
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
		logError(error as Error, { operation: "fetch_system_stats" });
		throw new HTTPException(500, { message: "Failed to fetch system stats" });
	}
});

/**
 * GET /system/user-count - User Count (Admin Only)
 */
const userCountRoute = createRoute({
	method: "get",
	path: "/system/user-count",
	tags: ["System"],
	summary: "Get User Count",
	description: "Get detailed user count statistics (admin only)",
	security: [{ sessionAuth: [] }],
	responses: {
		200: {
			content: {
				"application/json": {
					schema: UserCountSchema,
				},
			},
			description: "User count statistics",
		},
		401: CommonResponses[401],
		403: CommonResponses[403],
		500: CommonResponses[500],
	},
});

apiRouter.openapi(
	userCountRoute,
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
			logError(error as Error, {
				operation: "fetch_user_count",
				user: c.get("user"),
			});
			throw new HTTPException(500, { message: "Failed to fetch user count" });
		}
	},
);

/**
 * GET /system/admin-only - Admin Only Test Route
 */
const adminOnlyRoute = createRoute({
	method: "get",
	path: "/system/admin-only",
	tags: ["System"],
	summary: "Admin Only Test",
	description: "Test endpoint for admin-only access",
	security: [{ sessionAuth: [] }],
	responses: {
		200: {
			content: {
				"application/json": {
					schema: {
						type: "object",
						properties: {
							message: {
								type: "string",
								example: "This is an admin-only endpoint",
							},
							user: {
								type: "object",
								properties: {
									id: { type: "string", example: "user_123" },
									name: { type: "string", example: "Admin User" },
									email: { type: "string", example: "admin@example.com" },
								},
							},
							timestamp: { type: "string", format: "date-time" },
						},
					},
				},
			},
			description: "Admin access confirmed",
		},
		401: CommonResponses[401],
		403: CommonResponses[403],
		500: CommonResponses[500],
	},
});

apiRouter.openapi(adminOnlyRoute, requireRole("admin"), async (c) => {
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

/**
 * GET /system/permissions - Current User Permissions
 */
const permissionsRoute = createRoute({
	method: "get",
	path: "/system/permissions",
	tags: ["System"],
	summary: "Get Current User Permissions",
	description: "Get current user's permissions and organization memberships",
	security: [{ sessionAuth: [] }],
	responses: {
		200: {
			content: {
				"application/json": {
					schema: {
						type: "object",
						properties: {
							user: {
								type: "object",
								properties: {
									id: { type: "string" },
									name: { type: "string" },
									email: { type: "string" },
									role: { type: "string", enum: ["admin", "user"] },
									banned: { type: "boolean" },
								},
							},
							organizationMemberships: {
								type: "array",
								items: {
									type: "object",
									properties: {
										id: { type: "string" },
										organizationId: { type: "string" },
										userId: { type: "string" },
										role: {
											type: "string",
											enum: ["owner", "admin", "member"],
										},
										organization: {
											type: "object",
											properties: {
												id: { type: "string" },
												name: { type: "string" },
												slug: { type: "string" },
											},
										},
									},
								},
							},
							hasSystemPermissions: { type: "boolean" },
						},
					},
				},
			},
			description: "User permissions and memberships",
		},
		401: CommonResponses[401],
		500: CommonResponses[500],
	},
});

apiRouter.openapi(permissionsRoute, async (c) => {
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
		const organizationMemberships = await prisma.member.findMany({
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
		logError(error as Error, {
			operation: "fetch_user_permissions",
			user: c.get("user"),
		});
		throw new HTTPException(500, {
			message: "Failed to fetch user permissions",
		});
	}
});

// =============================================================================
// MIDDLEWARE - Add Better Auth session parsing
// =============================================================================

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

export default apiRouter;

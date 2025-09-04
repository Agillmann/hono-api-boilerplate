import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { prisma } from "prisma/prisma-client";
import { z } from "zod";
import type { AuthType } from "../lib/auth";
import { auth } from "../lib/auth";
import { requirePermission, requireRole } from "../lib/middleware/rbac";
import {
	getUserOrganizations,
	getUserWithRole,
	isAdmin,
} from "../lib/utils/rbac";

const adminRouter = new Hono<{ Variables: AuthType }>();

// Apply admin middleware to all routes
adminRouter.use("*", requireRole("admin"));

// Validation schemas
const createUserSchema = z.object({
	name: z.string().min(1, "Name is required"),
	email: z.string().email("Invalid email address"),
	password: z.string().min(8, "Password must be at least 8 characters"),
	role: z.enum(["user", "admin"]).optional().default("user"),
});

const updateUserSchema = z.object({
	name: z.string().min(1).optional(),
	email: z.string().email().optional(),
	role: z.enum(["user", "admin"]).optional(),
});

const banUserSchema = z.object({
	reason: z.string().min(1, "Ban reason is required"),
	expiresAt: z.string().datetime().optional(),
});

const createOrganizationSchema = z.object({
	name: z.string().min(1, "Organization name is required"),
	slug: z.string().min(1, "Organization slug is required").max(255),
	logo: z.string().url().optional(),
	ownerId: z.string().cuid("Invalid user ID"),
});

// =============================================================================
// USER MANAGEMENT ROUTES
// =============================================================================

/**
 * GET /admin/users - List all users with pagination
 */
adminRouter.get("/users", async (c) => {
	const page = parseInt(c.req.query("page") || "1");
	const limit = Math.min(parseInt(c.req.query("limit") || "20"), 100);
	const search = c.req.query("search") || "";
	const role = c.req.query("role") || "";
	const banned = c.req.query("banned");

	try {
		const where: any = {};

		if (search) {
			where.OR = [
				{ name: { contains: search } },
				{ email: { contains: search } },
			];
		}

		if (role) {
			where.role = role;
		}

		if (banned !== undefined) {
			where.banned = banned === "true";
		}

		const [users, total] = await Promise.all([
			prisma.user.findMany({
				where,
				select: {
					id: true,
					name: true,
					email: true,
					role: true,
					banned: true,
					banReason: true,
					banExpires: true,
					createdAt: true,
					updatedAt: true,
					_count: {
						select: {
							memberships: true,
							sessions: true,
						},
					},
				},
				skip: (page - 1) * limit,
				take: limit,
				orderBy: { createdAt: "desc" },
			}),
			prisma.user.count({ where }),
		]);

		return c.json({
			users,
			pagination: {
				page,
				limit,
				total,
				pages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error("Failed to fetch users:", error);
		throw new HTTPException(500, { message: "Failed to fetch users" });
	}
});

/**
 * GET /admin/users/:id - Get specific user details
 */
adminRouter.get("/users/:id", async (c) => {
	const userId = c.req.param("id");

	try {
		const user = await prisma.user.findUnique({
			where: { id: userId },
			include: {
				memberships: {
					include: {
						organization: {
							select: {
								id: true,
								name: true,
								slug: true,
							},
						},
					},
				},
				sessions: {
					select: {
						id: true,
						createdAt: true,
						updatedAt: true,
						ipAddress: true,
						userAgent: true,
					},
					orderBy: { updatedAt: "desc" },
					take: 10,
				},
				_count: {
					select: {
						memberships: true,
						sessions: true,
					},
				},
			},
		});

		if (!user) {
			throw new HTTPException(404, { message: "User not found" });
		}

		return c.json({ user });
	} catch (error) {
		console.error("Failed to fetch user:", error);
		throw new HTTPException(500, { message: "Failed to fetch user" });
	}
});

/**
 * POST /admin/users - Create new user
 */
adminRouter.post("/users", zValidator("json", createUserSchema), async (c) => {
	const data = c.req.valid("json");

	try {
		// Use Better Auth API to create user
		const result = await auth.api.signUpEmail({
			body: {
				name: data.name,
				email: data.email,
				password: data.password,
			},
		});

		if (!result.user) {
			throw new HTTPException(400, { message: "Failed to create user" });
		}

		// Update role if not default
		if (data.role && data.role !== "user") {
			await auth.api.setRole({
				body: {
					userId: result.user.id,
					role: data.role,
				},
				headers: c.req.raw.headers,
			});
		}

		return c.json({ user: result.user }, 201);
	} catch (error) {
		console.error("Failed to create user:", error);
		throw new HTTPException(500, { message: "Failed to create user" });
	}
});

/**
 * PUT /admin/users/:id - Update user
 */
adminRouter.put(
	"/users/:id",
	zValidator("json", updateUserSchema),
	async (c) => {
		const userId = c.req.param("id");
		const data = c.req.valid("json");

		try {
			// Update user role if provided
			if (data.role) {
				await auth.api.setRole({
					body: {
						userId,
						role: data.role,
					},
					headers: c.req.raw.headers,
				});
			}

			// Update other user fields
			const user = await prisma.user.update({
				where: { id: userId },
				data: {
					...(data.name && { name: data.name }),
					...(data.email && { email: data.email }),
				},
				select: {
					id: true,
					name: true,
					email: true,
					role: true,
					banned: true,
					createdAt: true,
					updatedAt: true,
				},
			});

			return c.json({ user });
		} catch (error) {
			console.error("Failed to update user:", error);
			throw new HTTPException(500, { message: "Failed to update user" });
		}
	},
);

/**
 * POST /admin/users/:id/ban - Ban user
 */
adminRouter.post(
	"/users/:id/ban",
	zValidator("json", banUserSchema),
	async (c) => {
		const userId = c.req.param("id");
		const { reason, expiresAt } = c.req.valid("json");

		try {
			await auth.api.banUser({
				body: {
					userId,
					banReason: reason,
					...(expiresAt && {
						banExpiresIn: Math.floor(
							(new Date(expiresAt).getTime() - Date.now()) / 1000,
						),
					}),
				},
				headers: c.req.raw.headers,
			});

			const user = await getUserWithRole(userId);
			return c.json({ user });
		} catch (error) {
			console.error("Failed to ban user:", error);
			throw new HTTPException(500, { message: "Failed to ban user" });
		}
	},
);

/**
 * POST /admin/users/:id/unban - Unban user
 */
adminRouter.post("/users/:id/unban", async (c) => {
	const userId = c.req.param("id");

	try {
		await auth.api.unbanUser({
			body: { userId },
			headers: c.req.raw.headers,
		});

		const user = await getUserWithRole(userId);
		return c.json({ user });
	} catch (error) {
		console.error("Failed to unban user:", error);
		throw new HTTPException(500, { message: "Failed to unban user" });
	}
});

/**
 * DELETE /admin/users/:id - Delete user
 */
adminRouter.delete("/users/:id", async (c) => {
	const userId = c.req.param("id");
	const currentUser = c.get("user");

	// Prevent self-deletion
	if (currentUser?.id === userId) {
		throw new HTTPException(400, { message: "Cannot delete your own account" });
	}

	try {
		await prisma.user.delete({
			where: { id: userId },
		});

		return c.json({ message: "User deleted successfully" });
	} catch (error) {
		console.error("Failed to delete user:", error);
		throw new HTTPException(500, { message: "Failed to delete user" });
	}
});

// =============================================================================
// ORGANIZATION MANAGEMENT ROUTES
// =============================================================================

/**
 * GET /admin/organizations - List all organizations
 */
adminRouter.get("/organizations", async (c) => {
	const page = parseInt(c.req.query("page") || "1");
	const limit = Math.min(parseInt(c.req.query("limit") || "20"), 100);
	const search = c.req.query("search") || "";

	try {
		const where: any = {};

		if (search) {
			where.OR = [
				{ name: { contains: search } },
				{ slug: { contains: search } },
			];
		}

		const [organizations, total] = await Promise.all([
			prisma.organization.findMany({
				where,
				include: {
					_count: {
						select: {
							members: true,
							teams: true,
						},
					},
				},
				skip: (page - 1) * limit,
				take: limit,
				orderBy: { createdAt: "desc" },
			}),
			prisma.organization.count({ where }),
		]);

		return c.json({
			organizations,
			pagination: {
				page,
				limit,
				total,
				pages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error("Failed to fetch organizations:", error);
		throw new HTTPException(500, { message: "Failed to fetch organizations" });
	}
});

/**
 * GET /admin/organizations/:id - Get organization details
 */
adminRouter.get("/organizations/:id", async (c) => {
	const organizationId = c.req.param("id");

	try {
		const organization = await prisma.organization.findUnique({
			where: { id: organizationId },
			include: {
				members: {
					include: {
						user: {
							select: {
								id: true,
								name: true,
								email: true,
								role: true,
							},
						},
					},
					orderBy: { createdAt: "desc" },
				},
				teams: {
					include: {
						_count: {
							select: {
								members: true,
							},
						},
					},
				},
				invitations: {
					include: {
						inviter: {
							select: {
								id: true,
								name: true,
								email: true,
							},
						},
					},
					orderBy: { createdAt: "desc" },
				},
				_count: {
					select: {
						members: true,
						teams: true,
						invitations: true,
					},
				},
			},
		});

		if (!organization) {
			throw new HTTPException(404, { message: "Organization not found" });
		}

		return c.json({ organization });
	} catch (error) {
		console.error("Failed to fetch organization:", error);
		throw new HTTPException(500, { message: "Failed to fetch organization" });
	}
});

/**
 * POST /admin/organizations - Create organization
 */
adminRouter.post(
	"/organizations",
	zValidator("json", createOrganizationSchema),
	async (c) => {
		const data = c.req.valid("json");

		try {
			// Check if user exists
			const owner = await prisma.user.findUnique({
				where: { id: data.ownerId },
				select: { id: true, name: true, email: true },
			});

			if (!owner) {
				throw new HTTPException(404, { message: "Owner user not found" });
			}

			// Check if slug is unique
			const existingOrg = await prisma.organization.findUnique({
				where: { slug: data.slug },
			});

			if (existingOrg) {
				throw new HTTPException(400, {
					message: "Organization slug already exists",
				});
			}

			// Create organization using Better Auth
			const organization = await auth.api.createOrganization({
				body: {
					name: data.name,
					slug: data.slug,
					...(data.logo && { logo: data.logo }),
				},
				headers: c.req.raw.headers,
			});

			return c.json({ organization }, 201);
		} catch (error) {
			console.error("Failed to create organization:", error);
			throw new HTTPException(500, {
				message: "Failed to create organization",
			});
		}
	},
);

/**
 * DELETE /admin/organizations/:id - Delete organization
 */
adminRouter.delete("/organizations/:id", async (c) => {
	const organizationId = c.req.param("id");

	try {
		// Use Better Auth API to delete organization
		await auth.api.deleteOrganization({
			body: { organizationId },
			headers: c.req.raw.headers,
		});

		return c.json({ message: "Organization deleted successfully" });
	} catch (error) {
		console.error("Failed to delete organization:", error);
		throw new HTTPException(500, { message: "Failed to delete organization" });
	}
});

// =============================================================================
// SYSTEM STATS AND MONITORING
// =============================================================================

/**
 * GET /admin/stats - Get system statistics
 */
adminRouter.get("/stats", async (c) => {
	try {
		const [
			totalUsers,
			totalOrganizations,
			totalSessions,
			recentUsers,
			recentOrganizations,
			bannedUsers,
		] = await Promise.all([
			prisma.user.count(),
			prisma.organization.count(),
			prisma.session.count(),
			prisma.user.count({
				where: {
					createdAt: {
						gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
					},
				},
			}),
			prisma.organization.count({
				where: {
					createdAt: {
						gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
					},
				},
			}),
			prisma.user.count({
				where: { banned: true },
			}),
		]);

		return c.json({
			stats: {
				users: {
					total: totalUsers,
					recent: recentUsers,
					banned: bannedUsers,
				},
				organizations: {
					total: totalOrganizations,
					recent: recentOrganizations,
				},
				sessions: {
					total: totalSessions,
				},
			},
		});
	} catch (error) {
		console.error("Failed to fetch stats:", error);
		throw new HTTPException(500, { message: "Failed to fetch statistics" });
	}
});

export default adminRouter;

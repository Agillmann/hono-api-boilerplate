import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { prisma } from "prisma/prisma-client";
import { z } from "zod";
import type { AuthType } from "../lib/auth";
import { getUserOrganizations, getUserWithRole } from "../lib/utils/rbac";
import { logError } from "../services/logger";

const meRouter = new Hono<{ Variables: AuthType }>();

// Validation schemas
const updateProfileSchema = z.object({
	name: z.string().min(1, "Name is required").optional(),
	email: z.string().email("Invalid email address").optional(),
});

/**
 * GET /me - Get current user profile
 */
meRouter.get("/", async (c) => {
	const user = c.get("user");
	const session = c.get("session");

	if (!user || !session) {
		throw new HTTPException(401, { message: "Authentication required" });
	}

	try {
		// Get full user details with role information
		const userWithRole = await getUserWithRole(user.id);

		return c.json({
			user: userWithRole,
			session: {
				id: session.id,
				createdAt: session.createdAt,
				updatedAt: session.updatedAt,
			},
		});
	} catch (error) {
		logError(error as Error, {
			operation: "fetch_user_profile",
			userId: user.id,
		});
		throw new HTTPException(500, { message: "Failed to fetch user profile" });
	}
});

/**
 * PUT /me - Update current user profile
 */
meRouter.put("/", zValidator("json", updateProfileSchema), async (c) => {
	const user = c.get("user");
	const data = c.req.valid("json");

	if (!user) {
		throw new HTTPException(401, { message: "Authentication required" });
	}

	try {
		const updatedUser = await prisma.user.update({
			where: { id: user.id },
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

		return c.json({ user: updatedUser });
	} catch (error) {
		logError(error as Error, {
			operation: "update_user_profile",
			userId: user.id,
			updateData: data,
		});
		throw new HTTPException(500, { message: "Failed to update user profile" });
	}
});

/**
 * GET /me/organizations - Get current user's organizations
 */
meRouter.get("/organizations", async (c) => {
	const user = c.get("user");

	if (!user) {
		throw new HTTPException(401, { message: "Authentication required" });
	}

	try {
		const organizations = await getUserOrganizations(user.id);
		return c.json({ organizations });
	} catch (error) {
		logError(error as Error, {
			operation: "fetch_user_organizations",
			userId: user.id,
		});
		throw new HTTPException(500, {
			message: "Failed to fetch user organizations",
		});
	}
});

/**
 * GET /me/teams - Get current user's team memberships
 */
meRouter.get("/teams", async (c) => {
	const user = c.get("user");

	if (!user) {
		throw new HTTPException(401, { message: "Authentication required" });
	}

	try {
		const teamMemberships = await prisma.teamMember.findMany({
			where: { userId: user.id },
			include: {
				team: {
					include: {
						organization: {
							select: {
								id: true,
								name: true,
								slug: true,
							},
						},
						_count: {
							select: {
								members: true,
							},
						},
					},
				},
			},
		});

		return c.json({ teams: teamMemberships });
	} catch (error) {
		logError(error as Error, {
			operation: "fetch_user_teams",
			userId: user.id,
		});
		throw new HTTPException(500, { message: "Failed to fetch user teams" });
	}
});

/**
 * GET /me/invitations - Get pending invitations for current user
 */
meRouter.get("/invitations", async (c) => {
	const user = c.get("user");

	if (!user) {
		throw new HTTPException(401, { message: "Authentication required" });
	}

	try {
		const invitations = await prisma.invitation.findMany({
			where: {
				email: user.email,
			},
			include: {
				organization: {
					select: {
						id: true,
						name: true,
						slug: true,
						logo: true,
					},
				},
				inviter: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
			orderBy: { createdAt: "desc" },
		});

		return c.json({ invitations });
	} catch (error) {
		logError(error as Error, {
			operation: "fetch_user_invitations",
			userId: user.id,
		});
		throw new HTTPException(500, {
			message: "Failed to fetch user invitations",
		});
	}
});

export default meRouter;

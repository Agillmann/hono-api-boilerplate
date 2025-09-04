import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { prisma } from "prisma/prisma-client";
import { z } from "zod";
import type { RBACContext } from "../lib/auth";
import { auth } from "../lib/auth";
import {
	requireOrganizationMember,
	requireOrganizationPermission,
	requireOrganizationRole,
} from "../lib/middleware/rbac";
import {
	getOrganizationWithUserRole,
	getUserAccessibleOrganizations,
} from "../lib/utils/rbac";
import { apiLogger, logError } from "../services/logger";

const organizationRouter = new Hono<{ Variables: RBACContext }>();

// Validation schemas
const createOrganizationSchema = z.object({
	name: z.string().min(1, "Organization name is required"),
	slug: z.string().min(1, "Organization slug is required").max(255),
	logo: z.string().url().optional(),
});

const updateOrganizationSchema = z.object({
	name: z.string().min(1).optional(),
	logo: z.string().url().optional(),
});

const inviteMemberSchema = z.object({
	email: z.string().email("Invalid email address"),
	role: z.enum(["member", "admin"]).default("member"),
});

const updateMemberRoleSchema = z.object({
	role: z.enum(["member", "admin", "owner"]),
});

const createTeamSchema = z.object({
	name: z.string().min(1, "Team name is required"),
});

// =============================================================================
// ORGANIZATION MANAGEMENT ROUTES
// =============================================================================

/**
 * GET /organizations - Get user's organizations
 */
organizationRouter.get("/", async (c) => {
	const user = c.get("user");

	if (!user) {
		throw new HTTPException(401, { message: "Authentication required" });
	}

	try {
		const organizations = await getUserAccessibleOrganizations(user.id);

		return c.json({ organizations });
	} catch (error) {
		logError(error as Error, {
			operation: "fetch_user_organizations",
			userId: user.id,
		});
		throw new HTTPException(500, { message: "Failed to fetch organizations" });
	}
});

/**
 * POST /organizations - Create new organization
 */
organizationRouter.post(
	"/",
	zValidator("json", createOrganizationSchema),
	async (c) => {
		const user = c.get("user");
		const data = c.req.valid("json");

		if (!user) {
			throw new HTTPException(401, { message: "Authentication required" });
		}

		try {
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
			logError(error as Error, {
				operation: "create_organization",
				userId: user.id,
				organizationData: { name: data.name, slug: data.slug },
			});
			throw new HTTPException(500, {
				message: "Failed to create organization",
			});
		}
	},
);

/**
 * GET /organizations/:organizationId - Get organization details
 */
organizationRouter.get(
	"/:organizationId",
	requireOrganizationMember(),
	async (c) => {
		const user = c.get("user");
		const organizationId = c.req.param("organizationId");

		if (!user) {
			throw new HTTPException(401, { message: "Authentication required" });
		}

		try {
			const organization = await getOrganizationWithUserRole(
				organizationId,
				user.id,
			);

			if (!organization) {
				throw new HTTPException(404, { message: "Organization not found" });
			}

			return c.json({ organization });
		} catch (error) {
			logError(error as Error, {
				operation: "fetch_organization_details",
				userId: user.id,
				organizationId,
			});
			throw new HTTPException(500, { message: "Failed to fetch organization" });
		}
	},
);

/**
 * PUT /organizations/:organizationId - Update organization
 */
organizationRouter.put(
	"/:organizationId",
	requireOrganizationPermission("organization", "update"),
	zValidator("json", updateOrganizationSchema),
	async (c) => {
		const organizationId = c.req.param("organizationId");
		const data = c.req.valid("json");

		try {
			const organization = await prisma.organization.update({
				where: { id: organizationId },
				data,
				include: {
					_count: {
						select: {
							members: true,
							teams: true,
						},
					},
				},
			});

			return c.json({ organization });
		} catch (error) {
			logError(error as Error, {
				operation: "update_organization",
				organizationId,
				updateData: data,
			});
			throw new HTTPException(500, {
				message: "Failed to update organization",
			});
		}
	},
);

/**
 * DELETE /organizations/:organizationId - Delete organization
 */
organizationRouter.delete(
	"/:organizationId",
	requireOrganizationRole("owner"),
	async (c) => {
		const organizationId = c.req.param("organizationId");

		try {
			// Use Better Auth API to delete organization
			await auth.api.deleteOrganization({
				body: { organizationId },
				headers: c.req.raw.headers,
			});

			return c.json({ message: "Organization deleted successfully" });
		} catch (error) {
			logError(error as Error, {
				operation: "delete_organization",
				organizationId,
			});
			throw new HTTPException(500, {
				message: "Failed to delete organization",
			});
		}
	},
);

// =============================================================================
// MEMBER MANAGEMENT ROUTES
// =============================================================================

/**
 * GET /organizations/:organizationId/members - Get organization members
 */
organizationRouter.get(
	"/:organizationId/members",
	requireOrganizationMember(),
	async (c) => {
		const organizationId = c.req.param("organizationId");

		try {
			const members = await prisma.organizationMember.findMany({
				where: { organizationId },
				include: {
					user: {
						select: {
							id: true,
							name: true,
							email: true,
							image: true,
						},
					},
				},
				orderBy: [{ role: "asc" }, { createdAt: "desc" }],
			});

			return c.json({ members });
		} catch (error) {
			logError(error as Error, {
				operation: "fetch_organization_members",
				organizationId,
			});
			throw new HTTPException(500, { message: "Failed to fetch members" });
		}
	},
);

/**
 * POST /organizations/:organizationId/invite - Invite member to organization
 */
organizationRouter.post(
	"/:organizationId/invite",
	requireOrganizationPermission("invitation", "create"),
	zValidator("json", inviteMemberSchema),
	async (c) => {
		const organizationId = c.req.param("organizationId");
		const { email, role } = c.req.valid("json");
		const user = c.get("user");

		if (!user) {
			throw new HTTPException(401, { message: "Authentication required" });
		}

		try {
			// Use Better Auth API to invite member
			const invitation = await auth.api.inviteUser({
				body: {
					organizationId,
					email,
					role,
				},
				headers: c.req.raw.headers,
			});

			return c.json({ invitation }, 201);
		} catch (error) {
			logError(error as Error, {
				operation: "invite_member",
				organizationId,
				inviteData: { email, role },
				inviterId: user.id,
			});
			throw new HTTPException(500, { message: "Failed to invite member" });
		}
	},
);

/**
 * PUT /organizations/:organizationId/members/:memberId - Update member role
 */
organizationRouter.put(
	"/:organizationId/members/:memberId",
	requireOrganizationPermission("member", "update"),
	zValidator("json", updateMemberRoleSchema),
	async (c) => {
		const organizationId = c.req.param("organizationId");
		const memberId = c.req.param("memberId");
		const { role } = c.req.valid("json");
		const user = c.get("user");

		if (!user) {
			throw new HTTPException(401, { message: "Authentication required" });
		}

		try {
			// Use Better Auth API to update member role
			const member = await auth.api.updateMemberRole({
				body: {
					organizationId,
					userId: memberId,
					role,
				},
				headers: c.req.raw.headers,
			});

			return c.json({ member });
		} catch (error) {
			logError(error as Error, {
				operation: "update_member_role",
				organizationId,
				memberId,
				newRole: role,
				updatedBy: user.id,
			});
			throw new HTTPException(500, { message: "Failed to update member role" });
		}
	},
);

/**
 * DELETE /organizations/:organizationId/members/:memberId - Remove member
 */
organizationRouter.delete(
	"/:organizationId/members/:memberId",
	requireOrganizationPermission("member", "delete"),
	async (c) => {
		const organizationId = c.req.param("organizationId");
		const memberId = c.req.param("memberId");

		try {
			// Use Better Auth API to remove member
			await auth.api.removeMember({
				body: {
					organizationId,
					userId: memberId,
				},
				headers: c.req.raw.headers,
			});

			return c.json({ message: "Member removed successfully" });
		} catch (error) {
			logError(error as Error, {
				operation: "remove_member",
				organizationId,
				memberId,
			});
			throw new HTTPException(500, { message: "Failed to remove member" });
		}
	},
);

// =============================================================================
// INVITATION MANAGEMENT ROUTES
// =============================================================================

/**
 * GET /organizations/:organizationId/invitations - Get pending invitations
 */
organizationRouter.get(
	"/:organizationId/invitations",
	requireOrganizationMember(),
	async (c) => {
		const organizationId = c.req.param("organizationId");

		try {
			const invitations = await prisma.invitation.findMany({
				where: { organizationId },
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
			});

			return c.json({ invitations });
		} catch (error) {
			logError(error as Error, {
				operation: "fetch_organization_invitations",
				organizationId,
			});
			throw new HTTPException(500, { message: "Failed to fetch invitations" });
		}
	},
);

/**
 * DELETE /organizations/:organizationId/invitations/:invitationId - Cancel invitation
 */
organizationRouter.delete(
	"/:organizationId/invitations/:invitationId",
	requireOrganizationPermission("invitation", "cancel"),
	async (c) => {
		const organizationId = c.req.param("organizationId");
		const invitationId = c.req.param("invitationId");

		try {
			await prisma.invitation.delete({
				where: {
					id: invitationId,
					organizationId,
				},
			});

			return c.json({ message: "Invitation cancelled successfully" });
		} catch (error) {
			logError(error as Error, {
				operation: "cancel_invitation",
				organizationId,
				invitationId,
			});
			throw new HTTPException(500, { message: "Failed to cancel invitation" });
		}
	},
);

// =============================================================================
// TEAM MANAGEMENT ROUTES
// =============================================================================

/**
 * GET /organizations/:organizationId/teams - Get organization teams
 */
organizationRouter.get(
	"/:organizationId/teams",
	requireOrganizationMember(),
	async (c) => {
		const organizationId = c.req.param("organizationId");

		try {
			const teams = await prisma.team.findMany({
				where: { organizationId },
				include: {
					_count: {
						select: {
							members: true,
						},
					},
				},
				orderBy: { createdAt: "desc" },
			});

			return c.json({ teams });
		} catch (error) {
			logError(error as Error, {
				operation: "fetch_organization_teams",
				organizationId,
			});
			throw new HTTPException(500, { message: "Failed to fetch teams" });
		}
	},
);

/**
 * POST /organizations/:organizationId/teams - Create new team
 */
organizationRouter.post(
	"/:organizationId/teams",
	requireOrganizationPermission("team", "create"),
	zValidator("json", createTeamSchema),
	async (c) => {
		const organizationId = c.req.param("organizationId");
		const { name } = c.req.valid("json");

		try {
			const team = await prisma.team.create({
				data: {
					name,
					organizationId,
				},
				include: {
					_count: {
						select: {
							members: true,
						},
					},
				},
			});

			return c.json({ team }, 201);
		} catch (error) {
			logError(error as Error, {
				operation: "create_team",
				organizationId,
				teamData: { name },
			});
			throw new HTTPException(500, { message: "Failed to create team" });
		}
	},
);

/**
 * GET /organizations/:organizationId/teams/:teamId - Get team details
 */
organizationRouter.get(
	"/:organizationId/teams/:teamId",
	requireOrganizationMember(),
	async (c) => {
		const organizationId = c.req.param("organizationId");
		const teamId = c.req.param("teamId");

		try {
			const team = await prisma.team.findFirst({
				where: {
					id: teamId,
					organizationId,
				},
				include: {
					members: {
						include: {
							user: {
								select: {
									id: true,
									name: true,
									email: true,
									image: true,
								},
							},
						},
					},
				},
			});

			if (!team) {
				throw new HTTPException(404, { message: "Team not found" });
			}

			return c.json({ team });
		} catch (error) {
			logError(error as Error, {
				operation: "fetch_team_details",
				organizationId,
				teamId,
			});
			throw new HTTPException(500, { message: "Failed to fetch team" });
		}
	},
);

/**
 * DELETE /organizations/:organizationId/teams/:teamId - Delete team
 */
organizationRouter.delete(
	"/:organizationId/teams/:teamId",
	requireOrganizationPermission("team", "delete"),
	async (c) => {
		const organizationId = c.req.param("organizationId");
		const teamId = c.req.param("teamId");

		try {
			await prisma.team.delete({
				where: {
					id: teamId,
					organizationId,
				},
			});

			return c.json({ message: "Team deleted successfully" });
		} catch (error) {
			logError(error as Error, {
				operation: "delete_team",
				organizationId,
				teamId,
			});
			throw new HTTPException(500, { message: "Failed to delete team" });
		}
	},
);

export default organizationRouter;

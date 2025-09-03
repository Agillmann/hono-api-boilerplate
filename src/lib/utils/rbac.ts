import type { Context } from "hono";
import { prisma } from "@/prisma/prisma-client";
import type { RBACContext } from "../auth";
import { auth } from "../auth";

// Types for our RBAC operations
export interface UserWithRole {
	id: string;
	name: string;
	email: string;
	role: string;
	banned: boolean;
	banReason?: string | null;
	banExpires?: Date | null;
}

export interface OrganizationMembership {
	id: string;
	organizationId: string;
	userId: string;
	role: string;
	organization: {
		id: string;
		name: string;
		slug: string;
	};
}

/**
 * Get user with role information
 */
export async function getUserWithRole(
	userId: string,
): Promise<UserWithRole | null> {
	try {
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				name: true,
				email: true,
				role: true,
				banned: true,
				banReason: true,
				banExpires: true,
			},
		});

		return user;
	} catch (error) {
		console.error("Failed to get user with role:", error);
		return null;
	}
}

/**
 * Get user's organizations with their roles
 */
export async function getUserOrganizations(
	userId: string,
): Promise<OrganizationMembership[]> {
	try {
		const memberships = await prisma.organizationMember.findMany({
			where: { userId },
			include: {
				organization: {
					select: {
						id: true,
						name: true,
						slug: true,
					},
				},
			},
		});

		return memberships;
	} catch (error) {
		console.error("Failed to get user organizations:", error);
		return [];
	}
}

/**
 * Check if user has app-level admin permissions
 */
export async function isAdmin(userId: string): Promise<boolean> {
	try {
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: { role: true, banned: true },
		});

		return user?.role === "admin" && !user?.banned;
	} catch (error) {
		console.error("Failed to check admin status:", error);
		return false;
	}
}

/**
 * Check if user is owner or admin of organization
 */
export async function isOrganizationOwnerOrAdmin(
	userId: string,
	organizationId: string,
): Promise<boolean> {
	try {
		const membership = await prisma.organizationMember.findUnique({
			where: {
				organizationId_userId: {
					organizationId,
					userId,
				},
			},
			select: { role: true },
		});

		return membership?.role === "owner" || membership?.role === "admin";
	} catch (error) {
		console.error("Failed to check organization ownership:", error);
		return false;
	}
}

/**
 * Get organization details with user's role
 */
export async function getOrganizationWithUserRole(
	organizationId: string,
	userId: string,
) {
	try {
		const organization = await prisma.organization.findUnique({
			where: { id: organizationId },
			include: {
				members: {
					where: { userId },
					select: { role: true },
					take: 1,
				},
				_count: {
					select: {
						members: true,
						teams: true,
					},
				},
			},
		});

		if (!organization) return null;

		return {
			...organization,
			userRole: organization.members[0]?.role || null,
			memberCount: organization._count.members,
			teamCount: organization._count.teams,
		};
	} catch (error) {
		console.error("Failed to get organization with user role:", error);
		return null;
	}
}

/**
 * Extract organization ID from various sources in context
 */
export function getOrganizationId(
	c: Context<{ Variables: RBACContext }>,
): string | null {
	// Try context first
	let orgId = c.get("organizationId");

	// Try route parameters
	if (!orgId) {
		orgId = c.req.param("organizationId") || c.req.param("orgId");
	}

	// Try query parameters
	if (!orgId) {
		orgId = c.req.query("organizationId") || c.req.query("orgId");
	}

	return orgId || null;
}

/**
 * Validate organization access and set context
 */
export async function validateOrganizationAccess(
	c: Context<{ Variables: RBACContext }>,
	requiredRole?: string[],
): Promise<{
	organization: any;
	userRole: string;
	membership: any;
}> {
	const user = c.get("user");
	const organizationId = getOrganizationId(c);

	if (!user) {
		throw new Error("Authentication required");
	}

	if (!organizationId) {
		throw new Error("Organization ID required");
	}

	const membership = await prisma.organizationMember.findUnique({
		where: {
			organizationId_userId: {
				organizationId,
				userId: user.id,
			},
		},
		include: {
			organization: true,
		},
	});

	if (!membership) {
		throw new Error("Not a member of this organization");
	}

	if (requiredRole && !requiredRole.includes(membership.role)) {
		throw new Error(
			`Required role: ${requiredRole.join(" or ")}. Current role: ${membership.role}`,
		);
	}

	// Set context for downstream middleware
	c.set("organizationId", organizationId);
	c.set("organizationRole", membership.role);

	return {
		organization: membership.organization,
		userRole: membership.role,
		membership,
	};
}

/**
 * Check if user can perform action on resource within organization
 */
export async function canPerformAction(
	userId: string,
	organizationId: string,
	resource: string,
	action: string,
): Promise<boolean> {
	try {
		// First check if user is app-level admin (can do anything)
		if (await isAdmin(userId)) {
			return true;
		}

		// Check organization-specific permission
		const result = await auth.api.hasPermission({
			body: {
				organizationId,
				permission: { [resource]: [action] },
			},
			headers: new Headers(), // You might need to pass proper headers
		});
		return result.success || false;
	} catch (error) {
		console.error("Failed to check action permission:", error);
		return false;
	}
}

/**
 * Get all organizations user has access to with their roles
 */
export async function getUserAccessibleOrganizations(userId: string) {
	try {
		return await prisma.organization.findMany({
			where: {
				members: {
					some: {
						userId,
					},
				},
			},
			include: {
				members: {
					where: { userId },
					select: { role: true },
				},
				_count: {
					select: {
						members: true,
						teams: true,
					},
				},
			},
		});
	} catch (error) {
		console.error("Failed to get accessible organizations:", error);
		return [];
	}
}

import type { Context, MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { prisma } from "prisma/prisma-client";
import { logError } from "../../services/logger";
import type { RBACContext } from "../auth";
import { auth } from "../auth";
import {
	type AppRole,
	hasOrganizationPermission,
	hasPermission,
	type OrgRole,
} from "../permissions";

/**
 * Middleware to require specific app-level permissions
 */
export function requirePermission(
	resource: string,
	action: string,
): MiddlewareHandler<{ Variables: RBACContext }> {
	return async (c, next) => {
		const user = c.get("user");
		const session = c.get("session");

		if (!user || !session) {
			throw new HTTPException(401, { message: "Authentication required" });
		}

		try {
			// Get user role from database or user object
			const userRole = (user.role as AppRole) || "user";

			// Check if user has the required permission
			if (
				!hasPermission(
					userRole,
					resource as keyof typeof import("../permissions").permissions,
					action,
				)
			) {
				throw new HTTPException(403, {
					message: `Insufficient permissions: ${resource}.${action}`,
				});
			}

			await next();
		} catch (error) {
			logError(error as Error, {
				operation: "permission_check",
				resource,
				action,
				user: c.get("user"),
			});
			throw new HTTPException(500, { message: "Permission check failed" });
		}
	};
}

/**
 * Middleware to require specific role
 */
export function requireRole(
	...roles: string[]
): MiddlewareHandler<{ Variables: RBACContext }> {
	return async (c, next) => {
		const user = c.get("user");

		if (!user) {
			throw new HTTPException(401, { message: "Authentication required" });
		}

		// Check user's role (assuming role is stored in user object)
		const userRole = user.role || "user";

		if (!roles.includes(userRole)) {
			throw new HTTPException(403, {
				message: `Required role: ${roles.join(" or ")}. Current role: ${userRole}`,
			});
		}

		await next();
	};
}

/**
 * Middleware to require organization membership
 */
export function requireOrganizationMember(): MiddlewareHandler<{
	Variables: RBACContext;
}> {
	return async (c, next) => {
		const user = c.get("user");
		let organizationId = c.get("organizationId");

		if (!user) {
			throw new HTTPException(401, { message: "Authentication required" });
		}

		// Try to get organization ID from route params if not set in context
		if (!organizationId) {
			organizationId = c.req.param("organizationId");
		}

		if (!organizationId) {
			throw new HTTPException(400, { message: "Organization ID required" });
		}

		try {
			// Check organization membership using direct database query
			const membership = await prisma.member.findUnique({
				where: {
					organizationId_userId: {
						organizationId,
						userId: user.id,
					},
				},
				select: { role: true },
			});

			if (!membership) {
				throw new HTTPException(403, {
					message: "Not a member of this organization",
				});
			}

			// Set organization context for downstream middleware
			c.set("organizationId", organizationId);
			c.set("organizationRole", membership.role || "member");

			await next();
		} catch (error) {
			logError(error as Error, {
				operation: "organization_membership_check",
				organizationId: c.req.param("organizationId"),
				user: c.get("user"),
			});
			throw new HTTPException(403, {
				message: "Organization access denied",
			});
		}
	};
}

/**
 * Middleware to require organization permission
 */
export function requireOrganizationPermission(
	resource: string,
	action: string,
): MiddlewareHandler<{ Variables: RBACContext }> {
	return async (c, next) => {
		const user = c.get("user");
		let organizationId = c.get("organizationId");

		if (!user) {
			throw new HTTPException(401, { message: "Authentication required" });
		}

		// Try to get organization ID from route params if not set in context
		if (!organizationId) {
			organizationId = c.req.param("organizationId");
		}

		if (!organizationId) {
			throw new HTTPException(400, { message: "Organization ID required" });
		}

		try {
			// Get user's organization role
			const membership = await prisma.member.findUnique({
				where: {
					organizationId_userId: {
						organizationId,
						userId: user.id,
					},
				},
				select: { role: true },
			});

			if (!membership) {
				throw new HTTPException(403, {
					message: "Not a member of this organization",
				});
			}

			const userOrgRole = (membership.role as OrgRole) || "member";

			// Check if user has the required organization permission
			if (
				!hasOrganizationPermission(
					userOrgRole,
					resource as keyof typeof import("../permissions").organizationRolePermissions.owner,
					action,
				)
			) {
				throw new HTTPException(403, {
					message: `Insufficient organization permissions: ${resource}.${action}`,
				});
			}

			// Set organization context
			c.set("organizationId", organizationId);

			await next();
		} catch (error) {
			logError(error as Error, {
				operation: "organization_permission_check",
				resource,
				action,
				organizationId: c.req.param("organizationId"),
				user: c.get("user"),
			});
			throw new HTTPException(403, {
				message: "Organization permission denied",
			});
		}
	};
}

/**
 * Middleware to require organization role
 */
export function requireOrganizationRole(
	...roles: string[]
): MiddlewareHandler<{ Variables: RBACContext }> {
	return async (c, next) => {
		const user = c.get("user");
		let organizationId = c.get("organizationId");

		if (!user) {
			throw new HTTPException(401, { message: "Authentication required" });
		}

		if (!organizationId) {
			organizationId = c.req.param("organizationId");
		}

		if (!organizationId) {
			throw new HTTPException(400, { message: "Organization ID required" });
		}

		try {
			// Get organization membership details
			const membership = await prisma.member.findUnique({
				where: {
					organizationId_userId: {
						organizationId,
						userId: user.id,
					},
				},
				select: { role: true },
			});

			if (!membership) {
				throw new HTTPException(403, {
					message: "Not a member of this organization",
				});
			}

			const userRole = membership.role || "member";

			if (!roles.includes(userRole)) {
				throw new HTTPException(403, {
					message: `Required organization role: ${roles.join(" or ")}. Current role: ${userRole}`,
				});
			}

			// Set context
			c.set("organizationId", organizationId);
			c.set("organizationRole", userRole);

			await next();
		} catch (error) {
			logError(error as Error, {
				operation: "organization_role_check",
				requiredRoles: roles,
				organizationId: c.req.param("organizationId"),
				user: c.get("user"),
			});
			throw new HTTPException(403, {
				message: "Organization role check failed",
			});
		}
	};
}

/**
 * Utility function to check permissions in route handlers
 */
export async function checkPermission(
	c: Context<{ Variables: RBACContext }>,
	resource: string,
	action: string,
): Promise<boolean> {
	const user = c.get("user");

	if (!user) {
		return false;
	}

	try {
		const result = await auth.api.hasPermission({
			body: {
				permission: { [resource]: [action] },
			},
			headers: c.req.raw.headers,
		});
		return result.success || false;
	} catch (error) {
		logError(error as Error, {
			operation: "simple_permission_check",
			resource,
			action,
			user: c.get("user"),
		});
		return false;
	}
}

/**
 * Utility function to check organization permissions in route handlers
 */
export async function checkOrganizationPermission(
	c: Context<{ Variables: RBACContext }>,
	resource: string,
	action: string,
	organizationId?: string,
): Promise<boolean> {
	const user = c.get("user");
	const orgId =
		organizationId || c.get("organizationId") || c.req.param("organizationId");

	if (!user || !orgId) {
		return false;
	}

	try {
		const result = await auth.api.hasPermission({
			body: {
				organizationId: orgId,
				permission: { [resource]: [action] },
			},
			headers: c.req.raw.headers,
		});
		return result.success || false;
	} catch (error) {
		logError(error as Error, {
			operation: "simple_organization_permission_check",
			resource,
			action,
			organizationId: orgId,
			user: user,
		});
		return false;
	}
}

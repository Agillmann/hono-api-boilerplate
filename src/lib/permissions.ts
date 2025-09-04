// Custom RBAC permission system
export const permissions = {
	user: ["create", "read", "update", "delete", "ban", "impersonate"],
	project: ["create", "read", "update", "delete", "manage"],
	admin: ["read", "manage"],
	organization: ["create", "read", "update", "delete", "manage", "invite"],
	team: ["create", "read", "update", "delete", "manage"],
	invitation: ["create", "read", "update", "delete", "cancel"],
	member: ["create", "read", "update", "delete"],
} as const;

// Define roles with their permissions
export const rolePermissions = {
	admin: {
		user: ["create", "read", "update", "delete", "ban", "impersonate"],
		project: ["create", "read", "update", "delete", "manage"],
		admin: ["read", "manage"],
		organization: ["create", "read", "update", "delete", "manage", "invite"],
		team: ["create", "read", "update", "delete", "manage"],
		invitation: ["create", "read", "update", "delete", "cancel"],
		member: ["create", "read", "update", "delete"],
	},
	user: {
		project: ["create", "read", "update"],
		organization: ["read"],
		team: ["read"],
		invitation: ["read"],
		member: ["read"],
	},
} as const;

// Organization-specific roles
export const organizationRolePermissions = {
	owner: {
		project: ["create", "read", "update", "delete", "manage"],
		organization: ["read", "update", "manage", "invite"],
		team: ["create", "read", "update", "delete", "manage"],
		invitation: ["create", "read", "update", "delete", "cancel"],
		member: ["create", "read", "update", "delete"],
		user: ["read"], // Can view organization members
	},
	admin: {
		project: ["create", "read", "update", "delete"],
		organization: ["read", "update", "invite"],
		team: ["create", "read", "update", "delete"],
		invitation: ["create", "read", "update", "delete", "cancel"],
		member: ["create", "read", "update", "delete"],
		user: ["read"],
	},
	member: {
		project: ["create", "read", "update"],
		organization: ["read"],
		team: ["read"],
		invitation: ["read"],
		member: ["read"],
		user: ["read"],
	},
} as const;

// Helper functions to check permissions
export function hasPermission(
	role: keyof typeof rolePermissions,
	resource: keyof typeof permissions,
	action: string,
): boolean {
	const rolePerms = rolePermissions[role];
	const resourcePerms = rolePerms[resource] as readonly string[] | undefined;
	return resourcePerms ? resourcePerms.includes(action) : false;
}

export function hasOrganizationPermission(
	role: keyof typeof organizationRolePermissions,
	resource: keyof typeof organizationRolePermissions.owner,
	action: string,
): boolean {
	const rolePerms = organizationRolePermissions[role];
	const resourcePerms = rolePerms[resource] as readonly string[] | undefined;
	return resourcePerms ? resourcePerms.includes(action) : false;
}

// Type definitions for Better Auth configuration
export type AppRole = keyof typeof rolePermissions;
export type OrgRole = keyof typeof organizationRolePermissions;

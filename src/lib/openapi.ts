import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import type { RBACContext } from "./auth";

// =============================================================================
// OPENAPI CONFIGURATION
// =============================================================================

export const createOpenAPIApp = () => {
	return new OpenAPIHono<{ Variables: RBACContext }>({
		strict: false,
		defaultHook: (result, c) => {
			if (!result.success) {
				return c.json(
					{
						error: "Validation failed",
						details: result.error.issues,
					},
					400,
				);
			}
		},
	});
};

// API Information
export const API_INFO = {
	openapi: "3.0.3",
	info: {
		title: "API Boilerplate",
		version: "1.0.0",
		description: `
# Hono-based REST API with Comprehensive RBAC System

A sophisticated REST API boilerplate built with Hono and TypeScript, featuring:

- **Authentication**: Better-Auth with email/password, admin and organization plugins
- **Authorization**: Role-Based Access Control (RBAC) with granular permissions
- **Multi-tenancy**: Organization-based access control with roles and teams
- **Type Safety**: Full TypeScript support with Zod validation
- **Documentation**: Auto-generated OpenAPI 3.0 specification

## Authentication

The API uses Better-Auth for authentication with session-based access control.

### App-Level Roles
- **admin**: System administrators with full access
- **user**: Regular authenticated users

### Organization Roles  
- **owner**: Full organization control
- **admin**: Manage members and settings
- **member**: Basic organization access

## Quick Start

1. **Authentication**: Use \`POST /auth/sign-in\` to authenticate
2. **Session**: Session cookie is automatically set on successful login
3. **Access**: Use authenticated endpoints with session cookie
4. **RBAC**: Permissions are checked based on user role and organization membership
		`,
		contact: {
			name: "API Support",
			url: "https://github.com/agillmann/api-boilerplate",
		},
		license: {
			name: "MIT",
			url: "https://opensource.org/licenses/MIT",
		},
	},
	servers: [
		{
			url: "http://localhost:3000/api/v1",
			description: "Development server",
		},
		{
			url: "https://api.yourdomain.com/v1",
			description: "Production server",
		},
	],
	tags: [
		{
			name: "Health",
			description: "Health check and system status endpoints",
		},
		{
			name: "System",
			description: "System information and statistics",
		},
		{
			name: "Authentication",
			description: "Better-Auth managed authentication endpoints",
		},
		{
			name: "User Profile",
			description: "Current user profile and personal data management",
		},
		{
			name: "Administration",
			description: "Global admin endpoints (admin role required)",
		},
		{
			name: "Organizations",
			description: "Multi-tenant organization management",
		},
		{
			name: "Teams",
			description: "Team management within organizations",
		},
		{
			name: "Invitations",
			description: "Organization invitation management",
		},
	],
	components: {
		securitySchemes: {
			sessionAuth: {
				type: "apiKey",
				in: "cookie",
				name: "better-auth.session_token",
				description:
					"Session-based authentication using Better-Auth session cookie",
			},
		},
	},
};

// =============================================================================
// COMMON SCHEMAS
// =============================================================================

// Error schemas
export const ErrorSchema = z
	.object({
		error: z.string().openapi({ example: "Not found" }),
		details: z.string().optional().openapi({ example: "User not found" }),
	})
	.openapi("Error");

export const ValidationErrorSchema = z
	.object({
		error: z.string().openapi({ example: "Validation failed" }),
		details: z
			.array(
				z.object({
					path: z.array(z.string()),
					message: z.string(),
					code: z.string(),
				}),
			)
			.openapi({
				example: [
					{ path: ["name"], message: "Required", code: "invalid_type" },
				],
			}),
	})
	.openapi("ValidationError");

// Success schemas
export const SuccessMessageSchema = z
	.object({
		message: z
			.string()
			.openapi({ example: "Operation completed successfully" }),
	})
	.openapi("SuccessMessage");

// Pagination schemas
export const PaginationQuerySchema = z.object({
	page: z.string().optional().default("1").openapi({ example: "1" }),
	limit: z.string().optional().default("10").openapi({ example: "10" }),
	search: z.string().optional().openapi({ example: "john" }),
});

export const PaginationMetaSchema = z
	.object({
		page: z.number().openapi({ example: 1 }),
		limit: z.number().openapi({ example: 10 }),
		total: z.number().openapi({ example: 100 }),
		totalPages: z.number().openapi({ example: 10 }),
		hasNext: z.boolean().openapi({ example: true }),
		hasPrev: z.boolean().openapi({ example: false }),
	})
	.openapi("PaginationMeta");

// =============================================================================
// USER SCHEMAS
// =============================================================================

export const UserSchema = z
	.object({
		id: z.string().openapi({ example: "user_123" }),
		name: z.string().openapi({ example: "John Doe" }),
		email: z.email().openapi({ example: "john@example.com" }),
		role: z.enum(["admin", "user"]).openapi({ example: "user" }),
		banned: z.boolean().openapi({ example: false }),
		banReason: z.string().nullable().openapi({ example: null }),
		banExpires: z.iso.datetime().nullable().openapi({ example: null }),
		createdAt: z.iso.datetime().openapi({ example: "2024-01-01T00:00:00Z" }),
		updatedAt: z.iso.datetime().openapi({ example: "2024-01-01T00:00:00Z" }),
	})
	.openapi("User");

export const CreateUserSchema = z
	.object({
		name: z.string().min(1).openapi({ example: "John Doe" }),
		email: z.email().openapi({ example: "john@example.com" }),
		password: z.string().min(8).openapi({ example: "securepassword123" }),
		role: z
			.enum(["admin", "user"])
			.optional()
			.default("user")
			.openapi({ example: "user" }),
	})
	.openapi("CreateUser");

export const UpdateUserSchema = z
	.object({
		name: z.string().min(1).optional().openapi({ example: "John Doe" }),
		email: z.email().optional().openapi({ example: "john@example.com" }),
		role: z.enum(["admin", "user"]).optional().openapi({ example: "user" }),
	})
	.openapi("UpdateUser");

// =============================================================================
// ORGANIZATION SCHEMAS
// =============================================================================

export const OrganizationSchema = z
	.object({
		id: z.string().openapi({ example: "org_123" }),
		name: z.string().openapi({ example: "Acme Corporation" }),
		slug: z.string().openapi({ example: "acme-corp" }),
		logo: z
			.url()
			.nullable()
			.openapi({ example: "https://example.com/logo.png" }),
		createdAt: z.iso.datetime().openapi({ example: "2024-01-01T00:00:00Z" }),
		updatedAt: z.iso.datetime().openapi({ example: "2024-01-01T00:00:00Z" }),
		metadata: z
			.record(z.string(), z.unknown())
			.nullable()
			.openapi({ example: {} }),
		memberCount: z.number().optional().openapi({ example: 5 }),
		teamCount: z.number().optional().openapi({ example: 2 }),
	})
	.openapi("Organization");

export const CreateOrganizationSchema = z
	.object({
		name: z.string().min(1).openapi({ example: "Acme Corporation" }),
		slug: z.string().min(1).max(255).openapi({ example: "acme-corp" }),
		logo: z
			.url()
			.optional()
			.openapi({ example: "https://example.com/logo.png" }),
	})
	.openapi("CreateOrganization");

export const UpdateOrganizationSchema = z
	.object({
		name: z.string().min(1).optional().openapi({ example: "Acme Corporation" }),
		logo: z
			.url()
			.optional()
			.openapi({ example: "https://example.com/logo.png" }),
	})
	.openapi("UpdateOrganization");

// =============================================================================
// MEMBER SCHEMAS
// =============================================================================

export const MemberSchema = z
	.object({
		id: z.string().openapi({ example: "member_123" }),
		organizationId: z.string().openapi({ example: "org_123" }),
		userId: z.string().openapi({ example: "user_123" }),
		role: z.enum(["owner", "admin", "member"]).openapi({ example: "member" }),
		createdAt: z.iso.datetime().openapi({ example: "2024-01-01T00:00:00Z" }),
		updatedAt: z.iso.datetime().openapi({ example: "2024-01-01T00:00:00Z" }),
		user: UserSchema.optional(),
		organization: OrganizationSchema.optional(),
	})
	.openapi("Member");

export const InviteMemberSchema = z
	.object({
		email: z.email().openapi({ example: "john@example.com" }),
		role: z
			.enum(["member", "admin"])
			.default("member")
			.openapi({ example: "member" }),
	})
	.openapi("InviteMember");

export const UpdateMemberRoleSchema = z
	.object({
		role: z.enum(["member", "admin", "owner"]).openapi({ example: "admin" }),
	})
	.openapi("UpdateMemberRole");

// =============================================================================
// TEAM SCHEMAS
// =============================================================================

export const TeamSchema = z
	.object({
		id: z.string().openapi({ example: "team_123" }),
		name: z.string().openapi({ example: "Engineering" }),
		organizationId: z.string().openapi({ example: "org_123" }),
		createdAt: z.iso.datetime().openapi({ example: "2024-01-01T00:00:00Z" }),
		updatedAt: z.iso.datetime().openapi({ example: "2024-01-01T00:00:00Z" }),
		memberCount: z.number().optional().openapi({ example: 3 }),
	})
	.openapi("Team");

export const CreateTeamSchema = z
	.object({
		name: z.string().min(1).openapi({ example: "Engineering" }),
	})
	.openapi("CreateTeam");

// =============================================================================
// INVITATION SCHEMAS
// =============================================================================

export const InvitationSchema = z
	.object({
		id: z.string().openapi({ example: "invitation_123" }),
		email: z.email().openapi({ example: "john@example.com" }),
		role: z.enum(["member", "admin"]).openapi({ example: "member" }),
		organizationId: z.string().openapi({ example: "org_123" }),
		inviterId: z.string().openapi({ example: "user_456" }),
		status: z
			.enum(["pending", "accepted", "expired"])
			.openapi({ example: "pending" }),
		expiresAt: z.iso.datetime().openapi({ example: "2024-02-01T00:00:00Z" }),
		createdAt: z.iso.datetime().openapi({ example: "2024-01-01T00:00:00Z" }),
		organization: OrganizationSchema.optional(),
		inviter: UserSchema.optional(),
	})
	.openapi("Invitation");

// =============================================================================
// SYSTEM SCHEMAS
// =============================================================================

export const SystemStatsSchema = z
	.object({
		stats: z.object({
			totalUsers: z.number().openapi({ example: 1250 }),
			totalOrganizations: z.number().openapi({ example: 85 }),
			timestamp: z.iso.datetime().openapi({ example: "2024-01-01T00:00:00Z" }),
		}),
	})
	.openapi("SystemStats");

export const UserCountSchema = z
	.object({
		totalUsers: z.number().openapi({ example: 1250 }),
		activeUsers: z.number().openapi({ example: 1200 }),
		bannedUsers: z.number().openapi({ example: 50 }),
	})
	.openapi("UserCount");

// =============================================================================
// HEALTH SCHEMAS
// =============================================================================

export const HealthSchema = z
	.object({
		status: z.string().openapi({ example: "API is running" }),
	})
	.openapi("Health");

export const DatabaseHealthSchema = z
	.object({
		status: z.string().openapi({ example: "Database connected successfully" }),
	})
	.openapi("DatabaseHealth");

// =============================================================================
// RESPONSE WRAPPERS
// =============================================================================

export const createPaginatedResponse = <T extends z.ZodTypeAny>(
	dataSchema: T,
	name?: string,
) =>
	z
		.object({
			data: z.array(dataSchema),
			meta: PaginationMetaSchema,
		})
		.openapi(`Paginated${name || "Item"}Response`);

export const createSingleResponse = <T extends z.ZodTypeAny>(
	dataSchema: T,
	name?: string,
) =>
	z
		.object({
			data: dataSchema,
		})
		.openapi(`Single${name || "Item"}Response`);

export const createListResponse = <T extends z.ZodTypeAny>(
	dataSchema: T,
	name?: string,
) =>
	z
		.object({
			data: z.array(dataSchema),
		})
		.openapi(`List${name || "Item"}Response`);

// =============================================================================
// COMMON RESPONSES
// =============================================================================

export const CommonResponses = {
	400: {
		content: {
			"application/json": {
				schema: ValidationErrorSchema,
			},
		},
		description: "Bad request - validation failed",
	},
	401: {
		content: {
			"application/json": {
				schema: ErrorSchema,
			},
		},
		description: "Unauthorized - authentication required",
	},
	403: {
		content: {
			"application/json": {
				schema: ErrorSchema,
			},
		},
		description: "Forbidden - insufficient permissions",
	},
	404: {
		content: {
			"application/json": {
				schema: ErrorSchema,
			},
		},
		description: "Not found",
	},
	500: {
		content: {
			"application/json": {
				schema: ErrorSchema,
			},
		},
		description: "Internal server error",
	},
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export const createAuthenticatedRoute = (
	route: Record<string, unknown>,
	security: Array<{ sessionAuth: [] }> = [{ sessionAuth: [] }],
) => {
	return {
		...route,
		security,
	};
};

export { createRoute };

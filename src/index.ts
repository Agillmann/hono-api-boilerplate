import bun from "bun";
import { Hono } from "hono";
import apiRouter from "@/api";
import { config } from "@/config/environment";
import {
	errorLoggingMiddleware,
	healthCheckLoggingMiddleware,
	requestLoggingMiddleware,
} from "@/lib/middleware/logging";
import { logSystemEvent, systemLogger } from "@/services/logger";

// Créer un routeur principal avec préfixe
const app = new Hono();

// Add global middleware
app.use("*", errorLoggingMiddleware());

// Add request logging middleware (lighter for health checks)
app.use("/health/*", healthCheckLoggingMiddleware());
app.use("/api/v1/health/*", healthCheckLoggingMiddleware());
app.use("*", requestLoggingMiddleware());

// Ajouter le préfixe /api à toutes les routes
app.route("/api/v1", apiRouter);

// Route racine avec documentation complète de l'API
app.get("/", (c) => {
	const apiInfo = {
		name: "API Boilerplate",
		description:
			"Hono-based REST API with comprehensive RBAC system using Better-Auth",
		version: "1.0.0",
		status: "running",
		timestamp: new Date().toISOString(),
		baseUrl: "/api/v1",
		documentation: {
			quickReference: "/docs/",
			openApiSpec: "/api/v1/doc",
			betterAuthReference: "/api/v1/auth/reference",
			endpointsQuickReference: "/docs/endpoints-quick-reference.md",
			completeApiDocs: "/docs/api-endpoints.md",
			architecture: "/docs/README.md",
		},
		authentication: {
			system: "Better-Auth",
			features: [
				"Email/Password",
				"Admin Plugin",
				"Organization Plugin",
				"Session Management",
			],
			authUrl: "/api/v1/auth",
		},
		rbac: {
			appRoles: ["admin", "user"],
			organizationRoles: ["owner", "admin", "member"],
			permissionModel: "Resource-based with granular actions",
		},
		endpoints: {
			public: {
				description: "Endpoints accessible without authentication",
				routes: [
					{
						path: "GET /api/v1/health/api",
						description: "API health check",
					},
					{
						path: "GET /api/v1/health/db",
						description: "Database connectivity check",
					},
					{
						path: "GET /api/v1/system/stats",
						description:
							"Public system statistics (users, organizations count)",
					},
					{
						path: "GET|POST /api/v1/auth/*",
						description:
							"Better-Auth endpoints (login, register, social auth, etc.)",
					},
				],
			},
			user: {
				description: "Endpoints requiring user authentication",
				authentication: "Session required",
				routes: [
					{
						path: "GET /api/v1/me",
						description: "Get current user profile and session info",
					},
					{
						path: "PUT /api/v1/me",
						description: "Update current user profile (name, email)",
					},
					{
						path: "GET /api/v1/me/organizations",
						description: "Get user's organization memberships",
					},
					{
						path: "GET /api/v1/me/teams",
						description: "Get user's team memberships across organizations",
					},
					{
						path: "GET /api/v1/me/invitations",
						description: "Get pending organization invitations for user",
					},
					{
						path: "GET /api/v1/system/permissions",
						description: "Get current user's permissions and access levels",
					},
				],
			},
			admin: {
				description: "Endpoints requiring admin role",
				authentication: "Admin role required",
				routes: [
					{
						path: "GET /api/v1/admin/users",
						description: "List all users with pagination, search, and filters",
					},
					{
						path: "GET /api/v1/admin/users/:id",
						description:
							"Get detailed user information including sessions and memberships",
					},
					{
						path: "POST /api/v1/admin/users",
						description: "Create new user with specified role",
					},
					{
						path: "PUT /api/v1/admin/users/:id",
						description: "Update user information and role",
					},
					{
						path: "POST /api/v1/admin/users/:id/ban",
						description: "Ban user with reason and optional expiration",
					},
					{
						path: "POST /api/v1/admin/users/:id/unban",
						description: "Remove ban from user",
					},
					{
						path: "DELETE /api/v1/admin/users/:id",
						description: "Delete user (cannot delete own account)",
					},
					{
						path: "GET /api/v1/admin/organizations",
						description: "List all organizations with member/team counts",
					},
					{
						path: "GET /api/v1/admin/organizations/:id",
						description:
							"Get detailed organization info including members and teams",
					},
					{
						path: "POST /api/v1/admin/organizations",
						description: "Create new organization with specified owner",
					},
					{
						path: "DELETE /api/v1/admin/organizations/:id",
						description: "Delete organization and all associated data",
					},
					{
						path: "GET /api/v1/admin/stats",
						description: "Comprehensive system statistics and metrics",
					},
					{
						path: "GET /api/v1/system/user-count",
						description: "Get detailed user counts (total, active, banned)",
					},
					{
						path: "GET /api/v1/system/admin-only",
						description: "Admin-only test endpoint for permission verification",
					},
				],
			},
			organizations: {
				description: "Multi-tenant organization management endpoints",
				authentication:
					"Organization membership + specific permissions required",
				routes: [
					{
						path: "GET /api/v1/organizations",
						description: "Get user's accessible organizations",
					},
					{
						path: "POST /api/v1/organizations",
						description: "Create new organization (user becomes owner)",
					},
					{
						path: "GET /api/v1/organizations/:id",
						description: "Get organization details (member access required)",
					},
					{
						path: "PUT /api/v1/organizations/:id",
						description: "Update organization (organization.update permission)",
					},
					{
						path: "DELETE /api/v1/organizations/:id",
						description: "Delete organization (owner role required)",
					},
					{
						path: "GET /api/v1/organizations/:id/members",
						description: "Get organization members list",
					},
					{
						path: "POST /api/v1/organizations/:id/invite",
						description: "Invite new member (invitation.create permission)",
					},
					{
						path: "PUT /api/v1/organizations/:id/members/:memberId",
						description: "Update member role (member.update permission)",
					},
					{
						path: "DELETE /api/v1/organizations/:id/members/:memberId",
						description: "Remove member (member.delete permission)",
					},
					{
						path: "GET /api/v1/organizations/:id/invitations",
						description: "Get pending invitations for organization",
					},
					{
						path: "DELETE /api/v1/organizations/:id/invitations/:invitationId",
						description:
							"Cancel pending invitation (invitation.cancel permission)",
					},
					{
						path: "GET /api/v1/organizations/:id/teams",
						description: "Get organization teams",
					},
					{
						path: "POST /api/v1/organizations/:id/teams",
						description: "Create new team (team.create permission)",
					},
					{
						path: "GET /api/v1/organizations/:id/teams/:teamId",
						description: "Get team details including members",
					},
					{
						path: "DELETE /api/v1/organizations/:id/teams/:teamId",
						description: "Delete team (team.delete permission)",
					},
				],
			},
		},
		systemInfo: {
			framework: "Hono",
			runtime: "Bun",
			database: "MySQL with Prisma ORM",
			authentication: "Better-Auth",
			environment: process.env.NODE_ENV || "development",
		},
		support: {
			documentation: "See /docs directory for complete API documentation",
			healthCheck: "GET /api/v1/health/api",
			contact: "Check project README for support information",
		},
	};

	return c.json(apiInfo, 200, {
		"Content-Type": "application/json; charset=utf-8",
	});
});

// Start server with graceful shutdown handling
const server = bun.serve({
	port: config.API_PORT,
	fetch: app.fetch,
});

// Log successful startup
logSystemEvent("application_startup", {
	port: config.API_PORT,
	environment: config.NODE_ENV,
	pid: process.pid,
	nodeVersion: process.version,
	baseUrl: `http://localhost:${config.API_PORT}`,
});

systemLogger.info(`🚀 Server running at http://localhost:${config.API_PORT}`);
systemLogger.info(
	`📖 API Documentation available at http://localhost:${config.API_PORT}/`,
);
systemLogger.info(
	`🔧 OpenAPI Spec: http://localhost:${config.API_PORT}/api/v1/doc`,
);
systemLogger.info(
	`🔐 Better-Auth Reference: http://localhost:${config.API_PORT}/api/v1/auth/reference`,
);

// Graceful shutdown handling
process.on("SIGTERM", () => {
	logSystemEvent("application_shutdown", {
		signal: "SIGTERM",
		port: config.API_PORT,
		pid: process.pid,
	});
	systemLogger.info("🛑 Received SIGTERM, shutting down gracefully...");
	server.stop();
	process.exit(0);
});

process.on("SIGINT", () => {
	logSystemEvent("application_shutdown", {
		signal: "SIGINT",
		port: config.API_PORT,
		pid: process.pid,
	});
	systemLogger.info("🛑 Received SIGINT, shutting down gracefully...");
	server.stop();
	process.exit(0);
});

// Handle uncaught errors
process.on("uncaughtException", (error) => {
	systemLogger.fatal(
		{
			err: error,
			pid: process.pid,
		},
		"💥 Uncaught exception - shutting down",
	);
	process.exit(1);
});

process.on("unhandledRejection", (reason) => {
	systemLogger.fatal(
		{
			err: reason,
			pid: process.pid,
		},
		"💥 Unhandled rejection - shutting down",
	);
	process.exit(1);
});

import { Hono } from "hono";
import { config } from "../config";
import type { AuthType } from "../lib/auth";
import { auth } from "../lib/auth";
import { systemLogger } from "../services/logger";
import adminRouter from "./admin";
import authRouter from "./auth";
import apiOpenApiRouter from "./index.openapi";
import meRouter from "./me";
import organizationRouter from "./organizations";

const apiRouter = new Hono<{ Variables: AuthType }>({
	strict: false,
});

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
		systemLogger.debug({ err: error }, "Session parsing failed");
	}

	await next();
});

// Add OpenAPI documented routes (health, system endpoints with full documentation)
apiRouter.route("/", apiOpenApiRouter);

// Public routes (no authentication required)
apiRouter.route("/auth", authRouter);

// Protected routes (authentication required)
apiRouter.use("/me/*", async (c, next) => {
	const session = c.get("session");
	systemLogger.debug({ session }, "Session details");
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
// OPENAPI SPECIFICATION ENDPOINT
// =============================================================================

/**
 * GET /doc - Serve the complete OpenAPI 3.0 specification as JSON
 */
apiRouter.get("/doc", async (c) => {
	try {
		// Generate OpenAPI spec manually
		const spec = {
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
					url: `http://localhost:${config.API_PORT}/api/v1`,
					description: "Development server",
				},
				{
					url: "https://api.yourdomain.com/v1",
					description: "Production server",
				},
			],
			paths: {},
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

		return c.json(spec, 200, {
			"Content-Type": "application/json; charset=utf-8",
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		});
	} catch (error) {
		systemLogger.error(
			{ error, path: "/doc" },
			"Failed to generate OpenAPI specification",
		);
		return c.json({ error: "Failed to generate OpenAPI specification" }, 500);
	}
});

export default apiRouter;

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";
import type { AuthType } from "@/lib/auth";
import { auth } from "@/lib/auth";
import { systemLogger } from "@/services/logger";

const docsRouter = new Hono<{ Variables: AuthType }>();

/**
 * GET /docs - Serve interactive API documentation with Scalar UI
 */
docsRouter.get(
	"/",
	Scalar({
		sources: [
			{ url: "/api/v1/docs/openapi.json", title: "API Boilerplate" },
			{
				url: "/api/v1/docs/auth-openapi.json",
				title: "Authentication (Better Auth)",
			},
		],
		theme: "default",
		pageTitle: "API Boilerplate Documentation",
	}),
);

/**
 * GET /docs/openapi.json - Serve the OpenAPI JSON specification
 */
docsRouter.get("/openapi.json", async (c) => {
	try {
		// Read the generated OpenAPI spec
		const specPath = join(process.cwd(), "src", "api", "docs", "openapi.json");
		const spec = JSON.parse(readFileSync(specPath, "utf-8"));

		return c.json(spec, 200, {
			"Content-Type": "application/json; charset=utf-8",
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		});
	} catch (error) {
		systemLogger.error(
			{ error, path: "/docs/openapi.json" },
			"Failed to serve OpenAPI specification",
		);
		return c.json(
			{
				error: "Failed to load OpenAPI specification",
				message:
					"The API documentation is temporarily unavailable. Please try again later or contact support.",
			},
			500,
		);
	}
});

/**
 * GET /docs/auth-openapi.json - Serve the Better-Auth OpenAPI JSON specification
 */
docsRouter.get("/auth-openapi.json", async (c) => {
	try {
		// Generate Better-Auth OpenAPI schema
		const authSchema = await auth.api.generateOpenAPISchema();

		return c.json(authSchema, 200, {
			"Content-Type": "application/json; charset=utf-8",
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET",
			"Access-Control-Allow-Headers": "Content-Type",
		});
	} catch (error) {
		systemLogger.error(
			{ error, path: "/docs/auth-openapi.json" },
			"Failed to serve Better-Auth OpenAPI specification",
		);
		return c.json(
			{
				error: "Failed to load Better-Auth OpenAPI specification",
				message:
					"Better-Auth documentation is temporarily unavailable. Please try again later.",
			},
			500,
		);
	}
});

export type AppType = typeof docsRouter;
export default docsRouter;

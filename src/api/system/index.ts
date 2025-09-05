import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { prisma } from "prisma/prisma-client";
import type { AuthType } from "@/lib/auth";
import { logError, systemLogger } from "@/services/logger";

const systemRouter = new Hono<{ Variables: AuthType }>();

// =============================================================================
// HEALTH ROUTES
// =============================================================================

/**
 * GET /health/api - API Health Check
 */
systemRouter.get("/health/api", async (c) => {
	systemLogger.info("API health check");
	return c.json({ status: "API is running" }, 200);
});

/**
 * GET /health/db - Database Health Check
 */
systemRouter.get("/health/db", async (c) => {
	try {
		await prisma.$connect();
		systemLogger.info("Database connected successfully");
		await prisma.$disconnect();
		return c.json({ status: "Database connected successfully" }, 200);
	} catch (error) {
		logError(error as Error, { operation: "database_health_check" });
		throw new HTTPException(500, { message: "Database connection failed" });
	}
});

export type AppType = typeof systemRouter;
export default systemRouter;

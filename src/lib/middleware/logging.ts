import { randomUUID } from "node:crypto";
import type { Context, MiddlewareHandler } from "hono";
import { accessLogger, logApiCall, systemLogger } from "../../services/logger";

/**
 * Request logging middleware that provides:
 * - Request correlation IDs
 * - Access logging for all HTTP requests
 * - Performance timing
 * - User context when available
 */
export const requestLoggingMiddleware = (): MiddlewareHandler => {
	return async (c: Context, next) => {
		const startTime = Date.now();

		// Generate or extract correlation ID
		const correlationId = c.req.header("x-correlation-id") || randomUUID();
		c.set("correlationId", correlationId);

		// Extract request details
		const method = c.req.method;
		const path = c.req.path;
		const userAgent = c.req.header("user-agent") || "unknown";
		const ip =
			c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown";

		// Get user context if available (set by auth middleware)
		const user = c.get("user");
		const session = c.get("session");

		// Log incoming request
		accessLogger.info(
			{
				correlationId,
				method,
				path,
				userAgent,
				ip,
				user: user
					? {
							id: user.id,
							email: user.email,
							role: user.role,
						}
					: null,
				sessionId: session?.id,
				timestamp: new Date().toISOString(),
				type: "request_start",
			},
			`${method} ${path} - Request started`,
		);

		let statusCode = 200;
		let errorDetails: any = null;

		try {
			await next();
			statusCode = c.res.status;
		} catch (error) {
			// Capture error details for logging
			statusCode =
				error instanceof Error && "status" in error
					? (error as any).status || 500
					: 500;

			errorDetails = {
				name: error instanceof Error ? error.name : "Unknown",
				message: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
			};

			// Re-throw to let Hono handle the error response
			throw error;
		} finally {
			// Calculate request duration
			const duration = Date.now() - startTime;
			const endTime = new Date().toISOString();

			// Determine log level based on status code
			const isError = statusCode >= 400;
			const logLevel =
				statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";

			// Log completed request
			const logData = {
				correlationId,
				method,
				path,
				statusCode,
				duration,
				userAgent,
				ip,
				user: user
					? {
							id: user.id,
							email: user.email,
							role: user.role,
						}
					: null,
				sessionId: session?.id,
				timestamp: endTime,
				type: "request_end",
				...(errorDetails && { error: errorDetails }),
			};

			// Log with appropriate level
			accessLogger[logLevel](
				logData,
				`${method} ${path} ${statusCode} - ${duration}ms${isError ? ` [ERROR]` : ""}`,
			);

			// Also use the utility function for structured API logging
			if (!errorDetails) {
				logApiCall(method, path, statusCode, duration, {
					correlationId,
					userId: user?.id,
					userAgent,
					ip,
				});
			}
		}
	};
};

/**
 * Error logging middleware that captures unhandled errors
 * and provides structured error logging
 */
export const errorLoggingMiddleware = (): MiddlewareHandler => {
	return async (c: Context, next) => {
		try {
			await next();
		} catch (error) {
			const correlationId = c.get("correlationId") || "unknown";
			const user = c.get("user");

			// Log the error with full context
			systemLogger.error(
				{
					correlationId,
					method: c.req.method,
					path: c.req.path,
					user: user
						? {
								id: user.id,
								email: user.email,
								role: user.role,
							}
						: null,
					userAgent: c.req.header("user-agent"),
					ip: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
					err: {
						name: error instanceof Error ? error.name : "Unknown",
						message: error instanceof Error ? error.message : String(error),
						stack: error instanceof Error ? error.stack : undefined,
					},
					timestamp: new Date().toISOString(),
				},
				`Unhandled error in ${c.req.method} ${c.req.path}`,
			);

			// Re-throw to let Hono handle the error response
			throw error;
		}
	};
};

/**
 * Health check logging middleware - lighter logging for health endpoints
 * to avoid log noise while still tracking uptime checks
 */
export const healthCheckLoggingMiddleware = (): MiddlewareHandler => {
	return async (c: Context, next) => {
		const path = c.req.path;

		// Only apply light logging to health check endpoints
		if (path.startsWith("/health") || path.startsWith("/api/v1/health")) {
			const startTime = Date.now();

			await next();

			const duration = Date.now() - startTime;
			const statusCode = c.res.status;

			// Light logging for health checks (debug level)
			systemLogger.debug(
				{
					method: c.req.method,
					path,
					statusCode,
					duration,
					type: "health_check",
				},
				`Health check: ${statusCode} - ${duration}ms`,
			);
		} else {
			// Pass through to normal request logging
			await next();
		}
	};
};

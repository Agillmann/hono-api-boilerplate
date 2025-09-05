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

systemLogger.info(
	`🚀 API running at http://localhost:${config.API_PORT}/api/v1`,
);
systemLogger.info(
	`📖 API Documentation: http://localhost:${config.API_PORT}/api/v1/docs`,
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

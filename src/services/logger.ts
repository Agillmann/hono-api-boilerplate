import pino from "pino";
import { config } from "../config";

// Log levels for different types of operations
export const LOG_LEVELS = {
	TRACE: 10,
	DEBUG: 20,
	INFO: 30,
	WARN: 40,
	ERROR: 50,
	FATAL: 60,
} as const;

// Create different logger transports based on environment
const createTransports = () => {
	const isDevelopment =
		config.NODE_ENV === "development" || config.NODE_ENV === "test";

	if (isDevelopment) {
		// Development: Pretty printing to console
		return {
			target: "pino-pretty",
			options: {
				colorize: true,
				translateTime: "HH:MM:ss",
				ignore: "pid,hostname",
				singleLine: false,
			},
		};
	}

	// Production: Multiple file targets + console
	return {
		targets: [
			{
				target: "pino/file",
				level: "info",
				options: {
					destination: "logs/app.log",
					mkdir: true,
				},
			},
			{
				target: "pino/file",
				level: "error",
				options: {
					destination: "logs/error.log",
					mkdir: true,
				},
			},
			{
				target: "pino/file",
				level: "trace",
				options: {
					destination: "logs/access.log",
					mkdir: true,
				},
			},
			{
				target: "pino-pretty",
				level: "info",
				options: {
					colorize: false,
					translateTime: "iso",
					destination: 1, // stdout
				},
			},
		],
	};
};

// Base logger configuration
const isDevelopment = config.NODE_ENV === "development" || config.NODE_ENV === "test";

const baseLoggerConfig: any = {
	level: isDevelopment ? "debug" : "info",
	timestamp: pino.stdTimeFunctions.isoTime,
	serializers: {
		req: (req) => ({
			method: req.method,
			url: req.url,
			headers: {
				host: req.headers?.host,
				"user-agent": req.headers?.["user-agent"],
				"content-type": req.headers?.["content-type"],
			},
			remoteAddress: req.ip || req.connection?.remoteAddress,
		}),
		res: (res) => ({
			statusCode: res.statusCode,
			headers: {
				"content-type": res.getHeader?.("content-type"),
			},
		}),
		err: pino.stdSerializers.err,
		user: (user: any) => ({
			id: user?.id,
			email: user?.email,
			role: user?.role,
		}),
	},
	transport: createTransports(),
};

// Only add custom formatters in development mode
// Production mode with transport targets doesn't support custom level formatters
if (isDevelopment) {
	baseLoggerConfig.formatters = {
		level: (label) => ({ level: label }),
	};
}

const baseLogger = pino(baseLoggerConfig);

// Create specialized loggers for different purposes
export const logger = baseLogger;

export const accessLogger = logger.child({ component: "access" });
export const errorLogger = logger.child({ component: "error" });
export const apiLogger = logger.child({ component: "api" });
export const systemLogger = logger.child({ component: "system" });
export const authLogger = logger.child({ component: "auth" });
export const adminLogger = logger.child({ component: "admin" });

// Utility functions for common logging patterns
export const logError = (error: Error, context?: Record<string, any>) => {
	errorLogger.error(
		{
			err: error,
			...context,
		},
		error.message,
	);
};

export const logApiCall = (
	method: string,
	path: string,
	statusCode: number,
	duration: number,
	context?: Record<string, any>,
) => {
	apiLogger.info(
		{
			method,
			path,
			statusCode,
			duration,
			...context,
		},
		`${method} ${path} ${statusCode} - ${duration}ms`,
	);
};

export const logAuthEvent = (
	event: string,
	user?: { id?: string; email?: string },
	context?: Record<string, any>,
) => {
	authLogger.info(
		{
			event,
			user,
			...context,
		},
		`Auth event: ${event}`,
	);
};

export const logAdminAction = (
	action: string,
	adminUser: { id?: string; email?: string },
	targetResource?: string,
	context?: Record<string, any>,
) => {
	adminLogger.warn(
		{
			action,
			adminUser,
			targetResource,
			...context,
		},
		`Admin action: ${action}${targetResource ? ` on ${targetResource}` : ""}`,
	);
};

export const logSystemEvent = (
	event: string,
	context?: Record<string, any>,
) => {
	systemLogger.info(
		{
			event,
			...context,
		},
		`System event: ${event}`,
	);
};

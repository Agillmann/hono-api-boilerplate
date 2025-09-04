#!/usr/bin/env bun
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@hey-api/openapi-ts";

/**
 * Generate TypeScript clients from OpenAPI specification
 */
async function generateClients() {
	console.log("🔧 Generating TypeScript clients...");

	try {
		const inputPath = join(process.cwd(), "generated", "openapi.json");
		const outputDir = join(process.cwd(), "generated", "clients");

		// Check if OpenAPI spec exists
		if (!existsSync(inputPath)) {
			throw new Error(
				`OpenAPI specification not found at ${inputPath}. Please run 'bun run gen:openapi' first.`,
			);
		}

		// Clean output directory
		if (existsSync(outputDir)) {
			console.log("🧹 Cleaning existing client files...");
			rmSync(outputDir, { recursive: true });
		}
		mkdirSync(outputDir, { recursive: true });

		console.log(`📖 Reading OpenAPI spec from: ${inputPath}`);
		console.log(`📝 Writing clients to: ${outputDir}`);

		// Generate TypeScript client
		await createClient({
			input: inputPath,
			output: outputDir,
			plugins: ["@hey-api/typescript", "@hey-api/sdk"],
		});

		console.log("✅ TypeScript clients generated successfully!");

		// Generate additional configuration files
		await generateClientConfig(outputDir);
		await generateClientExamples(outputDir);

		return true;
	} catch (error) {
		console.error("❌ Error generating TypeScript clients:");
		console.error(error);
		process.exit(1);
	}
}

/**
 * Generate client configuration file
 */
async function generateClientConfig(outputDir: string) {
	const configContent = `// Auto-generated API client configuration
// Generated on: ${new Date().toISOString()}

export const API_CONFIG = {
	baseUrl: process.env.API_BASE_URL || "http://localhost:3000/api/v1",
	timeout: 30000,
	headers: {
		"Content-Type": "application/json",
	},
} as const;

// Request interceptor for authentication
export const withAuth = (options: RequestInit = {}): RequestInit => {
	return {
		...options,
		credentials: "include", // Include session cookies
		headers: {
			...API_CONFIG.headers,
			...options.headers,
		},
	};
};

// Response interceptor for error handling
export const handleApiResponse = async (response: Response) => {
	if (!response.ok) {
		const error = await response.json().catch(() => ({ 
			error: "Unknown error", 
			details: \`HTTP \${response.status}\` 
		}));
		throw new Error(\`API Error: \${error.error} - \${error.details || response.statusText}\`);
	}
	return response.json();
};

// API Client with default configuration
export const createApiClient = (baseUrl = API_CONFIG.baseUrl) => {
	return {
		baseUrl,
		request: async (path: string, options: RequestInit = {}) => {
			const url = \`\${baseUrl}\${path}\`;
			const response = await fetch(url, withAuth(options));
			return handleApiResponse(response);
		},
	};
};

export default createApiClient();
`;

	const configPath = join(outputDir, "config.ts");
	await Bun.write(configPath, configContent);
	console.log(`✅ Client configuration written to: config.ts`);
}

/**
 * Generate client usage examples
 */
async function generateClientExamples(outputDir: string) {
	const examplesContent = `// Auto-generated API client usage examples
// Generated on: ${new Date().toISOString()}

import { HealthService, SystemService } from './services.gen';
import { createApiClient } from './config';

const client = createApiClient();

/**
 * Health Check Examples
 */
export const HealthExamples = {
	// Check API health
	async checkApiHealth() {
		try {
			const response = await HealthService.getHealthApi();
			console.log('API Status:', response.status);
			return response;
		} catch (error) {
			console.error('Health check failed:', error);
			throw error;
		}
	},

	// Check database health
	async checkDatabaseHealth() {
		try {
			const response = await HealthService.getHealthDb();
			console.log('Database Status:', response.status);
			return response;
		} catch (error) {
			console.error('Database health check failed:', error);
			throw error;
		}
	},
};

/**
 * System Information Examples
 */
export const SystemExamples = {
	// Get public system statistics
	async getPublicStats() {
		try {
			const response = await SystemService.getSystemStats();
			console.log('System Stats:', response.stats);
			return response;
		} catch (error) {
			console.error('Failed to get system stats:', error);
			throw error;
		}
	},

	// Get user count (admin only)
	async getUserCount() {
		try {
			const response = await SystemService.getSystemUserCount();
			console.log('User Count:', response);
			return response;
		} catch (error) {
			console.error('Failed to get user count (check authentication/permissions):', error);
			throw error;
		}
	},

	// Get current user permissions
	async getCurrentUserPermissions() {
		try {
			const response = await SystemService.getSystemPermissions();
			console.log('User Permissions:', response);
			return response;
		} catch (error) {
			console.error('Failed to get user permissions (check authentication):', error);
			throw error;
		}
	},

	// Test admin-only access
	async testAdminAccess() {
		try {
			const response = await SystemService.getSystemAdminOnly();
			console.log('Admin Access:', response);
			return response;
		} catch (error) {
			console.error('Admin access denied (check authentication/permissions):', error);
			throw error;
		}
	},
};

/**
 * Example usage in a React component or Node.js app
 */
export const UsageExample = {
	async initializeApp() {
		try {
			// Check system health
			await HealthExamples.checkApiHealth();
			await HealthExamples.checkDatabaseHealth();

			// Get public information
			const stats = await SystemExamples.getPublicStats();
			console.log(\`System has \${stats.stats.totalUsers} users and \${stats.stats.totalOrganizations} organizations\`);

			// Try to get user-specific data (requires authentication)
			try {
				const permissions = await SystemExamples.getCurrentUserPermissions();
				console.log('User authenticated successfully:', permissions.user);
			} catch (error) {
				console.log('User not authenticated, showing public content only');
			}

			return { healthy: true, stats };
		} catch (error) {
			console.error('App initialization failed:', error);
			return { healthy: false, error };
		}
	},
};

// Export all services for convenience
export * from './services.gen';
export * from './types.gen';
export { createApiClient };
`;

	const examplesPath = join(outputDir, "examples.ts");
	await Bun.write(examplesPath, examplesContent);
	console.log(`✅ Usage examples written to: examples.ts`);
}

/**
 * Generate package.json for the client library
 */
async function generateClientPackage(outputDir: string) {
	const packageContent = {
		name: "@api-boilerplate/client",
		version: "1.0.0",
		description: "Auto-generated TypeScript client for API Boilerplate",
		main: "index.ts",
		types: "types.gen.ts",
		exports: {
			".": "./index.ts",
			"./services": "./services.gen.ts",
			"./types": "./types.gen.ts",
			"./config": "./config.ts",
			"./examples": "./examples.ts",
		},
		dependencies: {},
		peerDependencies: {
			typescript: "^5.0.0",
		},
		keywords: [
			"api-client",
			"typescript",
			"openapi",
			"rest-api",
			"auto-generated",
		],
		author: "Auto-generated by @hey-api/openapi-ts",
		license: "MIT",
		repository: {
			type: "git",
			url: "https://github.com/your-org/api-boilerplate",
		},
	};

	const packagePath = join(outputDir, "package.json");
	await Bun.write(packagePath, JSON.stringify(packageContent, null, 2));
	console.log(`✅ Client package.json written to: package.json`);
}

/**
 * Generate index file for easy imports
 */
async function generateIndexFile(outputDir: string) {
	const indexContent = `// Auto-generated API client index
// Generated on: ${new Date().toISOString()}

// Export all services and types
export * from './services.gen';
export * from './types.gen';

// Export configuration and utilities
export * from './config';
export * from './examples';

// Default export
export { default as apiClient } from './config';

// Re-export commonly used services for convenience
export {
	HealthService,
	SystemService,
} from './services.gen';

// Re-export commonly used types
export type {
	Health,
	DatabaseHealth,
	SystemStats,
	UserCount,
	Error as ApiError,
} from './types.gen';
`;

	const indexPath = join(outputDir, "index.ts");
	await Bun.write(indexPath, indexContent);
	console.log(`✅ Client index file written to: index.ts`);
}

/**
 * Main execution
 */
async function main() {
	const args = process.argv.slice(2);
	const options = {
		client: args.includes("--axios") ? "axios" : "fetch",
		verbose: args.includes("--verbose") || args.includes("-v"),
		skipExamples: args.includes("--no-examples"),
	};

	if (options.verbose) {
		console.log("🔧 Options:", options);
	}

	try {
		await generateClients();

		if (!options.skipExamples) {
			const outputDir = join(process.cwd(), "generated", "clients");
			await generateClientPackage(outputDir);
			await generateIndexFile(outputDir);
		}

		console.log("\\n🎉 Client generation completed successfully!");
		console.log("📁 Generated files:");
		console.log("   • services.gen.ts - API service methods");
		console.log("   • types.gen.ts - TypeScript type definitions");
		console.log("   • config.ts - Client configuration and utilities");
		console.log("   • examples.ts - Usage examples and patterns");
		console.log("   • index.ts - Main entry point");
		console.log("   • package.json - Package configuration");

		console.log("\\n✨ Usage:");
		console.log(
			"   import { HealthService, SystemService } from './generated/clients'",
		);
		console.log(
			"   import { UsageExample } from './generated/clients/examples'",
		);
	} catch (error) {
		console.error("❌ Client generation failed:", error);
		process.exit(1);
	}
}

// Run if called directly
if (import.meta.main) {
	main();
}

export { generateClients, main };

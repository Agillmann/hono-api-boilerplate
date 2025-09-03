// src/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import {
	admin as adminPlugin,
	openAPI,
	organization,
} from "better-auth/plugins";
import type { Context } from "hono";
import { config } from "@/config";
import { prisma } from "@/prisma/prisma-client";
import type { AppRole, OrgRole } from "./permissions";

export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: "mysql",
	}),
	baseURL: config.BETTER_AUTH_URL,
	trustedOrigins: config.TRUSTED_ORIGINS,
	emailAndPassword: {
		enabled: true,
	},
	advanced: {
		defaultCookieAttributes: {
			httpOnly: true,
			secure: true,
		},
		database: {
			useNumberId: false,
			generateId: false,
			casing: "camel", // Use camelCase for database fields
		},
		useSecureCookies: true,
	},
	user: {
		modelName: "user",
	},
	account: {
		modelName: "account",
		fields: {
			userId: "userId",
		},
		accountLinking: {
			enabled: true,
			trustedProviders: ["email-password"],
			allowDifferentEmails: false,
		},
	},
	session: {
		modelName: "session",
		fields: {
			userId: "userId",
		},
		expiresIn: 604800, // 7 days
		updateAge: 86400, // 1 day
		disableSessionRefresh: true, // Disable session refresh so that the session is not updated regardless of the `updateAge` option. (default: `false`)
		additionalFields: {
			// Additional fields for the session table
			customField: {
				type: "string",
			},
		},
		storeSessionInDatabase: true, // Store session in the database when secondary storage is provided (default: `false`)
		preserveSessionInDatabase: false, // Preserve session records in the database when deleted from secondary storage (default: `false`)
		cookieCache: {
			enabled: false, // Enable caching session in cookie (default: `false`)
			maxAge: 300, // 5 minutes
		},
	},
	plugins: [
		openAPI(), // Enables API documentation at /api/auth/reference
		adminPlugin({
			adminRoles: ["admin"],
			defaultRole: "user",
		}),
		organization({
			creatorRole: "owner",
			allowUserToCreateOrganization: true,
			organizationLimit: 5,
		}),
	],
});

export type AuthType = {
	user: typeof auth.$Infer.Session.user | null;
	session: typeof auth.$Infer.Session.session | null;
};

// Enhanced context for RBAC operations
export type RBACContext = AuthType & {
	organizationId?: string;
	userRole?: string;
	organizationRole?: string;
};

export const getUserFromContext = (c: Context<{ Variables: AuthType }>) => {
	const user = c.get("user");
	if (!user) {
		throw new Error("User not found");
	}
	return user;
};

export const getSessionFromContext = (c: Context<{ Variables: AuthType }>) => {
	const session = c.get("session");
	if (!session) {
		throw new Error("Session not found");
	}
	return session;
};

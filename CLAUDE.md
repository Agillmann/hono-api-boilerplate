# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `bun run dev` - Start development server with hot reload
- `bun run lint` - Run BiomeJS linter
- `bun run lint:fix` - Run BiomeJS linter with auto-fix
- `bun run db:generate` - Generate Prisma client
- `bun run db:migrate` - Run Prisma migrations
- `bun run db:studio` - Open Prisma Studio
- `bun run db:push` - Push schema changes to database
- `bun run db:pull` - Pull schema from database
- `bun run gen:openapi` - Generate OpenAPI documentation

## Database Setup

The project uses MySQL 8.0 running in Docker. Start the database:

```bash
docker-compose up -d mysql
```

Database connection details:
- Host: localhost:3306
- Database: api_boilerplate
- User: app_user
- Password: app_password

## Architecture

This is a Hono-based REST API with TypeScript, built around a comprehensive RBAC (Role-Based Access Control) system:

### Core Stack
- **Runtime**: Bun
- **Framework**: Hono (lightweight web framework)
- **Database**: MySQL with Prisma ORM
- **Authentication**: Better-Auth library with admin + organization plugins
- **Validation**: Zod
- **Logging**: Pino
- **Linting**: BiomeJS (uses tab indentation, double quotes)

### Project Structure
- `src/index.ts` - Entry point that starts Bun server
- `src/config.ts` - Environment configuration with Zod validation
- `src/lib/auth.ts` - Better-Auth configuration with admin + organization plugins
- `src/lib/permissions.ts` - Custom RBAC permission model and role definitions
- `src/lib/middleware/rbac.ts` - RBAC middleware for permission checking
- `src/lib/utils/rbac.ts` - RBAC utility functions and helpers
- `src/api/` - API route handlers organized by feature:
  - `src/api/index.ts` - Main router with system endpoints
  - `src/api/auth.ts` - Authentication routes (Better-Auth)
  - `src/api/me.ts` - User profile and personal data routes
  - `src/api/admin.ts` - Global admin routes (user/org management)
  - `src/api/organizations.ts` - Multi-tenant organization routes
- `src/prisma/` - Prisma schema and generated client
- `src/services/logger.ts` - Pino logger configuration
- `docs/` - Complete API documentation

### RBAC System
The API implements a comprehensive Role-Based Access Control system:

#### App-Level Roles
- **`admin`**: System administrators with full access to `/admin/*` endpoints
- **`user`**: Regular authenticated users with access to personal endpoints

#### Organization Roles (Multi-tenant)
- **`owner`**: Full control over organization (delete, manage all)
- **`admin`**: Manage members, teams, and organization settings
- **`member`**: Basic access to organization resources

#### Permission Model
Permissions are organized by resource and action:
- **Resources**: `user`, `organization`, `team`, `invitation`, `member`
- **Actions**: `create`, `read`, `update`, `delete`, `manage`, `invite`, `ban`

### Authentication & Authorization Flow
Better-Auth is configured with:
- Email/password authentication
- MySQL storage via Prisma adapter
- Session management with database storage
- **Admin plugin**: User management, roles, banning system
- **Organization plugin**: Multi-tenant organizations with role-based permissions
- OpenAPI documentation at `/api/v1/auth/reference`

### API Structure
- **Public routes**: `/api/v1/health/*`, `/api/v1/system/stats`, `/api/v1/auth/*`
- **User routes**: `/api/v1/me/*` (require authentication)
- **Admin routes**: `/api/v1/admin/*` (require admin role)
- **Organization routes**: `/api/v1/organizations/*` (require organization membership + permissions)
- **System routes**: `/api/v1/system/*` (mixed authentication levels)

#### Route Categories
1. **Health & System**: Public health checks and system statistics
2. **Authentication**: Better-Auth managed routes with session handling
3. **User Profile**: Personal data management and user-specific resources
4. **Administration**: Global user and organization management (admin only)
5. **Organizations**: Multi-tenant features with granular permissions

### Path Aliases
The project uses TypeScript path aliases:
- `@/*` → `./src/*`
- `@/db/*` → `./src/db/*`
- `@/api/*` → `./src/api/*`
- `@/lib/*` → `./src/lib/*`
- `@/services/*` → `./src/services/*`
- `@/prisma/*` → `./src/prisma/*`

### Environment Variables
Key variables defined in `src/config.ts`:
- `DATABASE_URL` - MySQL connection string
- `SHADOW_DATABASE_URL` - Shadow database for migrations  
- `BETTER_AUTH_SECRET` - Authentication secret
- `BETTER_AUTH_URL` - Base URL for Better Auth (default: http://localhost:3000)
- `TRUSTED_ORIGINS` - Trusted origins for CORS
- `API_PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode

## API Documentation

Complete API documentation is available in the `/docs` directory:

- **[Quick Reference](./docs/endpoints-quick-reference.md)** - Concise tables of all endpoints organized by role
- **[Complete API Docs](./docs/api-endpoints.md)** - Detailed documentation with examples, validation schemas, and error codes
- **[Documentation Guide](./docs/README.md)** - Navigation guide and technical architecture overview

### Key Endpoints Overview

#### Admin Endpoints (`/api/v1/admin/*`)
- User management (CRUD, ban/unban) 
- Organization oversight
- System statistics and monitoring

#### User Endpoints (`/api/v1/me/*`)
- Profile management
- Personal organizations and teams
- Pending invitations

#### Organization Endpoints (`/api/v1/organizations/*`)
- Multi-tenant organization management
- Member and role administration
- Team management within organizations
- Invitation system

#### System Endpoints (`/api/v1/system/*`, `/api/v1/health/*`)
- Public system statistics
- Health checks
- Permission verification utilities

## Testing the RBAC System

The API server runs on `http://localhost:3000/api/v1`. Test different permission levels:

1. **Public endpoints** (no auth): `/health/*`, `/system/stats`
2. **Protected endpoints** (session required): `/me/*`
3. **Admin endpoints** (admin role): `/admin/*`, `/system/admin-only`
4. **Organization endpoints** (membership + permissions): `/organizations/*`

Example testing:
```bash
# Public endpoint
curl http://localhost:3000/api/v1/health/api

# Protected endpoint (will return 401 without session)
curl http://localhost:3000/api/v1/me

# Admin endpoint (will return 401/403 without admin role)
curl http://localhost:3000/api/v1/system/admin-only
```
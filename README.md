# API Boilerplate with RBAC

A sophisticated REST API boilerplate built with **Hono** and **TypeScript**, featuring a comprehensive **Role-Based Access Control (RBAC)** system with multi-tenant organizations, team management, and advanced authentication.

## ⚡ Core Features

- **🔐 Advanced RBAC System**: Multi-level permissions (App-level + Organization-level roles)
- **🏢 Multi-tenant Organizations**: Complete organization management with teams and invitations
- **🔑 Better-Auth Integration**: Session-based authentication with admin and organization plugins
- **⚡ High Performance**: Built on Hono framework with Bun runtime
- **📊 MySQL + Prisma**: Robust database with type-safe ORM
- **📝 Comprehensive Documentation**: Complete API docs with OpenAPI specification
- **🧪 Production Ready**: Full validation, logging, and error handling

## 🚀 Quick Start

### 1. Install Dependencies

```bash
bun install
```

### 2. Set Up Environment

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Better Auth Configuration
BETTER_AUTH_SECRET=your-super-secret-key-here
BETTER_AUTH_URL=http://localhost:3000

# Database Configuration  
DATABASE_URL=mysql://app_user:app_password@localhost:3306/api_boilerplate
SHADOW_DATABASE_URL=mysql://app_user:app_password@localhost:3306/api_boilerplate_shadow

# Application
NODE_ENV=development
APP_PORT=3000

# Docker MySQL Settings (if using Docker)
MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_DATABASE=api_boilerplate
MYSQL_USER=app_user
MYSQL_PASSWORD=app_password
MYSQL_PORT=3306
```

### 3. Start Database

```bash
# Using Docker (recommended)
docker-compose up -d mysql

# Wait for database to be ready
docker-compose ps
```

### 4. Set Up Database Schema

```bash
# Generate Prisma client
bun run db:generate

# Run migrations to create tables
bun run db:migrate
```

### 5. Start Development Server

```bash
bun run dev
```

The API will be available at `http://localhost:3000/api/v1`

## 🏗️ Architecture Overview

### Tech Stack

- **Runtime**: [Bun](https://bun.sh) - Fast JavaScript runtime
- **Framework**: [Hono](https://hono.dev) - Ultrafast web framework  
- **Authentication**: [Better-Auth](https://www.better-auth.com) - Modern auth library
- **Database**: [MySQL 8.0](https://mysql.com) + [Prisma ORM](https://prisma.io)
- **Validation**: [Zod](https://zod.dev) - TypeScript-first schema validation
- **Logging**: [Pino](https://getpino.io) - Fast JSON logger
- **Linting**: [BiomeJS](https://biomejs.dev) - Fast linter and formatter

### RBAC System

#### App-Level Roles
- **`admin`**: System administrators with global access to `/api/v1/admin/*`
- **`user`**: Authenticated users with access to personal endpoints

#### Organization-Level Roles  
- **`owner`**: Full control over organization (delete, manage all members)
- **`admin`**: Manage organization members, teams, and settings
- **`member`**: Basic access to organization resources

#### Permission Model
Permissions are structured around **resources** and **actions**:

- **Resources**: `user`, `organization`, `team`, `invitation`, `member`
- **Actions**: `create`, `read`, `update`, `delete`, `manage`, `invite`, `ban`

## 🔑 Authentication Flow

The API uses Better-Auth with session-based authentication:

1. **Registration/Login**: POST to `/api/v1/auth/sign-up` or `/api/v1/auth/sign-in`
2. **Session Management**: Automatic session handling via cookies
3. **Role Assignment**: Users get app-level roles (`admin`/`user`)
4. **Organization Access**: Users join organizations with specific roles
5. **Permission Checking**: Middleware validates permissions for each endpoint

### Available Auth Endpoints

- `/api/v1/auth/sign-up` - User registration
- `/api/v1/auth/sign-in` - User login  
- `/api/v1/auth/sign-out` - User logout
- `/api/v1/auth/session` - Get current session
- `/api/v1/auth/reference` - OpenAPI documentation

## 📚 API Endpoints

### Public Endpoints (No Authentication)
- `GET /api/v1/health/*` - System health checks
- `GET /api/v1/system/stats` - Public system statistics  
- `POST /api/v1/auth/*` - Authentication endpoints

### User Endpoints (Authentication Required)
- `GET /api/v1/me` - User profile
- `GET /api/v1/me/organizations` - User's organizations
- `GET /api/v1/me/invitations` - Pending invitations

### Admin Endpoints (Admin Role Required)
- `GET /api/v1/admin/users` - Manage all users
- `GET /api/v1/admin/organizations` - Manage all organizations
- `POST /api/v1/admin/users/:id/ban` - Ban/unban users

### Organization Endpoints (Organization Membership + Permissions)
- `POST /api/v1/organizations` - Create organization
- `GET /api/v1/organizations/:slug` - Organization details  
- `POST /api/v1/organizations/:slug/invite` - Invite members
- `GET /api/v1/organizations/:slug/teams` - Manage teams

## 🧪 Testing the API

### Quick Test Commands

```bash
# Test public endpoint
curl http://localhost:3000/api/v1/health/api

# Test system stats
curl http://localhost:3000/api/v1/system/stats

# Test protected endpoint (will return 401 without authentication)
curl http://localhost:3000/api/v1/me

# Test admin endpoint (will return 403 without admin role)
curl http://localhost:3000/api/v1/admin/users
```

### Authentication Testing

1. **Register a new user**:
```bash
curl -X POST http://localhost:3000/api/v1/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```

2. **Login and get session**:
```bash
curl -X POST http://localhost:3000/api/v1/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 📖 Complete Documentation

Comprehensive API documentation is available in the `/docs` directory:

- **[📋 Quick Reference](./docs/endpoints-quick-reference.md)** - Concise endpoint tables by role
- **[📚 Complete API Docs](./docs/api-endpoints.md)** - Detailed docs with examples and schemas  
- **[🗺️ Documentation Guide](./docs/README.md)** - Navigation and architecture overview

## ⚙️ Development Commands

```bash
# Development
bun run dev              # Start dev server with hot reload
bun run build            # Build for production  
bun run start            # Start production server

# Database Management
bun run db:generate      # Generate Prisma client
bun run db:migrate       # Run database migrations
bun run db:deploy        # Deploy migrations (production)
bun run db:studio        # Open Prisma Studio
bun run db:push          # Push schema to database
bun run db:pull          # Pull schema from database
bun run db:reset         # Reset database (⚠️ destroys data)

# Code Quality
bun run lint             # Run BiomeJS linter
bun run lint:fix         # Auto-fix linting issues

# Documentation
bun run gen:openapi      # Generate OpenAPI documentation
```

## 🐳 Docker Setup

### Start MySQL Only

```bash
docker-compose up -d mysql
```

### Optional: Run API in Docker

Uncomment the `api` service in `docker-compose.yml` and run:

```bash
docker-compose up -d
```

### Docker Management

```bash
# View logs
docker-compose logs mysql

# Stop services  
docker-compose down

# Stop and remove data (⚠️ destructive)
docker-compose down -v
```

## 🗂️ Project Structure

```
src/
├── index.ts                    # Application entry point
├── config.ts                   # Environment configuration
├── api/                        # API route handlers
│   ├── index.ts               # Main router + system endpoints
│   ├── auth.ts                # Better-Auth routes
│   ├── me.ts                  # User profile routes  
│   ├── admin.ts               # Admin management routes
│   └── organizations.ts       # Organization routes
├── lib/                       # Core libraries
│   ├── auth.ts                # Better-Auth configuration
│   ├── permissions.ts         # RBAC permission definitions
│   ├── middleware/rbac.ts     # RBAC middleware
│   └── utils/rbac.ts          # RBAC utility functions
├── services/
│   └── logger.ts              # Pino logger setup

docs/                          # Complete API documentation
prisma/                        # Generated Prisma client  
docker-compose.yml            # Docker services
```

## 🚨 Important Security Notes

- **Change default passwords** in production environments
- **Use strong secrets** for `BETTER_AUTH_SECRET`
- **Configure CORS** properly for production
- **Enable SSL/HTTPS** in production
- **Review permission model** before deploying

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Follow the existing code style (BiomeJS configuration)
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
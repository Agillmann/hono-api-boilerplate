
# 🚀 API Boilerplate with Advanced RBAC

A production-ready REST API boilerplate built with **Hono** and **TypeScript**, featuring a sophisticated **Role-Based Access Control (RBAC)** system, multi-tenant organizations, and modern authentication.

## ⚡ Why This Boilerplate?

- **🔐 Enterprise RBAC**: Multi-level permissions (App + Organization roles) with granular access control
- **🏢 Multi-Tenant Ready**: Complete organization management with teams, invitations, and member roles
- **⚡ High Performance**: Built on Hono framework with Bun runtime for maximum speed
- **🔑 Modern Auth**: Better-Auth integration with session-based security
- **📊 Production Database**: MySQL 8.0 + Prisma ORM with type safety
- **🧪 Developer Experience**: Hot reload, comprehensive logging, auto-generated docs
- **📝 Complete Documentation**: Detailed API docs with OpenAPI specification

## 🛠️ Tech Stack

| Component | Technology | Version |
|-----------|------------|---------|
| **Runtime** | [Bun](https://bun.sh) | Latest |
| **Framework** | [Hono](https://hono.dev) | ^4.9.6 |
| **Authentication** | [Better-Auth](https://www.better-auth.com) | ^1.3.7 |
| **Database** | [MySQL](https://mysql.com) + [Prisma](https://prisma.io) | 8.0 + ^6.15.0 |
| **Validation** | [Zod](https://zod.dev) | ^4.0 |
| **Logging** | [Pino](https://getpino.io) | ^9.9.1 |
| **Code Quality** | [BiomeJS](https://biomejs.dev) | ^2.2.2 |

## 🚀 Quick Start

### Prerequisites

- **Bun** runtime installed ([Install Guide](https://bun.sh/docs/installation))
- **Docker** for database (or local MySQL 8.0)
- **Git** for cloning

### 1. Setup Project

```bash
# Clone and install dependencies
git clone <repository-url>
cd api-boilerplate
bun install
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env
```

**Essential environment variables:**

```env
# Better Auth Configuration
BETTER_AUTH_SECRET=your-super-secret-key-here-min-32-chars
BETTER_AUTH_URL=http://localhost:3000

# Database Configuration  
DATABASE_URL=mysql://app_user:app_password@localhost:3306/api_boilerplate
SHADOW_DATABASE_URL=mysql://app_user:app_password@localhost:3306/api_boilerplate_shadow

# Application
NODE_ENV=development
APP_PORT=3000
```

### 3. Start Database

```bash
# Start MySQL with Docker (recommended)
docker-compose up -d mysql

# Verify database is ready
docker-compose ps
```

### 4. Initialize Database

```bash
# Generate Prisma client and run migrations
bun run db:generate
bun run db:migrate
```

### 5. Start Development

```bash
# Start with hot reload
bun run dev
# ✅ API running at http://localhost:3000/api/v1
```

### 🎯 Test Your Setup

```bash
# Test public endpoints
curl http://localhost:3000/api/v1/health/api
curl http://localhost:3000/api/v1/system/stats

# Test protected endpoint (expect 401)
curl http://localhost:3000/api/v1/me
```

## 🔐 Authentication & RBAC System

### Authentication Flow

The API uses **Better-Auth** with session-based authentication:

1. **Register/Login** → Get session cookie
2. **Session Management** → Automatic cookie handling  
3. **Role Assignment** → App-level roles (`admin`/`user`)
4. **Organization Access** → Join orgs with specific roles
5. **Permission Validation** → Middleware checks for each endpoint

### RBAC Hierarchy

```
🎯 App-Level Roles
├── admin → System administrator (global access to /admin/*)
└── user  → Authenticated user (access to /me/* + organization features)

🏢 Organization-Level Roles  
├── owner  → Full control (delete org, manage all)
├── admin  → Manage members, teams, settings
└── member → Basic access to organization resources
```

### Permission Model

Permissions are structured around **resources** and **actions**:

- **Resources**: `user`, `organization`, `team`, `invitation`, `member`
- **Actions**: `create`, `read`, `update`, `delete`, `manage`, `invite`, `ban`

**Example Permission Checks:**
```typescript
// Organization admin can invite members
user.hasPermission('invitation.create', organizationId)

// Only owners can delete organizations  
user.hasRole('owner', organizationId)

// System admins bypass organization permissions
user.hasSystemRole('admin')
```

## 📚 API Overview

### Endpoint Categories

| Category | Base Path | Authentication | Description |
|----------|-----------|----------------|-------------|
| **System** | `/api/v1/health/*` | Public | Health checks, system stats |
| **Auth** | `/api/v1/auth/*` | Public | Better-Auth endpoints (auto-generated) |
| **User** | `/api/v1/me/*` | Session Required | User profile, organizations, invitations |
| **Organizations** | `/api/v1/organizations/*` | Session + Membership | Multi-tenant org management |
| **Admin** | `/api/v1/admin/*` | Admin Role Required | System administration |

### Essential API Examples

#### User Registration & Login

```bash
# Register new user
curl -X POST http://localhost:3000/api/v1/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@example.com","password":"password123","name":"Developer"}'

# Login (get session cookie)
curl -X POST http://localhost:3000/api/v1/auth/sign-in \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"dev@example.com","password":"password123"}'
```

#### User Profile & Organizations

```bash
# Get my profile (with session)
curl http://localhost:3000/api/v1/me \
  -b cookies.txt

# Get my organizations
curl http://localhost:3000/api/v1/me/organizations \
  -b cookies.txt
```

#### Organization Management

```bash
# Create organization
curl -X POST http://localhost:3000/api/v1/organizations \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"name":"My Company","slug":"my-company"}'

# Invite member to organization  
curl -X POST http://localhost:3000/api/v1/organizations/{id}/invite \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"email":"member@example.com","role":"admin"}'
```

#### Admin Operations (Admin Role Required)

```bash
# List all users with pagination
curl http://localhost:3000/api/v1/admin/users?page=1&limit=10 \
  -b cookies.txt

# Ban a user
curl -X POST http://localhost:3000/api/v1/admin/users/{id}/ban \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"reason":"Policy violation","expiresAt":"2024-12-31T23:59:59Z"}'
```

## 🛠️ Development Commands

### Core Development

```bash
bun run dev              # Start with hot reload
bun run build            # Build for production  
bun run start            # Start production server
```

### Database Management

```bash
bun run db:generate      # Generate Prisma client
bun run db:migrate       # Create and run migrations
bun run db:studio        # Open Prisma Studio (DB GUI)
bun run db:push          # Push schema changes
bun run db:reset         # Reset database (⚠️ destroys data)
```

### Code Quality & Documentation

```bash
bun run lint             # Run BiomeJS linter
bun run lint:fix         # Auto-fix linting issues
bun run gen:openapi      # Generate OpenAPI spec
bun run gen:docs         # Generate API documentation
```

### Docker Operations

```bash
# Database only
docker-compose up -d mysql

# Database + Monitoring Stack
docker-compose up -d mysql loki promtail grafana

# View logs
docker-compose logs mysql
docker-compose logs grafana

# Stop services
docker-compose down

# Full stack (uncomment api service in docker-compose.yml)
docker-compose up -d
```

### 📊 Monitoring & Observability

The project includes a complete **Grafana monitoring stack** with:

- **Grafana**: Web interface at http://localhost:3001 (admin/admin123)
- **Loki**: Log aggregation and storage (30-day retention)
- **Promtail**: Automatic log collection from `/logs/` directory

#### Start Monitoring

```bash
# Start monitoring stack
docker-compose up -d loki promtail grafana

# Verify services
docker-compose ps
```

#### Pre-built Dashboards

| Dashboard | URL | Purpose |
|-----------|-----|---------|
| **API Performance** | http://localhost:3001/d/api-performance | Response times, request rates, status codes |
| **Auth & Security** | http://localhost:3001/d/auth-security | Login events, admin actions, security alerts |
| **System Health** | http://localhost:3001/d/system-health | API status, errors, database connectivity |
| **RBAC Activity** | http://localhost:3001/d/rbac-activity | Organization operations, permissions |

#### Quick Monitoring Setup

1. **Ensure log generation**: Set `NODE_ENV=production` in `.env`
2. **Start monitoring**: `docker-compose up -d loki promtail grafana`
3. **Access Grafana**: http://localhost:3001 (admin/admin123)
4. **View dashboards**: Pre-configured dashboards appear automatically

See [**Monitoring Documentation**](./monitoring/README.md) for detailed setup and customization.

## 🧪 Testing & Debugging

### Development Logging

The API includes comprehensive logging with **Pino**:

- **Console**: Pretty-formatted logs in development
- **Files**: Structured JSON logs in production
- **Categories**: Access, errors, auth events, admin actions, system events

```bash
# View recent errors
tail -f logs/error.log

# Monitor API access
tail -f logs/access.log

# Watch auth events
tail -f logs/auth.log
```

### Common Debugging

```bash
# Check API health
curl http://localhost:3000/api/v1/health/api

# Verify database connection
curl http://localhost:3000/api/v1/health/db

# Test authentication (should return 401 without session)
curl http://localhost:3000/api/v1/me

# Check your permissions
curl http://localhost:3000/api/v1/system/permissions -b cookies.txt
```

## 📖 Complete Documentation

| Document | Description | Use Case |
|----------|-------------|----------|
| **[📋 Quick Reference](./docs/endpoints-quick-reference.md)** | Concise endpoint tables by role | Fast API lookup during development |
| **[📚 Complete API Docs](./docs/api-endpoints.md)** | Detailed endpoint docs with schemas | Integration development |
| **[📝 Logging Guide](./docs/logging.md)** | Logging system & monitoring setup | Production debugging & monitoring |
| **[🗺️ Documentation Index](./docs/README.md)** | Navigation & architecture overview | Understanding system design |

### Auto-Generated Documentation

```bash
# Generate and view OpenAPI docs
bun run gen:openapi
# Visit: http://localhost:3000/api/v1/auth/reference
```

## 🗂️ Project Structure

```
src/
├── index.ts                    # Application entry point + main router
├── config.ts                   # Environment configuration
├── api/                        # API route handlers
│   ├── auth.ts                # Better-Auth integration
│   ├── me.ts                  # User profile routes  
│   ├── admin.ts               # Admin management routes
│   └── organizations.ts       # Organization & team routes
├── lib/                       # Core libraries
│   ├── auth.ts                # Better-Auth configuration
│   ├── permissions.ts         # RBAC permission definitions
│   ├── middleware/rbac.ts     # RBAC middleware
│   └── utils/rbac.ts          # RBAC utility functions
└── services/
    └── logger.ts              # Pino logger configuration

docs/                          # Complete API documentation
prisma/                        # Database schema & migrations
logs/                          # Application logs (created at runtime)
```

## 🚨 Production Considerations

### Security Checklist

- [ ] **Strong secrets**: Use 32+ character `BETTER_AUTH_SECRET`
- [ ] **Database security**: Change default MySQL passwords
- [ ] **CORS configuration**: Set proper origins for production
- [ ] **HTTPS**: Enable SSL/TLS in production
- [ ] **Rate limiting**: Implement request throttling
- [ ] **Log rotation**: Set up log management

### Performance & Monitoring

- **Logging**: All requests logged with correlation IDs
- **Health endpoints**: Monitor API and database status
- **Metrics**: Ready for Grafana/monitoring integration
- **Database**: Optimized Prisma queries with proper indexing

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Follow** code style: Run `bun run lint:fix`
4. **Test** your changes thoroughly
5. **Submit** a pull request

## 📄 License

This project is licensed under the **MIT License** - see the LICENSE file for details.

---

**🚀 Ready to build?** Start with the [Quick Start](#-quick-start) guide above, then explore the [complete documentation](./docs/) for advanced features and deployment strategies.
# API Boilerplate

A modern API boilerplate built with Hono and TypeScript, designed for scalability and maintainability.

## Quick Start

### 1. Install dependencies

```sh
bun install
```

### 2. Set up the database

```sh
# Start MySQL with Docker Compose
docker-compose up -d mysql

# Wait for the database to be ready (check health status)
docker-compose ps
```

### 3. Configure environment

```sh
# Copy environment variables
cp .env.example .env

# Edit .env with your preferred settings (optional)
```

### 4. Run the application

```sh
bun run dev
```

Open http://localhost:3000

## Database Setup

This project uses MySQL 8.0 running in Docker. The database configuration includes:

- **Database Name**: `api_boilerplate`
- **User**: `app_user`
- **Password**: `app_password` (change in production!)
- **Port**: `3306`

### Docker Compose Commands

```sh
# Start all services
docker-compose up -d

# Start only MySQL
docker-compose up -d mysql

# View logs
docker-compose logs mysql

# Stop services
docker-compose down

# Stop and remove volumes (⚠️ This will delete all data)
docker-compose down -v
```

### Database Connection

The database URL format for your application:

```
mysql://app_user:app_password@localhost:3306/api_boilerplate
```

### Initial Schema

The database comes with sample tables:

- `users` - User accounts with email, name, and password hash
- `posts` - Blog posts linked to users

See `mysql/init/01-init.sql` for the complete schema and sample data.

## Environment Variables

| Variable              | Description                   | Default           |
| --------------------- | ----------------------------- | ----------------- |
| `MYSQL_ROOT_PASSWORD` | MySQL root password           | `rootpassword`    |
| `MYSQL_DATABASE`      | Database name                 | `api_boilerplate` |
| `MYSQL_USER`          | Application database user     | `app_user`        |
| `MYSQL_PASSWORD`      | Application database password | `app_password`    |
| `MYSQL_PORT`          | MySQL port                    | `3306`            |
| `APP_PORT`            | Application port              | `3000`            |
| `NODE_ENV`            | Node environment              | `development`     |

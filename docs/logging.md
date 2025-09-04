# Logging System Documentation

## Overview

This application uses Pino logger with a comprehensive logging strategy designed for both development and production environments, with preparation for Grafana/monitoring integration.

## Log Files Structure

```
logs/
├── app.log         # General application logs (info level and above)
├── error.log       # Error logs only (error level and above)  
├── access.log      # HTTP access logs (all requests)
├── auth.log        # Authentication events
├── admin.log       # Admin operations (audit trail)
└── system.log      # System events (startup, health, etc.)
```

## Log Levels

- **TRACE (10)**: Very detailed debugging information
- **DEBUG (20)**: Debug information for development
- **INFO (30)**: General information messages
- **WARN (40)**: Warning messages
- **ERROR (50)**: Error messages
- **FATAL (60)**: Fatal errors that cause application termination

## Environment Configuration

### Development
- **Output**: Console with pretty formatting
- **Level**: DEBUG and above
- **Colors**: Enabled
- **Format**: Human-readable with timestamps

### Production  
- **Output**: Multiple file targets + console
- **Level**: INFO and above
- **Format**: JSON (machine-readable)
- **Files**: Automatically created with rotation

## Specialized Loggers

### Access Logger
```typescript
import { accessLogger, logApiCall } from '../services/logger';

// Log HTTP requests
logApiCall('GET', '/api/users', 200, 150, { userId: '123' });
```

### Error Logger
```typescript
import { errorLogger, logError } from '../services/logger';

try {
  // risky operation
} catch (error) {
  logError(error, { userId: '123', operation: 'create-user' });
}
```

### Auth Logger  
```typescript
import { logAuthEvent } from '../services/logger';

// Log authentication events
logAuthEvent('login_success', { id: '123', email: 'user@example.com' });
logAuthEvent('login_failure', undefined, { email: 'user@example.com', reason: 'invalid_password' });
```

### Admin Logger
```typescript
import { logAdminAction } from '../services/logger';

// Log admin operations for audit trail
logAdminAction('delete_user', adminUser, 'user_123', { reason: 'policy_violation' });
```

### System Logger
```typescript
import { logSystemEvent } from '../services/logger';

// Log system events
logSystemEvent('application_startup', { port: 3000, env: 'production' });
logSystemEvent('database_connected', { host: 'localhost', database: 'api_db' });
```

## Context and Correlation

All loggers support additional context:

```typescript
logger.info({
  requestId: 'req_123',     // Request correlation ID
  userId: 'user_456',       // User context
  operation: 'create_post', // Operation type
  duration: 150,            // Timing info
  metadata: { ... }         // Additional data
}, 'Post created successfully');
```

## Log Rotation

Production logs are automatically rotated using `logrotate`:

- **Access logs**: Hourly rotation, 7 days retention
- **Error logs**: Daily rotation, 90 days retention  
- **Admin logs**: Weekly rotation, 1 year retention
- **Auth logs**: Daily rotation, 6 months retention
- **General logs**: Daily rotation, 30 days retention

### Setup Logrotate

1. Copy the logrotate configuration:
   ```bash
   sudo cp logrotate.conf /etc/logrotate.d/api-boilerplate
   ```

2. Update paths in the configuration file:
   ```bash
   sudo nano /etc/logrotate.d/api-boilerplate
   # Replace /path/to/api-boilerplate with actual path
   ```

3. Test the configuration:
   ```bash
   sudo logrotate -d /etc/logrotate.d/api-boilerplate
   ```

4. Force rotation (if needed):
   ```bash
   sudo logrotate -f /etc/logrotate.d/api-boilerplate
   ```

## Grafana Integration

Logs are formatted for easy ingestion into monitoring systems:

### JSON Structure
```json
{
  "level": "info",
  "time": "2024-01-15T10:30:00.000Z",
  "msg": "User login successful",
  "component": "auth",
  "userId": "user_123",
  "email": "user@example.com",
  "requestId": "req_456",
  "duration": 150,
  "userAgent": "Mozilla/5.0...",
  "ip": "192.168.1.1"
}
```

### Grafana Loki Integration
1. Configure Promtail to collect logs from `/logs/` directory
2. Use component labels for filtering: `{component="auth"}`, `{component="api"}`
3. Set up alerts based on error rates and patterns
4. Create dashboards for request volume, error rates, and performance metrics

## Performance Considerations

- **File I/O**: Optimized with async writes
- **Log Rotation**: External `logrotate` tool (no JavaScript overhead)
- **Development**: Pretty printing only in dev/test environments
- **Production**: JSON format for minimal processing overhead
- **Context**: Structured data for efficient querying and filtering

## Security

- **Sensitive Data**: Automatically sanitized (passwords, tokens)
- **User Data**: Only essential fields logged (ID, email, role)
- **Admin Actions**: Full audit trail with timestamps
- **Auth Events**: Detailed security event logging

## Monitoring Queries

### Common Log Analysis
```bash
# Error rate monitoring
grep '"level":"error"' logs/app.log | wc -l

# Authentication failures
grep 'login_failure' logs/auth.log

# Admin operations
grep '"component":"admin"' logs/app.log

# Performance analysis
grep 'duration' logs/app.log | jq '.duration' | sort -n
```

### Grafana Dashboard Metrics
- Request volume by endpoint
- Error rate by component  
- Authentication success/failure rates
- Admin operation frequency
- Response time percentiles
- Log volume by level
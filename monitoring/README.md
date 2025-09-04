# 📊 Grafana Monitoring Stack

Complete monitoring solution for the API Boilerplate with Grafana, Loki, and Promtail.

## 🚀 Quick Start

### 1. Environment Configuration

Add the following to your `.env` file:

```env
# Grafana Configuration
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=admin123

# Ensure logs are generated (set to production for file logging)
NODE_ENV=production
```

### 2. Start Monitoring Stack

```bash
# Start the complete monitoring stack
docker-compose up -d loki promtail grafana

# Verify services are running
docker-compose ps
```

### 3. Access Dashboards

- **Grafana**: http://localhost:3001
- **Login**: admin / admin123 (configurable via environment)
- **Loki**: http://localhost:3100 (internal)

## 📈 Available Dashboards (10 Total)

### 🏃‍♂️ **Operational Dashboards**

#### 1. API Performance Dashboard
- **URL**: http://localhost:3001/d/api-performance
- **Metrics**: Request rates, response times, status codes, endpoint usage
- **Use Case**: Daily performance monitoring and bottleneck identification

#### 2. System Health Dashboard  
- **URL**: http://localhost:3001/d/system-health
- **Metrics**: API status, database connection, error rates, system events
- **Use Case**: Infrastructure monitoring and troubleshooting

#### 3. Real-time Operations Dashboard
- **URL**: http://localhost:3001/d/real-time-ops (5s refresh)
- **Metrics**: Live RPS, current response times, active users, live request stream
- **Use Case**: Live monitoring and incident response

### 🔐 **Security & Compliance Dashboards**

#### 4. Authentication & Security Dashboard
- **URL**: http://localhost:3001/d/auth-security
- **Metrics**: Login success/failures, admin actions, unauthorized attempts
- **Use Case**: Security monitoring and audit trail

#### 5. RBAC Activity Dashboard
- **URL**: http://localhost:3001/d/rbac-activity
- **Metrics**: Organization operations, permissions, member management
- **Use Case**: Permission system monitoring and access control

### 📊 **Business Intelligence Dashboards**

#### 6. Business Metrics Dashboard
- **URL**: http://localhost:3001/d/business-metrics
- **Metrics**: Active users, new organizations, feature usage, success rates
- **Use Case**: Business KPIs and growth tracking

#### 7. User Activity Dashboard
- **URL**: http://localhost:3001/d/user-activity
- **Metrics**: User engagement, session patterns, browser analytics
- **Use Case**: User behavior analysis and engagement optimization

### 🔧 **Technical Analysis Dashboards**

#### 8. Error Analysis Dashboard
- **URL**: http://localhost:3001/d/error-analysis
- **Metrics**: Error trends, failure analysis, slow requests, debugging info
- **Use Case**: Debugging, troubleshooting, and error pattern analysis

#### 9. API Endpoint Details Dashboard
- **URL**: http://localhost:3001/d/api-endpoint-details
- **Metrics**: Per-endpoint performance, percentiles, method distribution
- **Use Case**: Deep-dive endpoint analysis and optimization

#### 10. Database Monitoring Dashboard
- **URL**: http://localhost:3001/d/database-monitoring
- **Metrics**: Query performance, connection health, table access patterns
- **Use Case**: Database performance optimization and troubleshooting

### 📚 **Comprehensive Documentation**
- **[Dashboard Templates Guide](./DASHBOARD_TEMPLATES.md)** - Detailed dashboard documentation
- **[Dashboard Improvements](./DASHBOARD_IMPROVEMENTS.md)** - Text size and visual improvements

## 🔧 Configuration Details

### Log Collection

Promtail collects logs from:
- `./logs/app.log` - General application logs
- `./logs/error.log` - Error logs only
- `./logs/access.log` - HTTP access logs

### Data Retention

- **Loki**: 30 days (720 hours)
- **Grafana**: Persistent storage with Docker volumes
- **Log Rotation**: Handled by your existing logrotate configuration

### Service Ports

| Service | Port | Description |
|---------|------|-------------|
| Grafana | 3001 | Web interface |
| Loki | 3100 | Log aggregation API |
| Promtail | 9080 | Log collection (internal) |

## 🚨 Troubleshooting

### Common Issues

#### No Logs Appearing
1. Check if logs are being generated:
   ```bash
   ls -la logs/
   tail -f logs/app.log
   ```

2. Ensure `NODE_ENV=production` for file logging

3. Verify Promtail is reading logs:
   ```bash
   docker logs api-boilerplate-promtail
   ```

#### Grafana Connection Issues
1. Check if Loki is running:
   ```bash
   curl http://localhost:3100/ready
   ```

2. Verify Grafana can reach Loki:
   ```bash
   docker-compose logs grafana
   ```

#### Permission Errors
```bash
# Fix log file permissions
sudo chown -R $(whoami):$(whoami) logs/
chmod 644 logs/*.log
```

### Service Management

```bash
# Start only monitoring stack
docker-compose up -d loki promtail grafana

# View logs for specific service
docker-compose logs -f grafana
docker-compose logs -f loki
docker-compose logs -f promtail

# Restart monitoring stack
docker-compose restart loki promtail grafana

# Stop monitoring stack
docker-compose stop loki promtail grafana
```

## 📊 Custom Queries

### Useful Loki Queries

```logql
# All API requests in last hour
{component="api"}

# Error logs only
{component="error"}

# Failed authentication attempts
{component="auth"} |~ "login_failure"

# Admin actions
{component="admin"}

# Slow requests (>1000ms)
{component="api"} | json | duration > 1000

# Requests by specific user
{component="api"} | json | userId="user_123"

# Organization operations
{path=~"/api/v1/organizations.*"}

# Permission denials
{path=~"/api/v1/.*"} |~ "403|401"
```

### Performance Queries

```logql
# Average response time by endpoint
avg_over_time({component="api"} | json | unwrap duration [5m]) by (path)

# Request rate
rate({component="api"}[5m])

# Error rate
rate({component="error"}[5m])

# Status code distribution
sum by (statusCode) (rate({component="api"} | json [5m]))
```

## 🔐 Security

### Access Control
- Grafana admin access only (no anonymous access)
- Internal Docker network for Loki/Promtail communication
- Log data retention limited to 30 days

### Sensitive Data
- Passwords and tokens are automatically sanitized in logs
- User emails may appear in logs for audit purposes
- Admin actions are logged for compliance

## 🚀 Production Considerations

### Resource Usage
- **Loki**: ~200MB RAM, varies with log volume
- **Grafana**: ~100MB RAM
- **Promtail**: ~50MB RAM

### Scaling
For high-volume production:
1. Consider external Loki deployment
2. Implement log sampling in Promtail
3. Use external storage for Grafana
4. Configure log retention based on compliance needs

### Backup
```bash
# Backup Grafana data
docker-compose exec grafana tar czf /var/lib/grafana/backup.tar.gz /var/lib/grafana/

# Copy backup from container
docker cp api-boilerplate-grafana:/var/lib/grafana/backup.tar.gz ./grafana-backup.tar.gz
```

## 📝 Customization

### Adding Custom Dashboards
1. Create JSON dashboard file in `monitoring/grafana/dashboards/`
2. Restart Grafana: `docker-compose restart grafana`
3. Dashboard appears automatically in "API Monitoring" folder

### Modifying Log Collection
Edit `monitoring/promtail/config.yml` to:
- Add new log files
- Change parsing rules
- Add custom labels
- Filter specific log levels

### Adjusting Retention
Edit `monitoring/loki/local-config.yaml`:
```yaml
limits_config:
  retention_period: 1440h  # 60 days instead of 30
```

## 🤝 Contributing

To improve monitoring:
1. Add new dashboard JSON files
2. Enhance Promtail parsing rules
3. Create useful query templates
4. Improve documentation

## 📚 Resources

- [Grafana Documentation](https://grafana.com/docs/)
- [Loki Documentation](https://grafana.com/docs/loki/)
- [Promtail Configuration](https://grafana.com/docs/loki/latest/clients/promtail/configuration/)
- [LogQL Query Language](https://grafana.com/docs/loki/latest/logql/)

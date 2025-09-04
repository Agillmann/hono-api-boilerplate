# 📊 Dashboard Templates & Use Cases

Complete collection of pre-built Grafana dashboards for comprehensive API monitoring.

## 🎯 Dashboard Overview

| Dashboard | URL | Refresh | Use Case | Key Metrics |
|-----------|-----|---------|----------|-------------|
| **API Performance** | `/d/api-performance` | 30s | Performance monitoring | Response times, request rates, status codes |
| **Auth & Security** | `/d/auth-security` | 30s | Security monitoring | Login events, admin actions, unauthorized attempts |
| **System Health** | `/d/system-health` | 30s | Infrastructure monitoring | API status, errors, database connectivity |
| **RBAC Activity** | `/d/rbac-activity` | 30s | Permission monitoring | Organization ops, member management |
| **Business Metrics** | `/d/business-metrics` | 30s | Business intelligence | Active users, growth metrics, feature usage |
| **Error Analysis** | `/d/error-analysis` | 30s | Debugging & troubleshooting | Error trends, slow queries, failure analysis |
| **User Activity** | `/d/user-activity` | 30s | User behavior analytics | User engagement, session patterns |
| **API Endpoint Details** | `/d/api-endpoint-details` | 30s | Per-endpoint analysis | Detailed endpoint performance |
| **Real-time Operations** | `/d/real-time-ops` | 5s | Live monitoring | Real-time metrics, live request stream |
| **Database Monitoring** | `/d/database-monitoring` | 30s | Database performance | Query performance, connection health |

## 📈 Dashboard Categories

### 🏃‍♂️ **Operational Dashboards** (Day-to-day monitoring)

#### 1. **API Performance Dashboard**
**Purpose**: Monitor overall API health and performance
**Key Panels**:
- API Requests by Endpoint (table)
- Average Response Time by Endpoint (timeseries)
- Request Rate (timeseries)
- Status Codes Distribution (timeseries)

**Use Cases**:
- Daily performance monitoring
- Identifying slow endpoints
- Tracking request volume patterns
- SLA compliance monitoring

#### 2. **System Health Dashboard**
**Purpose**: Infrastructure and system status monitoring
**Key Panels**:
- API Status (UP/DOWN indicator)
- Database Status (connection health)
- Total Errors (error count)
- Average Response Time (current performance)
- Error Rate (trend analysis)
- System Events (infrastructure logs)
- Recent Errors (debugging table)

**Use Cases**:
- System uptime monitoring
- Infrastructure health checks
- Quick error identification
- Database connectivity monitoring

#### 3. **Real-time Operations Dashboard**
**Purpose**: Live monitoring for operations teams
**Key Panels**:
- Current RPS (requests per second)
- Current Average Response (real-time performance)
- Active Users (5-minute window)
- Current Error Rate (immediate issues)
- Live Request Stream (real-time activity)
- Real-time Request & Error Rate (trending)
- Real-time Response Times (performance)
- Live Authentication Events (security)

**Use Cases**:
- Incident response
- Live system monitoring
- Real-time troubleshooting
- Operations center displays

### 🔐 **Security Dashboards** (Security and compliance monitoring)

#### 4. **Authentication & Security Dashboard**
**Purpose**: Security monitoring and audit trail
**Key Panels**:
- Successful Logins (success metrics)
- Failed Logins (security alerts)
- Admin Actions (audit trail)
- Unauthorized Attempts (security incidents)
- Authentication Events Over Time (trends)
- Recent Admin Actions (audit log)
- Failed Login Attempts (security table)

**Use Cases**:
- Security incident monitoring
- Compliance auditing
- Admin activity tracking
- Breach detection

#### 5. **RBAC Activity Dashboard**
**Purpose**: Role-based access control monitoring
**Key Panels**:
- Organization Operations (activity metrics)
- Member Invitations (growth tracking)
- Team Operations (team management)
- Member Removals (churn tracking)
- Organization Activity by Method (operation types)
- Organization Endpoint Status Codes (success rates)
- Member Invitation Activity (detailed invitations)
- RBAC Permission Denials (access violations)

**Use Cases**:
- Permission system monitoring
- Organization growth tracking
- Access violation detection
- Team management analytics

### 📊 **Business Intelligence Dashboards** (Strategic insights)

#### 6. **Business Metrics Dashboard**
**Purpose**: Business KPIs and growth metrics
**Key Panels**:
- Active Users (engagement metrics)
- New Organizations (growth tracking)
- Team Invitations (collaboration metrics)
- Success Rate (quality metrics)
- User Activity Over Time (engagement trends)
- Top API Endpoints Usage (feature popularity)
- Feature Usage Trends (adoption patterns)

**Use Cases**:
- Product metrics tracking
- User engagement analysis
- Feature adoption monitoring
- Business growth insights

#### 7. **User Activity Dashboard**
**Purpose**: Detailed user behavior analysis
**Key Panels**:
- Active Users (1h window)
- Total Logins (authentication metrics)
- New Users (24h growth)
- Average Session Time (engagement)
- User Activity Timeline (behavior patterns)
- Authentication Events (login/logout trends)
- Most Active Users (power users)
- User Feature Usage (feature adoption)
- User Browsers (technical analytics)
- Recent User Sessions (activity log)

**Use Cases**:
- User behavior analysis
- Product usage insights
- User engagement optimization
- Technical analytics

### 🔧 **Technical Dashboards** (Development and debugging)

#### 8. **Error Analysis Dashboard**
**Purpose**: Comprehensive error analysis and debugging
**Key Panels**:
- Total Errors (error volume)
- 5xx Errors (server errors)
- 4xx Errors (client errors)
- Error Rate (error percentage)
- Error Trends (error patterns over time)
- Error Distribution by Status Code (error types)
- Top Error Endpoints (problematic endpoints)
- Recent Error Messages (debugging info)
- Errors by Component (component health)
- Slow Requests (>5s performance issues)

**Use Cases**:
- Bug investigation
- Performance troubleshooting
- Error pattern analysis
- System debugging

#### 9. **API Endpoint Details Dashboard**
**Purpose**: Deep-dive endpoint performance analysis
**Key Panels**:
- Response Time Percentiles by Endpoint (P50, P95)
- Request Rate by Endpoint (traffic analysis)
- Endpoint Performance Summary (comprehensive table)
- HTTP Methods Usage (method distribution)

**Features**:
- **Endpoint filtering**: Template variable to filter by specific endpoints
- **Percentile analysis**: P50 and P95 response times
- **Method breakdown**: Analysis by HTTP method
- **Performance correlation**: Request rate vs response time

**Use Cases**:
- Endpoint optimization
- Performance bottleneck identification
- API design decisions
- Load testing analysis

#### 10. **Database Monitoring Dashboard**
**Purpose**: Database performance and health monitoring
**Key Panels**:
- Database Connection (connectivity status)
- Database Queries (query volume)
- Database Errors (DB-specific errors)
- Average Query Time (DB performance)
- Database Operations by Method (operation types)
- Database Table Access (table usage patterns)
- Query Performance by Endpoint (endpoint-to-DB correlation)
- Slow Database Queries (>2s performance issues)
- Recent Database Errors (DB error log)

**Use Cases**:
- Database performance optimization
- Query performance analysis
- Connection health monitoring
- Database troubleshooting

## 🎨 Design Patterns

### Visual Consistency
- **Stat Panels**: Large, centered text with value + name display
- **Timeseries**: Consistent colors and legends
- **Tables**: Optimized column widths and sorting
- **Pie Charts**: Donut style with legend tables

### Color Coding Standards
- **Green**: Success, healthy status
- **Yellow**: Warning, moderate values
- **Red**: Errors, critical issues
- **Blue**: Information, neutral metrics
- **Orange**: Warnings, attention needed

### Refresh Intervals
- **Real-time**: 5s refresh (live operations)
- **Standard**: 30s refresh (most dashboards)
- **Historical**: 1m+ refresh (trend analysis)

## 🚀 Customization Templates

### Adding New Dashboard
1. **Copy existing dashboard** as template
2. **Modify queries** for new metrics
3. **Update panel titles** and descriptions
4. **Adjust time ranges** as needed
5. **Save to** `monitoring/grafana/dashboards/`
6. **Restart Grafana** to load

### Common Query Patterns

#### Rate Calculations
```logql
# Request rate
sum(rate({component="api"} [$__interval]))

# Error rate  
sum(rate({level="error"} [$__interval]))

# Per-endpoint rate
sum by (path) (rate({component="api"} | json [$__interval]))
```

#### Performance Metrics
```logql
# Average response time
avg_over_time({component="api"} | json | unwrap duration [$__interval])

# Percentiles
quantile_over_time(0.95, {component="api"} | json | unwrap duration [$__interval])

# Slow requests
{component="api"} | json | duration > 1000
```

#### Business Metrics
```logql
# Active users
count(count by (userId) (count_over_time({component="api"} | json | userId != "" [$__range])))

# Feature usage
sum by (path) (count_over_time({component="api"} | json | path=~"/api/v1/(me|organizations).*" [$__range]))
```

#### Security Monitoring
```logql
# Failed logins
{component="auth"} |~ "login_failure"

# Admin actions
{component="admin"}

# Permission denials
{path=~"/api/v1/.*"} |~ "403|401"
```

## 🎯 Use Case Scenarios

### **Incident Response**
1. **Real-time Operations** - Live monitoring
2. **System Health** - Infrastructure status
3. **Error Analysis** - Root cause analysis
4. **Database Monitoring** - Database issues

### **Performance Optimization**
1. **API Performance** - Overall performance
2. **API Endpoint Details** - Per-endpoint analysis
3. **Database Monitoring** - Query optimization
4. **Error Analysis** - Bottleneck identification

### **Business Analysis**
1. **Business Metrics** - KPI tracking
2. **User Activity** - User behavior
3. **RBAC Activity** - Feature usage
4. **Auth & Security** - User engagement

### **Security Monitoring**
1. **Auth & Security** - Primary security dashboard
2. **RBAC Activity** - Permission monitoring
3. **Error Analysis** - Security error patterns
4. **User Activity** - Suspicious behavior

## 📚 Advanced Features

### Template Variables
- **Endpoint filtering**: Filter by specific API endpoints
- **User filtering**: Focus on specific users
- **Time range**: Flexible time window selection
- **Component filtering**: Focus on specific log components

### Drill-down Capabilities
- **Correlation IDs**: Click to see related log entries
- **User IDs**: Click to see user-specific activity
- **Error traces**: Click to see full error context
- **Endpoint analysis**: Click to see endpoint details

### Export & Sharing
- **Dashboard export**: JSON format for sharing
- **Panel export**: Individual panel sharing
- **Snapshot creation**: Point-in-time sharing
- **Embedding**: Dashboard embedding in other tools

## 🔄 Maintenance

### Dashboard Updates
- **Version control**: All dashboards in Git
- **Backup strategy**: Regular exports
- **Testing**: Validate queries before deployment
- **Documentation**: Update this guide with changes

### Performance Optimization
- **Query optimization**: Efficient LogQL queries
- **Time range limits**: Reasonable default ranges
- **Panel limits**: Limit result sets for performance
- **Caching**: Leverage Grafana query caching

The dashboard collection provides comprehensive monitoring coverage from real-time operations to strategic business intelligence, with consistent design patterns and extensible architecture for future enhancements.

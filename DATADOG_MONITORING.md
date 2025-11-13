# Datadog Synthetic Monitoring for Watchtower

This guide shows how to set up comprehensive Datadog Synthetic tests and monitors for your Watchtower healthcheck endpoint.

## 🎯 Overview

Watchtower's structured JSON response makes it perfect for Datadog Synthetic monitoring. You can:
- Monitor overall site health
- Alert on specific service failures (Algolia, Pages, etc.)
- Track performance metrics
- Set up escalation policies

## 📊 Basic Synthetic Test Setup

### 1. Create HTTP Test in Datadog

**Navigation:** Synthetic Monitoring → New Test → HTTP Test

### 2. Basic Configuration

```yaml
Name: Example Healthcheck Monitor
URL: https://example.com/api/healthcheck
Method: GET
Timeout: 30 seconds
```

### 3. Add Authentication Header

```yaml
Headers:
  Authorization: Bearer {{HEALTHCHECK_TOKEN}}
```

**Setup the variable:**
- Go to: Synthetic Tests → Variables
- Create: `HEALTHCHECK_TOKEN` (type: Secret)
- Value: Your actual healthcheck token

### 4. Define Assertions

**Based on Watchtower response structure:**

#### Overall Health Assertions:
```yaml
# Response must be 200 OK
Status Code: is 200

# Response must be fast (adjust based on your needs)
Response Time: less than 20000 ms

# Overall status must be Up
Body: contains "status":"Up"

# Should not have critical failures
Body: does not contain "status":"Down"
```

#### Specific Service Assertions:
```yaml
# Algolia must be healthy
JSON Path: $.services[?(@.id=='algolia')].status
Operator: contains
Value: "Up"

# Pages must be accessible
JSON Path: $.services[?(@.id=='pages')].status
Operator: contains
Value: "Up"

# Build integrity must pass
JSON Path: $.services[?(@.id=='build')].status
Operator: contains
Value: "Up"

# No failed checks
JSON Path: $.performance.checksFailed
Operator: is less than
Value: 1
```

#### Performance Assertions:
```yaml
# All checks should complete
JSON Path: $.performance.checksCompleted
Operator: is greater than
Value: 3

# Total check time reasonable
JSON Path: $.performance.totalCheckTime
Operator: is less than
Value: 20000
```

### 5. Configure Locations

Test from multiple regions:
- `aws:us-east-1` (Primary)
- `aws:us-west-2` (West coast)
- `aws:eu-west-1` (Europe if you have EU users)

### 6. Set Test Frequency

```yaml
Run every: 5 minutes (300 seconds)
```

For production, consider:
- **Critical sites:** Every 1-5 minutes
- **Standard sites:** Every 5-15 minutes
- **Development:** Every 30-60 minutes

### 7. Configure Alerting

```yaml
Alert Conditions:
  - Min failure duration: 2 minutes
  - Min locations failed: 1
  
Notification Message:
  "🚨 Healthcheck is failing!
  
  Status: {{RESULT_STATUS}}
  Response Time: {{RESULT_RESPONSE_TIME}}ms
  Failed Checks: {{RESULT_BODY.performance.checksFailed}}
  
  Details: https://example.com/api/healthcheck
  
  @slack-devops @pagerduty-oncall"
```

## 🎨 Advanced Datadog Configuration

### Multi-Step API Test (More Granular)

For deeper monitoring, create separate tests for each service:

#### Test 1: Overall Health
```yaml
Name: Example Site - Overall Health
Assertion: $.status == "Up"
Frequency: Every 5 minutes
Alert: @pagerduty-critical
```

#### Test 2: Algolia Search
```yaml
Name: Example Site - Algolia Search Health
Assertions:
  - $.services[?(@.id=='algolia')].status contains "Up"
  - $.services[?(@.id=='algolia')].services[?(@.id=='record_count')].metadata.totalRecords > 100
Frequency: Every 10 minutes
Alert: @slack-search-team
```

#### Test 3: Page Availability
```yaml
Name: Example Site - Critical Pages
Assertions:
  - $.services[?(@.id=='pages')].services[?(@.id=='critical_pages')].status contains "Up"
  - $.services[?(@.id=='pages')].metadata.successfulPages >= 3
Frequency: Every 5 minutes
Alert: @pagerduty-frontend
```

#### Test 4: GraphQL API
```yaml
Name: Example Site - GraphQL API Health
Assertions:
  - $.services[?(@.id=='http')].services[?(@.id=='graphql_api')].status contains "Up"
  - $.services[?(@.id=='http')].services[?(@.id=='graphql_api')].metadata.responseTime < 5000
Frequency: Every 5 minutes
Alert: @slack-backend-team
```

## 🚨 Alert Configuration Examples

### Critical Alert (PagerDuty)

```yaml
Monitor Name: Example Healthcheck - Critical
Query: 
  api.http.response_time{service:example-healthcheck,url:*/api/healthcheck}
Conditions:
  - Alert threshold: Response time > 20000ms
  - Warning threshold: Response time > 10000ms
  - No data: Alert after 10 minutes
Alert Message:
  "🔥 CRITICAL: Healthcheck is down or slow!
  
  Response Time: {{value}}ms
  Threshold: {{threshold}}ms
  
  Dashboard: https://app.datadoghq.com/synthetics/details/abc123
  
  @pagerduty-oncall"
```

### Warning Alert (Slack)

```yaml
Monitor Name: Example Healthcheck - Partial Service
Query:
  Custom metric from healthcheck response
Conditions:
  - Alert when: status is "Partial"
  - Warning when: checksFailed > 0
Alert Message:
  "⚠️ Site has degraded services
  
  Failed Checks: {{checksFailed}}
  Overall Status: {{status}}
  
  Details: {{response}}
  
  @slack-platform-team"
```

## 📈 Custom Metrics from Healthcheck

Create custom metrics to track in Datadog:

### JavaScript Step in Synthetic Test

```javascript
// Extract metrics from healthcheck response
const response = JSON.parse(responseBody);

// Send custom metrics to Datadog
setMetric('healthcheck.status', response.status === 'Up' ? 1 : 0);
setMetric('healthcheck.total_time', response.performance.totalCheckTime);
setMetric('healthcheck.checks_completed', response.performance.checksCompleted);
setMetric('healthcheck.checks_failed', response.performance.checksFailed);

// Service-specific metrics
response.services.forEach(service => {
  const metricName = `healthcheck.service.${service.id}.status`;
  setMetric(metricName, service.status === 'Up' ? 1 : 0);
  
  // Track response times for HTTP checks
  if (service.metadata?.responseTime) {
    setMetric(`healthcheck.service.${service.id}.response_time`, service.metadata.responseTime);
  }
});

// Algolia-specific metrics
const algolia = response.services.find(s => s.id === 'algolia');
if (algolia?.services) {
  const recordCount = algolia.services.find(s => s.id === 'record_count');
  if (recordCount?.metadata?.totalRecords) {
    setMetric('healthcheck.algolia.total_records', recordCount.metadata.totalRecords);
  }
}
```

## 🎛️ Dashboard Configuration

### Create Healthcheck Dashboard

**Widgets to include:**

#### 1. Overall Status (Query Value)
```
Query: avg:healthcheck.status{service:example}
Display: 1 = Up, 0 = Down
```

#### 2. Response Time (Timeseries)
```
Query: avg:healthcheck.total_time{service:example}
Display: Line graph over last 24h
```

#### 3. Failed Checks (Timeseries)
```
Query: sum:healthcheck.checks_failed{service:example}
Display: Bar graph
```

#### 4. Service Status Heatmap
```
Queries:
  - healthcheck.service.algolia.status
  - healthcheck.service.pages.status
  - healthcheck.service.http.status
  - healthcheck.service.build.status
Display: Heatmap (green = up, red = down)
```

#### 5. Algolia Record Count (Query Value)
```
Query: last:healthcheck.algolia.total_records{service:example}
Display: Number with threshold indicators
```

## 🔔 Alerting Strategies

### Strategy 1: Simple (Recommended for Start)

**One monitor watching overall status:**

```yaml
Name: Example Site Health - Overall Status
Type: Metric Monitor
Query: avg(last_5m):avg:synthetics.http.response.code{url:*/api/healthcheck} < 200
Alert: Status code not 200 for 5 minutes
Notify: @slack-platform @pagerduty-oncall
```

### Strategy 2: Granular (Advanced)

**Separate monitors for each service:**

#### Algolia Monitor
```yaml
Name: Example Site - Algolia Search Down
Query: Check if $.services[?(@.id=='algolia')].status != "Up"
Alert: Algolia search is down
Notify: @slack-search-team
Priority: P2 (not critical - site still works)
```

#### Critical Pages Monitor
```yaml
Name: Example Site - Critical Pages Down
Query: Check if $.services[?(@.id=='pages')].status != "Up"
Alert: Critical pages not accessible
Notify: @pagerduty-critical
Priority: P1 (critical - site is down)
```

#### GraphQL API Monitor
```yaml
Name: Example Site - GraphQL API Down
Query: Check if $.services[?(@.id=='http')].status != "Up"
Alert: GraphQL API is down
Notify: @slack-backend-team @pagerduty-api
Priority: P1 (critical - site won't load)
```

## 📋 Complete Datadog Setup Checklist

### 1. Create Synthetic Test
- [ ] Create HTTP test
- [ ] Set URL to production healthcheck endpoint
- [ ] Add `Authorization` header with token variable
- [ ] Add all assertions (see above)
- [ ] Configure 3+ locations
- [ ] Set frequency (5 minutes recommended)
- [ ] Enable alerting

### 2. Create Monitors
- [ ] Overall health monitor (critical)
- [ ] Per-service monitors (optional)
- [ ] Performance threshold monitors
- [ ] Set up notification channels

### 3. Create Dashboard
- [ ] Add status widgets
- [ ] Add performance graphs
- [ ] Add service-specific panels
- [ ] Share with team

### 4. Configure Notifications
- [ ] Slack integration
- [ ] PagerDuty integration
- [ ] Email alerts
- [ ] Set escalation policies

## 🎯 Recommended Monitor Configuration

### Production Environment

```yaml
Test Frequency: Every 5 minutes
Locations: 3+ (US East, US West, EU)
Alert After: 2 consecutive failures (10 minutes)
Renotify: Every 2 hours if still failing
Escalation: After 1 hour, page oncall
Recovery: Send "Recovered" notification
```

### Development/Staging

```yaml
Test Frequency: Every 15 minutes
Locations: 1 (US East)
Alert After: 3 consecutive failures (45 minutes)
Notify: Slack only (no pages)
```

## 💡 Pro Tips

### 1. Use Token-Based Authentication

Your config should have:
```typescript
auth: {
  token: process.env.HEALTHCHECK_TOKEN
  // In production, auth is required by default
  // Monitoring tools should use: Authorization: Bearer <token>
}
```

Datadog and other monitoring tools should send the token in the `Authorization` header:
```
Authorization: Bearer YOUR_HEALTHCHECK_TOKEN
```

This provides secure access without exposing the endpoint publicly.

### 2. Monitor Individual Service Health

Create separate alerts for each service based on criticality:

**Critical (PagerDuty):**
- Overall status Down
- Critical pages down
- GraphQL API down

**Warning (Slack):**
- Algolia search issues
- Partial service degradation
- Response time spikes

**Info (Dashboard only):**
- Build artifact checks
- Environment variable status

### 3. Track Trends Over Time

Monitor these metrics over weeks/months:
- Average response time
- Failure frequency
- Service-specific uptime
- Performance degradation patterns

## 🔧 Example Datadog Terraform Configuration

```hcl
resource "datadog_synthetics_test" "example_healthcheck" {
  name    = "Example Healthcheck Monitor"
  type    = "api"
  subtype = "http"
  status  = "live"
  
  request_definition {
    method = "GET"
    url    = "https://example.com/api/healthcheck"
    timeout = 30
    
    header {
      name  = "Authorization"
      value = "Bearer {{HEALTHCHECK_TOKEN}}"
    }
  }
  
  assertion {
    type     = "statusCode"
    operator = "is"
    target   = "200"
  }
  
  assertion {
    type     = "responseTime"
    operator = "lessThan"
    target   = "20000"
  }
  
  assertion {
    type     = "body"
    operator = "validatesJSONPath"
    target   = jsonencode({
      jsonPath = "$.status"
      operator = "is"
      targetValue = "Up"
    })
  }
  
  locations = ["aws:us-east-1", "aws:us-west-2", "aws:eu-west-1"]
  
  options_list {
    tick_every         = 300
    min_failure_duration = 120
    min_location_failed = 1
    
    retry {
      count    = 2
      interval = 300
    }
    
    monitor_options {
      renotify_interval = 120
    }
  }
  
  message = <<-EOT
    🚨 Healthcheck is failing!
    
    @pagerduty-oncall
    
    Check details: https://example.com/api/healthcheck
  EOT
  
  tags = ["env:production", "service:example", "team:platform"]
}
```

## 📱 Sample Alert Messages

### Critical Alert (PagerDuty)

```
🔥 CRITICAL: Site Down

Status: Down
Failed Checks: 3/4
Response Time: 18,234ms
Location: AWS US-East-1

Services Affected:
❌ Algolia Search: Down
✅ Page Health: Up
❌ GraphQL API: Down
❌ Build Integrity: Down

Action Required: Investigate immediately

Dashboard: https://app.datadoghq.com/dashboard/abc123
Healthcheck: https://example.com/api/healthcheck

@pagerduty-oncall
```

### Warning Alert (Slack)

```
⚠️ Partial Service Degradation

Status: Partial
Failed Checks: 1/4

Service Status:
✅ Algolia Search: Up
⚠️ Page Health: Partial (1/3 pages slow)
✅ GraphQL API: Up
✅ Build Integrity: Up

Performance:
Total Time: 15,234ms
Avg Page Load: 4,200ms (slow)

This is not critical but should be investigated.

Details: https://example.com/api/healthcheck
```

## 🎨 Using Watchtower Response Structure

### Key Response Fields to Monitor

```json
{
  "status": "Up|Down|Partial|Unknown",  // Overall health
  "timestamp": 1234567890,              // When check ran
  "performance": {
    "totalCheckTime": 5432,             // Total time (ms)
    "checksCompleted": 4,               // How many finished
    "checksFailed": 0                   // How many failed
  },
  "services": [                         // Individual service checks
    {
      "id": "algolia",                  // Service identifier
      "status": "Up",                   // Service status
      "services": [...],                // Sub-checks
      "metadata": {...}                 // Service-specific data
    }
  ]
}
```

### Useful JSON Paths for Assertions

```javascript
// Overall health
$.status                                    // "Up", "Down", etc.
$.performance.checksFailed                  // Number of failures
$.performance.totalCheckTime                // Total ms

// Algolia service
$.services[?(@.id=='algolia')].status       // Algolia status
$.services[?(@.id=='algolia')].services[?(@.id=='record_count')].metadata.totalRecords

// Page health
$.services[?(@.id=='pages')].status         // Page status
$.services[?(@.id=='pages')].metadata.successfulPages
$.services[?(@.id=='pages')].metadata.avgResponseTime

// GraphQL API
$.services[?(@.id=='http')].services[?(@.id=='graphql_api')].status
$.services[?(@.id=='http')].services[?(@.id=='graphql_api')].metadata.responseTime
```

## 🔄 Automated Remediation

### Datadog Workflow Automation

Create workflows that trigger on healthcheck failures:

```yaml
Trigger: Healthcheck status != "Up"
Actions:
  1. Post to Slack #incidents
  2. Create PagerDuty incident
  3. Trigger auto-healing script (if configured)
  4. Escalate after 30 minutes if unresolved
```

## 📊 Recommended Monitors

### For Your Site Specifically

Based on your healthcheck config, create these monitors:

#### 1. Critical - Site Down
```
Alert when: Overall status is "Down"
Frequency: Check every 5 minutes
Notify: @pagerduty-critical
```

#### 2. Warning - Algolia Issues
```
Alert when: Algolia status is not "Up"
Frequency: Check every 10 minutes  
Notify: @slack-search-team
Note: "Not site-critical but impacts search"
```

#### 3. Warning - Slow Pages
```
Alert when: Average page response time > 5000ms
Frequency: Check every 15 minutes
Notify: @slack-frontend-team
```

#### 4. Info - Build Issues
```
Alert when: Build integrity has failed checks
Frequency: Check every 30 minutes
Notify: @slack-devops
Priority: Low (doesn't affect live site)
```

## 🎯 Quick Start (Copy-Paste)

### Minimal Datadog Setup

1. **Create HTTP Test:**
   - URL: `https://example.com/api/healthcheck`
   - Add header: `Authorization: Bearer {{HEALTHCHECK_TOKEN}}`
   - Assertion: Body contains `"status":"Up"`
   - Frequency: Every 5 minutes
   - Alert: `@slack-platform`

2. **Done!** You now have basic monitoring.

### Enhanced Setup (Recommended)

Add these additional assertions to the same test:

```yaml
Assertions:
  1. Status code is 200
  2. Response time < 20000ms
  3. Body contains "status":"Up"
  4. JSON Path: $.performance.checksFailed is less than 1
  5. JSON Path: $.services[?(@.id=='algolia')].status contains "Up"
  6. JSON Path: $.services[?(@.id=='pages')].status contains "Up"
```

## 🔐 Security Notes

### Authentication Variables

Store your `HEALTHCHECK_TOKEN` as a **Datadog Global Variable**:

1. Go to: Synthetic Monitoring → Variables
2. Create new variable:
   - Name: `HEALTHCHECK_TOKEN`
   - Type: Secret (hidden in logs)
   - Value: Your actual token
   - Permissions: Restrict to specific tests

### Access Control

Since your config uses token-based authentication:
```typescript
auth: {
  token: process.env.HEALTHCHECK_TOKEN
}
```

Datadog should send the token in the `Authorization: Bearer <token>` header. This provides secure, authenticated access to your healthcheck endpoint.

## 📝 Summary

**Minimal Setup (5 minutes):**
- One Synthetic HTTP test
- Basic assertions on status
- Slack alert on failure

**Recommended Setup (30 minutes):**
- HTTP test with comprehensive assertions
- Separate monitors for each service
- Dashboard with key metrics
- PagerDuty integration

**Advanced Setup (2 hours):**
- Multi-step API tests
- Custom metrics extraction
- Service-specific monitors
- Automated workflows
- Comprehensive dashboard

---

**Start with the minimal setup and expand as needed!** 🎯


# Release Notes - v0.4.0

## 🔒 Security Release

**Major security improvements**: Secure-by-default authentication, information leakage prevention, constant-time token validation, and security headers.

### Breaking Changes

- **Auth now required by default in production** - Healthcheck endpoints will deny access if no token is configured in production environments
- **`allowMonitoring` option removed** - Use token-based authentication instead. Monitoring tools should send `Authorization: Bearer <token>` header
- **Query parameter tokens disabled by default** - Use headers for better security. Enable `allowQueryToken: true` only for development/testing

### New Features

- Enhanced auth configuration options (`requireAuth`, `allowQueryToken`, `strictMode`, `onAuthFailure`)
- Minimal error responses to prevent information leakage
- Security headers on all responses (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection)
- Constant-time token comparison to prevent timing attacks

### Migration

Remove `allowMonitoring` from your config. Auth is now required in production by default.

**Before:**
```typescript
auth: {
  token: process.env.HEALTHCHECK_TOKEN,
  allowMonitoring: true  // ❌ Remove this
}
```

**After:**
```typescript
auth: {
  token: process.env.HEALTHCHECK_TOKEN
  // ✅ Secure by default
}
```

For browser testing, enable query params:
```typescript
auth: {
  token: process.env.HEALTHCHECK_TOKEN,
  allowQueryToken: true  // Only for development/testing
}
```

Monitoring tools (Datadog, UptimeRobot, etc.) should use:
```
Authorization: Bearer YOUR_TOKEN
```


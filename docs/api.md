# Stealth Labs Platform API Documentation

Implements SLS-35: Write API documentation  
Author: Arjun Mehta | Sprint: 1

Base URL: `https://api.stealth-labs.internal/v1`

---

## Authentication

All endpoints (except `/auth/callback`) require a valid JWT in the
`Authorization: Bearer <token>` header. Tokens expire after 1 hour.
Use the OAuth refresh flow to obtain a new token silently.

---

## Service Registry

### POST /services
Register a new service.

**Request body:**
```json
{
  "name": "payment-service",
  "owner_team": "platform-eng",
  "repo_url": "https://github.com/stealth-labs/payment-service",
  "language": "python",
  "environment": "production",
  "tags": [{"key": "tier", "value": "critical"}]
}
```

**Response:** `201 Created` with full service object.
**Errors:** `409 Conflict` if service name already exists.

---

### GET /services
List all registered services.

**Query params:**
- `owner_team` (string) — filter by owning team
- `language` (string) — filter by language
- `environment` (string) — filter by environment

---

### GET /services/{service_id}
Get a single service by ID.

**Errors:** `404 Not Found` if service does not exist.

---

### PUT /services/{service_id}
Update service metadata.

---

### DELETE /services/{service_id}
Remove a service from the registry.

---

## Health Dashboard

### POST /health/check/{service_id}?url={url}
Trigger a health check by pinging the service URL.

**Response:**
```json
{
  "service_id": 1,
  "service_name": "payment-service",
  "status": "healthy",
  "status_code": 200,
  "latency_ms": 42.3,
  "checked_at": "2025-05-20T14:30:00Z",
  "error": null
}
```

**Status values:** `healthy` | `degraded` | `down`

---

### GET /health/status/{service_id}
Get the latest health check result.

---

### GET /health/history/{service_id}
Get the last 30 health check results.

---

### PUT /health/threshold/{service_id}
Set alerting thresholds.

```json
{
  "service_id": 1,
  "max_latency_ms": 500.0,
  "min_uptime_percent": 99.5
}
```

---

## Error Codes

| Code | Meaning |
|------|---------|
| 400 | Bad request — check your request body |
| 401 | Unauthorized — invalid or expired token |
| 404 | Resource not found |
| 409 | Conflict — resource already exists |
| 500 | Internal server error |

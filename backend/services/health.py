"""
Health Dashboard — API
Implements SLS-37: Health check API endpoints

Author: Riya Desai
Sprint: 2
"""
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
import httpx

router = APIRouter()


class HealthCheckResult(BaseModel):
    service_id: int
    service_name: str
    status: str  # "healthy" | "degraded" | "down"
    status_code: Optional[int]
    latency_ms: Optional[float]
    checked_at: datetime
    error: Optional[str] = None


class HealthThreshold(BaseModel):
    service_id: int
    max_latency_ms: float = 2000.0
    min_uptime_percent: float = 99.0


# In-memory health history — replace with TimescaleDB in production
_health_history: dict[int, list[HealthCheckResult]] = {}
_thresholds: dict[int, HealthThreshold] = {}


@router.post("/check/{service_id}", response_model=HealthCheckResult)
async def run_health_check(service_id: int, url: str):
    """Trigger a health check for a service by pinging its URL."""
    start = datetime.utcnow()
    result = HealthCheckResult(
        service_id=service_id,
        service_name=f"service-{service_id}",
        status="down",
        status_code=None,
        latency_ms=None,
        checked_at=start,
    )

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            t0 = datetime.utcnow()
            response = await client.get(url)
            latency = (datetime.utcnow() - t0).total_seconds() * 1000

            result.status_code = response.status_code
            result.latency_ms = round(latency, 2)

            threshold = _thresholds.get(service_id)
            if response.status_code < 400:
                if threshold and latency > threshold.max_latency_ms:
                    result.status = "degraded"
                else:
                    result.status = "healthy"
            else:
                result.status = "down"

    except httpx.TimeoutException:
        result.error = "Request timed out after 5 seconds"
        result.status = "down"
    except Exception as e:
        result.error = str(e)
        result.status = "down"

    if service_id not in _health_history:
        _health_history[service_id] = []
    _health_history[service_id].append(result)
    # Keep last 30 results per service
    _health_history[service_id] = _health_history[service_id][-30:]

    return result


@router.get("/status/{service_id}", response_model=Optional[HealthCheckResult])
def get_health_status(service_id: int):
    """Get the latest health check result for a service."""
    history = _health_history.get(service_id, [])
    if not history:
        raise HTTPException(status_code=404, detail="No health data for this service.")
    return history[-1]


@router.get("/history/{service_id}", response_model=list[HealthCheckResult])
def get_health_history(service_id: int):
    """Get the last 30 health check results for a service."""
    return _health_history.get(service_id, [])


@router.put("/threshold/{service_id}", response_model=HealthThreshold)
def set_threshold(service_id: int, threshold: HealthThreshold):
    """Set alerting thresholds for a service. Implements SLS-41."""
    _thresholds[service_id] = threshold
    return threshold

HEALTH_CHECK_TIMEOUT = 5.0
MAX_HISTORY_PER_SERVICE = 30

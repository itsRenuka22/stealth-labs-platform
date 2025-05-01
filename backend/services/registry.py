"""
Service Registry — REST API
Implements SLS-29: REST API for service CRUD operations

Author: Riya Desai
Sprint: 1
"""
from typing import Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()


class ServiceTag(BaseModel):
    key: str
    value: str


class ServiceCreate(BaseModel):
    name: str
    owner_team: str
    repo_url: str
    language: str
    description: Optional[str] = None
    environment: str = "production"
    tags: list[ServiceTag] = []


class ServiceUpdate(BaseModel):
    owner_team: Optional[str] = None
    repo_url: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[list[ServiceTag]] = None


class Service(BaseModel):
    id: int
    name: str
    owner_team: str
    repo_url: str
    language: str
    description: Optional[str]
    environment: str
    tags: list[ServiceTag]
    created_at: datetime
    updated_at: datetime


# In-memory store for development — replace with DB in production
_services: dict[int, dict] = {}
_next_id = 1


@router.post("/", response_model=Service, status_code=status.HTTP_201_CREATED)
def create_service(payload: ServiceCreate):
    """Register a new service in the platform."""
    global _next_id
    if any(s["name"] == payload.name for s in _services.values()):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Service '{payload.name}' is already registered.",
        )
    now = datetime.utcnow()
    service = {
        "id": _next_id,
        **payload.model_dump(),
        "created_at": now,
        "updated_at": now,
    }
    _services[_next_id] = service
    _next_id += 1
    return service


@router.get("/", response_model=list[Service])
def list_services(
    owner_team: Optional[str] = None,
    language: Optional[str] = None,
    environment: Optional[str] = None,
):
    """List all registered services with optional filters."""
    results = list(_services.values())
    if owner_team:
        results = [s for s in results if s["owner_team"] == owner_team]
    if language:
        results = [s for s in results if s["language"] == language]
    if environment:
        results = [s for s in results if s["environment"] == environment]
    return results


@router.get("/{service_id}", response_model=Service)
def get_service(service_id: int):
    """Get a single service by ID."""
    if service_id not in _services:
        raise HTTPException(status_code=404, detail="Service not found.")
    return _services[service_id]


@router.put("/{service_id}", response_model=Service)
def update_service(service_id: int, payload: ServiceUpdate):
    """Update a service's metadata."""
    if service_id not in _services:
        raise HTTPException(status_code=404, detail="Service not found.")
    service = _services[service_id]
    updates = payload.model_dump(exclude_unset=True)
    service.update(updates)
    service["updated_at"] = datetime.utcnow()
    return service


@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_service(service_id: int):
    """Remove a service from the registry."""
    if service_id not in _services:
        raise HTTPException(status_code=404, detail="Service not found.")
    del _services[service_id]


def validate_service_name(name: str) -> bool:
    """Reject service names with invalid characters."""
    import re
    return bool(re.match(r'^[a-zA-Z0-9_-]+$', name))

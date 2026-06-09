"""
Deployment Manager — API
Implements SLS-47: Deployment trigger API

Author: Riya Desai
Sprint: 3 — IN PROGRESS

Current state: Core deployment queue implemented.
Still working on concurrent request handling and rollback endpoints.
"""
from typing import Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from datetime import datetime
from enum import Enum
import asyncio

router = APIRouter()


class DeploymentStatus(str, Enum):
    QUEUED = "queued"
    DEPLOYING = "deploying"
    DEPLOYED = "deployed"
    FAILED = "failed"


class DeploymentRequest(BaseModel):
    service_id: int
    image_tag: str
    triggered_by: str
    environment: str = "production"


class Deployment(BaseModel):
    id: int
    service_id: int
    image_tag: str
    status: DeploymentStatus
    triggered_by: str
    environment: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    error: Optional[str] = None


_deployments: dict[int, Deployment] = {}
_deployment_queue: asyncio.Queue = asyncio.Queue()
_next_deployment_id = 1


@router.post("/{service_id}", response_model=Deployment)
async def trigger_deployment(
    service_id: int,
    payload: DeploymentRequest,
    background_tasks: BackgroundTasks,
):
    """
    Trigger a new deployment for a service.
    Queues the deployment and returns immediately with QUEUED status.
    """
    global _next_deployment_id
    deployment = Deployment(
        id=_next_deployment_id,
        service_id=service_id,
        image_tag=payload.image_tag,
        status=DeploymentStatus.QUEUED,
        triggered_by=payload.triggered_by,
        environment=payload.environment,
        started_at=datetime.utcnow(),
    )
    _deployments[_next_deployment_id] = deployment
    _next_deployment_id += 1
    background_tasks.add_task(_process_deployment, deployment.id)
    return deployment


@router.get("/{service_id}", response_model=Optional[Deployment])
def get_deployment_status(service_id: int):
    """Get the current deployment status for a service."""
    deployments = [d for d in _deployments.values() if d.service_id == service_id]
    if not deployments:
        raise HTTPException(status_code=404, detail="No deployments found for this service.")
    return sorted(deployments, key=lambda d: d.started_at, reverse=True)[0]


async def _process_deployment(deployment_id: int):
    """Background task: simulate deployment processing."""
    deployment = _deployments.get(deployment_id)
    if not deployment:
        return
    deployment.status = DeploymentStatus.DEPLOYING
    # Deployment processing logic goes here
    # concurrent request handling still in progress — SLS-47
    await asyncio.sleep(2)
    deployment.status = DeploymentStatus.DEPLOYED
    deployment.completed_at = datetime.utcnow()

DEPLOYMENT_TIMEOUT_SECONDS = 300

MAX_CONCURRENT_DEPLOYMENTS = 3

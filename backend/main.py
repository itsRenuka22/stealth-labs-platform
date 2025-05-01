"""
Stealth Labs Developer Platform — API Entry Point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from services.registry import router as registry_router
from services.health import router as health_router

app = FastAPI(
    title="Stealth Labs Developer Platform",
    description="Internal developer platform API",
    version="0.3.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(registry_router, prefix="/services", tags=["Service Registry"])
app.include_router(health_router, prefix="/health", tags=["Health Dashboard"])


@app.get("/")
def root():
    return {"status": "ok", "platform": "Stealth Labs Developer Platform", "version": "0.3.0"}

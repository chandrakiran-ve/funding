"""
Health check endpoints for monitoring and service discovery.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
import asyncio
import time
from datetime import datetime

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter()


class HealthResponse(BaseModel):
    """Health check response model."""
    status: str
    timestamp: datetime
    service: str
    version: str
    uptime_seconds: float
    dependencies: Dict[str, str]


class DetailedHealthResponse(BaseModel):
    """Detailed health check response model."""
    status: str
    timestamp: datetime
    service: str
    version: str
    uptime_seconds: float
    dependencies: Dict[str, Dict[str, Any]]
    system_info: Dict[str, Any]


# Track service start time for uptime calculation
_start_time = time.time()


async def check_dependency_health() -> Dict[str, str]:
    """Check the health of external dependencies."""
    dependencies = {}
    
    # Check Google Sheets API availability (basic check)
    if settings.GOOGLE_SHEETS_CREDENTIALS_PATH or settings.GOOGLE_SHEETS_CREDENTIALS_JSON:
        dependencies["google_sheets"] = "configured"
    else:
        dependencies["google_sheets"] = "not_configured"
    
    # Check Gemini API availability
    if settings.GEMINI_API_KEY:
        dependencies["gemini_api"] = "configured"
    else:
        dependencies["gemini_api"] = "not_configured"
    
    # Check Redis availability (if configured)
    if settings.REDIS_URL:
        try:
            # This is a basic check - actual Redis connection would be tested in a real implementation
            dependencies["redis"] = "configured"
        except Exception as e:
            logger.warning("Redis health check failed", error=str(e))
            dependencies["redis"] = "unavailable"
    else:
        dependencies["redis"] = "not_configured"
    
    return dependencies


async def check_detailed_dependency_health() -> Dict[str, Dict[str, Any]]:
    """Check detailed health of external dependencies."""
    dependencies = {}
    
    # Google Sheets detailed check
    google_sheets_status = {
        "status": "not_configured",
        "last_check": datetime.utcnow().isoformat(),
        "error": None
    }
    
    if settings.GOOGLE_SHEETS_CREDENTIALS_PATH or settings.GOOGLE_SHEETS_CREDENTIALS_JSON:
        google_sheets_status["status"] = "configured"
        if settings.GOOGLE_SHEETS_SPREADSHEET_ID:
            google_sheets_status["spreadsheet_configured"] = True
        else:
            google_sheets_status["spreadsheet_configured"] = False
    
    dependencies["google_sheets"] = google_sheets_status
    
    # Gemini API detailed check
    gemini_status = {
        "status": "configured" if settings.GEMINI_API_KEY else "not_configured",
        "last_check": datetime.utcnow().isoformat(),
        "error": None
    }
    dependencies["gemini_api"] = gemini_status
    
    # Redis detailed check
    redis_status = {
        "status": "not_configured",
        "last_check": datetime.utcnow().isoformat(),
        "error": None
    }
    
    if settings.REDIS_URL:
        redis_status["status"] = "configured"
        # In a real implementation, we would test actual Redis connectivity here
    
    dependencies["redis"] = redis_status
    
    return dependencies


@router.get("/", response_model=HealthResponse)
async def health_check():
    """Basic health check endpoint."""
    try:
        dependencies = await check_dependency_health()
        uptime = time.time() - _start_time
        
        return HealthResponse(
            status="healthy",
            timestamp=datetime.utcnow(),
            service=settings.APP_NAME,
            version="1.0.0",
            uptime_seconds=uptime,
            dependencies=dependencies
        )
    except Exception as e:
        logger.error("Health check failed", error=str(e))
        raise HTTPException(status_code=503, detail="Service unhealthy")


@router.get("/detailed", response_model=DetailedHealthResponse)
async def detailed_health_check():
    """Detailed health check endpoint with comprehensive system information."""
    try:
        dependencies = await check_detailed_dependency_health()
        uptime = time.time() - _start_time
        
        system_info = {
            "debug_mode": settings.DEBUG,
            "log_level": settings.LOG_LEVEL,
            "allowed_origins": settings.ALLOWED_ORIGINS,
            "port": settings.PORT
        }
        
        return DetailedHealthResponse(
            status="healthy",
            timestamp=datetime.utcnow(),
            service=settings.APP_NAME,
            version="1.0.0",
            uptime_seconds=uptime,
            dependencies=dependencies,
            system_info=system_info
        )
    except Exception as e:
        logger.error("Detailed health check failed", error=str(e))
        raise HTTPException(status_code=503, detail="Service unhealthy")


@router.get("/readiness")
async def readiness_check():
    """Kubernetes readiness probe endpoint."""
    try:
        dependencies = await check_dependency_health()
        
        # Check if critical dependencies are available
        critical_deps = ["google_sheets", "gemini_api"]
        for dep in critical_deps:
            if dep in dependencies and dependencies[dep] == "not_configured":
                logger.warning(f"Critical dependency {dep} not configured")
                raise HTTPException(status_code=503, detail=f"Critical dependency {dep} not ready")
        
        return {"status": "ready", "timestamp": datetime.utcnow()}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Readiness check failed", error=str(e))
        raise HTTPException(status_code=503, detail="Service not ready")


@router.get("/liveness")
async def liveness_check():
    """Kubernetes liveness probe endpoint."""
    return {"status": "alive", "timestamp": datetime.utcnow()}
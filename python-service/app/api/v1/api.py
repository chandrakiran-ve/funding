"""
API v1 router configuration.
"""

from fastapi import APIRouter

from .endpoints import health, langgraph, langgraph_v2, targets

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(langgraph.router, prefix="/langgraph", tags=["langgraph", "ai-agent"])
api_router.include_router(langgraph_v2.router, prefix="/langgraph-v2", tags=["langgraph-v2", "official-patterns"])
api_router.include_router(targets.router, prefix="/targets", tags=["targets", "target-management"])
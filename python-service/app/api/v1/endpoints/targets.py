"""
API endpoints for target management with automatic previous year defaults.
"""

from decimal import Decimal
from typing import Dict, List, Optional
import logging

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field

from app.services.target_management_service import get_target_management_service, TargetManagementService
from app.models.entities import StateTargetModel

logger = logging.getLogger(__name__)

router = APIRouter()


class CreateTargetRequest(BaseModel):
    state_code: str = Field(..., description="State code (e.g., 'CA', 'TX')")
    fiscal_year: str = Field(..., description="Fiscal year (e.g., '2024')")
    custom_amount: Optional[Decimal] = Field(None, description="Custom target amount (if not provided, uses previous year funding)")
    description: Optional[str] = Field(None, description="Target description")
    priority: int = Field(1, ge=1, le=5, description="Priority level (1-5)")


class UpdateTargetRequest(BaseModel):
    target_amount: Decimal = Field(..., description="New target amount")
    description: Optional[str] = Field(None, description="Updated description")


class InitializeTargetsRequest(BaseModel):
    fiscal_year: str = Field(..., description="Fiscal year to initialize")
    force_update: bool = Field(False, description="Whether to update existing targets")


class TargetResponse(BaseModel):
    id: str
    state_code: str
    fiscal_year: str
    target_amount: float
    description: Optional[str]
    priority: int
    previous_year_funding: Optional[float] = None
    created_at: str
    updated_at: str


class TargetComparisonResponse(BaseModel):
    state_code: str
    target_amount: float
    actual_amount: float
    difference: float
    percentage_achieved: float
    status: str
    priority: int
    description: Optional[str]


@router.post("/targets", response_model=TargetResponse)
async def create_target(
    request: CreateTargetRequest,
    service: TargetManagementService = Depends(get_target_management_service)
):
    """
    Create a new target for a state and fiscal year.
    If no custom amount is provided, uses previous year's funding as default.
    """
    try:
        target = await service.get_or_create_target_with_default(
            state_code=request.state_code,
            fiscal_year=request.fiscal_year,
            custom_amount=request.custom_amount,
            description=request.description,
            priority=request.priority
        )
        
        # Get previous year funding for reference
        previous_year_funding = await service.get_previous_year_funding(
            request.state_code, request.fiscal_year
        )
        
        return TargetResponse(
            id=target.id,
            state_code=target.state_code,
            fiscal_year=target.fiscal_year,
            target_amount=float(target.target_amount),
            description=target.description,
            priority=target.priority,
            previous_year_funding=float(previous_year_funding),
            created_at=target.created_at.isoformat(),
            updated_at=target.updated_at.isoformat()
        )
        
    except Exception as e:
        logger.error(f"Failed to create target: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/targets/{state_code}/{fiscal_year}", response_model=TargetResponse)
async def get_target(
    state_code: str,
    fiscal_year: str,
    service: TargetManagementService = Depends(get_target_management_service)
):
    """Get target for a specific state and fiscal year."""
    try:
        target = await service.get_or_create_target_with_default(
            state_code=state_code,
            fiscal_year=fiscal_year
        )
        
        # Get previous year funding for reference
        previous_year_funding = await service.get_previous_year_funding(
            state_code, fiscal_year
        )
        
        return TargetResponse(
            id=target.id,
            state_code=target.state_code,
            fiscal_year=target.fiscal_year,
            target_amount=float(target.target_amount),
            description=target.description,
            priority=target.priority,
            previous_year_funding=float(previous_year_funding),
            created_at=target.created_at.isoformat(),
            updated_at=target.updated_at.isoformat()
        )
        
    except Exception as e:
        logger.error(f"Failed to get target for {state_code} in {fiscal_year}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/targets/{state_code}/{fiscal_year}", response_model=TargetResponse)
async def update_target(
    state_code: str,
    fiscal_year: str,
    request: UpdateTargetRequest,
    service: TargetManagementService = Depends(get_target_management_service)
):
    """Update target amount for a specific state and fiscal year."""
    try:
        target = await service.update_target_amount(
            state_code=state_code,
            fiscal_year=fiscal_year,
            new_amount=request.target_amount,
            description=request.description
        )
        
        # Get previous year funding for reference
        previous_year_funding = await service.get_previous_year_funding(
            state_code, fiscal_year
        )
        
        return TargetResponse(
            id=target.id,
            state_code=target.state_code,
            fiscal_year=target.fiscal_year,
            target_amount=float(target.target_amount),
            description=target.description,
            priority=target.priority,
            previous_year_funding=float(previous_year_funding),
            created_at=target.created_at.isoformat(),
            updated_at=target.updated_at.isoformat()
        )
        
    except Exception as e:
        logger.error(f"Failed to update target for {state_code} in {fiscal_year}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/targets/initialize")
async def initialize_targets(
    request: InitializeTargetsRequest,
    service: TargetManagementService = Depends(get_target_management_service)
):
    """
    Initialize targets for all states in a fiscal year using previous year funding.
    """
    try:
        targets = await service.initialize_targets_for_fiscal_year(
            fiscal_year=request.fiscal_year,
            force_update=request.force_update
        )
        
        response = []
        for state_code, target in targets.items():
            # Get previous year funding for reference
            previous_year_funding = await service.get_previous_year_funding(
                state_code, request.fiscal_year
            )
            
            response.append(TargetResponse(
                id=target.id,
                state_code=target.state_code,
                fiscal_year=target.fiscal_year,
                target_amount=float(target.target_amount),
                description=target.description,
                priority=target.priority,
                previous_year_funding=float(previous_year_funding),
                created_at=target.created_at.isoformat(),
                updated_at=target.updated_at.isoformat()
            ))
        
        return {
            "message": f"Initialized {len(response)} targets for fiscal year {request.fiscal_year}",
            "targets": response
        }
        
    except Exception as e:
        logger.error(f"Failed to initialize targets: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/targets/fiscal-year/{fiscal_year}/comparison")
async def get_target_comparison(
    fiscal_year: str,
    service: TargetManagementService = Depends(get_target_management_service)
):
    """Get target vs actual comparison for all states in a fiscal year."""
    try:
        comparison = await service.get_target_vs_actual_comparison(fiscal_year)
        
        response = []
        for state_code, data in comparison.items():
            response.append(TargetComparisonResponse(
                state_code=state_code,
                **data
            ))
        
        return {
            "fiscal_year": fiscal_year,
            "comparison": response
        }
        
    except Exception as e:
        logger.error(f"Failed to get target comparison: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/targets/fiscal-year/{fiscal_year}/attention")
async def get_states_needing_attention(
    fiscal_year: str,
    threshold: float = Query(50.0, description="Percentage threshold below which states need attention"),
    service: TargetManagementService = Depends(get_target_management_service)
):
    """Get states that are significantly behind their targets."""
    try:
        states = await service.get_states_needing_attention(
            fiscal_year=fiscal_year,
            threshold_percentage=threshold
        )
        
        return {
            "fiscal_year": fiscal_year,
            "threshold_percentage": threshold,
            "states_needing_attention": states
        }
        
    except Exception as e:
        logger.error(f"Failed to get states needing attention: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/targets/fiscal-year/{fiscal_year}/reset")
async def reset_targets_to_previous_year(
    fiscal_year: str,
    service: TargetManagementService = Depends(get_target_management_service)
):
    """Reset all targets for a fiscal year to previous year's funding amounts."""
    try:
        targets = await service.reset_targets_to_previous_year(fiscal_year)
        
        response = []
        for state_code, target in targets.items():
            # Get previous year funding for reference
            previous_year_funding = await service.get_previous_year_funding(
                state_code, fiscal_year
            )
            
            response.append(TargetResponse(
                id=target.id,
                state_code=target.state_code,
                fiscal_year=target.fiscal_year,
                target_amount=float(target.target_amount),
                description=target.description,
                priority=target.priority,
                previous_year_funding=float(previous_year_funding),
                created_at=target.created_at.isoformat(),
                updated_at=target.updated_at.isoformat()
            ))
        
        return {
            "message": f"Reset {len(response)} targets to previous year funding for fiscal year {fiscal_year}",
            "targets": response
        }
        
    except Exception as e:
        logger.error(f"Failed to reset targets: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/targets/fiscal-year/{fiscal_year}")
async def get_all_targets_for_year(
    fiscal_year: str,
    service: TargetManagementService = Depends(get_target_management_service)
):
    """Get all targets for a specific fiscal year."""
    try:
        # Get targets from repository
        target_repo = service.state_target_repo
        targets = await target_repo.find_by_fiscal_year(fiscal_year)
        
        response = []
        for target in targets:
            # Get previous year funding for reference
            previous_year_funding = await service.get_previous_year_funding(
                target.state_code, fiscal_year
            )
            
            response.append(TargetResponse(
                id=target.id,
                state_code=target.state_code,
                fiscal_year=target.fiscal_year,
                target_amount=float(target.target_amount),
                description=target.description,
                priority=target.priority,
                previous_year_funding=float(previous_year_funding),
                created_at=target.created_at.isoformat(),
                updated_at=target.updated_at.isoformat()
            ))
        
        return {
            "fiscal_year": fiscal_year,
            "targets": response
        }
        
    except Exception as e:
        logger.error(f"Failed to get targets for fiscal year {fiscal_year}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/targets/previous-year-funding/{state_code}/{fiscal_year}")
async def get_previous_year_funding(
    state_code: str,
    fiscal_year: str,
    service: TargetManagementService = Depends(get_target_management_service)
):
    """Get previous year's funding for a specific state."""
    try:
        previous_funding = await service.get_previous_year_funding(state_code, fiscal_year)
        
        return {
            "state_code": state_code,
            "fiscal_year": fiscal_year,
            "previous_year": str(int(fiscal_year) - 1),
            "previous_year_funding": float(previous_funding)
        }
        
    except Exception as e:
        logger.error(f"Failed to get previous year funding: {e}")
        raise HTTPException(status_code=500, detail=str(e))
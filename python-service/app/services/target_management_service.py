"""
Service for managing state targets with automatic previous year funding defaults.
"""

import logging
from datetime import datetime
from decimal import Decimal
from typing import Dict, List, Optional, Tuple

from app.models.entities import StateTargetModel, ContributionStatus
from app.repositories.repository_factory import RepositoryFactory

logger = logging.getLogger(__name__)


class TargetManagementService:
    """Service for managing state targets with intelligent defaults."""
    
    def __init__(self, repository_factory: RepositoryFactory = None):
        self.repository_factory = repository_factory or RepositoryFactory()
        self.state_target_repo = self.repository_factory.state_target_repository
        self.contribution_repo = self.repository_factory.contribution_repository
        self.state_repo = self.repository_factory.state_repository
    
    async def get_previous_year_funding(self, state_code: str, fiscal_year: str) -> Decimal:
        """
        Get the total funding for a state in the previous fiscal year.
        
        Args:
            state_code: State code (e.g., 'CA', 'TX')
            fiscal_year: Current fiscal year (e.g., '2024')
            
        Returns:
            Total funding amount from previous year
        """
        try:
            # Calculate previous fiscal year
            current_year = int(fiscal_year)
            previous_year = str(current_year - 1)
            
            # Get contributions for the state in the previous year
            contributions = await self.contribution_repo.find_by_state_and_year(
                state_code, previous_year
            )
            
            # Sum only confirmed and received contributions
            total = Decimal('0')
            for contrib in contributions:
                if contrib.status in [ContributionStatus.CONFIRMED, ContributionStatus.RECEIVED]:
                    total += contrib.amount
            
            logger.info(f"Previous year ({previous_year}) funding for {state_code}: ${total}")
            return total
            
        except Exception as e:
            logger.error(f"Failed to get previous year funding for {state_code}: {e}")
            return Decimal('0')
    
    async def get_or_create_target_with_default(
        self, 
        state_code: str, 
        fiscal_year: str,
        custom_amount: Optional[Decimal] = None,
        description: Optional[str] = None,
        priority: int = 1
    ) -> StateTargetModel:
        """
        Get existing target or create new one with previous year funding as default.
        
        Args:
            state_code: State code
            fiscal_year: Fiscal year for the target
            custom_amount: Custom target amount (overrides default)
            description: Target description
            priority: Target priority (1-5)
            
        Returns:
            StateTargetModel with appropriate target amount
        """
        try:
            # Check if target already exists
            existing_target = await self.state_target_repo.find_by_state_and_year(
                state_code, fiscal_year
            )
            
            if existing_target:
                logger.info(f"Found existing target for {state_code} in {fiscal_year}")
                return existing_target
            
            # Determine target amount
            if custom_amount is not None:
                target_amount = custom_amount
                logger.info(f"Using custom target amount: ${target_amount}")
            else:
                # Use previous year's funding as default
                target_amount = await self.get_previous_year_funding(state_code, fiscal_year)
                logger.info(f"Using previous year funding as default: ${target_amount}")
            
            # Create description if not provided
            if description is None:
                if custom_amount is not None:
                    description = f"Custom target for {state_code} in FY {fiscal_year}"
                else:
                    description = f"Target based on previous year funding for {state_code} in FY {fiscal_year}"
            
            # Create new target
            new_target = await self.state_target_repo.create_or_update_target(
                state_code=state_code,
                fiscal_year=fiscal_year,
                target_amount=target_amount,
                description=description,
                priority=priority
            )
            
            logger.info(f"Created new target for {state_code} in {fiscal_year}: ${target_amount}")
            return new_target
            
        except Exception as e:
            logger.error(f"Failed to get or create target for {state_code} in {fiscal_year}: {e}")
            raise
    
    async def initialize_targets_for_fiscal_year(
        self, 
        fiscal_year: str,
        force_update: bool = False
    ) -> Dict[str, StateTargetModel]:
        """
        Initialize targets for all states in a fiscal year using previous year funding.
        
        Args:
            fiscal_year: Fiscal year to initialize targets for
            force_update: Whether to update existing targets
            
        Returns:
            Dictionary mapping state codes to their targets
        """
        try:
            logger.info(f"Initializing targets for fiscal year {fiscal_year}")
            
            # Get all states
            states = await self.state_repo.get_all()
            results = {}
            
            for state in states:
                state_code = state.code
                
                try:
                    # Check if target already exists
                    existing_target = await self.state_target_repo.find_by_state_and_year(
                        state_code, fiscal_year
                    )
                    
                    if existing_target and not force_update:
                        logger.debug(f"Target already exists for {state_code}, skipping")
                        results[state_code] = existing_target
                        continue
                    
                    # Get previous year funding
                    previous_funding = await self.get_previous_year_funding(state_code, fiscal_year)
                    
                    # Create or update target
                    if existing_target and force_update:
                        # Update existing target with previous year funding
                        updated_target = await self.state_target_repo.update(
                            existing_target.id,
                            {
                                "target_amount": previous_funding,
                                "description": f"Updated target based on previous year funding for {state_code} in FY {fiscal_year}"
                            }
                        )
                        results[state_code] = updated_target
                        logger.info(f"Updated target for {state_code}: ${previous_funding}")
                    else:
                        # Create new target
                        new_target = await self.get_or_create_target_with_default(
                            state_code=state_code,
                            fiscal_year=fiscal_year
                        )
                        results[state_code] = new_target
                        logger.info(f"Created target for {state_code}: ${previous_funding}")
                
                except Exception as e:
                    logger.error(f"Failed to initialize target for {state_code}: {e}")
                    continue
            
            logger.info(f"Initialized {len(results)} targets for fiscal year {fiscal_year}")
            return results
            
        except Exception as e:
            logger.error(f"Failed to initialize targets for fiscal year {fiscal_year}: {e}")
            raise
    
    async def update_target_amount(
        self, 
        state_code: str, 
        fiscal_year: str, 
        new_amount: Decimal,
        description: Optional[str] = None
    ) -> StateTargetModel:
        """
        Update target amount for a specific state and fiscal year.
        
        Args:
            state_code: State code
            fiscal_year: Fiscal year
            new_amount: New target amount
            description: Optional description for the update
            
        Returns:
            Updated StateTargetModel
        """
        try:
            # Find existing target
            existing_target = await self.state_target_repo.find_by_state_and_year(
                state_code, fiscal_year
            )
            
            if not existing_target:
                # Create new target with custom amount
                return await self.get_or_create_target_with_default(
                    state_code=state_code,
                    fiscal_year=fiscal_year,
                    custom_amount=new_amount,
                    description=description or f"Custom target for {state_code} in FY {fiscal_year}"
                )
            
            # Update existing target
            updates = {"target_amount": new_amount}
            if description:
                updates["description"] = description
            
            updated_target = await self.state_target_repo.update(existing_target.id, updates)
            logger.info(f"Updated target for {state_code} in {fiscal_year}: ${new_amount}")
            
            return updated_target
            
        except Exception as e:
            logger.error(f"Failed to update target for {state_code} in {fiscal_year}: {e}")
            raise
    
    async def get_target_vs_actual_comparison(
        self, 
        fiscal_year: str
    ) -> Dict[str, Dict[str, any]]:
        """
        Get comparison of targets vs actual contributions for all states.
        
        Args:
            fiscal_year: Fiscal year to compare
            
        Returns:
            Dictionary with target vs actual data for each state
        """
        try:
            logger.info(f"Generating target vs actual comparison for {fiscal_year}")
            
            # Get all targets for the fiscal year
            targets = await self.state_target_repo.find_by_fiscal_year(fiscal_year)
            
            results = {}
            
            for target in targets:
                state_code = target.state_code
                
                # Get actual contributions for the state
                actual_amount = await self.contribution_repo.get_total_by_state(
                    state_code, fiscal_year
                )
                
                # Calculate metrics
                target_amount = target.target_amount
                difference = actual_amount - target_amount
                percentage = (actual_amount / target_amount * 100) if target_amount > 0 else 0
                
                results[state_code] = {
                    "target_amount": float(target_amount),
                    "actual_amount": float(actual_amount),
                    "difference": float(difference),
                    "percentage_achieved": round(percentage, 2),
                    "status": "exceeded" if actual_amount > target_amount else "on_track" if percentage >= 80 else "behind",
                    "priority": target.priority,
                    "description": target.description
                }
            
            logger.info(f"Generated comparison for {len(results)} states")
            return results
            
        except Exception as e:
            logger.error(f"Failed to generate target vs actual comparison: {e}")
            raise
    
    async def get_states_needing_attention(
        self, 
        fiscal_year: str,
        threshold_percentage: float = 50.0
    ) -> List[Dict[str, any]]:
        """
        Get states that are significantly behind their targets.
        
        Args:
            fiscal_year: Fiscal year to analyze
            threshold_percentage: Percentage below which states need attention
            
        Returns:
            List of states needing attention with details
        """
        try:
            comparison = await self.get_target_vs_actual_comparison(fiscal_year)
            
            states_needing_attention = []
            
            for state_code, data in comparison.items():
                if data["percentage_achieved"] < threshold_percentage:
                    states_needing_attention.append({
                        "state_code": state_code,
                        "percentage_achieved": data["percentage_achieved"],
                        "target_amount": data["target_amount"],
                        "actual_amount": data["actual_amount"],
                        "shortfall": data["target_amount"] - data["actual_amount"],
                        "priority": data["priority"]
                    })
            
            # Sort by percentage achieved (lowest first)
            states_needing_attention.sort(key=lambda x: x["percentage_achieved"])
            
            logger.info(f"Found {len(states_needing_attention)} states needing attention")
            return states_needing_attention
            
        except Exception as e:
            logger.error(f"Failed to get states needing attention: {e}")
            raise
    
    async def reset_targets_to_previous_year(self, fiscal_year: str) -> Dict[str, StateTargetModel]:
        """
        Reset all targets for a fiscal year to previous year's funding amounts.
        
        Args:
            fiscal_year: Fiscal year to reset targets for
            
        Returns:
            Dictionary of updated targets
        """
        try:
            logger.info(f"Resetting targets to previous year funding for {fiscal_year}")
            
            return await self.initialize_targets_for_fiscal_year(
                fiscal_year=fiscal_year,
                force_update=True
            )
            
        except Exception as e:
            logger.error(f"Failed to reset targets for {fiscal_year}: {e}")
            raise


# Global service instance
_target_management_service: Optional[TargetManagementService] = None


def get_target_management_service() -> TargetManagementService:
    """Get the global target management service instance."""
    global _target_management_service
    if _target_management_service is None:
        _target_management_service = TargetManagementService()
    return _target_management_service
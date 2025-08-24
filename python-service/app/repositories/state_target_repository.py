"""
Repository for StateTarget entities.
"""

import json
import logging
from datetime import datetime
from decimal import Decimal
from typing import Any, List, Optional

from app.models.entities import StateTargetModel
from app.repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)


class StateTargetRepository(BaseRepository[StateTargetModel]):
    """Repository for managing StateTarget entities in Google Sheets."""
    
    def __init__(self, **kwargs):
        super().__init__(
            model_class=StateTargetModel,
            sheet_name="StateTargets",
            **kwargs
        )
    
    def _get_headers(self) -> List[str]:
        """Get column headers for the StateTargets sheet."""
        return [
            "id",
            "state_code",
            "fiscal_year",
            "target_amount",
            "description",
            "priority",
            "metadata",
            "created_at",
            "updated_at"
        ]
    
    def _model_to_row(self, model: StateTargetModel) -> List[Any]:
        """Convert StateTargetModel to spreadsheet row."""
        return [
            model.id,
            model.state_code,
            model.fiscal_year,
            float(model.target_amount),
            model.description or "",
            model.priority,
            json.dumps(model.metadata),
            model.created_at.isoformat(),
            model.updated_at.isoformat()
        ]
    
    def _row_to_model(self, row: List[Any]) -> StateTargetModel:
        """Convert spreadsheet row to StateTargetModel."""
        # Ensure we have enough columns
        while len(row) < len(self._get_headers()):
            row.append("")
        
        # Parse target amount safely
        try:
            target_amount = Decimal(str(row[3])) if row[3] else Decimal('0')
        except (ValueError, TypeError):
            target_amount = Decimal('0')
        
        # Parse priority safely
        try:
            priority = int(row[5]) if row[5] else 1
        except (ValueError, TypeError):
            priority = 1
        
        # Parse metadata safely
        try:
            metadata = json.loads(row[6]) if row[6] else {}
        except (json.JSONDecodeError, TypeError):
            metadata = {}
        
        # Parse timestamps safely
        try:
            created_at = datetime.fromisoformat(row[7]) if row[7] else datetime.utcnow()
        except (ValueError, TypeError):
            created_at = datetime.utcnow()
        
        try:
            updated_at = datetime.fromisoformat(row[8]) if row[8] else datetime.utcnow()
        except (ValueError, TypeError):
            updated_at = datetime.utcnow()
        
        return StateTargetModel(
            id=row[0] or "",
            state_code=row[1] or "",
            fiscal_year=row[2] or "",
            target_amount=target_amount,
            description=row[4] if row[4] else None,
            priority=priority,
            metadata=metadata,
            created_at=created_at,
            updated_at=updated_at
        )
    
    async def find_by_state(self, state_code: str) -> List[StateTargetModel]:
        """Find targets by state code."""
        return await self.find_by_field("state_code", state_code.upper())
    
    async def find_by_fiscal_year(self, fiscal_year: str) -> List[StateTargetModel]:
        """Find targets by fiscal year."""
        return await self.find_by_field("fiscal_year", fiscal_year)
    
    async def find_by_priority(self, priority: int) -> List[StateTargetModel]:
        """Find targets by priority level."""
        return await self.find_by_field("priority", priority)
    
    async def find_by_state_and_year(self, state_code: str, fiscal_year: str) -> Optional[StateTargetModel]:
        """Find target by state and fiscal year (should be unique)."""
        try:
            entities = await self.get_all()
            
            state_upper = state_code.upper()
            for entity in entities:
                if entity.state_code == state_upper and entity.fiscal_year == fiscal_year:
                    return entity
            
            logger.debug(f"No target found for {state_code} in {fiscal_year}")
            return None
            
        except Exception as e:
            logger.error(f"Failed to find target by state {state_code} and year {fiscal_year}: {e}")
            raise
    
    async def get_high_priority_targets(self, fiscal_year: Optional[str] = None) -> List[StateTargetModel]:
        """Get high priority targets (priority 1-2), optionally filtered by fiscal year."""
        try:
            entities = await self.get_all()
            matches = []
            
            for entity in entities:
                if entity.priority <= 2:
                    if fiscal_year is None or entity.fiscal_year == fiscal_year:
                        matches.append(entity)
            
            # Sort by priority
            matches.sort(key=lambda x: x.priority)
            
            logger.debug(f"Found {len(matches)} high priority targets")
            return matches
            
        except Exception as e:
            logger.error(f"Failed to get high priority targets: {e}")
            raise
    
    async def get_total_target_by_fiscal_year(self, fiscal_year: str) -> Decimal:
        """Get total target amount for a fiscal year."""
        try:
            targets = await self.find_by_fiscal_year(fiscal_year)
            
            total = Decimal('0')
            for target in targets:
                total += target.target_amount
            
            logger.debug(f"Total target for {fiscal_year}: {total}")
            return total
            
        except Exception as e:
            logger.error(f"Failed to calculate total target for {fiscal_year}: {e}")
            raise
    
    async def get_targets_summary(self, fiscal_year: str) -> dict:
        """Get summary of targets for a fiscal year."""
        try:
            targets = await self.find_by_fiscal_year(fiscal_year)
            
            summary = {
                "fiscal_year": fiscal_year,
                "total_count": len(targets),
                "total_target_amount": Decimal('0'),
                "by_priority": {i: {"count": 0, "amount": Decimal('0')} for i in range(1, 6)},
                "by_state": {}
            }
            
            for target in targets:
                # Update totals
                summary["total_target_amount"] += target.target_amount
                
                # Update by priority
                priority = target.priority
                if 1 <= priority <= 5:
                    summary["by_priority"][priority]["count"] += 1
                    summary["by_priority"][priority]["amount"] += target.target_amount
                
                # Update by state
                state = target.state_code
                if state not in summary["by_state"]:
                    summary["by_state"][state] = {
                        "target_amount": Decimal('0'),
                        "priority": target.priority,
                        "description": target.description
                    }
                summary["by_state"][state]["target_amount"] += target.target_amount
            
            # Convert Decimal to float for JSON serialization
            def convert_decimals(obj):
                if isinstance(obj, dict):
                    return {k: convert_decimals(v) for k, v in obj.items()}
                elif isinstance(obj, Decimal):
                    return float(obj)
                return obj
            
            summary = convert_decimals(summary)
            
            logger.debug(f"Generated targets summary for fiscal year {fiscal_year}")
            return summary
            
        except Exception as e:
            logger.error(f"Failed to generate targets summary for {fiscal_year}: {e}")
            raise
    
    async def update_target_amount(self, target_id: str, new_amount: Decimal) -> Optional[StateTargetModel]:
        """Update target amount."""
        try:
            updates = {
                "target_amount": new_amount
            }
            return await self.update(target_id, updates)
            
        except Exception as e:
            logger.error(f"Failed to update target amount for {target_id}: {e}")
            raise
    
    async def update_priority(self, target_id: str, new_priority: int) -> Optional[StateTargetModel]:
        """Update target priority."""
        try:
            if not 1 <= new_priority <= 5:
                raise ValueError("Priority must be between 1 and 5")
            
            updates = {
                "priority": new_priority
            }
            return await self.update(target_id, updates)
            
        except Exception as e:
            logger.error(f"Failed to update priority for {target_id}: {e}")
            raise
    
    async def get_states_without_targets(self, fiscal_year: str, all_states: List[str]) -> List[str]:
        """Get list of states that don't have targets set for a fiscal year."""
        try:
            targets = await self.find_by_fiscal_year(fiscal_year)
            states_with_targets = {target.state_code for target in targets}
            
            states_without_targets = [
                state for state in all_states 
                if state.upper() not in states_with_targets
            ]
            
            logger.debug(f"Found {len(states_without_targets)} states without targets for {fiscal_year}")
            return states_without_targets
            
        except Exception as e:
            logger.error(f"Failed to get states without targets for {fiscal_year}: {e}")
            raise
    
    async def create_or_update_target(
        self, 
        state_code: str, 
        fiscal_year: str, 
        target_amount: Decimal,
        description: Optional[str] = None,
        priority: int = 1
    ) -> StateTargetModel:
        """Create a new target or update existing one for state and fiscal year."""
        try:
            # Check if target already exists
            existing_target = await self.find_by_state_and_year(state_code, fiscal_year)
            
            if existing_target:
                # Update existing target
                updates = {
                    "target_amount": target_amount,
                    "priority": priority
                }
                if description is not None:
                    updates["description"] = description
                
                updated_target = await self.update(existing_target.id, updates)
                logger.info(f"Updated target for {state_code} in {fiscal_year}")
                return updated_target
            else:
                # Create new target
                new_target = StateTargetModel(
                    state_code=state_code.upper(),
                    fiscal_year=fiscal_year,
                    target_amount=target_amount,
                    description=description,
                    priority=priority
                )
                
                created_target = await self.create(new_target)
                logger.info(f"Created new target for {state_code} in {fiscal_year}")
                return created_target
                
        except Exception as e:
            logger.error(f"Failed to create or update target for {state_code} in {fiscal_year}: {e}")
            raise
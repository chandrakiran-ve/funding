"""
Repository for State entities.
"""

import json
import logging
from datetime import datetime
from typing import Any, List, Optional

from app.models.entities import StateModel
from app.repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)


class StateRepository(BaseRepository[StateModel]):
    """Repository for managing State entities in Google Sheets."""
    
    def __init__(self, **kwargs):
        super().__init__(
            model_class=StateModel,
            sheet_name="States",
            **kwargs
        )
    
    def _get_headers(self) -> List[str]:
        """Get column headers for the States sheet."""
        return [
            "code",
            "name",
            "region",
            "population",
            "metadata",
            "created_at",
            "updated_at"
        ]
    
    def _model_to_row(self, model: StateModel) -> List[Any]:
        """Convert StateModel to spreadsheet row."""
        return [
            model.code,
            model.name,
            model.region or "",
            model.population or "",
            json.dumps(model.metadata),
            model.created_at.isoformat(),
            model.updated_at.isoformat()
        ]
    
    def _row_to_model(self, row: List[Any]) -> StateModel:
        """Convert spreadsheet row to StateModel."""
        # Ensure we have enough columns
        while len(row) < len(self._get_headers()):
            row.append("")
        
        # Parse population safely
        try:
            population = int(row[3]) if row[3] else None
        except (ValueError, TypeError):
            population = None
        
        # Parse metadata safely
        try:
            metadata = json.loads(row[4]) if row[4] else {}
        except (json.JSONDecodeError, TypeError):
            metadata = {}
        
        # Parse timestamps safely
        try:
            created_at = datetime.fromisoformat(row[5]) if row[5] else datetime.utcnow()
        except (ValueError, TypeError):
            created_at = datetime.utcnow()
        
        try:
            updated_at = datetime.fromisoformat(row[6]) if row[6] else datetime.utcnow()
        except (ValueError, TypeError):
            updated_at = datetime.utcnow()
        
        return StateModel(
            code=row[0] or "",
            name=row[1] or "",
            region=row[2] if row[2] else None,
            population=population,
            metadata=metadata,
            created_at=created_at,
            updated_at=updated_at
        )
    
    async def get_by_code(self, state_code: str) -> Optional[StateModel]:
        """Get state by code."""
        return await self.get_by_id(state_code.upper())
    
    async def find_by_region(self, region: str) -> List[StateModel]:
        """Find states by region."""
        return await self.find_by_field("region", region)
    
    async def find_by_name(self, name: str) -> List[StateModel]:
        """Find states by name (case-insensitive partial match)."""
        try:
            entities = await self.get_all()
            matches = []
            
            name_lower = name.lower()
            for entity in entities:
                if name_lower in entity.name.lower():
                    matches.append(entity)
            
            logger.debug(f"Found {len(matches)} states matching name: {name}")
            return matches
            
        except Exception as e:
            logger.error(f"Failed to find states by name {name}: {e}")
            raise
    
    async def get_all_state_codes(self) -> List[str]:
        """Get list of all state codes."""
        try:
            states = await self.get_all()
            codes = [state.code for state in states]
            
            logger.debug(f"Retrieved {len(codes)} state codes")
            return codes
            
        except Exception as e:
            logger.error(f"Failed to get all state codes: {e}")
            raise
    
    async def get_states_by_population_range(
        self, 
        min_population: int, 
        max_population: int
    ) -> List[StateModel]:
        """Get states within a population range."""
        try:
            entities = await self.get_all()
            matches = []
            
            for entity in entities:
                if (entity.population and 
                    min_population <= entity.population <= max_population):
                    matches.append(entity)
            
            # Sort by population descending
            matches.sort(key=lambda x: x.population or 0, reverse=True)
            
            logger.debug(f"Found {len(matches)} states with population {min_population}-{max_population}")
            return matches
            
        except Exception as e:
            logger.error(f"Failed to find states by population range: {e}")
            raise
    
    async def get_largest_states(self, limit: int = 10) -> List[StateModel]:
        """Get the largest states by population."""
        try:
            entities = await self.get_all()
            
            # Filter out states without population data and sort
            states_with_pop = [state for state in entities if state.population]
            states_with_pop.sort(key=lambda x: x.population, reverse=True)
            
            result = states_with_pop[:limit]
            
            logger.debug(f"Retrieved top {len(result)} largest states")
            return result
            
        except Exception as e:
            logger.error(f"Failed to get largest states: {e}")
            raise
    
    async def get_regions_summary(self) -> dict:
        """Get summary of states by region."""
        try:
            states = await self.get_all()
            
            summary = {
                "total_states": len(states),
                "by_region": {},
                "states_without_region": 0,
                "total_population": 0
            }
            
            for state in states:
                # Update total population
                if state.population:
                    summary["total_population"] += state.population
                
                # Update by region
                region = state.region or "Unknown"
                if region not in summary["by_region"]:
                    summary["by_region"][region] = {
                        "count": 0,
                        "states": [],
                        "total_population": 0
                    }
                
                summary["by_region"][region]["count"] += 1
                summary["by_region"][region]["states"].append({
                    "code": state.code,
                    "name": state.name,
                    "population": state.population
                })
                
                if state.population:
                    summary["by_region"][region]["total_population"] += state.population
                
                # Count states without region
                if not state.region:
                    summary["states_without_region"] += 1
            
            logger.debug("Generated regions summary")
            return summary
            
        except Exception as e:
            logger.error(f"Failed to generate regions summary: {e}")
            raise
    
    async def update_population(self, state_code: str, population: int) -> Optional[StateModel]:
        """Update state population."""
        try:
            updates = {
                "population": population
            }
            return await self.update(state_code.upper(), updates)
            
        except Exception as e:
            logger.error(f"Failed to update population for state {state_code}: {e}")
            raise
    
    async def update_region(self, state_code: str, region: str) -> Optional[StateModel]:
        """Update state region."""
        try:
            updates = {
                "region": region
            }
            return await self.update(state_code.upper(), updates)
            
        except Exception as e:
            logger.error(f"Failed to update region for state {state_code}: {e}")
            raise
    
    async def validate_state_code(self, state_code: str) -> bool:
        """Validate if a state code exists."""
        try:
            state = await self.get_by_code(state_code)
            return state is not None
            
        except Exception as e:
            logger.error(f"Failed to validate state code {state_code}: {e}")
            return False
    
    async def get_state_name(self, state_code: str) -> Optional[str]:
        """Get state name by code."""
        try:
            state = await self.get_by_code(state_code)
            return state.name if state else None
            
        except Exception as e:
            logger.error(f"Failed to get state name for {state_code}: {e}")
            return None
    
    async def create_or_update_state(
        self,
        code: str,
        name: str,
        region: Optional[str] = None,
        population: Optional[int] = None
    ) -> StateModel:
        """Create a new state or update existing one."""
        try:
            # Check if state already exists
            existing_state = await self.get_by_code(code)
            
            if existing_state:
                # Update existing state
                updates = {
                    "name": name
                }
                if region is not None:
                    updates["region"] = region
                if population is not None:
                    updates["population"] = population
                
                updated_state = await self.update(code.upper(), updates)
                logger.info(f"Updated state {code}")
                return updated_state
            else:
                # Create new state
                new_state = StateModel(
                    code=code.upper(),
                    name=name,
                    region=region,
                    population=population
                )
                
                created_state = await self.create(new_state)
                logger.info(f"Created new state {code}")
                return created_state
                
        except Exception as e:
            logger.error(f"Failed to create or update state {code}: {e}")
            raise
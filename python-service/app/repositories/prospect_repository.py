"""
Repository for Prospect entities.
"""

import json
import logging
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Any, List, Optional

from app.models.entities import ProspectModel, ContactInfo
from app.repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)


class ProspectRepository(BaseRepository[ProspectModel]):
    """Repository for managing Prospect entities in Google Sheets."""
    
    def __init__(self, **kwargs):
        super().__init__(
            model_class=ProspectModel,
            sheet_name="Prospects",
            **kwargs
        )
    
    def _get_headers(self) -> List[str]:
        """Get column headers for the Prospects sheet."""
        return [
            "id",
            "name",
            "state_code",
            "stage",
            "estimated_amount",
            "probability",
            "expected_close_date",
            "contact_email",
            "contact_phone",
            "contact_address",
            "contact_website",
            "notes",
            "tags",
            "metadata",
            "created_at",
            "updated_at"
        ]
    
    def _model_to_row(self, model: ProspectModel) -> List[Any]:
        """Convert ProspectModel to spreadsheet row."""
        contact_info = model.contact_info or ContactInfo()
        
        return [
            model.id,
            model.name,
            model.state_code or "",
            model.stage,
            float(model.estimated_amount),
            float(model.probability),
            model.expected_close_date.isoformat() if model.expected_close_date else "",
            contact_info.email or "",
            contact_info.phone or "",
            contact_info.address or "",
            contact_info.website or "",
            model.notes or "",
            json.dumps(model.tags),
            json.dumps(model.metadata),
            model.created_at.isoformat(),
            model.updated_at.isoformat()
        ]
    
    def _row_to_model(self, row: List[Any]) -> ProspectModel:
        """Convert spreadsheet row to ProspectModel."""
        # Ensure we have enough columns
        while len(row) < len(self._get_headers()):
            row.append("")
        
        # Parse estimated amount safely
        try:
            estimated_amount = Decimal(str(row[4])) if row[4] else Decimal('0')
        except (ValueError, TypeError):
            estimated_amount = Decimal('0')
        
        # Parse probability safely
        try:
            probability = float(row[5]) if row[5] else 0.0
        except (ValueError, TypeError):
            probability = 0.0
        
        # Parse expected close date safely
        try:
            expected_close_date = datetime.fromisoformat(row[6]) if row[6] else None
        except (ValueError, TypeError):
            expected_close_date = None
        
        # Parse contact info
        contact_info = None
        if any([row[7], row[8], row[9], row[10]]):  # If any contact field has data
            contact_info = ContactInfo(
                email=row[7] if row[7] else None,
                phone=row[8] if row[8] else None,
                address=row[9] if row[9] else None,
                website=row[10] if row[10] else None
            )
        
        # Parse JSON fields safely
        try:
            tags = json.loads(row[12]) if row[12] else []
        except (json.JSONDecodeError, TypeError):
            tags = []
        
        try:
            metadata = json.loads(row[13]) if row[13] else {}
        except (json.JSONDecodeError, TypeError):
            metadata = {}
        
        # Parse timestamps safely
        try:
            created_at = datetime.fromisoformat(row[14]) if row[14] else datetime.utcnow()
        except (ValueError, TypeError):
            created_at = datetime.utcnow()
        
        try:
            updated_at = datetime.fromisoformat(row[15]) if row[15] else datetime.utcnow()
        except (ValueError, TypeError):
            updated_at = datetime.utcnow()
        
        return ProspectModel(
            id=row[0] or "",
            name=row[1] or "",
            state_code=row[2] if row[2] else None,
            stage=row[3] or "initial",
            estimated_amount=estimated_amount,
            probability=probability,
            expected_close_date=expected_close_date,
            contact_info=contact_info,
            notes=row[11] if row[11] else None,
            tags=tags,
            metadata=metadata,
            created_at=created_at,
            updated_at=updated_at
        )
    
    async def find_by_stage(self, stage: str) -> List[ProspectModel]:
        """Find prospects by stage."""
        return await self.find_by_field("stage", stage)
    
    async def find_by_state(self, state_code: str) -> List[ProspectModel]:
        """Find prospects by state code."""
        return await self.find_by_field("state_code", state_code.upper() if state_code else None)
    
    async def find_by_name(self, name: str) -> List[ProspectModel]:
        """Find prospects by name (case-insensitive partial match)."""
        try:
            entities = await self.get_all()
            matches = []
            
            name_lower = name.lower()
            for entity in entities:
                if name_lower in entity.name.lower():
                    matches.append(entity)
            
            logger.debug(f"Found {len(matches)} prospects matching name: {name}")
            return matches
            
        except Exception as e:
            logger.error(f"Failed to find prospects by name {name}: {e}")
            raise
    
    async def find_by_tag(self, tag: str) -> List[ProspectModel]:
        """Find prospects that have a specific tag."""
        try:
            entities = await self.get_all()
            matches = []
            
            for entity in entities:
                if tag in entity.tags:
                    matches.append(entity)
            
            logger.debug(f"Found {len(matches)} prospects with tag: {tag}")
            return matches
            
        except Exception as e:
            logger.error(f"Failed to find prospects by tag {tag}: {e}")
            raise
    
    async def get_active_prospects(self) -> List[ProspectModel]:
        """Get prospects in active stages (not closed)."""
        try:
            entities = await self.get_all()
            active_stages = ['initial', 'qualified', 'proposal', 'negotiation']
            
            matches = [entity for entity in entities if entity.stage in active_stages]
            
            logger.debug(f"Found {len(matches)} active prospects")
            return matches
            
        except Exception as e:
            logger.error(f"Failed to get active prospects: {e}")
            raise
    
    async def get_won_prospects(self) -> List[ProspectModel]:
        """Get prospects that were closed won."""
        return await self.find_by_stage("closed_won")
    
    async def get_lost_prospects(self) -> List[ProspectModel]:
        """Get prospects that were closed lost."""
        return await self.find_by_stage("closed_lost")
    
    async def get_prospects_by_probability_range(
        self, 
        min_probability: float, 
        max_probability: float
    ) -> List[ProspectModel]:
        """Get prospects within a probability range."""
        try:
            entities = await self.get_all()
            matches = []
            
            for entity in entities:
                if min_probability <= entity.probability <= max_probability:
                    matches.append(entity)
            
            logger.debug(f"Found {len(matches)} prospects with probability {min_probability}-{max_probability}")
            return matches
            
        except Exception as e:
            logger.error(f"Failed to find prospects by probability range: {e}")
            raise
    
    async def get_prospects_closing_soon(self, days_ahead: int = 30) -> List[ProspectModel]:
        """Get prospects expected to close within specified days."""
        try:
            entities = await self.get_all()
            matches = []
            
            cutoff_date = datetime.utcnow() + timedelta(days=days_ahead)
            
            for entity in entities:
                if (entity.expected_close_date and 
                    entity.expected_close_date <= cutoff_date and
                    entity.stage not in ['closed_won', 'closed_lost']):
                    matches.append(entity)
            
            # Sort by expected close date
            matches.sort(key=lambda x: x.expected_close_date or datetime.max)
            
            logger.debug(f"Found {len(matches)} prospects closing within {days_ahead} days")
            return matches
            
        except Exception as e:
            logger.error(f"Failed to find prospects closing soon: {e}")
            raise
    
    async def update_stage(self, prospect_id: str, new_stage: str) -> Optional[ProspectModel]:
        """Update prospect stage."""
        try:
            prospect = await self.get_by_id(prospect_id)
            if not prospect:
                return None
            
            prospect.update_stage(new_stage)
            
            updates = {
                "stage": new_stage,
                "updated_at": prospect.updated_at
            }
            return await self.update(prospect_id, updates)
            
        except Exception as e:
            logger.error(f"Failed to update stage for prospect {prospect_id}: {e}")
            raise
    
    async def update_probability(self, prospect_id: str, new_probability: float) -> Optional[ProspectModel]:
        """Update prospect probability."""
        try:
            if not 0.0 <= new_probability <= 1.0:
                raise ValueError("Probability must be between 0.0 and 1.0")
            
            updates = {
                "probability": new_probability
            }
            return await self.update(prospect_id, updates)
            
        except Exception as e:
            logger.error(f"Failed to update probability for prospect {prospect_id}: {e}")
            raise
    
    async def get_pipeline_summary(self) -> dict:
        """Get summary of the prospect pipeline."""
        try:
            prospects = await self.get_all()
            
            summary = {
                "total_count": len(prospects),
                "total_estimated_value": Decimal('0'),
                "total_weighted_value": Decimal('0'),
                "by_stage": {},
                "by_state": {},
                "closing_this_month": 0,
                "high_probability": 0  # > 0.7 probability
            }
            
            current_month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            next_month_start = (current_month_start + timedelta(days=32)).replace(day=1)
            
            for prospect in prospects:
                # Update totals
                summary["total_estimated_value"] += prospect.estimated_amount
                summary["total_weighted_value"] += prospect.calculate_weighted_value()
                
                # Update by stage
                stage = prospect.stage
                if stage not in summary["by_stage"]:
                    summary["by_stage"][stage] = {
                        "count": 0, 
                        "estimated_value": Decimal('0'),
                        "weighted_value": Decimal('0')
                    }
                summary["by_stage"][stage]["count"] += 1
                summary["by_stage"][stage]["estimated_value"] += prospect.estimated_amount
                summary["by_stage"][stage]["weighted_value"] += prospect.calculate_weighted_value()
                
                # Update by state
                state = prospect.state_code or "Unknown"
                if state not in summary["by_state"]:
                    summary["by_state"][state] = {
                        "count": 0,
                        "estimated_value": Decimal('0'),
                        "weighted_value": Decimal('0')
                    }
                summary["by_state"][state]["count"] += 1
                summary["by_state"][state]["estimated_value"] += prospect.estimated_amount
                summary["by_state"][state]["weighted_value"] += prospect.calculate_weighted_value()
                
                # Check closing this month
                if (prospect.expected_close_date and 
                    current_month_start <= prospect.expected_close_date < next_month_start):
                    summary["closing_this_month"] += 1
                
                # Check high probability
                if prospect.probability > 0.7:
                    summary["high_probability"] += 1
            
            # Convert Decimal to float for JSON serialization
            def convert_decimals(obj):
                if isinstance(obj, dict):
                    return {k: convert_decimals(v) for k, v in obj.items()}
                elif isinstance(obj, Decimal):
                    return float(obj)
                return obj
            
            summary = convert_decimals(summary)
            
            logger.debug("Generated pipeline summary")
            return summary
            
        except Exception as e:
            logger.error(f"Failed to generate pipeline summary: {e}")
            raise
    
    async def add_tag(self, prospect_id: str, tag: str) -> Optional[ProspectModel]:
        """Add a tag to a prospect."""
        try:
            prospect = await self.get_by_id(prospect_id)
            if not prospect:
                return None
            
            if tag not in prospect.tags:
                prospect.tags.append(tag)
                
                updates = {
                    "tags": prospect.tags
                }
                return await self.update(prospect_id, updates)
            
            return prospect
            
        except Exception as e:
            logger.error(f"Failed to add tag {tag} to prospect {prospect_id}: {e}")
            raise
    
    async def remove_tag(self, prospect_id: str, tag: str) -> Optional[ProspectModel]:
        """Remove a tag from a prospect."""
        try:
            prospect = await self.get_by_id(prospect_id)
            if not prospect:
                return None
            
            if tag in prospect.tags:
                prospect.tags.remove(tag)
                
                updates = {
                    "tags": prospect.tags
                }
                return await self.update(prospect_id, updates)
            
            return prospect
            
        except Exception as e:
            logger.error(f"Failed to remove tag {tag} from prospect {prospect_id}: {e}")
            raise
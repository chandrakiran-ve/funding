"""
Repository for Funder entities.
"""

import json
import logging
from datetime import datetime
from typing import Any, List, Optional

from app.models.entities import FunderModel, ContactInfo
from app.repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)


class FunderRepository(BaseRepository[FunderModel]):
    """Repository for managing Funder entities in Google Sheets."""
    
    def __init__(self, **kwargs):
        super().__init__(
            model_class=FunderModel,
            sheet_name="Funders",
            **kwargs
        )
    
    def _get_headers(self) -> List[str]:
        """Get column headers for the Funders sheet."""
        return [
            "id",
            "name", 
            "contact_email",
            "contact_phone",
            "contact_address",
            "contact_website",
            "contribution_history",
            "preferences",
            "tags",
            "status",
            "created_at",
            "updated_at"
        ]
    
    def _model_to_row(self, model: FunderModel) -> List[Any]:
        """Convert FunderModel to spreadsheet row."""
        contact_info = model.contact_info or ContactInfo()
        
        return [
            model.id,
            model.name,
            contact_info.email or "",
            contact_info.phone or "",
            contact_info.address or "",
            contact_info.website or "",
            json.dumps(model.contribution_history),
            json.dumps(model.preferences),
            json.dumps(model.tags),
            model.status,
            model.created_at.isoformat(),
            model.updated_at.isoformat()
        ]
    
    def _row_to_model(self, row: List[Any]) -> FunderModel:
        """Convert spreadsheet row to FunderModel."""
        # Ensure we have enough columns
        while len(row) < len(self._get_headers()):
            row.append("")
        
        # Parse contact info
        contact_info = None
        if any([row[2], row[3], row[4], row[5]]):  # If any contact field has data
            contact_info = ContactInfo(
                email=row[2] if row[2] else None,
                phone=row[3] if row[3] else None,
                address=row[4] if row[4] else None,
                website=row[5] if row[5] else None
            )
        
        # Parse JSON fields safely
        try:
            contribution_history = json.loads(row[6]) if row[6] else []
        except (json.JSONDecodeError, TypeError):
            contribution_history = []
        
        try:
            preferences = json.loads(row[7]) if row[7] else {}
        except (json.JSONDecodeError, TypeError):
            preferences = {}
        
        try:
            tags = json.loads(row[8]) if row[8] else []
        except (json.JSONDecodeError, TypeError):
            tags = []
        
        # Parse dates safely
        try:
            created_at = datetime.fromisoformat(row[10]) if row[10] else datetime.utcnow()
        except (ValueError, TypeError):
            created_at = datetime.utcnow()
        
        try:
            updated_at = datetime.fromisoformat(row[11]) if row[11] else datetime.utcnow()
        except (ValueError, TypeError):
            updated_at = datetime.utcnow()
        
        return FunderModel(
            id=row[0] or "",
            name=row[1] or "",
            contact_info=contact_info,
            contribution_history=contribution_history,
            preferences=preferences,
            tags=tags,
            status=row[9] or "active",
            created_at=created_at,
            updated_at=updated_at
        )
    
    async def find_by_name(self, name: str) -> List[FunderModel]:
        """Find funders by name (case-insensitive partial match)."""
        try:
            entities = await self.get_all()
            matches = []
            
            name_lower = name.lower()
            for entity in entities:
                if name_lower in entity.name.lower():
                    matches.append(entity)
            
            logger.debug(f"Found {len(matches)} funders matching name: {name}")
            return matches
            
        except Exception as e:
            logger.error(f"Failed to find funders by name {name}: {e}")
            raise
    
    async def find_by_status(self, status: str) -> List[FunderModel]:
        """Find funders by status."""
        return await self.find_by_field("status", status)
    
    async def find_by_tag(self, tag: str) -> List[FunderModel]:
        """Find funders that have a specific tag."""
        try:
            entities = await self.get_all()
            matches = []
            
            for entity in entities:
                if tag in entity.tags:
                    matches.append(entity)
            
            logger.debug(f"Found {len(matches)} funders with tag: {tag}")
            return matches
            
        except Exception as e:
            logger.error(f"Failed to find funders by tag {tag}: {e}")
            raise
    
    async def get_active_funders(self) -> List[FunderModel]:
        """Get all active funders."""
        return await self.find_by_status("active")
    
    async def add_contribution_to_funder(self, funder_id: str, contribution_id: str) -> Optional[FunderModel]:
        """Add a contribution ID to a funder's history."""
        try:
            funder = await self.get_by_id(funder_id)
            if not funder:
                return None
            
            if contribution_id not in funder.contribution_history:
                funder.add_contribution(contribution_id)
                
                # Update in sheet
                updates = {
                    "contribution_history": funder.contribution_history,
                    "updated_at": funder.updated_at
                }
                return await self.update(funder_id, updates)
            
            return funder
            
        except Exception as e:
            logger.error(f"Failed to add contribution {contribution_id} to funder {funder_id}: {e}")
            raise
    
    async def remove_contribution_from_funder(self, funder_id: str, contribution_id: str) -> Optional[FunderModel]:
        """Remove a contribution ID from a funder's history."""
        try:
            funder = await self.get_by_id(funder_id)
            if not funder:
                return None
            
            if contribution_id in funder.contribution_history:
                funder.remove_contribution(contribution_id)
                
                # Update in sheet
                updates = {
                    "contribution_history": funder.contribution_history,
                    "updated_at": funder.updated_at
                }
                return await self.update(funder_id, updates)
            
            return funder
            
        except Exception as e:
            logger.error(f"Failed to remove contribution {contribution_id} from funder {funder_id}: {e}")
            raise
    
    async def update_contact_info(self, funder_id: str, contact_info: ContactInfo) -> Optional[FunderModel]:
        """Update funder's contact information."""
        try:
            updates = {
                "contact_info": contact_info
            }
            return await self.update(funder_id, updates)
            
        except Exception as e:
            logger.error(f"Failed to update contact info for funder {funder_id}: {e}")
            raise
    
    async def add_tag(self, funder_id: str, tag: str) -> Optional[FunderModel]:
        """Add a tag to a funder."""
        try:
            funder = await self.get_by_id(funder_id)
            if not funder:
                return None
            
            if tag not in funder.tags:
                funder.tags.append(tag)
                
                updates = {
                    "tags": funder.tags
                }
                return await self.update(funder_id, updates)
            
            return funder
            
        except Exception as e:
            logger.error(f"Failed to add tag {tag} to funder {funder_id}: {e}")
            raise
    
    async def remove_tag(self, funder_id: str, tag: str) -> Optional[FunderModel]:
        """Remove a tag from a funder."""
        try:
            funder = await self.get_by_id(funder_id)
            if not funder:
                return None
            
            if tag in funder.tags:
                funder.tags.remove(tag)
                
                updates = {
                    "tags": funder.tags
                }
                return await self.update(funder_id, updates)
            
            return funder
            
        except Exception as e:
            logger.error(f"Failed to remove tag {tag} from funder {funder_id}: {e}")
            raise
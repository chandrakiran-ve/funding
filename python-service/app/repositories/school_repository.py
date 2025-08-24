"""
Repository for School entities.
"""

import json
import logging
from datetime import datetime
from typing import Any, List, Optional

from app.models.entities import SchoolModel, ContactInfo
from app.repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)


class SchoolRepository(BaseRepository[SchoolModel]):
    """Repository for managing School entities in Google Sheets."""
    
    def __init__(self, **kwargs):
        super().__init__(
            model_class=SchoolModel,
            sheet_name="Schools",
            **kwargs
        )
    
    def _get_headers(self) -> List[str]:
        """Get column headers for the Schools sheet."""
        return [
            "id",
            "name",
            "state_code",
            "district",
            "type",
            "enrollment",
            "contact_email",
            "contact_phone",
            "contact_address",
            "contact_website",
            "metadata",
            "created_at",
            "updated_at"
        ]
    
    def _model_to_row(self, model: SchoolModel) -> List[Any]:
        """Convert SchoolModel to spreadsheet row."""
        contact_info = model.contact_info or ContactInfo()
        
        return [
            model.id,
            model.name,
            model.state_code,
            model.district or "",
            model.type or "",
            model.enrollment or "",
            contact_info.email or "",
            contact_info.phone or "",
            contact_info.address or "",
            contact_info.website or "",
            json.dumps(model.metadata),
            model.created_at.isoformat(),
            model.updated_at.isoformat()
        ]
    
    def _row_to_model(self, row: List[Any]) -> SchoolModel:
        """Convert spreadsheet row to SchoolModel."""
        # Ensure we have enough columns
        while len(row) < len(self._get_headers()):
            row.append("")
        
        # Parse enrollment safely
        try:
            enrollment = int(row[5]) if row[5] else None
        except (ValueError, TypeError):
            enrollment = None
        
        # Parse contact info
        contact_info = None
        if any([row[6], row[7], row[8], row[9]]):  # If any contact field has data
            contact_info = ContactInfo(
                email=row[6] if row[6] else None,
                phone=row[7] if row[7] else None,
                address=row[8] if row[8] else None,
                website=row[9] if row[9] else None
            )
        
        # Parse metadata safely
        try:
            metadata = json.loads(row[10]) if row[10] else {}
        except (json.JSONDecodeError, TypeError):
            metadata = {}
        
        # Parse timestamps safely
        try:
            created_at = datetime.fromisoformat(row[11]) if row[11] else datetime.utcnow()
        except (ValueError, TypeError):
            created_at = datetime.utcnow()
        
        try:
            updated_at = datetime.fromisoformat(row[12]) if row[12] else datetime.utcnow()
        except (ValueError, TypeError):
            updated_at = datetime.utcnow()
        
        return SchoolModel(
            id=row[0] or "",
            name=row[1] or "",
            state_code=row[2] or "",
            district=row[3] if row[3] else None,
            type=row[4] if row[4] else None,
            enrollment=enrollment,
            contact_info=contact_info,
            metadata=metadata,
            created_at=created_at,
            updated_at=updated_at
        )
    
    async def find_by_state(self, state_code: str) -> List[SchoolModel]:
        """Find schools by state code."""
        return await self.find_by_field("state_code", state_code.upper())
    
    async def find_by_district(self, district: str) -> List[SchoolModel]:
        """Find schools by district."""
        return await self.find_by_field("district", district)
    
    async def find_by_type(self, school_type: str) -> List[SchoolModel]:
        """Find schools by type."""
        return await self.find_by_field("type", school_type.lower())
    
    async def find_by_name(self, name: str) -> List[SchoolModel]:
        """Find schools by name (case-insensitive partial match)."""
        try:
            entities = await self.get_all()
            matches = []
            
            name_lower = name.lower()
            for entity in entities:
                if name_lower in entity.name.lower():
                    matches.append(entity)
            
            logger.debug(f"Found {len(matches)} schools matching name: {name}")
            return matches
            
        except Exception as e:
            logger.error(f"Failed to find schools by name {name}: {e}")
            raise
    
    async def find_by_state_and_district(self, state_code: str, district: str) -> List[SchoolModel]:
        """Find schools by state and district."""
        try:
            entities = await self.get_all()
            matches = []
            
            state_upper = state_code.upper()
            for entity in entities:
                if entity.state_code == state_upper and entity.district == district:
                    matches.append(entity)
            
            logger.debug(f"Found {len(matches)} schools in {district}, {state_code}")
            return matches
            
        except Exception as e:
            logger.error(f"Failed to find schools by state {state_code} and district {district}: {e}")
            raise
    
    async def get_schools_by_enrollment_range(
        self, 
        min_enrollment: int, 
        max_enrollment: int
    ) -> List[SchoolModel]:
        """Get schools within an enrollment range."""
        try:
            entities = await self.get_all()
            matches = []
            
            for entity in entities:
                if (entity.enrollment and 
                    min_enrollment <= entity.enrollment <= max_enrollment):
                    matches.append(entity)
            
            # Sort by enrollment descending
            matches.sort(key=lambda x: x.enrollment or 0, reverse=True)
            
            logger.debug(f"Found {len(matches)} schools with enrollment {min_enrollment}-{max_enrollment}")
            return matches
            
        except Exception as e:
            logger.error(f"Failed to find schools by enrollment range: {e}")
            raise
    
    async def get_largest_schools(self, limit: int = 10, state_code: Optional[str] = None) -> List[SchoolModel]:
        """Get the largest schools by enrollment, optionally filtered by state."""
        try:
            entities = await self.get_all()
            
            # Filter by state if specified
            if state_code:
                entities = [school for school in entities if school.state_code == state_code.upper()]
            
            # Filter out schools without enrollment data and sort
            schools_with_enrollment = [school for school in entities if school.enrollment]
            schools_with_enrollment.sort(key=lambda x: x.enrollment, reverse=True)
            
            result = schools_with_enrollment[:limit]
            
            logger.debug(f"Retrieved top {len(result)} largest schools")
            return result
            
        except Exception as e:
            logger.error(f"Failed to get largest schools: {e}")
            raise
    
    async def get_schools_summary(self, state_code: Optional[str] = None) -> dict:
        """Get summary of schools, optionally filtered by state."""
        try:
            schools = await self.get_all()
            
            # Filter by state if specified
            if state_code:
                schools = [school for school in schools if school.state_code == state_code.upper()]
            
            summary = {
                "total_schools": len(schools),
                "total_enrollment": 0,
                "by_type": {},
                "by_district": {},
                "by_state": {},
                "schools_without_enrollment": 0,
                "average_enrollment": 0
            }
            
            enrollment_count = 0
            
            for school in schools:
                # Update total enrollment
                if school.enrollment:
                    summary["total_enrollment"] += school.enrollment
                    enrollment_count += 1
                else:
                    summary["schools_without_enrollment"] += 1
                
                # Update by type
                school_type = school.type or "Unknown"
                if school_type not in summary["by_type"]:
                    summary["by_type"][school_type] = {
                        "count": 0,
                        "total_enrollment": 0
                    }
                summary["by_type"][school_type]["count"] += 1
                if school.enrollment:
                    summary["by_type"][school_type]["total_enrollment"] += school.enrollment
                
                # Update by district
                district = school.district or "Unknown"
                if district not in summary["by_district"]:
                    summary["by_district"][district] = {
                        "count": 0,
                        "total_enrollment": 0
                    }
                summary["by_district"][district]["count"] += 1
                if school.enrollment:
                    summary["by_district"][district]["total_enrollment"] += school.enrollment
                
                # Update by state (if not filtering by state)
                if not state_code:
                    state = school.state_code
                    if state not in summary["by_state"]:
                        summary["by_state"][state] = {
                            "count": 0,
                            "total_enrollment": 0
                        }
                    summary["by_state"][state]["count"] += 1
                    if school.enrollment:
                        summary["by_state"][state]["total_enrollment"] += school.enrollment
            
            # Calculate average enrollment
            if enrollment_count > 0:
                summary["average_enrollment"] = summary["total_enrollment"] / enrollment_count
            
            logger.debug(f"Generated schools summary for {state_code or 'all states'}")
            return summary
            
        except Exception as e:
            logger.error(f"Failed to generate schools summary: {e}")
            raise
    
    async def update_enrollment(self, school_id: str, enrollment: int) -> Optional[SchoolModel]:
        """Update school enrollment."""
        try:
            updates = {
                "enrollment": enrollment
            }
            return await self.update(school_id, updates)
            
        except Exception as e:
            logger.error(f"Failed to update enrollment for school {school_id}: {e}")
            raise
    
    async def update_contact_info(self, school_id: str, contact_info: ContactInfo) -> Optional[SchoolModel]:
        """Update school's contact information."""
        try:
            updates = {
                "contact_info": contact_info
            }
            return await self.update(school_id, updates)
            
        except Exception as e:
            logger.error(f"Failed to update contact info for school {school_id}: {e}")
            raise
    
    async def get_districts_in_state(self, state_code: str) -> List[str]:
        """Get list of unique districts in a state."""
        try:
            schools = await self.find_by_state(state_code)
            
            districts = set()
            for school in schools:
                if school.district:
                    districts.add(school.district)
            
            district_list = sorted(list(districts))
            
            logger.debug(f"Found {len(district_list)} districts in {state_code}")
            return district_list
            
        except Exception as e:
            logger.error(f"Failed to get districts in state {state_code}: {e}")
            raise
    
    async def get_school_types_in_state(self, state_code: str) -> List[str]:
        """Get list of unique school types in a state."""
        try:
            schools = await self.find_by_state(state_code)
            
            types = set()
            for school in schools:
                if school.type:
                    types.add(school.type)
            
            type_list = sorted(list(types))
            
            logger.debug(f"Found {len(type_list)} school types in {state_code}")
            return type_list
            
        except Exception as e:
            logger.error(f"Failed to get school types in state {state_code}: {e}")
            raise
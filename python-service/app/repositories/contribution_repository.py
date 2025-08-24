"""
Repository for Contribution entities.
"""

import json
import logging
from datetime import datetime
from decimal import Decimal
from typing import Any, List, Optional

from app.models.entities import ContributionModel, ContributionStatus
from app.repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)


class ContributionRepository(BaseRepository[ContributionModel]):
    """Repository for managing Contribution entities in Google Sheets."""
    
    def __init__(self, **kwargs):
        super().__init__(
            model_class=ContributionModel,
            sheet_name="Contributions",
            **kwargs
        )
    
    def _get_headers(self) -> List[str]:
        """Get column headers for the Contributions sheet."""
        return [
            "id",
            "funder_id",
            "state_code",
            "fiscal_year",
            "amount",
            "date",
            "status",
            "description",
            "metadata",
            "created_at",
            "updated_at"
        ]
    
    def _model_to_row(self, model: ContributionModel) -> List[Any]:
        """Convert ContributionModel to spreadsheet row."""
        return [
            model.id,
            model.funder_id,
            model.state_code,
            model.fiscal_year,
            float(model.amount),
            model.date.isoformat() if model.date else "",
            model.status.value,
            model.description or "",
            json.dumps(model.metadata),
            model.created_at.isoformat(),
            model.updated_at.isoformat()
        ]
    
    def _row_to_model(self, row: List[Any]) -> ContributionModel:
        """Convert spreadsheet row to ContributionModel."""
        # Ensure we have enough columns
        while len(row) < len(self._get_headers()):
            row.append("")
        
        # Parse amount safely
        try:
            amount = Decimal(str(row[4])) if row[4] else Decimal('0')
        except (ValueError, TypeError):
            amount = Decimal('0')
        
        # Parse date safely
        try:
            date = datetime.fromisoformat(row[5]) if row[5] else None
        except (ValueError, TypeError):
            date = None
        
        # Parse status safely
        try:
            status = ContributionStatus(row[6]) if row[6] else ContributionStatus.PENDING
        except ValueError:
            status = ContributionStatus.PENDING
        
        # Parse metadata safely
        try:
            metadata = json.loads(row[8]) if row[8] else {}
        except (json.JSONDecodeError, TypeError):
            metadata = {}
        
        # Parse timestamps safely
        try:
            created_at = datetime.fromisoformat(row[9]) if row[9] else datetime.utcnow()
        except (ValueError, TypeError):
            created_at = datetime.utcnow()
        
        try:
            updated_at = datetime.fromisoformat(row[10]) if row[10] else datetime.utcnow()
        except (ValueError, TypeError):
            updated_at = datetime.utcnow()
        
        return ContributionModel(
            id=row[0] or "",
            funder_id=row[1] or "",
            state_code=row[2] or "",
            fiscal_year=row[3] or "",
            amount=amount,
            date=date,
            status=status,
            description=row[7] if row[7] else None,
            metadata=metadata,
            created_at=created_at,
            updated_at=updated_at
        )
    
    async def find_by_funder(self, funder_id: str) -> List[ContributionModel]:
        """Find contributions by funder ID."""
        return await self.find_by_field("funder_id", funder_id)
    
    async def find_by_state(self, state_code: str) -> List[ContributionModel]:
        """Find contributions by state code."""
        return await self.find_by_field("state_code", state_code.upper())
    
    async def find_by_fiscal_year(self, fiscal_year: str) -> List[ContributionModel]:
        """Find contributions by fiscal year."""
        return await self.find_by_field("fiscal_year", fiscal_year)
    
    async def find_by_status(self, status: ContributionStatus) -> List[ContributionModel]:
        """Find contributions by status."""
        return await self.find_by_field("status", status)
    
    async def find_by_state_and_year(self, state_code: str, fiscal_year: str) -> List[ContributionModel]:
        """Find contributions by state and fiscal year."""
        try:
            entities = await self.get_all()
            matches = []
            
            state_upper = state_code.upper()
            for entity in entities:
                if entity.state_code == state_upper and entity.fiscal_year == fiscal_year:
                    matches.append(entity)
            
            logger.debug(f"Found {len(matches)} contributions for {state_code} in {fiscal_year}")
            return matches
            
        except Exception as e:
            logger.error(f"Failed to find contributions by state {state_code} and year {fiscal_year}: {e}")
            raise
    
    async def get_total_by_state(self, state_code: str, fiscal_year: Optional[str] = None) -> Decimal:
        """Get total contribution amount by state, optionally filtered by fiscal year."""
        try:
            if fiscal_year:
                contributions = await self.find_by_state_and_year(state_code, fiscal_year)
            else:
                contributions = await self.find_by_state(state_code)
            
            # Only count confirmed and received contributions
            total = Decimal('0')
            for contrib in contributions:
                if contrib.status in [ContributionStatus.CONFIRMED, ContributionStatus.RECEIVED]:
                    total += contrib.amount
            
            logger.debug(f"Total contributions for {state_code}: {total}")
            return total
            
        except Exception as e:
            logger.error(f"Failed to calculate total for state {state_code}: {e}")
            raise
    
    async def get_total_by_funder(self, funder_id: str, fiscal_year: Optional[str] = None) -> Decimal:
        """Get total contribution amount by funder, optionally filtered by fiscal year."""
        try:
            contributions = await self.find_by_funder(funder_id)
            
            if fiscal_year:
                contributions = [c for c in contributions if c.fiscal_year == fiscal_year]
            
            # Only count confirmed and received contributions
            total = Decimal('0')
            for contrib in contributions:
                if contrib.status in [ContributionStatus.CONFIRMED, ContributionStatus.RECEIVED]:
                    total += contrib.amount
            
            logger.debug(f"Total contributions for funder {funder_id}: {total}")
            return total
            
        except Exception as e:
            logger.error(f"Failed to calculate total for funder {funder_id}: {e}")
            raise
    
    async def get_contributions_by_date_range(
        self, 
        start_date: datetime, 
        end_date: datetime
    ) -> List[ContributionModel]:
        """Get contributions within a date range."""
        try:
            entities = await self.get_all()
            matches = []
            
            for entity in entities:
                if entity.date and start_date <= entity.date <= end_date:
                    matches.append(entity)
            
            logger.debug(f"Found {len(matches)} contributions between {start_date} and {end_date}")
            return matches
            
        except Exception as e:
            logger.error(f"Failed to find contributions by date range: {e}")
            raise
    
    async def update_status(self, contribution_id: str, new_status: ContributionStatus) -> Optional[ContributionModel]:
        """Update contribution status."""
        try:
            contribution = await self.get_by_id(contribution_id)
            if not contribution:
                return None
            
            contribution.update_status(new_status)
            
            updates = {
                "status": new_status,
                "updated_at": contribution.updated_at
            }
            return await self.update(contribution_id, updates)
            
        except Exception as e:
            logger.error(f"Failed to update status for contribution {contribution_id}: {e}")
            raise
    
    async def get_pending_contributions(self) -> List[ContributionModel]:
        """Get all pending contributions."""
        return await self.find_by_status(ContributionStatus.PENDING)
    
    async def get_confirmed_contributions(self) -> List[ContributionModel]:
        """Get all confirmed contributions."""
        return await self.find_by_status(ContributionStatus.CONFIRMED)
    
    async def get_received_contributions(self) -> List[ContributionModel]:
        """Get all received contributions."""
        return await self.find_by_status(ContributionStatus.RECEIVED)
    
    async def get_summary_by_fiscal_year(self, fiscal_year: str) -> dict:
        """Get contribution summary for a fiscal year."""
        try:
            contributions = await self.find_by_fiscal_year(fiscal_year)
            
            summary = {
                "fiscal_year": fiscal_year,
                "total_count": len(contributions),
                "total_amount": Decimal('0'),
                "by_status": {status.value: {"count": 0, "amount": Decimal('0')} for status in ContributionStatus},
                "by_state": {}
            }
            
            for contrib in contributions:
                # Update totals
                summary["total_amount"] += contrib.amount
                
                # Update by status
                status_key = contrib.status.value
                summary["by_status"][status_key]["count"] += 1
                summary["by_status"][status_key]["amount"] += contrib.amount
                
                # Update by state
                state = contrib.state_code
                if state not in summary["by_state"]:
                    summary["by_state"][state] = {"count": 0, "amount": Decimal('0')}
                summary["by_state"][state]["count"] += 1
                summary["by_state"][state]["amount"] += contrib.amount
            
            # Convert Decimal to float for JSON serialization
            def convert_decimals(obj):
                if isinstance(obj, dict):
                    return {k: convert_decimals(v) for k, v in obj.items()}
                elif isinstance(obj, Decimal):
                    return float(obj)
                return obj
            
            summary = convert_decimals(summary)
            
            logger.debug(f"Generated summary for fiscal year {fiscal_year}")
            return summary
            
        except Exception as e:
            logger.error(f"Failed to generate summary for fiscal year {fiscal_year}: {e}")
            raise
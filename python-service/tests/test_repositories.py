"""
Tests for repository classes.
"""

import pytest
import asyncio
from datetime import datetime
from decimal import Decimal
from unittest.mock import Mock, AsyncMock, patch

from app.models.entities import (
    FunderModel, ContributionModel, StateTargetModel, 
    ProspectModel, StateModel, SchoolModel,
    ContactInfo, ContributionStatus
)
from app.repositories import (
    FunderRepository, ContributionRepository, StateTargetRepository,
    ProspectRepository, StateRepository, SchoolRepository
)


class TestFunderRepository:
    """Test cases for FunderRepository."""
    
    @pytest.fixture
    def mock_sheets_client(self):
        """Mock sheets client."""
        client = Mock()
        client.read_range = AsyncMock()
        client.write_range = AsyncMock()
        client.append_rows = AsyncMock()
        client.clear_range = AsyncMock()
        client.health_check = AsyncMock(return_value=True)
        return client
    
    @pytest.fixture
    def funder_repository(self, mock_sheets_client):
        """Create FunderRepository with mocked client."""
        return FunderRepository(
            spreadsheet_id="test-sheet-id",
            sheets_client=mock_sheets_client,
            cache_ttl=1  # Short TTL for testing
        )
    
    @pytest.fixture
    def sample_funder(self):
        """Sample funder for testing."""
        return FunderModel(
            id="funder_123",
            name="Test Foundation",
            contact_info=ContactInfo(
                email="test@foundation.org",
                phone="+1-555-0123"
            ),
            status="active",
            tags=["foundation", "education"]
        )
    
    @pytest.mark.asyncio
    async def test_create_funder(self, funder_repository, mock_sheets_client, sample_funder):
        """Test creating a funder."""
        mock_sheets_client.append_rows.return_value = {"updates": {"updatedRows": 1}}
        
        result = await funder_repository.create(sample_funder)
        
        assert result == sample_funder
        mock_sheets_client.append_rows.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_all_funders(self, funder_repository, mock_sheets_client, sample_funder):
        """Test getting all funders."""
        # Mock sheet data
        mock_data = [
            ["id", "name", "contact_email", "contact_phone", "contact_address", "contact_website", 
             "contribution_history", "preferences", "tags", "status", "created_at", "updated_at"],
            ["funder_123", "Test Foundation", "test@foundation.org", "+1-555-0123", "", "",
             "[]", "{}", '["foundation", "education"]', "active", 
             "2024-01-01T00:00:00", "2024-01-01T00:00:00"]
        ]
        mock_sheets_client.read_range.return_value = mock_data
        
        result = await funder_repository.get_all()
        
        assert len(result) == 1
        assert result[0].name == "Test Foundation"
        assert result[0].contact_info.email == "test@foundation.org"
        assert "foundation" in result[0].tags
    
    @pytest.mark.asyncio
    async def test_find_by_name(self, funder_repository, mock_sheets_client):
        """Test finding funders by name."""
        # Mock sheet data with multiple funders
        mock_data = [
            ["id", "name", "contact_email", "contact_phone", "contact_address", "contact_website", 
             "contribution_history", "preferences", "tags", "status", "created_at", "updated_at"],
            ["funder_1", "Test Foundation", "test1@foundation.org", "", "", "",
             "[]", "{}", "[]", "active", "2024-01-01T00:00:00", "2024-01-01T00:00:00"],
            ["funder_2", "Another Foundation", "test2@foundation.org", "", "", "",
             "[]", "{}", "[]", "active", "2024-01-01T00:00:00", "2024-01-01T00:00:00"],
            ["funder_3", "Test Corp", "test3@corp.com", "", "", "",
             "[]", "{}", "[]", "active", "2024-01-01T00:00:00", "2024-01-01T00:00:00"]
        ]
        mock_sheets_client.read_range.return_value = mock_data
        
        result = await funder_repository.find_by_name("Test")
        
        assert len(result) == 2  # "Test Foundation" and "Test Corp"
        names = [funder.name for funder in result]
        assert "Test Foundation" in names
        assert "Test Corp" in names
    
    @pytest.mark.asyncio
    async def test_add_contribution_to_funder(self, funder_repository, mock_sheets_client):
        """Test adding contribution to funder."""
        # Mock existing funder data
        mock_data = [
            ["id", "name", "contact_email", "contact_phone", "contact_address", "contact_website", 
             "contribution_history", "preferences", "tags", "status", "created_at", "updated_at"],
            ["funder_123", "Test Foundation", "test@foundation.org", "", "", "",
             '["contrib_1"]', "{}", "[]", "active", "2024-01-01T00:00:00", "2024-01-01T00:00:00"]
        ]
        mock_sheets_client.read_range.return_value = mock_data
        mock_sheets_client.write_range.return_value = {"updatedCells": 1}
        
        result = await funder_repository.add_contribution_to_funder("funder_123", "contrib_2")
        
        assert result is not None
        assert "contrib_2" in result.contribution_history
        mock_sheets_client.write_range.assert_called_once()


class TestContributionRepository:
    """Test cases for ContributionRepository."""
    
    @pytest.fixture
    def mock_sheets_client(self):
        """Mock sheets client."""
        client = Mock()
        client.read_range = AsyncMock()
        client.write_range = AsyncMock()
        client.append_rows = AsyncMock()
        client.clear_range = AsyncMock()
        client.health_check = AsyncMock(return_value=True)
        return client
    
    @pytest.fixture
    def contribution_repository(self, mock_sheets_client):
        """Create ContributionRepository with mocked client."""
        return ContributionRepository(
            spreadsheet_id="test-sheet-id",
            sheets_client=mock_sheets_client,
            cache_ttl=1
        )
    
    @pytest.fixture
    def sample_contribution(self):
        """Sample contribution for testing."""
        return ContributionModel(
            id="contrib_123",
            funder_id="funder_456",
            state_code="CA",
            fiscal_year="2024-25",
            amount=Decimal("50000.00"),
            status=ContributionStatus.CONFIRMED
        )
    
    @pytest.mark.asyncio
    async def test_create_contribution(self, contribution_repository, mock_sheets_client, sample_contribution):
        """Test creating a contribution."""
        mock_sheets_client.append_rows.return_value = {"updates": {"updatedRows": 1}}
        
        result = await contribution_repository.create(sample_contribution)
        
        assert result == sample_contribution
        mock_sheets_client.append_rows.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_find_by_state_and_year(self, contribution_repository, mock_sheets_client):
        """Test finding contributions by state and fiscal year."""
        # Mock sheet data
        mock_data = [
            ["id", "funder_id", "state_code", "fiscal_year", "amount", "date", "status", 
             "description", "metadata", "created_at", "updated_at"],
            ["contrib_1", "funder_1", "CA", "2024-25", "50000", "", "confirmed", 
             "", "{}", "2024-01-01T00:00:00", "2024-01-01T00:00:00"],
            ["contrib_2", "funder_2", "NY", "2024-25", "30000", "", "confirmed", 
             "", "{}", "2024-01-01T00:00:00", "2024-01-01T00:00:00"],
            ["contrib_3", "funder_1", "CA", "2023-24", "40000", "", "confirmed", 
             "", "{}", "2024-01-01T00:00:00", "2024-01-01T00:00:00"]
        ]
        mock_sheets_client.read_range.return_value = mock_data
        
        result = await contribution_repository.find_by_state_and_year("CA", "2024-25")
        
        assert len(result) == 1
        assert result[0].state_code == "CA"
        assert result[0].fiscal_year == "2024-25"
        assert result[0].amount == Decimal("50000")
    
    @pytest.mark.asyncio
    async def test_get_total_by_state(self, contribution_repository, mock_sheets_client):
        """Test getting total contributions by state."""
        # Mock sheet data
        mock_data = [
            ["id", "funder_id", "state_code", "fiscal_year", "amount", "date", "status", 
             "description", "metadata", "created_at", "updated_at"],
            ["contrib_1", "funder_1", "CA", "2024-25", "50000", "", "confirmed", 
             "", "{}", "2024-01-01T00:00:00", "2024-01-01T00:00:00"],
            ["contrib_2", "funder_2", "CA", "2024-25", "30000", "", "received", 
             "", "{}", "2024-01-01T00:00:00", "2024-01-01T00:00:00"],
            ["contrib_3", "funder_3", "CA", "2024-25", "20000", "", "pending", 
             "", "{}", "2024-01-01T00:00:00", "2024-01-01T00:00:00"]  # Should not be counted
        ]
        mock_sheets_client.read_range.return_value = mock_data
        
        total = await contribution_repository.get_total_by_state("CA")
        
        assert total == Decimal("80000")  # Only confirmed and received


class TestStateTargetRepository:
    """Test cases for StateTargetRepository."""
    
    @pytest.fixture
    def mock_sheets_client(self):
        """Mock sheets client."""
        client = Mock()
        client.read_range = AsyncMock()
        client.write_range = AsyncMock()
        client.append_rows = AsyncMock()
        client.clear_range = AsyncMock()
        client.health_check = AsyncMock(return_value=True)
        return client
    
    @pytest.fixture
    def state_target_repository(self, mock_sheets_client):
        """Create StateTargetRepository with mocked client."""
        return StateTargetRepository(
            spreadsheet_id="test-sheet-id",
            sheets_client=mock_sheets_client,
            cache_ttl=1
        )
    
    @pytest.fixture
    def sample_target(self):
        """Sample state target for testing."""
        return StateTargetModel(
            id="target_123",
            state_code="CA",
            fiscal_year="2024-25",
            target_amount=Decimal("1000000.00"),
            priority=1
        )
    
    @pytest.mark.asyncio
    async def test_find_by_state_and_year(self, state_target_repository, mock_sheets_client):
        """Test finding target by state and fiscal year."""
        # Mock sheet data
        mock_data = [
            ["id", "state_code", "fiscal_year", "target_amount", "description", "priority", 
             "metadata", "created_at", "updated_at"],
            ["target_1", "CA", "2024-25", "1000000", "California target", "1", 
             "{}", "2024-01-01T00:00:00", "2024-01-01T00:00:00"],
            ["target_2", "NY", "2024-25", "800000", "New York target", "2", 
             "{}", "2024-01-01T00:00:00", "2024-01-01T00:00:00"]
        ]
        mock_sheets_client.read_range.return_value = mock_data
        
        result = await state_target_repository.find_by_state_and_year("CA", "2024-25")
        
        assert result is not None
        assert result.state_code == "CA"
        assert result.fiscal_year == "2024-25"
        assert result.target_amount == Decimal("1000000")
    
    @pytest.mark.asyncio
    async def test_get_high_priority_targets(self, state_target_repository, mock_sheets_client):
        """Test getting high priority targets."""
        # Mock sheet data
        mock_data = [
            ["id", "state_code", "fiscal_year", "target_amount", "description", "priority", 
             "metadata", "created_at", "updated_at"],
            ["target_1", "CA", "2024-25", "1000000", "California target", "1", 
             "{}", "2024-01-01T00:00:00", "2024-01-01T00:00:00"],
            ["target_2", "NY", "2024-25", "800000", "New York target", "2", 
             "{}", "2024-01-01T00:00:00", "2024-01-01T00:00:00"],
            ["target_3", "TX", "2024-25", "600000", "Texas target", "3", 
             "{}", "2024-01-01T00:00:00", "2024-01-01T00:00:00"]
        ]
        mock_sheets_client.read_range.return_value = mock_data
        
        result = await state_target_repository.get_high_priority_targets("2024-25")
        
        assert len(result) == 2  # Priority 1 and 2
        assert result[0].priority == 1  # Should be sorted by priority
        assert result[1].priority == 2


class TestBaseRepositoryFunctionality:
    """Test base repository functionality."""
    
    @pytest.fixture
    def mock_sheets_client(self):
        """Mock sheets client."""
        client = Mock()
        client.read_range = AsyncMock()
        client.write_range = AsyncMock()
        client.append_rows = AsyncMock()
        client.clear_range = AsyncMock()
        client.health_check = AsyncMock(return_value=True)
        client.get_spreadsheet_metadata = AsyncMock(return_value={})
        return client
    
    @pytest.fixture
    def funder_repository(self, mock_sheets_client):
        """Create FunderRepository for testing base functionality."""
        return FunderRepository(
            spreadsheet_id="test-sheet-id",
            sheets_client=mock_sheets_client,
            cache_ttl=1
        )
    
    @pytest.mark.asyncio
    async def test_caching_functionality(self, funder_repository, mock_sheets_client):
        """Test that caching works correctly."""
        # Mock sheet data
        mock_data = [
            ["id", "name", "contact_email", "contact_phone", "contact_address", "contact_website", 
             "contribution_history", "preferences", "tags", "status", "created_at", "updated_at"],
            ["funder_123", "Test Foundation", "test@foundation.org", "", "", "",
             "[]", "{}", "[]", "active", "2024-01-01T00:00:00", "2024-01-01T00:00:00"]
        ]
        mock_sheets_client.read_range.return_value = mock_data
        
        # First call should hit the sheet
        result1 = await funder_repository.get_all()
        assert len(result1) == 1
        assert mock_sheets_client.read_range.call_count == 1
        
        # Second call should use cache
        result2 = await funder_repository.get_all()
        assert len(result2) == 1
        assert mock_sheets_client.read_range.call_count == 1  # No additional call
        
        # Results should be the same
        assert result1[0].id == result2[0].id
    
    @pytest.mark.asyncio
    async def test_cache_invalidation(self, funder_repository, mock_sheets_client):
        """Test that cache is invalidated on updates."""
        # Mock sheet data
        mock_data = [
            ["id", "name", "contact_email", "contact_phone", "contact_address", "contact_website", 
             "contribution_history", "preferences", "tags", "status", "created_at", "updated_at"],
            ["funder_123", "Test Foundation", "test@foundation.org", "", "", "",
             "[]", "{}", "[]", "active", "2024-01-01T00:00:00", "2024-01-01T00:00:00"]
        ]
        mock_sheets_client.read_range.return_value = mock_data
        mock_sheets_client.write_range.return_value = {"updatedCells": 1}
        
        # Load data into cache
        await funder_repository.get_all()
        assert mock_sheets_client.read_range.call_count == 1
        
        # Update should invalidate cache
        await funder_repository.update("funder_123", {"name": "Updated Foundation"})
        
        # Next get_all should hit the sheet again
        await funder_repository.get_all()
        assert mock_sheets_client.read_range.call_count == 2
    
    @pytest.mark.asyncio
    async def test_health_check(self, funder_repository, mock_sheets_client):
        """Test repository health check."""
        result = await funder_repository.health_check()
        
        assert result is True
        mock_sheets_client.health_check.assert_called_once()
        mock_sheets_client.get_spreadsheet_metadata.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_batch_create(self, funder_repository, mock_sheets_client):
        """Test batch creation of entities."""
        mock_sheets_client.append_rows.return_value = {"updates": {"updatedRows": 2}}
        
        funders = [
            FunderModel(id="funder_1", name="Foundation 1"),
            FunderModel(id="funder_2", name="Foundation 2")
        ]
        
        result = await funder_repository.batch_create(funders)
        
        assert len(result) == 2
        mock_sheets_client.append_rows.assert_called_once()
        
        # Check that the call was made with 2 rows
        call_args = mock_sheets_client.append_rows.call_args
        assert len(call_args[1]['values']) == 2


if __name__ == "__main__":
    pytest.main([__file__])
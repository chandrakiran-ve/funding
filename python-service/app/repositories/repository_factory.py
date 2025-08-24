"""
Repository factory for managing all data access repositories.
"""

import logging
from typing import Optional

from app.services.sheets_client import SheetsClient, get_sheets_client
from app.core.config import get_settings
from app.repositories.funder_repository import FunderRepository
from app.repositories.contribution_repository import ContributionRepository
from app.repositories.state_target_repository import StateTargetRepository
from app.repositories.prospect_repository import ProspectRepository
from app.repositories.state_repository import StateRepository
from app.repositories.school_repository import SchoolRepository

logger = logging.getLogger(__name__)
settings = get_settings()


class RepositoryFactory:
    """
    Factory class for creating and managing repository instances.
    
    Provides centralized access to all repositories with shared configuration
    and connection pooling.
    """
    
    def __init__(
        self,
        spreadsheet_id: Optional[str] = None,
        sheets_client: Optional[SheetsClient] = None,
        cache_ttl: int = 300
    ):
        """
        Initialize the repository factory.
        
        Args:
            spreadsheet_id: Google Sheets spreadsheet ID
            sheets_client: Optional sheets client instance
            cache_ttl: Cache time-to-live in seconds
        """
        self.spreadsheet_id = spreadsheet_id or settings.GOOGLE_SHEETS_SPREADSHEET_ID
        self.sheets_client = sheets_client or get_sheets_client()
        self.cache_ttl = cache_ttl
        
        # Repository instances (lazy-loaded)
        self._funder_repo: Optional[FunderRepository] = None
        self._contribution_repo: Optional[ContributionRepository] = None
        self._state_target_repo: Optional[StateTargetRepository] = None
        self._prospect_repo: Optional[ProspectRepository] = None
        self._state_repo: Optional[StateRepository] = None
        self._school_repo: Optional[SchoolRepository] = None
        
        logger.info("Repository factory initialized")
    
    @property
    def funder_repository(self) -> FunderRepository:
        """Get or create FunderRepository instance."""
        if self._funder_repo is None:
            self._funder_repo = FunderRepository(
                spreadsheet_id=self.spreadsheet_id,
                sheets_client=self.sheets_client,
                cache_ttl=self.cache_ttl
            )
            logger.debug("Created FunderRepository instance")
        return self._funder_repo
    
    @property
    def contribution_repository(self) -> ContributionRepository:
        """Get or create ContributionRepository instance."""
        if self._contribution_repo is None:
            self._contribution_repo = ContributionRepository(
                spreadsheet_id=self.spreadsheet_id,
                sheets_client=self.sheets_client,
                cache_ttl=self.cache_ttl
            )
            logger.debug("Created ContributionRepository instance")
        return self._contribution_repo
    
    @property
    def state_target_repository(self) -> StateTargetRepository:
        """Get or create StateTargetRepository instance."""
        if self._state_target_repo is None:
            self._state_target_repo = StateTargetRepository(
                spreadsheet_id=self.spreadsheet_id,
                sheets_client=self.sheets_client,
                cache_ttl=self.cache_ttl
            )
            logger.debug("Created StateTargetRepository instance")
        return self._state_target_repo
    
    @property
    def prospect_repository(self) -> ProspectRepository:
        """Get or create ProspectRepository instance."""
        if self._prospect_repo is None:
            self._prospect_repo = ProspectRepository(
                spreadsheet_id=self.spreadsheet_id,
                sheets_client=self.sheets_client,
                cache_ttl=self.cache_ttl
            )
            logger.debug("Created ProspectRepository instance")
        return self._prospect_repo
    
    @property
    def state_repository(self) -> StateRepository:
        """Get or create StateRepository instance."""
        if self._state_repo is None:
            self._state_repo = StateRepository(
                spreadsheet_id=self.spreadsheet_id,
                sheets_client=self.sheets_client,
                cache_ttl=self.cache_ttl
            )
            logger.debug("Created StateRepository instance")
        return self._state_repo
    
    @property
    def school_repository(self) -> SchoolRepository:
        """Get or create SchoolRepository instance."""
        if self._school_repo is None:
            self._school_repo = SchoolRepository(
                spreadsheet_id=self.spreadsheet_id,
                sheets_client=self.sheets_client,
                cache_ttl=self.cache_ttl
            )
            logger.debug("Created SchoolRepository instance")
        return self._school_repo
    
    async def clear_all_caches(self) -> None:
        """Clear caches for all repository instances."""
        repositories = [
            self._funder_repo,
            self._contribution_repo,
            self._state_target_repo,
            self._prospect_repo,
            self._state_repo,
            self._school_repo
        ]
        
        for repo in repositories:
            if repo is not None:
                await repo.clear_cache()
        
        logger.info("Cleared all repository caches")
    
    async def health_check_all(self) -> dict:
        """
        Perform health check on all repositories.
        
        Returns:
            Dictionary with health status for each repository
        """
        health_status = {}
        
        repositories = {
            "funder": self.funder_repository,
            "contribution": self.contribution_repository,
            "state_target": self.state_target_repository,
            "prospect": self.prospect_repository,
            "state": self.state_repository,
            "school": self.school_repository
        }
        
        for name, repo in repositories.items():
            try:
                is_healthy = await repo.health_check()
                health_status[name] = {
                    "status": "healthy" if is_healthy else "unhealthy",
                    "error": None
                }
            except Exception as e:
                health_status[name] = {
                    "status": "error",
                    "error": str(e)
                }
                logger.error(f"Health check failed for {name} repository: {e}")
        
        overall_healthy = all(
            status["status"] == "healthy" 
            for status in health_status.values()
        )
        
        health_status["overall"] = {
            "status": "healthy" if overall_healthy else "unhealthy",
            "timestamp": logger.handlers[0].formatter.formatTime(
                logging.LogRecord("", 0, "", 0, "", (), None)
            ) if logger.handlers else None
        }
        
        logger.info(f"Repository health check completed: {'healthy' if overall_healthy else 'unhealthy'}")
        return health_status
    
    async def initialize_sheets(self) -> bool:
        """
        Initialize Google Sheets with proper headers if needed.
        
        Returns:
            True if successful, False otherwise
        """
        try:
            # Check if spreadsheet exists and is accessible
            if not self.spreadsheet_id:
                logger.error("No spreadsheet ID configured")
                return False
            
            metadata = await self.sheets_client.get_spreadsheet_metadata(self.spreadsheet_id)
            logger.info(f"Connected to spreadsheet: {metadata.get('properties', {}).get('title', 'Unknown')}")
            
            # TODO: Add logic to create sheets and headers if they don't exist
            # This would require checking existing sheets and creating missing ones
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize sheets: {e}")
            return False
    
    def get_repository_by_name(self, name: str):
        """
        Get repository by name.
        
        Args:
            name: Repository name (funder, contribution, state_target, prospect, state, school)
            
        Returns:
            Repository instance or None if not found
        """
        repository_map = {
            "funder": self.funder_repository,
            "contribution": self.contribution_repository,
            "state_target": self.state_target_repository,
            "prospect": self.prospect_repository,
            "state": self.state_repository,
            "school": self.school_repository
        }
        
        return repository_map.get(name.lower())
    
    def get_all_repositories(self) -> dict:
        """
        Get all repository instances.
        
        Returns:
            Dictionary mapping repository names to instances
        """
        return {
            "funder": self.funder_repository,
            "contribution": self.contribution_repository,
            "state_target": self.state_target_repository,
            "prospect": self.prospect_repository,
            "state": self.state_repository,
            "school": self.school_repository
        }


# Global repository factory instance
_repository_factory: Optional[RepositoryFactory] = None


def get_repository_factory() -> RepositoryFactory:
    """Get the global repository factory instance."""
    global _repository_factory
    if _repository_factory is None:
        _repository_factory = RepositoryFactory()
    return _repository_factory


async def initialize_repository_factory(
    spreadsheet_id: Optional[str] = None,
    sheets_client: Optional[SheetsClient] = None,
    cache_ttl: int = 300
) -> RepositoryFactory:
    """
    Initialize the global repository factory.
    
    Args:
        spreadsheet_id: Google Sheets spreadsheet ID
        sheets_client: Optional sheets client instance
        cache_ttl: Cache time-to-live in seconds
        
    Returns:
        Initialized RepositoryFactory instance
    """
    global _repository_factory
    _repository_factory = RepositoryFactory(
        spreadsheet_id=spreadsheet_id,
        sheets_client=sheets_client,
        cache_ttl=cache_ttl
    )
    
    # Initialize sheets if needed
    await _repository_factory.initialize_sheets()
    
    return _repository_factory
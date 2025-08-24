"""
Base repository class with common CRUD operations and caching.
"""

import asyncio
import json
import logging
from abc import ABC, abstractmethod
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Type, TypeVar, Generic
from pydantic import BaseModel

from app.services.sheets_client import SheetsClient, get_sheets_client
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

T = TypeVar('T', bound=BaseModel)


class CacheEntry:
    """Cache entry with expiration."""
    
    def __init__(self, data: Any, ttl_seconds: int = 300):
        self.data = data
        self.expires_at = datetime.utcnow() + timedelta(seconds=ttl_seconds)
    
    def is_expired(self) -> bool:
        return datetime.utcnow() > self.expires_at


class BaseRepository(Generic[T], ABC):
    """
    Base repository class providing common CRUD operations with caching.
    
    Features:
    - Generic CRUD operations
    - In-memory caching with TTL
    - Data validation using Pydantic models
    - Error handling and logging
    - Batch operations support
    """
    
    def __init__(
        self,
        model_class: Type[T],
        sheet_name: str,
        spreadsheet_id: Optional[str] = None,
        cache_ttl: int = 300,
        sheets_client: Optional[SheetsClient] = None
    ):
        """
        Initialize repository.
        
        Args:
            model_class: Pydantic model class for validation
            sheet_name: Name of the Google Sheet tab
            spreadsheet_id: Google Sheets spreadsheet ID
            cache_ttl: Cache time-to-live in seconds
            sheets_client: Optional sheets client instance
        """
        self.model_class = model_class
        self.sheet_name = sheet_name
        self.spreadsheet_id = spreadsheet_id or settings.GOOGLE_SHEETS_SPREADSHEET_ID
        self.cache_ttl = cache_ttl
        self.sheets_client = sheets_client or get_sheets_client()
        
        # In-memory cache
        self._cache: Dict[str, CacheEntry] = {}
        self._list_cache: Optional[CacheEntry] = None
        self._cache_lock = asyncio.Lock()
        
        if not self.spreadsheet_id:
            logger.warning(f"No spreadsheet ID configured for {self.__class__.__name__}")
    
    @abstractmethod
    def _model_to_row(self, model: T) -> List[Any]:
        """Convert model instance to spreadsheet row."""
        pass
    
    @abstractmethod
    def _row_to_model(self, row: List[Any]) -> T:
        """Convert spreadsheet row to model instance."""
        pass
    
    @abstractmethod
    def _get_headers(self) -> List[str]:
        """Get column headers for the spreadsheet."""
        pass
    
    def _get_range(self, start_row: int = 1, end_row: Optional[int] = None) -> str:
        """Get A1 notation range for the sheet."""
        if end_row:
            return f"{self.sheet_name}!A{start_row}:Z{end_row}"
        return f"{self.sheet_name}!A{start_row}:Z"
    
    async def _get_cache_key(self, entity_id: str) -> str:
        """Generate cache key for entity."""
        return f"{self.sheet_name}:{entity_id}"
    
    async def _get_from_cache(self, cache_key: str) -> Optional[T]:
        """Get entity from cache if not expired."""
        async with self._cache_lock:
            entry = self._cache.get(cache_key)
            if entry and not entry.is_expired():
                logger.debug(f"Cache hit for {cache_key}")
                return entry.data
            elif entry:
                # Remove expired entry
                del self._cache[cache_key]
                logger.debug(f"Cache expired for {cache_key}")
        return None
    
    async def _set_cache(self, cache_key: str, data: T) -> None:
        """Set entity in cache."""
        async with self._cache_lock:
            self._cache[cache_key] = CacheEntry(data, self.cache_ttl)
            logger.debug(f"Cached {cache_key}")
    
    async def _invalidate_cache(self, entity_id: Optional[str] = None) -> None:
        """Invalidate cache entries."""
        async with self._cache_lock:
            if entity_id:
                cache_key = await self._get_cache_key(entity_id)
                self._cache.pop(cache_key, None)
                logger.debug(f"Invalidated cache for {cache_key}")
            else:
                self._cache.clear()
                logger.debug(f"Cleared all cache for {self.sheet_name}")
            
            # Always invalidate list cache
            self._list_cache = None
    
    async def _get_list_from_cache(self) -> Optional[List[T]]:
        """Get list of entities from cache."""
        if self._list_cache and not self._list_cache.is_expired():
            logger.debug(f"List cache hit for {self.sheet_name}")
            return self._list_cache.data
        elif self._list_cache:
            self._list_cache = None
            logger.debug(f"List cache expired for {self.sheet_name}")
        return None
    
    async def _set_list_cache(self, data: List[T]) -> None:
        """Set list of entities in cache."""
        self._list_cache = CacheEntry(data, self.cache_ttl)
        logger.debug(f"Cached list for {self.sheet_name}")
    
    async def create(self, entity: T) -> T:
        """
        Create a new entity.
        
        Args:
            entity: Entity to create
            
        Returns:
            Created entity with any server-generated fields
            
        Raises:
            ValueError: If validation fails
            Exception: If creation fails
        """
        try:
            # Validate entity
            if not isinstance(entity, self.model_class):
                entity = self.model_class(**entity.model_dump() if hasattr(entity, 'model_dump') else entity)
            
            # Convert to row format
            row_data = self._model_to_row(entity)
            
            # Append to sheet
            result = await self.sheets_client.append_rows(
                spreadsheet_id=self.spreadsheet_id,
                range_name=self._get_range(),
                values=[row_data]
            )
            
            # Invalidate caches
            await self._invalidate_cache()
            
            logger.info(f"Created {self.model_class.__name__} with ID: {getattr(entity, 'id', 'unknown')}")
            return entity
            
        except Exception as e:
            logger.error(f"Failed to create {self.model_class.__name__}: {e}")
            raise
    
    async def get_by_id(self, entity_id: str) -> Optional[T]:
        """
        Get entity by ID.
        
        Args:
            entity_id: Entity ID to search for
            
        Returns:
            Entity if found, None otherwise
        """
        try:
            # Check cache first
            cache_key = await self._get_cache_key(entity_id)
            cached_entity = await self._get_from_cache(cache_key)
            if cached_entity:
                return cached_entity
            
            # Search in sheet
            entities = await self.get_all()
            for entity in entities:
                if getattr(entity, 'id', None) == entity_id:
                    # Cache the found entity
                    await self._set_cache(cache_key, entity)
                    return entity
            
            logger.debug(f"{self.model_class.__name__} not found with ID: {entity_id}")
            return None
            
        except Exception as e:
            logger.error(f"Failed to get {self.model_class.__name__} by ID {entity_id}: {e}")
            raise
    
    async def get_all(self) -> List[T]:
        """
        Get all entities.
        
        Returns:
            List of all entities
        """
        try:
            # Check cache first
            cached_list = await self._get_list_from_cache()
            if cached_list is not None:
                return cached_list
            
            # Read from sheet
            values = await self.sheets_client.read_range(
                spreadsheet_id=self.spreadsheet_id,
                range_name=self._get_range()
            )
            
            entities = []
            headers = self._get_headers()
            
            # Skip header row if present
            data_rows = values[1:] if values and len(values) > 0 else []
            
            for row in data_rows:
                try:
                    # Pad row to match headers length
                    padded_row = row + [''] * (len(headers) - len(row))
                    entity = self._row_to_model(padded_row)
                    entities.append(entity)
                except Exception as e:
                    logger.warning(f"Failed to parse row {row}: {e}")
                    continue
            
            # Cache the result
            await self._set_list_cache(entities)
            
            logger.debug(f"Retrieved {len(entities)} {self.model_class.__name__} entities")
            return entities
            
        except Exception as e:
            logger.error(f"Failed to get all {self.model_class.__name__} entities: {e}")
            raise
    
    async def update(self, entity_id: str, updates: Dict[str, Any]) -> Optional[T]:
        """
        Update entity by ID.
        
        Args:
            entity_id: Entity ID to update
            updates: Dictionary of fields to update
            
        Returns:
            Updated entity if found, None otherwise
        """
        try:
            # Get current entity
            current_entity = await self.get_by_id(entity_id)
            if not current_entity:
                return None
            
            # Apply updates
            entity_dict = current_entity.model_dump()
            entity_dict.update(updates)
            entity_dict['updated_at'] = datetime.utcnow()
            
            # Validate updated entity
            updated_entity = self.model_class(**entity_dict)
            
            # Find and update row in sheet
            entities = await self.get_all()
            for i, entity in enumerate(entities):
                if getattr(entity, 'id', None) == entity_id:
                    # Update the row (skip header row)
                    row_number = i + 2
                    row_data = self._model_to_row(updated_entity)
                    
                    await self.sheets_client.write_range(
                        spreadsheet_id=self.spreadsheet_id,
                        range_name=f"{self.sheet_name}!A{row_number}:Z{row_number}",
                        values=[row_data]
                    )
                    
                    # Invalidate caches
                    await self._invalidate_cache(entity_id)
                    
                    logger.info(f"Updated {self.model_class.__name__} with ID: {entity_id}")
                    return updated_entity
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to update {self.model_class.__name__} {entity_id}: {e}")
            raise
    
    async def delete(self, entity_id: str) -> bool:
        """
        Delete entity by ID.
        
        Args:
            entity_id: Entity ID to delete
            
        Returns:
            True if deleted, False if not found
        """
        try:
            # Find entity row
            entities = await self.get_all()
            for i, entity in enumerate(entities):
                if getattr(entity, 'id', None) == entity_id:
                    # Clear the row (skip header row)
                    row_number = i + 2
                    
                    await self.sheets_client.clear_range(
                        spreadsheet_id=self.spreadsheet_id,
                        range_name=f"{self.sheet_name}!A{row_number}:Z{row_number}"
                    )
                    
                    # Invalidate caches
                    await self._invalidate_cache(entity_id)
                    
                    logger.info(f"Deleted {self.model_class.__name__} with ID: {entity_id}")
                    return True
            
            logger.debug(f"{self.model_class.__name__} not found for deletion: {entity_id}")
            return False
            
        except Exception as e:
            logger.error(f"Failed to delete {self.model_class.__name__} {entity_id}: {e}")
            raise
    
    async def find_by_field(self, field_name: str, field_value: Any) -> List[T]:
        """
        Find entities by field value.
        
        Args:
            field_name: Name of the field to search
            field_value: Value to search for
            
        Returns:
            List of matching entities
        """
        try:
            entities = await self.get_all()
            matches = []
            
            for entity in entities:
                if hasattr(entity, field_name):
                    entity_value = getattr(entity, field_name)
                    if entity_value == field_value:
                        matches.append(entity)
            
            logger.debug(f"Found {len(matches)} {self.model_class.__name__} entities with {field_name}={field_value}")
            return matches
            
        except Exception as e:
            logger.error(f"Failed to find {self.model_class.__name__} by {field_name}: {e}")
            raise
    
    async def batch_create(self, entities: List[T]) -> List[T]:
        """
        Create multiple entities in batch.
        
        Args:
            entities: List of entities to create
            
        Returns:
            List of created entities
        """
        try:
            if not entities:
                return []
            
            # Validate all entities
            validated_entities = []
            for entity in entities:
                if not isinstance(entity, self.model_class):
                    entity = self.model_class(**entity.model_dump() if hasattr(entity, 'model_dump') else entity)
                validated_entities.append(entity)
            
            # Convert to rows
            rows = [self._model_to_row(entity) for entity in validated_entities]
            
            # Batch append
            await self.sheets_client.append_rows(
                spreadsheet_id=self.spreadsheet_id,
                range_name=self._get_range(),
                values=rows
            )
            
            # Invalidate caches
            await self._invalidate_cache()
            
            logger.info(f"Batch created {len(validated_entities)} {self.model_class.__name__} entities")
            return validated_entities
            
        except Exception as e:
            logger.error(f"Failed to batch create {self.model_class.__name__} entities: {e}")
            raise
    
    async def count(self) -> int:
        """
        Get count of entities.
        
        Returns:
            Number of entities
        """
        try:
            entities = await self.get_all()
            return len(entities)
        except Exception as e:
            logger.error(f"Failed to count {self.model_class.__name__} entities: {e}")
            raise
    
    async def exists(self, entity_id: str) -> bool:
        """
        Check if entity exists.
        
        Args:
            entity_id: Entity ID to check
            
        Returns:
            True if exists, False otherwise
        """
        try:
            entity = await self.get_by_id(entity_id)
            return entity is not None
        except Exception as e:
            logger.error(f"Failed to check existence of {self.model_class.__name__} {entity_id}: {e}")
            raise
    
    async def clear_cache(self) -> None:
        """Clear all cache entries for this repository."""
        await self._invalidate_cache()
        logger.info(f"Cleared cache for {self.model_class.__name__} repository")
    
    async def health_check(self) -> bool:
        """
        Perform health check for the repository.
        
        Returns:
            True if healthy, False otherwise
        """
        try:
            # Test basic connectivity
            await self.sheets_client.health_check()
            
            # Test sheet access
            if self.spreadsheet_id:
                await self.sheets_client.get_spreadsheet_metadata(self.spreadsheet_id)
            
            return True
        except Exception as e:
            logger.error(f"Health check failed for {self.model_class.__name__} repository: {e}")
            return False
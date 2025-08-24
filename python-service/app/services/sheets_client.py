"""
Google Sheets API client with secure authentication and connection pooling.
"""

import asyncio
import json
import logging
from typing import Any, Dict, List, Optional, Union
from datetime import datetime, timedelta
import time
import random

from google.auth.transport.requests import Request
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import httpx
from pydantic import BaseModel

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class SheetsError(Exception):
    """Base exception for Google Sheets operations."""
    pass


class SheetsAuthError(SheetsError):
    """Authentication-related errors."""
    pass


class SheetsRateLimitError(SheetsError):
    """Rate limit exceeded errors."""
    pass


class SheetsConnectionError(SheetsError):
    """Connection-related errors."""
    pass


class RetryConfig(BaseModel):
    """Configuration for retry logic."""
    max_retries: int = 3
    base_delay: float = 1.0
    max_delay: float = 60.0
    exponential_base: float = 2.0
    jitter: bool = True


class ConnectionPool:
    """Simple connection pool for Google Sheets API clients."""
    
    def __init__(self, max_connections: int = 10):
        self.max_connections = max_connections
        self.connections: List[Any] = []
        self.in_use: set = set()
        self._lock = asyncio.Lock()
    
    async def get_connection(self, credentials: Credentials) -> Any:
        """Get a connection from the pool or create a new one."""
        async with self._lock:
            # Try to get an available connection
            for conn in self.connections:
                if id(conn) not in self.in_use:
                    self.in_use.add(id(conn))
                    return conn
            
            # Create new connection if under limit
            if len(self.connections) < self.max_connections:
                conn = build('sheets', 'v4', credentials=credentials)
                self.connections.append(conn)
                self.in_use.add(id(conn))
                return conn
            
            # Wait for a connection to become available
            while len(self.in_use) >= self.max_connections:
                await asyncio.sleep(0.1)
            
            # Try again
            return await self.get_connection(credentials)
    
    async def release_connection(self, connection: Any):
        """Release a connection back to the pool."""
        async with self._lock:
            if id(connection) in self.in_use:
                self.in_use.remove(id(connection))


class SheetsClient:
    """
    Secure Google Sheets API client with connection pooling and retry logic.
    
    Features:
    - Service account authentication
    - Connection pooling for efficient resource usage
    - Exponential backoff retry logic
    - Comprehensive error handling
    - Rate limit management
    """
    
    def __init__(
        self,
        credentials_json: Optional[str] = None,
        scopes: Optional[List[str]] = None,
        retry_config: Optional[RetryConfig] = None,
        max_connections: int = 10
    ):
        """
        Initialize the Google Sheets client.
        
        Args:
            credentials_json: Service account credentials as JSON string
            scopes: OAuth scopes for the API
            retry_config: Configuration for retry logic
            max_connections: Maximum number of pooled connections
        """
        self.scopes = scopes or ['https://www.googleapis.com/auth/spreadsheets']
        self.retry_config = retry_config or RetryConfig()
        self.connection_pool = ConnectionPool(max_connections)
        self.credentials = None
        self._last_auth_time = None
        self._auth_lock = asyncio.Lock()
        
        # Initialize credentials
        if credentials_json:
            self._setup_credentials(credentials_json)
        elif settings.GOOGLE_SHEETS_CREDENTIALS:
            self._setup_credentials(settings.GOOGLE_SHEETS_CREDENTIALS)
        else:
            logger.warning("No Google Sheets credentials provided")
    
    def _setup_credentials(self, credentials_json: str):
        """Setup service account credentials."""
        try:
            if isinstance(credentials_json, str):
                # Handle both JSON string and file path
                if credentials_json.startswith('{'):
                    creds_info = json.loads(credentials_json)
                else:
                    with open(credentials_json, 'r') as f:
                        creds_info = json.load(f)
            else:
                creds_info = credentials_json
            
            self.credentials = Credentials.from_service_account_info(
                creds_info, scopes=self.scopes
            )
            self._last_auth_time = datetime.now()
            logger.info("Google Sheets credentials initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to setup Google Sheets credentials: {e}")
            raise SheetsAuthError(f"Invalid credentials: {e}")
    
    async def _ensure_authenticated(self):
        """Ensure credentials are valid and refresh if needed."""
        async with self._auth_lock:
            if not self.credentials:
                raise SheetsAuthError("No credentials configured")
            
            # Check if credentials need refresh
            if (self.credentials.expired or 
                (self._last_auth_time and 
                 datetime.now() - self._last_auth_time > timedelta(minutes=50))):
                
                try:
                    self.credentials.refresh(Request())
                    self._last_auth_time = datetime.now()
                    logger.info("Google Sheets credentials refreshed")
                except Exception as e:
                    logger.error(f"Failed to refresh credentials: {e}")
                    raise SheetsAuthError(f"Credential refresh failed: {e}")
    
    async def _execute_with_retry(self, operation_func, *args, **kwargs):
        """
        Execute an operation with exponential backoff retry logic.
        
        Args:
            operation_func: Function to execute
            *args, **kwargs: Arguments for the function
            
        Returns:
            Result of the operation
            
        Raises:
            SheetsError: If all retries are exhausted
        """
        last_exception = None
        
        for attempt in range(self.retry_config.max_retries + 1):
            try:
                await self._ensure_authenticated()
                return await operation_func(*args, **kwargs)
                
            except HttpError as e:
                last_exception = e
                error_code = e.resp.status
                
                # Handle specific error codes
                if error_code == 401:
                    # Authentication error - try to refresh credentials
                    self.credentials = None
                    raise SheetsAuthError(f"Authentication failed: {e}")
                elif error_code == 403:
                    # Rate limit or permission error
                    if "quota" in str(e).lower() or "rate" in str(e).lower():
                        if attempt < self.retry_config.max_retries:
                            delay = self._calculate_delay(attempt)
                            logger.warning(f"Rate limit hit, retrying in {delay}s (attempt {attempt + 1})")
                            await asyncio.sleep(delay)
                            continue
                        else:
                            raise SheetsRateLimitError(f"Rate limit exceeded: {e}")
                    else:
                        raise SheetsError(f"Permission denied: {e}")
                elif error_code >= 500:
                    # Server error - retry
                    if attempt < self.retry_config.max_retries:
                        delay = self._calculate_delay(attempt)
                        logger.warning(f"Server error, retrying in {delay}s (attempt {attempt + 1}): {e}")
                        await asyncio.sleep(delay)
                        continue
                    else:
                        raise SheetsConnectionError(f"Server error: {e}")
                else:
                    # Other HTTP errors - don't retry
                    raise SheetsError(f"HTTP error {error_code}: {e}")
                    
            except Exception as e:
                last_exception = e
                if attempt < self.retry_config.max_retries:
                    delay = self._calculate_delay(attempt)
                    logger.warning(f"Operation failed, retrying in {delay}s (attempt {attempt + 1}): {e}")
                    await asyncio.sleep(delay)
                    continue
                else:
                    raise SheetsConnectionError(f"Operation failed after {self.retry_config.max_retries} retries: {e}")
        
        # If we get here, all retries were exhausted
        raise SheetsConnectionError(f"Operation failed after {self.retry_config.max_retries} retries: {last_exception}")
    
    def _calculate_delay(self, attempt: int) -> float:
        """Calculate delay for exponential backoff with jitter."""
        delay = min(
            self.retry_config.base_delay * (self.retry_config.exponential_base ** attempt),
            self.retry_config.max_delay
        )
        
        if self.retry_config.jitter:
            # Add random jitter to prevent thundering herd
            delay *= (0.5 + random.random() * 0.5)
        
        return delay
    
    async def _get_service(self):
        """Get a Google Sheets service instance from the connection pool."""
        await self._ensure_authenticated()
        return await self.connection_pool.get_connection(self.credentials)
    
    async def _release_service(self, service):
        """Release a service instance back to the connection pool."""
        await self.connection_pool.release_connection(service)
    
    async def read_range(
        self, 
        spreadsheet_id: str, 
        range_name: str,
        value_render_option: str = 'FORMATTED_VALUE'
    ) -> List[List[str]]:
        """
        Read values from a spreadsheet range.
        
        Args:
            spreadsheet_id: The ID of the spreadsheet
            range_name: The A1 notation range to read
            value_render_option: How values should be rendered
            
        Returns:
            List of rows, where each row is a list of cell values
        """
        async def _read_operation():
            service = await self._get_service()
            try:
                result = service.spreadsheets().values().get(
                    spreadsheetId=spreadsheet_id,
                    range=range_name,
                    valueRenderOption=value_render_option
                ).execute()
                
                values = result.get('values', [])
                logger.debug(f"Read {len(values)} rows from {range_name}")
                return values
                
            finally:
                await self._release_service(service)
        
        return await self._execute_with_retry(_read_operation)
    
    async def write_range(
        self,
        spreadsheet_id: str,
        range_name: str,
        values: List[List[Any]],
        value_input_option: str = 'RAW'
    ) -> Dict[str, Any]:
        """
        Write values to a spreadsheet range.
        
        Args:
            spreadsheet_id: The ID of the spreadsheet
            range_name: The A1 notation range to write
            values: List of rows to write
            value_input_option: How input data should be interpreted
            
        Returns:
            Response from the API
        """
        async def _write_operation():
            service = await self._get_service()
            try:
                body = {
                    'values': values,
                    'majorDimension': 'ROWS'
                }
                
                result = service.spreadsheets().values().update(
                    spreadsheetId=spreadsheet_id,
                    range=range_name,
                    valueInputOption=value_input_option,
                    body=body
                ).execute()
                
                logger.debug(f"Wrote {len(values)} rows to {range_name}")
                return result
                
            finally:
                await self._release_service(service)
        
        return await self._execute_with_retry(_write_operation)
    
    async def append_rows(
        self,
        spreadsheet_id: str,
        range_name: str,
        values: List[List[Any]],
        value_input_option: str = 'RAW'
    ) -> Dict[str, Any]:
        """
        Append rows to a spreadsheet.
        
        Args:
            spreadsheet_id: The ID of the spreadsheet
            range_name: The A1 notation range to append to
            values: List of rows to append
            value_input_option: How input data should be interpreted
            
        Returns:
            Response from the API
        """
        async def _append_operation():
            service = await self._get_service()
            try:
                body = {
                    'values': values,
                    'majorDimension': 'ROWS'
                }
                
                result = service.spreadsheets().values().append(
                    spreadsheetId=spreadsheet_id,
                    range=range_name,
                    valueInputOption=value_input_option,
                    insertDataOption='INSERT_ROWS',
                    body=body
                ).execute()
                
                logger.debug(f"Appended {len(values)} rows to {range_name}")
                return result
                
            finally:
                await self._release_service(service)
        
        return await self._execute_with_retry(_append_operation)
    
    async def clear_range(
        self,
        spreadsheet_id: str,
        range_name: str
    ) -> Dict[str, Any]:
        """
        Clear values from a spreadsheet range.
        
        Args:
            spreadsheet_id: The ID of the spreadsheet
            range_name: The A1 notation range to clear
            
        Returns:
            Response from the API
        """
        async def _clear_operation():
            service = await self._get_service()
            try:
                result = service.spreadsheets().values().clear(
                    spreadsheetId=spreadsheet_id,
                    range=range_name
                ).execute()
                
                logger.debug(f"Cleared range {range_name}")
                return result
                
            finally:
                await self._release_service(service)
        
        return await self._execute_with_retry(_clear_operation)
    
    async def batch_update(
        self,
        spreadsheet_id: str,
        requests: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Execute multiple operations in a single batch request.
        
        Args:
            spreadsheet_id: The ID of the spreadsheet
            requests: List of batch update requests
            
        Returns:
            Response from the API
        """
        async def _batch_operation():
            service = await self._get_service()
            try:
                body = {'requests': requests}
                
                result = service.spreadsheets().batchUpdate(
                    spreadsheetId=spreadsheet_id,
                    body=body
                ).execute()
                
                logger.debug(f"Executed batch update with {len(requests)} requests")
                return result
                
            finally:
                await self._release_service(service)
        
        return await self._execute_with_retry(_batch_operation)
    
    async def get_spreadsheet_metadata(
        self,
        spreadsheet_id: str
    ) -> Dict[str, Any]:
        """
        Get metadata about a spreadsheet.
        
        Args:
            spreadsheet_id: The ID of the spreadsheet
            
        Returns:
            Spreadsheet metadata
        """
        async def _metadata_operation():
            service = await self._get_service()
            try:
                result = service.spreadsheets().get(
                    spreadsheetId=spreadsheet_id,
                    includeGridData=False
                ).execute()
                
                logger.debug(f"Retrieved metadata for spreadsheet {spreadsheet_id}")
                return result
                
            finally:
                await self._release_service(service)
        
        return await self._execute_with_retry(_metadata_operation)
    
    async def health_check(self) -> bool:
        """
        Perform a health check to verify the client is working.
        
        Returns:
            True if the client is healthy, False otherwise
        """
        try:
            await self._ensure_authenticated()
            # Try to access a dummy spreadsheet to test connectivity
            # This will fail gracefully if the spreadsheet doesn't exist
            service = await self._get_service()
            await self._release_service(service)
            return True
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False


# Global client instance
_sheets_client: Optional[SheetsClient] = None


def get_sheets_client() -> SheetsClient:
    """Get the global Google Sheets client instance."""
    global _sheets_client
    if _sheets_client is None:
        _sheets_client = SheetsClient()
    return _sheets_client


async def initialize_sheets_client(
    credentials_json: Optional[str] = None,
    retry_config: Optional[RetryConfig] = None
) -> SheetsClient:
    """
    Initialize the global Google Sheets client.
    
    Args:
        credentials_json: Service account credentials
        retry_config: Retry configuration
        
    Returns:
        Initialized SheetsClient instance
    """
    global _sheets_client
    _sheets_client = SheetsClient(
        credentials_json=credentials_json,
        retry_config=retry_config
    )
    
    # Perform health check
    if not await _sheets_client.health_check():
        logger.warning("Google Sheets client health check failed")
    
    return _sheets_client
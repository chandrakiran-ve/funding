"""
Tests for Google Sheets client functionality.
"""

import pytest
import asyncio
import json
from unittest.mock import Mock, patch, AsyncMock
from googleapiclient.errors import HttpError

from app.services.sheets_client import (
    SheetsClient,
    SheetsError,
    SheetsAuthError,
    SheetsRateLimitError,
    SheetsConnectionError,
    RetryConfig,
    get_sheets_client,
    initialize_sheets_client
)


class TestSheetsClient:
    """Test cases for SheetsClient."""
    
    @pytest.fixture
    def mock_credentials_json(self):
        """Mock Google credentials."""
        return {
            "type": "service_account",
            "project_id": "test-project",
            "private_key_id": "test-key-id",
            "private_key": "-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----\n",
            "client_email": "test@test-project.iam.gserviceaccount.com",
            "client_id": "test-client-id",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token"
        }
    
    @pytest.fixture
    def retry_config(self):
        """Test retry configuration."""
        return RetryConfig(
            max_retries=2,
            base_delay=0.1,
            max_delay=1.0,
            exponential_base=2.0,
            jitter=False
        )
    
    @patch('app.services.sheets_client.Credentials')
    @patch('app.services.sheets_client.build')
    def test_client_initialization(self, mock_build, mock_credentials, mock_credentials_json):
        """Test client initialization with credentials."""
        mock_creds_instance = Mock()
        mock_credentials.from_service_account_info.return_value = mock_creds_instance
        
        client = SheetsClient(
            credentials_json=json.dumps(mock_credentials_json),
            max_connections=5
        )
        
        assert client.credentials == mock_creds_instance
        assert client.connection_pool.max_connections == 5
        mock_credentials.from_service_account_info.assert_called_once()
    
    def test_client_initialization_no_credentials(self):
        """Test client initialization without credentials."""
        with patch('app.services.sheets_client.get_settings') as mock_settings:
            mock_settings.return_value.GOOGLE_SHEETS_CREDENTIALS = None
            
            client = SheetsClient()
            assert client.credentials is None
    
    @patch('app.services.sheets_client.Credentials')
    def test_invalid_credentials(self, mock_credentials, mock_credentials_json):
        """Test handling of invalid credentials."""
        mock_credentials.from_service_account_info.side_effect = Exception("Invalid credentials")
        
        with pytest.raises(SheetsAuthError):
            SheetsClient(credentials_json=json.dumps(mock_credentials_json))
    
    @pytest.mark.asyncio
    @patch('app.services.sheets_client.Credentials')
    @patch('app.services.sheets_client.build')
    async def test_read_range_success(self, mock_build, mock_credentials, mock_credentials_json):
        """Test successful range reading."""
        # Setup mocks
        mock_creds_instance = Mock()
        mock_creds_instance.expired = False
        mock_credentials.from_service_account_info.return_value = mock_creds_instance
        
        mock_service = Mock()
        mock_values = Mock()
        mock_get = Mock()
        
        mock_service.spreadsheets.return_value.values.return_value.get.return_value = mock_get
        mock_get.execute.return_value = {'values': [['A1', 'B1'], ['A2', 'B2']]}
        mock_build.return_value = mock_service
        
        # Test
        client = SheetsClient(credentials_json=json.dumps(mock_credentials_json))
        result = await client.read_range('test-sheet-id', 'A1:B2')
        
        assert result == [['A1', 'B1'], ['A2', 'B2']]
        mock_get.execute.assert_called_once()
    
    @pytest.mark.asyncio
    @patch('app.services.sheets_client.Credentials')
    @patch('app.services.sheets_client.build')
    async def test_write_range_success(self, mock_build, mock_credentials, mock_credentials_json):
        """Test successful range writing."""
        # Setup mocks
        mock_creds_instance = Mock()
        mock_creds_instance.expired = False
        mock_credentials.from_service_account_info.return_value = mock_creds_instance
        
        mock_service = Mock()
        mock_update = Mock()
        
        mock_service.spreadsheets.return_value.values.return_value.update.return_value = mock_update
        mock_update.execute.return_value = {'updatedCells': 4}
        mock_build.return_value = mock_service
        
        # Test
        client = SheetsClient(credentials_json=json.dumps(mock_credentials_json))
        values = [['A1', 'B1'], ['A2', 'B2']]
        result = await client.write_range('test-sheet-id', 'A1:B2', values)
        
        assert result == {'updatedCells': 4}
        mock_update.execute.assert_called_once()
    
    @pytest.mark.asyncio
    @patch('app.services.sheets_client.Credentials')
    @patch('app.services.sheets_client.build')
    async def test_http_error_handling(self, mock_build, mock_credentials, mock_credentials_json):
        """Test HTTP error handling and retries."""
        # Setup mocks
        mock_creds_instance = Mock()
        mock_creds_instance.expired = False
        mock_credentials.from_service_account_info.return_value = mock_creds_instance
        
        mock_service = Mock()
        mock_get = Mock()
        
        # Create HTTP error
        mock_resp = Mock()
        mock_resp.status = 500
        http_error = HttpError(mock_resp, b'Server Error')
        
        mock_service.spreadsheets.return_value.values.return_value.get.return_value = mock_get
        mock_get.execute.side_effect = http_error
        mock_build.return_value = mock_service
        
        # Test with retry config that fails quickly
        retry_config = RetryConfig(max_retries=1, base_delay=0.01)
        client = SheetsClient(
            credentials_json=json.dumps(mock_credentials_json),
            retry_config=retry_config
        )
        
        with pytest.raises(SheetsConnectionError):
            await client.read_range('test-sheet-id', 'A1:B2')
    
    @pytest.mark.asyncio
    @patch('app.services.sheets_client.Credentials')
    @patch('app.services.sheets_client.build')
    async def test_rate_limit_handling(self, mock_build, mock_credentials, mock_credentials_json):
        """Test rate limit error handling."""
        # Setup mocks
        mock_creds_instance = Mock()
        mock_creds_instance.expired = False
        mock_credentials.from_service_account_info.return_value = mock_creds_instance
        
        mock_service = Mock()
        mock_get = Mock()
        
        # Create rate limit error
        mock_resp = Mock()
        mock_resp.status = 403
        http_error = HttpError(mock_resp, b'Quota exceeded')
        
        mock_service.spreadsheets.return_value.values.return_value.get.return_value = mock_get
        mock_get.execute.side_effect = http_error
        mock_build.return_value = mock_service
        
        # Test
        retry_config = RetryConfig(max_retries=1, base_delay=0.01)
        client = SheetsClient(
            credentials_json=json.dumps(mock_credentials_json),
            retry_config=retry_config
        )
        
        with pytest.raises(SheetsRateLimitError):
            await client.read_range('test-sheet-id', 'A1:B2')
    
    @pytest.mark.asyncio
    @patch('app.services.sheets_client.Credentials')
    @patch('app.services.sheets_client.build')
    async def test_auth_error_handling(self, mock_build, mock_credentials, mock_credentials_json):
        """Test authentication error handling."""
        # Setup mocks
        mock_creds_instance = Mock()
        mock_creds_instance.expired = False
        mock_credentials.from_service_account_info.return_value = mock_creds_instance
        
        mock_service = Mock()
        mock_get = Mock()
        
        # Create auth error
        mock_resp = Mock()
        mock_resp.status = 401
        http_error = HttpError(mock_resp, b'Unauthorized')
        
        mock_service.spreadsheets.return_value.values.return_value.get.return_value = mock_get
        mock_get.execute.side_effect = http_error
        mock_build.return_value = mock_service
        
        # Test
        client = SheetsClient(credentials_json=json.dumps(mock_credentials_json))
        
        with pytest.raises(SheetsAuthError):
            await client.read_range('test-sheet-id', 'A1:B2')
    
    @pytest.mark.asyncio
    @patch('app.services.sheets_client.Credentials')
    @patch('app.services.sheets_client.build')
    async def test_append_rows(self, mock_build, mock_credentials, mock_credentials_json):
        """Test appending rows to a spreadsheet."""
        # Setup mocks
        mock_creds_instance = Mock()
        mock_creds_instance.expired = False
        mock_credentials.from_service_account_info.return_value = mock_creds_instance
        
        mock_service = Mock()
        mock_append = Mock()
        
        mock_service.spreadsheets.return_value.values.return_value.append.return_value = mock_append
        mock_append.execute.return_value = {'updates': {'updatedRows': 2}}
        mock_build.return_value = mock_service
        
        # Test
        client = SheetsClient(credentials_json=json.dumps(mock_credentials_json))
        values = [['A3', 'B3'], ['A4', 'B4']]
        result = await client.append_rows('test-sheet-id', 'A1:B1', values)
        
        assert result == {'updates': {'updatedRows': 2}}
        mock_append.execute.assert_called_once()
    
    @pytest.mark.asyncio
    @patch('app.services.sheets_client.Credentials')
    @patch('app.services.sheets_client.build')
    async def test_clear_range(self, mock_build, mock_credentials, mock_credentials_json):
        """Test clearing a range in a spreadsheet."""
        # Setup mocks
        mock_creds_instance = Mock()
        mock_creds_instance.expired = False
        mock_credentials.from_service_account_info.return_value = mock_creds_instance
        
        mock_service = Mock()
        mock_clear = Mock()
        
        mock_service.spreadsheets.return_value.values.return_value.clear.return_value = mock_clear
        mock_clear.execute.return_value = {'clearedRange': 'A1:B2'}
        mock_build.return_value = mock_service
        
        # Test
        client = SheetsClient(credentials_json=json.dumps(mock_credentials_json))
        result = await client.clear_range('test-sheet-id', 'A1:B2')
        
        assert result == {'clearedRange': 'A1:B2'}
        mock_clear.execute.assert_called_once()
    
    @pytest.mark.asyncio
    @patch('app.services.sheets_client.Credentials')
    @patch('app.services.sheets_client.build')
    async def test_batch_update(self, mock_build, mock_credentials, mock_credentials_json):
        """Test batch update operations."""
        # Setup mocks
        mock_creds_instance = Mock()
        mock_creds_instance.expired = False
        mock_credentials.from_service_account_info.return_value = mock_creds_instance
        
        mock_service = Mock()
        mock_batch = Mock()
        
        mock_service.spreadsheets.return_value.batchUpdate.return_value = mock_batch
        mock_batch.execute.return_value = {'replies': []}
        mock_build.return_value = mock_service
        
        # Test
        client = SheetsClient(credentials_json=json.dumps(mock_credentials_json))
        requests = [{'updateCells': {'range': 'A1:B2'}}]
        result = await client.batch_update('test-sheet-id', requests)
        
        assert result == {'replies': []}
        mock_batch.execute.assert_called_once()
    
    @pytest.mark.asyncio
    @patch('app.services.sheets_client.Credentials')
    @patch('app.services.sheets_client.build')
    async def test_health_check_success(self, mock_build, mock_credentials, mock_credentials_json):
        """Test successful health check."""
        # Setup mocks
        mock_creds_instance = Mock()
        mock_creds_instance.expired = False
        mock_credentials.from_service_account_info.return_value = mock_creds_instance
        mock_build.return_value = Mock()
        
        # Test
        client = SheetsClient(credentials_json=json.dumps(mock_credentials_json))
        result = await client.health_check()
        
        assert result is True
    
    @pytest.mark.asyncio
    async def test_health_check_failure(self):
        """Test health check failure."""
        client = SheetsClient()  # No credentials
        result = await client.health_check()
        
        assert result is False
    
    def test_retry_config(self):
        """Test retry configuration."""
        config = RetryConfig(
            max_retries=5,
            base_delay=2.0,
            max_delay=120.0,
            exponential_base=3.0,
            jitter=True
        )
        
        assert config.max_retries == 5
        assert config.base_delay == 2.0
        assert config.max_delay == 120.0
        assert config.exponential_base == 3.0
        assert config.jitter is True
    
    def test_calculate_delay(self, mock_credentials_json):
        """Test delay calculation for exponential backoff."""
        retry_config = RetryConfig(
            base_delay=1.0,
            exponential_base=2.0,
            max_delay=10.0,
            jitter=False
        )
        
        with patch('app.services.sheets_client.Credentials'):
            client = SheetsClient(
                credentials_json=json.dumps(mock_credentials_json),
                retry_config=retry_config
            )
            
            # Test delay calculation
            delay_0 = client._calculate_delay(0)
            delay_1 = client._calculate_delay(1)
            delay_2 = client._calculate_delay(2)
            delay_10 = client._calculate_delay(10)
            
            assert delay_0 == 1.0  # base_delay * 2^0
            assert delay_1 == 2.0  # base_delay * 2^1
            assert delay_2 == 4.0  # base_delay * 2^2
            assert delay_10 == 10.0  # capped at max_delay


class TestGlobalClient:
    """Test global client functions."""
    
    def test_get_sheets_client(self):
        """Test getting global client instance."""
        # Reset global client
        import app.services.sheets_client
        app.services.sheets_client._sheets_client = None
        
        client1 = get_sheets_client()
        client2 = get_sheets_client()
        
        assert client1 is client2  # Should be the same instance
    
    @pytest.mark.asyncio
    async def test_initialize_sheets_client(self):
        """Test initializing global client."""
        # Reset global client
        import app.services.sheets_client
        app.services.sheets_client._sheets_client = None
        
        with patch('app.services.sheets_client.SheetsClient') as mock_client_class:
            mock_client = Mock()
            mock_client.health_check = AsyncMock(return_value=True)
            mock_client_class.return_value = mock_client
            
            client = await initialize_sheets_client("test-credentials")
            
            assert client == mock_client
            mock_client.health_check.assert_called_once()


if __name__ == "__main__":
    pytest.main([__file__])
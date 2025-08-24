"""
Pydantic models for all data entities in the fundraising system.
These models provide validation, serialization, and business logic constraints.
"""

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator, model_validator
import uuid


class ContributionStatus(str, Enum):
    """Status of a contribution"""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    RECEIVED = "received"
    CANCELLED = "cancelled"


class ContactInfo(BaseModel):
    """Contact information for funders"""
    email: Optional[str] = Field(None, description="Primary email address")
    phone: Optional[str] = Field(None, description="Primary phone number")
    address: Optional[str] = Field(None, description="Physical address")
    website: Optional[str] = Field(None, description="Website URL")
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        if v and '@' not in v:
            raise ValueError('Invalid email format')
        return v
    
    @field_validator('website')
    @classmethod
    def validate_website(cls, v):
        if v and not (v.startswith('http://') or v.startswith('https://')):
            v = f'https://{v}'
        return v


class FunderModel(BaseModel):
    """Model for funder entities with validation and business logic"""
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique funder identifier")
    name: str = Field(..., min_length=1, max_length=200, description="Funder name")
    contact_info: Optional[ContactInfo] = Field(None, description="Contact information")
    contribution_history: List[str] = Field(default_factory=list, description="List of contribution IDs")
    preferences: Dict[str, Any] = Field(default_factory=dict, description="Funder preferences and metadata")
    tags: List[str] = Field(default_factory=list, description="Tags for categorization")
    status: str = Field(default="active", description="Funder status")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            Decimal: lambda v: float(v)
        }
        json_schema_extra = {
            "example": {
                "id": "funder_123",
                "name": "Example Foundation",
                "contact_info": {
                    "email": "contact@example.org",
                    "phone": "+1-555-0123",
                    "website": "https://example.org"
                },
                "contribution_history": ["contrib_456", "contrib_789"],
                "preferences": {"communication_method": "email"},
                "tags": ["foundation", "education"],
                "status": "active"
            }
        }
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if not v.strip():
            raise ValueError('Funder name cannot be empty')
        return v.strip()
    
    @field_validator('status')
    @classmethod
    def validate_status(cls, v):
        allowed_statuses = ['active', 'inactive', 'pending', 'archived']
        if v not in allowed_statuses:
            raise ValueError(f'Status must be one of: {allowed_statuses}')
        return v
    
    @model_validator(mode='before')
    @classmethod
    def update_timestamp(cls, values):
        if isinstance(values, dict):
            values['updated_at'] = datetime.utcnow()
        return values
    
    def add_contribution(self, contribution_id: str) -> None:
        """Add a contribution ID to the history"""
        if contribution_id not in self.contribution_history:
            self.contribution_history.append(contribution_id)
            self.updated_at = datetime.utcnow()
    
    def remove_contribution(self, contribution_id: str) -> None:
        """Remove a contribution ID from the history"""
        if contribution_id in self.contribution_history:
            self.contribution_history.remove(contribution_id)
            self.updated_at = datetime.utcnow()


class ContributionModel(BaseModel):
    """Model for contribution entities with validation and business logic"""
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique contribution identifier")
    funder_id: str = Field(..., description="ID of the contributing funder")
    state_code: str = Field(..., min_length=2, max_length=3, description="State code (e.g., 'CA', 'NY')")
    fiscal_year: str = Field(..., pattern=r'^\d{4}-\d{2}$', description="Fiscal year in format YYYY-YY")
    amount: Decimal = Field(..., gt=0, description="Contribution amount")
    date: Optional[datetime] = Field(None, description="Contribution date")
    status: ContributionStatus = Field(default=ContributionStatus.PENDING, description="Contribution status")
    description: Optional[str] = Field(None, max_length=500, description="Contribution description")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            Decimal: lambda v: float(v)
        }
        json_schema_extra = {
            "example": {
                "id": "contrib_123",
                "funder_id": "funder_456",
                "state_code": "CA",
                "fiscal_year": "2024-25",
                "amount": 50000.00,
                "date": "2024-03-15T10:00:00Z",
                "status": "confirmed",
                "description": "Annual education grant"
            }
        }
    
    @field_validator('state_code')
    @classmethod
    def validate_state_code(cls, v):
        return v.upper().strip()
    
    @field_validator('fiscal_year')
    @classmethod
    def validate_fiscal_year(cls, v):
        # Validate format and logical year sequence
        try:
            start_year, end_year_suffix = v.split('-')
            start_year_int = int(start_year)
            end_year_int = int(f"20{end_year_suffix}")
            
            if end_year_int != start_year_int + 1:
                raise ValueError('Fiscal year end must be start year + 1')
            
            if start_year_int < 2000 or start_year_int > 2100:
                raise ValueError('Fiscal year must be between 2000 and 2100')
                
        except ValueError as e:
            raise ValueError(f'Invalid fiscal year format: {e}')
        
        return v
    
    @field_validator('amount')
    @classmethod
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Amount must be positive')
        # Round to 2 decimal places for currency
        return round(v, 2)
    
    @model_validator(mode='before')
    @classmethod
    def update_timestamp(cls, values):
        if isinstance(values, dict):
            values['updated_at'] = datetime.utcnow()
        return values
    
    def update_status(self, new_status: ContributionStatus) -> None:
        """Update contribution status with timestamp"""
        self.status = new_status
        self.updated_at = datetime.utcnow()


class StateTargetModel(BaseModel):
    """Model for state fundraising targets"""
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique target identifier")
    state_code: str = Field(..., min_length=2, max_length=3, description="State code")
    fiscal_year: str = Field(..., pattern=r'^\d{4}-\d{2}$', description="Fiscal year in format YYYY-YY")
    target_amount: Decimal = Field(..., gt=0, description="Target fundraising amount")
    description: Optional[str] = Field(None, max_length=500, description="Target description")
    priority: int = Field(default=1, ge=1, le=5, description="Priority level (1-5)")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            Decimal: lambda v: float(v)
        }
        json_schema_extra = {
            "example": {
                "id": "target_123",
                "state_code": "CA",
                "fiscal_year": "2024-25",
                "target_amount": 1000000.00,
                "description": "California education funding target",
                "priority": 1
            }
        }
    
    @field_validator('state_code')
    @classmethod
    def validate_state_code(cls, v):
        return v.upper().strip()
    
    @field_validator('fiscal_year')
    @classmethod
    def validate_fiscal_year(cls, v):
        # Same validation as ContributionModel
        try:
            start_year, end_year_suffix = v.split('-')
            start_year_int = int(start_year)
            end_year_int = int(f"20{end_year_suffix}")
            
            if end_year_int != start_year_int + 1:
                raise ValueError('Fiscal year end must be start year + 1')
                
        except ValueError as e:
            raise ValueError(f'Invalid fiscal year format: {e}')
        
        return v
    
    @field_validator('target_amount')
    @classmethod
    def validate_target_amount(cls, v):
        if v <= 0:
            raise ValueError('Target amount must be positive')
        return round(v, 2)
    
    @model_validator(mode='before')
    @classmethod
    def update_timestamp(cls, values):
        if isinstance(values, dict):
            values['updated_at'] = datetime.utcnow()
        return values


class ProspectModel(BaseModel):
    """Model for fundraising prospects"""
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique prospect identifier")
    name: str = Field(..., min_length=1, max_length=200, description="Prospect name")
    state_code: Optional[str] = Field(None, min_length=2, max_length=3, description="Associated state code")
    stage: str = Field(default="initial", description="Prospect stage in pipeline")
    estimated_amount: Decimal = Field(..., gt=0, description="Estimated contribution amount")
    probability: float = Field(..., ge=0.0, le=1.0, description="Probability of success (0.0-1.0)")
    expected_close_date: Optional[datetime] = Field(None, description="Expected closing date")
    contact_info: Optional[ContactInfo] = Field(None, description="Contact information")
    notes: Optional[str] = Field(None, max_length=1000, description="Notes about the prospect")
    tags: List[str] = Field(default_factory=list, description="Tags for categorization")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            Decimal: lambda v: float(v)
        }
        json_schema_extra = {
            "example": {
                "id": "prospect_123",
                "name": "Tech Foundation",
                "state_code": "NY",
                "stage": "negotiation",
                "estimated_amount": 75000.00,
                "probability": 0.7,
                "expected_close_date": "2024-06-30T00:00:00Z",
                "notes": "Interested in STEM education programs"
            }
        }
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if not v.strip():
            raise ValueError('Prospect name cannot be empty')
        return v.strip()
    
    @field_validator('state_code')
    @classmethod
    def validate_state_code(cls, v):
        if v:
            return v.upper().strip()
        return v
    
    @field_validator('stage')
    @classmethod
    def validate_stage(cls, v):
        allowed_stages = ['initial', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']
        if v not in allowed_stages:
            raise ValueError(f'Stage must be one of: {allowed_stages}')
        return v
    
    @field_validator('estimated_amount')
    @classmethod
    def validate_estimated_amount(cls, v):
        if v <= 0:
            raise ValueError('Estimated amount must be positive')
        return round(v, 2)
    
    @field_validator('probability')
    @classmethod
    def validate_probability(cls, v):
        if not 0.0 <= v <= 1.0:
            raise ValueError('Probability must be between 0.0 and 1.0')
        return round(v, 2)
    
    @model_validator(mode='before')
    @classmethod
    def update_timestamp(cls, values):
        if isinstance(values, dict):
            values['updated_at'] = datetime.utcnow()
        return values
    
    def update_stage(self, new_stage: str) -> None:
        """Update prospect stage with timestamp"""
        if new_stage in ['initial', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']:
            self.stage = new_stage
            self.updated_at = datetime.utcnow()
        else:
            raise ValueError(f'Invalid stage: {new_stage}')
    
    def calculate_weighted_value(self) -> Decimal:
        """Calculate weighted value based on probability"""
        return self.estimated_amount * Decimal(str(self.probability))


class StateModel(BaseModel):
    """Model for state information"""
    
    code: str = Field(..., min_length=2, max_length=3, description="State code")
    name: str = Field(..., min_length=1, max_length=100, description="State name")
    region: Optional[str] = Field(None, description="Geographic region")
    population: Optional[int] = Field(None, gt=0, description="State population")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
        json_schema_extra = {
            "example": {
                "code": "CA",
                "name": "California",
                "region": "West",
                "population": 39538223
            }
        }
    
    @field_validator('code')
    @classmethod
    def validate_code(cls, v):
        return v.upper().strip()
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if not v.strip():
            raise ValueError('State name cannot be empty')
        return v.strip()
    
    @model_validator(mode='before')
    @classmethod
    def update_timestamp(cls, values):
        if isinstance(values, dict):
            values['updated_at'] = datetime.utcnow()
        return values


class SchoolModel(BaseModel):
    """Model for school information"""
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique school identifier")
    name: str = Field(..., min_length=1, max_length=200, description="School name")
    state_code: str = Field(..., min_length=2, max_length=3, description="State code")
    district: Optional[str] = Field(None, max_length=100, description="School district")
    type: Optional[str] = Field(None, description="School type (public, private, charter)")
    enrollment: Optional[int] = Field(None, gt=0, description="Student enrollment")
    contact_info: Optional[ContactInfo] = Field(None, description="Contact information")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
        json_schema_extra = {
            "example": {
                "id": "school_123",
                "name": "Lincoln Elementary School",
                "state_code": "CA",
                "district": "Los Angeles Unified",
                "type": "public",
                "enrollment": 450
            }
        }
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if not v.strip():
            raise ValueError('School name cannot be empty')
        return v.strip()
    
    @field_validator('state_code')
    @classmethod
    def validate_state_code(cls, v):
        return v.upper().strip()
    
    @field_validator('type')
    @classmethod
    def validate_type(cls, v):
        if v:
            allowed_types = ['public', 'private', 'charter', 'magnet', 'other']
            if v.lower() not in allowed_types:
                raise ValueError(f'School type must be one of: {allowed_types}')
            return v.lower()
        return v
    
    @model_validator(mode='before')
    @classmethod
    def update_timestamp(cls, values):
        if isinstance(values, dict):
            values['updated_at'] = datetime.utcnow()
        return values
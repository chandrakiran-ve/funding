"""
Pydantic models for LangGraph workflow state management.
These models handle conversation state, analysis results, and workflow coordination.
"""

from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field, field_validator
import json
import uuid


class MessageRole(str, Enum):
    """Role of a chat message"""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class AnalysisType(str, Enum):
    """Type of analysis performed"""
    FUNDER_ANALYSIS = "funder_analysis"
    STATE_PERFORMANCE = "state_performance"
    CONTRIBUTION_HISTORY = "contribution_history"
    PIPELINE_ANALYSIS = "pipeline_analysis"
    TREND_ANALYSIS = "trend_analysis"
    GENERAL_QUERY = "general_query"
    PREDICTIVE_ANALYSIS = "predictive_analysis"
    ANOMALY_DETECTION = "anomaly_detection"


class ValidationSeverity(str, Enum):
    """Severity level for validation results"""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class CRUDOperation(str, Enum):
    """CRUD operation types"""
    CREATE = "create"
    READ = "read"
    UPDATE = "update"
    DELETE = "delete"


class ChatMessage(BaseModel):
    """Model for chat messages in conversations"""
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique message identifier")
    role: MessageRole = Field(..., description="Role of the message sender")
    content: str = Field(..., min_length=1, description="Message content")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Message timestamp")
    context: Dict[str, Any] = Field(default_factory=dict, description="Additional context data")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Message metadata")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
        json_schema_extra = {
            "example": {
                "id": "msg_123",
                "role": "user",
                "content": "What are the top funders in California?",
                "timestamp": "2024-03-15T10:00:00Z",
                "context": {"query_type": "funder_analysis"},
                "metadata": {"session_id": "session_456"}
            }
        }
    
    @field_validator('content')
    @classmethod
    def validate_content(cls, v):
        if not v.strip():
            raise ValueError('Message content cannot be empty')
        return v.strip()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization"""
        return {
            "id": self.id,
            "role": self.role.value,
            "content": self.content,
            "timestamp": self.timestamp.isoformat(),
            "context": self.context,
            "metadata": self.metadata
        }


class AnalysisResult(BaseModel):
    """Model for analysis results from AI workflows"""
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique result identifier")
    type: AnalysisType = Field(..., description="Type of analysis performed")
    summary: str = Field(..., description="Summary of the analysis")
    data: List[Dict[str, Any]] = Field(default_factory=list, description="Analysis data")
    insights: List[str] = Field(default_factory=list, description="Key insights from analysis")
    recommendations: List[str] = Field(default_factory=list, description="Recommendations based on analysis")
    metrics: Dict[str, Union[int, float, str]] = Field(default_factory=dict, description="Key metrics")
    confidence_score: float = Field(default=0.0, ge=0.0, le=1.0, description="Confidence in results")
    methodology: Optional[str] = Field(None, description="Analysis methodology used")
    limitations: List[str] = Field(default_factory=list, description="Analysis limitations")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            Decimal: lambda v: float(v)
        }
        json_schema_extra = {
            "example": {
                "id": "analysis_123",
                "type": "funder_analysis",
                "summary": "Analysis of top 10 funders in California",
                "data": [{"funder_id": "f1", "name": "Foundation A", "total_amount": 100000}],
                "insights": ["Foundation A is the top contributor"],
                "recommendations": ["Focus on similar foundations"],
                "metrics": {"total_funders": 25, "total_amount": 500000},
                "confidence_score": 0.85
            }
        }
    
    @field_validator('confidence_score')
    @classmethod
    def validate_confidence_score(cls, v):
        return round(v, 2)
    
    def add_insight(self, insight: str) -> None:
        """Add an insight to the analysis"""
        if insight and insight not in self.insights:
            self.insights.append(insight)
    
    def add_recommendation(self, recommendation: str) -> None:
        """Add a recommendation to the analysis"""
        if recommendation and recommendation not in self.recommendations:
            self.recommendations.append(recommendation)


class ValidationResult(BaseModel):
    """Model for validation results"""
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique validation identifier")
    field: str = Field(..., description="Field being validated")
    severity: ValidationSeverity = Field(..., description="Validation severity")
    message: str = Field(..., description="Validation message")
    code: Optional[str] = Field(None, description="Error code")
    context: Dict[str, Any] = Field(default_factory=dict, description="Additional context")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Validation timestamp")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
        json_schema_extra = {
            "example": {
                "id": "validation_123",
                "field": "amount",
                "severity": "error",
                "message": "Amount must be positive",
                "code": "INVALID_AMOUNT",
                "context": {"provided_value": -100}
            }
        }
    
    def is_error(self) -> bool:
        """Check if this is an error-level validation"""
        return self.severity in [ValidationSeverity.ERROR, ValidationSeverity.CRITICAL]


class DataContext(BaseModel):
    """Model for data context used in workflows"""
    
    funders: List[Dict[str, Any]] = Field(default_factory=list, description="Funder data")
    contributions: List[Dict[str, Any]] = Field(default_factory=list, description="Contribution data")
    state_targets: List[Dict[str, Any]] = Field(default_factory=list, description="State target data")
    prospects: List[Dict[str, Any]] = Field(default_factory=list, description="Prospect data")
    states: List[Dict[str, Any]] = Field(default_factory=list, description="State data")
    schools: List[Dict[str, Any]] = Field(default_factory=list, description="School data")
    last_updated: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Context metadata")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
    
    def get_data_summary(self) -> Dict[str, int]:
        """Get summary of data counts"""
        return {
            "funders": len(self.funders),
            "contributions": len(self.contributions),
            "state_targets": len(self.state_targets),
            "prospects": len(self.prospects),
            "states": len(self.states),
            "schools": len(self.schools)
        }
    
    def is_stale(self, max_age_minutes: int = 5) -> bool:
        """Check if data context is stale"""
        age = datetime.utcnow() - self.last_updated
        return age.total_seconds() > (max_age_minutes * 60)


class AuditEntry(BaseModel):
    """Model for audit log entries"""
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique audit identifier")
    operation: CRUDOperation = Field(..., description="Operation performed")
    entity_type: str = Field(..., description="Type of entity affected")
    entity_id: str = Field(..., description="ID of entity affected")
    user_id: Optional[str] = Field(None, description="User who performed the operation")
    session_id: Optional[str] = Field(None, description="Session identifier")
    changes: Dict[str, Any] = Field(default_factory=dict, description="Changes made")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Operation timestamp")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
        json_schema_extra = {
            "example": {
                "id": "audit_123",
                "operation": "update",
                "entity_type": "funder",
                "entity_id": "funder_456",
                "user_id": "user_789",
                "session_id": "session_abc",
                "changes": {"name": {"old": "Old Name", "new": "New Name"}},
                "metadata": {"ip_address": "192.168.1.1"}
            }
        }


# Dataclasses for LangGraph state management
@dataclass
class AgentState:
    """State management for LangGraph AI agent workflows"""
    
    messages: List[ChatMessage] = field(default_factory=list)
    current_query: str = ""
    session_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    user_context: Dict[str, Any] = field(default_factory=dict)
    data_context: Optional[DataContext] = None
    analysis_results: List[AnalysisResult] = field(default_factory=list)
    needs_clarification: bool = False
    error_state: Optional[str] = None
    workflow_step: str = "start"
    metadata: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    
    def add_message(self, message: ChatMessage) -> None:
        """Add a message to the conversation"""
        self.messages.append(message)
        self.updated_at = datetime.utcnow()
    
    def add_analysis_result(self, result: AnalysisResult) -> None:
        """Add an analysis result"""
        self.analysis_results.append(result)
        self.updated_at = datetime.utcnow()
    
    def set_error(self, error: str) -> None:
        """Set error state"""
        self.error_state = error
        self.updated_at = datetime.utcnow()
    
    def clear_error(self) -> None:
        """Clear error state"""
        self.error_state = None
        self.updated_at = datetime.utcnow()
    
    def update_workflow_step(self, step: str) -> None:
        """Update current workflow step"""
        self.workflow_step = step
        self.updated_at = datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization"""
        return {
            "messages": [msg.to_dict() for msg in self.messages],
            "current_query": self.current_query,
            "session_id": self.session_id,
            "user_context": self.user_context,
            "data_context": self.data_context.model_dump() if self.data_context else None,
            "analysis_results": [result.model_dump() for result in self.analysis_results],
            "needs_clarification": self.needs_clarification,
            "error_state": self.error_state,
            "workflow_step": self.workflow_step,
            "metadata": self.metadata,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'AgentState':
        """Create from dictionary"""
        state = cls()
        state.messages = [ChatMessage(**msg) for msg in data.get("messages", [])]
        state.current_query = data.get("current_query", "")
        state.session_id = data.get("session_id", str(uuid.uuid4()))
        state.user_context = data.get("user_context", {})
        
        if data.get("data_context"):
            state.data_context = DataContext(**data["data_context"])
        
        state.analysis_results = [AnalysisResult(**result) for result in data.get("analysis_results", [])]
        state.needs_clarification = data.get("needs_clarification", False)
        state.error_state = data.get("error_state")
        state.workflow_step = data.get("workflow_step", "start")
        state.metadata = data.get("metadata", {})
        
        if data.get("created_at"):
            state.created_at = datetime.fromisoformat(data["created_at"].replace("Z", "+00:00"))
        if data.get("updated_at"):
            state.updated_at = datetime.fromisoformat(data["updated_at"].replace("Z", "+00:00"))
        
        return state


@dataclass
class CRUDState:
    """State management for CRUD operation workflows"""
    
    operation_type: CRUDOperation = CRUDOperation.READ
    entity_type: str = ""
    entity_id: Optional[str] = None
    entity_data: Dict[str, Any] = field(default_factory=dict)
    validation_results: List[ValidationResult] = field(default_factory=list)
    permissions_checked: bool = False
    operation_result: Optional[Dict[str, Any]] = None
    audit_entry: Optional[AuditEntry] = None
    user_id: Optional[str] = None
    session_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    metadata: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    
    def add_validation_result(self, result: ValidationResult) -> None:
        """Add a validation result"""
        self.validation_results.append(result)
        self.updated_at = datetime.utcnow()
    
    def has_validation_errors(self) -> bool:
        """Check if there are validation errors"""
        return any(result.is_error() for result in self.validation_results)
    
    def get_validation_errors(self) -> List[ValidationResult]:
        """Get all validation errors"""
        return [result for result in self.validation_results if result.is_error()]
    
    def set_operation_result(self, result: Dict[str, Any]) -> None:
        """Set operation result"""
        self.operation_result = result
        self.updated_at = datetime.utcnow()
    
    def create_audit_entry(self, changes: Dict[str, Any] = None) -> None:
        """Create audit entry for the operation"""
        self.audit_entry = AuditEntry(
            operation=self.operation_type,
            entity_type=self.entity_type,
            entity_id=self.entity_id or "",
            user_id=self.user_id,
            session_id=self.session_id,
            changes=changes or {},
            metadata=self.metadata
        )
        self.updated_at = datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization"""
        return {
            "operation_type": self.operation_type.value if hasattr(self.operation_type, 'value') else self.operation_type,
            "entity_type": self.entity_type,
            "entity_id": self.entity_id,
            "entity_data": self.entity_data,
            "validation_results": [result.model_dump() for result in self.validation_results],
            "permissions_checked": self.permissions_checked,
            "operation_result": self.operation_result,
            "audit_entry": self.audit_entry.model_dump() if self.audit_entry else None,
            "user_id": self.user_id,
            "session_id": self.session_id,
            "metadata": self.metadata,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'CRUDState':
        """Create from dictionary"""
        state = cls()
        state.operation_type = CRUDOperation(data.get("operation_type", "read"))
        state.entity_type = data.get("entity_type", "")
        state.entity_id = data.get("entity_id")
        state.entity_data = data.get("entity_data", {})
        state.validation_results = [ValidationResult(**result) for result in data.get("validation_results", [])]
        state.permissions_checked = data.get("permissions_checked", False)
        state.operation_result = data.get("operation_result")
        
        if data.get("audit_entry"):
            state.audit_entry = AuditEntry(**data["audit_entry"])
        
        state.user_id = data.get("user_id")
        state.session_id = data.get("session_id", str(uuid.uuid4()))
        state.metadata = data.get("metadata", {})
        
        if data.get("created_at"):
            state.created_at = datetime.fromisoformat(data["created_at"].replace("Z", "+00:00"))
        if data.get("updated_at"):
            state.updated_at = datetime.fromisoformat(data["updated_at"].replace("Z", "+00:00"))
        
        return state


# Utility functions for state serialization
def serialize_state(state: Union[AgentState, CRUDState]) -> str:
    """Serialize state to JSON string"""
    return json.dumps(state.to_dict(), default=str)


def deserialize_agent_state(data: str) -> AgentState:
    """Deserialize AgentState from JSON string"""
    return AgentState.from_dict(json.loads(data))


def deserialize_crud_state(data: str) -> CRUDState:
    """Deserialize CRUDState from JSON string"""
    return CRUDState.from_dict(json.loads(data))
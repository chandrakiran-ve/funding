"""
AI-powered CRUD operations workflow using Gemini AI for intelligent data validation and operations.
Implements secure, auditable data operations with AI-driven validation and decision making.
"""

from typing import Any, Dict, List, Optional, Union
from datetime import datetime
import logging
import json
import os
import uuid

from langgraph.graph import StateGraph, START, END
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage
from langchain_core.tools import tool

from ..models.workflow import (
    CRUDState, CRUDOperation, ValidationResult, ValidationSeverity, AuditEntry
)
from ..repositories.repository_factory import RepositoryFactory
from .base_nodes import BaseWorkflowNode
from .engine import BaseWorkflow

logger = logging.getLogger(__name__)


class AIValidationNode(BaseWorkflowNode):
    """
    AI-powered validation node that uses Gemini AI to validate data integrity and business rules.
    """
    
    def __init__(self):
        super().__init__("ai_validator", "AI-powered data validation")
        
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-pro",
            google_api_key=api_key,
            temperature=0.1,
            max_tokens=1024
        )
        
        # Business rules for different entity types
        self.business_rules = {
            "funder": {
                "required_fields": ["name", "contact_email"],
                "validation_rules": [
                    "Name must be at least 2 characters long",
                    "Email must be valid format",
                    "Phone number must be valid if provided",
                    "Name must not contain special characters except spaces, hyphens, and apostrophes"
                ]
            },
            "contribution": {
                "required_fields": ["funder_id", "amount", "date", "state_code"],
                "validation_rules": [
                    "Amount must be positive and greater than 0",
                    "Date must be valid and not in the future",
                    "State code must be valid 2-letter US state code",
                    "Funder ID must reference an existing funder",
                    "Amount must be reasonable (between $1 and $10,000,000)"
                ]
            },
            "state_target": {
                "required_fields": ["state_code", "target_amount", "fiscal_year"],
                "validation_rules": [
                    "State code must be valid 2-letter US state code",
                    "Target amount must be positive",
                    "Fiscal year must be valid format (YYYY)",
                    "Target amount must be reasonable (between $1,000 and $50,000,000)"
                ]
            },
            "prospect": {
                "required_fields": ["name", "potential_amount", "stage"],
                "validation_rules": [
                    "Name must be at least 2 characters long",
                    "Potential amount must be positive",
                    "Stage must be valid prospect stage",
                    "Contact information must be provided if stage is 'qualified' or higher"
                ]
            }
        }
    
    async def execute(self, state: CRUDState) -> CRUDState:
        """Perform AI-powered validation of CRUD operation data"""
        self.log_execution(state, f"Starting AI validation for {state.operation_type.value} on {state.entity_type}")
        
        # Get business rules for entity type
        entity_rules = self.business_rules.get(state.entity_type, {})
        
        # Perform basic validation first
        basic_validation_results = await self._perform_basic_validation(state, entity_rules)
        
        # Perform AI-powered advanced validation
        ai_validation_results = await self._perform_ai_validation(state, entity_rules)
        
        # Combine validation results
        all_validation_results = basic_validation_results + ai_validation_results
        
        # Add validation results to state
        for result in all_validation_results:
            state.add_validation_result(result)
        
        # Update workflow step
        state.updated_at = datetime.utcnow()
        
        self.log_execution(state, f"Validation completed: {len(all_validation_results)} results, {len(state.get_validation_errors())} errors")
        
        return state
    
    async def _perform_basic_validation(self, state: CRUDState, entity_rules: Dict[str, Any]) -> List[ValidationResult]:
        """Perform basic field validation"""
        validation_results = []
        
        # Check required fields
        required_fields = entity_rules.get("required_fields", [])
        for field in required_fields:
            if field not in state.entity_data or not state.entity_data[field]:
                validation_results.append(ValidationResult(
                    field=field,
                    severity=ValidationSeverity.ERROR,
                    message=f"Required field '{field}' is missing or empty",
                    code="REQUIRED_FIELD_MISSING"
                ))
        
        # Basic data type validation
        if "amount" in state.entity_data:
            try:
                amount = float(state.entity_data["amount"])
                if amount <= 0:
                    validation_results.append(ValidationResult(
                        field="amount",
                        severity=ValidationSeverity.ERROR,
                        message="Amount must be positive",
                        code="INVALID_AMOUNT"
                    ))
            except (ValueError, TypeError):
                validation_results.append(ValidationResult(
                    field="amount",
                    severity=ValidationSeverity.ERROR,
                    message="Amount must be a valid number",
                    code="INVALID_NUMBER_FORMAT"
                ))
        
        # Email validation
        if "contact_email" in state.entity_data:
            email = state.entity_data["contact_email"]
            if email and "@" not in email:
                validation_results.append(ValidationResult(
                    field="contact_email",
                    severity=ValidationSeverity.ERROR,
                    message="Email must be in valid format",
                    code="INVALID_EMAIL_FORMAT"
                ))
        
        return validation_results
    
    async def _perform_ai_validation(self, state: CRUDState, entity_rules: Dict[str, Any]) -> List[ValidationResult]:
        """Use AI to perform advanced validation and business rule checking"""
        
        validation_prompt = f"""You are a data validation expert for a fundraising platform. Validate the following {state.entity_type} data for a {state.operation_type.value} operation.

ENTITY TYPE: {state.entity_type}
OPERATION: {state.operation_type.value}

DATA TO VALIDATE:
{json.dumps(state.entity_data, indent=2)}

BUSINESS RULES:
{json.dumps(entity_rules, indent=2)}

VALIDATION REQUIREMENTS:
1. Check data consistency and logical relationships
2. Validate business rules specific to fundraising domain
3. Check for potential data quality issues
4. Identify any suspicious or unusual patterns
5. Ensure data makes sense in the context of fundraising operations

For each validation issue found, provide:
- field: The field name with the issue
- severity: "error", "warning", or "info"
- message: Clear description of the issue
- code: Short code identifier for the issue type

Respond with a JSON array of validation results:
[
    {{
        "field": "field_name",
        "severity": "error|warning|info",
        "message": "Description of the issue",
        "code": "VALIDATION_CODE"
    }}
]

If no issues are found, return an empty array: []"""
        
        try:
            messages = [SystemMessage(content=validation_prompt)]
            response = await self.llm.ainvoke(messages)
            
            # Parse AI validation results
            ai_results = json.loads(response.content)
            
            validation_results = []
            for result in ai_results:
                validation_results.append(ValidationResult(
                    field=result["field"],
                    severity=ValidationSeverity(result["severity"]),
                    message=result["message"],
                    code=result["code"],
                    context={"source": "ai_validation"}
                ))
            
            return validation_results
            
        except Exception as e:
            logger.error(f"AI validation failed: {e}")
            # Return a warning about AI validation failure
            return [ValidationResult(
                field="system",
                severity=ValidationSeverity.WARNING,
                message="AI validation could not be completed, proceeding with basic validation only",
                code="AI_VALIDATION_FAILED",
                context={"error": str(e)}
            )]


class PermissionCheckingNode(BaseWorkflowNode):
    """
    Node for checking permissions and role-based access control.
    """
    
    def __init__(self):
        super().__init__("permission_checker", "Role-based permission checking")
        
        # Define permission matrix
        self.permission_matrix = {
            "admin": {
                "funder": ["create", "read", "update", "delete"],
                "contribution": ["create", "read", "update", "delete"],
                "state_target": ["create", "read", "update", "delete"],
                "prospect": ["create", "read", "update", "delete"]
            },
            "manager": {
                "funder": ["create", "read", "update"],
                "contribution": ["create", "read", "update"],
                "state_target": ["read", "update"],
                "prospect": ["create", "read", "update"]
            },
            "analyst": {
                "funder": ["read"],
                "contribution": ["read"],
                "state_target": ["read"],
                "prospect": ["read"]
            },
            "viewer": {
                "funder": ["read"],
                "contribution": ["read"],
                "state_target": ["read"],
                "prospect": ["read"]
            }
        }
    
    async def execute(self, state: CRUDState) -> CRUDState:
        """Check permissions for the CRUD operation"""
        self.log_execution(state, f"Checking permissions for {state.operation_type.value} on {state.entity_type}")
        
        # Get user role from metadata (in a real system, this would come from authentication)
        user_role = state.metadata.get("user_role", "viewer")
        
        # Check if operation is allowed
        allowed_operations = self.permission_matrix.get(user_role, {}).get(state.entity_type, [])
        operation_name = state.operation_type.value.lower()
        
        if operation_name in allowed_operations:
            state.permissions_checked = True
            self.log_execution(state, f"Permission granted for {user_role} to {operation_name} {state.entity_type}")
        else:
            # Add permission error to validation results
            permission_error = ValidationResult(
                field="permissions",
                severity=ValidationSeverity.ERROR,
                message=f"User role '{user_role}' does not have permission to {operation_name} {state.entity_type}",
                code="INSUFFICIENT_PERMISSIONS",
                context={"user_role": user_role, "required_permission": operation_name}
            )
            state.add_validation_result(permission_error)
            
            self.log_execution(state, f"Permission denied for {user_role} to {operation_name} {state.entity_type}", "warning")
        
        state.updated_at = datetime.utcnow()
        return state


class OperationExecutionNode(BaseWorkflowNode):
    """
    Node for executing the actual CRUD operation after validation and permission checks.
    """
    
    def __init__(self, repository_factory: RepositoryFactory):
        super().__init__("operation_executor", "Execute CRUD operations")
        self.repository_factory = repository_factory
    
    async def execute(self, state: CRUDState) -> CRUDState:
        """Execute the CRUD operation"""
        self.log_execution(state, f"Executing {state.operation_type.value} operation on {state.entity_type}")
        
        # Check if we should proceed (no validation errors and permissions OK)
        if state.has_validation_errors() or not state.permissions_checked:
            self.log_execution(state, "Skipping operation execution due to validation errors or permission issues", "warning")
            return state
        
        try:
            # Execute the operation based on type
            if state.operation_type == CRUDOperation.CREATE:
                result = await self._execute_create(state)
            elif state.operation_type == CRUDOperation.READ:
                result = await self._execute_read(state)
            elif state.operation_type == CRUDOperation.UPDATE:
                result = await self._execute_update(state)
            elif state.operation_type == CRUDOperation.DELETE:
                result = await self._execute_delete(state)
            else:
                raise ValueError(f"Unknown operation type: {state.operation_type}")
            
            state.set_operation_result(result)
            self.log_execution(state, f"Operation executed successfully")
            
        except Exception as e:
            error_msg = f"Operation execution failed: {e}"
            self.log_execution(state, error_msg, "error")
            
            # Add error to validation results
            error_result = ValidationResult(
                field="operation",
                severity=ValidationSeverity.ERROR,
                message=error_msg,
                code="OPERATION_EXECUTION_FAILED",
                context={"error": str(e)}
            )
            state.add_validation_result(error_result)
        
        state.updated_at = datetime.utcnow()
        return state
    
    async def _execute_create(self, state: CRUDState) -> Dict[str, Any]:
        """Execute CREATE operation"""
        repo = self._get_repository(state.entity_type)
        
        # Add metadata
        entity_data = state.entity_data.copy()
        entity_data["id"] = str(uuid.uuid4())
        entity_data["created_at"] = datetime.utcnow().isoformat()
        entity_data["updated_at"] = datetime.utcnow().isoformat()
        
        # Create the entity (this would depend on your repository implementation)
        # For now, we'll simulate the creation
        created_entity = await repo.create(entity_data)
        
        return {
            "operation": "create",
            "entity_type": state.entity_type,
            "entity_id": entity_data["id"],
            "success": True,
            "created_entity": created_entity.to_dict() if hasattr(created_entity, 'to_dict') else entity_data
        }
    
    async def _execute_read(self, state: CRUDState) -> Dict[str, Any]:
        """Execute READ operation"""
        repo = self._get_repository(state.entity_type)
        
        if state.entity_id:
            # Read specific entity
            entity = await repo.get_by_id(state.entity_id)
            return {
                "operation": "read",
                "entity_type": state.entity_type,
                "entity_id": state.entity_id,
                "success": True,
                "entity": entity.to_dict() if entity and hasattr(entity, 'to_dict') else None
            }
        else:
            # Read all entities
            entities = await repo.get_all()
            return {
                "operation": "read",
                "entity_type": state.entity_type,
                "success": True,
                "entities": [e.to_dict() if hasattr(e, 'to_dict') else e for e in entities],
                "count": len(entities)
            }
    
    async def _execute_update(self, state: CRUDState) -> Dict[str, Any]:
        """Execute UPDATE operation"""
        if not state.entity_id:
            raise ValueError("Entity ID is required for update operation")
        
        repo = self._get_repository(state.entity_type)
        
        # Add update metadata
        entity_data = state.entity_data.copy()
        entity_data["updated_at"] = datetime.utcnow().isoformat()
        
        # Update the entity
        updated_entity = await repo.update(state.entity_id, entity_data)
        
        return {
            "operation": "update",
            "entity_type": state.entity_type,
            "entity_id": state.entity_id,
            "success": True,
            "updated_entity": updated_entity.to_dict() if hasattr(updated_entity, 'to_dict') else entity_data
        }
    
    async def _execute_delete(self, state: CRUDState) -> Dict[str, Any]:
        """Execute DELETE operation"""
        if not state.entity_id:
            raise ValueError("Entity ID is required for delete operation")
        
        repo = self._get_repository(state.entity_type)
        
        # Delete the entity
        success = await repo.delete(state.entity_id)
        
        return {
            "operation": "delete",
            "entity_type": state.entity_type,
            "entity_id": state.entity_id,
            "success": success
        }
    
    def _get_repository(self, entity_type: str):
        """Get the appropriate repository for the entity type"""
        if entity_type == "funder":
            return self.repository_factory.get_funder_repository()
        elif entity_type == "contribution":
            return self.repository_factory.get_contribution_repository()
        elif entity_type == "state_target":
            return self.repository_factory.get_state_target_repository()
        elif entity_type == "prospect":
            return self.repository_factory.get_prospect_repository()
        elif entity_type == "state":
            return self.repository_factory.get_state_repository()
        elif entity_type == "school":
            return self.repository_factory.get_school_repository()
        else:
            raise ValueError(f"Unknown entity type: {entity_type}")


class AuditLoggingNode(BaseWorkflowNode):
    """
    Node for creating audit logs of all CRUD operations for compliance tracking.
    """
    
    def __init__(self):
        super().__init__("audit_logger", "Audit logging for compliance")
    
    async def execute(self, state: CRUDState) -> CRUDState:
        """Create audit log entry for the operation"""
        self.log_execution(state, f"Creating audit log for {state.operation_type.value} on {state.entity_type}")
        
        # Determine what changes were made
        changes = {}
        if state.operation_type == CRUDOperation.CREATE:
            changes = {"action": "created", "new_data": state.entity_data}
        elif state.operation_type == CRUDOperation.UPDATE:
            changes = {"action": "updated", "new_data": state.entity_data}
        elif state.operation_type == CRUDOperation.DELETE:
            changes = {"action": "deleted", "entity_id": state.entity_id}
        elif state.operation_type == CRUDOperation.READ:
            changes = {"action": "accessed", "entity_id": state.entity_id}
        
        # Add operation result info
        if state.operation_result:
            changes["operation_result"] = {
                "success": state.operation_result.get("success", False),
                "timestamp": datetime.utcnow().isoformat()
            }
        
        # Add validation info
        if state.validation_results:
            changes["validation_summary"] = {
                "total_validations": len(state.validation_results),
                "errors": len(state.get_validation_errors()),
                "warnings": len([v for v in state.validation_results if v.severity == ValidationSeverity.WARNING])
            }
        
        # Create audit entry
        state.create_audit_entry(changes)
        
        # In a real system, you would persist this audit entry to a secure audit log
        self.log_execution(state, f"Audit entry created: {state.audit_entry.id}")
        
        state.updated_at = datetime.utcnow()
        return state


class CRUDWorkflow(BaseWorkflow):
    """
    Complete CRUD operations workflow with AI-powered validation, permission checking,
    execution, and audit logging.
    """
    
    def __init__(self, repository_factory: RepositoryFactory):
        super().__init__("crud_operations", "AI-powered CRUD operations workflow")
        self.repository_factory = repository_factory
        
        # Initialize nodes
        self.validator = AIValidationNode()
        self.permission_checker = PermissionCheckingNode()
        self.operation_executor = OperationExecutionNode(repository_factory)
        self.audit_logger = AuditLoggingNode()
        
        # Add nodes to workflow
        self.add_node(self.validator)
        self.add_node(self.permission_checker)
        self.add_node(self.operation_executor)
        self.add_node(self.audit_logger)
    
    def create_workflow(self):
        """Create and compile the CRUD operations workflow"""
        
        # Create state graph
        workflow = StateGraph(CRUDState)
        
        # Add nodes
        workflow.add_node("validate_data", self.validator.execute)
        workflow.add_node("check_permissions", self.permission_checker.execute)
        workflow.add_node("execute_operation", self.operation_executor.execute)
        workflow.add_node("audit_log", self.audit_logger.execute)
        
        # Add edges with conditional routing
        workflow.add_edge(START, "validate_data")
        workflow.add_edge("validate_data", "check_permissions")
        
        # Conditional routing after permission check
        workflow.add_conditional_edges(
            "check_permissions",
            self._should_execute_operation,
            {
                "execute": "execute_operation",
                "audit_only": "audit_log"
            }
        )
        
        workflow.add_edge("execute_operation", "audit_log")
        workflow.add_edge("audit_log", END)
        
        # Compile and return
        return workflow.compile()
    
    def _should_execute_operation(self, state: CRUDState) -> str:
        """Determine if operation should be executed based on validation and permissions"""
        
        # Don't execute if there are validation errors or permission issues
        if state.has_validation_errors() or not state.permissions_checked:
            return "audit_only"
        
        return "execute"
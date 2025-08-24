"""
Base workflow nodes for LangGraph workflows.
Provides foundational node types for building complex workflows.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Union, Callable
from datetime import datetime
import logging
import uuid

from ..models.workflow import AgentState, CRUDState, ChatMessage, MessageRole

logger = logging.getLogger(__name__)


class BaseWorkflowNode(ABC):
    """
    Abstract base class for all workflow nodes.
    Provides common functionality and interface for workflow execution.
    """
    
    def __init__(self, name: str, description: str = ""):
        self.name = name
        self.description = description
        self.node_id = str(uuid.uuid4())
        self.created_at = datetime.utcnow()
        
    @abstractmethod
    async def execute(self, state: Union[AgentState, CRUDState]) -> Union[AgentState, CRUDState]:
        """
        Execute the node logic.
        
        Args:
            state: Current workflow state
            
        Returns:
            Updated workflow state
        """
        pass
    
    def log_execution(self, state: Union[AgentState, CRUDState], message: str, level: str = "info"):
        """Log node execution with context"""
        log_data = {
            "node_name": self.name,
            "node_id": self.node_id,
            "session_id": getattr(state, 'session_id', 'unknown'),
            "workflow_step": getattr(state, 'workflow_step', 'unknown'),
            "message": message
        }
        
        if level == "error":
            logger.error(message, extra=log_data)
        elif level == "warning":
            logger.warning(message, extra=log_data)
        else:
            logger.info(message, extra=log_data)
    
    def update_state_metadata(self, state: Union[AgentState, CRUDState], key: str, value: Any):
        """Update state metadata with node information"""
        if not hasattr(state, 'metadata'):
            state.metadata = {}
        
        state.metadata[key] = value
        state.metadata[f"{self.name}_executed_at"] = datetime.utcnow().isoformat()
        state.updated_at = datetime.utcnow()


class StartNode(BaseWorkflowNode):
    """
    Start node for workflows.
    Initializes workflow state and prepares for execution.
    """
    
    def __init__(self):
        super().__init__("start", "Workflow start node")
    
    async def execute(self, state: Union[AgentState, CRUDState]) -> Union[AgentState, CRUDState]:
        """Initialize workflow execution"""
        self.log_execution(state, f"Starting workflow for session {state.session_id}")
        
        # Update workflow step
        state.update_workflow_step("started")
        
        # Initialize metadata if not present
        if not hasattr(state, 'metadata'):
            state.metadata = {}
        
        # Add workflow start metadata
        self.update_state_metadata(state, "workflow_started", True)
        self.update_state_metadata(state, "start_time", datetime.utcnow().isoformat())
        
        # Clear any previous error state
        if hasattr(state, 'clear_error'):
            state.clear_error()
        
        self.log_execution(state, "Workflow initialization completed")
        return state


class EndNode(BaseWorkflowNode):
    """
    End node for workflows.
    Finalizes workflow execution and cleanup.
    """
    
    def __init__(self):
        super().__init__("end", "Workflow end node")
    
    async def execute(self, state: Union[AgentState, CRUDState]) -> Union[AgentState, CRUDState]:
        """Finalize workflow execution"""
        self.log_execution(state, f"Ending workflow for session {state.session_id}")
        
        # Update workflow step
        state.update_workflow_step("completed")
        
        # Add workflow completion metadata
        self.update_state_metadata(state, "workflow_completed", True)
        self.update_state_metadata(state, "end_time", datetime.utcnow().isoformat())
        
        # Calculate execution time if start time is available
        if hasattr(state, 'metadata') and "start_time" in state.metadata:
            try:
                start_time = datetime.fromisoformat(state.metadata["start_time"])
                execution_time = (datetime.utcnow() - start_time).total_seconds()
                self.update_state_metadata(state, "execution_time_seconds", execution_time)
            except Exception as e:
                self.log_execution(state, f"Error calculating execution time: {e}", "warning")
        
        self.log_execution(state, "Workflow execution completed")
        return state


class ConditionalNode(BaseWorkflowNode):
    """
    Conditional routing node for workflows.
    Routes workflow execution based on state conditions.
    """
    
    def __init__(self, name: str, condition_func: Callable[[Union[AgentState, CRUDState]], str], 
                 routes: Dict[str, str], default_route: str = "end"):
        """
        Initialize conditional node.
        
        Args:
            name: Node name
            condition_func: Function that evaluates state and returns route key
            routes: Dictionary mapping condition results to next node names
            default_route: Default route if condition result not in routes
        """
        super().__init__(name, f"Conditional routing node: {name}")
        self.condition_func = condition_func
        self.routes = routes
        self.default_route = default_route
    
    async def execute(self, state: Union[AgentState, CRUDState]) -> Union[AgentState, CRUDState]:
        """Execute conditional routing"""
        self.log_execution(state, f"Evaluating condition for routing")
        
        try:
            # Evaluate condition
            condition_result = self.condition_func(state)
            
            # Determine next route
            next_route = self.routes.get(condition_result, self.default_route)
            
            # Update state with routing information
            self.update_state_metadata(state, "condition_result", condition_result)
            self.update_state_metadata(state, "next_route", next_route)
            
            self.log_execution(state, f"Condition evaluated to '{condition_result}', routing to '{next_route}'")
            
            return state
            
        except Exception as e:
            error_msg = f"Error in conditional routing: {e}"
            self.log_execution(state, error_msg, "error")
            
            # Set error state and route to default
            if hasattr(state, 'set_error'):
                state.set_error(error_msg)
            
            self.update_state_metadata(state, "routing_error", str(e))
            self.update_state_metadata(state, "next_route", self.default_route)
            
            return state
    
    def get_next_node(self, state: Union[AgentState, CRUDState]) -> str:
        """Get the next node name based on current state"""
        if hasattr(state, 'metadata') and "next_route" in state.metadata:
            return state.metadata["next_route"]
        return self.default_route


class ErrorHandlingNode(BaseWorkflowNode):
    """
    Error handling node for workflows.
    Processes errors and determines recovery strategies.
    """
    
    def __init__(self, recovery_strategies: Optional[Dict[str, Callable]] = None):
        super().__init__("error_handler", "Error handling and recovery node")
        self.recovery_strategies = recovery_strategies or {}
    
    async def execute(self, state: Union[AgentState, CRUDState]) -> Union[AgentState, CRUDState]:
        """Handle errors and attempt recovery"""
        error_state = getattr(state, 'error_state', None)
        
        if not error_state:
            self.log_execution(state, "No error state found, continuing normally")
            return state
        
        self.log_execution(state, f"Handling error: {error_state}")
        
        # Try recovery strategies
        for strategy_name, strategy_func in self.recovery_strategies.items():
            try:
                self.log_execution(state, f"Attempting recovery strategy: {strategy_name}")
                recovered_state = await strategy_func(state)
                
                if recovered_state and not getattr(recovered_state, 'error_state', None):
                    self.log_execution(state, f"Recovery successful with strategy: {strategy_name}")
                    self.update_state_metadata(recovered_state, "recovery_strategy", strategy_name)
                    return recovered_state
                    
            except Exception as e:
                self.log_execution(state, f"Recovery strategy {strategy_name} failed: {e}", "warning")
        
        # If no recovery worked, create error response
        self.log_execution(state, "All recovery strategies failed, creating error response", "error")
        
        # Add error message to conversation if it's an AgentState
        if isinstance(state, AgentState):
            error_message = ChatMessage(
                role=MessageRole.ASSISTANT,
                content=f"I encountered an error: {error_state}. Please try rephrasing your request or contact support if the issue persists.",
                context={"error": True, "original_error": error_state}
            )
            state.add_message(error_message)
        
        # Update metadata with error handling info
        self.update_state_metadata(state, "error_handled", True)
        self.update_state_metadata(state, "original_error", error_state)
        
        return state


class ValidationNode(BaseWorkflowNode):
    """
    Validation node for workflows.
    Validates state data and business rules.
    """
    
    def __init__(self, validators: List[Callable[[Union[AgentState, CRUDState]], bool]]):
        super().__init__("validator", "Data validation node")
        self.validators = validators
    
    async def execute(self, state: Union[AgentState, CRUDState]) -> Union[AgentState, CRUDState]:
        """Execute validation checks"""
        self.log_execution(state, "Starting validation checks")
        
        validation_results = []
        
        for i, validator in enumerate(self.validators):
            try:
                result = validator(state)
                validation_results.append({
                    "validator_index": i,
                    "passed": result,
                    "error": None
                })
                
                if not result:
                    self.log_execution(state, f"Validation {i} failed", "warning")
                
            except Exception as e:
                validation_results.append({
                    "validator_index": i,
                    "passed": False,
                    "error": str(e)
                })
                self.log_execution(state, f"Validation {i} error: {e}", "error")
        
        # Update state with validation results
        self.update_state_metadata(state, "validation_results", validation_results)
        
        # Check if all validations passed
        all_passed = all(result["passed"] for result in validation_results)
        self.update_state_metadata(state, "validation_passed", all_passed)
        
        if all_passed:
            self.log_execution(state, "All validations passed")
        else:
            failed_count = sum(1 for result in validation_results if not result["passed"])
            self.log_execution(state, f"{failed_count} validations failed", "warning")
        
        return state
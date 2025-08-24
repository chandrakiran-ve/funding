"""
LangGraph workflow engine for managing AI workflows.
Provides orchestration and execution of complex multi-step workflows.
"""

from typing import Any, Dict, List, Optional, Union, Callable, Type
from datetime import datetime
import logging
import asyncio
import uuid

from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from langgraph.graph.state import CompiledStateGraph

from ..models.workflow import AgentState, CRUDState, ChatMessage, MessageRole
from .base_nodes import BaseWorkflowNode, StartNode, EndNode, ConditionalNode, ErrorHandlingNode

logger = logging.getLogger(__name__)


class WorkflowEngine:
    """
    Main workflow engine for LangGraph-based AI workflows.
    Manages workflow creation, execution, and state management.
    """
    
    def __init__(self, enable_checkpointing: bool = True):
        """
        Initialize the workflow engine.
        
        Args:
            enable_checkpointing: Whether to enable workflow checkpointing
        """
        self.workflows: Dict[str, Any] = {}  # CompiledStateGraph
        self.workflow_definitions: Dict[str, Dict[str, Any]] = {}
        self.enable_checkpointing = enable_checkpointing
        self.checkpointer = MemorySaver() if enable_checkpointing else None
        self.execution_stats: Dict[str, Dict[str, Any]] = {}
        
        logger.info("WorkflowEngine initialized", extra={
            "checkpointing_enabled": enable_checkpointing,
            "engine_id": id(self)
        })
    
    def register_workflow(self, name: str, workflow_class: Type, **kwargs) -> None:
        """
        Register a workflow with the engine.
        
        Args:
            name: Workflow name
            workflow_class: Workflow class to instantiate
            **kwargs: Additional arguments for workflow initialization
        """
        try:
            # Create workflow instance
            workflow_instance = workflow_class(**kwargs)
            
            # Build the workflow graph
            compiled_workflow = workflow_instance.create_workflow()
            
            # Store workflow
            self.workflows[name] = compiled_workflow
            self.workflow_definitions[name] = {
                "class": workflow_class,
                "kwargs": kwargs,
                "created_at": datetime.utcnow().isoformat(),
                "instance": workflow_instance
            }
            
            # Initialize stats
            self.execution_stats[name] = {
                "total_executions": 0,
                "successful_executions": 0,
                "failed_executions": 0,
                "average_execution_time": 0.0,
                "last_execution": None
            }
            
            logger.info(f"Workflow '{name}' registered successfully", extra={
                "workflow_name": name,
                "workflow_class": workflow_class.__name__
            })
            
        except Exception as e:
            logger.error(f"Failed to register workflow '{name}': {e}", extra={
                "workflow_name": name,
                "error": str(e)
            })
            raise
    
    def get_workflow(self, name: str) -> Optional[Any]:
        """Get a registered workflow by name"""
        return self.workflows.get(name)
    
    def list_workflows(self) -> List[str]:
        """List all registered workflow names"""
        return list(self.workflows.keys())
    
    async def execute_workflow(self, workflow_name: str, initial_state: Union[AgentState, CRUDState], 
                             config: Optional[Dict[str, Any]] = None) -> Union[AgentState, CRUDState]:
        """
        Execute a workflow with the given initial state.
        
        Args:
            workflow_name: Name of the workflow to execute
            initial_state: Initial workflow state
            config: Optional configuration for execution
            
        Returns:
            Final workflow state after execution
        """
        if workflow_name not in self.workflows:
            raise ValueError(f"Workflow '{workflow_name}' not found")
        
        workflow = self.workflows[workflow_name]
        execution_id = str(uuid.uuid4())
        start_time = datetime.utcnow()
        
        logger.info(f"Starting workflow execution", extra={
            "workflow_name": workflow_name,
            "execution_id": execution_id,
            "session_id": getattr(initial_state, 'session_id', 'unknown')
        })
        
        try:
            # Prepare execution config
            execution_config = config or {}
            if self.checkpointer:
                execution_config["checkpointer"] = self.checkpointer
                execution_config["thread_id"] = getattr(initial_state, 'session_id', execution_id)
            
            # Execute workflow
            final_state = None
            async for state in workflow.astream(initial_state, config=execution_config):
                final_state = state
                
                # Log intermediate states if needed
                if hasattr(state, 'workflow_step'):
                    logger.debug(f"Workflow step: {state.workflow_step}", extra={
                        "workflow_name": workflow_name,
                        "execution_id": execution_id,
                        "step": state.workflow_step
                    })
            
            # Update execution statistics
            execution_time = (datetime.utcnow() - start_time).total_seconds()
            self._update_execution_stats(workflow_name, True, execution_time)
            
            logger.info(f"Workflow execution completed successfully", extra={
                "workflow_name": workflow_name,
                "execution_id": execution_id,
                "execution_time": execution_time
            })
            
            return final_state or initial_state
            
        except Exception as e:
            # Update failure statistics
            execution_time = (datetime.utcnow() - start_time).total_seconds()
            self._update_execution_stats(workflow_name, False, execution_time)
            
            logger.error(f"Workflow execution failed: {e}", extra={
                "workflow_name": workflow_name,
                "execution_id": execution_id,
                "error": str(e),
                "execution_time": execution_time
            })
            
            # Set error state if possible
            if hasattr(initial_state, 'set_error'):
                initial_state.set_error(f"Workflow execution failed: {e}")
            
            raise
    
    async def execute_workflow_step(self, workflow_name: str, state: Union[AgentState, CRUDState], 
                                  step_name: str, config: Optional[Dict[str, Any]] = None) -> Union[AgentState, CRUDState]:
        """
        Execute a single step of a workflow.
        
        Args:
            workflow_name: Name of the workflow
            state: Current workflow state
            step_name: Name of the step to execute
            config: Optional configuration
            
        Returns:
            Updated state after step execution
        """
        if workflow_name not in self.workflow_definitions:
            raise ValueError(f"Workflow '{workflow_name}' not found")
        
        workflow_def = self.workflow_definitions[workflow_name]
        workflow_instance = workflow_def["instance"]
        
        # Get the node for the step
        if hasattr(workflow_instance, 'get_node'):
            node = workflow_instance.get_node(step_name)
            if node:
                logger.info(f"Executing workflow step", extra={
                    "workflow_name": workflow_name,
                    "step_name": step_name,
                    "session_id": getattr(state, 'session_id', 'unknown')
                })
                
                return await node.execute(state)
        
        raise ValueError(f"Step '{step_name}' not found in workflow '{workflow_name}'")
    
    def get_workflow_status(self, workflow_name: str) -> Optional[Dict[str, Any]]:
        """Get status and statistics for a workflow"""
        if workflow_name not in self.execution_stats:
            return None
        
        stats = self.execution_stats[workflow_name].copy()
        stats["workflow_name"] = workflow_name
        stats["is_registered"] = workflow_name in self.workflows
        
        if workflow_name in self.workflow_definitions:
            definition = self.workflow_definitions[workflow_name]
            stats["workflow_class"] = definition["class"].__name__
            stats["created_at"] = definition["created_at"]
        
        return stats
    
    def get_all_workflow_status(self) -> Dict[str, Dict[str, Any]]:
        """Get status for all registered workflows"""
        return {name: self.get_workflow_status(name) for name in self.workflows.keys()}
    
    async def health_check(self) -> Dict[str, Any]:
        """Perform health check on the workflow engine"""
        health_status = {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "registered_workflows": len(self.workflows),
            "checkpointing_enabled": self.enable_checkpointing,
            "total_executions": sum(stats["total_executions"] for stats in self.execution_stats.values()),
            "workflows": {}
        }
        
        # Check each workflow
        for workflow_name in self.workflows.keys():
            workflow_status = self.get_workflow_status(workflow_name)
            health_status["workflows"][workflow_name] = {
                "status": "registered",
                "executions": workflow_status["total_executions"],
                "success_rate": (
                    workflow_status["successful_executions"] / max(workflow_status["total_executions"], 1)
                ) * 100
            }
        
        return health_status
    
    def _update_execution_stats(self, workflow_name: str, success: bool, execution_time: float) -> None:
        """Update execution statistics for a workflow"""
        if workflow_name not in self.execution_stats:
            return
        
        stats = self.execution_stats[workflow_name]
        stats["total_executions"] += 1
        stats["last_execution"] = datetime.utcnow().isoformat()
        
        if success:
            stats["successful_executions"] += 1
        else:
            stats["failed_executions"] += 1
        
        # Update average execution time
        total_executions = stats["total_executions"]
        current_avg = stats["average_execution_time"]
        stats["average_execution_time"] = (
            (current_avg * (total_executions - 1) + execution_time) / total_executions
        )
    
    async def shutdown(self) -> None:
        """Shutdown the workflow engine and cleanup resources"""
        logger.info("Shutting down WorkflowEngine")
        
        # Clear workflows and definitions
        self.workflows.clear()
        self.workflow_definitions.clear()
        
        # Clear checkpointer if enabled
        if self.checkpointer:
            # MemorySaver doesn't need explicit cleanup, but we can clear it
            self.checkpointer = None
        
        logger.info("WorkflowEngine shutdown completed")


class BaseWorkflow:
    """
    Base class for creating LangGraph workflows.
    Provides common functionality for workflow creation and management.
    """
    
    def __init__(self, name: str, description: str = ""):
        self.name = name
        self.description = description
        self.nodes: Dict[str, BaseWorkflowNode] = {}
        self.edges: List[Dict[str, Any]] = []
        self.conditional_edges: List[Dict[str, Any]] = []
        
    def add_node(self, node: BaseWorkflowNode) -> None:
        """Add a node to the workflow"""
        self.nodes[node.name] = node
        
    def add_edge(self, from_node: str, to_node: str) -> None:
        """Add a simple edge between nodes"""
        self.edges.append({"from": from_node, "to": to_node})
        
    def add_conditional_edge(self, from_node: str, condition_func: Callable, 
                           routes: Dict[str, str], default: str = END) -> None:
        """Add a conditional edge with routing logic"""
        self.conditional_edges.append({
            "from": from_node,
            "condition": condition_func,
            "routes": routes,
            "default": default
        })
    
    def get_node(self, name: str) -> Optional[BaseWorkflowNode]:
        """Get a node by name"""
        return self.nodes.get(name)
    
    def create_workflow(self) -> Any:
        """
        Create and compile the LangGraph workflow.
        Must be implemented by subclasses.
        """
        raise NotImplementedError("Subclasses must implement create_workflow method")
    
    async def execute_node(self, node_name: str, state: Union[AgentState, CRUDState]) -> Union[AgentState, CRUDState]:
        """Execute a specific node"""
        if node_name not in self.nodes:
            raise ValueError(f"Node '{node_name}' not found in workflow '{self.name}'")
        
        node = self.nodes[node_name]
        return await node.execute(state)


# Global workflow engine instance
_workflow_engine: Optional[WorkflowEngine] = None


def get_workflow_engine() -> WorkflowEngine:
    """Get the global workflow engine instance"""
    global _workflow_engine
    if _workflow_engine is None:
        _workflow_engine = WorkflowEngine()
    return _workflow_engine


def initialize_workflow_engine(enable_checkpointing: bool = True) -> WorkflowEngine:
    """Initialize the global workflow engine"""
    global _workflow_engine
    _workflow_engine = WorkflowEngine(enable_checkpointing=enable_checkpointing)
    return _workflow_engine


async def shutdown_workflow_engine() -> None:
    """Shutdown the global workflow engine"""
    global _workflow_engine
    if _workflow_engine:
        await _workflow_engine.shutdown()
        _workflow_engine = None
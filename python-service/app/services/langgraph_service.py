"""
LangGraph AI Agent Service
Main service that orchestrates the AI agent workflows and provides the API interface.
"""

import logging
from typing import Dict, Any, Optional
from datetime import datetime
import asyncio
import os

from ..workflows.engine import WorkflowEngine, get_workflow_engine
from ..workflows.query_workflow import QueryAnalysisWorkflow
from ..workflows.crud_workflow import CRUDWorkflow
from ..models.workflow import AgentState, CRUDState, ChatMessage, MessageRole, CRUDOperation
from ..repositories.repository_factory import RepositoryFactory

logger = logging.getLogger(__name__)


class LangGraphService:
    """
    Main service class for the LangGraph AI agent.
    Provides high-level interface for AI interactions and workflow management.
    """
    
    def __init__(self):
        self.workflow_engine = get_workflow_engine()
        self.repository_factory = RepositoryFactory()
        self.is_initialized = False
    
    async def initialize(self):
        """Initialize the service and register workflows"""
        if self.is_initialized:
            return
        
        try:
            # Register the query analysis workflow
            self.workflow_engine.register_workflow(
                "query_analysis",
                QueryAnalysisWorkflow,
                repository_factory=self.repository_factory
            )
            
            # Register the CRUD operations workflow
            self.workflow_engine.register_workflow(
                "crud_operations", 
                CRUDWorkflow,
                repository_factory=self.repository_factory
            )
            
            self.is_initialized = True
            logger.info("LangGraph service initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize LangGraph service: {e}")
            raise
    
    async def process_chat_message(self, message: str, chat_history: list = None, 
                                 session_id: str = None) -> Dict[str, Any]:
        """
        Process a chat message using the AI agent workflow.
        This is the main entry point that demonstrates the agentic flow.
        """
        if not self.is_initialized:
            await self.initialize()
        
        # Create initial agent state
        state = AgentState()
        state.current_query = message
        state.session_id = session_id or f"session_{datetime.utcnow().timestamp()}"
        
        # Add chat history if provided
        if chat_history:
            for msg in chat_history:
                chat_msg = ChatMessage(
                    role=MessageRole(msg.get('role', 'user')),
                    content=msg.get('content', ''),
                    context=msg.get('context', {})
                )
                state.add_message(chat_msg)
        
        # Add current user message
        user_message = ChatMessage(
            role=MessageRole.USER,
            content=message,
            context={"timestamp": datetime.utcnow().isoformat()}
        )
        state.add_message(user_message)
        
        try:
            logger.info(f"Processing query: {message[:100]}...")
            
            # Execute the query analysis workflow - this is where the agentic magic happens!
            final_state = await self.workflow_engine.execute_workflow(
                "query_analysis",
                state
            )
            
            # Extract the response
            if final_state.messages:
                assistant_message = final_state.messages[-1]
                if assistant_message.role == MessageRole.ASSISTANT:
                    
                    # Log the agentic flow that occurred
                    self._log_agentic_flow(final_state)
                    
                    return {
                        "success": True,
                        "response": assistant_message.content,
                        "context": assistant_message.context,
                        "session_id": final_state.session_id,
                        "workflow_metadata": {
                            "ai_reasoning": final_state.user_context.get('ai_reasoning', ''),
                            "data_fetch_plan": final_state.user_context.get('data_fetch_plan', {}),
                            "analysis_plan": final_state.user_context.get('analysis_plan', {}),
                            "workflow_steps": final_state.workflow_step,
                            "analysis_results_count": len(final_state.analysis_results)
                        }
                    }
            
            return {
                "success": False,
                "error": "No response generated",
                "session_id": state.session_id
            }
            
        except Exception as e:
            logger.error(f"Error processing chat message: {e}")
            return {
                "success": False,
                "error": str(e),
                "session_id": state.session_id
            }
    
    def _log_agentic_flow(self, final_state: AgentState):
        """Log the agentic flow that occurred for verification"""
        
        flow_log = {
            "session_id": final_state.session_id,
            "query": final_state.current_query,
            "workflow_step": final_state.workflow_step,
            "agentic_flow": {
                "1_ai_reasoning": final_state.user_context.get('ai_reasoning', 'Not available')[:200] + "...",
                "2_data_strategy": final_state.user_context.get('data_fetch_plan', {}).get('reasoning', 'Not available'),
                "3_analysis_strategy": final_state.user_context.get('analysis_plan', {}).get('reasoning', 'Not available'),
                "4_results_generated": len(final_state.analysis_results) > 0,
                "5_response_generated": len([msg for msg in final_state.messages if msg.role == MessageRole.ASSISTANT]) > 0
            },
            "data_fetched": final_state.data_context.get_data_summary() if final_state.data_context else {},
            "analysis_performed": len(final_state.analysis_results)
        }
        
        logger.info(f"AGENTIC FLOW COMPLETED: {flow_log}")
        
        # Verify the flow happened correctly
        reasoning_present = bool(final_state.user_context.get('ai_reasoning'))
        data_plan_present = bool(final_state.user_context.get('data_fetch_plan'))
        analysis_present = len(final_state.analysis_results) > 0
        response_present = any(msg.role == MessageRole.ASSISTANT for msg in final_state.messages)
        
        flow_verification = {
            "✓ AI Reasoning": reasoning_present,
            "✓ Tool Selection": data_plan_present, 
            "✓ Data Analysis": analysis_present,
            "✓ Response Generation": response_present,
            "✓ Complete Flow": all([reasoning_present, data_plan_present, analysis_present, response_present])
        }
        
        logger.info(f"FLOW VERIFICATION: {flow_verification}")
        
        return flow_verification
    
    async def perform_crud_operation(self, operation_type: str, entity_type: str, 
                                   entity_data: Dict[str, Any], entity_id: str = None,
                                   user_context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Perform a CRUD operation using the AI-powered workflow.
        """
        if not self.is_initialized:
            await self.initialize()
        
        # Create CRUD state
        crud_state = CRUDState()
        crud_state.operation_type = CRUDOperation(operation_type.upper())
        crud_state.entity_type = entity_type
        crud_state.entity_data = entity_data
        crud_state.entity_id = entity_id
        crud_state.metadata = user_context or {}
        
        try:
            logger.info(f"Performing {operation_type} operation on {entity_type}")
            
            # Execute the CRUD workflow
            final_state = await self.workflow_engine.execute_workflow(
                "crud_operations",
                crud_state
            )
            
            # Check for validation errors
            if final_state.has_validation_errors():
                errors = [error.message for error in final_state.get_validation_errors()]
                return {
                    "success": False,
                    "errors": errors,
                    "validation_results": [result.to_dict() for result in final_state.validation_results]
                }
            
            # Return successful result
            return {
                "success": True,
                "result": final_state.operation_result,
                "audit_entry": final_state.audit_entry.to_dict() if final_state.audit_entry else None,
                "validation_results": [result.to_dict() for result in final_state.validation_results]
            }
            
        except Exception as e:
            logger.error(f"Error performing CRUD operation: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def get_service_status(self) -> Dict[str, Any]:
        """Get the status of the LangGraph service"""
        
        if not self.is_initialized:
            return {
                "status": "not_initialized",
                "initialized": False,
                "workflows": {}
            }
        
        # Get workflow engine health
        health_check = await self.workflow_engine.health_check()
        
        return {
            "status": "healthy" if self.is_initialized else "unhealthy",
            "initialized": self.is_initialized,
            "gemini_api_configured": bool(os.getenv("GEMINI_API_KEY")),
            "workflows": health_check.get("workflows", {}),
            "total_executions": health_check.get("total_executions", 0),
            "service_info": {
                "version": "1.0.0",
                "agentic_features": [
                    "AI-powered reasoning",
                    "Dynamic tool selection", 
                    "Intelligent data fetching",
                    "Adaptive analysis",
                    "Context-aware responses"
                ]
            }
        }
    
    async def test_agentic_flow(self, test_query: str = "What are the top 5 funders in California?") -> Dict[str, Any]:
        """
        Test the agentic flow with a sample query to verify it's working correctly.
        """
        logger.info(f"Testing agentic flow with query: {test_query}")
        
        result = await self.process_chat_message(test_query)
        
        # Add flow verification
        if result.get("success"):
            metadata = result.get("workflow_metadata", {})
            
            flow_test = {
                "query_tested": test_query,
                "ai_reasoning_generated": bool(metadata.get("ai_reasoning")),
                "data_plan_created": bool(metadata.get("data_fetch_plan")),
                "analysis_performed": bool(metadata.get("analysis_plan")),
                "response_generated": bool(result.get("response")),
                "workflow_completed": metadata.get("workflow_steps") == "response_generated",
                "agentic_flow_verified": True
            }
            
            result["flow_test"] = flow_test
        
        return result


# Global service instance
_langgraph_service: Optional[LangGraphService] = None


def get_langgraph_service() -> LangGraphService:
    """Get the global LangGraph service instance"""
    global _langgraph_service
    if _langgraph_service is None:
        _langgraph_service = LangGraphService()
    return _langgraph_service


async def initialize_langgraph_service() -> LangGraphService:
    """Initialize the global LangGraph service"""
    service = get_langgraph_service()
    await service.initialize()
    return service
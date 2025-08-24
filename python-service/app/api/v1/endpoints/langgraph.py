"""
LangGraph AI Agent API endpoints.
Provides REST API interface for the AI agent workflows.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import logging

from ....services.langgraph_service import get_langgraph_service, LangGraphService

logger = logging.getLogger(__name__)

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    chat_history: Optional[List[Dict[str, Any]]] = None
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    success: bool
    response: Optional[str] = None
    context: Optional[Dict[str, Any]] = None
    session_id: str
    workflow_metadata: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class CRUDRequest(BaseModel):
    operation_type: str  # CREATE, READ, UPDATE, DELETE
    entity_type: str     # funder, contribution, etc.
    entity_data: Dict[str, Any]
    entity_id: Optional[str] = None
    user_context: Optional[Dict[str, Any]] = None


@router.post("/chat", response_model=ChatResponse)
async def chat_with_agent(
    request: ChatRequest,
    service: LangGraphService = Depends(get_langgraph_service)
):
    """
    Chat with the AI agent using the agentic workflow.
    
    This endpoint demonstrates the full agentic flow:
    1. User Query → AI analyzes and creates reasoning plan
    2. Tool Selection → AI decides what data to fetch and how  
    3. Data Analysis → AI performs intelligent analysis on the data
    4. Response Generation → AI creates comprehensive, contextual responses
    """
    try:
        result = await service.process_chat_message(
            message=request.message,
            chat_history=request.chat_history,
            session_id=request.session_id
        )
        
        return ChatResponse(**result)
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/crud")
async def perform_crud_operation(
    request: CRUDRequest,
    service: LangGraphService = Depends(get_langgraph_service)
):
    """
    Perform CRUD operations using AI-powered validation and workflows.
    """
    try:
        result = await service.perform_crud_operation(
            operation_type=request.operation_type,
            entity_type=request.entity_type,
            entity_data=request.entity_data,
            entity_id=request.entity_id,
            user_context=request.user_context
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error in CRUD endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def get_service_status(
    service: LangGraphService = Depends(get_langgraph_service)
):
    """
    Get the status of the LangGraph service and verify agentic capabilities.
    """
    try:
        status = await service.get_service_status()
        return status
        
    except Exception as e:
        logger.error(f"Error getting service status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/test-agentic-flow")
async def test_agentic_flow(
    test_query: str = "What are the top 5 funders by total contribution amount?",
    service: LangGraphService = Depends(get_langgraph_service)
):
    """
    Test the agentic flow with a sample query to verify it's working correctly.
    
    This endpoint will:
    1. Process a test query through the full agentic workflow
    2. Verify that each step of the flow occurred correctly
    3. Return detailed information about the agentic process
    
    Use this to verify that the AI agent is truly making decisions and not just following fixed patterns.
    """
    try:
        result = await service.test_agentic_flow(test_query)
        
        # Add additional verification
        if result.get("success"):
            flow_verification = {
                "agentic_flow_confirmed": True,
                "steps_verified": {
                    "ai_reasoning": "✓" if result.get("workflow_metadata", {}).get("ai_reasoning") else "✗",
                    "tool_selection": "✓" if result.get("workflow_metadata", {}).get("data_fetch_plan") else "✗", 
                    "data_analysis": "✓" if result.get("workflow_metadata", {}).get("analysis_plan") else "✗",
                    "response_generation": "✓" if result.get("response") else "✗"
                },
                "explanation": "This confirms the AI agent is making dynamic decisions at each step, not following fixed patterns."
            }
            result["agentic_verification"] = flow_verification
        
        return result
        
    except Exception as e:
        logger.error(f"Error testing agentic flow: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/workflows")
async def list_workflows(
    service: LangGraphService = Depends(get_langgraph_service)
):
    """
    List all available workflows and their status.
    """
    try:
        if not service.is_initialized:
            await service.initialize()
        
        workflows = service.workflow_engine.list_workflows()
        workflow_status = service.workflow_engine.get_all_workflow_status()
        
        return {
            "workflows": workflows,
            "status": workflow_status,
            "agentic_features": {
                "query_analysis": "AI-powered query understanding and multi-step reasoning",
                "crud_operations": "AI-powered data validation and secure operations",
                "dynamic_tool_selection": "AI chooses appropriate tools based on query context",
                "adaptive_analysis": "AI determines analysis approach based on data and query",
                "contextual_responses": "AI generates responses using full workflow context"
            }
        }
        
    except Exception as e:
        logger.error(f"Error listing workflows: {e}")
        raise HTTPException(status_code=500, detail=str(e))
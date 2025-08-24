"""
LangGraph AI Agent implementation following official LangGraph patterns.
Based on: https://langchain-ai.github.io/langgraph/concepts/why-langgraph/

This is a complete rewrite following the detailed agent steering documentation
for proper agentic workflows with dynamic tool selection and multi-step reasoning.
"""

import json
import os
from typing import Annotated, Dict, List, Any, Optional, TypedDict
from datetime import datetime
import logging
import asyncio

from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage, ToolMessage
from langchain_core.tools import tool
from langchain_google_genai import ChatGoogleGenerativeAI

from ..repositories.repository_factory import RepositoryFactory

logger = logging.getLogger(__name__)


class State(TypedDict):
    """
    State schema for the LangGraph agent following official patterns.
    Uses add_messages reducer to ensure message lists grow over time—critical for memory and multi-step logic.
    """
    messages: Annotated[List[BaseMessage], add_messages]  # Reducer appends, not overwrites


# Initialize repository factory globally for tools
_repository_factory: Optional[RepositoryFactory] = None

def set_repository_factory(factory: RepositoryFactory):
    """Set the global repository factory for tools"""
    global _repository_factory
    _repository_factory = factory

def get_repository_factory() -> RepositoryFactory:
    """Get the global repository factory"""
    global _repository_factory
    if _repository_factory is None:
        _repository_factory = RepositoryFactory()
    return _repository_factory

# Define tools as standalone functions following LangGraph patterns
@tool
def get_funders_data(filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """
    Fetch funder data from Google Sheets.
    
    Args:
        filters: Optional filters to apply (e.g., {'state': 'CA', 'name_contains': 'Microsoft'})
    
    Returns:
        List of funder records from Google Sheets
    """
    try:
        logger.info(f"🔧 Tool: get_funders_data called with filters: {filters}")
        
        # Get repository factory and funder repository
        repo_factory = get_repository_factory()
        funder_repo = repo_factory.funder_repository
        
        # Run async method in sync context
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        funders = loop.run_until_complete(funder_repo.get_all())
        
        # Convert to dict format
        funder_data = []
        for funder in funders:
            funder_dict = funder.to_dict() if hasattr(funder, 'to_dict') else funder.__dict__
            funder_data.append(funder_dict)
        
        # Apply filters if provided
        if filters:
            filtered_funders = []
            for funder in funder_data:
                matches = True
                
                # Handle different filter types
                for key, value in filters.items():
                    if key == "name_contains" and value.lower() not in funder.get("name", "").lower():
                        matches = False
                        break
                    elif key == "state" and funder.get("state") != value:
                        matches = False
                        break
                    elif key == "min_amount" and funder.get("total_contributions", 0) < value:
                        matches = False
                        break
                    elif key in funder and funder[key] != value:
                        matches = False
                        break
                
                if matches:
                    filtered_funders.append(funder)
            
            logger.info(f"✅ Tool result: Filtered {len(funder_data)} funders to {len(filtered_funders)} results")
            return filtered_funders
        
        logger.info(f"✅ Tool result: Retrieved {len(funder_data)} funders from Google Sheets")
        return funder_data
        
    except Exception as e:
        logger.error(f"❌ Tool error: Error fetching funders from Google Sheets: {e}")
        return []
@tool
def get_contributions_data(filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """
    Fetch contribution data from Google Sheets.
    
    Args:
        filters: Optional filters (e.g., {'state_code': 'CA', 'fiscal_year': '2024', 'funder_name_contains': 'Microsoft'})
    
    Returns:
        List of contribution records from Google Sheets
    """
    try:
        logger.info(f"🔧 Tool: get_contributions_data called with filters: {filters}")
        
        # Get repository factory and contribution repository
        repo_factory = get_repository_factory()
        contribution_repo = repo_factory.contribution_repository
        
        # Run async method in sync context
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        contributions = loop.run_until_complete(contribution_repo.get_all())
        
        # Convert to dict format
        contribution_data = []
        for contribution in contributions:
            contrib_dict = contribution.to_dict() if hasattr(contribution, 'to_dict') else contribution.__dict__
            contribution_data.append(contrib_dict)
        
        # Apply filters if provided
        if filters:
            filtered_contributions = []
            for contrib in contribution_data:
                matches = True
                
                # Handle different filter types
                for key, value in filters.items():
                    if key == "funder_name_contains":
                        # Check if funder name contains the value (case insensitive)
                        funder_name = contrib.get("funder_name", "")
                        if value.lower() not in funder_name.lower():
                            matches = False
                            break
                    elif key == "year_range":
                        # Handle year range filtering (e.g., last 3 years)
                        fiscal_year = contrib.get("fiscal_year", "")
                        try:
                            year = int(fiscal_year) if fiscal_year else 0
                            current_year = 2024  # You might want to use datetime.now().year
                            if year < (current_year - value + 1):
                                matches = False
                                break
                        except ValueError:
                            matches = False
                            break
                    elif key in contrib and contrib[key] != value:
                        matches = False
                        break
                
                if matches:
                    filtered_contributions.append(contrib)
            
            logger.info(f"✅ Tool result: Filtered {len(contribution_data)} contributions to {len(filtered_contributions)} results")
            return filtered_contributions
        
        logger.info(f"✅ Tool result: Retrieved {len(contribution_data)} contributions from Google Sheets")
        return contribution_data
        
    except Exception as e:
        logger.error(f"❌ Tool error: Error fetching contributions from Google Sheets: {e}")
        return []
@tool
def calculate_metrics(data: List[Dict[str, Any]], metric_type: str) -> Dict[str, Any]:
    """
    Calculate various metrics from data.
    
    Args:
        data: List of data records
        metric_type: Type of metric to calculate ('sum', 'average', 'count', 'top_n')
    
    Returns:
        Dictionary containing calculated metrics
    """
    try:
        if not data:
            return {"error": "No data provided"}
        
        logger.info(f"🔧 Tool: calculate_metrics called with {metric_type} for {len(data)} records")
        
        if metric_type == "sum":
            # Sum numeric fields
            numeric_sums = {}
            for record in data:
                for key, value in record.items():
                    if isinstance(value, (int, float)):
                        if key not in numeric_sums:
                            numeric_sums[key] = 0
                        numeric_sums[key] += value
            logger.info(f"✅ Tool result: Calculated sums for {len(numeric_sums)} numeric fields")
            return {"sums": numeric_sums, "total_records": len(data)}
        
        elif metric_type == "top_n":
            # Find top performers by amount
            if data and "amount" in data[0]:
                sorted_data = sorted(data, key=lambda x: x.get("amount", 0), reverse=True)
                logger.info(f"✅ Tool result: Ranked {len(data)} records by amount")
                return {"top_records": sorted_data[:5], "total_records": len(data)}
            elif data and "total_contributions" in data[0]:
                sorted_data = sorted(data, key=lambda x: x.get("total_contributions", 0), reverse=True)
                logger.info(f"✅ Tool result: Ranked {len(data)} records by total_contributions")
                return {"top_records": sorted_data[:5], "total_records": len(data)}
            else:
                return {"error": "No amount field found for ranking"}
        
        elif metric_type == "count":
            # Count by categories
            field_counts = {}
            for record in data:
                for key, value in record.items():
                    if isinstance(value, str):
                        if key not in field_counts:
                            field_counts[key] = {}
                        if value not in field_counts[key]:
                            field_counts[key][value] = 0
                        field_counts[key][value] += 1
            logger.info(f"✅ Tool result: Counted categories for {len(field_counts)} fields")
            return {"counts": field_counts, "total_records": len(data)}
        
        else:
            return {"error": f"Unknown metric type: {metric_type}"}
            
    except Exception as e:
        logger.error(f"❌ Tool error: Error calculating metrics: {e}")
        return {"error": str(e)}


# Create the list of available tools
tools = [get_funders_data, get_contributions_data, calculate_metrics]


def create_fundraising_agent(repository_factory: RepositoryFactory):
    """
    Create a LangGraph-based AI agent following official patterns.
    This follows the step-by-step guide from the agent steering documentation.
    """
    
    # Step 1: Set up repository factory for tools
    set_repository_factory(repository_factory)
    
    # Step 2: Initialize LLM with tool support
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable is required")
    
    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        google_api_key=api_key,
        temperature=0.1,
        max_tokens=2048
    )
    
    # Step 3: Bind tools to LLM (tells the LLM how to call tools in JSON)
    llm_with_tools = llm.bind_tools(tools)
    
    # Step 4: Create a StateGraph
    graph_builder = StateGraph(State)
    
    # Step 5: Add nodes
    def chatbot(state: State):
        """
        Chatbot node that processes messages and decides whether to use tools.
        This is where the AI makes dynamic decisions about tool usage.
        """
        # Create system message for fundraising context
        system_message = SystemMessage(content="""You are an intelligent AI assistant for a fundraising intelligence platform. 

You help users analyze fundraising data, answer questions about funders and contributions, and provide actionable insights.

Available tools:
- get_funders_data: Fetch funder information with optional filters like state, name_contains, min_amount
- get_contributions_data: Fetch contribution records with optional filters like state_code, fiscal_year, funder_name_contains  
- calculate_metrics: Calculate various metrics (sum, top_n, count) from data

When a user asks a question:
1. Think about what data you need to answer their question
2. Use the appropriate tools to fetch that data with relevant filters
3. Analyze the data to extract insights
4. Provide a comprehensive, data-driven response with specific numbers

Always use actual data from the tools to support your answers. Be specific with numbers and provide actionable recommendations when appropriate.

Examples of good tool usage:
- For "top funders in California": use get_funders_data({"state": "CA"}) then calculate_metrics(data, "top_n")
- For "Microsoft contributions": use get_contributions_data({"funder_name_contains": "Microsoft"})
- For "total contributions by state": use get_contributions_data() then calculate_metrics(data, "sum")""")
        
        messages = [system_message] + state["messages"]
        
        # Call the model - this is where AI decides what tools to use
        response = llm_with_tools.invoke(messages)
        
        # Log AI decision making
        if hasattr(response, 'tool_calls') and response.tool_calls:
            tool_names = [tc['name'] for tc in response.tool_calls]
            logger.info(f"🧠 AI decided to use tools: {tool_names}")
        else:
            logger.info(f"💬 AI generating final response")
        
        return {"messages": [response]}
    
    # Add the chatbot node
    graph_builder.add_node("chatbot", chatbot)
    
    # Step 6: Create tool node using prebuilt ToolNode for parallel execution
    tool_node = ToolNode(tools)
    graph_builder.add_node("tools", tool_node)
    
    # Step 7: Add entry point
    graph_builder.add_edge(START, "chatbot")
    
    # Step 8: Add conditional edges using prebuilt tools_condition
    graph_builder.add_conditional_edges("chatbot", tools_condition)
    
    # Step 9: Add edge from tools back to chatbot (allows looping)
    graph_builder.add_edge("tools", "chatbot")
    
    # Step 10: Compile the graph
    graph = graph_builder.compile()
    
    logger.info("✅ LangGraph agent created successfully following official patterns")
    
    return graph


class FundraisingAgent:
    """
    LangGraph-based AI agent for fundraising intelligence.
    Completely rewritten following official LangGraph patterns and agent steering documentation.
    """
    
    def __init__(self, repository_factory: RepositoryFactory):
        self.repository_factory = repository_factory
        
        # Create the LangGraph workflow
        self.graph = create_fundraising_agent(repository_factory)
        
        logger.info("🎯 FundraisingAgent initialized with proper LangGraph patterns")
    def stream_graph_updates(self, user_input: str):
        """
        Stream graph updates for real-time feedback following official patterns.
        This demonstrates the agentic flow with live updates.
        """
        for event in self.graph.stream({"messages": [HumanMessage(content=user_input)]}):
            for value in event.values():
                if "messages" in value and value["messages"]:
                    last_message = value["messages"][-1]
                    if hasattr(last_message, 'content') and last_message.content:
                        yield f"Assistant: {last_message.content}"
    
    async def process_query(self, query: str, session_id: str = None) -> Dict[str, Any]:
        """
        Process a user query through the LangGraph workflow.
        
        This demonstrates the true agentic flow following official patterns:
        1. User Query → AI analyzes and decides what tools to use
        2. Tool Selection → AI dynamically selects appropriate tools
        3. Data Analysis → AI processes the data intelligently  
        4. Response Generation → AI creates comprehensive responses
        """
        
        # Create initial state following LangGraph patterns
        initial_state = {
            "messages": [HumanMessage(content=query)]
        }
        
        try:
            logger.info(f"🎯 Processing query: {query}")
            
            # Run the graph - this is where the agentic magic happens!
            final_state = None
            step_count = 0
            tools_used = []
            
            for step in self.graph.stream(initial_state):
                step_count += 1
                logger.info(f"📊 Step {step_count}: {list(step.keys())}")
                final_state = step
                
                # Log the agentic decision-making process
                if "chatbot" in step:
                    chatbot_output = step["chatbot"]
                    if "messages" in chatbot_output:
                        last_msg = chatbot_output["messages"][-1]
                        if hasattr(last_msg, 'tool_calls') and last_msg.tool_calls:
                            tool_names = [tc['name'] for tc in last_msg.tool_calls]
                            tools_used.extend(tool_names)
                            logger.info(f"🧠 AI decided to use tools: {tool_names}")
                        else:
                            logger.info(f"💬 AI generated response: {last_msg.content[:100]}...")
                
                if "tools" in step:
                    logger.info(f"🔧 Tools executed successfully")
            
            # Extract the final response
            if final_state:
                # Get the last state from the final step
                state_key = list(final_state.keys())[0]
                final_agent_state = final_state[state_key]
                
                messages = final_agent_state.get("messages", [])
                if messages:
                    # Find the last AI message (not tool message)
                    last_ai_message = None
                    for msg in reversed(messages):
                        if isinstance(msg, AIMessage) and msg.content:
                            last_ai_message = msg
                            break
                    
                    if last_ai_message:
                        return {
                            "success": True,
                            "response": last_ai_message.content,
                            "session_id": session_id or f"session_{datetime.utcnow().timestamp()}",
                            "agentic_flow": {
                                "steps_executed": step_count,
                                "tools_used": list(set(tools_used)),  # Remove duplicates
                                "ai_reasoning": "AI dynamically selected tools and analyzed data based on query",
                                "flow_confirmed": True,
                                "pattern_type": "Dynamic tool selection with multi-step reasoning"
                            }
                        }
            
            return {
                "success": False,
                "error": "No response generated",
                "session_id": session_id or "unknown"
            }
            
        except Exception as e:
            logger.error(f"❌ Error processing query: {e}")
            return {
                "success": False,
                "error": str(e),
                "session_id": session_id or "unknown"
            }
    
    def get_graph_visualization(self) -> str:
        """Get a text representation of the graph structure"""
        return """
🎯 LangGraph AI Agent Structure (Following Official Patterns):

START → chatbot → [tools_condition?] → tools → chatbot → END
                        ↓
                       END

Nodes:
- chatbot: AI model that analyzes queries and decides what tools to use
- tools: Executes the tools selected by the AI (parallel execution supported)

Agentic Flow:
1. 🧠 AI analyzes user query and decides what data is needed
2. 🔧 AI selects appropriate tools with relevant filters
3. 📊 Tools execute and return data
4. 🧠 AI processes tool results and decides if more tools are needed
5. 💬 AI generates comprehensive, data-driven response

This creates TRUE AGENTIC BEHAVIOR where the AI makes dynamic decisions
at each step rather than following fixed patterns!
"""


# Global agent instance
_fundraising_agent: Optional[FundraisingAgent] = None


def get_fundraising_agent(repository_factory: RepositoryFactory = None) -> FundraisingAgent:
    """
    Get the global fundraising agent instance.
    Creates a new agent following proper LangGraph patterns if none exists.
    """
    global _fundraising_agent
    if _fundraising_agent is None:
        if repository_factory is None:
            repository_factory = RepositoryFactory()
        _fundraising_agent = FundraisingAgent(repository_factory)
        logger.info("✅ Global FundraisingAgent instance created")
    return _fundraising_agent


def reset_fundraising_agent():
    """Reset the global agent instance (useful for testing)"""
    global _fundraising_agent
    _fundraising_agent = None
    logger.info("🔄 Global FundraisingAgent instance reset")
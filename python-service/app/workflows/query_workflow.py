"""
AI Agent workflow using Gemini AI for intelligent query processing.
Implements true agentic behavior with dynamic reasoning, tool selection, and multi-step conversations.
"""

from typing import Any, Dict, List, Optional, Union, Callable
from datetime import datetime
import logging
import asyncio
import json
import os

from langgraph.graph import StateGraph, START, END
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.tools import tool
from langchain_core.prompts import ChatPromptTemplate

from ..models.workflow import (
    AgentState, ChatMessage, MessageRole, AnalysisResult, AnalysisType, DataContext
)
from ..repositories.repository_factory import RepositoryFactory
from .base_nodes import BaseWorkflowNode
from .engine import BaseWorkflow

logger = logging.getLogger(__name__)


class AIAgentTools:
    """
    Tools available to the AI agent for data operations and analysis.
    These tools allow the agent to dynamically fetch and analyze data.
    """
    
    def __init__(self, repository_factory: RepositoryFactory):
        self.repository_factory = repository_factory
    
    @tool
    async def get_funders_data(self, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Fetch funder data from the database.
        
        Args:
            filters: Optional filters to apply (e.g., {'state': 'CA', 'min_amount': 1000})
        
        Returns:
            List of funder records
        """
        try:
            funder_repo = self.repository_factory.get_funder_repository()
            funders = await funder_repo.get_all()
            
            # Apply filters if provided
            if filters:
                filtered_funders = []
                for funder in funders:
                    funder_dict = funder.to_dict()
                    matches = True
                    
                    for key, value in filters.items():
                        if key in funder_dict and funder_dict[key] != value:
                            matches = False
                            break
                    
                    if matches:
                        filtered_funders.append(funder_dict)
                
                return filtered_funders
            
            return [funder.to_dict() for funder in funders]
            
        except Exception as e:
            logger.error(f"Error fetching funders: {e}")
            return []
    
    @tool
    async def get_contributions_data(self, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Fetch contribution data from the database.
        
        Args:
            filters: Optional filters (e.g., {'state_code': 'CA', 'fiscal_year': '2024'})
        
        Returns:
            List of contribution records
        """
        try:
            contribution_repo = self.repository_factory.get_contribution_repository()
            contributions = await contribution_repo.get_all()
            
            # Apply filters if provided
            if filters:
                filtered_contributions = []
                for contribution in contributions:
                    contrib_dict = contribution.to_dict()
                    matches = True
                    
                    for key, value in filters.items():
                        if key in contrib_dict and contrib_dict[key] != value:
                            matches = False
                            break
                    
                    if matches:
                        filtered_contributions.append(contrib_dict)
                
                return filtered_contributions
            
            return [contribution.to_dict() for contribution in contributions]
            
        except Exception as e:
            logger.error(f"Error fetching contributions: {e}")
            return []
    
    @tool
    async def get_states_data(self, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Fetch state data from the database.
        
        Args:
            filters: Optional filters (e.g., {'region': 'West'})
        
        Returns:
            List of state records
        """
        try:
            state_repo = self.repository_factory.get_state_repository()
            states = await state_repo.get_all()
            
            if filters:
                filtered_states = []
                for state in states:
                    state_dict = state.to_dict()
                    matches = True
                    
                    for key, value in filters.items():
                        if key in state_dict and state_dict[key] != value:
                            matches = False
                            break
                    
                    if matches:
                        filtered_states.append(state_dict)
                
                return filtered_states
            
            return [state.to_dict() for state in states]
            
        except Exception as e:
            logger.error(f"Error fetching states: {e}")
            return []
    
    @tool
    async def get_state_targets_data(self, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Fetch state target data from the database.
        
        Args:
            filters: Optional filters (e.g., {'fiscal_year': '2024'})
        
        Returns:
            List of state target records
        """
        try:
            target_repo = self.repository_factory.get_state_target_repository()
            targets = await target_repo.get_all()
            
            if filters:
                filtered_targets = []
                for target in targets:
                    target_dict = target.to_dict()
                    matches = True
                    
                    for key, value in filters.items():
                        if key in target_dict and target_dict[key] != value:
                            matches = False
                            break
                    
                    if matches:
                        filtered_targets.append(target_dict)
                
                return filtered_targets
            
            return [target.to_dict() for target in targets]
            
        except Exception as e:
            logger.error(f"Error fetching state targets: {e}")
            return []
    
    @tool
    async def get_prospects_data(self, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Fetch prospect data from the database.
        
        Args:
            filters: Optional filters (e.g., {'stage': 'qualified'})
        
        Returns:
            List of prospect records
        """
        try:
            prospect_repo = self.repository_factory.get_prospect_repository()
            prospects = await prospect_repo.get_all()
            
            if filters:
                filtered_prospects = []
                for prospect in prospects:
                    prospect_dict = prospect.to_dict()
                    matches = True
                    
                    for key, value in filters.items():
                        if key in prospect_dict and prospect_dict[key] != value:
                            matches = False
                            break
                    
                    if matches:
                        filtered_prospects.append(prospect_dict)
                
                return filtered_prospects
            
            return [prospect.to_dict() for prospect in prospects]
            
        except Exception as e:
            logger.error(f"Error fetching prospects: {e}")
            return []
    
    @tool
    async def calculate_metrics(self, data: List[Dict[str, Any]], metric_type: str) -> Dict[str, Any]:
        """
        Calculate various metrics from data.
        
        Args:
            data: List of data records
            metric_type: Type of metric to calculate ('sum', 'average', 'count', 'top_n', 'trend')
        
        Returns:
            Dictionary containing calculated metrics
        """
        try:
            if not data:
                return {"error": "No data provided"}
            
            if metric_type == "sum":
                # Sum numeric fields
                numeric_fields = {}
                for record in data:
                    for key, value in record.items():
                        if isinstance(value, (int, float)):
                            if key not in numeric_fields:
                                numeric_fields[key] = 0
                            numeric_fields[key] += value
                return {"sums": numeric_fields, "total_records": len(data)}
            
            elif metric_type == "average":
                # Calculate averages
                numeric_fields = {}
                counts = {}
                for record in data:
                    for key, value in record.items():
                        if isinstance(value, (int, float)):
                            if key not in numeric_fields:
                                numeric_fields[key] = 0
                                counts[key] = 0
                            numeric_fields[key] += value
                            counts[key] += 1
                
                averages = {key: total / counts[key] for key, total in numeric_fields.items() if counts[key] > 0}
                return {"averages": averages, "total_records": len(data)}
            
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
                return {"counts": field_counts, "total_records": len(data)}
            
            elif metric_type == "top_n":
                # Find top performers (assuming 'amount' field exists)
                if 'amount' in data[0]:
                    sorted_data = sorted(data, key=lambda x: x.get('amount', 0), reverse=True)
                    return {"top_10": sorted_data[:10], "total_records": len(data)}
                else:
                    return {"error": "No 'amount' field found for ranking"}
            
            else:
                return {"error": f"Unknown metric type: {metric_type}"}
                
        except Exception as e:
            logger.error(f"Error calculating metrics: {e}")
            return {"error": str(e)}


class AIReasoningNode(BaseWorkflowNode):
    """
    AI reasoning node that uses Gemini AI to understand queries and make decisions.
    This is the core agentic component that determines what actions to take.
    """
    
    def __init__(self, tools: AIAgentTools):
        super().__init__("ai_reasoner", "AI reasoning and decision making")
        self.tools = tools
        
        # Initialize Gemini AI
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-pro",
            google_api_key=api_key,
            temperature=0.1,
            max_tokens=2048
        )
        
        # System prompt for the AI agent
        self.system_prompt = """You are an intelligent AI agent for a fundraising intelligence platform. You are designed to think step-by-step and create detailed plans to answer user queries.

AVAILABLE TOOLS:
- get_funders_data(filters): Fetch funder information with optional filters
- get_contributions_data(filters): Fetch contribution records with optional filters
- get_states_data(filters): Fetch state information with optional filters  
- get_state_targets_data(filters): Fetch state target data with optional filters
- get_prospects_data(filters): Fetch prospect information with optional filters
- calculate_metrics(data, metric_type): Calculate metrics (sum, average, count, top_n, trend)

YOUR REASONING PROCESS:
1. **UNDERSTAND**: Analyze the user's question - what exactly are they asking?
2. **PLAN**: Create a step-by-step plan to answer their question
3. **DATA STRATEGY**: Determine what specific data you need and why
4. **ANALYSIS STRATEGY**: Plan what calculations/analysis will provide the answer
5. **RESPONSE STRATEGY**: Plan how to present the findings clearly

CONTEXT:
- Current conversation: {context}
- User query: "{query}"

TASK: Create a detailed reasoning plan that explains:
1. What the user is asking for (be specific)
2. What data you need to fetch and why
3. What analysis you'll perform on that data
4. How this will answer their question
5. Any potential challenges or limitations

Think step-by-step and be thorough in your reasoning. Your plan will guide the next steps in the workflow.

REASONING PLAN:"""
    
    async def execute(self, state: AgentState) -> AgentState:
        """Use AI to reason about the query and determine next actions"""
        self.log_execution(state, "Starting AI reasoning process")
        
        # Prepare context for the AI
        context = {
            "conversation_history": [msg.to_dict() for msg in state.messages[-5:]],  # Last 5 messages
            "session_id": state.session_id,
            "previous_results": [result.summary for result in state.analysis_results[-3:]]  # Last 3 results
        }
        
        # Create the reasoning prompt
        reasoning_prompt = self.system_prompt.format(
            context=json.dumps(context, indent=2),
            query=state.current_query
        )
        
        try:
            # Get AI reasoning
            messages = [SystemMessage(content=reasoning_prompt)]
            response = await self.llm.ainvoke(messages)
            
            # Parse the AI's plan
            ai_plan = response.content
            
            # Store the AI's reasoning in state
            state.user_context['ai_reasoning'] = ai_plan
            state.user_context['reasoning_timestamp'] = datetime.utcnow().isoformat()
            
            # Determine next action based on AI reasoning
            next_action = self._parse_ai_plan(ai_plan)
            state.user_context['next_action'] = next_action
            
            state.update_workflow_step("ai_reasoning_complete")
            
            self.log_execution(state, f"AI reasoning completed, next action: {next_action}")
            
            return state
            
        except Exception as e:
            error_msg = f"AI reasoning failed: {e}"
            self.log_execution(state, error_msg, "error")
            state.set_error(error_msg)
            return state
    
    def _parse_ai_plan(self, ai_plan: str) -> str:
        """Parse the AI's plan to determine the next workflow action"""
        plan_lower = ai_plan.lower()
        
        # Look for keywords that indicate the type of action needed
        if any(keyword in plan_lower for keyword in ['fetch', 'get', 'retrieve', 'data']):
            return "fetch_data"
        elif any(keyword in plan_lower for keyword in ['calculate', 'analyze', 'compute', 'metrics']):
            return "analyze_data"
        elif any(keyword in plan_lower for keyword in ['clarify', 'unclear', 'need more', 'question']):
            return "ask_clarification"
        else:
            return "generate_response"


class AIToolExecutionNode(BaseWorkflowNode):
    """
    Node that executes tools based on AI decisions.
    This node interprets the AI's plan and executes the appropriate tools.
    """
    
    def __init__(self, tools: AIAgentTools):
        super().__init__("tool_executor", "Execute AI-selected tools")
        self.tools = tools
        
        # Initialize Gemini for tool selection
        api_key = os.getenv("GEMINI_API_KEY")
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-pro",
            google_api_key=api_key,
            temperature=0.1
        )
    
    async def execute(self, state: AgentState) -> AgentState:
        """Execute tools based on AI reasoning"""
        self.log_execution(state, "Starting tool execution")
        
        ai_reasoning = state.user_context.get('ai_reasoning', '')
        next_action = state.user_context.get('next_action', 'generate_response')
        
        if next_action == "fetch_data":
            await self._fetch_data_intelligently(state, ai_reasoning)
        elif next_action == "analyze_data":
            await self._analyze_data_intelligently(state, ai_reasoning)
        elif next_action == "ask_clarification":
            await self._prepare_clarification_question(state, ai_reasoning)
        
        state.update_workflow_step("tool_execution_complete")
        self.log_execution(state, "Tool execution completed")
        
        return state
    
    async def _fetch_data_intelligently(self, state: AgentState, ai_reasoning: str):
        """Use AI to determine what data to fetch and how"""
        
        # Ask AI what specific data to fetch with detailed reasoning
        data_prompt = f"""You are an intelligent AI agent analyzing this user query: "{state.current_query}"

Your previous reasoning was: {ai_reasoning}

Now you need to decide EXACTLY what data to fetch to answer this query. Think step by step:

1. What specific information does the user want?
2. Which data sources contain this information?
3. What filters should be applied to get relevant data?
4. How much data do you need?

Available data sources and their contents:
- funders: Contains funder information (name, contact, location, etc.)
- contributions: Contains donation records (amount, date, funder_id, state_code, fiscal_year)
- states: Contains state information (name, code, region, etc.)
- state_targets: Contains fundraising targets by state and fiscal year
- prospects: Contains potential donor information (stage, potential_amount, etc.)

Respond with a JSON object that specifies your data fetching strategy:
{{
    "reasoning": "Detailed explanation of why you need this specific data",
    "data_sources": ["list", "of", "sources", "needed"],
    "filters": {{
        "funders": {{"example": "filter_if_needed"}},
        "contributions": {{"fiscal_year": "2024", "state_code": "CA"}}
    }},
    "expected_analysis": "What you plan to do with this data"
}}

Be specific and only request data you actually need to answer the query."""
        
        try:
            messages = [SystemMessage(content=data_prompt)]
            response = await self.llm.ainvoke(messages)
            
            # Parse the AI's data requirements
            data_plan = json.loads(response.content)
            
            self.log_execution(state, f"AI data plan: {data_plan['reasoning']}")
            
            # Fetch the requested data based on AI decision
            data_context = DataContext()
            
            for source in data_plan.get("data_sources", []):
                filters = data_plan.get("filters", {}).get(source, None)
                
                self.log_execution(state, f"Fetching {source} data with filters: {filters}")
                
                if source == "funders":
                    data_context.funders = await self.tools.get_funders_data(filters)
                elif source == "contributions":
                    data_context.contributions = await self.tools.get_contributions_data(filters)
                elif source == "states":
                    data_context.states = await self.tools.get_states_data(filters)
                elif source == "state_targets":
                    data_context.state_targets = await self.tools.get_state_targets_data(filters)
                elif source == "prospects":
                    data_context.prospects = await self.tools.get_prospects_data(filters)
            
            state.data_context = data_context
            state.user_context['data_fetch_plan'] = data_plan
            
            # Log what data was actually fetched
            summary = data_context.get_data_summary()
            self.log_execution(state, f"Data fetched: {summary}")
            
        except Exception as e:
            logger.error(f"Error in intelligent data fetching: {e}")
            # Fallback to basic data fetching
            await self._fetch_basic_data(state)
    
    async def _fetch_basic_data(self, state: AgentState):
        """Fallback method to fetch basic data"""
        data_context = DataContext()
        
        # Fetch all basic data
        data_context.funders = await self.tools.get_funders_data()
        data_context.contributions = await self.tools.get_contributions_data()
        data_context.states = await self.tools.get_states_data()
        
        state.data_context = data_context
    
    async def _analyze_data_intelligently(self, state: AgentState, ai_reasoning: str):
        """Use AI to determine what analysis to perform"""
        
        if not state.data_context:
            await self._fetch_basic_data(state)
        
        # Get data summary for AI context
        data_summary = state.data_context.get_data_summary()
        
        # Ask AI what analysis to perform with full context
        analysis_prompt = f"""You are analyzing data to answer this user query: "{state.current_query}"

Your previous reasoning: {ai_reasoning}

Available data:
{json.dumps(data_summary, indent=2)}

Sample of the actual data you have access to:
- Funders sample: {json.dumps(state.data_context.funders[:2] if state.data_context.funders else [], indent=2)}
- Contributions sample: {json.dumps(state.data_context.contributions[:2] if state.data_context.contributions else [], indent=2)}

Now decide what specific analysis to perform. Think through:
1. What calculations will answer the user's question?
2. Which data should be the primary focus?
3. What metrics are most relevant?
4. How should the results be structured?

Available analysis types:
- "sum": Calculate totals of numeric fields
- "average": Calculate averages of numeric fields  
- "count": Count occurrences by categories
- "top_n": Find top performers (requires 'amount' field)
- "trend": Analyze patterns over time

Respond with a detailed JSON analysis plan:
{{
    "reasoning": "Step-by-step explanation of your analysis approach",
    "primary_analysis": {{
        "data_source": "funders|contributions|states|state_targets|prospects",
        "analysis_type": "sum|average|count|top_n|trend",
        "focus_fields": ["amount", "state_code", "fiscal_year"]
    }},
    "secondary_analysis": {{
        "data_source": "contributions", 
        "analysis_type": "count",
        "focus_fields": ["state_code"]
    }},
    "expected_insights": ["What insights you expect to find"],
    "success_criteria": "How you'll know if this analysis answers the question"
}}"""
        
        try:
            messages = [SystemMessage(content=analysis_prompt)]
            response = await self.llm.ainvoke(messages)
            
            analysis_plan = json.loads(response.content)
            
            self.log_execution(state, f"AI analysis plan: {analysis_plan['reasoning']}")
            
            # Perform primary analysis
            primary = analysis_plan["primary_analysis"]
            primary_data = getattr(state.data_context, primary["data_source"])
            primary_metrics = await self.tools.calculate_metrics(primary_data, primary["analysis_type"])
            
            # Perform secondary analysis if specified
            secondary_metrics = {}
            if "secondary_analysis" in analysis_plan:
                secondary = analysis_plan["secondary_analysis"]
                secondary_data = getattr(state.data_context, secondary["data_source"])
                secondary_metrics = await self.tools.calculate_metrics(secondary_data, secondary["analysis_type"])
            
            # Combine results
            combined_metrics = {
                "primary_analysis": primary_metrics,
                "secondary_analysis": secondary_metrics,
                "data_summary": data_summary
            }
            
            # Create comprehensive analysis result
            analysis_result = AnalysisResult(
                type=AnalysisType.GENERAL_QUERY,
                summary=f"AI-driven analysis: {analysis_plan['reasoning'][:100]}...",
                data=[combined_metrics],
                insights=analysis_plan.get("expected_insights", []),
                metrics=combined_metrics,
                confidence_score=0.9,
                methodology=analysis_plan["reasoning"]
            )
            
            state.add_analysis_result(analysis_result)
            state.user_context['analysis_plan'] = analysis_plan
            
            self.log_execution(state, f"Analysis completed with {len(analysis_result.insights)} insights")
            
        except Exception as e:
            logger.error(f"Error in intelligent analysis: {e}")
            # Create a basic analysis as fallback
            basic_metrics = await self.tools.calculate_metrics(state.data_context.contributions, "sum")
            fallback_result = AnalysisResult(
                type=AnalysisType.GENERAL_QUERY,
                summary="Basic analysis due to AI analysis error",
                data=[basic_metrics],
                insights=["Analysis completed with basic metrics"],
                metrics=basic_metrics,
                confidence_score=0.5
            )
            state.add_analysis_result(fallback_result)
    
    async def _prepare_clarification_question(self, state: AgentState, ai_reasoning: str):
        """Prepare a clarification question based on AI reasoning"""
        
        clarification_prompt = f"""Based on your reasoning: {ai_reasoning}

The user query "{state.current_query}" needs clarification. 

Generate a helpful clarification question that will help you provide a better answer. 
The question should be specific and guide the user to provide the missing information you need.

Respond with just the clarification question, nothing else."""
        
        try:
            messages = [SystemMessage(content=clarification_prompt)]
            response = await self.llm.ainvoke(messages)
            
            clarification_question = response.content.strip()
            
            # Set the clarification flag and question
            state.needs_clarification = True
            state.user_context['clarification_question'] = clarification_question
            
        except Exception as e:
            logger.error(f"Error generating clarification question: {e}")
            state.user_context['clarification_question'] = "Could you please provide more details about what specific information you're looking for?"


class AIResponseGenerationNode(BaseWorkflowNode):
    """
    Node that generates intelligent responses using AI based on analysis results.
    """
    
    def __init__(self):
        super().__init__("ai_response_generator", "Generate AI-powered responses")
        
        api_key = os.getenv("GEMINI_API_KEY")
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-pro",
            google_api_key=api_key,
            temperature=0.3,
            max_tokens=1024
        )
    
    async def execute(self, state: AgentState) -> AgentState:
        """Generate intelligent response based on analysis and context"""
        self.log_execution(state, "Starting AI response generation")
        
        # Check if we need clarification
        if state.needs_clarification:
            clarification_question = state.user_context.get('clarification_question', 
                                                           "Could you please provide more details?")
            
            response_message = ChatMessage(
                role=MessageRole.ASSISTANT,
                content=clarification_question,
                context={"needs_clarification": True}
            )
            
            state.add_message(response_message)
            state.update_workflow_step("clarification_requested")
            return state
        
        # Generate comprehensive response
        response_content = await self._generate_comprehensive_response(state)
        
        response_message = ChatMessage(
            role=MessageRole.ASSISTANT,
            content=response_content,
            context={
                "has_analysis": len(state.analysis_results) > 0,
                "data_sources": list(state.data_context.get_data_summary().keys()) if state.data_context else [],
                "confidence": "high"
            }
        )
        
        state.add_message(response_message)
        state.update_workflow_step("response_generated")
        
        self.log_execution(state, "AI response generation completed")
        return state
    
    async def _generate_comprehensive_response(self, state: AgentState) -> str:
        """Generate a comprehensive response using all available context"""
        
        # Get the latest analysis result
        latest_analysis = state.analysis_results[-1] if state.analysis_results else None
        
        # Prepare detailed context for response generation
        response_prompt = f"""You are an AI assistant providing the final response to a user's fundraising data query. You have completed a full analysis workflow and now need to present your findings.

ORIGINAL USER QUERY: "{state.current_query}"

YOUR REASONING PROCESS: {state.user_context.get('ai_reasoning', 'No reasoning available')}

DATA FETCHING PLAN: {json.dumps(state.user_context.get('data_fetch_plan', {}), indent=2)}

ANALYSIS PERFORMED: {json.dumps(state.user_context.get('analysis_plan', {}), indent=2)}

ANALYSIS RESULTS:
{json.dumps(latest_analysis.to_dict() if latest_analysis else {}, indent=2)}

DATA SUMMARY: {json.dumps(state.data_context.get_data_summary() if state.data_context else {}, indent=2)}

CONVERSATION CONTEXT: {[msg.content for msg in state.messages[-3:]] if state.messages else []}

INSTRUCTIONS FOR YOUR RESPONSE:
1. **Direct Answer**: Start with a clear, direct answer to their specific question
2. **Supporting Data**: Use the actual numbers and metrics from your analysis
3. **Key Insights**: Highlight the most important findings from your analysis
4. **Methodology**: Briefly explain how you arrived at these conclusions
5. **Actionable Recommendations**: Provide specific, actionable next steps if appropriate
6. **Professional Tone**: Be conversational but professional
7. **Completeness**: Ensure you've fully addressed their question

RESPONSE STRUCTURE:
- Lead with the direct answer
- Support with specific data points
- Explain key insights
- Provide recommendations if relevant
- Acknowledge any limitations

Generate a comprehensive, data-driven response:"""
        
        try:
            messages = [SystemMessage(content=response_prompt)]
            response = await self.llm.ainvoke(messages)
            return response.content
            
        except Exception as e:
            logger.error(f"Error generating AI response: {e}")
            
            # Create a fallback response using available data
            if latest_analysis:
                return f"""Based on my analysis of your query "{state.current_query}", here are the key findings:

{latest_analysis.summary}

Key insights:
{chr(10).join(f"• {insight}" for insight in latest_analysis.insights)}

The analysis was performed on {state.data_context.get_data_summary() if state.data_context else 'available data'}.

Note: There was a technical issue generating the full response, but the core analysis above should address your question."""
            else:
                return "I apologize, but I encountered an error while generating a response. Please try rephrasing your question or contact support if the issue persists."


class QueryAnalysisWorkflow(BaseWorkflow):
    """
    AI-powered query analysis workflow using Gemini AI for intelligent reasoning.
    This workflow implements true agentic behavior with dynamic decision-making.
    """
    
    def __init__(self, repository_factory: RepositoryFactory):
        super().__init__("ai_query_analysis", "AI-powered intelligent query analysis")
        self.repository_factory = repository_factory
        
        # Initialize tools and nodes
        self.tools = AIAgentTools(repository_factory)
        self.ai_reasoner = AIReasoningNode(self.tools)
        self.tool_executor = AIToolExecutionNode(self.tools)
        self.response_generator = AIResponseGenerationNode()
        
        # Add nodes to workflow
        self.add_node(self.ai_reasoner)
        self.add_node(self.tool_executor)
        self.add_node(self.response_generator)
    
    def create_workflow(self):
        """Create and compile the AI-powered query analysis workflow"""
        
        # Create state graph
        workflow = StateGraph(AgentState)
        
        # Add nodes
        workflow.add_node("ai_reasoning", self.ai_reasoner.execute)
        workflow.add_node("tool_execution", self.tool_executor.execute)
        workflow.add_node("response_generation", self.response_generator.execute)
        
        # Add edges with conditional routing
        workflow.add_edge(START, "ai_reasoning")
        
        # Conditional routing based on AI decisions
        workflow.add_conditional_edges(
            "ai_reasoning",
            self._route_after_reasoning,
            {
                "execute_tools": "tool_execution",
                "generate_response": "response_generation",
                "end": END
            }
        )
        
        workflow.add_edge("tool_execution", "response_generation")
        workflow.add_edge("response_generation", END)
        
        # Compile and return
        return workflow.compile()
    
    def _route_after_reasoning(self, state: AgentState) -> str:
        """Route workflow based on AI reasoning results"""
        
        # Check if there was an error
        if state.error_state:
            return "end"
        
        # Check what the AI decided to do next
        next_action = state.user_context.get('next_action', 'generate_response')
        
        if next_action in ['fetch_data', 'analyze_data', 'ask_clarification']:
            return "execute_tools"
        else:
            return "generate_response"
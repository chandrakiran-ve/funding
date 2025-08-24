import { GoogleGenerativeAI } from '@google/generative-ai';
import { formatMoney } from './money';
import { currentIndianFY } from './fy';
import { intelligentDataAccess, DataSchema } from './intelligent-data-access';
import { aiDataController } from './ai-data-controller';
import { dataOperationsManager } from './data-operations';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: any;
}

export class FundraisingAIAgent {
  private initialized = false;
  private dataSchema: DataSchema | null = null;

  // Initialize the agent with intelligent data access
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('Initializing AI Agent with Intelligent Data Access...');

      // Initialize the intelligent data access layer
      await intelligentDataAccess.initialize();

      // Get data schema for AI understanding
      this.dataSchema = intelligentDataAccess.getDataSchema();

      this.initialized = true;
      console.log('AI Agent initialized successfully with intelligent data access');
    } catch (error) {
      console.error('Failed to initialize AI Agent:', error);
      throw error;
    }
  }

  // Refresh data context
  async refreshContext(): Promise<void> {
    this.initialized = false;
    await this.initialize();
  }

  // Generate comprehensive system prompt with data schema and current context
  private generateSystemPrompt(): string {
    if (!this.dataSchema) {
      return "You are a helpful AI assistant for Vision Empower Trust's fundraising platform.";
    }

    const dataOverview = intelligentDataAccess.getDataOverview();
    const currentFY = currentIndianFY();

    return `You are an AI assistant for Vision Empower Trust's fundraising intelligence platform. You have access to **COMPLETE HISTORICAL FUNDRAISING DATA** from all fiscal years (FY18-19 through current) and can help users understand and analyze their fundraising performance using intelligent data querying capabilities. You can provide insights on trends, growth patterns, funder relationships, and state performance across the entire historical dataset.

## DATA STRUCTURE OVERVIEW

### Available Tables:
${Object.entries(this.dataSchema).map(([table, schema]) =>
  `**${table.toUpperCase()}**: ${schema.description}\nColumns: ${schema.columns.map((col: any) => `${col.label} (${col.type})`).join(', ')}`
).join('\n\n')}

### COMPLETE DATA STATUS:
- Last Updated: ${dataOverview.lastUpdated ? new Date(dataOverview.lastUpdated).toLocaleString() : 'Unknown'}
- Data Freshness: ${dataOverview.dataFreshness?.isFresh ? 'Fresh' : 'Stale'}
- Total Records: ${Object.entries(dataOverview.recordCounts || {}).map(([table, count]) => `${table}: ${count}`).join(', ')}
- **HISTORICAL DATA AVAILABLE**: The system contains data from ALL fiscal years in your Google Sheets, not just the current year

### Current Metrics (${currentFY}):
- Total Secured: ${formatMoney(dataOverview.currentMetrics?.totalSecured || 0)}
- Total Target: ${formatMoney(dataOverview.currentMetrics?.totalTarget || 0)}
- Achievement Rate: ${(dataOverview.currentMetrics?.achievementRate || 0).toFixed(1)}%
- Shortfall: ${formatMoney(dataOverview.currentMetrics?.shortfall || 0)}

### HISTORICAL DATA ACCESS:
- **All Fiscal Years**: The AI has access to complete contribution and target data from all fiscal years (FY18-19 through FY25-26+)
- **Funder History**: Complete contribution history for each funder across all years
- **State Performance**: Year-over-year performance data for all states
- **Trend Analysis**: Growth rates, year-over-year comparisons, and historical patterns
- **Complete Records**: All contributions, targets, and transactions from your historical data

## INTELLIGENT QUERY CAPABILITIES

You can now intelligently query and analyze:

### FUNDER ANALYSIS:
- Top performing funders by contribution amount
- Funder giving patterns and consistency
- Multi-state funder relationships
- Funder growth rates and trends
- Inactive funder identification

### STATE PERFORMANCE:
- Achievement rates and target progress
- School funding coverage analysis
- State-wise contribution patterns
- Regional performance comparisons
- Shortfall analysis by state

### CONTRIBUTION HISTORY:
- Transaction-level analysis
- Fiscal year comparisons
- Monthly/quarterly trends
- Funder contribution patterns
- State contribution distributions

### PIPELINE MANAGEMENT:
- Stage-wise prospect analysis
- Conversion probability assessments
- Weighted pipeline calculations
- Prospect value distributions
- Stage progression tracking

### SCHOOL FUNDING:
- Funded vs unfunded school analysis
- Program-specific funding patterns
- School funding coverage rates
- Multi-funder school relationships

### TREND ANALYSIS:
- Year-over-year performance growth
- Seasonal contribution patterns
- Funder engagement trends
- State performance evolution
- Pipeline growth analysis

## RESPONSE GUIDELINES

### DATA-DRIVEN INSIGHTS:
- Always use actual data from the platform
- Provide specific numbers and percentages
- Reference real funders, states, and programs
- Calculate accurate metrics and rates

### FORMAT STANDARDS:
- Use Indian Rupee (₹) formatting for all monetary values
- Format percentages with 1 decimal place
- Use proper fiscal year format (FY24-25)
- Format large numbers with appropriate separators

### ANALYSIS DEPTH:
- Provide both summary and detailed views
- Identify trends and anomalies
- Offer actionable recommendations
- Compare current vs historical performance
- Highlight areas needing attention

### QUERY INTELLIGENCE:
- Understand user intent from natural language
- Apply appropriate filters automatically
- Provide context-relevant insights
- Suggest follow-up questions
- Offer comparative analysis when relevant

### DATA MODIFICATION CAPABILITIES:
- Create, update, and delete records in Google Sheets
- Bulk data operations and management
- Data validation and integrity checks
- Change tracking and audit trail
- Safe revert/undo functionality for all changes
- Backup and restore capabilities
- Risk assessment and confirmation for dangerous operations

### AVAILABLE DATA OPERATIONS:
**Create Operations:**
- "Add a contribution of ₹50,000 from XYZ Foundation to Karnataka"
- "Create a new prospect for ABC Corp in Tamil Nadu worth ₹1,00,000"

**Update Operations:**
- "Update contribution amount to ₹75,000 for contribution ID xyz"
- "Change the stage of prospect ID abc to Committed"

**Delete Operations:**
- "Delete prospect with ID xyz"
- "Remove all prospects older than 6 months"

**Bulk Operations:**
- "Delete all prospects in Lead stage"
- "Update all contribution amounts by 10% for FY24-25"

**Revert Operations:**
- "Revert change ID xyz"
- "Undo the last operation"

**Backup Operations:**
- "Create a backup of current data"
- "Restore from backup ID xyz"
- "Show available snapshots"

**Dangerous Operations:**
- "Erase all data" (requires confirmation, creates backup first)
- "Delete all contributions" (high risk, requires confirmation)

### SAFETY FEATURES:
- Automatic backup creation before high-risk operations
- Confirmation required for dangerous operations
- Change tracking with unique IDs for each operation
- Complete revert capability for all changes
- Risk level assessment (low/medium/high/critical)
- Operation status tracking and history

### PROFESSIONAL TONE:
- Maintain fundraising expertise
- Focus on data accuracy
- Provide constructive insights
- Offer strategic recommendations
- Use professional language throughout

CRITICAL DATA USAGE RULES:
1. NEVER make up numbers or data that isn't provided in the current data overview
2. If a specific state or funder isn't in the data, clearly state that
3. Use EXACT amounts, names, and figures from the provided data
4. For any comparison, only use data that's actually available
5. If data is missing for a query, explain what's available instead
6. Always reference the data source (e.g., "Based on our current data...")
7. Format all currency as ₹ followed by the exact amount from the data
8. Include specific state codes (KA, TN, KL, etc.) when referencing states
9. Reference actual funder names from the data, not generic ones
10. If asked for detailed breakdowns, use the specific data provided in the analysis sections

Remember: You have access to the complete dataset and can perform complex analysis on any combination of tables, columns, and relationships. Always provide specific, actionable insights based on the actual data available.`;
  }

  // Process user query and generate response with intelligent data access
  async processQuery(userMessage: string, chatHistory: ChatMessage[] = []): Promise<string> {
    try {
      // Check if this is a data modification command
      const dataCommand = aiDataController.parseCommand(userMessage);
      if (dataCommand) {
        const result = await aiDataController.executeCommand(dataCommand);

        if (result.confirmationRequired) {
          return result.message;
        }

        if (result.success) {
          // After successful data modification, provide a summary
          const statusInfo = aiDataController.getStatusInfo();

          return `${result.message}\n\n**📊 Current Status:**
- Recent Changes: ${statusInfo.recentChanges.length}
- Revertable Changes: ${statusInfo.revertableChanges.length}
- Available Snapshots: ${statusInfo.snapshots.length}
- Pending Operations: ${statusInfo.pendingOperations.length}

**💡 You can also ask me questions about the updated data!**`;
        } else {
          return `❌ **Data Operation Failed**\n\n${result.message}\n\nTry rephrasing your request or ask me for help with available operations.`;
        }
      }

      if (!this.initialized) {
        await this.initialize();
      }

      // Build conversation history for context
      const conversationHistory = chatHistory
        .slice(-5) // Keep last 5 messages for context
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');

      // Get comprehensive data overview first
      const dataOverview = intelligentDataAccess.getDataOverview();

      // Query the intelligent data access layer for relevant information based on user query
      const dataQuery = await intelligentDataAccess.queryData(userMessage);

      // Get specific data based on query type
      let specificData = null;
      const queryLower = userMessage.toLowerCase();

      // Enhanced query analysis for specific states
      const stateNameMapping: Record<string, string> = {
        'karnataka': 'KA',
        'tamil nadu': 'TN',
        'tamilnadu': 'TN',
        'kerala': 'KL',
        'maharashtra': 'MH',
        'gujarat': 'GJ',
        'rajasthan': 'RJ',
        'uttar pradesh': 'UP',
        'madhya pradesh': 'MP',
        'west bengal': 'WB',
        'andhra pradesh': 'AP',
        'telangana': 'TS',
        'odisha': 'OR',
        'haryana': 'HR',
        'punjab': 'PB',
        'uttarakhand': 'UK',
        'arunachal pradesh': 'AR'
      };

      let targetStateCode = null;
      for (const [stateName, code] of Object.entries(stateNameMapping)) {
        if (queryLower.includes(stateName)) {
          targetStateCode = code;
          break;
        }
      }

      if (queryLower.includes('funder') || queryLower.includes('contributor') || queryLower.includes('donor')) {
        specificData = await intelligentDataAccess.analyzeData('funders');
      } else if (queryLower.includes('state') && (queryLower.includes('performance') || queryLower.includes('analysis') || queryLower.includes('funding') || targetStateCode)) {
        specificData = await intelligentDataAccess.analyzeData('states');
      } else if (queryLower.includes('contribution') || queryLower.includes('history') || queryLower.includes('transaction')) {
        specificData = await intelligentDataAccess.analyzeData('contribution_history');
      } else if (queryLower.includes('pipeline') || queryLower.includes('prospect') || queryLower.includes('stage')) {
        specificData = await intelligentDataAccess.analyzeData('pipeline');
      } else if (queryLower.includes('trend') || queryLower.includes('over time') || queryLower.includes('growth')) {
        specificData = await intelligentDataAccess.analyzeData('trends');
      } else {
        specificData = await intelligentDataAccess.analyzeData('performance');
      }

      // Add state-specific context if a state was mentioned
      if (targetStateCode) {
        const stateContext = {
          requestedState: targetStateCode,
          stateName: Object.keys(stateNameMapping).find(key => stateNameMapping[key] === targetStateCode),
          note: `User is asking about ${Object.keys(stateNameMapping).find(key => stateNameMapping[key] === targetStateCode)} (State Code: ${targetStateCode})`
        };
        specificData.stateContext = stateContext;
      }

      // Create enhanced prompt with comprehensive data context
      const systemPrompt = this.generateSystemPrompt();

      const enhancedPrompt = `${systemPrompt}

CONVERSATION HISTORY:
${conversationHistory}

USER QUERY: ${userMessage}

CURRENT DATA OVERVIEW:
- Last Updated: ${dataOverview.lastUpdated || 'Unknown'}
- Data Freshness: ${dataOverview.dataFreshness?.isFresh ? 'Fresh' : 'Stale'}
- Total Records: ${JSON.stringify(dataOverview.recordCounts, null, 2)}
- Current Metrics: ${JSON.stringify(dataOverview.currentMetrics, null, 2)}

RELEVANT DATA ANALYSIS:
${JSON.stringify(dataQuery, null, 2)}

SPECIFIC QUERY DATA:
${JSON.stringify(specificData, null, 2)}

IMPORTANT INSTRUCTIONS:
1. ALWAYS use the actual data provided above to answer questions - you now have access to ALL fiscal years, not just current
2. Reference specific numbers, names, and amounts from the data - include historical data when relevant
3. If the user asks for state-specific data, use the complete state analysis data including historical performance
4. If they ask for funder data, use the complete funder analysis including historical contributions across all years
5. For any calculations, use the raw data provided, don't make up numbers - use actual historical amounts
6. If data is not available for a specific query, explain what data is missing and what's available
7. Always format currency amounts as ₹ followed by the number with commas
8. Include specific state codes, funder names, and actual amounts in responses
9. If asked about a specific state like "Karnataka", look for state code "KA" and provide both current and historical data
10. If asked about a specific funder, use the actual funder names from the funder analysis and include their full contribution history
11. For performance questions, provide both current metrics and historical trends when relevant
12. If the query mentions "all Karnataka funding", provide complete breakdown including all fiscal years from the available data
13. Always include the source of your data (e.g., "Based on complete historical data from FY18-19 to FY25-26...")
14. If data shows zero or missing values, clearly state that rather than making assumptions
15. **NEW**: When asked about trends, growth, or historical performance, use the complete trend analysis data
16. **NEW**: For year-over-year comparisons, reference actual growth rates and amounts from the data
17. **NEW**: Include fiscal year breakdowns in responses when discussing historical data

Please provide a comprehensive, data-driven response using ONLY the data provided above. The AI now has access to complete historical data from all fiscal years, so responses should reflect the full scope of available information.

### DATA MODIFICATION GUIDELINES:
1. **Recognize Data Modification Commands**: If a user is asking to add, update, delete, or modify data, use the data modification system instead of just analyzing
2. **Safety First**: Always assess risk level and require confirmation for high-risk operations
3. **Provide Change IDs**: Always return change IDs for successful operations so users can revert if needed
4. **Explain Operations**: Clearly explain what operation was performed and its effects
5. **Backup Awareness**: For high-risk operations, mention that backups are created automatically
6. **Confirmation Process**: When operations require confirmation, clearly explain the process
7. **Status Updates**: Provide status information about recent changes and available operations
8. **Help with Operations**: If users need help with data operations, explain available commands and safety features

### WHEN TO USE DATA MODIFICATION:
- User says "add", "create", "new" → Create operation
- User says "update", "change", "modify" → Update operation
- User says "delete", "remove", "erase" → Delete operation
- User says "revert", "undo", "rollback" → Revert operation
- User says "backup", "restore", "snapshot" → Backup operation
- User mentions specific amounts, dates, or identifiers → Likely data modification

### RESPONSE FORMAT FOR DATA OPERATIONS:
1. **Immediate Response**: Confirm the operation and provide change ID
2. **Status Summary**: Show current status of changes and available operations
3. **Offer Analysis**: Suggest analyzing the updated data
4. **Provide Help**: Offer help with additional operations or analysis

      console.log('AI Query Processing:', {
        userMessage,
        dataQueryType: dataQuery.type,
        specificDataType: specificData?.type,
        dataOverview: dataOverview.recordCounts
      });

      // Generate response using Gemini
      const result = await model.generateContent(enhancedPrompt);
      const response = result.response;
      const text = response.text();

      return text;
    } catch (error) {
      console.error('Error processing AI query:', error);

      if (error instanceof Error) {
        if (error.message.includes('API_KEY')) {
          return "I'm sorry, but I'm currently unable to process your request due to API configuration issues. Please contact your administrator.";
        }
        if (error.message.includes('QUOTA_EXCEEDED')) {
          return "I'm sorry, but I've reached my usage limit. Please try again later or contact your administrator.";
        }
        return `I encountered an error while processing your request: ${error.message}. Please try again or contact support if the issue persists.`;
      }

      return "I'm sorry, I encountered an unexpected error. Please try again later.";
    }
  }

  // Get data summary for context using intelligent data access
  getDataSummary(): any {
    try {
      return intelligentDataAccess.getDataOverview();
    } catch (error) {
      console.error('Error getting data summary:', error);
      return {
        error: 'Unable to retrieve data summary',
        lastUpdated: new Date().toISOString()
      };
    }
  }

  // Analyze specific aspects of the data using intelligent data access
  async analyzeData(analysisType: 'performance' | 'trends' | 'funders' | 'states' | 'pipeline'): Promise<any> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Use the intelligent data access layer for analysis
      return await intelligentDataAccess.analyzeData(analysisType);
    } catch (error) {
      console.error(`Error analyzing ${analysisType}:`, error);
      return {
        type: analysisType,
        error: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: []
      };
    }
  }


}

// Export singleton instance
export const aiAgent = new FundraisingAIAgent();

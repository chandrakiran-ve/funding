// Main AI Agent Interface - Clean and Simple
import { ChatMessage } from './types';
import { langGraphAgent } from './langgraph-agent';

export interface AIAgentResponse {
  success: boolean;
  message?: ChatMessage;
  error?: string;
  context?: Record<string, unknown>;
}

export class FundraisingAIAgent {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('Initializing AI Agent with LangGraph...');
      
      // Test the connection and data access
      await langGraphAgent.getDataSummary();
      
      this.initialized = true;
      console.log('AI Agent initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AI Agent:', error);
      throw error;
    }
  }

  async processQuery(userMessage: string, chatHistory: ChatMessage[] = []): Promise<string> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      console.log('Processing query:', { 
        messageLength: userMessage.length, 
        historyLength: chatHistory.length 
      });

      const response = await langGraphAgent.processQuery(userMessage, chatHistory);
      
      return response.content;
    } catch (error) {
      console.error('Error processing AI query:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('API_KEY')) {
          return "I'm sorry, but I'm currently unable to process your request due to API configuration issues. Please contact your administrator.";
        }
        if (error.message.includes('QUOTA_EXCEEDED')) {
          return "I'm sorry, but I've reached my usage limit. Please try again later or contact your administrator.";
        }
        return "I encountered an error while processing your request: " + error.message + ". Please try again or contact support if the issue persists.";
      }

      return "I'm sorry, I encountered an unexpected error. Please try again later.";
    }
  }

  async getDataSummary(): Promise<Record<string, unknown>> {
    try {
      return await langGraphAgent.getDataSummary();
    } catch (error) {
      console.error('Error getting data summary:', error);
      return {
        error: 'Unable to retrieve data summary',
        lastUpdated: new Date().toISOString()
      };
    }
  }

  async refreshContext(): Promise<void> {
    this.initialized = false;
    await langGraphAgent.refreshContext();
    await this.initialize();
  }

  async analyzeData(analysisType: 'performance' | 'trends' | 'funders' | 'states' | 'pipeline'): Promise<Record<string, unknown>> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Use the query processing system for analysis
      const queryMap = {
        'performance': 'Show me overall performance metrics',
        'trends': 'Analyze trends over time',
        'funders': 'Analyze funder performance',
        'states': 'Show state performance analysis',
        'pipeline': 'Analyze pipeline prospects'
      };

      const query = queryMap[analysisType] || 'Show me general analysis';
      const response = await this.processQuery(query);
      
      return {
        type: analysisType,
        data: response,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error("Error analyzing " + analysisType + ":", error);
      return {
        type: analysisType,
        error: "Analysis failed: " + (error instanceof Error ? error.message : 'Unknown error'),
        data: []
      };
    }
  }
}

// Export singleton instance and types
export const aiAgent = new FundraisingAIAgent();
export type { ChatMessage };
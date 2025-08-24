import { ChatMessage } from './types';
import { queryParser } from './query-parser';
import { dataService } from './data-service';
import { geminiService } from './gemini-service';

export class LangGraphAgent {
  constructor() {
    // Simplified agent without LangGraph dependency issues
  }

  private async parseQuery(userQuery: string) {
    try {
      console.log('Parsing query:', userQuery);
      const dataQuery = queryParser.parseQuery(userQuery);
      console.log('Parsed query:', dataQuery);
      return { dataQuery, error: undefined };
    } catch (error) {
      console.error('Error parsing query:', error);
      return {
        error: `Failed to parse query: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async analyzeData(dataQuery: any) {
    try {
      console.log('Analyzing data for query:', dataQuery);
      const analysisResult = await dataService.analyzeQuery(dataQuery);
      console.log('Analysis completed:', analysisResult.type);
      return { analysisResult, error: undefined };
    } catch (error) {
      console.error('Error analyzing data:', error);
      return {
        error: `Failed to analyze data: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async generateResponse(userQuery: string, analysisResult: any) {
    try {
      console.log('Generating response for:', analysisResult.type);
      const dataContext = await dataService.getDataContext();
      const response = await geminiService.generateResponse(
        userQuery,
        analysisResult,
        dataContext
      );

      return {
        id: `ai-${Date.now()}`,
        role: 'assistant' as const,
        content: response,
        timestamp: new Date(),
        context: {
          analysisType: analysisResult.type,
          metrics: analysisResult.metrics
        }
      };
    } catch (error) {
      console.error('Error generating response:', error);
      throw error;
    }
  }

  async processQuery(userMessage: string, chatHistory: ChatMessage[] = []): Promise<ChatMessage> {
    try {
      console.log('Processing query with simplified agent:', userMessage);

      // Step 1: Parse the query
      const parseResult = await this.parseQuery(userMessage);
      if (parseResult.error) {
        throw new Error(parseResult.error);
      }

      // Step 2: Analyze the data
      const analysisResult = await this.analyzeData(parseResult.dataQuery);
      if (analysisResult.error) {
        throw new Error(analysisResult.error);
      }

      // Step 3: Generate response
      const response = await this.generateResponse(userMessage, analysisResult.analysisResult);
      return response;

    } catch (error) {
      console.error('Error in agent:', error);
      
      return {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `I apologize, but I encountered an error while processing your request. Please try again or contact support if the issue persists.\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        context: { error: true }
      };
    }
  }

  async getDataSummary() {
    try {
      const dataContext = await dataService.getDataContext();
      return {
        lastUpdated: dataContext.lastUpdated,
        counts: {
          funders: dataContext.funders.length,
          contributions: dataContext.contributions.length,
          stateTargets: dataContext.stateTargets.length,
          prospects: dataContext.prospects.length,
          states: dataContext.states.length,
          schools: dataContext.schools.length
        },
        status: 'ready'
      };
    } catch (error) {
      console.error('Error getting data summary:', error);
      return {
        error: 'Failed to get data summary',
        status: 'error'
      };
    }
  }

  async refreshContext(): Promise<void> {
    await dataService.refreshCache();
  }
}

export const langGraphAgent = new LangGraphAgent();
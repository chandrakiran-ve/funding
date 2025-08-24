import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { AnalysisResult, DataContext } from './types';
import { formatMoney } from '@/lib/money';
import { currentIndianFY } from '@/lib/fy';

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    });
  }

  async generateResponse(
    userQuery: string, 
    analysisResult: AnalysisResult, 
    dataContext: DataContext
  ): Promise<string> {
    const systemPrompt = this.createSystemPrompt(dataContext);
    const analysisPrompt = this.createAnalysisPrompt(analysisResult);
    
    const fullPrompt = `${systemPrompt}

USER QUERY: ${userQuery}

${analysisPrompt}

Please provide a comprehensive, data-driven response that:
1. Directly answers the user's question
2. Uses the specific data and insights provided
3. Formats monetary values in Indian Rupees (₹)
4. Provides actionable recommendations when appropriate
5. Uses a professional but conversational tone
6. Highlights key metrics and trends
7. Suggests follow-up questions or areas for deeper analysis

Response:`;

    try {
      const result = await this.model.generateContent(fullPrompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating Gemini response:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  async generateInsights(analysisResult: AnalysisResult): Promise<string[]> {
    const prompt = `Based on the following fundraising data analysis, generate 3-5 key insights and actionable recommendations:

Analysis Type: ${analysisResult.type}
Summary: ${analysisResult.summary}
Key Metrics: ${JSON.stringify(analysisResult.metrics, null, 2)}
Current Insights: ${analysisResult.insights.join(', ')}

Please provide insights that are:
1. Specific and data-driven
2. Actionable for fundraising teams
3. Focused on opportunities for improvement
4. Clear and concise

Format as a JSON array of strings.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      
      // Try to parse as JSON, fallback to splitting by lines
      try {
        return JSON.parse(response);
      } catch {
        return response.split('\n').filter((line: string) => line.trim().length > 0);
      }
    } catch (error) {
      console.error('Error generating insights:', error);
      return analysisResult.insights;
    }
  }

  private createSystemPrompt(dataContext: DataContext): string {
    const currentFY = currentIndianFY();
    
    return `You are an AI assistant for Vision Empower Trust's fundraising intelligence platform. You have access to comprehensive fundraising data and can provide detailed analysis and insights.

CURRENT CONTEXT:
- Current Fiscal Year: ${currentFY}
- Data Last Updated: ${dataContext.lastUpdated}
- Total Funders: ${dataContext.funders.length}
- Total Contributions: ${dataContext.contributions.length}
- Total States: ${dataContext.states.length}
- Total Prospects: ${dataContext.prospects.length}

CAPABILITIES:
- Analyze fundraising performance across states and fiscal years
- Provide insights on funder relationships and contribution patterns
- Track progress against targets and identify shortfalls
- Analyze pipeline prospects and conversion rates
- Compare performance across different time periods
- Identify top-performing states and funders
- Suggest strategies for improving fundraising outcomes

RESPONSE GUIDELINES:
- Always use actual data from the analysis provided
- Format all monetary values as ₹ followed by the amount with proper formatting
- Use specific numbers, percentages, and concrete examples
- Provide both summary insights and detailed breakdowns when relevant
- Include actionable recommendations based on the data
- Reference specific states using their full names and codes (e.g., "Karnataka (KA)")
- Use professional language while remaining conversational and helpful
- When discussing trends, always reference specific time periods and growth rates
- Highlight both successes and areas needing attention`;
  }

  private createAnalysisPrompt(analysisResult: AnalysisResult): string {
    return `ANALYSIS RESULTS:
Type: ${analysisResult.type}
Summary: ${analysisResult.summary}

KEY INSIGHTS:
${analysisResult.insights.map(insight => `• ${insight}`).join('\n')}

METRICS:
${Object.entries(analysisResult.metrics || {}).map(([key, value]) => {
  if (typeof value === 'number' && key.toLowerCase().includes('amount')) {
    return `• ${key}: ${formatMoney(value)}`;
  }
  return `• ${key}: ${value}`;
}).join('\n')}

DATA SAMPLE:
${JSON.stringify(Array.isArray(analysisResult.data) ? analysisResult.data.slice(0, 5) : analysisResult.data, null, 2)}

${analysisResult.recommendations ? `RECOMMENDATIONS:\n${analysisResult.recommendations.map(rec => `• ${rec}`).join('\n')}` : ''}`;
  }

  async classifyQuery(userQuery: string): Promise<{
    intent: string;
    confidence: number;
    suggestedType: string;
  }> {
    const prompt = `Classify the following fundraising-related query:

Query: "${userQuery}"

Classify into one of these categories:
1. funder_analysis - Questions about funders, donors, or funding sources
2. state_performance - Questions about state-wise performance, targets, achievements
3. contribution_history - Questions about past contributions, transactions, payments
4. pipeline_analysis - Questions about prospects, leads, opportunities
5. trend_analysis - Questions about trends, growth, historical patterns
6. general_query - General questions or requests for overview

Also determine the intent:
- get_total_amount
- list_entities  
- compare_entities
- analyze_trends
- find_top_performers
- find_underperformers
- general_inquiry

Respond with JSON format:
{
  "intent": "intent_name",
  "confidence": 0.8,
  "suggestedType": "category_name"
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      return JSON.parse(response);
    } catch (error) {
      console.error('Error classifying query:', error);
      return {
        intent: 'general_inquiry',
        confidence: 0.5,
        suggestedType: 'general_query'
      };
    }
  }
}

export const geminiService = new GeminiService();
import { DataQuery } from './types';

export class QueryParser {
  private stateMapping: Record<string, string> = {
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

  parseQuery(userMessage: string): DataQuery {
    const message = userMessage.toLowerCase();
    
    // Determine query type based on keywords
    let queryType: DataQuery['type'] = 'general_query';
    
    if (this.containsKeywords(message, ['funder', 'donor', 'contributor', 'funding source'])) {
      queryType = 'funder_analysis';
    } else if (this.containsKeywords(message, ['state', 'performance', 'achievement', 'target'])) {
      queryType = 'state_performance';
    } else if (this.containsKeywords(message, ['contribution', 'history', 'transaction', 'payment'])) {
      queryType = 'contribution_history';
    } else if (this.containsKeywords(message, ['pipeline', 'prospect', 'lead', 'opportunity'])) {
      queryType = 'pipeline_analysis';
    } else if (this.containsKeywords(message, ['trend', 'growth', 'over time', 'year over year', 'historical'])) {
      queryType = 'trend_analysis';
    }

    // Extract filters
    const filters: DataQuery['filters'] = {};
    
    // Extract state
    const stateCode = this.extractState(message);
    if (stateCode) {
      filters.stateCode = stateCode;
    }
    
    // Extract fiscal year
    const fiscalYear = this.extractFiscalYear(message);
    if (fiscalYear) {
      filters.fiscalYear = fiscalYear;
    }

    // Extract parameters based on query type
    const parameters = this.extractParameters(message, queryType);

    return {
      type: queryType,
      parameters,
      filters: Object.keys(filters).length > 0 ? filters : undefined
    };
  }

  private containsKeywords(message: string, keywords: string[]): boolean {
    return keywords.some(keyword => message.includes(keyword));
  }

  private extractState(message: string): string | undefined {
    // Check for state codes first (KA, TN, etc.)
    const stateCodeMatch = message.match(/\b([A-Z]{2})\b/);
    if (stateCodeMatch) {
      return stateCodeMatch[1];
    }

    // Check for state names
    for (const [stateName, code] of Object.entries(this.stateMapping)) {
      if (message.includes(stateName)) {
        return code;
      }
    }

    return undefined;
  }

  private extractFiscalYear(message: string): string | undefined {
    // Look for patterns like FY24-25, FY2024-25, 2024-25
    const fyPatterns = [
      /FY(\d{2})-(\d{2})/i,
      /FY(\d{4})-(\d{2})/i,
      /(\d{4})-(\d{2})/,
      /fiscal year (\d{4})/i,
      /fy (\d{2})/i
    ];

    for (const pattern of fyPatterns) {
      const match = message.match(pattern);
      if (match) {
        if (match[1].length === 2) {
          // Convert 2-digit year to 4-digit
          const year1 = parseInt(match[1]) + 2000;
          const year2 = match[2] ? parseInt(match[2]) : year1 + 1;
          return `FY${year1.toString().slice(-2)}-${year2.toString().slice(-2)}`;
        } else if (match[1].length === 4) {
          const year1 = parseInt(match[1]);
          const year2 = match[2] ? parseInt(match[2]) + 2000 : year1 + 1;
          return `FY${year1.toString().slice(-2)}-${year2.toString().slice(-2)}`;
        }
      }
    }

    return undefined;
  }

  private extractParameters(message: string, queryType: DataQuery['type']): Record<string, unknown> {
    const parameters: Record<string, unknown> = {};

    switch (queryType) {
      case 'funder_analysis':
        if (message.includes('top')) {
          const topMatch = message.match(/top (\d+)/);
          parameters.limit = topMatch ? parseInt(topMatch[1]) : 10;
        }
        if (message.includes('multi-state') || message.includes('multiple state')) {
          parameters.multiStateOnly = true;
        }
        break;

      case 'state_performance':
        if (message.includes('above target') || message.includes('exceeded')) {
          parameters.aboveTargetOnly = true;
        }
        if (message.includes('below target') || message.includes('shortfall')) {
          parameters.belowTargetOnly = true;
        }
        break;

      case 'contribution_history':
        if (message.includes('recent') || message.includes('latest')) {
          const recentMatch = message.match(/recent (\d+)/);
          parameters.limit = recentMatch ? parseInt(recentMatch[1]) : 20;
        }
        if (message.includes('large') || message.includes('biggest')) {
          parameters.sortBy = 'amount';
          parameters.order = 'desc';
        }
        break;

      case 'pipeline_analysis':
        if (message.includes('high probability') || message.includes('likely')) {
          parameters.minProbability = 0.7;
        }
        if (message.includes('committed') || message.includes('proposal')) {
          parameters.stages = ['Committed', 'Proposal'];
        }
        break;

      case 'trend_analysis':
        if (message.includes('growth') || message.includes('increase')) {
          parameters.focusOnGrowth = true;
        }
        if (message.includes('monthly') || message.includes('month')) {
          parameters.granularity = 'monthly';
        }
        break;
    }

    return parameters;
  }

  extractIntent(message: string): string {
    const message_lower = message.toLowerCase();
    
    if (message_lower.includes('how much') || message_lower.includes('total amount')) {
      return 'get_total_amount';
    }
    if (message_lower.includes('who are') || message_lower.includes('list of')) {
      return 'list_entities';
    }
    if (message_lower.includes('compare') || message_lower.includes('vs') || message_lower.includes('versus')) {
      return 'compare_entities';
    }
    if (message_lower.includes('trend') || message_lower.includes('over time')) {
      return 'analyze_trends';
    }
    if (message_lower.includes('best') || message_lower.includes('top') || message_lower.includes('highest')) {
      return 'find_top_performers';
    }
    if (message_lower.includes('worst') || message_lower.includes('lowest') || message_lower.includes('bottom')) {
      return 'find_underperformers';
    }
    
    return 'general_inquiry';
  }
}

export const queryParser = new QueryParser();
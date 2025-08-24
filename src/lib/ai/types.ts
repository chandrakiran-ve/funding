// AI Agent Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: Record<string, unknown>;
}

export interface DataQuery {
  type: 'funder_analysis' | 'state_performance' | 'contribution_history' | 'pipeline_analysis' | 'trend_analysis' | 'general_query';
  parameters: Record<string, unknown>;
  filters?: {
    stateCode?: string;
    fiscalYear?: string;
    funderId?: string;
    dateRange?: { start: string; end: string };
  };
}

export interface AnalysisResult {
  type: string;
  summary: string;
  data: unknown[];
  insights: string[];
  recommendations?: string[];
  metrics?: Record<string, number>;
}

export interface AgentState {
  messages: ChatMessage[];
  currentQuery: string;
  dataQuery?: DataQuery;
  analysisResult?: AnalysisResult;
  needsMoreInfo: boolean;
  error?: string;
}

export interface DataContext {
  funders: unknown[];
  contributions: unknown[];
  stateTargets: unknown[];
  prospects: unknown[];
  states: unknown[];
  schools: unknown[];
  lastUpdated: string;
}
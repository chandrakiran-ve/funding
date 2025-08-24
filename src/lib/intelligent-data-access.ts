// Intelligent Data Access Layer for AI Agent
// This provides comprehensive access to all Google Sheets data with intelligent querying

import {
  Funder,
  Contribution,
  StateInfo,
  StateTarget,
  School,
  Prospect,
  User,
  getFunders,
  getContributions,
  getStateTargets,
  getStates,
  getSchools,
  getProspects,
  getUsers
} from './sheets';
import { formatMoney } from './money';

export interface DataSchema {
  funders: {
    columns: Array<{ key: keyof Funder; label: string; type: string }>;
    description: string;
  };
  contributions: {
    columns: Array<{ key: keyof Contribution; label: string; type: string }>;
    description: string;
  };
  states: {
    columns: Array<{ key: keyof StateInfo; label: string; type: string }>;
    description: string;
  };
  targets: {
    columns: Array<{ key: keyof StateTarget; label: string; type: string }>;
    description: string;
  };
  schools: {
    columns: Array<{ key: keyof School; label: string; type: string }>;
    description: string;
  };
  prospects: {
    columns: Array<{ key: keyof Prospect; label: string; type: string }>;
    description: string;
  };
  users: {
    columns: Array<{ key: keyof User; label: string; type: string }>;
    description: string;
  };
}

export interface QueryContext {
  fiscalYear?: string;
  stateCode?: string;
  funderId?: string;
  schoolId?: string;
  dateRange?: { from: Date; to: Date };
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DataInsight {
  type: 'metric' | 'trend' | 'comparison' | 'correlation' | 'anomaly';
  title: string;
  description: string;
  data: any;
  visualization?: {
    type: 'chart' | 'table' | 'metric';
    config: any;
  };
}

export class IntelligentDataAccess {
  private data: {
    funders: Funder[];
    contributions: Contribution[];
    states: StateInfo[];
    targets: StateTarget[];
    schools: School[];
    prospects: Prospect[];
    users: User[];
  } = {
    funders: [],
    contributions: [],
    states: [],
    targets: [],
    schools: [],
    prospects: [],
    users: []
  };

  private initialized = false;
  private lastRefresh = new Date();

  // Schema definition for AI understanding
  getDataSchema(): DataSchema {
    return {
      funders: {
        description: "Funders table containing all funding partners with their details and types",
        columns: [
          { key: 'id', label: 'Funder ID', type: 'string' },
          { key: 'name', label: 'Funder Name', type: 'string' },
          { key: 'type', label: 'Funder Type', type: 'string' },
          { key: 'priority', label: 'Priority Level', type: 'string' },
          { key: 'owner', label: 'Account Manager', type: 'string' }
        ]
      },
      contributions: {
        description: "Contributions table with all funding transactions by fiscal year, state, and funder",
        columns: [
          { key: 'id', label: 'Contribution ID', type: 'string' },
          { key: 'funderId', label: 'Funder ID', type: 'string' },
          { key: 'stateCode', label: 'State Code', type: 'string' },
          { key: 'schoolId', label: 'School ID', type: 'string' },
          { key: 'fiscalYear', label: 'Fiscal Year', type: 'string' },
          { key: 'date', label: 'Contribution Date', type: 'date' },
          { key: 'initiative', label: 'Initiative', type: 'string' },
          { key: 'amount', label: 'Amount (INR)', type: 'currency' }
        ]
      },
      states: {
        description: "States table with operational state information and coordinators",
        columns: [
          { key: 'code', label: 'State Code', type: 'string' },
          { key: 'name', label: 'State Name', type: 'string' },
          { key: 'coordinator', label: 'Account Manager', type: 'string' }
        ]
      },
      targets: {
        description: "State targets table with annual fundraising goals",
        columns: [
          { key: 'stateCode', label: 'State Code', type: 'string' },
          { key: 'fiscalYear', label: 'Fiscal Year', type: 'string' },
          { key: 'targetAmount', label: 'Target Amount (INR)', type: 'currency' }
        ]
      },
      schools: {
        description: "Schools table with educational institutions by state",
        columns: [
          { key: 'id', label: 'School ID', type: 'string' },
          { key: 'stateCode', label: 'State Code', type: 'string' },
          { key: 'name', label: 'School Name', type: 'string' },
          { key: 'program', label: 'Program Type', type: 'string' }
        ]
      },
      prospects: {
        description: "Prospects pipeline table with potential funding opportunities",
        columns: [
          { key: 'id', label: 'Prospect ID', type: 'string' },
          { key: 'stateCode', label: 'State Code', type: 'string' },
          { key: 'funderName', label: 'Funder Name', type: 'string' },
          { key: 'stage', label: 'Pipeline Stage', type: 'string' },
          { key: 'estimatedAmount', label: 'Estimated Amount (INR)', type: 'currency' },
          { key: 'probability', label: 'Conversion Probability', type: 'percentage' },
          { key: 'nextAction', label: 'Next Action', type: 'string' },
          { key: 'dueDate', label: 'Due Date', type: 'date' },
          { key: 'owner', label: 'Owner', type: 'string' }
        ]
      },
      users: {
        description: "Users table with platform users, roles, and permissions",
        columns: [
          { key: 'id', label: 'User ID', type: 'string' },
          { key: 'email', label: 'Email', type: 'string' },
          { key: 'firstName', label: 'First Name', type: 'string' },
          { key: 'lastName', label: 'Last Name', type: 'string' },
          { key: 'role', label: 'Role', type: 'string' },
          { key: 'status', label: 'Status', type: 'string' },
          { key: 'assignedStates', label: 'Assigned States', type: 'array' }
        ]
      }
    };
  }

  // Initialize and load all data
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('Initializing Intelligent Data Access...');

      // Load all data in parallel
      const [
        funders,
        contributions,
        states,
        targets,
        schools,
        prospects,
        users
      ] = await Promise.all([
        getFunders().catch(() => []),
        getContributions().catch(() => []),
        getStates().catch(() => []),
        getStateTargets().catch(() => []),
        getSchools().catch(() => []),
        getProspects().catch(() => []),
        getUsers().catch(() => [])
      ]);

      this.data = {
        funders,
        contributions,
        states,
        targets,
        schools,
        prospects,
        users
      };

      this.initialized = true;
      this.lastRefresh = new Date();

      console.log('Intelligent Data Access initialized with:', {
        funders: funders.length,
        contributions: contributions.length,
        states: states.length,
        targets: targets.length,
        schools: schools.length,
        prospects: prospects.length,
        users: users.length
      });

    } catch (error) {
      console.error('Failed to initialize Intelligent Data Access:', error);
      throw error;
    }
  }

  // Refresh data
  async refresh(): Promise<void> {
    this.initialized = false;
    await this.initialize();
  }

  // Get comprehensive data overview
  getDataOverview(): any {
    if (!this.initialized) {
      return { error: 'Data not initialized' };
    }

    const { funders, contributions, states, targets, schools, prospects, users } = this.data;

    // Calculate key metrics
    const currentFY = this.getCurrentFY();
    const currentContributions = contributions.filter(c => c.fiscalYear === currentFY);
    const currentTargets = targets.filter(t => t.fiscalYear === currentFY);

    const totalSecured = currentContributions.reduce((sum, c) => sum + (c.amount || 0), 0);
    const totalTarget = currentTargets.reduce((sum, t) => sum + (t.targetAmount || 0), 0);

    return {
      lastUpdated: this.lastRefresh,
      dataFreshness: {
        isFresh: Date.now() - this.lastRefresh.getTime() < 300000, // 5 minutes
        lastRefresh: this.lastRefresh.toISOString()
      },
      recordCounts: {
        funders: funders.length,
        contributions: contributions.length,
        states: states.length,
        targets: targets.length,
        schools: schools.length,
        prospects: prospects.length,
        users: users.length
      },
      currentMetrics: {
        fiscalYear: currentFY,
        totalSecured,
        totalTarget,
        achievementRate: totalTarget > 0 ? (totalSecured / totalTarget) * 100 : 0,
        shortfall: Math.max(totalTarget - totalSecured, 0)
      },
      dataQuality: {
        completeStates: states.length,
        fundedSchools: new Set(currentContributions.filter(c => c.schoolId).map(c => c.schoolId)).size,
        activeFunders: new Set(currentContributions.map(c => c.funderId)).size,
        pipelineValue: prospects.reduce((sum, p) => sum + (p.estimatedAmount || 0), 0)
      }
    };
  }

  // Intelligent query processor
  async queryData(query: string, context?: QueryContext): Promise<any> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Parse query to understand what data is needed
    const queryType = this.analyzeQueryType(query);
    const filters = this.extractFilters(query, context);

    switch (queryType) {
      case 'funder_performance':
        return this.getFunderPerformance(filters);
      case 'state_analysis':
        return this.getStateAnalysis(filters);
      case 'contribution_history':
        return this.getContributionHistory(filters);
      case 'pipeline_status':
        return this.getPipelineStatus(filters);
      case 'school_funding':
        return this.getSchoolFunding(filters);
      case 'trend_analysis':
        return this.getTrendAnalysis(filters);
      case 'comparative_analysis':
        return this.getComparativeAnalysis(filters);
      default:
        return this.getGeneralOverview(filters);
    }
  }

  // Analyze query type based on keywords
  private analyzeQueryType(query: string): string {
    const queryLower = query.toLowerCase();

    if (queryLower.includes('funder') || queryLower.includes('donor') || queryLower.includes('contributor')) {
      return 'funder_performance';
    }
    if (queryLower.includes('state') && (queryLower.includes('performance') || queryLower.includes('analysis'))) {
      return 'state_analysis';
    }
    if (queryLower.includes('contribution') || queryLower.includes('history') || queryLower.includes('transaction')) {
      return 'contribution_history';
    }
    if (queryLower.includes('pipeline') || queryLower.includes('prospect') || queryLower.includes('stage')) {
      return 'pipeline_status';
    }
    if (queryLower.includes('school') || queryLower.includes('education') || queryLower.includes('institution')) {
      return 'school_funding';
    }
    if (queryLower.includes('trend') || queryLower.includes('over time') || queryLower.includes('growth')) {
      return 'trend_analysis';
    }
    if (queryLower.includes('compare') || queryLower.includes('versus') || queryLower.includes('vs')) {
      return 'comparative_analysis';
    }

    return 'general_overview';
  }

  // Extract filters from query
  private extractFilters(query: string, context?: QueryContext): QueryContext {
    const filters: QueryContext = { ...context };

    const queryLower = query.toLowerCase();

    // Extract fiscal year
    const fyMatch = queryLower.match(/fy\d{2}-\d{2}/);
    if (fyMatch) {
      filters.fiscalYear = fyMatch[0].toUpperCase();
    }

    // Extract state code
    const stateMatch = queryLower.match(/\b(ka|tn|kl|mh|gj|rj|up|mp|wb|ap|ts|or|hr|pb|uk|ar)\b/i);
    if (stateMatch) {
      filters.stateCode = stateMatch[0].toUpperCase();
    }

    // Extract limit
    const limitMatch = queryLower.match(/top (\d+)|first (\d+)|limit (\d+)/);
    if (limitMatch) {
      filters.limit = parseInt(limitMatch[1] || limitMatch[2] || limitMatch[3]);
    }

    return filters;
  }

  // Get current fiscal year
  private getCurrentFY(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    if (month >= 4) {
      return `FY${year.toString().slice(-2)}-${(year + 1).toString().slice(-2)}`;
    } else {
      return `FY${(year - 1).toString().slice(-2)}-${year.toString().slice(-2)}`;
    }
  }

  // Get funder performance data
  private async getFunderPerformance(filters: QueryContext): Promise<any> {
    const { funders, contributions } = this.data;
    const fiscalYear = filters.fiscalYear || this.getCurrentFY();

    const funderPerformance = funders.map(funder => {
      const funderContributions = contributions.filter(c =>
        c.funderId === funder.id &&
        (!filters.fiscalYear || c.fiscalYear === filters.fiscalYear)
      );

      const totalAmount = funderContributions.reduce((sum, c) => sum + (c.amount || 0), 0);
      const stateCount = new Set(funderContributions.map(c => c.stateCode)).size;
      const contributionCount = funderContributions.length;

      // Historical data
      const allTimeContributions = contributions.filter(c => c.funderId === funder.id);
      const historicalAmount = allTimeContributions.reduce((sum, c) => sum + (c.amount || 0), 0);
      const fiscalYears = new Set(allTimeContributions.map(c => c.fiscalYear)).size;

      return {
        ...funder,
        currentAmount: totalAmount,
        historicalAmount,
        stateCount,
        contributionCount,
        fiscalYears,
        isActive: totalAmount > 0,
        avgContribution: contributionCount > 0 ? totalAmount / contributionCount : 0,
        growthRate: historicalAmount > 0 ?
          ((totalAmount - (historicalAmount / fiscalYears)) / (historicalAmount / fiscalYears)) * 100 : 0
      };
    });

    // Sort and filter
    let result = funderPerformance.filter(f => f.isActive);
    result = result.sort((a, b) => b.currentAmount - a.currentAmount);

    if (filters.limit) {
      result = result.slice(0, filters.limit);
    }

    return {
      type: 'funder_performance',
      data: result,
      summary: {
        totalActiveFunders: result.length,
        totalAmount: result.reduce((sum, f) => sum + f.currentAmount, 0),
        avgAmount: result.length > 0 ? result.reduce((sum, f) => sum + f.currentAmount, 0) / result.length : 0,
        topFunder: result[0]?.name || 'N/A'
      },
      insights: this.generateFunderInsights(result)
    };
  }

  // Get state analysis data
  private async getStateAnalysis(filters: QueryContext): Promise<any> {
    const { states, contributions, targets, schools, prospects } = this.data;
    const fiscalYear = filters.fiscalYear || this.getCurrentFY();

    const stateAnalysis = states.map(state => {
      const stateContributions = contributions.filter(c =>
        c.stateCode === state.code &&
        (!filters.fiscalYear || c.fiscalYear === filters.fiscalYear)
      );

      const stateTargets = targets.filter(t =>
        t.stateCode === state.code &&
        (!filters.fiscalYear || t.fiscalYear === filters.fiscalYear)
      );

      const stateSchools = schools.filter(s => s.stateCode === state.code);
      const stateProspects = prospects.filter(p => p.stateCode === state.code);

      const secured = stateContributions.reduce((sum, c) => sum + (c.amount || 0), 0);
      const target = stateTargets.reduce((sum, t) => sum + (t.targetAmount || 0), 0);
      const shortfall = Math.max(target - secured, 0);
      const achievement = target > 0 ? (secured / target) * 100 : 0;

      // School funding analysis
      const fundedSchoolIds = new Set(stateContributions.filter(c => c.schoolId).map(c => c.schoolId));
      const fundedSchools = stateSchools.filter(s => fundedSchoolIds.has(s.id));

      // Pipeline analysis
      const pipelineValue = stateProspects.reduce((sum, p) => sum + (p.estimatedAmount || 0), 0);
      const weightedPipeline = stateProspects.reduce((sum, p) => sum + (p.estimatedAmount || 0) * (p.probability || 0), 0);

      return {
        ...state,
        secured,
        target,
        shortfall,
        achievement,
        totalSchools: stateSchools.length,
        fundedSchools: fundedSchools.length,
        unfundedSchools: stateSchools.length - fundedSchools.length,
        fundingCoverage: stateSchools.length > 0 ? (fundedSchools.length / stateSchools.length) * 100 : 0,
        contributionCount: stateContributions.length,
        avgContribution: stateContributions.length > 0 ? secured / stateContributions.length : 0,
        pipelineValue,
        weightedPipeline,
        prospectCount: stateProspects.length
      };
    });

    // Sort and filter
    let result = stateAnalysis.sort((a, b) => b.achievement - a.achievement);

    if (filters.stateCode) {
      result = result.filter(s => s.code === filters.stateCode);
    }

    if (filters.limit) {
      result = result.slice(0, filters.limit);
    }

    return {
      type: 'state_analysis',
      data: result,
      summary: {
        totalStates: result.length,
        totalSecured: result.reduce((sum, s) => sum + s.secured, 0),
        totalTarget: result.reduce((sum, s) => sum + s.target, 0),
        avgAchievement: result.length > 0 ?
          result.reduce((sum, s) => sum + s.achievement, 0) / result.length : 0,
        totalSchools: result.reduce((sum, s) => sum + s.totalSchools, 0),
        totalFundedSchools: result.reduce((sum, s) => sum + s.fundedSchools, 0)
      },
      insights: this.generateStateInsights(result)
    };
  }

  // Get contribution history
  private async getContributionHistory(filters: QueryContext): Promise<any> {
    let { contributions } = this.data;

    // Apply filters
    if (filters.fiscalYear) {
      contributions = contributions.filter(c => c.fiscalYear === filters.fiscalYear);
    }

    if (filters.stateCode) {
      contributions = contributions.filter(c => c.stateCode === filters.stateCode);
    }

    if (filters.funderId) {
      contributions = contributions.filter(c => c.funderId === filters.funderId);
    }

    // Sort by date (most recent first)
    contributions = contributions.sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    if (filters.limit) {
      contributions = contributions.slice(0, filters.limit);
    }

    // Group by fiscal year
    const byFiscalYear = contributions.reduce((acc, c) => {
      const fy = c.fiscalYear || 'Unknown';
      if (!acc[fy]) acc[fy] = [];
      acc[fy].push(c);
      return acc;
    }, {} as Record<string, Contribution[]>);

    return {
      type: 'contribution_history',
      data: contributions,
      grouped: byFiscalYear,
      summary: {
        totalContributions: contributions.length,
        totalAmount: contributions.reduce((sum, c) => sum + (c.amount || 0), 0),
        fiscalYears: Object.keys(byFiscalYear).length,
        uniqueFunders: new Set(contributions.map(c => c.funderId)).size,
        uniqueStates: new Set(contributions.map(c => c.stateCode)).size
      },
      insights: this.generateContributionInsights(contributions)
    };
  }

  // Get pipeline status
  private async getPipelineStatus(filters: QueryContext): Promise<any> {
    let { prospects } = this.data;

    // Apply filters
    if (filters.stateCode) {
      prospects = prospects.filter(p => p.stateCode === filters.stateCode);
    }

    // Group by stage
    const byStage = prospects.reduce((acc, p) => {
      const stage = p.stage || 'Unknown';
      if (!acc[stage]) acc[stage] = [];
      acc[stage].push(p);
      return acc;
    }, {} as Record<string, Prospect[]>);

    // Calculate metrics for each stage
    const stageMetrics = Object.entries(byStage).map(([stage, stageProspects]) => {
      const totalValue = stageProspects.reduce((sum, p) => sum + (p.estimatedAmount || 0), 0);
      const weightedValue = stageProspects.reduce((sum, p) => sum + (p.estimatedAmount || 0) * (p.probability || 0), 0);
      const avgProbability = stageProspects.length > 0 ?
        stageProspects.reduce((sum, p) => sum + (p.probability || 0), 0) / stageProspects.length : 0;

      return {
        stage,
        count: stageProspects.length,
        totalValue,
        weightedValue,
        avgProbability: avgProbability * 100,
        prospects: stageProspects
      };
    });

    return {
      type: 'pipeline_status',
      data: prospects,
      byStage: stageMetrics,
      summary: {
        totalProspects: prospects.length,
        totalValue: prospects.reduce((sum, p) => sum + (p.estimatedAmount || 0), 0),
        weightedValue: prospects.reduce((sum, p) => sum + (p.estimatedAmount || 0) * (p.probability || 0), 0),
        avgProbability: prospects.length > 0 ?
          (prospects.reduce((sum, p) => sum + (p.probability || 0), 0) / prospects.length) * 100 : 0,
        stages: stageMetrics.length
      },
      insights: this.generatePipelineInsights(stageMetrics)
    };
  }

  // Generate insights for different data types
  private generateFunderInsights(funders: any[]): DataInsight[] {
    const insights: DataInsight[] = [];

    // Top performer
    if (funders.length > 0) {
      const topFunder = funders[0];
      insights.push({
        type: 'metric',
        title: 'Top Performing Funder',
        description: `${topFunder.name} leads with ${formatMoney(topFunder.currentAmount)} in contributions`,
        data: topFunder
      });
    }

    // Growth opportunities
    const inactiveFunders = this.data.funders.filter(f =>
      !funders.some(active => active.id === f.id)
    );

    if (inactiveFunders.length > 0) {
      insights.push({
        type: 'anomaly',
        title: 'Reactivation Opportunities',
        description: `${inactiveFunders.length} funders haven't contributed this year`,
        data: inactiveFunders.slice(0, 5)
      });
    }

    return insights;
  }

  private generateStateInsights(states: any[]): DataInsight[] {
    const insights: DataInsight[] = [];

    // Achievement analysis
    const highPerformers = states.filter(s => s.achievement >= 80);
    const needsAttention = states.filter(s => s.achievement < 50);

    if (highPerformers.length > 0) {
      insights.push({
        type: 'metric',
        title: 'High Performers',
        description: `${highPerformers.length} states achieving 80%+ of targets`,
        data: highPerformers
      });
    }

    if (needsAttention.length > 0) {
      insights.push({
        type: 'anomaly',
        title: 'Needs Attention',
        description: `${needsAttention.length} states below 50% achievement`,
        data: needsAttention
      });
    }

    return insights;
  }

  private generateContributionInsights(contributions: Contribution[]): DataInsight[] {
    const insights: DataInsight[] = [];

    if (contributions.length > 0) {
      const totalAmount = contributions.reduce((sum, c) => sum + (c.amount || 0), 0);
      const avgAmount = totalAmount / contributions.length;

      insights.push({
        type: 'metric',
        title: 'Contribution Analysis',
        description: `${contributions.length} contributions totaling ${formatMoney(totalAmount)} with average ${formatMoney(avgAmount)}`,
        data: { totalAmount, avgAmount, count: contributions.length }
      });
    }

    return insights;
  }

  private generatePipelineInsights(stageMetrics: any[]): DataInsight[] {
    const insights: DataInsight[] = [];

    const totalValue = stageMetrics.reduce((sum, s) => sum + s.totalValue, 0);
    const weightedValue = stageMetrics.reduce((sum, s) => sum + s.weightedValue, 0);

    insights.push({
      type: 'metric',
      title: 'Pipeline Value',
      description: `Total pipeline: ${formatMoney(totalValue)}, Weighted: ${formatMoney(weightedValue)}`,
      data: { totalValue, weightedValue, conversionRate: weightedValue > 0 ? (weightedValue / totalValue) * 100 : 0 }
    });

    return insights;
  }

  // Analyze specific data aspects
  async analyzeData(analysisType: 'performance' | 'trends' | 'funders' | 'states' | 'pipeline' | 'contribution_history'): Promise<any> {
    if (!this.initialized) {
      await this.initialize();
    }

    switch (analysisType) {
      case 'performance':
        return this.analyzePerformance();
      case 'trends':
        return this.analyzeTrends();
      case 'funders':
        return this.analyzeFunders();
      case 'states':
        return this.analyzeStates();
      case 'pipeline':
        return this.analyzePipeline();
      case 'contribution_history':
        return this.analyzeContributionHistory();
      default:
        return this.getGeneralOverview({});
    }
  }

  private analyzePerformance(): any {
    const { contributions, targets } = this.data;
    const currentFY = this.getCurrentFY();

    const currentContributions = contributions.filter(c => c.fiscalYear === currentFY);
    const currentTargets = targets.filter(t => t.fiscalYear === currentFY);

    const totalSecured = currentContributions.reduce((sum, c) => sum + (c.amount || 0), 0);
    const totalTarget = currentTargets.reduce((sum, t) => sum + (t.targetAmount || 0), 0);

    // Calculate historical performance for context
    const historicalContributions = contributions.filter(c => c.fiscalYear !== currentFY);
    const totalHistoricalSecured = historicalContributions.reduce((sum, c) => sum + (c.amount || 0), 0);
    const allTargets = targets;
    const totalAllTimeTarget = allTargets.reduce((sum, t) => sum + (t.targetAmount || 0), 0);

    // Get performance by fiscal year
    const allFiscalYears = [...new Set(contributions.map(c => c.fiscalYear))].sort();
    const fyPerformance = allFiscalYears.map(fy => {
      const fyContributions = contributions.filter(c => c.fiscalYear === fy);
      const fyTargets = targets.filter(t => t.fiscalYear === fy);
      const fySecured = fyContributions.reduce((sum, c) => sum + (c.amount || 0), 0);
      const fyTarget = fyTargets.reduce((sum, t) => sum + (t.targetAmount || 0), 0);

      return {
        fiscalYear: fy,
        secured: fySecured,
        target: fyTarget,
        achievement: fyTarget > 0 ? (fySecured / fyTarget) * 100 : 0,
        shortfall: Math.max(fyTarget - fySecured, 0),
        contributionsCount: fyContributions.length
      };
    });

    return {
      type: 'performance',
      data: {
        currentFY: {
          totalSecured,
          totalTarget,
          achievementRate: totalTarget > 0 ? (totalSecured / totalTarget) * 100 : 0,
          shortfall: Math.max(totalTarget - totalSecured, 0),
          contributionsCount: currentContributions.length
        },
        historical: {
          totalSecured: totalHistoricalSecured,
          totalTarget: totalAllTimeTarget - totalTarget,
          achievementRate: (totalAllTimeTarget - totalTarget) > 0 ?
            (totalHistoricalSecured / (totalAllTimeTarget - totalTarget)) * 100 : 0,
          contributionsCount: historicalContributions.length
        },
        allTime: {
          totalSecured: totalSecured + totalHistoricalSecured,
          totalTarget: totalAllTimeTarget,
          achievementRate: totalAllTimeTarget > 0 ?
            ((totalSecured + totalHistoricalSecured) / totalAllTimeTarget) * 100 : 0,
          contributionsCount: contributions.length
        },
        byFiscalYear: fyPerformance
      },
      summary: {
        currentFY,
        allFiscalYears,
        status: totalTarget > 0 && (totalSecured / totalTarget) >= 0.8 ? 'on-track' : 'needs-attention'
      }
    };
  }

  private analyzeTrends(): any {
    const { contributions } = this.data;

    // Get all unique fiscal years from the data
    const allFiscalYears = [...new Set(contributions.map(c => c.fiscalYear))].sort();

    const fyData = allFiscalYears.map(fy => {
      const fyContributions = contributions.filter(c => c.fiscalYear === fy);
      const total = fyContributions.reduce((sum, c) => sum + (c.amount || 0), 0);
      const avgContribution = fyContributions.length > 0 ? total / fyContributions.length : 0;
      const uniqueFunders = new Set(fyContributions.map(c => c.funderId)).size;
      const uniqueStates = new Set(fyContributions.map(c => c.stateCode)).size;

      return {
        fiscalYear: fy,
        total,
        count: fyContributions.length,
        avgContribution,
        uniqueFunders,
        uniqueStates
      };
    }).filter(d => d.total > 0);

    // Calculate year-over-year growth
    const yoyGrowth = fyData.map((current, index) => {
      if (index === 0) return { fiscalYear: current.fiscalYear, growthRate: 0, growthAmount: 0 };
      const previous = fyData[index - 1];
      const growthRate = previous.total > 0 ? ((current.total - previous.total) / previous.total) * 100 : 0;
      const growthAmount = current.total - previous.total;

      return {
        fiscalYear: current.fiscalYear,
        growthRate,
        growthAmount,
        previousTotal: previous.total
      };
    });

    return {
      type: 'trends',
      data: fyData,
      yearOverYearGrowth: yoyGrowth,
      summary: {
        yearsAnalyzed: fyData.length,
        allFiscalYears,
        totalGrowth: fyData.length > 1 ?
          ((fyData[fyData.length - 1].total - fyData[0].total) / fyData[0].total) * 100 : 0,
        averageYearlyGrowth: yoyGrowth.length > 1 ?
          yoyGrowth.slice(1).reduce((sum, g) => sum + g.growthRate, 0) / (yoyGrowth.length - 1) : 0,
        bestPerformingFY: fyData.length > 0 ? fyData.reduce((best, current) => current.total > best.total ? current : best) : null,
        worstPerformingFY: fyData.length > 0 ? fyData.reduce((worst, current) => current.total < worst.total ? current : worst) : null,
        totalContributions: fyData.reduce((sum, fy) => sum + fy.count, 0),
        totalAmount: fyData.reduce((sum, fy) => sum + fy.total, 0)
      }
    };
  }

  private analyzeFunders(): any {
    const { funders, contributions } = this.data;
    const currentFY = this.getCurrentFY();

    const funderAnalysis = funders.map(funder => {
      const funderContribs = contributions.filter(c => c.funderId === funder.id);
      const currentContribs = funderContribs.filter(c => c.fiscalYear === currentFY);
      const historicalContribs = funderContribs.filter(c => c.fiscalYear !== currentFY);

      // Get contributions by fiscal year for this funder
      const contributionsByFY = funderContribs.reduce((acc, c) => {
        if (!acc[c.fiscalYear]) acc[c.fiscalYear] = [];
        acc[c.fiscalYear].push(c);
        return acc;
      }, {} as Record<string, Contribution[]>);

      const fyBreakdown = Object.entries(contributionsByFY).map(([fy, fyContribs]) => ({
        fiscalYear: fy,
        amount: fyContribs.reduce((sum, c) => sum + (c.amount || 0), 0),
        count: fyContribs.length,
        states: new Set(fyContribs.map(c => c.stateCode)).size
      })).sort((a, b) => a.fiscalYear.localeCompare(b.fiscalYear));

      return {
        ...funder,
        totalAllTime: funderContribs.reduce((sum, c) => sum + (c.amount || 0), 0),
        currentFYAmount: currentContribs.reduce((sum, c) => sum + (c.amount || 0), 0),
        historicalAmount: historicalContribs.reduce((sum, c) => sum + (c.amount || 0), 0),
        contributionsCount: funderContribs.length,
        currentFYContributions: currentContribs.length,
        historicalContributions: historicalContribs.length,
        isActive: currentContribs.length > 0,
        statesSupported: new Set(funderContribs.map(c => c.stateCode)).size,
        firstContribution: funderContribs.length > 0 ?
          funderContribs.reduce((earliest, c) => {
            if (!earliest.date) return c;
            if (!c.date) return earliest;
            return new Date(c.date) < new Date(earliest.date) ? c : earliest;
          }).date : null,
        lastContribution: funderContribs.length > 0 ?
          funderContribs.reduce((latest, c) => {
            if (!latest.date) return c;
            if (!c.date) return latest;
            return new Date(c.date) > new Date(latest.date) ? c : latest;
          }).date : null,
        byFiscalYear: fyBreakdown
      };
    }).sort((a, b) => b.totalAllTime - a.totalAllTime);

    // Calculate overall funder statistics
    const totalContributions = contributions.length;
    const totalAmount = contributions.reduce((sum, c) => sum + (c.amount || 0), 0);
    const currentFYTotal = contributions.filter(c => c.fiscalYear === currentFY).reduce((sum, c) => sum + (c.amount || 0), 0);

    return {
      type: 'funders',
      data: funderAnalysis,
      summary: {
        totalFunders: funderAnalysis.length,
        activeFunders: funderAnalysis.filter(f => f.isActive).length,
        totalContributions,
        totalAmount,
        currentFYTotal,
        historicalTotal: totalAmount - currentFYTotal,
        topFunder: funderAnalysis[0]?.name || 'None',
        topFunderAmount: funderAnalysis[0]?.totalAllTime || 0
      }
    };
  }

  private analyzeStates(): any {
    const { states, contributions, targets } = this.data;
    const currentFY = this.getCurrentFY();

    const stateAnalysis = states.map(state => {
      const stateContribs = contributions.filter(c => c.stateCode === state.code && c.fiscalYear === currentFY);
      const stateTargets = targets.filter(t => t.stateCode === state.code && t.fiscalYear === currentFY);
      const historicalContribs = contributions.filter(c => c.stateCode === state.code && c.fiscalYear !== currentFY);
      const allStateTargets = targets.filter(t => t.stateCode === state.code);

      const currentSecured = stateContribs.reduce((sum, c) => sum + (c.amount || 0), 0);
      const currentTarget = stateTargets.reduce((sum, t) => sum + (t.targetAmount || 0), 0);
      const historicalSecured = historicalContribs.reduce((sum, c) => sum + (c.amount || 0), 0);
      const allTimeTarget = allStateTargets.reduce((sum, t) => sum + (t.targetAmount || 0), 0);

      // Get performance by fiscal year for this state
      const contributionsByFY = contributions.filter(c => c.stateCode === state.code).reduce((acc, c) => {
        if (!acc[c.fiscalYear]) acc[c.fiscalYear] = [];
        acc[c.fiscalYear].push(c);
        return acc;
      }, {} as Record<string, Contribution[]>);

      const fyBreakdown = Object.entries(contributionsByFY).map(([fy, fyContribs]) => {
        const fyTargets = targets.filter(t => t.stateCode === state.code && t.fiscalYear === fy);
        const fySecured = fyContribs.reduce((sum, c) => sum + (c.amount || 0), 0);
        const fyTarget = fyTargets.reduce((sum, t) => sum + (t.targetAmount || 0), 0);

        return {
          fiscalYear: fy,
          secured: fySecured,
          target: fyTarget,
          achievement: fyTarget > 0 ? (fySecured / fyTarget) * 100 : 0,
          shortfall: Math.max(fyTarget - fySecured, 0),
          contributionsCount: fyContribs.length
        };
      }).sort((a, b) => a.fiscalYear.localeCompare(b.fiscalYear));

      return {
        ...state,
        currentFY: {
          secured: currentSecured,
          target: currentTarget,
          achievement: currentTarget > 0 ? (currentSecured / currentTarget) * 100 : 0,
          shortfall: Math.max(currentTarget - currentSecured, 0),
          contributionsCount: stateContribs.length
        },
        historical: {
          secured: historicalSecured,
          target: allTimeTarget - currentTarget,
          achievement: (allTimeTarget - currentTarget) > 0 ? (historicalSecured / (allTimeTarget - currentTarget)) * 100 : 0,
          contributionsCount: historicalContribs.length
        },
        allTime: {
          secured: currentSecured + historicalSecured,
          target: allTimeTarget,
          achievement: allTimeTarget > 0 ? ((currentSecured + historicalSecured) / allTimeTarget) * 100 : 0,
          contributionsCount: stateContribs.length + historicalContribs.length
        },
        byFiscalYear: fyBreakdown,
        status: currentTarget > 0 ?
          (currentSecured / currentTarget >= 0.8 ? 'on-track' :
           currentSecured / currentTarget >= 0.5 ? 'at-risk' : 'critical') : 'no-target',
        uniqueFunders: new Set(contributions.filter(c => c.stateCode === state.code).map(c => c.funderId)).size,
        firstContribution: contributions.filter(c => c.stateCode === state.code).length > 0 ?
          contributions.filter(c => c.stateCode === state.code).reduce((earliest, c) => {
            if (!earliest.date) return c;
            if (!c.date) return earliest;
            return new Date(c.date) < new Date(earliest.date) ? c : earliest;
          }).date : null
      };
    }).sort((a, b) => (b.currentFY?.achievement || 0) - (a.currentFY?.achievement || 0));

    // Calculate overall state statistics
    const statesWithAnyData = stateAnalysis.filter(s => s.allTime.contributionsCount > 0);
    const statesWithCurrentTargets = stateAnalysis.filter(s => s.currentFY.target > 0);

    return {
      type: 'states',
      data: stateAnalysis,
      summary: {
        totalStates: stateAnalysis.length,
        statesWithData: statesWithAnyData.length,
        statesWithCurrentTargets: statesWithCurrentTargets.length,
        statesOnTrack: stateAnalysis.filter(s => s.status === 'on-track').length,
        statesAtRisk: stateAnalysis.filter(s => s.status === 'at-risk').length,
        criticalStates: stateAnalysis.filter(s => s.status === 'critical').length,
        totalCurrentFYTarget: stateAnalysis.reduce((sum, s) => sum + (s.currentFY?.target || 0), 0),
        totalCurrentFYSecured: stateAnalysis.reduce((sum, s) => sum + (s.currentFY?.secured || 0), 0),
        totalAllTimeSecured: stateAnalysis.reduce((sum, s) => sum + (s.allTime?.secured || 0), 0),
        overallAchievementRate: statesWithCurrentTargets.length > 0 ?
          (stateAnalysis.reduce((sum, s) => sum + (s.currentFY?.secured || 0), 0) /
           stateAnalysis.reduce((sum, s) => sum + (s.currentFY?.target || 0), 0)) * 100 : 0
      }
    };
  }

  private analyzePipeline(): any {
    const { prospects } = this.data;

    const byStage = ['Lead', 'Contacted', 'Proposal', 'Committed'].map(stage => {
      const stageProspects = prospects.filter(p => p.stage === stage);
      const totalValue = stageProspects.reduce((sum, p) => sum + (p.estimatedAmount || 0), 0);
      const weightedValue = stageProspects.reduce((sum, p) =>
        sum + (p.estimatedAmount || 0) * (p.probability || 0), 0
      );

      return {
        stage,
        count: stageProspects.length,
        totalValue,
        weightedValue,
        avgProbability: stageProspects.length > 0
          ? stageProspects.reduce((sum, p) => sum + (p.probability || 0), 0) / stageProspects.length
          : 0
      };
    });

    return {
      type: 'pipeline',
      data: byStage,
      summary: {
        totalProspects: prospects.length,
        totalValue: byStage.reduce((sum, s) => sum + s.totalValue, 0),
        weightedValue: byStage.reduce((sum, s) => sum + s.weightedValue, 0),
        conversionRate: byStage.reduce((sum, s) => sum + s.weightedValue, 0) > 0 ?
          (byStage.reduce((sum, s) => sum + s.weightedValue, 0) / byStage.reduce((sum, s) => sum + s.totalValue, 0)) * 100 : 0
      }
    };
  }

  private analyzeContributionHistory(): any {
    const { contributions } = this.data;
    const currentFY = this.getCurrentFY();

    // Get recent contributions (last 100 for better coverage)
    const recentContributions = contributions
      .sort((a, b) => {
        if (!a.date && !b.date) return 0;
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      })
      .slice(0, 100);

    // Group by fiscal year
    const byFiscalYear = contributions.reduce((acc, c) => {
      const fy = c.fiscalYear || 'Unknown';
      if (!acc[fy]) acc[fy] = [];
      acc[fy].push(c);
      return acc;
    }, {} as Record<string, Contribution[]>);

    // Calculate fiscal year summaries
    const fySummaries = Object.entries(byFiscalYear).map(([fy, fyContributions]) => {
      const totalAmount = fyContributions.reduce((sum, c) => sum + (c.amount || 0), 0);
      const avgAmount = fyContributions.length > 0 ? totalAmount / fyContributions.length : 0;
      const uniqueFunders = new Set(fyContributions.map(c => c.funderId)).size;
      const uniqueStates = new Set(fyContributions.map(c => c.stateCode)).size;

      // Get date range for this FY
      const dates = fyContributions.filter(c => c.date).map(c => new Date(c.date!));
      const earliestDate = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : null;
      const latestDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null;

      return {
        fiscalYear: fy,
        totalAmount,
        avgAmount,
        count: fyContributions.length,
        uniqueFunders,
        uniqueStates,
        dateRange: earliestDate && latestDate ? {
          start: earliestDate.toISOString().split('T')[0],
          end: latestDate.toISOString().split('T')[0]
        } : null,
        isCurrentFY: fy === currentFY
      };
    }).sort((a, b) => a.fiscalYear.localeCompare(b.fiscalYear)); // Sort by FY chronologically

    // Get top contributors by fiscal year
    const topFundersByFY = Object.entries(byFiscalYear).map(([fy, fyContributions]) => {
      const funderTotals = fyContributions.reduce((acc, c) => {
        if (!acc[c.funderId]) acc[c.funderId] = { amount: 0, count: 0 };
        acc[c.funderId].amount += c.amount || 0;
        acc[c.funderId].count += 1;
        return acc;
      }, {} as Record<string, { amount: number; count: number }>);

      const topFunders = Object.entries(funderTotals)
        .map(([funderId, data]) => ({ funderId, ...data }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      return {
        fiscalYear: fy,
        totalAmount: fyContributions.reduce((sum, c) => sum + (c.amount || 0), 0),
        topFunders
      };
    }).sort((a, b) => a.fiscalYear.localeCompare(b.fiscalYear));

    // Get state performance by fiscal year
    const statePerformanceByFY = Object.entries(byFiscalYear).map(([fy, fyContributions]) => {
      const stateTotals = fyContributions.reduce((acc, c) => {
        if (!acc[c.stateCode]) acc[c.stateCode] = { amount: 0, count: 0 };
        acc[c.stateCode].amount += c.amount || 0;
        acc[c.stateCode].count += 1;
        return acc;
      }, {} as Record<string, { amount: number; count: number }>);

      const topStates = Object.entries(stateTotals)
        .map(([stateCode, data]) => ({ stateCode, ...data }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      return {
        fiscalYear: fy,
        totalAmount: fyContributions.reduce((sum, c) => sum + (c.amount || 0), 0),
        topStates
      };
    }).sort((a, b) => a.fiscalYear.localeCompare(b.fiscalYear));

    return {
      type: 'contribution_history',
      data: recentContributions,
      byFiscalYear: fySummaries,
      topFundersByFY,
      statePerformanceByFY,
      summary: {
        totalContributions: contributions.length,
        totalAmount: contributions.reduce((sum, c) => sum + (c.amount || 0), 0),
        avgContribution: contributions.length > 0 ?
          contributions.reduce((sum, c) => sum + (c.amount || 0), 0) / contributions.length : 0,
        fiscalYears: Object.keys(byFiscalYear).length,
        uniqueFunders: new Set(contributions.map(c => c.funderId)).size,
        uniqueStates: new Set(contributions.map(c => c.stateCode)).size,
        recentContributions: recentContributions.length,
        currentFYContributions: contributions.filter(c => c.fiscalYear === currentFY).length,
        historicalContributions: contributions.filter(c => c.fiscalYear !== currentFY).length,
        allFiscalYears: Object.keys(byFiscalYear).sort()
      }
    };
  }

  // Placeholder methods for other query types
  private async getSchoolFunding(filters: QueryContext): Promise<any> {
    return { type: 'school_funding', data: [], message: 'School funding analysis coming soon' };
  }

  private async getTrendAnalysis(filters: QueryContext): Promise<any> {
    return { type: 'trend_analysis', data: [], message: 'Trend analysis coming soon' };
  }

  private async getComparativeAnalysis(filters: QueryContext): Promise<any> {
    return { type: 'comparative_analysis', data: [], message: 'Comparative analysis coming soon' };
  }

  private async getGeneralOverview(filters: QueryContext): Promise<any> {
    return {
      type: 'general_overview',
      data: this.getDataOverview(),
      message: 'General data overview provided'
    };
  }
}

// Export singleton instance
export const intelligentDataAccess = new IntelligentDataAccess();

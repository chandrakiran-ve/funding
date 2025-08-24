import { 
  getFunders, 
  getContributions, 
  getStateTargets, 
  getProspects, 
  getStates, 
  getSchools
} from '@/lib/sheets';
import { currentIndianFY } from '@/lib/fy';
import { formatMoney } from '@/lib/money';
import { DataContext, DataQuery, AnalysisResult } from './types';

// Define proper types for our data structures
interface Funder {
  id: string;
  name: string;
  [key: string]: any;
}

interface Contribution {
  id: string;
  funderId: string;
  stateCode: string;
  fiscalYear: string;
  amount: number;
  date?: string;
  [key: string]: any;
}

interface StateTarget {
  id: string;
  stateCode: string;
  fiscalYear: string;
  targetAmount: number;
  [key: string]: any;
}

interface Prospect {
  id: string;
  stateCode?: string;
  stage?: string;
  estimatedAmount: number;
  probability: number;
  [key: string]: any;
}

interface State {
  code: string;
  name: string;
  [key: string]: any;
}

interface School {
  id: string;
  [key: string]: any;
}

export class DataService {
  private dataCache: DataContext | null = null;
  private lastFetch: Date | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async getDataContext(): Promise<DataContext> {
    const now = new Date();
    
    // Return cached data if it's still fresh
    if (this.dataCache && this.lastFetch && 
        (now.getTime() - this.lastFetch.getTime()) < this.CACHE_DURATION) {
      return this.dataCache;
    }

    try {
      console.log('Fetching fresh data from Google Sheets...');
      
      const [funders, contributions, stateTargets, prospects, states, schools] = await Promise.all([
        getFunders(),
        getContributions(),
        getStateTargets(),
        getProspects(),
        getStates(),
        getSchools()
      ]);

      this.dataCache = {
        funders,
        contributions,
        stateTargets,
        prospects,
        states,
        schools,
        lastUpdated: now.toISOString()
      };
      
      this.lastFetch = now;
      console.log('Data fetched successfully:', {
        funders: funders.length,
        contributions: contributions.length,
        stateTargets: stateTargets.length,
        prospects: prospects.length,
        states: states.length,
        schools: schools.length
      });

      return this.dataCache;
    } catch (error) {
      console.error('Error fetching data:', error);
      throw new Error('Failed to fetch data from Google Sheets');
    }
  }

  async analyzeQuery(query: DataQuery): Promise<AnalysisResult> {
    const data = await this.getDataContext();
    
    switch (query.type) {
      case 'funder_analysis':
        return this.analyzeFunders(data, query);
      case 'state_performance':
        return this.analyzeStatePerformance(data, query);
      case 'contribution_history':
        return this.analyzeContributions(data, query);
      case 'pipeline_analysis':
        return this.analyzePipeline(data, query);
      case 'trend_analysis':
        return this.analyzeTrends(data, query);
      default:
        return this.performGeneralAnalysis(data, query);
    }
  }

  private analyzeFunders(data: DataContext, query: DataQuery): AnalysisResult {
    const { contributions, funders } = data;
    const currentFY = currentIndianFY();
    
    // Filter contributions by fiscal year if specified
    const targetFY = query.filters?.fiscalYear || currentFY;
    const filteredContributions = (contributions as Contribution[]).filter(c => c.fiscalYear === targetFY);
    
    // Calculate funder performance
    const funderStats = (funders as Funder[]).map(funder => {
      const funderContributions = filteredContributions.filter(c => c.funderId === funder.id);
      const totalAmount = funderContributions.reduce((sum, c) => sum + c.amount, 0);
      const contributionCount = funderContributions.length;
      const states = [...new Set(funderContributions.map(c => c.stateCode))];
      
      return {
        ...funder,
        totalAmount,
        contributionCount,
        statesSupported: states.length,
        states,
        avgContribution: contributionCount > 0 ? totalAmount / contributionCount : 0
      };
    }).sort((a, b) => b.totalAmount - a.totalAmount);

    const topFunders = funderStats.slice(0, 10);
    const totalFunding = funderStats.reduce((sum, f) => sum + f.totalAmount, 0);
    
    const insights = [
      `Top funder: ${topFunders[0]?.name || 'N/A'} with ${formatMoney(topFunders[0]?.totalAmount || 0)}`,
      `Total funders active in ${targetFY}: ${funderStats.filter(f => f.totalAmount > 0).length}`,
      `Average contribution per funder: ${formatMoney(totalFunding / Math.max(funderStats.filter(f => f.totalAmount > 0).length, 1))}`,
      `Multi-state funders: ${funderStats.filter(f => f.statesSupported > 1).length}`
    ];

    return {
      type: 'funder_analysis',
      summary: `Analysis of ${funderStats.length} funders for ${targetFY}`,
      data: topFunders,
      insights,
      metrics: {
        totalFunders: funderStats.length,
        activeFunders: funderStats.filter(f => f.totalAmount > 0).length,
        totalFunding,
        avgContribution: totalFunding / Math.max(funderStats.filter(f => f.totalAmount > 0).length, 1)
      }
    };
  }

  private analyzeStatePerformance(data: DataContext, query: DataQuery): AnalysisResult {
    const { contributions, stateTargets, states } = data;
    const currentFY = currentIndianFY();
    
    const targetFY = query.filters?.fiscalYear || currentFY;
    const filteredContributions = (contributions as Contribution[]).filter(c => c.fiscalYear === targetFY);
    const filteredTargets = (stateTargets as StateTarget[]).filter(t => t.fiscalYear === targetFY);
    
    const stateStats = (states as State[]).map(state => {
      const stateContributions = filteredContributions.filter(c => c.stateCode === state.code);
      const stateTarget = filteredTargets.find(t => t.stateCode === state.code);
      
      const totalSecured = stateContributions.reduce((sum, c) => sum + c.amount, 0);
      const targetAmount = stateTarget?.targetAmount || 0;
      const achievementRate = targetAmount > 0 ? (totalSecured / targetAmount) * 100 : 0;
      const shortfall = Math.max(0, targetAmount - totalSecured);
      
      return {
        ...state,
        totalSecured,
        targetAmount,
        achievementRate,
        shortfall,
        contributionCount: stateContributions.length,
        funders: [...new Set(stateContributions.map(c => c.funderId))].length
      };
    }).sort((a, b) => b.achievementRate - a.achievementRate);

    const totalSecured = stateStats.reduce((sum, s) => sum + s.totalSecured, 0);
    const totalTarget = stateStats.reduce((sum, s) => sum + s.targetAmount, 0);
    const overallAchievement = totalTarget > 0 ? (totalSecured / totalTarget) * 100 : 0;

    const insights = [
      `Best performing state: ${stateStats[0]?.name || 'N/A'} (${stateStats[0]?.achievementRate.toFixed(1) || 0}% achievement)`,
      `Overall achievement rate: ${overallAchievement.toFixed(1)}%`,
      `States above target: ${stateStats.filter(s => s.achievementRate >= 100).length}`,
      `Total shortfall: ${formatMoney(stateStats.reduce((sum, s) => sum + s.shortfall, 0))}`
    ];

    return {
      type: 'state_performance',
      summary: `State performance analysis for ${targetFY}`,
      data: stateStats,
      insights,
      metrics: {
        totalStates: stateStats.length,
        totalSecured,
        totalTarget,
        overallAchievement,
        statesAboveTarget: stateStats.filter(s => s.achievementRate >= 100).length
      }
    };
  }

  private analyzeContributions(data: DataContext, query: DataQuery): AnalysisResult {
    const { contributions, funders } = data;
    
    let filteredContributions = contributions as Contribution[];
    
    // Apply filters
    if (query.filters?.fiscalYear) {
      filteredContributions = filteredContributions.filter(c => c.fiscalYear === query.filters?.fiscalYear);
    }
    if (query.filters?.stateCode) {
      filteredContributions = filteredContributions.filter(c => c.stateCode === query.filters?.stateCode);
    }
    if (query.filters?.funderId) {
      filteredContributions = filteredContributions.filter(c => c.funderId === query.filters?.funderId);
    }

    // Enrich contributions with funder names
    const enrichedContributions = filteredContributions.map(contribution => {
      const funder = (funders as Funder[]).find(f => f.id === contribution.funderId);
      return {
        ...contribution,
        funderName: funder?.name || 'Unknown Funder'
      };
    }).sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime());

    const totalAmount = filteredContributions.reduce((sum, c) => sum + c.amount, 0);
    const avgAmount = filteredContributions.length > 0 ? totalAmount / filteredContributions.length : 0;
    
    // Monthly breakdown
    const monthlyData = filteredContributions.reduce((acc: Record<string, number>, contribution) => {
      const month = contribution.date ? new Date(contribution.date).toISOString().slice(0, 7) : 'Unknown';
      acc[month] = (acc[month] || 0) + contribution.amount;
      return acc;
    }, {} as Record<string, number>);

    const insights = [
      `Total contributions: ${filteredContributions.length}`,
      `Total amount: ${formatMoney(totalAmount)}`,
      `Average contribution: ${formatMoney(avgAmount)}`,
      `Most active month: ${Object.entries(monthlyData).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}`
    ];

    return {
      type: 'contribution_history',
      summary: `Analysis of ${filteredContributions.length} contributions`,
      data: enrichedContributions.slice(0, 50), // Limit to recent 50
      insights,
      metrics: {
        totalContributions: filteredContributions.length,
        totalAmount,
        avgAmount,
        ...monthlyData
      }
    };
  }

  private analyzePipeline(data: DataContext, query: DataQuery): AnalysisResult {
    const { prospects } = data;
    
    let filteredProspects = prospects as Prospect[];
    
    if (query.filters?.stateCode) {
      filteredProspects = filteredProspects.filter(p => p.stateCode === query.filters?.stateCode);
    }

    // Stage analysis
    const stageStats = filteredProspects.reduce((acc: Record<string, { count: number; totalValue: number; weightedValue: number }>, prospect) => {
      const stage = prospect.stage || 'Unknown';
      if (!acc[stage]) {
        acc[stage] = { count: 0, totalValue: 0, weightedValue: 0 };
      }
      acc[stage].count++;
      acc[stage].totalValue += prospect.estimatedAmount;
      acc[stage].weightedValue += prospect.estimatedAmount * prospect.probability;
      return acc;
    }, {} as Record<string, { count: number; totalValue: number; weightedValue: number }>);

    const totalPipelineValue = filteredProspects.reduce((sum, p) => sum + p.estimatedAmount, 0);
    const weightedPipelineValue = filteredProspects.reduce((sum, p) => sum + (p.estimatedAmount * p.probability), 0);

    const insights = [
      `Total prospects: ${filteredProspects.length}`,
      `Pipeline value: ${formatMoney(totalPipelineValue)}`,
      `Weighted pipeline: ${formatMoney(weightedPipelineValue)}`,
      `Most prospects in: ${Object.entries(stageStats).sort(([,a], [,b]) => b.count - a.count)[0]?.[0] || 'N/A'} stage`
    ];

    return {
      type: 'pipeline_analysis',
      summary: `Pipeline analysis of ${filteredProspects.length} prospects`,
      data: filteredProspects.sort((a, b) => b.estimatedAmount - a.estimatedAmount),
      insights,
      metrics: {
        totalProspects: filteredProspects.length,
        totalPipelineValue,
        weightedPipelineValue
      }
    };
  }

  private analyzeTrends(data: DataContext, _query: DataQuery): AnalysisResult {
    const { contributions } = data;
    
    // Group by fiscal year
    const yearlyData = (contributions as Contribution[]).reduce((acc: Record<string, { count: number; amount: number }>, contribution) => {
      const fy = contribution.fiscalYear || 'Unknown';
      if (!acc[fy]) {
        acc[fy] = { count: 0, amount: 0 };
      }
      acc[fy].count++;
      acc[fy].amount += contribution.amount;
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);

    const sortedYears = Object.keys(yearlyData).sort();
    const trendData = sortedYears.map(year => ({
      fiscalYear: year,
      ...yearlyData[year]
    }));

    // Calculate growth rates
    const growthRates = trendData.slice(1).map((current, index) => {
      const previous = trendData[index];
      const amountGrowth = previous.amount > 0 ? ((current.amount - previous.amount) / previous.amount) * 100 : 0;
      const countGrowth = previous.count > 0 ? ((current.count - previous.count) / previous.count) * 100 : 0;
      
      return {
        fiscalYear: current.fiscalYear,
        amountGrowth,
        countGrowth
      };
    });

    const insights = [
      `Data spans ${sortedYears.length} fiscal years`,
      `Latest year: ${sortedYears[sortedYears.length - 1] || 'N/A'}`,
      `Peak funding year: ${trendData.sort((a, b) => b.amount - a.amount)[0]?.fiscalYear || 'N/A'}`,
      `Average annual growth: ${growthRates.length > 0 ? (growthRates.reduce((sum, g) => sum + g.amountGrowth, 0) / growthRates.length).toFixed(1) : 0}%`
    ];

    return {
      type: 'trend_analysis',
      summary: `Trend analysis across ${sortedYears.length} fiscal years`,
      data: trendData,
      insights,
      metrics: {
        totalYears: sortedYears.length
      }
    };
  }

  private performGeneralAnalysis(data: DataContext, _query: DataQuery): AnalysisResult {
    const { contributions, stateTargets, prospects, funders } = data;
    const currentFY = currentIndianFY();
    
    const currentContributions = (contributions as Contribution[]).filter(c => c.fiscalYear === currentFY);
    const currentTargets = (stateTargets as StateTarget[]).filter(t => t.fiscalYear === currentFY);
    
    const totalSecured = currentContributions.reduce((sum, c) => sum + c.amount, 0);
    const totalTarget = currentTargets.reduce((sum, t) => sum + t.targetAmount, 0);
    const achievementRate = totalTarget > 0 ? (totalSecured / totalTarget) * 100 : 0;
    
    const pipelineValue = (prospects as Prospect[]).reduce((sum, p) => sum + p.estimatedAmount, 0);
    const weightedPipeline = (prospects as Prospect[]).reduce((sum, p) => sum + (p.estimatedAmount * p.probability), 0);

    const insights = [
      `Current FY (${currentFY}) achievement: ${achievementRate.toFixed(1)}%`,
      `Total secured: ${formatMoney(totalSecured)}`,
      `Pipeline value: ${formatMoney(pipelineValue)}`,
      `Active funders: ${(funders as Funder[]).filter(f => currentContributions.some(c => c.funderId === f.id)).length}`
    ];

    return {
      type: 'general_analysis',
      summary: `General fundraising overview for ${currentFY}`,
      data: [
        {
          currentMetrics: { totalSecured, totalTarget, achievementRate },
          pipelineMetrics: { pipelineValue, weightedPipeline },
          counts: {
            contributions: currentContributions.length,
            prospects: prospects.length,
            funders: funders.length
          }
        }
      ],
      insights,
      metrics: {
        totalSecured,
        totalTarget,
        achievementRate,
        pipelineValue,
        weightedPipeline
      }
    };
  }

  async refreshCache(): Promise<void> {
    this.dataCache = null;
    this.lastFetch = null;
    await this.getDataContext();
  }
}

export const dataService = new DataService();
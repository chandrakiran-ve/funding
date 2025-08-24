"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  RadialBarChart,
  RadialBar,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  DollarSign, 
  Users, 
  Calendar,
  Award,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Building2,
  Zap
} from "lucide-react";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

interface FundraisingData {
  contributions: any[];
  targets: any[];
  prospects: any[];
  funders: any[];
  states: any[];
}

interface FundraisingAnalyticsProps {
  data: FundraisingData;
  className?: string;
}

const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  pink: '#EC4899',
  indigo: '#6366F1',
  teal: '#14B8A6'
};

const CHART_COLORS = [
  COLORS.primary,
  COLORS.success,
  COLORS.warning,
  COLORS.purple,
  COLORS.pink,
  COLORS.indigo,
  COLORS.teal,
  COLORS.danger
];

export function FundraisingAnalytics({ data, className }: FundraisingAnalyticsProps) {
  const analytics = useMemo(() => {
    const { contributions, targets, prospects, funders, states } = data;
    
    // Current FY calculations
    const currentFY = 'FY24-25';
    const currentContributions = contributions.filter(c => c.fiscalYear === currentFY);
    const currentTargets = targets.filter(t => t.fiscalYear === currentFY);
    
    // Total metrics
    const totalRaised = currentContributions.reduce((sum, c) => sum + (c.amount || 0), 0);
    const totalTarget = currentTargets.reduce((sum, t) => sum + (t.targetAmount || 0), 0);
    const totalPipeline = prospects.reduce((sum, p) => sum + (p.estimatedAmount || 0), 0);
    const weightedPipeline = prospects.reduce((sum, p) => sum + (p.estimatedAmount || 0) * (p.probability || 0), 0);
    
    // Achievement rate
    const achievementRate = totalTarget > 0 ? (totalRaised / totalTarget) * 100 : 0;
    
    // Year-over-year growth
    const previousFY = 'FY23-24';
    const previousContributions = contributions.filter(c => c.fiscalYear === previousFY);
    const previousTotal = previousContributions.reduce((sum, c) => sum + (c.amount || 0), 0);
    const yoyGrowth = previousTotal > 0 ? ((totalRaised - previousTotal) / previousTotal) * 100 : 0;
    
    // Historical trend data
    const historicalData = ['FY18-19', 'FY19-20', 'FY20-21', 'FY21-22', 'FY22-23', 'FY23-24', 'FY24-25', 'FY25-26']
      .map(fy => {
        const fyContributions = contributions.filter(c => c.fiscalYear === fy);
        const fyTargets = targets.filter(t => t.fiscalYear === fy);
        const raised = fyContributions.reduce((sum, c) => sum + (c.amount || 0), 0);
        const target = fyTargets.reduce((sum, t) => sum + (t.targetAmount || 0), 0);
        
        return {
          year: fy,
          raised: raised / 10000000, // Convert to crores
          target: target / 10000000,
          achievement: target > 0 ? (raised / target) * 100 : 0
        };
      }).filter(d => d.raised > 0 || d.target > 0);
    
    // Funder distribution
    const funderContributions = funders.map(funder => {
      const funderTotal = currentContributions
        .filter(c => c.funderId === funder.id)
        .reduce((sum, c) => sum + (c.amount || 0), 0);
      
      return {
        name: funder.name,
        value: funderTotal,
        percentage: totalRaised > 0 ? (funderTotal / totalRaised) * 100 : 0,
        type: funder.type,
        priority: funder.priority
      };
    }).filter(f => f.value > 0).sort((a, b) => b.value - a.value);
    
    // State performance
    const statePerformance = states.map(state => {
      const stateContributions = currentContributions.filter(c => c.stateCode === state.code);
      const stateTargets = currentTargets.filter(t => t.stateCode === state.code);
      const stateProspects = prospects.filter(p => p.stateCode === state.code);
      
      const raised = stateContributions.reduce((sum, c) => sum + (c.amount || 0), 0);
      const target = stateTargets.reduce((sum, t) => sum + (t.targetAmount || 0), 0);
      const pipeline = stateProspects.reduce((sum, p) => sum + (p.estimatedAmount || 0), 0);
      
      return {
        state: state.name,
        code: state.code,
        coordinator: state.coordinator,
        raised,
        target,
        pipeline,
        achievement: target > 0 ? (raised / target) * 100 : 0,
        prospects: stateProspects.length
      };
    }).filter(s => s.raised > 0 || s.target > 0).sort((a, b) => b.achievement - a.achievement);
    
    // Pipeline analysis
    const pipelineByStage = ['Lead', 'Contacted', 'Proposal', 'Committed'].map(stage => {
      const stageProspects = prospects.filter(p => p.stage === stage);
      const stageValue = stageProspects.reduce((sum, p) => sum + (p.estimatedAmount || 0), 0);
      const weightedValue = stageProspects.reduce((sum, p) => sum + (p.estimatedAmount || 0) * (p.probability || 0), 0);
      
      return {
        stage,
        count: stageProspects.length,
        value: stageValue,
        weightedValue,
        avgProbability: stageProspects.length > 0 
          ? stageProspects.reduce((sum, p) => sum + (p.probability || 0), 0) / stageProspects.length * 100
          : 0
      };
    });
    
    // Monthly trend (simulated for current FY)
    const monthlyTrend = Array.from({ length: 12 }, (_, i) => {
      const month = new Date(2024, i, 1).toLocaleString('default', { month: 'short' });
      const monthContributions = currentContributions.filter(c => {
        const date = new Date(c.date);
        return date.getMonth() === i;
      });
      const monthlyTotal = monthContributions.reduce((sum, c) => sum + (c.amount || 0), 0);
      
      return {
        month,
        amount: monthlyTotal / 1000000, // Convert to lakhs
        cumulative: currentContributions.filter(c => {
          const date = new Date(c.date);
          return date.getMonth() <= i;
        }).reduce((sum, c) => sum + (c.amount || 0), 0) / 1000000
      };
    });
    
    return {
      totalRaised,
      totalTarget,
      totalPipeline,
      weightedPipeline,
      achievementRate,
      yoyGrowth,
      historicalData,
      funderContributions,
      statePerformance,
      pipelineByStage,
      monthlyTrend
    };
  }, [data]);

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    trend, 
    icon: Icon, 
    color = "blue",
    format = "currency" 
  }: {
    title: string;
    value: number;
    change?: number;
    trend?: 'up' | 'down' | 'neutral';
    icon: any;
    color?: string;
    format?: 'currency' | 'number' | 'percentage';
  }) => {
    const formatValue = (val: number) => {
      switch (format) {
        case 'currency':
          return formatMoney(val);
        case 'percentage':
          return `${val.toFixed(1)}%`;
        default:
          return val.toLocaleString();
      }
    };

    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon className={`h-5 w-5 text-${color}-500`} />
              <span className="text-sm font-medium text-muted-foreground">{title}</span>
            </div>
            {change !== undefined && (
              <div className={cn(
                "flex items-center text-xs",
                trend === 'up' && "text-green-600",
                trend === 'down' && "text-red-600",
                trend === 'neutral' && "text-gray-500"
              )}>
                {trend === 'up' && <TrendingUp className="h-3 w-3 mr-1" />}
                {trend === 'down' && <TrendingDown className="h-3 w-3 mr-1" />}
                {change > 0 ? '+' : ''}{change.toFixed(1)}%
              </div>
            )}
          </div>
          <div className="mt-2 text-2xl font-bold">
            {formatValue(value)}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Raised (FY24-25)"
          value={analytics.totalRaised}
          change={analytics.yoyGrowth}
          trend={analytics.yoyGrowth > 0 ? 'up' : analytics.yoyGrowth < 0 ? 'down' : 'neutral'}
          icon={DollarSign}
          color="green"
        />
        <MetricCard
          title="Achievement Rate"
          value={analytics.achievementRate}
          icon={Target}
          color="blue"
          format="percentage"
        />
        <MetricCard
          title="Pipeline Value"
          value={analytics.totalPipeline}
          icon={Zap}
          color="purple"
        />
        <MetricCard
          title="Active Prospects"
          value={data.prospects.length}
          icon={Users}
          color="indigo"
          format="number"
        />
      </div>

      {/* Historical Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Historical Fundraising Trend</CardTitle>
          <CardDescription>Year-over-year fundraising performance and targets</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics.historicalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis label={{ value: 'Amount (₹ Crores)', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                formatter={(value, name) => [
                  `₹${Number(value).toFixed(2)} Cr`,
                  name === 'raised' ? 'Raised' : name === 'target' ? 'Target' : 'Achievement %'
                ]}
              />
              <Area
                type="monotone"
                dataKey="target"
                stackId="1"
                stroke={COLORS.warning}
                fill={COLORS.warning}
                fillOpacity={0.3}
                name="Target"
              />
              <Area
                type="monotone"
                dataKey="raised"
                stackId="2"
                stroke={COLORS.success}
                fill={COLORS.success}
                fillOpacity={0.6}
                name="Raised"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funder Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Top Funders (FY24-25)</CardTitle>
            <CardDescription>Contribution distribution by major funders</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.funderContributions.slice(0, 8)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name.split(' ')[0]} (${percentage.toFixed(1)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.funderContributions.slice(0, 8).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatMoney(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* State Performance */}
        <Card>
          <CardHeader>
            <CardTitle>State Performance</CardTitle>
            <CardDescription>Achievement rates across operational states</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.statePerformance.slice(0, 8)} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 'dataMax']} />
                <YAxis dataKey="code" type="category" width={40} />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'achievement' ? `${Number(value).toFixed(1)}%` : formatMoney(Number(value)),
                    name === 'achievement' ? 'Achievement Rate' : name === 'raised' ? 'Raised' : 'Target'
                  ]}
                />
                <Bar dataKey="achievement" fill={COLORS.primary} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Analysis</CardTitle>
          <CardDescription>Prospect distribution across pipeline stages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {analytics.pipelineByStage.map((stage, index) => (
              <div key={stage.stage} className="text-center">
                <div className="relative">
                  <div className="w-16 h-16 mx-auto mb-2 rounded-full flex items-center justify-center text-white text-sm font-medium"
                       style={{ backgroundColor: CHART_COLORS[index] }}>
                    {stage.count}
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-white border-2 rounded-full flex items-center justify-center text-xs font-medium"
                       style={{ borderColor: CHART_COLORS[index] }}>
                    {stage.avgProbability.toFixed(0)}%
                  </div>
                </div>
                <div className="font-medium">{stage.stage}</div>
                <div className="text-sm text-muted-foreground">
                  {formatMoney(stage.weightedValue)}
                </div>
              </div>
            ))}
          </div>
          
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analytics.pipelineByStage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" />
              <YAxis label={{ value: 'Value (₹)', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => formatMoney(Number(value))} />
              <Bar dataKey="value" fill={COLORS.primary} fillOpacity={0.7} />
              <Bar dataKey="weightedValue" fill={COLORS.success} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Fundraising Trend (FY24-25)</CardTitle>
          <CardDescription>Monthly and cumulative fundraising progress</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis label={{ value: 'Amount (₹ Lakhs)', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value, name) => [
                `₹${Number(value).toFixed(2)} L`,
                name === 'amount' ? 'Monthly' : 'Cumulative'
              ]} />
              <Bar dataKey="amount" fill={COLORS.primary} fillOpacity={0.7} />
              <Line 
                type="monotone" 
                dataKey="cumulative" 
                stroke={COLORS.success} 
                strokeWidth={3}
                dot={{ fill: COLORS.success }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* State Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed State Performance</CardTitle>
          <CardDescription>Comprehensive view of state-wise fundraising metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">State</th>
                  <th className="text-left p-2">Coordinator</th>
                  <th className="text-right p-2">Target</th>
                  <th className="text-right p-2">Raised</th>
                  <th className="text-right p-2">Achievement</th>
                  <th className="text-right p-2">Pipeline</th>
                  <th className="text-center p-2">Prospects</th>
                </tr>
              </thead>
              <tbody>
                {analytics.statePerformance.map((state) => (
                  <tr key={state.code} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{state.state}</div>
                        <div className="text-sm text-muted-foreground">{state.code}</div>
                      </div>
                    </td>
                    <td className="p-2 text-sm">{state.coordinator}</td>
                    <td className="p-2 text-right">{formatMoney(state.target)}</td>
                    <td className="p-2 text-right font-medium">{formatMoney(state.raised)}</td>
                    <td className="p-2 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <span className={cn(
                          "font-medium",
                          state.achievement >= 100 ? "text-green-600" :
                          state.achievement >= 75 ? "text-blue-600" :
                          state.achievement >= 50 ? "text-yellow-600" : "text-red-600"
                        )}>
                          {state.achievement.toFixed(1)}%
                        </span>
                        <div className="w-16">
                          <Progress 
                            value={Math.min(state.achievement, 100)} 
                            className="h-2"
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-2 text-right">{formatMoney(state.pipeline)}</td>
                    <td className="p-2 text-center">
                      <Badge variant="outline">{state.prospects}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

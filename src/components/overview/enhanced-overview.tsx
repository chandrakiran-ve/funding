"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  DollarSign, 
  Users, 
  MapPin,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Filter,
  BarChart3,
  Home
} from "lucide-react";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { ResponsiveContainer, ResponsiveGrid, ResponsiveMetrics, useIsMobile } from "@/components/ui/mobile-responsive";
import { AdvancedFilters, FilterConfig, ActiveFilter } from "@/components/ui/advanced-filters";
import { ExportManager, ExportColumn, ExportOptions } from "@/components/ui/export-manager";
import { exportToCSV, exportToJSON, exportToExcel } from "@/lib/export-utils";
import { FundraisingAnalytics } from "@/components/analytics/fundraising-analytics";
import { toast } from "sonner";

interface OverviewData {
  states: any[];
  contributions: any[];
  targets: any[];
  funders: any[];
  prospects: any[];
  currentFY: string;
}

interface EnhancedOverviewProps {
  data: OverviewData;
}

export function EnhancedOverview({ data }: EnhancedOverviewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const isMobile = useIsMobile();

  const { states, contributions, targets, funders, prospects, currentFY } = data;

  // Current FY calculations
  const currentContributions = contributions.filter(c => c.fiscalYear === currentFY);
  const currentTargets = targets.filter(t => t.fiscalYear === currentFY);
  
  const totalSecured = currentContributions.reduce((sum, c) => sum + c.amount, 0);
  const totalTarget = currentTargets.reduce((sum, t) => sum + t.targetAmount, 0);
  const shortfall = Math.max(totalTarget - totalSecured, 0);
  const achievementRate = totalTarget > 0 ? (totalSecured / totalTarget) * 100 : 0;

  // Pipeline calculations
  const pipelineValue = prospects.reduce((sum, p) => sum + p.estimatedAmount, 0);
  const weightedPipeline = prospects.reduce((sum, p) => sum + (p.estimatedAmount * (p.probability || 0)), 0);

  // State performance analysis with filtering
  const statePerformance = useMemo(() => {
    let filtered = states.map(state => {
      const stateContribs = currentContributions.filter(c => c.stateCode === state.code);
      const stateTargets = currentTargets.filter(t => t.stateCode === state.code);
      const secured = stateContribs.reduce((sum, c) => sum + c.amount, 0);
      const target = stateTargets.reduce((sum, t) => sum + t.targetAmount, 0);
      const achievement = target > 0 ? (secured / target) * 100 : 0;
      
      return {
        ...state,
        secured,
        target,
        achievement,
        shortfall: Math.max(target - secured, 0),
        status: achievement >= 80 ? 'on-track' : achievement >= 50 ? 'at-risk' : 'critical'
      };
    });

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(state => 
        state.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        state.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        state.coordinator?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply advanced filters
    activeFilters.forEach(filter => {
      switch (filter.filterId) {
        case 'status':
          filtered = filtered.filter(state => state.status === filter.value);
          break;
        case 'coordinator':
          filtered = filtered.filter(state => state.coordinator === filter.value);
          break;
        case 'achievement':
          const [min, max] = filter.value;
          filtered = filtered.filter(state => 
            state.achievement >= (min || 0) && state.achievement <= (max || 100)
          );
          break;
      }
    });

    return filtered.sort((a, b) => b.achievement - a.achievement);
  }, [states, currentContributions, currentTargets, searchTerm, activeFilters]);

  const onTrackStates = statePerformance.filter(s => s.status === 'on-track').length;
  const atRiskStates = statePerformance.filter(s => s.status === 'at-risk').length;
  const criticalStates = statePerformance.filter(s => s.status === 'critical').length;

  // Filter configurations
  const filterConfigs: FilterConfig[] = [
    {
      id: 'status',
      label: 'Performance Status',
      type: 'select',
      options: [
        { id: 'on-track', label: 'On Track', value: 'on-track', count: onTrackStates },
        { id: 'at-risk', label: 'At Risk', value: 'at-risk', count: atRiskStates },
        { id: 'critical', label: 'Critical', value: 'critical', count: criticalStates }
      ]
    },
    {
      id: 'coordinator',
      label: 'Account Manager',
      type: 'multiselect',
      options: Array.from(new Set(states.map(s => s.coordinator).filter(Boolean))).map(coord => ({
        id: coord,
        label: coord,
        value: coord,
        count: states.filter(s => s.coordinator === coord).length
      }))
    },
    {
      id: 'achievement',
      label: 'Achievement Rate (%)',
      type: 'number',
      min: 0,
      max: 100
    }
  ];

  // Export configurations
  const exportColumns: ExportColumn[] = [
    { key: 'name', label: 'State Name', type: 'text' },
    { key: 'code', label: 'State Code', type: 'text' },
    { key: 'coordinator', label: 'Account Manager', type: 'text' },
    { key: 'target', label: 'Target Amount', type: 'currency', format: formatMoney },
    { key: 'secured', label: 'Secured Amount', type: 'currency', format: formatMoney },
    { key: 'achievement', label: 'Achievement Rate', type: 'number', format: (val) => `${val.toFixed(1)}%` },
    { key: 'shortfall', label: 'Shortfall', type: 'currency', format: formatMoney },
    { key: 'status', label: 'Status', type: 'text' }
  ];

  const handleExport = async (options: ExportOptions) => {
    try {
      console.log('Starting export with options:', options);
      toast.info('Preparing export...');
      
      const exportData = statePerformance.map(state => ({
        name: state.name,
        code: state.code,
        coordinator: state.coordinator || 'N/A',
        target: state.target,
        secured: state.secured,
        achievement: state.achievement,
        shortfall: state.shortfall,
        status: state.status
      }));

      console.log('Export data prepared:', { count: exportData.length, sample: exportData[0] });

      switch (options.format) {
        case 'csv':
          exportToCSV(exportData, exportColumns, options);
          toast.success('CSV file downloaded successfully!');
          break;
        case 'json':
          exportToJSON(exportData, exportColumns, options);
          toast.success('JSON file downloaded successfully!');
          break;
        case 'xlsx':
          exportToExcel(exportData, exportColumns, options);
          toast.success('Excel file downloaded successfully!');
          break;
        default:
          throw new Error(`Export format ${options.format} not yet implemented`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed. Please try again.');
      throw error;
    }
  };

  // Key metrics for responsive display
  const keyMetrics = [
    {
      label: "Total Target",
      value: formatMoney(totalTarget),
      change: "+12.5%",
      trend: 'up' as const
    },
    {
      label: "Secured",
      value: formatMoney(totalSecured),
      change: `${achievementRate.toFixed(1)}%`,
      trend: achievementRate >= 75 ? 'up' as const : 'neutral' as const
    },
    {
      label: "Shortfall",
      value: formatMoney(shortfall),
      change: "-8.2%",
      trend: 'down' as const
    },
    {
      label: "Pipeline",
      value: formatMoney(weightedPipeline),
      change: "+15.3%",
      trend: 'up' as const
    }
  ];

  return (
    <ResponsiveContainer className="space-y-8 p-6">
      {/* Premium Header */}
      <div className="premium-card-hover p-10 bg-gradient-to-br from-primary/8 via-background to-accent/5 animate-fade-in">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                Fundraising Intelligence
              </h1>
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></div>
                <p className="text-xl text-muted-foreground font-semibold">
                  Vision Empower Trust • Fiscal Year {currentFY}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <span className="flex items-center gap-2 status-success">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                <span className="font-semibold">{onTrackStates} On Track</span>
              </span>
              <span className="flex items-center gap-2 status-warning">
                <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse"></div>
                <span className="font-semibold">{atRiskStates} At Risk</span>
              </span>
              <span className="flex items-center gap-2 status-danger">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                <span className="font-semibold">{criticalStates} Critical</span>
              </span>
            </div>
          </div>
          <div className="flex gap-4 w-full sm:w-auto">
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => setIsExportOpen(true)}
              className="btn-premium-secondary flex-1 sm:flex-none hover-lift"
            >
              <Download className="h-5 w-5 mr-2" />
              Export Data
            </Button>
            <Button 
              size="lg" 
              onClick={() => setActiveTab("analytics")}
              className="btn-premium flex-1 sm:flex-none hover-glow"
            >
              <BarChart3 className="h-5 w-5 mr-2" />
              Analytics
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics - Mobile Responsive */}
      <ResponsiveMetrics metrics={keyMetrics} />

      {/* Advanced Filters */}
      <AdvancedFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterConfigs={filterConfigs}
        activeFilters={activeFilters}
        onFiltersChange={setActiveFilters}
        onExport={() => setIsExportOpen(true)}
        resultCount={statePerformance.length}
      />

      {/* Premium Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className={cn(
          "premium-card-hover p-3 h-auto bg-gradient-to-r from-card/80 to-card/60 backdrop-blur-md",
          isMobile ? "grid w-full grid-cols-2 gap-3" : "grid w-full grid-cols-4 gap-3"
        )}>
          <TabsTrigger 
            value="overview" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/90 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg h-14 font-semibold rounded-xl transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Overview
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="states" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/90 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg h-14 font-semibold rounded-xl transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              States
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="funders" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/90 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg h-14 font-semibold rounded-xl transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Funders
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="analytics" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/90 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg h-14 font-semibold rounded-xl transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ResponsiveGrid cols={{ default: 1, md: 2, lg: 3 }}>
            {/* Premium State Performance Summary */}
            <Card className="lg:col-span-2 premium-card-hover">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  State Performance Summary
                </CardTitle>
                <CardDescription className="text-base">
                  Achievement rates across {states.length} operational states
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="metric-card-premium text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">{onTrackStates}</div>
                    <div className="text-sm font-medium flex items-center justify-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      On Track
                    </div>
                  </div>
                  <div className="metric-card-premium text-center">
                    <div className="text-3xl font-bold text-yellow-600 mb-2">{atRiskStates}</div>
                    <div className="text-sm font-medium flex items-center justify-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      At Risk
                    </div>
                  </div>
                  <div className="metric-card-premium text-center">
                    <div className="text-3xl font-bold text-red-600 mb-2">{criticalStates}</div>
                    <div className="text-sm font-medium flex items-center justify-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      Critical
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {statePerformance.slice(0, 5).map((state) => (
                    <div key={state.code} className="premium-card-hover p-4 transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-muted/50 to-muted/30">
                            <MapPin className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-semibold text-lg">{state.name}</div>
                            <div className="text-sm text-muted-foreground font-medium">
                              {state.coordinator}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-lg font-bold">
                              {state.achievement.toFixed(1)}%
                            </div>
                            <div className="text-sm text-muted-foreground font-medium">
                              {formatMoney(state.secured)}
                            </div>
                          </div>
                          <Badge 
                            className={cn(
                              "font-medium px-3 py-1",
                              state.status === 'on-track' && "status-success",
                              state.status === 'at-risk' && "status-warning", 
                              state.status === 'critical' && "status-danger"
                            )}
                          >
                            {state.status === 'on-track' ? 'On Track' :
                             state.status === 'at-risk' ? 'At Risk' : 'Critical'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Premium Quick Stats */}
            <div className="space-y-6">
              <Card className="premium-card-hover">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                    Pipeline Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="metric-card-premium">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {formatMoney(pipelineValue)}
                    </div>
                    <div className="text-sm font-medium text-muted-foreground">Total Pipeline</div>
                  </div>
                  <div className="metric-card-premium">
                    <div className="text-2xl font-bold text-blue-500 mb-2">
                      {formatMoney(weightedPipeline)}
                    </div>
                    <div className="text-sm font-medium text-muted-foreground">Weighted Value</div>
                  </div>
                  <div className="metric-card-premium">
                    <div className="text-2xl font-bold text-primary mb-2">{prospects.length}</div>
                    <div className="text-sm font-medium text-muted-foreground">Active Prospects</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="premium-card-hover">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-green-600/10">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    Funder Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="metric-card-premium">
                    <div className="text-3xl font-bold text-green-600 mb-2">{funders.length}</div>
                    <div className="text-sm font-medium text-muted-foreground">Active Funders</div>
                  </div>
                  <div className="space-y-3">
                    {funders.slice(0, 3).map((funder) => {
                      const funderContribs = currentContributions.filter(c => c.funderId === funder.id);
                      const totalAmount = funderContribs.reduce((sum, c) => sum + c.amount, 0);
                      
                      return (
                        <div key={funder.id} className="premium-card p-3 flex justify-between items-center">
                          <div className="text-sm font-semibold truncate">{funder.name}</div>
                          <div className="text-sm font-bold text-primary">
                            {formatMoney(totalAmount)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </ResponsiveGrid>
        </TabsContent>

        <TabsContent value="states" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed State Performance</CardTitle>
              <CardDescription>
                Showing {statePerformance.length} of {states.length} states
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {statePerformance.map((state) => (
                  <div key={state.code} className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50">
                    <div className="flex items-center gap-4 flex-1">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="font-medium">{state.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {state.coordinator} • {state.code}
                        </div>
                        <div className="text-sm">
                          {formatMoney(state.secured)} / {formatMoney(state.target)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          {state.achievement.toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatMoney(state.shortfall)} shortfall
                        </div>
                      </div>
                      <Badge 
                        variant={
                          state.status === 'on-track' ? 'default' :
                          state.status === 'at-risk' ? 'secondary' : 'destructive'
                        }
                      >
                        {state.status === 'on-track' ? 'On Track' :
                         state.status === 'at-risk' ? 'At Risk' : 'Critical'}
                      </Badge>
                      <Link href={`/states/${state.code}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Funders</CardTitle>
              <CardDescription>
                {funders.length} funders supporting our initiatives
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {funders.map((funder) => {
                  const funderContribs = currentContributions.filter(c => c.funderId === funder.id);
                  const totalAmount = funderContribs.reduce((sum, c) => sum + c.amount, 0);
                  const stateCount = new Set(funderContribs.map(c => c.stateCode)).size;
                  
                  return (
                    <div key={funder.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50">
                      <div className="flex items-center gap-4 flex-1">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{funder.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {stateCount} states • {funder.type}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{formatMoney(totalAmount)}</div>
                        <div className="text-sm text-muted-foreground">This FY</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <FundraisingAnalytics 
            data={{
              contributions,
              targets,
              prospects,
              funders,
              states
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Export Manager */}
      <ExportManager
        data={statePerformance}
        columns={exportColumns}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        onExport={handleExport}
        title="Export State Performance Data"
        description="Download state performance data in your preferred format"
      />
    </ResponsiveContainer>
  );
}

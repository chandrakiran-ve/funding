import { formatINR } from "@/lib/money";
import { currentIndianFY } from "@/lib/fy";
import { fetchContributions, fetchStateTargets, fetchStates, fetchFunders, fetchProspects } from "@/lib/sheets";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, PieChart, Target, Calendar, ArrowUp, ArrowDown } from "lucide-react";

export default async function Page() {
  const sheetId = process.env.SHEET_ID_MASTER || process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "";
  const [states, contributions, targets, funders, prospects] = sheetId
    ? await Promise.all([
        fetchStates(sheetId),
        fetchContributions(sheetId),
        fetchStateTargets(sheetId),
        fetchFunders(sheetId),
        fetchProspects(sheetId),
      ])
    : [[], [], [], [], []];

  const currentFY = currentIndianFY();
  const previousFY = `FY${String(parseInt(currentFY.slice(2, 4)) - 1).padStart(2, '0')}-${String(parseInt(currentFY.slice(5, 7)) - 1).padStart(2, '0')}`;
  
  // Current vs Previous FY comparison
  const currentContribs = contributions.filter(c => c.fiscalYear === currentFY);
  const previousContribs = contributions.filter(c => c.fiscalYear === previousFY);
  const currentTotal = currentContribs.reduce((sum, c) => sum + c.amount, 0);
  const previousTotal = previousContribs.reduce((sum, c) => sum + c.amount, 0);
  const growthRate = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;

  // State performance analysis
  const statePerformance = states.map(state => {
    const stateContribs = currentContribs.filter(c => c.stateCode === state.code);
    const stateTargets = targets.filter(t => t.stateCode === state.code && t.fiscalYear === currentFY);
    const secured = stateContribs.reduce((sum, c) => sum + c.amount, 0);
    const target = stateTargets.reduce((sum, t) => sum + t.targetAmount, 0);
    const achievement = target > 0 ? (secured / target) * 100 : 0;
    
    return {
      ...state,
      secured,
      target,
      achievement,
      shortfall: Math.max(target - secured, 0)
    };
  }).sort((a, b) => b.achievement - a.achievement);

  // Funder contribution analysis
  const funderAnalysis = funders.map(funder => {
    const funderContribs = currentContribs.filter(c => c.funderId === funder.id);
    const funderHistorical = contributions.filter(c => c.funderId === funder.id);
    const currentAmount = funderContribs.reduce((sum, c) => sum + c.amount, 0);
    const historicalAmount = funderHistorical.reduce((sum, c) => sum + c.amount, 0);
    const statesSupported = new Set(funderContribs.map(c => c.stateCode)).size;
    
    return {
      ...funder,
      currentAmount,
      historicalAmount,
      statesSupported,
      isActive: currentAmount > 0
    };
  }).filter(f => f.historicalAmount > 0).sort((a, b) => b.currentAmount - a.currentAmount);

  // Monthly trend analysis (current FY)
  const monthlyTrends = currentContribs.reduce((acc, contrib) => {
    if (contrib.date) {
      const month = new Date(contrib.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      acc[month] = (acc[month] || 0) + contrib.amount;
    }
    return acc;
  }, {} as Record<string, number>);

  // Pipeline conversion analysis
  const pipelineByStage = ['Lead', 'Contacted', 'Proposal', 'Committed'].map(stage => {
    const stageProspects = prospects.filter(p => p.stage === stage);
    const stageValue = stageProspects.reduce((sum, p) => sum + p.estimatedAmount, 0);
    const weightedValue = stageProspects.reduce((sum, p) => sum + p.estimatedAmount * (p.probability || 0), 0);
    
    return {
      stage,
      count: stageProspects.length,
      value: stageValue,
      weightedValue,
      avgProbability: stageProspects.length > 0 ? 
        stageProspects.reduce((sum, p) => sum + (p.probability || 0), 0) / stageProspects.length : 0
    };
  });

  // Key metrics
  const totalCurrentTarget = targets.filter(t => t.fiscalYear === currentFY).reduce((sum, t) => sum + t.targetAmount, 0);
  const totalPipelineValue = prospects.reduce((sum, p) => sum + p.estimatedAmount, 0);
  const weightedPipeline = prospects.reduce((sum, p) => sum + p.estimatedAmount * (p.probability || 0), 0);
  const activeFunders = funderAnalysis.filter(f => f.isActive).length;
  const achievementRate = totalCurrentTarget > 0 ? (currentTotal / totalCurrentTarget) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights and performance metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Change Period
          </Button>
          <Button variant="outline" size="sm">
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">YoY Growth</CardTitle>
            {growthRate >= 0 ? (
              <ArrowUp className="h-4 w-4 text-green-600" />
            ) : (
              <ArrowDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {growthRate >= 0 ? '+' : ''}{growthRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              vs {previousFY}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achievement Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{achievementRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              of {currentFY} target
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Funders</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeFunders}</div>
            <p className="text-xs text-muted-foreground">
              contributing in {currentFY}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Coverage</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalCurrentTarget > 0 ? ((weightedPipeline / totalCurrentTarget) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              weighted pipeline vs target
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="states" className="space-y-4">
        <TabsList>
          <TabsTrigger value="states">State Performance</TabsTrigger>
          <TabsTrigger value="funders">Funder Analysis</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="states" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>State Achievement Rates</CardTitle>
                <CardDescription>
                  Performance against targets for {currentFY}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statePerformance.slice(0, 8).map((state) => (
                    <div key={state.code} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{state.name}</span>
                        <span className="text-muted-foreground">{state.achievement.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            state.achievement >= 80 ? 'bg-green-500' :
                            state.achievement >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(state.achievement, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Secured: {formatINR(state.secured)}</span>
                        <span>Target: {formatINR(state.target)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top & Bottom Performers</CardTitle>
                <CardDescription>
                  States ranked by achievement percentage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-green-600 mb-2">Top Performers</h4>
                    {statePerformance.slice(0, 3).map((state) => (
                      <div key={`top-${state.code}`} className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{state.code}</Badge>
                          <span className="text-sm">{state.name}</span>
                        </div>
                        <span className="text-sm font-medium text-green-600">
                          {state.achievement.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-red-600 mb-2">Needs Attention</h4>
                    {statePerformance.slice(-3).reverse().map((state) => (
                      <div key={`bottom-${state.code}`} className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{state.code}</Badge>
                          <span className="text-sm">{state.name}</span>
                        </div>
                        <span className="text-sm font-medium text-red-600">
                          {state.achievement.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="funders" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Contributors</CardTitle>
                <CardDescription>
                  Funders by contribution amount in {currentFY}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {funderAnalysis.slice(0, 8).map((funder, index) => (
                    <div key={funder.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{funder.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {funder.statesSupported} states • {funder.type}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-green-600">
                          {formatINR(funder.currentAmount)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Total: {formatINR(funder.historicalAmount)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Funder Distribution</CardTitle>
                <CardDescription>
                  Analysis by funder type and activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(
                    funderAnalysis.reduce((acc, f) => {
                      const type = f.type || 'Unknown';
                      if (!acc[type]) acc[type] = { count: 0, active: 0, total: 0 };
                      acc[type].count++;
                      if (f.isActive) acc[type].active++;
                      acc[type].total += f.currentAmount;
                      return acc;
                    }, {} as Record<string, { count: number; active: number; total: number }>)
                  ).map(([type, data]) => (
                    <div key={type} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{type}</span>
                        <span className="text-sm text-muted-foreground">
                          {data.active}/{data.count} active
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span>Total contribution: {formatINR(data.total)}</span>
                        <span>Avg: {formatINR(data.total / Math.max(data.active, 1))}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="h-1.5 rounded-full bg-blue-500"
                          style={{ width: `${(data.active / data.count) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Funding Trends</CardTitle>
                <CardDescription>
                  Contribution patterns throughout {currentFY}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(monthlyTrends).sort().map(([month, amount]) => (
                    <div key={month} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{month}</span>
                        <span className="text-green-600 font-medium">{formatINR(amount)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-green-500"
                          style={{ 
                            width: `${Math.min((amount / Math.max(...Object.values(monthlyTrends))) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Year-over-Year Comparison</CardTitle>
                <CardDescription>
                  {currentFY} vs {previousFY} performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 rounded-lg bg-blue-50">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatINR(previousTotal)}
                      </div>
                      <div className="text-sm text-muted-foreground">{previousFY}</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-green-50">
                      <div className="text-2xl font-bold text-green-600">
                        {formatINR(currentTotal)}
                      </div>
                      <div className="text-sm text-muted-foreground">{currentFY}</div>
                    </div>
                  </div>
                  
                  <div className="text-center p-4 rounded-lg border">
                    <div className={`text-3xl font-bold ${growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {growthRate >= 0 ? '+' : ''}{growthRate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Growth Rate</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {growthRate >= 0 ? 'Increase' : 'Decrease'} of {formatINR(Math.abs(currentTotal - previousTotal))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Pipeline by Stage</CardTitle>
                <CardDescription>
                  Prospect distribution and conversion potential
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pipelineByStage.map((stage) => (
                    <div key={stage.stage} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{stage.stage}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {stage.count} prospects
                          </span>
                        </div>
                        <span className="text-sm font-medium">
                          {(stage.avgProbability * 100).toFixed(0)}% avg
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Total: </span>
                          <span className="font-medium">{formatINR(stage.value)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Weighted: </span>
                          <span className="font-medium text-blue-600">{formatINR(stage.weightedValue)}</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-blue-500"
                          style={{ width: `${stage.avgProbability * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conversion Insights</CardTitle>
                <CardDescription>
                  Pipeline health and conversion metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 rounded-lg bg-blue-50">
                      <div className="text-xl font-bold text-blue-600">
                        {formatINR(totalPipelineValue)}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Pipeline</div>
                    </div>
                    <div className="p-3 rounded-lg bg-green-50">
                      <div className="text-xl font-bold text-green-600">
                        {formatINR(weightedPipeline)}
                      </div>
                      <div className="text-sm text-muted-foreground">Expected Value</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span>Conversion Rate:</span>
                      <span className="font-medium">
                        {totalPipelineValue > 0 ? ((weightedPipeline / totalPipelineValue) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Deal Size:</span>
                      <span className="font-medium">
                        {formatINR(prospects.length > 0 ? totalPipelineValue / prospects.length : 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pipeline Coverage:</span>
                      <span className="font-medium">
                        {totalCurrentTarget > 0 ? ((totalPipelineValue / totalCurrentTarget) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}


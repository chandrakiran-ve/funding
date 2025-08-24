"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatMoney } from "@/lib/money";
import { fyLabel, getCurrentFY } from "@/lib/fy";
import { ArrowUpIcon, ArrowDownIcon, TrendingUpIcon, TrendingDownIcon, CalendarIcon, Plus, Trash2 } from "lucide-react";
import { EditableAmount, EditableText, EditableFiscalYear, EditableDate } from "@/components/inline-editable";
import { toast } from "sonner";

interface FYPageClientProps {
  stateTargets: any[];
  contributions: any[];
  states: any[];
  prospects: any[];
}

export function FYPageClient({ stateTargets: initialStateTargets, contributions: initialContributions, states, prospects }: FYPageClientProps) {
  // State for editable data
  const [stateTargets, setStateTargets] = useState(initialStateTargets);
  const [contributions, setContributions] = useState(initialContributions);
  
  // Get all available fiscal years
  const availableFYs = useMemo(() => {
    const fySet = new Set<string>();
    contributions.forEach(c => c.fiscalYear && fySet.add(c.fiscalYear));
    stateTargets.forEach(t => t.fiscalYear && fySet.add(t.fiscalYear));
    
    // Add historical FYs from 2018 onwards
    [
      "FY18-19", "FY19-20", "FY20-21", "FY21-22", "FY22-23", 
      "FY23-24", "FY24-25", "FY25-26", "FY26-27", "FY27-28", "FY28-29", "FY29-30"
    ].forEach(fy => fySet.add(fy));
    
    return Array.from(fySet).sort().reverse();
  }, [contributions, stateTargets]);

  const [selectedFY, setSelectedFY] = useState(getCurrentFY());
  const currentFY = getCurrentFY();

  // Save functions
  const updateStateTarget = async (stateCode: string, fiscalYear: string, updates: any) => {
    try {
      const response = await fetch('/api/state-targets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stateCode, fiscalYear, ...updates })
      });
      
      if (response.ok) {
        setStateTargets(prev => prev.map(target => 
          target.stateCode === stateCode && target.fiscalYear === fiscalYear 
            ? { ...target, ...updates }
            : target
        ));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating state target:', error);
      return false;
    }
  };

  const updateContribution = async (contributionId: string, updates: any) => {
    try {
      const response = await fetch('/api/contributions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: contributionId, ...updates })
      });
      
      if (response.ok) {
        setContributions(prev => prev.map(contrib => 
          contrib.id === contributionId 
            ? { ...contrib, ...updates }
            : contrib
        ));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating contribution:', error);
      return false;
    }
  };

  const addNewTarget = async () => {
    const newTarget = {
      stateCode: "NEW",
      fiscalYear: selectedFY,
      targetAmount: 0
    };
    
    try {
      const response = await fetch('/api/state-targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTarget)
      });
      
      if (response.ok) {
        setStateTargets(prev => [...prev, newTarget]);
        toast.success("New target added");
      } else {
        toast.error("Failed to add target");
      }
    } catch (error) {
      console.error('Error adding target:', error);
      toast.error("Failed to add target");
    }
  };

  const addNewContribution = async () => {
    const newContribution = {
      id: `new-${Date.now()}`,
      funderId: "NEW-FUNDER",
      stateCode: "NEW",
      schoolId: "NEW-SCHOOL",
      fiscalYear: selectedFY,
      date: new Date().toISOString().split('T')[0],
      initiative: "New Initiative",
      amount: 0
    };
    
    try {
      const response = await fetch('/api/contributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContribution)
      });
      
      if (response.ok) {
        setContributions(prev => [...prev, newContribution]);
        toast.success("New contribution added");
      } else {
        toast.error("Failed to add contribution");
      }
    } catch (error) {
      console.error('Error adding contribution:', error);
      toast.error("Failed to add contribution");
    }
  };

  // Calculate metrics for any fiscal year
  const calculateFYMetrics = useMemo(() => (fiscalYear: string) => {
    const fyTargets = stateTargets.filter(t => t.fiscalYear === fiscalYear);
    const fyContributions = contributions.filter(c => c.fiscalYear === fiscalYear);
    
    const totalTarget = fyTargets.reduce((sum, t) => sum + (t.targetAmount || 0), 0);
    const totalSecured = fyContributions.reduce((sum, c) => sum + (c.amount || 0), 0);
    const shortfall = Math.max(totalTarget - totalSecured, 0);
    const achievement = totalTarget > 0 ? (totalSecured / totalTarget) * 100 : 0;
    
    return { 
      totalTarget, 
      totalSecured, 
      shortfall, 
      achievement, 
      targetCount: fyTargets.length,
      contributionCount: fyContributions.length,
      contributions: fyContributions,
      targets: fyTargets
    };
  }, [stateTargets, contributions]);

  // Metrics for selected FY
  const selectedFYMetrics = calculateFYMetrics(selectedFY);
  
  // Metrics for comparison (previous/next years)
  const getPreviousFY = (fy: string) => {
    const year = parseInt(fy.split('-')[0].replace('FY', ''));
    return `FY${year-1}-${year}`;
  };
  
  const getNextFY = (fy: string) => {
    const year = parseInt(fy.split('-')[0].replace('FY', ''));
    return `FY${year+1}-${year+2}`;
  };

  const previousFY = getPreviousFY(selectedFY);
  const nextFY = getNextFY(selectedFY);
  const previousFYMetrics = calculateFYMetrics(previousFY);
  const nextFYMetrics = calculateFYMetrics(nextFY);

  // Calculate pipeline for selected FY
  const totalPipeline = prospects.reduce((sum, p) => sum + (p.estimatedAmount || 0), 0);
  const weightedPipeline = prospects.reduce((sum, p) => sum + ((p.estimatedAmount || 0) * (p.probability || 0) / 100), 0);

  // State-wise comparison for selected FY
  const stateComparison = useMemo(() => states.map(state => {
    const selectedTarget = stateTargets.find(t => t.stateCode === state.code && t.fiscalYear === selectedFY)?.targetAmount || 0;
    const previousTarget = stateTargets.find(t => t.stateCode === state.code && t.fiscalYear === previousFY)?.targetAmount || 0;
    const nextTarget = stateTargets.find(t => t.stateCode === state.code && t.fiscalYear === nextFY)?.targetAmount || 0;
    
    const selectedSecured = contributions.filter(c => c.stateCode === state.code && c.fiscalYear === selectedFY)
      .reduce((sum, c) => sum + (c.amount || 0), 0);
    const previousSecured = contributions.filter(c => c.stateCode === state.code && c.fiscalYear === previousFY)
      .reduce((sum, c) => sum + (c.amount || 0), 0);
    
    const statePipeline = prospects.filter(p => p.stateCode === state.code)
      .reduce((sum, p) => sum + (p.estimatedAmount || 0), 0);
    
    const selectedAchievement = selectedTarget > 0 ? (selectedSecured / selectedTarget) * 100 : 0;
    const previousAchievement = previousTarget > 0 ? (previousSecured / previousTarget) * 100 : 0;
    
    const targetGrowth = previousTarget > 0 ? ((selectedTarget - previousTarget) / previousTarget) * 100 : 0;
    const achievementChange = selectedAchievement - previousAchievement;
    
    return {
      ...state,
      selectedTarget,
      previousTarget,
      nextTarget,
      selectedSecured,
      previousSecured,
      selectedAchievement,
      previousAchievement,
      targetGrowth,
      achievementChange,
      statePipeline
    };
  }), [states, stateTargets, contributions, prospects, selectedFY, previousFY, nextFY]);

  // Year-over-year growth
  const targetGrowth = previousFYMetrics.totalTarget > 0 ? 
    ((selectedFYMetrics.totalTarget - previousFYMetrics.totalTarget) / previousFYMetrics.totalTarget) * 100 : 0;
  const securedGrowth = previousFYMetrics.totalSecured > 0 ? 
    ((selectedFYMetrics.totalSecured - previousFYMetrics.totalSecured) / previousFYMetrics.totalSecured) * 100 : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Fiscal Year Analysis</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive year-over-year comparison and performance insights
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedFY} onValueChange={(value) => setSelectedFY(value as `FY${number}-${number}`)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableFYs.map(fy => (
                <SelectItem key={fy} value={fy}>
                  {fy} {fy === currentFY && "(Current)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Cards for Selected FY */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{selectedFY} Target</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(selectedFYMetrics.totalTarget)}</div>
            <div className="flex items-center text-sm mt-1">
              {targetGrowth > 0 ? (
                <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
              ) : targetGrowth < 0 ? (
                <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
              ) : null}
              <span className={targetGrowth > 0 ? 'text-green-500' : targetGrowth < 0 ? 'text-red-500' : 'text-muted-foreground'}>
                {targetGrowth !== 0 ? `${Math.abs(targetGrowth).toFixed(1)}%` : 'No change'}
              </span>
              <span className="text-muted-foreground ml-1">vs {previousFY}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{selectedFY} Secured</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(selectedFYMetrics.totalSecured)}</div>
            <div className="flex items-center text-sm mt-1">
              {securedGrowth > 0 ? (
                <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
              ) : securedGrowth < 0 ? (
                <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
              ) : null}
              <span className={securedGrowth > 0 ? 'text-green-500' : securedGrowth < 0 ? 'text-red-500' : 'text-muted-foreground'}>
                {securedGrowth !== 0 ? `${Math.abs(securedGrowth).toFixed(1)}%` : 'No change'}
              </span>
              <span className="text-muted-foreground ml-1">vs {previousFY}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Achievement Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedFYMetrics.achievement.toFixed(1)}%</div>
            <div className="flex items-center text-sm mt-1">
              <Badge variant={selectedFYMetrics.achievement >= 80 ? "default" : selectedFYMetrics.achievement >= 50 ? "secondary" : "destructive"}>
                {selectedFYMetrics.achievement >= 80 ? "Excellent" : selectedFYMetrics.achievement >= 50 ? "On Track" : "At Risk"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(totalPipeline)}</div>
            <div className="text-sm text-muted-foreground">
              Weighted: {formatMoney(weightedPipeline)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="comparison">Year Comparison</TabsTrigger>
          <TabsTrigger value="states">State Analysis</TabsTrigger>
          <TabsTrigger value="details">Detailed Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>{selectedFY} Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Need</div>
                    <div className="text-xl font-semibold">{formatMoney(selectedFYMetrics.totalTarget)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Secured</div>
                    <div className="text-xl font-semibold text-green-600">{formatMoney(selectedFYMetrics.totalSecured)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Shortfall</div>
                    <div className="text-xl font-semibold text-red-600">{formatMoney(selectedFYMetrics.shortfall)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Achievement</div>
                    <div className="text-xl font-semibold">{selectedFYMetrics.achievement.toFixed(1)}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">States with Targets</span>
                  <span className="font-semibold">{selectedFYMetrics.targetCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Active Contributions</span>
                  <span className="font-semibold">{selectedFYMetrics.contributionCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Pipeline Prospects</span>
                  <span className="font-semibold">{prospects.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Avg. Achievement</span>
                  <span className="font-semibold">{selectedFYMetrics.achievement.toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Multi-Year Comparison</CardTitle>
              <CardDescription>
                Target and achievement comparison across fiscal years (targets are editable)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fiscal Year</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Secured</TableHead>
                    <TableHead>Achievement</TableHead>
                    <TableHead>Shortfall</TableHead>
                    <TableHead>States</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">{previousFY}</TableCell>
                    <TableCell>{formatMoney(previousFYMetrics.totalTarget)}</TableCell>
                    <TableCell>{formatMoney(previousFYMetrics.totalSecured)}</TableCell>
                    <TableCell>
                      <Badge variant={previousFYMetrics.achievement > 50 ? "default" : "secondary"}>
                        {previousFYMetrics.achievement.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell>{formatMoney(previousFYMetrics.shortfall)}</TableCell>
                    <TableCell>{previousFYMetrics.targetCount}</TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/50">
                    <TableCell className="font-medium">{selectedFY} (Selected)</TableCell>
                    <TableCell className="font-semibold">{formatMoney(selectedFYMetrics.totalTarget)}</TableCell>
                    <TableCell className="font-semibold">{formatMoney(selectedFYMetrics.totalSecured)}</TableCell>
                    <TableCell>
                      <Badge variant={selectedFYMetrics.achievement > 50 ? "default" : "destructive"}>
                        {selectedFYMetrics.achievement.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">{formatMoney(selectedFYMetrics.shortfall)}</TableCell>
                    <TableCell>{selectedFYMetrics.targetCount}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">{nextFY} (Next)</TableCell>
                    <TableCell>{formatMoney(nextFYMetrics.totalTarget)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatMoney(nextFYMetrics.totalSecured)}</TableCell>
                    <TableCell>
                      {nextFYMetrics.totalTarget > 0 ? (
                        <Badge variant={nextFYMetrics.achievement > 50 ? "default" : "secondary"}>
                          {nextFYMetrics.achievement.toFixed(1)}%
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{formatMoney(nextFYMetrics.shortfall)}</TableCell>
                    <TableCell>{nextFYMetrics.targetCount}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              
              {/* Individual State Targets for Selected FY */}
              <div className="mt-6">
                <h4 className="font-medium mb-3">Individual State Targets for {selectedFY}</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>State</TableHead>
                      <TableHead>Target Amount</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedFYMetrics.targets.map((target, index) => (
                      <TableRow key={`${target.stateCode}-${target.fiscalYear}`}>
                        <TableCell className="font-medium">
                          {states.find(s => s.code === target.stateCode)?.name || target.stateCode}
                        </TableCell>
                        <TableCell>
                          <EditableAmount
                            value={target.targetAmount}
                            onSave={(value) => updateStateTarget(target.stateCode, target.fiscalYear, { targetAmount: value })}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setStateTargets(prev => prev.filter(t => !(t.stateCode === target.stateCode && t.fiscalYear === target.fiscalYear)));
                              toast.success("Target deleted");
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="states" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>State-wise Performance for {selectedFY}</CardTitle>
                  <CardDescription>
                    Detailed breakdown of performance by state with comparisons (click to edit targets)
                  </CardDescription>
                </div>
                <Button onClick={addNewTarget} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Target
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>State</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Secured</TableHead>
                    <TableHead>Achievement</TableHead>
                    <TableHead>Target Growth</TableHead>
                    <TableHead>Performance Change</TableHead>
                    <TableHead>Pipeline</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stateComparison.map((state) => (
                    <TableRow key={state.code}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{state.name}</div>
                          <div className="text-sm text-muted-foreground">{state.code}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <EditableAmount
                          value={state.selectedTarget}
                          onSave={(value) => updateStateTarget(state.code, selectedFY, { targetAmount: value })}
                        />
                      </TableCell>
                      <TableCell>{formatMoney(state.selectedSecured)}</TableCell>
                      <TableCell>
                        <Badge variant={state.selectedAchievement > 50 ? "default" : "secondary"}>
                          {state.selectedAchievement.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {state.targetGrowth > 0 ? (
                            <TrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                          ) : state.targetGrowth < 0 ? (
                            <TrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                          ) : null}
                          <span className={state.targetGrowth > 0 ? 'text-green-600' : state.targetGrowth < 0 ? 'text-red-600' : 'text-muted-foreground'}>
                            {state.targetGrowth !== 0 ? `${state.targetGrowth.toFixed(1)}%` : 'No change'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {state.achievementChange > 0 ? (
                            <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
                          ) : state.achievementChange < 0 ? (
                            <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
                          ) : null}
                          <span className={state.achievementChange > 0 ? 'text-green-600' : state.achievementChange < 0 ? 'text-red-600' : 'text-muted-foreground'}>
                            {state.achievementChange !== 0 ? `${Math.abs(state.achievementChange).toFixed(1)}pp` : 'No change'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{formatMoney(state.statePipeline)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>{selectedFY} Detailed Contributions</CardTitle>
                  <CardDescription>
                    All contributions received during {selectedFY} (click to edit any field)
                  </CardDescription>
                </div>
                <Button onClick={addNewContribution} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Contribution
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {selectedFYMetrics.contributions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Funder</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>School</TableHead>
                      <TableHead>Initiative</TableHead>
                      <TableHead>FY</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedFYMetrics.contributions.map((contribution, index) => (
                      <TableRow key={contribution.id || index}>
                        <TableCell>
                          <EditableDate
                            value={contribution.date}
                            onSave={(value) => updateContribution(contribution.id, { date: value })}
                          />
                        </TableCell>
                        <TableCell>
                          <EditableText
                            value={contribution.funderId}
                            onSave={(value) => updateContribution(contribution.id, { funderId: value })}
                            placeholder="Funder ID"
                          />
                        </TableCell>
                        <TableCell>
                          <EditableText
                            value={contribution.stateCode}
                            onSave={(value) => updateContribution(contribution.id, { stateCode: value })}
                            placeholder="State Code"
                          />
                        </TableCell>
                        <TableCell>
                          <EditableText
                            value={contribution.schoolId}
                            onSave={(value) => updateContribution(contribution.id, { schoolId: value })}
                            placeholder="School ID"
                          />
                        </TableCell>
                        <TableCell>
                          <EditableText
                            value={contribution.initiative}
                            onSave={(value) => updateContribution(contribution.id, { initiative: value })}
                            placeholder="Initiative"
                          />
                        </TableCell>
                        <TableCell>
                          <EditableFiscalYear
                            value={contribution.fiscalYear}
                            onSave={(value) => updateContribution(contribution.id, { fiscalYear: value })}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <EditableAmount
                            value={contribution.amount}
                            onSave={(value) => updateContribution(contribution.id, { amount: value })}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setContributions(prev => prev.filter(c => c.id !== contribution.id));
                              toast.success("Contribution deleted");
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No contributions found for {selectedFY}</p>
                  <Button onClick={addNewContribution} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Contribution
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

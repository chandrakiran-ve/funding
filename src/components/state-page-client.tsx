"use client";

import { useState, useMemo } from "react";
import { formatINR } from "@/lib/money";
import { currentIndianFY } from "@/lib/fy";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MapPin, 
  Target, 
  TrendingUp, 
  School, 
  Users, 
  Building2,
  Calendar,
  DollarSign,
  ArrowLeft,
  Mail,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { StateDataEditor } from "@/components/state-data-editor";

interface StatePageClientProps {
  stateCode: string;
  state: any;
  contributions: any[];
  targets: any[];
  schools: any[];
  funders: any[];
}

export function StatePageClient({ 
  stateCode, 
  state, 
  contributions, 
  targets, 
  schools, 
  funders 
}: StatePageClientProps) {
  const [selectedFY, setSelectedFY] = useState(currentIndianFY());
  
  // Get all available fiscal years
  const availableFYs = useMemo(() => {
    const fySet = new Set<string>();
    contributions.forEach(c => c.fiscalYear && fySet.add(c.fiscalYear));
    targets.forEach(t => t.fiscalYear && fySet.add(t.fiscalYear));
    
    // Add current and next FY if not present
    fySet.add(currentIndianFY());
    fySet.add("FY25-26");
    fySet.add("FY26-27");
    
    return Array.from(fySet).sort().reverse();
  }, [contributions, targets]);

  // Filter data by selected fiscal year
  const stateContribs = useMemo(() => 
    contributions.filter(c => c.stateCode === stateCode), 
    [contributions, stateCode]
  );
  
  const stateTargets = useMemo(() => 
    targets.filter(t => t.stateCode === stateCode), 
    [targets, stateCode]
  );
  
  const stateSchools = useMemo(() => 
    schools.filter(s => s.stateCode === stateCode), 
    [schools, stateCode]
  );

  // Calculate metrics for selected fiscal year
  const selectedFYMetrics = useMemo(() => {
    const fyContribs = stateContribs.filter(c => c.fiscalYear === selectedFY);
    const fyTargets = stateTargets.filter(t => t.fiscalYear === selectedFY);
    
    const secured = fyContribs.reduce((sum, c) => sum + (c.amount || 0), 0);
    const target = fyTargets.reduce((sum, t) => sum + (t.targetAmount || 0), 0);
    const shortfall = Math.max(target - secured, 0);
    const achievement = target > 0 ? (secured / target) * 100 : 0;
    
    // Active funders for selected FY
    const activeFunderIds = new Set(fyContribs.map(c => c.funderId));
    const activeFunders = funders.filter(f => activeFunderIds.has(f.id));
    
    // Funded schools for selected FY
    const fundedSchoolIds = new Set(fyContribs.map(c => c.schoolId));
    const fundedSchools = fundedSchoolIds.size;
    
    return {
      secured,
      target,
      shortfall,
      achievement,
      activeFunders,
      fundedSchools,
      contributions: fyContribs
    };
  }, [stateContribs, stateTargets, funders, selectedFY]);

  // Calculate all-time metrics
  const totalHistorical = stateContribs.reduce((sum, c) => sum + (c.amount || 0), 0);
  const activeFundersCount = new Set(stateContribs.map(c => c.funderId)).size;

  // Group data by fiscal year for comparison view
  const byFY = stateContribs.reduce((acc: Record<string, number>, c) => {
    if (c.fiscalYear) {
      acc[c.fiscalYear] = (acc[c.fiscalYear] || 0) + c.amount;
    }
    return acc;
  }, {});

  const targetsByFY = stateTargets.reduce((acc: Record<string, number>, t) => {
    if (t.fiscalYear) {
      acc[t.fiscalYear] = (acc[t.fiscalYear] || 0) + t.targetAmount;
    }
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/states">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to States
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{state.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{stateCode}</Badge>
              <Badge variant={selectedFYMetrics.achievement >= 80 ? 'default' : selectedFYMetrics.achievement >= 50 ? 'secondary' : 'destructive'}>
                {selectedFYMetrics.achievement.toFixed(1)}% Achievement ({selectedFY})
              </Badge>
              <Badge variant="outline">{activeFundersCount} Active Funders</Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          {/* Fiscal Year Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedFY} onValueChange={(value) => setSelectedFY(value as `FY${number}-${number}`)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableFYs.map(fy => (
                  <SelectItem key={fy} value={fy}>
                    {fy}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <StateDataEditor 
            stateCode={stateCode} 
            stateName={state.name}
            initialData={{
              state,
              contributions: stateContribs,
              targets: stateTargets,
              schools: stateSchools,
              funders: selectedFYMetrics.activeFunders
            }}
          />
        </div>
      </div>

      {/* Coordinator Info */}
      {state.coordinator && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Coordinator:</span>
              <span className="font-medium">{state.coordinator}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics for Selected FY */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Target ({selectedFY})</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatINR(selectedFYMetrics.target)}</div>
            <p className="text-xs text-muted-foreground">
              Funding goal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Secured ({selectedFY})</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatINR(selectedFYMetrics.secured)}</div>
            <p className="text-xs text-muted-foreground">
              {selectedFYMetrics.achievement.toFixed(1)}% achieved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Schools Funded ({selectedFY})</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedFYMetrics.fundedSchools}</div>
            <p className="text-xs text-muted-foreground">
              of {stateSchools.length} total schools
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Historical</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatINR(totalHistorical)}</div>
            <p className="text-xs text-muted-foreground">
              All-time funding
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">FY Performance</TabsTrigger>
          <TabsTrigger value="current">Current FY Details</TabsTrigger>
          <TabsTrigger value="schools">Schools</TabsTrigger>
          <TabsTrigger value="funders">Funders</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fiscal Year Performance</CardTitle>
              <CardDescription>
                Target vs secured funding across all fiscal years
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.keys({ ...byFY, ...targetsByFY }).sort().reverse().map((fy) => {
                  const secured = byFY[fy] || 0;
                  const target = targetsByFY[fy] || 0;
                  const shortfall = Math.max(target - secured, 0);
                  const achievement = target > 0 ? (secured / target) * 100 : 0;
                  
                  return (
                    <div key={fy} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant={fy === selectedFY ? 'default' : 'outline'}>{fy}</Badge>
                          {fy === currentIndianFY() && <Badge variant="secondary">Current</Badge>}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium">
                            {achievement.toFixed(1)}%
                          </div>
                          {achievement >= 80 ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : achievement >= 50 ? (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Target</div>
                          <div className="font-medium">{formatINR(target)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Secured</div>
                          <div className="font-medium text-green-600">{formatINR(secured)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Shortfall</div>
                          <div className="font-medium text-red-600">{formatINR(shortfall)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Achievement</div>
                          <div className="font-medium">{achievement.toFixed(1)}%</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="current" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{selectedFY} Detailed Breakdown</CardTitle>
              <CardDescription>
                Detailed contributions and progress for {selectedFY}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedFYMetrics.contributions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Funder</TableHead>
                      <TableHead>School</TableHead>
                      <TableHead>Initiative</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedFYMetrics.contributions.map((contribution, index) => (
                      <TableRow key={index}>
                        <TableCell>{contribution.date}</TableCell>
                        <TableCell>{contribution.funderId}</TableCell>
                        <TableCell>{contribution.schoolId}</TableCell>
                        <TableCell>{contribution.initiative}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatINR(contribution.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No contributions found for {selectedFY}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schools" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Schools in {state.name}</CardTitle>
              <CardDescription>
                All schools and their funding status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stateSchools.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>School ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Program</TableHead>
                      <TableHead className="text-right">Total Funding</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stateSchools.map((school) => {
                      const schoolContribs = stateContribs.filter(c => c.schoolId === school.id);
                      const totalFunding = schoolContribs.reduce((sum, c) => sum + c.amount, 0);
                      
                      return (
                        <TableRow key={school.id}>
                          <TableCell>{school.id}</TableCell>
                          <TableCell>{school.name}</TableCell>
                          <TableCell>{school.program}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatINR(totalFunding)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No schools found for {state.name}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Funders</CardTitle>
              <CardDescription>
                Funders contributing to {state.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funder</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Total Contribution</TableHead>
                    <TableHead className="text-right">{selectedFY} Contribution</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {funders.map((funder) => {
                    const funderContribs = stateContribs.filter(c => c.funderId === funder.id);
                    const totalAmount = funderContribs.reduce((sum, c) => sum + c.amount, 0);
                    const currentAmount = funderContribs
                      .filter(c => c.fiscalYear === selectedFY)
                      .reduce((sum, c) => sum + c.amount, 0);
                    
                    if (totalAmount === 0) return null;
                    
                    return (
                      <TableRow key={funder.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{funder.name}</div>
                            <div className="text-sm text-muted-foreground">{funder.id}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{funder.type}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatINR(totalAmount)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatINR(currentAmount)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

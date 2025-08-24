import { formatINR } from "@/lib/money";
import { currentIndianFY } from "@/lib/fy";
import { fetchContributions, fetchFunders, fetchStates, fetchSchools } from "@/lib/sheets";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  TrendingUp, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Target,
  Users,
  School,
  ArrowLeft,
  Mail,
  Phone
} from "lucide-react";
import Link from "next/link";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  // Await params as required in Next.js 15
  const { id } = await params;
  
  const sheetId = process.env.SHEET_ID_MASTER || process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "";
  const [funders, contributions, states, schools] = sheetId
    ? await Promise.all([
        fetchFunders(sheetId), 
        fetchContributions(sheetId),
        fetchStates(sheetId),
        fetchSchools(sheetId)
      ])
    : [[], [], [], []];
  
  const funder = funders.find((f) => f.id === id);
  const funderContribs = contributions.filter((c) => c.funderId === id);
  
  if (!funder) {
    return (
      <div className="text-center py-12">
        <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-sm font-medium">Funder not found</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          The funder you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link href="/funders">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Funders
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentFY = currentIndianFY();
  const currentContribs = funderContribs.filter(c => c.fiscalYear === currentFY);
  
  // Calculate metrics
  const totalHistorical = funderContribs.reduce((sum, c) => sum + c.amount, 0);
  const totalCurrent = currentContribs.reduce((sum, c) => sum + c.amount, 0);
  const uniqueStates = new Set(funderContribs.map(c => c.stateCode));
  const uniqueSchools = new Set(funderContribs.filter(c => c.schoolId).map(c => c.schoolId));
  const fiscalYears = new Set(funderContribs.map(c => c.fiscalYear));

  // Group by fiscal year
  const byFY = funderContribs.reduce<Record<string, number>>((acc, c) => {
    acc[c.fiscalYear] = (acc[c.fiscalYear] || 0) + c.amount;
    return acc;
  }, {});

  // Group by state with details
  const byState = Array.from(uniqueStates).map(stateCode => {
    const state = states.find(s => s.code === stateCode);
    const stateContribs = funderContribs.filter(c => c.stateCode === stateCode);
    const stateTotal = stateContribs.reduce((sum, c) => sum + c.amount, 0);
    const stateSchools = new Set(stateContribs.filter(c => c.schoolId).map(c => c.schoolId));
    
    return {
      code: stateCode,
      name: state?.name || stateCode,
      coordinator: state?.coordinator,
      total: stateTotal,
      contributions: stateContribs.length,
      schools: stateSchools.size,
      latestContribution: stateContribs.sort((a, b) => 
        new Date(b.date || '').getTime() - new Date(a.date || '').getTime()
      )[0]
    };
  }).sort((a, b) => b.total - a.total);

  // Renewal analysis
  const fyEntries = Object.entries(byFY).sort();
  const renewalPattern = fyEntries.length > 1 ? 'Multi-year' : 'Single-year';
  const avgYearlyAmount = fyEntries.length > 0 ? totalHistorical / fyEntries.length : 0;
  const isCurrentlyActive = totalCurrent > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/funders">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{funder.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{funder.type || 'Unknown Type'}</Badge>
              <Badge variant={isCurrentlyActive ? 'default' : 'secondary'}>
                {isCurrentlyActive ? 'Active' : 'Inactive'} {currentFY}
              </Badge>
              <Badge variant="outline">{renewalPattern}</Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Mail className="mr-2 h-4 w-4" />
            Contact
          </Button>
          <Button size="sm">
            Edit Funder
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contributions</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatINR(totalHistorical)}</div>
            <p className="text-xs text-muted-foreground">
              All-time total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current FY</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatINR(totalCurrent)}</div>
            <p className="text-xs text-muted-foreground">
              {currentFY}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">States Supported</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueStates.size}</div>
            <p className="text-xs text-muted-foreground">
              {uniqueSchools.size} schools
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg per Year</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatINR(avgYearlyAmount)}</div>
            <p className="text-xs text-muted-foreground">
              {fiscalYears.size} fiscal years
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Contact & Details */}
      {funder.owner && (
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Owner: {funder.owner}</span>
              </div>
              {funder.priority && (
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline">Priority: {funder.priority}</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="contributions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="contributions">Contribution History</TabsTrigger>
          <TabsTrigger value="states">States & Impact</TabsTrigger>
          <TabsTrigger value="renewal">Renewal Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="contributions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Contributions</CardTitle>
              <CardDescription>
                Complete history of contributions from {funder.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Fiscal Year</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead>Initiative</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {funderContribs
                    .sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime())
                    .map((contrib) => {
                      const state = states.find(s => s.code === contrib.stateCode);
                      const school = schools.find(s => s.id === contrib.schoolId);
                      
                      return (
                        <TableRow key={contrib.id}>
                          <TableCell>
                            {contrib.date ? new Date(contrib.date).toLocaleDateString() : '—'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{contrib.fiscalYear}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {state?.name || contrib.stateCode}
                            </div>
                          </TableCell>
                          <TableCell>
                            {school ? (
                              <div className="flex items-center gap-1">
                                <School className="h-3 w-3" />
                                {school.name}
                              </div>
                            ) : '—'}
                          </TableCell>
                          <TableCell>{contrib.initiative || '—'}</TableCell>
                          <TableCell>
                            <div className="font-medium text-green-600">
                              {formatINR(contrib.amount)}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="states" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>State-wise Impact</CardTitle>
              <CardDescription>
                Breakdown of contributions by state and schools impacted
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {byState.map((stateData) => (
                  <div key={stateData.code} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{stateData.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {stateData.coordinator && `Coordinator: ${stateData.coordinator}`}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-green-600">
                          {formatINR(stateData.total)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {stateData.contributions} contributions
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <School className="h-4 w-4" />
                        <span>{stateData.schools} schools impacted</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Latest: {stateData.latestContribution?.fiscalYear}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        <span>Avg: {formatINR(stateData.total / stateData.contributions)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="renewal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Renewal Pattern Analysis</CardTitle>
              <CardDescription>
                Historical funding pattern and renewal insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Yearly Contributions</h4>
                  <div className="space-y-2">
                    {Object.entries(byFY).sort().map(([fy, amount]) => (
                      <div key={fy} className="flex items-center justify-between p-2 rounded border">
                        <Badge variant="outline">{fy}</Badge>
                        <span className="font-medium">{formatINR(amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Insights</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
                      <div>
                        <div className="font-medium">Funding Pattern</div>
                        <div className="text-muted-foreground">{renewalPattern} supporter</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5"></div>
                      <div>
                        <div className="font-medium">Average Annual</div>
                        <div className="text-muted-foreground">{formatINR(avgYearlyAmount)}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <div className={`w-2 h-2 rounded-full mt-1.5 ${isCurrentlyActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <div>
                        <div className="font-medium">Current Status</div>
                        <div className="text-muted-foreground">
                          {isCurrentlyActive ? `Active in ${currentFY}` : `Not active in ${currentFY}`}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}



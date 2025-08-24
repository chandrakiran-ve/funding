"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatMoney } from "@/lib/money";
import { ProspectDetailModal } from "./prospect-detail-modal";
import { toast } from "sonner";
import { 
  TrendingUp, 
  Users, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Plus,
  AlertCircle,
  Clock,
  CheckCircle2,
  Target,
  Building2,
  Search,
  Filter,
  Edit3,
  Trash2,
  Phone,
  Mail,
  FileText,
  ExternalLink,
  Tag,
  MoreHorizontal
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Prospect {
  id: string;
  stateCode: string;
  funderName: string;
  stage: string;
  estimatedAmount: number;
  probability: number;
  nextAction?: string;
  dueDate?: string;
  owner?: string;
  description?: string;
  documents?: string;
  tags?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  lastContact?: string;
  notes?: string;
}

interface State {
  code: string;
  name: string;
  coordinator?: string;
}

interface PipelineClientProps {
  initialProspects: Prospect[];
  states: State[];
}

const STAGES = ["Lead", "Contacted", "Proposal", "Committed"] as const;
const STAGE_COLORS = {
  Lead: "bg-gray-100 border-gray-300 text-gray-800",
  Contacted: "bg-blue-100 border-blue-300 text-blue-800", 
  Proposal: "bg-yellow-100 border-yellow-300 text-yellow-800",
  Committed: "bg-green-100 border-green-300 text-green-800"
} as const;

const STAGE_ICONS = {
  Lead: Users,
  Contacted: Building2,
  Proposal: Target,
  Committed: CheckCircle2
} as const;

export function PipelineClient({ initialProspects, states }: PipelineClientProps) {
  const [prospects, setProspects] = useState<Prospect[]>(initialProspects);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");

  // Filtered prospects
  const filteredProspects = useMemo(() => {
    return prospects.filter(prospect => {
      const matchesSearch = prospect.funderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          prospect.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          prospect.tags?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStage = stageFilter === "all" || prospect.stage === stageFilter;
      const matchesState = stateFilter === "all" || prospect.stateCode === stateFilter;
      
      return matchesSearch && matchesStage && matchesState;
    });
  }, [prospects, searchTerm, stageFilter, stateFilter]);

  // Pipeline metrics
  const columns = STAGES.map((stage) => {
    const stageProspects = filteredProspects.filter((p) => p.stage === stage);
    const stageValue = stageProspects.reduce((sum, p) => sum + p.estimatedAmount, 0);
    const weightedValue = stageProspects.reduce((sum, p) => sum + p.estimatedAmount * (p.probability || 0), 0);
    
    return {
      stage,
      items: stageProspects,
      totalValue: stageValue,
      weightedValue,
      count: stageProspects.length
    };
  });

  const totalPipelineValue = filteredProspects.reduce((sum, p) => sum + p.estimatedAmount, 0);
  const weightedTotal = filteredProspects.reduce((sum, p) => sum + p.estimatedAmount * (p.probability || 0), 0);
  const averageDealSize = filteredProspects.length > 0 ? totalPipelineValue / filteredProspects.length : 0;

  // Prospects by state
  const prospectsByState = states.map(state => {
    const stateProspects = filteredProspects.filter(p => p.stateCode === state.code);
    const stateValue = stateProspects.reduce((sum, p) => sum + p.estimatedAmount, 0);
    const weightedValue = stateProspects.reduce((sum, p) => sum + p.estimatedAmount * (p.probability || 0), 0);
    
    return {
      ...state,
      prospects: stateProspects.length,
      totalValue: stateValue,
      weightedValue,
      averageProbability: stateProspects.length > 0 ? 
        stateProspects.reduce((sum, p) => sum + (p.probability || 0), 0) / stateProspects.length : 0
    };
  }).filter(s => s.prospects > 0).sort((a, b) => b.weightedValue - a.weightedValue);

  // Upcoming actions
  const upcomingActions = filteredProspects
    .filter(p => p.nextAction && p.dueDate)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 10);

  // CRUD operations
  const handleSaveProspect = async (prospectData: Prospect): Promise<boolean> => {
    try {
      const isNew = !prospects.find(p => p.id === prospectData.id);
      const method = isNew ? 'POST' : 'PUT';
      
      const response = await fetch('/api/prospects', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prospectData)
      });

      if (response.ok) {
        if (isNew) {
          setProspects(prev => [...prev, prospectData]);
        } else {
          setProspects(prev => prev.map(p => p.id === prospectData.id ? prospectData : p));
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving prospect:', error);
      return false;
    }
  };

  const handleDeleteProspect = async (prospectId: string) => {
    try {
      const response = await fetch(`/api/prospects?id=${prospectId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setProspects(prev => prev.filter(p => p.id !== prospectId));
        toast.success("Prospect deleted");
      } else {
        toast.error("Failed to delete prospect");
      }
    } catch (error) {
      console.error('Error deleting prospect:', error);
      toast.error("Failed to delete prospect");
    }
  };

  const handleStageChange = async (prospectId: string, newStage: string) => {
    const prospect = prospects.find(p => p.id === prospectId);
    if (!prospect) return;

    const success = await handleSaveProspect({ ...prospect, stage: newStage });
    if (success) {
      toast.success(`Moved to ${newStage}`);
    }
  };

  const openModal = (prospect?: Prospect) => {
    setSelectedProspect(prospect);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedProspect(undefined);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pipeline Management</h1>
          <p className="text-muted-foreground">
            Manage prospects, track progress, and convert opportunities
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Export Pipeline
          </Button>
          <Button size="sm" onClick={() => openModal()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Prospect
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search prospects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  {STAGES.map(stage => (
                    <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {states.map(state => (
                  <SelectItem key={state.code} value={state.code}>
                    {state.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="text-sm text-muted-foreground">
              {filteredProspects.length} of {prospects.length} prospects
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pipeline</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(totalPipelineValue)}</div>
            <p className="text-xs text-muted-foreground">
              {filteredProspects.length} prospects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weighted Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatMoney(weightedTotal)}</div>
            <p className="text-xs text-muted-foreground">
              Expected conversion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(averageDealSize)}</div>
            <p className="text-xs text-muted-foreground">
              Per prospect
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalPipelineValue > 0 ? ((weightedTotal / totalPipelineValue) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Expected success rate
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="kanban" className="space-y-4">
        <TabsList>
          <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="states">By State</TabsTrigger>
          <TabsTrigger value="actions">Action Items</TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {columns.map((col) => {
              const StageIcon = STAGE_ICONS[col.stage];
              return (
                <Card key={col.stage} className={`${STAGE_COLORS[col.stage]} min-h-96`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <StageIcon className="h-4 w-4" />
                        <CardTitle className="text-sm font-medium">{col.stage}</CardTitle>
                      </div>
                      <Badge variant="secondary">{col.count}</Badge>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div>Total: {formatMoney(col.totalValue)}</div>
                      <div>Weighted: {formatMoney(col.weightedValue)}</div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {col.items.map((prospect) => {
                        const state = states.find(s => s.code === prospect.stateCode);
                        const isOverdue = prospect.dueDate && new Date(prospect.dueDate) < new Date();
                        const documents = prospect.documents?.split(',').filter(Boolean) || [];
                        const tags = prospect.tags?.split(',').filter(Boolean) || [];
                        
                        return (
                          <div key={prospect.id} className="bg-white rounded-lg border p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                            <div className="space-y-2">
                              <div className="flex items-start justify-between">
                                <div className="font-medium text-sm">{prospect.funderName}</div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                      <MoreHorizontal className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => openModal(prospect)}>
                                      <Edit3 className="mr-2 h-4 w-4" />
                                      Edit Details
                                    </DropdownMenuItem>
                                    {STAGES.map(stage => (
                                      stage !== prospect.stage && (
                                        <DropdownMenuItem key={stage} onClick={() => handleStageChange(prospect.id, stage)}>
                                          Move to {stage}
                                        </DropdownMenuItem>
                                      )
                                    ))}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={() => handleDeleteProspect(prospect.id)}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                <span>{state?.name || prospect.stateCode}</span>
                                <Badge variant="outline" className="ml-auto text-xs">
                                  {Math.round((prospect.probability || 0) * 100)}%
                                </Badge>
                              </div>
                              
                              <div className="text-sm font-medium text-green-600">
                                {formatMoney(prospect.estimatedAmount)}
                              </div>

                              {tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {tags.slice(0, 2).map((tag, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {tags.length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{tags.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              )}

                              {prospect.contactPerson && (
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {prospect.contactPerson}
                                </div>
                              )}

                              {documents.length > 0 && (
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  {documents.length} document{documents.length > 1 ? 's' : ''}
                                </div>
                              )}
                              
                              {prospect.nextAction && (
                                <div className="text-xs">
                                  <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : 'text-muted-foreground'}`}>
                                    <Clock className="h-3 w-3" />
                                    <span className="truncate">{prospect.nextAction}</span>
                                  </div>
                                  {prospect.dueDate && (
                                    <div className={`text-xs mt-1 ${isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                                      Due: {new Date(prospect.dueDate).toLocaleDateString()}
                                      {isOverdue && ' (Overdue)'}
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {prospect.owner && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Users className="h-3 w-3" />
                                  <span>{prospect.owner}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      
                      {col.items.length === 0 && (
                        <div className="text-center text-sm text-muted-foreground py-8">
                          No prospects in {col.stage.toLowerCase()}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="table" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Prospects</CardTitle>
              <CardDescription>
                Detailed table view with all prospect information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funder</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Probability</TableHead>
                    <TableHead>Next Action</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProspects.map((prospect) => {
                    const state = states.find(s => s.code === prospect.stateCode);
                    const isOverdue = prospect.dueDate && new Date(prospect.dueDate) < new Date();
                    
                    return (
                      <TableRow key={prospect.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{prospect.funderName}</div>
                            {prospect.contactPerson && (
                              <div className="text-sm text-muted-foreground">{prospect.contactPerson}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {state?.name || prospect.stateCode}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={STAGE_COLORS[prospect.stage as keyof typeof STAGE_COLORS]}>
                            {prospect.stage}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatMoney(prospect.estimatedAmount)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{Math.round((prospect.probability || 0) * 100)}%</span>
                            <div className="w-16 bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="h-1.5 rounded-full bg-blue-500"
                                style={{ width: `${(prospect.probability || 0) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {prospect.nextAction && (
                            <div className={isOverdue ? 'text-red-600' : ''}>
                              <div className="text-sm">{prospect.nextAction}</div>
                              {prospect.dueDate && (
                                <div className="text-xs text-muted-foreground">
                                  {new Date(prospect.dueDate).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {prospect.owner && (
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {prospect.owner}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="ghost" onClick={() => openModal(prospect)}>
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            {prospect.contactEmail && (
                              <Button size="sm" variant="ghost" asChild>
                                <a href={`mailto:${prospect.contactEmail}`}>
                                  <Mail className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            {prospect.contactPhone && (
                              <Button size="sm" variant="ghost" asChild>
                                <a href={`tel:${prospect.contactPhone}`}>
                                  <Phone className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
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
              <CardTitle>Pipeline by State</CardTitle>
              <CardDescription>
                Prospect distribution and value across states
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>State</TableHead>
                    <TableHead>Coordinator</TableHead>
                    <TableHead>Prospects</TableHead>
                    <TableHead>Total Value</TableHead>
                    <TableHead>Weighted Value</TableHead>
                    <TableHead>Avg Probability</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prospectsByState.map((state) => (
                    <TableRow key={state.code}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{state.name}</div>
                            <div className="text-sm text-muted-foreground">{state.code}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span className="text-sm">{state.coordinator || '—'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{state.prospects}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{formatMoney(state.totalValue)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-blue-600">{formatMoney(state.weightedValue)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium">
                            {(state.averageProbability * 100).toFixed(1)}%
                          </div>
                          <div className="w-16 bg-gray-200 rounded-full h-1.5">
                            <div 
                              className="h-1.5 rounded-full bg-blue-500"
                              style={{ width: `${state.averageProbability * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Action Items & Follow-ups</CardTitle>
              <CardDescription>
                Next steps and follow-ups required for prospects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingActions.map((prospect) => {
                  const state = states.find(s => s.code === prospect.stateCode);
                  const isOverdue = prospect.dueDate && new Date(prospect.dueDate) < new Date();
                  const dueDate = prospect.dueDate ? new Date(prospect.dueDate) : null;
                  
                  return (
                    <div key={prospect.id} className={`border rounded-lg p-4 ${isOverdue ? 'border-red-200 bg-red-50' : ''}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${isOverdue ? 'bg-red-100' : 'bg-blue-100'}`}>
                            {isOverdue ? (
                              <AlertCircle className="h-4 w-4 text-red-600" />
                            ) : (
                              <Clock className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{prospect.funderName}</div>
                            <div className="text-sm text-muted-foreground">
                              {state?.name || prospect.stateCode} • {formatMoney(prospect.estimatedAmount)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={isOverdue ? 'destructive' : 'outline'}>
                            {prospect.stage}
                          </Badge>
                          <Badge variant="secondary">
                            {Math.round((prospect.probability || 0) * 100)}%
                          </Badge>
                          <Button size="sm" variant="outline" onClick={() => openModal(prospect)}>
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">Next Action:</span> {prospect.nextAction}
                        </div>
                        
                        {dueDate && (
                          <div className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                            <span className="font-medium">Due:</span> {dueDate.toLocaleDateString()}
                            {isOverdue && (
                              <span className="ml-2 text-red-600">
                                (Overdue by {Math.ceil((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24))} days)
                              </span>
                            )}
                          </div>
                        )}
                        
                        {prospect.owner && (
                          <div className="text-sm text-muted-foreground">
                            <span className="font-medium">Owner:</span> {prospect.owner}
                          </div>
                        )}

                        {prospect.contactPerson && (
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {prospect.contactPerson}
                            </div>
                            {prospect.contactEmail && (
                              <Button size="sm" variant="ghost" asChild>
                                <a href={`mailto:${prospect.contactEmail}`} className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  Email
                                </a>
                              </Button>
                            )}
                            {prospect.contactPhone && (
                              <Button size="sm" variant="ghost" asChild>
                                <a href={`tel:${prospect.contactPhone}`} className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  Call
                                </a>
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {upcomingActions.length === 0 && (
                  <div className="text-center py-8">
                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-medium">No upcoming actions</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      All prospects are up to date with their next steps.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Prospect Detail Modal */}
      <ProspectDetailModal
        prospect={selectedProspect}
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSaveProspect}
        states={states}
      />
    </div>
  );
}

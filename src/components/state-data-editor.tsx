"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Edit3, Save, X, Plus, Trash2 } from "lucide-react";
import { formatINR } from "@/lib/money";

interface StateDataEditorProps {
  stateCode: string;
  stateName: string;
  initialData: {
    state: any;
    contributions: any[];
    targets: any[];
    schools: any[];
    funders: any[];
  };
}

export function StateDataEditor({ stateCode, stateName, initialData }: StateDataEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("contributions");
  const [isSaving, setIsSaving] = useState(false);
  
  // State data
  const [contributions, setContributions] = useState(initialData.contributions);
  const [targets, setTargets] = useState(initialData.targets);
  const [schools, setSchools] = useState(initialData.schools);
  
  // Editable cell component
  const EditableCell = ({ 
    value, 
    onChange, 
    type = "text", 
    options = [] 
  }: { 
    value: any; 
    onChange: (value: any) => void; 
    type?: "text" | "number" | "select" | "date";
    options?: string[];
  }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value);

    const handleSave = () => {
      onChange(type === "number" ? Number(tempValue) || 0 : tempValue);
      setIsEditing(false);
    };

    const handleCancel = () => {
      setTempValue(value);
      setIsEditing(false);
    };

    if (!isEditing) {
      return (
        <div 
          className="min-h-[32px] p-2 rounded hover:bg-muted cursor-pointer flex items-center"
          onClick={() => setIsEditing(true)}
        >
          {type === "number" && typeof value === "number" ? formatINR(value) : value || "-"}
        </div>
      );
    }

    if (type === "select") {
      return (
        <Select value={tempValue} onValueChange={(val) => {
          setTempValue(val);
          onChange(val);
          setIsEditing(false);
        }}>
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map(option => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    return (
      <div className="flex items-center gap-1">
        <Input
          type={type === "number" ? "number" : type === "date" ? "date" : "text"}
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          className="h-8"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") handleCancel();
          }}
          autoFocus
        />
        <Button size="sm" variant="ghost" onClick={handleSave}>
          <Save className="h-3 w-3" />
        </Button>
        <Button size="sm" variant="ghost" onClick={handleCancel}>
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      // Save contributions
      for (const contribution of contributions) {
        if (contribution.isNew || contribution.isModified) {
          const response = await fetch('/api/contributions', {
            method: contribution.isNew ? 'POST' : 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...contribution,
              stateCode,
              isNew: undefined,
              isModified: undefined
            })
          });
          if (!response.ok) throw new Error('Failed to save contribution');
        }
      }

      // Save targets
      for (const target of targets) {
        if (target.isNew || target.isModified) {
          const response = await fetch('/api/state-targets', {
            method: target.isNew ? 'POST' : 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...target,
              stateCode,
              isNew: undefined,
              isModified: undefined
            })
          });
          if (!response.ok) throw new Error('Failed to save target');
        }
      }

      // Save schools
      for (const school of schools) {
        if (school.isNew || school.isModified) {
          const response = await fetch('/api/schools', {
            method: school.isNew ? 'POST' : 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...school,
              stateCode,
              isNew: undefined,
              isModified: undefined
            })
          });
          if (!response.ok) throw new Error('Failed to save school');
        }
      }

      toast.success("All changes saved successfully!");
      setIsOpen(false);
      window.location.reload(); // Refresh to show updated data
    } catch (error) {
      console.error('Save error:', error);
      toast.error("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const addNewContribution = () => {
    const newContribution = {
      id: `new-${Date.now()}`,
      funderId: "",
      stateCode,
      schoolId: "",
      fiscalYear: "FY24-25",
      date: new Date().toISOString().split('T')[0],
      initiative: "",
      amount: 0,
      isNew: true
    };
    setContributions([...contributions, newContribution]);
  };

  const addNewTarget = () => {
    const newTarget = {
      stateCode,
      fiscalYear: "FY24-25",
      targetAmount: 0,
      isNew: true
    };
    setTargets([...targets, newTarget]);
  };

  const addNewSchool = () => {
    const newSchool = {
      id: `new-${Date.now()}`,
      stateCode,
      name: "",
      program: "",
      isNew: true
    };
    setSchools([...schools, newSchool]);
  };

  const deleteItem = (type: string, index: number) => {
    if (type === "contributions") {
      const updated = contributions.filter((_, i) => i !== index);
      setContributions(updated);
    } else if (type === "targets") {
      const updated = targets.filter((_, i) => i !== index);
      setTargets(updated);
    } else if (type === "schools") {
      const updated = schools.filter((_, i) => i !== index);
      setSchools(updated);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Edit3 className="mr-2 h-4 w-4" />
          Edit State Data
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit {stateName} State Data</DialogTitle>
          <div className="flex items-center justify-between">
            <Badge variant="outline">{stateCode}</Badge>
            <div className="flex gap-2">
              <Button onClick={handleSaveAll} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : "Save All Changes"}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="contributions">Contributions</TabsTrigger>
            <TabsTrigger value="targets">FY Targets</TabsTrigger>
            <TabsTrigger value="schools">Schools</TabsTrigger>
          </TabsList>

          <TabsContent value="contributions" className="flex-1 overflow-auto">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Contributions</h3>
                <Button onClick={addNewContribution} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Contribution
                </Button>
              </div>
              <div className="border rounded-lg overflow-auto max-h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Funder ID</TableHead>
                      <TableHead>School ID</TableHead>
                      <TableHead>Fiscal Year</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Initiative</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contributions.map((contribution, index) => (
                      <TableRow key={contribution.id || index}>
                        <TableCell>
                          <EditableCell
                            value={contribution.funderId}
                            onChange={(value) => {
                              const updated = [...contributions];
                              updated[index] = { ...updated[index], funderId: value, isModified: true };
                              setContributions(updated);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <EditableCell
                            value={contribution.schoolId}
                            onChange={(value) => {
                              const updated = [...contributions];
                              updated[index] = { ...updated[index], schoolId: value, isModified: true };
                              setContributions(updated);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <EditableCell
                            value={contribution.fiscalYear}
                            type="select"
                            options={["FY23-24", "FY24-25", "FY25-26", "FY26-27"]}
                            onChange={(value) => {
                              const updated = [...contributions];
                              updated[index] = { ...updated[index], fiscalYear: value, isModified: true };
                              setContributions(updated);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <EditableCell
                            value={contribution.date}
                            type="date"
                            onChange={(value) => {
                              const updated = [...contributions];
                              updated[index] = { ...updated[index], date: value, isModified: true };
                              setContributions(updated);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <EditableCell
                            value={contribution.initiative}
                            onChange={(value) => {
                              const updated = [...contributions];
                              updated[index] = { ...updated[index], initiative: value, isModified: true };
                              setContributions(updated);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <EditableCell
                            value={contribution.amount}
                            type="number"
                            onChange={(value) => {
                              const updated = [...contributions];
                              updated[index] = { ...updated[index], amount: value, isModified: true };
                              setContributions(updated);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteItem("contributions", index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="targets" className="flex-1 overflow-auto">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Fiscal Year Targets</h3>
                <Button onClick={addNewTarget} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Target
                </Button>
              </div>
              <div className="border rounded-lg overflow-auto max-h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fiscal Year</TableHead>
                      <TableHead>Target Amount</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {targets.map((target, index) => (
                      <TableRow key={`${target.stateCode}-${target.fiscalYear}-${index}`}>
                        <TableCell>
                          <EditableCell
                            value={target.fiscalYear}
                            type="select"
                            options={["FY23-24", "FY24-25", "FY25-26", "FY26-27"]}
                            onChange={(value) => {
                              const updated = [...targets];
                              updated[index] = { ...updated[index], fiscalYear: value, isModified: true };
                              setTargets(updated);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <EditableCell
                            value={target.targetAmount}
                            type="number"
                            onChange={(value) => {
                              const updated = [...targets];
                              updated[index] = { ...updated[index], targetAmount: value, isModified: true };
                              setTargets(updated);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteItem("targets", index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="schools" className="flex-1 overflow-auto">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Schools</h3>
                <Button onClick={addNewSchool} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add School
                </Button>
              </div>
              <div className="border rounded-lg overflow-auto max-h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>School ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Program</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schools.map((school, index) => (
                      <TableRow key={school.id || index}>
                        <TableCell>
                          <EditableCell
                            value={school.id}
                            onChange={(value) => {
                              const updated = [...schools];
                              updated[index] = { ...updated[index], id: value, isModified: true };
                              setSchools(updated);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <EditableCell
                            value={school.name}
                            onChange={(value) => {
                              const updated = [...schools];
                              updated[index] = { ...updated[index], name: value, isModified: true };
                              setSchools(updated);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <EditableCell
                            value={school.program}
                            onChange={(value) => {
                              const updated = [...schools];
                              updated[index] = { ...updated[index], program: value, isModified: true };
                              setSchools(updated);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteItem("schools", index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Save, 
  X, 
  Plus, 
  Trash2, 
  Calendar, 
  User, 
  Building2, 
  Phone, 
  Mail, 
  FileText, 
  Link as LinkIcon,
  Tag,
  Clock,
  Target
} from "lucide-react";

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

interface ProspectDetailModalProps {
  prospect?: Prospect;
  isOpen: boolean;
  onClose: () => void;
  onSave: (prospect: Prospect) => Promise<boolean>;
  states: Array<{ code: string; name: string }>;
}

const STAGES = ["Lead", "Contacted", "Proposal", "Committed"];
const STAGE_COLORS = {
  Lead: "bg-gray-100 text-gray-800",
  Contacted: "bg-blue-100 text-blue-800", 
  Proposal: "bg-yellow-100 text-yellow-800",
  Committed: "bg-green-100 text-green-800"
} as const;

export function ProspectDetailModal({ prospect, isOpen, onClose, onSave, states }: ProspectDetailModalProps) {
  const [formData, setFormData] = useState<Prospect>({
    id: '',
    stateCode: '',
    funderName: '',
    stage: 'Lead',
    estimatedAmount: 0,
    probability: 0,
    nextAction: '',
    dueDate: '',
    owner: '',
    description: '',
    documents: '',
    tags: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    lastContact: '',
    notes: ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [documentLinks, setDocumentLinks] = useState<string[]>([]);
  const [tagList, setTagList] = useState<string[]>([]);

  useEffect(() => {
    if (prospect) {
      setFormData(prospect);
      setDocumentLinks(prospect.documents ? prospect.documents.split(',').filter(Boolean) : []);
      setTagList(prospect.tags ? prospect.tags.split(',').filter(Boolean) : []);
    } else {
      // Reset form for new prospect
      setFormData({
        id: `prospect-${Date.now()}`,
        stateCode: '',
        funderName: '',
        stage: 'Lead',
        estimatedAmount: 0,
        probability: 0,
        nextAction: '',
        dueDate: '',
        owner: '',
        description: '',
        documents: '',
        tags: '',
        contactPerson: '',
        contactEmail: '',
        contactPhone: '',
        lastContact: '',
        notes: ''
      });
      setDocumentLinks([]);
      setTagList([]);
    }
  }, [prospect, isOpen]);

  const handleSave = async () => {
    if (!formData.funderName.trim()) {
      toast.error("Funder name is required");
      return;
    }

    if (!formData.stateCode) {
      toast.error("State is required");
      return;
    }

    setIsSaving(true);
    try {
      const prospectToSave = {
        ...formData,
        documents: documentLinks.join(','),
        tags: tagList.join(',')
      };

      const success = await onSave(prospectToSave);
      if (success) {
        toast.success(prospect ? "Prospect updated" : "Prospect created");
        onClose();
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save prospect");
    } finally {
      setIsSaving(false);
    }
  };

  const addDocumentLink = () => {
    setDocumentLinks([...documentLinks, '']);
  };

  const updateDocumentLink = (index: number, value: string) => {
    const updated = [...documentLinks];
    updated[index] = value;
    setDocumentLinks(updated);
  };

  const removeDocumentLink = (index: number) => {
    setDocumentLinks(documentLinks.filter((_, i) => i !== index));
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !tagList.includes(tag.trim())) {
      setTagList([...tagList, tag.trim()]);
    }
  };

  const removeTag = (tag: string) => {
    setTagList(tagList.filter(t => t !== tag));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>
                {prospect ? 'Edit Prospect' : 'New Prospect'}
              </DialogTitle>
              <DialogDescription>
                {prospect ? 'Update prospect details and track progress' : 'Add a new prospect to your pipeline'}
              </DialogDescription>
            </div>
            <Badge className={STAGE_COLORS[formData.stage as keyof typeof STAGE_COLORS]}>
              {formData.stage}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="notes">Notes & Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="funderName">
                  <Building2 className="inline h-4 w-4 mr-1" />
                  Funder Name *
                </Label>
                <Input
                  id="funderName"
                  value={formData.funderName}
                  onChange={(e) => setFormData({ ...formData, funderName: e.target.value })}
                  placeholder="Enter funder organization name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stateCode">
                  <Target className="inline h-4 w-4 mr-1" />
                  State *
                </Label>
                <Select value={formData.stateCode} onValueChange={(value) => setFormData({ ...formData, stateCode: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map(state => (
                      <SelectItem key={state.code} value={state.code}>
                        {state.name} ({state.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stage">Stage</Label>
                <Select value={formData.stage} onValueChange={(value) => setFormData({ ...formData, stage: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.map(stage => (
                      <SelectItem key={stage} value={stage}>
                        {stage}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner">
                  <User className="inline h-4 w-4 mr-1" />
                  Owner
                </Label>
                <Input
                  id="owner"
                  value={formData.owner}
                  onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                  placeholder="Prospect owner/manager"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedAmount">Estimated Amount (INR)</Label>
                <Input
                  id="estimatedAmount"
                  type="number"
                  value={formData.estimatedAmount}
                  onChange={(e) => setFormData({ ...formData, estimatedAmount: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="probability">Probability (%)</Label>
                <Input
                  id="probability"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.probability * 100}
                  onChange={(e) => setFormData({ ...formData, probability: Number(e.target.value) / 100 })}
                  placeholder="0-100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the prospect opportunity..."
                className="min-h-20"
              />
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tagList.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {tag}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-red-500" 
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
              <Input
                placeholder="Add tags (press Enter)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactPerson">
                  <User className="inline h-4 w-4 mr-1" />
                  Contact Person
                </Label>
                <Input
                  id="contactPerson"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  placeholder="Primary contact name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">
                  <Mail className="inline h-4 w-4 mr-1" />
                  Email
                </Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="contact@funder.org"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone">
                  <Phone className="inline h-4 w-4 mr-1" />
                  Phone
                </Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastContact">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Last Contact
                </Label>
                <Input
                  id="lastContact"
                  type="date"
                  value={formData.lastContact}
                  onChange={(e) => setFormData({ ...formData, lastContact: e.target.value })}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Document Links
                </h4>
                <Button size="sm" variant="outline" onClick={addDocumentLink}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Link
                </Button>
              </div>

              {documentLinks.map((link, index) => (
                <div key={index} className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-muted-foreground" />
                  <Input
                    value={link}
                    onChange={(e) => updateDocumentLink(index, e.target.value)}
                    placeholder="https://docs.google.com/... or document name"
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeDocumentLink(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {documentLinks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="mx-auto h-12 w-12 mb-2" />
                  <p>No documents added yet</p>
                  <p className="text-sm">Add links to proposals, presentations, or other documents</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nextAction">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Next Action
                </Label>
                <Input
                  id="nextAction"
                  value={formData.nextAction}
                  onChange={(e) => setFormData({ ...formData, nextAction: e.target.value })}
                  placeholder="What's the next step?"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Due Date
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Meeting notes, follow-up items, important details..."
                className="min-h-32"
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Clock className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            {prospect ? 'Update Prospect' : 'Create Prospect'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

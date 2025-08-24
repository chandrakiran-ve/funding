"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";

interface AddStateDialogProps {
  onStateAdded?: () => void;
  trigger?: React.ReactNode;
}

export function AddStateDialog({ onStateAdded, trigger }: AddStateDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    coordinator: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('State name is required');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/states', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: formData.name.substring(0, 3).toUpperCase(), // Auto-generate code
          name: formData.name,
          coordinator: formData.coordinator
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add state');
      }

      const result = await response.json();
      toast.success('State added successfully!');
      setIsOpen(false);
      setFormData({
        name: '',
        coordinator: ''
      });
      onStateAdded?.();
    } catch (error) {
      console.error('Error adding state:', error);
      toast.error('Failed to add state. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add State
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Add New State</DialogTitle>
          <DialogDescription>
            Add a new operational state to the system.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">State Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter state name (e.g., Karnataka)"
              required
            />
            <div className="text-xs text-muted-foreground">
              Code will be auto-generated: {formData.name ? formData.name.substring(0, 3).toUpperCase() : 'XXX'}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="coordinator">Account Manager</Label>
            <Select value={formData.coordinator} onValueChange={(value) => handleInputChange('coordinator', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select account manager" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Jyoti">Jyoti</SelectItem>
                <SelectItem value="Raji">Raji</SelectItem>
                <SelectItem value="Devi">Devi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add State
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

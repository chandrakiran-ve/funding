"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, X, Edit3 } from "lucide-react";
import { formatMoney } from "@/lib/money";

interface InlineEditableProps {
  value: any;
  type?: "text" | "number" | "currency" | "select" | "date";
  options?: string[];
  placeholder?: string;
  onSave: (newValue: any) => Promise<boolean>;
  displayFormat?: (value: any) => string;
  className?: string;
  disabled?: boolean;
}

export function InlineEditable({
  value,
  type = "text",
  options = [],
  placeholder,
  onSave,
  displayFormat,
  className = "",
  disabled = false
}: InlineEditableProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (type === "text") {
        inputRef.current.select();
      }
    }
  }, [isEditing, type]);

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      const success = await onSave(editValue);
      if (success) {
        setIsEditing(false);
        toast.success("Updated successfully");
      } else {
        toast.error("Failed to update");
        setEditValue(value); // Reset to original value
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to update");
      setEditValue(value); // Reset to original value
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const getDisplayValue = () => {
    if (displayFormat) {
      return displayFormat(value);
    }
    
    switch (type) {
      case "currency":
        return formatMoney(value || 0);
      case "number":
        return value?.toString() || "0";
      default:
        return value?.toString() || "";
    }
  };

  if (disabled) {
    return (
      <span className={className}>
        {getDisplayValue()}
      </span>
    );
  }

  if (!isEditing) {
    return (
      <div
        className={`group cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2 -my-1 transition-colors ${className}`}
        onClick={() => setIsEditing(true)}
      >
        <span className="group-hover:hidden">
          {getDisplayValue() || placeholder || "Click to edit"}
        </span>
        <div className="hidden group-hover:flex items-center gap-1">
          <span>{getDisplayValue() || placeholder || "Click to edit"}</span>
          <Edit3 className="h-3 w-3 text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (type === "select") {
    return (
      <div className="flex items-center gap-1">
        <Select value={editValue} onValueChange={setEditValue}>
          <SelectTrigger className="h-8 min-w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map(option => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          disabled={isSaving}
        >
          <Save className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          disabled={isSaving}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Input
        ref={inputRef}
        type={type === "currency" || type === "number" ? "number" : type}
        value={editValue}
        onChange={(e) => setEditValue(type === "number" || type === "currency" ? Number(e.target.value) : e.target.value)}
        onKeyDown={handleKeyDown}
        className="h-8"
        placeholder={placeholder}
        disabled={isSaving}
      />
      <Button
        size="sm"
        variant="ghost"
        onClick={handleSave}
        disabled={isSaving}
      >
        <Save className="h-3 w-3" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={handleCancel}
        disabled={isSaving}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

// Specialized components for common use cases
export function EditableAmount({ value, onSave, className }: { value: number; onSave: (value: number) => Promise<boolean>; className?: string }) {
  return (
    <InlineEditable
      value={value}
      type="currency"
      onSave={onSave}
      className={className}
    />
  );
}

export function EditableText({ value, onSave, placeholder, className }: { value: string; onSave: (value: string) => Promise<boolean>; placeholder?: string; className?: string }) {
  return (
    <InlineEditable
      value={value}
      type="text"
      onSave={onSave}
      placeholder={placeholder}
      className={className}
    />
  );
}

export function EditableFiscalYear({ value, onSave, className }: { value: string; onSave: (value: string) => Promise<boolean>; className?: string }) {
  return (
    <InlineEditable
      value={value}
      type="select"
      options={["FY23-24", "FY24-25", "FY25-26", "FY26-27", "FY27-28"]}
      onSave={onSave}
      className={className}
    />
  );
}

export function EditableDate({ value, onSave, className }: { value: string; onSave: (value: string) => Promise<boolean>; className?: string }) {
  return (
    <InlineEditable
      value={value}
      type="date"
      onSave={onSave}
      className={className}
    />
  );
}

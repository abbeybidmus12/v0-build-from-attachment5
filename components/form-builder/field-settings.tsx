"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Plus, X } from "lucide-react"
import type { FormField } from "./form-canvas"

interface FieldSettingsProps {
  field: FormField | null
  onFieldUpdate: (field: FormField) => void
}

export function FieldSettings({ field, onFieldUpdate }: FieldSettingsProps) {
  const [localField, setLocalField] = useState<FormField | null>(null)

  useEffect(() => {
    setLocalField(field)
  }, [field])

  if (!localField) {
    return (
      <div className="w-80 bg-card border-l border-border p-6">
        <div className="text-center text-muted-foreground">
          <p>Select a field to edit its properties</p>
        </div>
      </div>
    )
  }

  const updateField = (updates: Partial<FormField>) => {
    const updatedField = { ...localField, ...updates }
    setLocalField(updatedField)
    onFieldUpdate(updatedField)
  }

  const updateOptions = (options: string[]) => {
    updateField({ options })
  }

  const addOption = () => {
    const currentOptions = localField.options || []
    updateOptions([...currentOptions, `Option ${currentOptions.length + 1}`])
  }

  const removeOption = (index: number) => {
    const currentOptions = localField.options || []
    updateOptions(currentOptions.filter((_, i) => i !== index))
  }

  const updateOption = (index: number, value: string) => {
    const currentOptions = localField.options || []
    const newOptions = [...currentOptions]
    newOptions[index] = value
    updateOptions(newOptions)
  }

  const hasOptions = ["dropdown", "radio", "checkbox"].includes(localField.type)

  return (
    <div className="w-80 bg-card border-l border-border overflow-y-auto">
      <div className="p-4 border-b border-border">
        <h2 className="font-heading font-semibold text-foreground">Field Settings</h2>
        <Badge variant="outline" className="mt-2">
          {localField.type.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
        </Badge>
      </div>

      <div className="p-4 space-y-6">
        {/* Basic Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Basic Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="field-label" className="text-sm">
                Field Label
              </Label>
              <Input
                id="field-label"
                value={localField.label}
                onChange={(e) => updateField({ label: e.target.value })}
                placeholder="Enter field label"
              />
            </div>

            {localField.type !== "section" && (
              <div>
                <Label htmlFor="field-placeholder" className="text-sm">
                  Placeholder Text
                </Label>
                <Input
                  id="field-placeholder"
                  value={localField.placeholder || ""}
                  onChange={(e) => updateField({ placeholder: e.target.value })}
                  placeholder="Enter placeholder text"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label htmlFor="field-required" className="text-sm">
                Required Field
              </Label>
              <Switch
                id="field-required"
                checked={localField.required}
                onCheckedChange={(required) => updateField({ required })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Options for choice fields */}
        {hasOptions && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {localField.options?.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => removeOption(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full gap-2 bg-transparent" onClick={addOption}>
                <Plus className="h-4 w-4" />
                Add Option
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Validation Settings */}
        {localField.type !== "section" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Validation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {localField.type === "short-text" && (
                <>
                  <div>
                    <Label htmlFor="min-length" className="text-sm">
                      Minimum Length
                    </Label>
                    <Input id="min-length" type="number" placeholder="0" min="0" />
                  </div>
                  <div>
                    <Label htmlFor="max-length" className="text-sm">
                      Maximum Length
                    </Label>
                    <Input id="max-length" type="number" placeholder="No limit" min="0" />
                  </div>
                </>
              )}

              {localField.type === "number" && (
                <>
                  <div>
                    <Label htmlFor="min-value" className="text-sm">
                      Minimum Value
                    </Label>
                    <Input id="min-value" type="number" placeholder="No minimum" />
                  </div>
                  <div>
                    <Label htmlFor="max-value" className="text-sm">
                      Maximum Value
                    </Label>
                    <Input id="max-value" type="number" placeholder="No maximum" />
                  </div>
                </>
              )}

              {localField.type === "file-upload" && (
                <>
                  <div>
                    <Label htmlFor="file-types" className="text-sm">
                      Allowed File Types
                    </Label>
                    <Input id="file-types" placeholder="e.g., .pdf, .doc, .jpg" />
                  </div>
                  <div>
                    <Label htmlFor="max-size" className="text-sm">
                      Maximum File Size (MB)
                    </Label>
                    <Input id="max-size" type="number" placeholder="10" min="1" />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Help Text */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Help Text</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea placeholder="Add helpful instructions for this field" rows={3} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

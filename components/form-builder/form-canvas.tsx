"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2, Settings, GripVertical } from "lucide-react"
import type { FieldType } from "./field-palette"

export interface FormField {
  id: string
  type: string
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
  settings: Record<string, any>
}

interface FormCanvasProps {
  fields: FormField[]
  onFieldsChange: (fields: FormField[]) => void
  onFieldSelect: (field: FormField | null) => void
  selectedField: FormField | null
}

export function FormCanvas({ fields, onFieldsChange, onFieldSelect, selectedField }: FormCanvasProps) {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const fieldTypeData = e.dataTransfer.getData("application/json")

    if (fieldTypeData) {
      const fieldType: FieldType = JSON.parse(fieldTypeData)
      const newField: FormField = {
        id: `field-${Date.now()}`,
        type: fieldType.id,
        label: fieldType.name,
        placeholder: getDefaultPlaceholder(fieldType.id),
        required: false,
        options: getDefaultOptions(fieldType.id),
        settings: {},
      }

      const dropIndex = dragOverIndex ?? fields.length
      const newFields = [...fields]
      newFields.splice(dropIndex, 0, newField)
      onFieldsChange(newFields)
    }
    setDragOverIndex(null)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const deleteField = (fieldId: string) => {
    const newFields = fields.filter((f) => f.id !== fieldId)
    onFieldsChange(newFields)
    if (selectedField?.id === fieldId) {
      onFieldSelect(null)
    }
  }

  const moveField = (fromIndex: number, toIndex: number) => {
    const newFields = [...fields]
    const [movedField] = newFields.splice(fromIndex, 1)
    newFields.splice(toIndex, 0, movedField)
    onFieldsChange(newFields)
  }

  const renderField = (field: FormField, index: number) => {
    const isSelected = selectedField?.id === field.id

    return (
      <div
        key={field.id}
        className={`group relative border-2 border-dashed transition-colors ${
          isSelected ? "border-primary bg-primary/5" : "border-transparent hover:border-border"
        }`}
        onClick={() => onFieldSelect(field)}
        onDragOver={(e) => handleDragOver(e, index)}
        onDragLeave={handleDragLeave}
      >
        <div className="p-4">
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <Label className="text-sm font-medium">
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              <div className="mt-2">{renderFieldInput(field)}</div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  onFieldSelect(field)
                }}
              >
                <Settings className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  deleteField(field.id)
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
              <div className="cursor-grab active:cursor-grabbing">
                <GripVertical className="h-3 w-3 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>

        {dragOverIndex === index && <div className="absolute -top-1 left-0 right-0 h-0.5 bg-primary" />}
      </div>
    )
  }

  const renderFieldInput = (field: FormField) => {
    switch (field.type) {
      case "short-text":
      case "email":
      case "phone":
      case "url":
        return <Input placeholder={field.placeholder} disabled />

      case "long-text":
        return <Textarea placeholder={field.placeholder} disabled />

      case "number":
        return <Input type="number" placeholder={field.placeholder} disabled />

      case "date":
        return <Input type="date" disabled />

      case "dropdown":
        return (
          <Select disabled>
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option, i) => (
                <SelectItem key={i} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case "radio":
        return (
          <RadioGroup disabled>
            {field.options?.map((option, i) => (
              <div key={i} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${field.id}-${i}`} />
                <Label htmlFor={`${field.id}-${i}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        )

      case "checkbox":
        return (
          <div className="space-y-2">
            {field.options?.map((option, i) => (
              <div key={i} className="flex items-center space-x-2">
                <Checkbox id={`${field.id}-${i}`} disabled />
                <Label htmlFor={`${field.id}-${i}`}>{option}</Label>
              </div>
            ))}
          </div>
        )

      case "rating":
        return (
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Button key={star} variant="ghost" size="sm" className="h-8 w-8 p-0" disabled>
                ⭐
              </Button>
            ))}
          </div>
        )

      case "file-upload":
        return (
          <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
          </div>
        )

      case "section":
        return <hr className="border-border" />

      default:
        return <Input placeholder="Unknown field type" disabled />
    }
  }

  return (
    <div
      className="flex-1 p-6 overflow-y-auto bg-muted/30"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={handleDragLeave}
    >
      <Card className="max-w-2xl mx-auto bg-background">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="font-heading text-2xl font-bold text-foreground mb-2">Untitled Form</h1>
            <p className="text-muted-foreground">Form description goes here</p>
          </div>

          <div className="space-y-4">
            {fields.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
                <p className="text-muted-foreground">Drag fields from the left panel to start building your form</p>
              </div>
            ) : (
              fields.map((field, index) => renderField(field, index))
            )}

            {/* Drop zone at the end */}
            <div
              className={`h-4 border-2 border-dashed transition-colors ${
                dragOverIndex === fields.length ? "border-primary bg-primary/10" : "border-transparent"
              }`}
              onDragOver={(e) => handleDragOver(e, fields.length)}
              onDragLeave={handleDragLeave}
            />
          </div>
        </div>
      </Card>
    </div>
  )
}

function getDefaultPlaceholder(fieldType: string): string {
  const placeholders: Record<string, string> = {
    "short-text": "Enter text here",
    "long-text": "Enter your response here",
    email: "Enter your email address",
    phone: "Enter your phone number",
    number: "Enter a number",
    url: "Enter a URL",
  }
  return placeholders[fieldType] || ""
}

function getDefaultOptions(fieldType: string): string[] | undefined {
  const optionFields = ["dropdown", "radio", "checkbox"]
  if (optionFields.includes(fieldType)) {
    return ["Option 1", "Option 2", "Option 3"]
  }
  return undefined
}

"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Type,
  AlignLeft,
  ChevronDown,
  Circle,
  Square,
  Calendar,
  Upload,
  Star,
  Hash,
  Mail,
  Phone,
  Link,
  Minus,
} from "lucide-react"

export interface FieldType {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  category: "input" | "choice" | "layout"
}

const fieldTypes: FieldType[] = [
  // Input Fields
  { id: "short-text", name: "Short Text", icon: Type, category: "input" },
  { id: "long-text", name: "Long Text", icon: AlignLeft, category: "input" },
  { id: "email", name: "Email", icon: Mail, category: "input" },
  { id: "phone", name: "Phone", icon: Phone, category: "input" },
  { id: "number", name: "Number", icon: Hash, category: "input" },
  { id: "url", name: "URL", icon: Link, category: "input" },
  { id: "date", name: "Date", icon: Calendar, category: "input" },
  { id: "file-upload", name: "File Upload", icon: Upload, category: "input" },

  // Choice Fields
  { id: "dropdown", name: "Dropdown", icon: ChevronDown, category: "choice" },
  { id: "radio", name: "Radio Buttons", icon: Circle, category: "choice" },
  { id: "checkbox", name: "Checkboxes", icon: Square, category: "choice" },
  { id: "rating", name: "Rating", icon: Star, category: "choice" },

  // Layout Elements
  { id: "section", name: "Section Break", icon: Minus, category: "layout" },
]

interface FieldPaletteProps {
  onFieldDrag: (fieldType: FieldType) => void
}

export function FieldPalette({ onFieldDrag }: FieldPaletteProps) {
  const categories = {
    input: fieldTypes.filter((f) => f.category === "input"),
    choice: fieldTypes.filter((f) => f.category === "choice"),
    layout: fieldTypes.filter((f) => f.category === "layout"),
  }

  const handleDragStart = (e: React.DragEvent, fieldType: FieldType) => {
    e.dataTransfer.setData("application/json", JSON.stringify(fieldType))
    onFieldDrag(fieldType)
  }

  return (
    <div className="w-64 bg-card border-r border-border overflow-y-auto">
      <div className="p-4 border-b border-border">
        <h2 className="font-heading font-semibold text-foreground">Form Fields</h2>
        <p className="text-sm text-muted-foreground">Drag fields to add them to your form</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Input Fields */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Input Fields</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {categories.input.map((field) => (
              <Button
                key={field.id}
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 h-8 cursor-grab active:cursor-grabbing"
                draggable
                onDragStart={(e) => handleDragStart(e, field)}
              >
                <field.icon className="h-4 w-4" />
                <span className="text-sm">{field.name}</span>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Choice Fields */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Choice Fields</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {categories.choice.map((field) => (
              <Button
                key={field.id}
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 h-8 cursor-grab active:cursor-grabbing"
                draggable
                onDragStart={(e) => handleDragStart(e, field)}
              >
                <field.icon className="h-4 w-4" />
                <span className="text-sm">{field.name}</span>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Layout Elements */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Layout</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {categories.layout.map((field) => (
              <Button
                key={field.id}
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 h-8 cursor-grab active:cursor-grabbing"
                draggable
                onDragStart={(e) => handleDragStart(e, field)}
              >
                <field.icon className="h-4 w-4" />
                <span className="text-sm">{field.name}</span>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

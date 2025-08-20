"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { FieldPalette } from "@/components/form-builder/field-palette"
import { FormCanvas, type FormField } from "@/components/form-builder/form-canvas"
import { FieldSettings } from "@/components/form-builder/field-settings"
import { ArrowLeft, Eye, Save, Share } from "lucide-react"
import Link from "next/link"

export default function FormBuilderPage() {
  const [fields, setFields] = useState<FormField[]>([])
  const [selectedField, setSelectedField] = useState<FormField | null>(null)
  const [formTitle, setFormTitle] = useState("Untitled Form")
  const [isPreview, setIsPreview] = useState(false)
  const [draggedField, setDraggedField] = useState(null)

  const handleFieldUpdate = (updatedField: FormField) => {
    setFields(fields.map((field) => (field.id === updatedField.id ? updatedField : field)))
  }

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log("Saving form:", { title: formTitle, fields })
  }

  const handlePublish = () => {
    // TODO: Implement publish functionality
    console.log("Publishing form:", { title: formTitle, fields })
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Field Palette */}
      <FieldPalette onFieldDrag={setDraggedField} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/forms">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Forms
                  </Button>
                </Link>
                <div className="flex items-center gap-2">
                  <Input
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="font-heading font-semibold text-lg border-none bg-transparent p-0 h-auto focus-visible:ring-0"
                  />
                  <Badge variant="secondary">Draft</Badge>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-transparent"
                  onClick={() => setIsPreview(!isPreview)}
                >
                  <Eye className="h-4 w-4" />
                  {isPreview ? "Edit" : "Preview"}
                </Button>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={handleSave}>
                  <Save className="h-4 w-4" />
                  Save
                </Button>
                <Button size="sm" className="gap-2" onClick={handlePublish}>
                  <Share className="h-4 w-4" />
                  Publish
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Builder Content */}
        <div className="flex-1 flex">
          <FormCanvas
            fields={fields}
            onFieldsChange={setFields}
            onFieldSelect={setSelectedField}
            selectedField={selectedField}
          />

          {/* Field Settings Panel */}
          <FieldSettings field={selectedField} onFieldUpdate={handleFieldUpdate} />
        </div>
      </div>
    </div>
  )
}

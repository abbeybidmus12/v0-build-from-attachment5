"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Download, FileText, Table, FileSpreadsheet } from "lucide-react"

interface Response {
  id: string
  formId: string
  formTitle: string
  submittedAt: string
  status: "new" | "read" | "flagged"
  respondentEmail: string
  responses: Record<string, string>
}

interface ExportDialogProps {
  responses: Response[]
  onClose: () => void
  onExport: (format: string, options: ExportOptions) => void
}

interface ExportOptions {
  includeMetadata: boolean
  includeTimestamps: boolean
  includeStatus: boolean
  selectedFields: string[]
}

const exportFormats = [
  {
    id: "csv",
    name: "CSV",
    description: "Comma-separated values file",
    icon: Table,
  },
  {
    id: "excel",
    name: "Excel",
    description: "Microsoft Excel spreadsheet",
    icon: FileSpreadsheet,
  },
  {
    id: "pdf",
    name: "PDF",
    description: "Portable document format",
    icon: FileText,
  },
]

export function ExportDialog({ responses, onClose, onExport }: ExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState("csv")
  const [includeMetadata, setIncludeMetadata] = useState(true)
  const [includeTimestamps, setIncludeTimestamps] = useState(true)
  const [includeStatus, setIncludeStatus] = useState(true)
  const [selectedFields, setSelectedFields] = useState<string[]>([])

  // Get all unique fields from responses
  const allFields = Array.from(new Set(responses.flatMap((response) => Object.keys(response.responses))))

  const handleFieldToggle = (field: string, checked: boolean) => {
    if (checked) {
      setSelectedFields([...selectedFields, field])
    } else {
      setSelectedFields(selectedFields.filter((f) => f !== field))
    }
  }

  const handleSelectAllFields = (checked: boolean) => {
    if (checked) {
      setSelectedFields(allFields)
    } else {
      setSelectedFields([])
    }
  }

  const handleExport = () => {
    const options: ExportOptions = {
      includeMetadata,
      includeTimestamps,
      includeStatus,
      selectedFields: selectedFields.length > 0 ? selectedFields : allFields,
    }
    onExport(selectedFormat, options)
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">Export Responses</DialogTitle>
          <DialogDescription>Export {responses.length} responses in your preferred format</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Format */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Export Format</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedFormat} onValueChange={setSelectedFormat}>
                {exportFormats.map((format) => (
                  <div key={format.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={format.id} id={format.id} />
                    <Label htmlFor={format.id} className="flex items-center gap-2 cursor-pointer">
                      <format.icon className="h-4 w-4" />
                      <div>
                        <p className="font-medium">{format.name}</p>
                        <p className="text-xs text-muted-foreground">{format.description}</p>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Export Options */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Export Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox id="metadata" checked={includeMetadata} onCheckedChange={setIncludeMetadata} />
                <Label htmlFor="metadata" className="text-sm">
                  Include respondent email
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="timestamps" checked={includeTimestamps} onCheckedChange={setIncludeTimestamps} />
                <Label htmlFor="timestamps" className="text-sm">
                  Include submission timestamps
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="status" checked={includeStatus} onCheckedChange={setIncludeStatus} />
                <Label htmlFor="status" className="text-sm">
                  Include response status
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Field Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                Fields to Export
                <Checkbox
                  checked={selectedFields.length === allFields.length}
                  onCheckedChange={handleSelectAllFields}
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-32 overflow-y-auto">
              {allFields.map((field) => (
                <div key={field} className="flex items-center space-x-2">
                  <Checkbox
                    id={field}
                    checked={selectedFields.includes(field)}
                    onCheckedChange={(checked) => handleFieldToggle(field, checked as boolean)}
                  />
                  <Label htmlFor={field} className="text-sm cursor-pointer">
                    {field}
                  </Label>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              Export {selectedFormat.toUpperCase()}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

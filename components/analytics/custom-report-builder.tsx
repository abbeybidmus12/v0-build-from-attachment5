"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Calendar, Download, Plus, X } from "lucide-react"

interface ReportFilter {
  id: string
  field: string
  operator: string
  value: string
}

export function CustomReportBuilder() {
  const [selectedForms, setSelectedForms] = useState<string[]>([])
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([])
  const [dateRange, setDateRange] = useState("30d")
  const [filters, setFilters] = useState<ReportFilter[]>([])

  const availableForms = [
    { id: "form-1", name: "Customer Feedback Survey" },
    { id: "form-2", name: "Event Registration Form" },
    { id: "form-3", name: "Product Feature Request" },
    { id: "form-4", name: "Newsletter Signup" },
  ]

  const availableMetrics = [
    { id: "responses", name: "Total Responses" },
    { id: "completion-rate", name: "Completion Rate" },
    { id: "avg-time", name: "Average Completion Time" },
    { id: "drop-off", name: "Drop-off Rate" },
    { id: "conversion", name: "Conversion Rate" },
    { id: "bounce-rate", name: "Bounce Rate" },
  ]

  const filterFields = [
    { id: "status", name: "Response Status" },
    { id: "date", name: "Submission Date" },
    { id: "completion-time", name: "Completion Time" },
    { id: "device", name: "Device Type" },
  ]

  const filterOperators = [
    { id: "equals", name: "Equals" },
    { id: "not-equals", name: "Not Equals" },
    { id: "greater-than", name: "Greater Than" },
    { id: "less-than", name: "Less Than" },
    { id: "contains", name: "Contains" },
  ]

  const handleFormToggle = (formId: string, checked: boolean) => {
    if (checked) {
      setSelectedForms([...selectedForms, formId])
    } else {
      setSelectedForms(selectedForms.filter((id) => id !== formId))
    }
  }

  const handleMetricToggle = (metricId: string, checked: boolean) => {
    if (checked) {
      setSelectedMetrics([...selectedMetrics, metricId])
    } else {
      setSelectedMetrics(selectedMetrics.filter((id) => id !== metricId))
    }
  }

  const addFilter = () => {
    const newFilter: ReportFilter = {
      id: `filter-${Date.now()}`,
      field: "",
      operator: "",
      value: "",
    }
    setFilters([...filters, newFilter])
  }

  const removeFilter = (filterId: string) => {
    setFilters(filters.filter((f) => f.id !== filterId))
  }

  const updateFilter = (filterId: string, updates: Partial<ReportFilter>) => {
    setFilters(filters.map((f) => (f.id === filterId ? { ...f, ...updates } : f)))
  }

  const generateReport = () => {
    const reportConfig = {
      forms: selectedForms,
      metrics: selectedMetrics,
      dateRange,
      filters,
    }
    console.log("Generating report with config:", reportConfig)
    // TODO: Implement report generation
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Custom Report Builder</CardTitle>
          <CardDescription>Create custom analytics reports with specific metrics and filters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Form Selection */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Select Forms</Label>
            <div className="grid grid-cols-2 gap-3">
              {availableForms.map((form) => (
                <div key={form.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={form.id}
                    checked={selectedForms.includes(form.id)}
                    onCheckedChange={(checked) => handleFormToggle(form.id, checked as boolean)}
                  />
                  <Label htmlFor={form.id} className="text-sm cursor-pointer">
                    {form.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Metrics Selection */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Select Metrics</Label>
            <div className="grid grid-cols-2 gap-3">
              {availableMetrics.map((metric) => (
                <div key={metric.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={metric.id}
                    checked={selectedMetrics.includes(metric.id)}
                    onCheckedChange={(checked) => handleMetricToggle(metric.id, checked as boolean)}
                  />
                  <Label htmlFor={metric.id} className="text-sm cursor-pointer">
                    {metric.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Date Range</Label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-48">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filters */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium">Filters</Label>
              <Button variant="outline" size="sm" onClick={addFilter} className="gap-2 bg-transparent">
                <Plus className="h-4 w-4" />
                Add Filter
              </Button>
            </div>
            <div className="space-y-3">
              {filters.map((filter) => (
                <div key={filter.id} className="flex items-center gap-2 p-3 border rounded-lg">
                  <Select value={filter.field} onValueChange={(value) => updateFilter(filter.id, { field: value })}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Field" />
                    </SelectTrigger>
                    <SelectContent>
                      {filterFields.map((field) => (
                        <SelectItem key={field.id} value={field.id}>
                          {field.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={filter.operator}
                    onValueChange={(value) => updateFilter(filter.id, { operator: value })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Operator" />
                    </SelectTrigger>
                    <SelectContent>
                      {filterOperators.map((operator) => (
                        <SelectItem key={operator.id} value={operator.id}>
                          {operator.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Value"
                    value={filter.value}
                    onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFilter(filter.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Report Preview */}
          {(selectedForms.length > 0 || selectedMetrics.length > 0) && (
            <div>
              <Label className="text-sm font-medium mb-3 block">Report Preview</Label>
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                {selectedForms.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-muted-foreground">Forms:</span>
                    {selectedForms.map((formId) => {
                      const form = availableForms.find((f) => f.id === formId)
                      return (
                        <Badge key={formId} variant="secondary">
                          {form?.name}
                        </Badge>
                      )
                    })}
                  </div>
                )}
                {selectedMetrics.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-muted-foreground">Metrics:</span>
                    {selectedMetrics.map((metricId) => {
                      const metric = availableMetrics.find((m) => m.id === metricId)
                      return (
                        <Badge key={metricId} variant="outline">
                          {metric?.name}
                        </Badge>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" className="bg-transparent">
              Save Template
            </Button>
            <Button onClick={generateReport} className="gap-2">
              <Download className="h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

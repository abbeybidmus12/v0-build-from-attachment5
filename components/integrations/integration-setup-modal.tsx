"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, ArrowRight, ArrowLeft, ExternalLink } from "lucide-react"

interface Integration {
  id: string
  name: string
  description: string
  setupSteps: number
  icon: string
}

interface IntegrationSetupModalProps {
  integration: Integration
  onClose: () => void
  onComplete: (config: any) => void
}

export function IntegrationSetupModal({ integration, onClose, onComplete }: IntegrationSetupModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [config, setConfig] = useState<Record<string, any>>({})

  const progress = (currentStep / integration.setupSteps) * 100

  const handleNext = () => {
    if (currentStep < integration.setupSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete(config)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const updateConfig = (key: string, value: any) => {
    setConfig({ ...config, [key]: value })
  }

  const renderStepContent = () => {
    switch (integration.id) {
      case "google-sheets":
        return renderGoogleSheetsStep()
      case "slack":
        return renderSlackStep()
      case "zapier":
        return renderZapierStep()
      default:
        return renderGenericStep()
    }
  }

  const renderGoogleSheetsStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="auth">Google Account Authentication</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Connect your Google account to access your spreadsheets
              </p>
              <Button className="w-full gap-2">
                <ExternalLink className="h-4 w-4" />
                Authenticate with Google
              </Button>
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="spreadsheet">Select Spreadsheet</Label>
              <Select onValueChange={(value) => updateConfig("spreadsheetId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a spreadsheet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sheet1">Customer Feedback Responses</SelectItem>
                  <SelectItem value="sheet2">Event Registration Data</SelectItem>
                  <SelectItem value="sheet3">Product Requests</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="worksheet">Worksheet Name</Label>
              <Input
                id="worksheet"
                placeholder="Sheet1"
                value={config.worksheet || ""}
                onChange={(e) => updateConfig("worksheet", e.target.value)}
              />
            </div>
          </div>
        )
      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label>Field Mapping</Label>
              <p className="text-sm text-muted-foreground mb-3">Map form fields to spreadsheet columns</p>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="include-timestamp" />
                  <Label htmlFor="include-timestamp">Include submission timestamp</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="include-email" />
                  <Label htmlFor="include-email">Include respondent email</Label>
                </div>
              </div>
            </div>
          </div>
        )
    }
  }

  const renderSlackStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="webhook-url">Slack Webhook URL</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Create a webhook in your Slack workspace and paste the URL here
              </p>
              <Input
                id="webhook-url"
                placeholder="https://hooks.slack.com/services/..."
                value={config.webhookUrl || ""}
                onChange={(e) => updateConfig("webhookUrl", e.target.value)}
              />
              <Button variant="outline" size="sm" className="mt-2 gap-2 bg-transparent">
                <ExternalLink className="h-4 w-4" />
                How to create a webhook
              </Button>
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="channel">Default Channel</Label>
              <Input
                id="channel"
                placeholder="#general"
                value={config.channel || ""}
                onChange={(e) => updateConfig("channel", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="message-template">Message Template</Label>
              <Textarea
                id="message-template"
                placeholder="New form submission from {form_name}"
                value={config.messageTemplate || ""}
                onChange={(e) => updateConfig("messageTemplate", e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )
    }
  }

  const renderZapierStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label>Zapier Webhook</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Create a new Zap in Zapier and use the webhook URL provided below
              </p>
              <div className="p-3 bg-muted rounded-lg">
                <code className="text-sm">https://hooks.zapier.com/hooks/catch/12345/abcdef/</code>
              </div>
              <Button variant="outline" size="sm" className="mt-2 gap-2 bg-transparent">
                <ExternalLink className="h-4 w-4" />
                Open Zapier
              </Button>
            </div>
          </div>
        )
      default:
        return renderGenericStep()
    }
  }

  const renderGenericStep = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="api-key">API Key</Label>
        <Input
          id="api-key"
          type="password"
          placeholder="Enter your API key"
          value={config.apiKey || ""}
          onChange={(e) => updateConfig("apiKey", e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="endpoint">Endpoint URL</Label>
        <Input
          id="endpoint"
          placeholder="https://api.example.com"
          value={config.endpoint || ""}
          onChange={(e) => updateConfig("endpoint", e.target.value)}
        />
      </div>
    </div>
  )

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <img src={integration.icon || "/placeholder.svg"} alt={integration.name} className="h-8 w-8 rounded" />
            <div>
              <DialogTitle className="font-heading">Connect {integration.name}</DialogTitle>
              <DialogDescription>
                Step {currentStep} of {integration.setupSteps}
              </DialogDescription>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </DialogHeader>

        <div className="py-4">{renderStepContent()}</div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button variant="outline" onClick={handleBack} disabled={currentStep === 1} className="bg-transparent">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose} className="bg-transparent">
              Cancel
            </Button>
            <Button onClick={handleNext} className="gap-2">
              {currentStep === integration.setupSteps ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Complete
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

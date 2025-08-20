"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Plus, AlertCircle, Clock, Settings, ExternalLink } from "lucide-react"

interface Integration {
  id: string
  name: string
  description: string
  category: string
  status: "connected" | "available" | "error" | "pending"
  icon: string
  features: string[]
  setupSteps: number
  connectedForms: number
  error?: string
}

interface IntegrationCardProps {
  integration: Integration
  onAction: () => void
  showDetails?: boolean
}

const statusConfig = {
  connected: { label: "Connected", variant: "default" as const, icon: CheckCircle },
  available: { label: "Available", variant: "secondary" as const, icon: Plus },
  error: { label: "Error", variant: "destructive" as const, icon: AlertCircle },
  pending: { label: "Pending", variant: "outline" as const, icon: Clock },
}

export function IntegrationCard({ integration, onAction, showDetails = false }: IntegrationCardProps) {
  const StatusIcon = statusConfig[integration.status].icon

  const getActionButton = () => {
    switch (integration.status) {
      case "available":
        return (
          <Button onClick={onAction} className="w-full gap-2">
            <Plus className="h-4 w-4" />
            Connect
          </Button>
        )
      case "connected":
        return (
          <Button variant="outline" onClick={onAction} className="w-full gap-2 bg-transparent">
            <Settings className="h-4 w-4" />
            Configure
          </Button>
        )
      case "error":
        return (
          <Button variant="destructive" onClick={onAction} className="w-full gap-2">
            <AlertCircle className="h-4 w-4" />
            Reconnect
          </Button>
        )
      case "pending":
        return (
          <Button variant="outline" disabled className="w-full gap-2 bg-transparent">
            <Clock className="h-4 w-4" />
            Connecting...
          </Button>
        )
    }
  }

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <img src={integration.icon || "/placeholder.svg"} alt={integration.name} className="h-10 w-10 rounded-lg" />
            <div>
              <CardTitle className="font-heading text-base">{integration.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={statusConfig[integration.status].variant} className="gap-1">
                  <StatusIcon className="h-3 w-3" />
                  {statusConfig[integration.status].label}
                </Badge>
                {integration.status === "connected" && (
                  <Badge variant="outline" className="text-xs">
                    {integration.connectedForms} forms
                  </Badge>
                )}
              </div>
            </div>
          </div>
          {integration.status === "connected" && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <CardDescription className="text-sm">{integration.description}</CardDescription>

        {integration.error && (
          <div className="p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
            {integration.error}
          </div>
        )}

        {showDetails && integration.status === "connected" && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Connected Forms:</p>
            <div className="text-sm text-muted-foreground">
              {integration.connectedForms > 0
                ? `${integration.connectedForms} forms are using this integration`
                : "No forms connected yet"}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Features:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            {integration.features.slice(0, 3).map((feature, index) => (
              <li key={index} className="flex items-center gap-2">
                <div className="h-1 w-1 bg-primary rounded-full" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {getActionButton()}
      </CardContent>
    </Card>
  )
}

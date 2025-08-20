"use client"

import { useState } from "react"
import { SidebarNav } from "@/components/sidebar-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IntegrationCard } from "@/components/integrations/integration-card"
import { IntegrationSetupModal } from "@/components/integrations/integration-setup-modal"
import { WebhookManager } from "@/components/integrations/webhook-manager"
import { ApiKeyManager } from "@/components/integrations/api-key-manager"
import { Zap, CheckCircle, Clock, AlertCircle, Plus } from "lucide-react"

// Mock integrations data
const integrations = [
  {
    id: "google-sheets",
    name: "Google Sheets",
    description: "Automatically send form responses to Google Sheets spreadsheets",
    category: "productivity" as const,
    status: "connected" as const,
    icon: "/placeholder.svg?height=40&width=40",
    features: ["Real-time sync", "Custom mapping", "Multiple sheets"],
    setupSteps: 3,
    connectedForms: 5,
  },
  {
    id: "slack",
    name: "Slack",
    description: "Get instant notifications in Slack when forms are submitted",
    category: "communication" as const,
    status: "connected" as const,
    icon: "/placeholder.svg?height=40&width=40",
    features: ["Channel notifications", "Custom messages", "Rich formatting"],
    setupSteps: 2,
    connectedForms: 3,
  },
  {
    id: "zapier",
    name: "Zapier",
    description: "Connect to 5000+ apps with automated workflows",
    category: "automation" as const,
    status: "available" as const,
    icon: "/placeholder.svg?height=40&width=40",
    features: ["5000+ app connections", "Multi-step workflows", "Conditional logic"],
    setupSteps: 4,
    connectedForms: 0,
  },
  {
    id: "mailchimp",
    name: "Mailchimp",
    description: "Add form respondents to your Mailchimp email lists",
    category: "marketing" as const,
    status: "available" as const,
    icon: "/placeholder.svg?height=40&width=40",
    features: ["List management", "Audience segmentation", "Email campaigns"],
    setupSteps: 3,
    connectedForms: 0,
  },
  {
    id: "hubspot",
    name: "HubSpot",
    description: "Sync form data with your HubSpot CRM and marketing tools",
    category: "crm" as const,
    status: "error" as const,
    icon: "/placeholder.svg?height=40&width=40",
    features: ["Contact management", "Deal tracking", "Marketing automation"],
    setupSteps: 5,
    connectedForms: 2,
    error: "API key expired",
  },
  {
    id: "salesforce",
    name: "Salesforce",
    description: "Create leads and contacts in Salesforce from form submissions",
    category: "crm" as const,
    status: "available" as const,
    icon: "/placeholder.svg?height=40&width=40",
    features: ["Lead generation", "Contact creation", "Custom fields"],
    setupSteps: 4,
    connectedForms: 0,
  },
  {
    id: "discord",
    name: "Discord",
    description: "Send form notifications to Discord channels",
    category: "communication" as const,
    status: "available" as const,
    icon: "/placeholder.svg?height=40&width=40",
    features: ["Channel webhooks", "Rich embeds", "Role mentions"],
    setupSteps: 2,
    connectedForms: 0,
  },
  {
    id: "airtable",
    name: "Airtable",
    description: "Store form responses in Airtable bases with rich data types",
    category: "productivity" as const,
    status: "available" as const,
    icon: "/placeholder.svg?height=40&width=40",
    features: ["Rich data types", "Linked records", "Views and filters"],
    setupSteps: 3,
    connectedForms: 0,
  },
]

const categories = {
  all: "All Integrations",
  productivity: "Productivity",
  communication: "Communication",
  automation: "Automation",
  marketing: "Marketing",
  crm: "CRM",
}

const statusConfig = {
  connected: { label: "Connected", variant: "default" as const, icon: CheckCircle },
  available: { label: "Available", variant: "secondary" as const, icon: Plus },
  error: { label: "Error", variant: "destructive" as const, icon: AlertCircle },
  pending: { label: "Pending", variant: "outline" as const, icon: Clock },
}

export default function IntegrationsPage() {
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof categories>("all")
  const [selectedIntegration, setSelectedIntegration] = useState<(typeof integrations)[0] | null>(null)
  const [showSetupModal, setShowSetupModal] = useState(false)

  const filteredIntegrations = integrations.filter(
    (integration) => selectedCategory === "all" || integration.category === selectedCategory,
  )

  const connectedCount = integrations.filter((i) => i.status === "connected").length
  const errorCount = integrations.filter((i) => i.status === "error").length

  const handleIntegrationAction = (integration: (typeof integrations)[0]) => {
    setSelectedIntegration(integration)
    if (integration.status === "available") {
      setShowSetupModal(true)
    } else if (integration.status === "error") {
      // Handle reconnection
      console.log("Reconnecting integration:", integration.id)
    }
  }

  const stats = [
    {
      title: "Connected Integrations",
      value: connectedCount.toString(),
      icon: CheckCircle,
      change: "Active connections",
    },
    {
      title: "Available Integrations",
      value: integrations.length.toString(),
      icon: Zap,
      change: "Ready to connect",
    },
    {
      title: "Total Forms Connected",
      value: integrations.reduce((sum, i) => sum + i.connectedForms, 0).toString(),
      icon: Plus,
      change: "Across all integrations",
    },
    {
      title: "Issues to Resolve",
      value: errorCount.toString(),
      icon: AlertCircle,
      change: errorCount > 0 ? "Needs attention" : "All good",
    },
  ]

  return (
    <div className="flex h-screen bg-background">
      <SidebarNav />

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-heading text-2xl font-bold text-foreground">Integrations</h1>
                <p className="text-muted-foreground">Connect your forms to external services and automate workflows</p>
              </div>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Request Integration
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <Card key={stat.title}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="font-heading text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-xs text-accent">{stat.change}</p>
                    </div>
                    <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <stat.icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Integration Tabs */}
          <Tabs defaultValue="browse" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="browse">Browse Integrations</TabsTrigger>
              <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
              <TabsTrigger value="api-keys">API Keys</TabsTrigger>
              <TabsTrigger value="connected">Connected ({connectedCount})</TabsTrigger>
            </TabsList>

            <TabsContent value="browse" className="space-y-6">
              {/* Category Filter */}
              <div className="flex items-center gap-2 flex-wrap">
                {Object.entries(categories).map(([key, label]) => (
                  <Button
                    key={key}
                    variant={selectedCategory === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(key as keyof typeof categories)}
                    className={selectedCategory !== key ? "bg-transparent" : ""}
                  >
                    {label}
                  </Button>
                ))}
              </div>

              {/* Integrations Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredIntegrations.map((integration) => (
                  <IntegrationCard
                    key={integration.id}
                    integration={integration}
                    onAction={() => handleIntegrationAction(integration)}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="webhooks" className="space-y-6">
              <WebhookManager />
            </TabsContent>

            <TabsContent value="api-keys" className="space-y-6">
              <ApiKeyManager />
            </TabsContent>

            <TabsContent value="connected" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {integrations
                  .filter((i) => i.status === "connected" || i.status === "error")
                  .map((integration) => (
                    <IntegrationCard
                      key={integration.id}
                      integration={integration}
                      onAction={() => handleIntegrationAction(integration)}
                      showDetails
                    />
                  ))}
              </div>

              {connectedCount === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
                      No integrations connected
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Connect your first integration to start automating your form workflows
                    </p>
                    <Button onClick={() => setSelectedCategory("all")}>Browse Integrations</Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Integration Setup Modal */}
      {showSetupModal && selectedIntegration && (
        <IntegrationSetupModal
          integration={selectedIntegration}
          onClose={() => {
            setShowSetupModal(false)
            setSelectedIntegration(null)
          }}
          onComplete={(config) => {
            console.log("Integration setup completed:", selectedIntegration.id, config)
            setShowSetupModal(false)
            setSelectedIntegration(null)
          }}
        />
      )}
    </div>
  )
}

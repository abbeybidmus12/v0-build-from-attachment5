"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Copy, TestTube, Globe } from "lucide-react"

interface Webhook {
  id: string
  name: string
  url: string
  events: string[]
  status: "active" | "inactive"
  lastTriggered?: string
}

const mockWebhooks: Webhook[] = [
  {
    id: "webhook-1",
    name: "Customer Feedback Notifications",
    url: "https://api.example.com/webhooks/feedback",
    events: ["form.submitted", "form.completed"],
    status: "active",
    lastTriggered: "2024-01-15T10:30:00Z",
  },
  {
    id: "webhook-2",
    name: "Event Registration Sync",
    url: "https://events.company.com/api/registrations",
    events: ["form.submitted"],
    status: "inactive",
  },
]

const availableEvents = [
  { id: "form.submitted", name: "Form Submitted", description: "Triggered when a form is submitted" },
  { id: "form.completed", name: "Form Completed", description: "Triggered when a form is fully completed" },
  { id: "form.abandoned", name: "Form Abandoned", description: "Triggered when a form is started but not completed" },
  { id: "response.updated", name: "Response Updated", description: "Triggered when a response is modified" },
]

export function WebhookManager() {
  const [webhooks, setWebhooks] = useState<Webhook[]>(mockWebhooks)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newWebhook, setNewWebhook] = useState({
    name: "",
    url: "",
    events: [] as string[],
  })

  const handleAddWebhook = () => {
    const webhook: Webhook = {
      id: `webhook-${Date.now()}`,
      name: newWebhook.name,
      url: newWebhook.url,
      events: newWebhook.events,
      status: "active",
    }
    setWebhooks([...webhooks, webhook])
    setNewWebhook({ name: "", url: "", events: [] })
    setShowAddForm(false)
  }

  const handleDeleteWebhook = (id: string) => {
    setWebhooks(webhooks.filter((w) => w.id !== id))
  }

  const handleTestWebhook = (webhook: Webhook) => {
    console.log("Testing webhook:", webhook.id)
    // TODO: Implement webhook testing
  }

  const copyWebhookUrl = (url: string) => {
    navigator.clipboard.writeText(url)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-heading">Webhook Management</CardTitle>
              <CardDescription>Configure webhooks to receive real-time form events</CardDescription>
            </div>
            <Button onClick={() => setShowAddForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Webhook
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Webhook Form */}
          {showAddForm && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Add New Webhook</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="webhook-name">Webhook Name</Label>
                  <Input
                    id="webhook-name"
                    placeholder="My Webhook"
                    value={newWebhook.name}
                    onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="webhook-url">Endpoint URL</Label>
                  <Input
                    id="webhook-url"
                    placeholder="https://api.example.com/webhooks"
                    value={newWebhook.url}
                    onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Events</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {availableEvents.map((event) => (
                      <div key={event.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={event.id}
                          checked={newWebhook.events.includes(event.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewWebhook({ ...newWebhook, events: [...newWebhook.events, event.id] })
                            } else {
                              setNewWebhook({
                                ...newWebhook,
                                events: newWebhook.events.filter((ev) => ev !== event.id),
                              })
                            }
                          }}
                          className="rounded border-border"
                        />
                        <Label htmlFor={event.id} className="text-sm cursor-pointer">
                          {event.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={handleAddWebhook} disabled={!newWebhook.name || !newWebhook.url}>
                    Add Webhook
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)} className="bg-transparent">
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Webhooks List */}
          <div className="space-y-3">
            {webhooks.map((webhook) => (
              <Card key={webhook.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-foreground">{webhook.name}</h4>
                        <Badge variant={webhook.status === "active" ? "default" : "secondary"}>{webhook.status}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Globe className="h-4 w-4" />
                        <code className="bg-muted px-2 py-1 rounded text-xs">{webhook.url}</code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => copyWebhookUrl(webhook.url)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {webhook.events.map((event) => (
                          <Badge key={event} variant="outline" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                      </div>
                      {webhook.lastTriggered && (
                        <p className="text-xs text-muted-foreground">
                          Last triggered: {formatDate(webhook.lastTriggered)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleTestWebhook(webhook)} className="gap-2">
                        <TestTube className="h-4 w-4" />
                        Test
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteWebhook(webhook.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {webhooks.length === 0 && (
            <div className="text-center py-8">
              <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-heading text-lg font-semibold text-foreground mb-2">No webhooks configured</h3>
              <p className="text-muted-foreground mb-4">Add your first webhook to receive real-time form events</p>
              <Button onClick={() => setShowAddForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Webhook
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

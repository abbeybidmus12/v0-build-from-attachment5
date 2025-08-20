"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Eye, EyeOff, Copy, Trash2, Key, RefreshCw } from "lucide-react"

interface ApiKey {
  id: string
  name: string
  key: string
  permissions: string[]
  createdAt: string
  lastUsed?: string
  status: "active" | "inactive"
}

const mockApiKeys: ApiKey[] = [
  {
    id: "key-1",
    name: "Production API Key",
    key: "fc_live_1234567890abcdef",
    permissions: ["forms:read", "responses:read", "responses:write"],
    createdAt: "2024-01-10T10:00:00Z",
    lastUsed: "2024-01-15T14:30:00Z",
    status: "active",
  },
  {
    id: "key-2",
    name: "Development Key",
    key: "fc_test_abcdef1234567890",
    permissions: ["forms:read", "responses:read"],
    createdAt: "2024-01-05T15:20:00Z",
    lastUsed: "2024-01-14T09:15:00Z",
    status: "active",
  },
]

const availablePermissions = [
  { id: "forms:read", name: "Read Forms", description: "View form configurations and metadata" },
  { id: "forms:write", name: "Write Forms", description: "Create and modify forms" },
  { id: "responses:read", name: "Read Responses", description: "View form responses and submissions" },
  { id: "responses:write", name: "Write Responses", description: "Create and modify responses" },
  { id: "analytics:read", name: "Read Analytics", description: "Access analytics and reporting data" },
  { id: "integrations:manage", name: "Manage Integrations", description: "Configure and manage integrations" },
]

export function ApiKeyManager() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(mockApiKeys)
  const [showAddForm, setShowAddForm] = useState(false)
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [newKey, setNewKey] = useState({
    name: "",
    permissions: [] as string[],
  })

  const handleAddApiKey = () => {
    const key: ApiKey = {
      id: `key-${Date.now()}`,
      name: newKey.name,
      key: `fc_live_${Math.random().toString(36).substring(2, 18)}`,
      permissions: newKey.permissions,
      createdAt: new Date().toISOString(),
      status: "active",
    }
    setApiKeys([...apiKeys, key])
    setNewKey({ name: "", permissions: [] })
    setShowAddForm(false)
  }

  const handleDeleteKey = (id: string) => {
    setApiKeys(apiKeys.filter((k) => k.id !== id))
  }

  const handleRegenerateKey = (id: string) => {
    setApiKeys(
      apiKeys.map((k) => (k.id === id ? { ...k, key: `fc_live_${Math.random().toString(36).substring(2, 18)}` } : k)),
    )
  }

  const toggleKeyVisibility = (id: string) => {
    const newVisible = new Set(visibleKeys)
    if (newVisible.has(id)) {
      newVisible.delete(id)
    } else {
      newVisible.add(id)
    }
    setVisibleKeys(newVisible)
  }

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const maskKey = (key: string) => {
    return key.substring(0, 8) + "..." + key.substring(key.length - 4)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-heading">API Key Management</CardTitle>
              <CardDescription>Manage API keys for programmatic access to your forms and data</CardDescription>
            </div>
            <Button onClick={() => setShowAddForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Generate API Key
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add API Key Form */}
          {showAddForm && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Generate New API Key</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="key-name">Key Name</Label>
                  <Input
                    id="key-name"
                    placeholder="Production API Key"
                    value={newKey.name}
                    onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Permissions</Label>
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    {availablePermissions.map((permission) => (
                      <div key={permission.id} className="flex items-start space-x-2">
                        <input
                          type="checkbox"
                          id={permission.id}
                          checked={newKey.permissions.includes(permission.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewKey({ ...newKey, permissions: [...newKey.permissions, permission.id] })
                            } else {
                              setNewKey({
                                ...newKey,
                                permissions: newKey.permissions.filter((p) => p !== permission.id),
                              })
                            }
                          }}
                          className="rounded border-border mt-1"
                        />
                        <div>
                          <Label htmlFor={permission.id} className="text-sm cursor-pointer font-medium">
                            {permission.name}
                          </Label>
                          <p className="text-xs text-muted-foreground">{permission.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={handleAddApiKey} disabled={!newKey.name || newKey.permissions.length === 0}>
                    Generate Key
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)} className="bg-transparent">
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* API Keys List */}
          <div className="space-y-3">
            {apiKeys.map((apiKey) => (
              <Card key={apiKey.id}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-foreground">{apiKey.name}</h4>
                          <Badge variant={apiKey.status === "active" ? "default" : "secondary"}>{apiKey.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Created {formatDate(apiKey.createdAt)}</p>
                        {apiKey.lastUsed && (
                          <p className="text-xs text-muted-foreground">Last used {formatDate(apiKey.lastUsed)}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRegenerateKey(apiKey.id)}
                          className="gap-2"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Regenerate
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteKey(apiKey.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 bg-muted rounded">
                      <Key className="h-4 w-4 text-muted-foreground" />
                      <code className="flex-1 text-sm">
                        {visibleKeys.has(apiKey.id) ? apiKey.key : maskKey(apiKey.key)}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => toggleKeyVisibility(apiKey.id)}
                      >
                        {visibleKeys.has(apiKey.id) ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyKey(apiKey.key)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-muted-foreground">Permissions:</span>
                      {apiKey.permissions.map((permission) => (
                        <Badge key={permission} variant="outline" className="text-xs">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {apiKeys.length === 0 && (
            <div className="text-center py-8">
              <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-heading text-lg font-semibold text-foreground mb-2">No API keys generated</h3>
              <p className="text-muted-foreground mb-4">
                Generate your first API key to access FormCraft programmatically
              </p>
              <Button onClick={() => setShowAddForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Generate API Key
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

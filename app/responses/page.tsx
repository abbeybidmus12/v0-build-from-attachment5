"use client"

import { useState } from "react"
import { SidebarNav } from "@/components/sidebar-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponseDetailModal } from "@/components/responses/response-detail-modal"
import { ExportDialog } from "@/components/responses/export-dialog"
import {
  Search,
  Filter,
  Download,
  Trash2,
  Eye,
  Calendar,
  MessageSquare,
  CheckCircle,
  Clock,
  MoreHorizontal,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Mock data for responses
const mockResponses = [
  {
    id: "resp-1",
    formId: "form-1",
    formTitle: "Customer Feedback Survey",
    submittedAt: "2024-01-15T10:30:00Z",
    status: "new" as const,
    respondentEmail: "john.doe@example.com",
    responses: {
      "How satisfied are you?": "Very satisfied",
      "What can we improve?": "The checkout process could be smoother",
      "Would you recommend us?": "Yes",
    },
  },
  {
    id: "resp-2",
    formId: "form-2",
    formTitle: "Event Registration Form",
    submittedAt: "2024-01-14T15:45:00Z",
    status: "read" as const,
    respondentEmail: "jane.smith@example.com",
    responses: {
      "Full Name": "Jane Smith",
      Email: "jane.smith@example.com",
      "Session Preference": "Morning sessions",
      "Dietary Requirements": "Vegetarian",
    },
  },
  {
    id: "resp-3",
    formId: "form-1",
    formTitle: "Customer Feedback Survey",
    submittedAt: "2024-01-14T09:15:00Z",
    status: "flagged" as const,
    respondentEmail: "mike.johnson@example.com",
    responses: {
      "How satisfied are you?": "Dissatisfied",
      "What can we improve?": "Customer service needs major improvement. Very disappointed.",
      "Would you recommend us?": "No",
    },
  },
  {
    id: "resp-4",
    formId: "form-3",
    formTitle: "Product Feature Request",
    submittedAt: "2024-01-13T14:20:00Z",
    status: "read" as const,
    respondentEmail: "sarah.wilson@example.com",
    responses: {
      "Feature Request": "Dark mode support",
      Priority: "High",
      "Use Case": "Better user experience during night time usage",
    },
  },
  {
    id: "resp-5",
    formId: "form-2",
    formTitle: "Event Registration Form",
    submittedAt: "2024-01-13T11:30:00Z",
    status: "new" as const,
    respondentEmail: "alex.brown@example.com",
    responses: {
      "Full Name": "Alex Brown",
      Email: "alex.brown@example.com",
      "Session Preference": "Afternoon sessions",
      "Dietary Requirements": "No restrictions",
    },
  },
]

const statusConfig = {
  new: { label: "New", variant: "default" as const, icon: MessageSquare },
  read: { label: "Read", variant: "secondary" as const, icon: CheckCircle },
  flagged: { label: "Flagged", variant: "destructive" as const, icon: Clock },
}

export default function ResponsesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [formFilter, setFormFilter] = useState("all")
  const [selectedResponses, setSelectedResponses] = useState<string[]>([])
  const [selectedResponse, setSelectedResponse] = useState<(typeof mockResponses)[0] | null>(null)
  const [showExportDialog, setShowExportDialog] = useState(false)

  const filteredResponses = mockResponses.filter((response) => {
    const matchesSearch =
      response.formTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      response.respondentEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      Object.values(response.responses).some((value) => value.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesStatus = statusFilter === "all" || response.status === statusFilter
    const matchesForm = formFilter === "all" || response.formId === formFilter
    return matchesSearch && matchesStatus && matchesForm
  })

  const uniqueForms = Array.from(new Set(mockResponses.map((r) => ({ id: r.formId, title: r.formTitle }))))

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedResponses(filteredResponses.map((r) => r.id))
    } else {
      setSelectedResponses([])
    }
  }

  const handleSelectResponse = (responseId: string, checked: boolean) => {
    if (checked) {
      setSelectedResponses([...selectedResponses, responseId])
    } else {
      setSelectedResponses(selectedResponses.filter((id) => id !== responseId))
    }
  }

  const handleBulkDelete = () => {
    // TODO: Implement bulk delete
    console.log("Deleting responses:", selectedResponses)
    setSelectedResponses([])
  }

  const handleMarkAsRead = () => {
    // TODO: Implement mark as read
    console.log("Marking as read:", selectedResponses)
    setSelectedResponses([])
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

  const stats = [
    {
      title: "Total Responses",
      value: mockResponses.length.toString(),
      icon: MessageSquare,
      change: "+12 this week",
    },
    {
      title: "New Responses",
      value: mockResponses.filter((r) => r.status === "new").length.toString(),
      icon: Clock,
      change: "+3 today",
    },
    {
      title: "Flagged",
      value: mockResponses.filter((r) => r.status === "flagged").length.toString(),
      icon: Clock,
      change: "Needs attention",
    },
    {
      title: "Response Rate",
      value: "87%",
      icon: CheckCircle,
      change: "+5% this month",
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
                <h1 className="font-heading text-2xl font-bold text-foreground">Responses</h1>
                <p className="text-muted-foreground">View and manage form responses</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-transparent"
                  onClick={() => setShowExportDialog(true)}
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                {selectedResponses.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                        <MoreHorizontal className="h-4 w-4" />
                        Bulk Actions ({selectedResponses.length})
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleMarkAsRead}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Read
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleBulkDelete} className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Selected
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
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

          {/* Filters */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search responses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
              </SelectContent>
            </Select>
            <Select value={formFilter} onValueChange={setFormFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Forms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Forms</SelectItem>
                {uniqueForms.map((form) => (
                  <SelectItem key={form.id} value={form.id}>
                    {form.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Responses Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Checkbox
                  checked={selectedResponses.length === filteredResponses.length && filteredResponses.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                Responses ({filteredResponses.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border">
                    <tr className="text-left">
                      <th className="p-4 font-medium text-muted-foreground">Select</th>
                      <th className="p-4 font-medium text-muted-foreground">Form</th>
                      <th className="p-4 font-medium text-muted-foreground">Respondent</th>
                      <th className="p-4 font-medium text-muted-foreground">Status</th>
                      <th className="p-4 font-medium text-muted-foreground">Submitted</th>
                      <th className="p-4 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResponses.map((response) => {
                      const StatusIcon = statusConfig[response.status].icon
                      return (
                        <tr key={response.id} className="border-b border-border hover:bg-muted/50">
                          <td className="p-4">
                            <Checkbox
                              checked={selectedResponses.includes(response.id)}
                              onCheckedChange={(checked) => handleSelectResponse(response.id, checked as boolean)}
                            />
                          </td>
                          <td className="p-4">
                            <div>
                              <p className="font-medium text-foreground">{response.formTitle}</p>
                              <p className="text-sm text-muted-foreground">ID: {response.formId}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <p className="text-foreground">{response.respondentEmail}</p>
                          </td>
                          <td className="p-4">
                            <Badge variant={statusConfig[response.status].variant} className="gap-1">
                              <StatusIcon className="h-3 w-3" />
                              {statusConfig[response.status].label}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {formatDate(response.submittedAt)}
                            </div>
                          </td>
                          <td className="p-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-2"
                              onClick={() => setSelectedResponse(response)}
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {filteredResponses.length === 0 && (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-heading text-lg font-semibold text-foreground mb-2">No responses found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery || statusFilter !== "all" || formFilter !== "all"
                      ? "Try adjusting your search or filter criteria"
                      : "Responses will appear here once people start submitting your forms"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Response Detail Modal */}
      {selectedResponse && (
        <ResponseDetailModal
          response={selectedResponse}
          onClose={() => setSelectedResponse(null)}
          onStatusChange={(status) => {
            // TODO: Update response status
            console.log("Updating status:", selectedResponse.id, status)
          }}
        />
      )}

      {/* Export Dialog */}
      {showExportDialog && (
        <ExportDialog
          responses={filteredResponses}
          onClose={() => setShowExportDialog(false)}
          onExport={(format, options) => {
            // TODO: Implement export
            console.log("Exporting:", format, options)
            setShowExportDialog(false)
          }}
        />
      )}
    </div>
  )
}

"use client"

import { useState } from "react"
import { SidebarNav } from "@/components/sidebar-nav"
import { FormCard } from "@/components/form-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Filter, FileText } from "lucide-react"
import Link from "next/link"

// Mock data for forms
const mockForms = [
  {
    id: "1",
    title: "Customer Feedback Survey",
    description: "Collect valuable feedback from customers about their experience with our products and services.",
    status: "published" as const,
    responses: 127,
    lastModified: "2 hours ago",
    tags: ["feedback", "customer"],
  },
  {
    id: "2",
    title: "Event Registration Form",
    description:
      "Registration form for the upcoming annual conference with session preferences and dietary requirements.",
    status: "published" as const,
    responses: 89,
    lastModified: "1 day ago",
    tags: ["event", "registration"],
  },
  {
    id: "3",
    title: "Employee Onboarding",
    description: "Comprehensive onboarding form for new employees including personal details and documentation.",
    status: "draft" as const,
    responses: 0,
    lastModified: "3 days ago",
    tags: ["hr", "onboarding"],
  },
]

export default function FormsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredForms = mockForms.filter((form) => {
    const matchesSearch =
      form.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      form.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || form.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="flex h-screen bg-background">
      <SidebarNav />

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-heading text-2xl font-bold text-foreground">Forms</h1>
                <p className="text-muted-foreground">Create and manage your forms</p>
              </div>
              <Link href="/forms/builder">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Form
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Search and Filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search forms..."
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
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Forms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredForms.map((form) => (
              <FormCard key={form.id} {...form} />
            ))}
          </div>

          {filteredForms.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-heading text-lg font-semibold text-foreground mb-2">No forms found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Get started by creating your first form"}
              </p>
              <Link href="/forms/builder">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Form
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

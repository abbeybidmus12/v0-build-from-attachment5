"use client"

import { useState } from "react"
import { SidebarNav } from "@/components/sidebar-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResponseRateChart } from "@/components/analytics/response-rate-chart"
import { CompletionTimeChart } from "@/components/analytics/completion-time-chart"
import { FieldAnalyticsChart } from "@/components/analytics/field-analytics-chart"
import { FormPerformanceChart } from "@/components/analytics/form-performance-chart"
import { CustomReportBuilder } from "@/components/analytics/custom-report-builder"
import { TrendingUp, TrendingDown, BarChart3, Users, Clock, Target, Download, Calendar } from "lucide-react"

// Mock analytics data
const analyticsData = {
  overview: {
    totalResponses: 1247,
    responseGrowth: 12.5,
    avgCompletionTime: 142, // seconds
    completionRate: 87.3,
    topPerformingForm: "Customer Feedback Survey",
  },
  responsesByDay: [
    { date: "2024-01-08", responses: 45 },
    { date: "2024-01-09", responses: 52 },
    { date: "2024-01-10", responses: 38 },
    { date: "2024-01-11", responses: 67 },
    { date: "2024-01-12", responses: 71 },
    { date: "2024-01-13", responses: 59 },
    { date: "2024-01-14", responses: 84 },
    { date: "2024-01-15", responses: 92 },
  ],
  completionTimes: [
    { timeRange: "0-30s", count: 156 },
    { timeRange: "30s-1m", count: 324 },
    { timeRange: "1-2m", count: 445 },
    { timeRange: "2-5m", count: 267 },
    { timeRange: "5m+", count: 55 },
  ],
  formPerformance: [
    { form: "Customer Feedback", responses: 456, completionRate: 92.1 },
    { form: "Event Registration", responses: 234, completionRate: 85.7 },
    { form: "Product Feature Request", responses: 189, completionRate: 78.4 },
    { form: "Newsletter Signup", responses: 368, completionRate: 94.2 },
  ],
  fieldAnalytics: [
    { field: "Email", dropoffRate: 5.2 },
    { field: "Name", dropoffRate: 3.1 },
    { field: "Feedback", dropoffRate: 12.8 },
    { field: "Rating", dropoffRate: 8.4 },
    { field: "Recommendation", dropoffRate: 15.6 },
  ],
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("7d")
  const [selectedForm, setSelectedForm] = useState("all")

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
  }

  const overviewStats = [
    {
      title: "Total Responses",
      value: analyticsData.overview.totalResponses.toLocaleString(),
      change: `+${analyticsData.overview.responseGrowth}%`,
      trend: "up" as const,
      icon: Users,
    },
    {
      title: "Completion Rate",
      value: `${analyticsData.overview.completionRate}%`,
      change: "+2.1%",
      trend: "up" as const,
      icon: Target,
    },
    {
      title: "Avg. Completion Time",
      value: formatTime(analyticsData.overview.avgCompletionTime),
      change: "-8s",
      trend: "down" as const,
      icon: Clock,
    },
    {
      title: "Top Performing Form",
      value: analyticsData.overview.topPerformingForm,
      change: "456 responses",
      trend: "neutral" as const,
      icon: BarChart3,
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
                <h1 className="font-heading text-2xl font-bold text-foreground">Analytics</h1>
                <p className="text-muted-foreground">Track form performance and user behavior</p>
              </div>
              <div className="flex items-center gap-2">
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-32">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="1y">Last year</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedForm} onValueChange={setSelectedForm}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Forms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Forms</SelectItem>
                    <SelectItem value="form-1">Customer Feedback Survey</SelectItem>
                    <SelectItem value="form-2">Event Registration Form</SelectItem>
                    <SelectItem value="form-3">Product Feature Request</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="gap-2 bg-transparent">
                  <Download className="h-4 w-4" />
                  Export Report
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {overviewStats.map((stat) => (
              <Card key={stat.title}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="font-heading text-2xl font-bold text-foreground">{stat.value}</p>
                      <div className="flex items-center gap-1">
                        {stat.trend === "up" && <TrendingUp className="h-3 w-3 text-green-500" />}
                        {stat.trend === "down" && <TrendingDown className="h-3 w-3 text-green-500" />}
                        <span
                          className={`text-xs ${
                            stat.trend === "up" || stat.trend === "down" ? "text-green-500" : "text-muted-foreground"
                          }`}
                        >
                          {stat.change}
                        </span>
                      </div>
                    </div>
                    <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <stat.icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Analytics Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="forms">Form Performance</TabsTrigger>
              <TabsTrigger value="fields">Field Analysis</TabsTrigger>
              <TabsTrigger value="reports">Custom Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Response Rate Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading">Response Trends</CardTitle>
                    <CardDescription>Daily response volume over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponseRateChart data={analyticsData.responsesByDay} />
                  </CardContent>
                </Card>

                {/* Completion Time Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading">Completion Time Distribution</CardTitle>
                    <CardDescription>How long users take to complete forms</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CompletionTimeChart data={analyticsData.completionTimes} />
                  </CardContent>
                </Card>
              </div>

              {/* Top Forms Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading">Top Performing Forms</CardTitle>
                  <CardDescription>Forms ranked by response volume and completion rate</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.formPerformance.map((form, index) => (
                      <div key={form.form} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                            {index + 1}
                          </Badge>
                          <div>
                            <p className="font-medium text-foreground">{form.form}</p>
                            <p className="text-sm text-muted-foreground">{form.responses} responses</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-foreground">{form.completionRate}%</p>
                          <p className="text-sm text-muted-foreground">completion rate</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="forms" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading">Form Performance Comparison</CardTitle>
                  <CardDescription>Compare response rates and completion rates across forms</CardDescription>
                </CardHeader>
                <CardContent>
                  <FormPerformanceChart data={analyticsData.formPerformance} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="fields" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading">Field Drop-off Analysis</CardTitle>
                  <CardDescription>Identify which fields cause users to abandon forms</CardDescription>
                </CardHeader>
                <CardContent>
                  <FieldAnalyticsChart data={analyticsData.fieldAnalytics} />
                </CardContent>
              </Card>

              {/* Field Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading text-base">Highest Drop-off Fields</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analyticsData.fieldAnalytics
                        .sort((a, b) => b.dropoffRate - a.dropoffRate)
                        .slice(0, 3)
                        .map((field) => (
                          <div key={field.field} className="flex items-center justify-between">
                            <span className="text-foreground">{field.field}</span>
                            <Badge variant="destructive">{field.dropoffRate}% drop-off</Badge>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading text-base">Best Performing Fields</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analyticsData.fieldAnalytics
                        .sort((a, b) => a.dropoffRate - b.dropoffRate)
                        .slice(0, 3)
                        .map((field) => (
                          <div key={field.field} className="flex items-center justify-between">
                            <span className="text-foreground">{field.field}</span>
                            <Badge variant="secondary">{field.dropoffRate}% drop-off</Badge>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              <CustomReportBuilder />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface CompletionTimeChartProps {
  data: Array<{
    timeRange: string
    count: number
  }>
}

export function CompletionTimeChart({ data }: CompletionTimeChartProps) {
  const chartData = data || []

  const chartConfig = {
    count: {
      label: "Responses",
      color: "hsl(var(--chart-2))",
    },
  }

  return (
    <ChartContainer config={chartConfig} className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <XAxis dataKey="timeRange" axisLine={false} tickLine={false} className="text-xs fill-muted-foreground" />
          <YAxis axisLine={false} tickLine={false} className="text-xs fill-muted-foreground" />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name) => [value, chartConfig[name as keyof typeof chartConfig]?.label || name]}
              />
            }
          />
          <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

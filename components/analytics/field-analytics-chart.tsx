"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface FieldAnalyticsChartProps {
  data: Array<{
    field: string
    dropoffRate: number
  }>
}

export function FieldAnalyticsChart({ data }: FieldAnalyticsChartProps) {
  const chartData = data || []

  const chartConfig = {
    dropoffRate: {
      label: "Drop-off Rate (%)",
      color: "hsl(var(--chart-3))",
    },
  }

  return (
    <ChartContainer config={chartConfig} className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="horizontal">
          <XAxis type="number" axisLine={false} tickLine={false} className="text-xs fill-muted-foreground" />
          <YAxis
            type="category"
            dataKey="field"
            axisLine={false}
            tickLine={false}
            className="text-xs fill-muted-foreground"
            width={100}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name) => [
                  `${value}%`,
                  chartConfig[name as keyof typeof chartConfig]?.label || "Drop-off Rate",
                ]}
              />
            }
          />
          <Bar dataKey="dropoffRate" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

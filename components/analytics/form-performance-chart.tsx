"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Legend } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface FormPerformanceChartProps {
  data: Array<{
    form: string
    responses: number
    completionRate: number
  }>
}

export function FormPerformanceChart({ data }: FormPerformanceChartProps) {
  const chartData = data || []

  const chartConfig = {
    responses: {
      label: "Responses",
      color: "hsl(var(--chart-1))",
    },
    completionRate: {
      label: "Completion Rate (%)",
      color: "hsl(var(--chart-2))",
    },
  }

  return (
    <ChartContainer config={chartConfig} className="h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <XAxis
            dataKey="form"
            axisLine={false}
            tickLine={false}
            className="text-xs fill-muted-foreground"
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis yAxisId="left" axisLine={false} tickLine={false} className="text-xs fill-muted-foreground" />
          <YAxis
            yAxisId="right"
            orientation="right"
            axisLine={false}
            tickLine={false}
            className="text-xs fill-muted-foreground"
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name) => {
                  const config = chartConfig[name as keyof typeof chartConfig]
                  if (name === "completionRate") {
                    return [`${value}%`, config?.label || name]
                  }
                  return [value, config?.label || name]
                }}
              />
            }
          />
          <Legend
            formatter={(value) => {
              const config = chartConfig[value as keyof typeof chartConfig]
              return config?.label || value
            }}
          />
          <Bar yAxisId="left" dataKey="responses" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
          <Bar yAxisId="right" dataKey="completionRate" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

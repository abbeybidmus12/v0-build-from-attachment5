"use client"

import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface ResponseRateChartProps {
  data: Array<{
    date: string
    responses: number
  }>
}

export function ResponseRateChart({ data }: ResponseRateChartProps) {
  const chartData = data || []

  const chartConfig = {
    responses: {
      label: "Responses",
      color: "hsl(var(--chart-1))",
    },
  }

  return (
    <ChartContainer config={chartConfig} className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorResponses" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tickFormatter={(value) => {
              if (!value) return ""
              return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })
            }}
            axisLine={false}
            tickLine={false}
            className="text-xs fill-muted-foreground"
          />
          <YAxis axisLine={false} tickLine={false} className="text-xs fill-muted-foreground" />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(value) => {
                  if (!value) return ""
                  return new Date(value).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                }}
                formatter={(value, name) => [value, chartConfig[name as keyof typeof chartConfig]?.label || name]}
              />
            }
          />
          <Area
            type="monotone"
            dataKey="responses"
            stroke="hsl(var(--chart-1))"
            fillOpacity={1}
            fill="url(#colorResponses)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

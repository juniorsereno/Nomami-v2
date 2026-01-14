"use client"

import * as React from "react"
import { Area, Bar, CartesianGrid, ComposedChart, XAxis, YAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

export const description = "An interactive area chart"

const chartConfig = {
  activeSubscribers: {
    label: "Clientes Ativos",
    color: "var(--primary)",
  },
  newSubscribers: {
    label: "Novos Assinantes",
    color: "#613EC2",
  },
  expiredSubscribers: {
    label: "Vencidos",
    color: "#DC2626",
  },
} satisfies ChartConfig

interface HistoricalData {
  date: string;
  active_subscribers: number;
  new_subscribers: number;
  expired_subscribers: number;
}

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("30d")
  const [chartData, setChartData] = React.useState<HistoricalData[]>([]);

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  React.useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        const response = await fetch('/api/metrics/historical');
        if (!response.ok) {
          throw new Error('Failed to fetch historical data');
        }
        const data = await response.json();
        setChartData(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchHistoricalData();
  }, []);

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date)
    const now = new Date();
    let daysToSubtract = 30
    if (timeRange === "7d") {
      daysToSubtract = 7
    }
    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  }).map((item) => ({
    date: item.date,
    activeSubscribers: item.active_subscribers,
    newSubscribers: item.new_subscribers,
    expiredSubscribers: item.expired_subscribers,
  }))

  const maxNewSubscribers = Math.max(...filteredData.map((d) => d.newSubscribers), 0)
  const maxExpiredSubscribers = Math.max(...filteredData.map((d) => d.expiredSubscribers), 0)
  const maxBarValue = Math.max(maxNewSubscribers, maxExpiredSubscribers)

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Crescimento de Clientes</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Total de clientes ativos nos últimos 30 dias
          </span>
          <span className="@[540px]/card:hidden">Últimos 30 dias</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="30d">Últimos 30 dias</ToggleGroupItem>
            <ToggleGroupItem value="7d">Últimos 7 dias</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Últimos 30 dias" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="30d" className="rounded-lg">
                Últimos 30 dias
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Últimos 7 dias
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <ComposedChart data={filteredData}>
            <defs>
              <linearGradient id="fillActiveSubscribers" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-activeSubscribers)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-activeSubscribers)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const [year, month, day] = value.split('-').map(Number);
                const date = new Date(year, month - 1, day)
                return date.toLocaleDateString("pt-BR", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <YAxis yAxisId="left" hide />
            <YAxis
              yAxisId="right"
              orientation="right"
              hide
              domain={[0, maxBarValue + 3]}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    const [year, month, day] = value.split('-').map(Number);
                    const date = new Date(year, month - 1, day);
                    return date.toLocaleDateString("pt-BR", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              yAxisId="left"
              dataKey="activeSubscribers"
              type="natural"
              fill="url(#fillActiveSubscribers)"
              stroke="var(--color-activeSubscribers)"
              stackId="a"
            />
            <Bar
              yAxisId="right"
              dataKey="newSubscribers"
              fill="var(--color-newSubscribers)"
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
            <Bar
              yAxisId="right"
              dataKey="expiredSubscribers"
              fill="var(--color-expiredSubscribers)"
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

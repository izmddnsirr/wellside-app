"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";

const chartConfig = {
  earnings: {
    label: "Earnings",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const dayFormatter = new Intl.DateTimeFormat("en-MY", {
  timeZone: "Asia/Kuala_Lumpur",
  weekday: "short",
});

const currencyFormatter = new Intl.NumberFormat("en-MY", {
  style: "currency",
  currency: "MYR",
  maximumFractionDigits: 0,
});

type WeeklyEarningsChartProps = {
  data: { date: string; earnings: number }[];
};

export function WeeklyEarningsChart({ data }: WeeklyEarningsChartProps) {
  const chartData = data.map((point) => ({
    ...point,
    label: dayFormatter.format(new Date(point.date + "T00:00:00+08:00")),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly earnings</CardTitle>
        <CardDescription>Last 7 days of completed bookings.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-48 w-full">
          <BarChart data={chartData} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <ChartTooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const value = payload[0].value as number;
                return (
                  <div className="rounded-lg border bg-background px-3 py-2 shadow-sm">
                    <p className="text-sm font-semibold">
                      {currencyFormatter.format(value)}
                    </p>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="earnings"
              fill="var(--color-earnings)"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

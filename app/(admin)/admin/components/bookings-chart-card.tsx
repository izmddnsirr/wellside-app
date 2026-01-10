"use client";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
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
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartData = [
  { day: "Mon", bookings: 18 },
  { day: "Tue", bookings: 22 },
  { day: "Wed", bookings: 16 },
  { day: "Thu", bookings: 28 },
  { day: "Fri", bookings: 31 },
  { day: "Sat", bookings: 26 },
  { day: "Sun", bookings: 20 },
];

const chartConfig = {
  bookings: {
    label: "Bookings",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function BookingsChartCard() {
  return (
    <Card className="border-slate-200/70 bg-slate-50/60">
      <CardHeader>
        <CardTitle className="text-slate-900">Bookings trend</CardTitle>
        <CardDescription className="text-slate-600">
          Last 7 days.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[240px] w-full"
        >
          <AreaChart data={chartData} margin={{ left: 12, right: 12 }}>
            <defs>
              <linearGradient id="fillBookings" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-bookings)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--color-bookings)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Area
              dataKey="bookings"
              type="monotone"
              stroke="var(--color-bookings)"
              fill="url(#fillBookings)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

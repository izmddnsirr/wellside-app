"use client";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

const chartConfig = {
  sales: {
    label: "Sales",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

type SalesChartPoint = {
  date: string;
  sales: number;
};

type SalesPeriod = "today" | "week" | "month";

type BookingsChartCardProps = {
  data: Record<"today" | "week", SalesChartPoint[]>;
  monthSeries: Record<string, SalesChartPoint[]>;
  defaultMonth: string;
  availableMonths: string[];
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0,
  }).format(value);

const formatChartDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("en-MY", {
    month: "short",
    day: "2-digit",
    timeZone: "Asia/Kuala_Lumpur",
  });
};

const periodOptions: { value: SalesPeriod; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "Last 7 days" },
  { value: "month", label: "Month" },
];

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const formatMonthLabel = (value: string) => {
  const [year, month] = value.split("-").map(Number);
  if (!year || !month) {
    return "Pick month";
  }
  return new Intl.DateTimeFormat("en-MY", {
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kuala_Lumpur",
  }).format(new Date(year, month - 1, 1));
};

export function BookingsChartCard({
  data,
  monthSeries,
  defaultMonth,
  availableMonths,
}: BookingsChartCardProps) {
  const [period, setPeriod] = useState<SalesPeriod>("month");
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [monthPickerYear, setMonthPickerYear] = useState(() => {
    const yearValue = Number(defaultMonth.split("-")[0]);
    return yearValue || new Date().getFullYear();
  });
  const availableMonthsSet = useMemo(
    () => new Set(availableMonths),
    [availableMonths]
  );
  const chartData =
    period === "month" ? monthSeries[selectedMonth] ?? [] : data[period];
  const hasSales = useMemo(
    () => chartData.some((point) => point.sales > 0),
    [chartData]
  );
  const description =
    period === "today"
      ? "Showing paid ticket sales for today."
      : period === "week"
      ? "Showing paid ticket sales for the last 7 days."
      : `Showing paid ticket sales for ${formatMonthLabel(selectedMonth)}.`;

  return (
    <Card className="border-border/60 bg-card pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b border-border/60 py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle className="text-foreground">Ticket sales trend</CardTitle>
          <CardDescription className="text-muted-foreground">
            {description}
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          {period === "month" ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-9 min-w-[180px] justify-between bg-background"
                >
                  {formatMonthLabel(selectedMonth)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[260px] p-3" align="end">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMonthPickerYear((prev) => prev - 1)}
                    aria-label="Previous year"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <div className="text-sm font-semibold">{monthPickerYear}</div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMonthPickerYear((prev) => prev + 1)}
                    aria-label="Next year"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {MONTH_LABELS.map((label, index) => {
                    const value = `${monthPickerYear}-${String(
                      index + 1
                    ).padStart(2, "0")}`;
                    const isActive = selectedMonth === value;
                    const isAvailable = availableMonthsSet.has(value);
                    return (
                      <Button
                        key={label}
                        variant={isActive ? "default" : "ghost"}
                        size="sm"
                        className="h-8"
                        disabled={!isAvailable}
                        onClick={() => setSelectedMonth(value)}
                      >
                        {label}
                      </Button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          ) : null}
          <Select
            value={period}
            onValueChange={(value) => setPeriod(value as SalesPeriod)}
          >
            <SelectTrigger
              className="w-[160px] rounded-lg bg-background"
              aria-label="Select period"
            >
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent className="rounded-xl" align="end">
              {periodOptions.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="rounded-lg"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {chartData.length === 0 || !hasSales ? (
          <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
            No sales data yet for this period.
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-sales)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-sales)"
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
                minTickGap={24}
                tickFormatter={formatChartDate}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    labelFormatter={(value) => formatChartDate(String(value))}
                    formatter={(value) => (
                      <span className="font-medium text-foreground">
                        {formatCurrency(Number(value))}
                      </span>
                    )}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Area
                dataKey="sales"
                type="monotone"
                stroke="var(--color-sales)"
                fill="url(#fillSales)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

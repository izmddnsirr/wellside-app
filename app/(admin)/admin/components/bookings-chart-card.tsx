"use client";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts";
import type { TooltipProps } from "recharts";
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
  totalTicket: number;
  totalCash: number;
  totalEwallet: number;
};

type SalesPeriod = "week" | "month" | "year";

type BookingsChartCardProps = {
  data: Record<"week", SalesChartPoint[]>;
  monthSeries: Record<string, SalesChartPoint[]>;
  yearSeries: Record<string, SalesChartPoint[]>;
  defaultMonth: string;
  dataMonths: string[];
  availableYears: number[];
  dataYears: number[];
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0,
  }).format(value);

const periodOptions: { value: SalesPeriod; label: string }[] = [
  { value: "week", label: "Last 7 days" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
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

const formatChartDate = (value: string, period: SalesPeriod) => {
  if (period === "year") {
    const [year, month] = value.split("-").map(Number);
    if (!year || !month) {
      return value;
    }
    return new Intl.DateTimeFormat("en-MY", {
      month: "short",
      timeZone: "Asia/Kuala_Lumpur",
    }).format(new Date(year, month - 1, 1));
  }
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

const formatChartLabel = (value: string, period: SalesPeriod) => {
  if (period === "year") {
    const [year, month] = value.split("-").map(Number);
    if (!year || !month) {
      return value;
    }
    return new Intl.DateTimeFormat("en-MY", {
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kuala_Lumpur",
    }).format(new Date(year, month - 1, 1));
  }
  return formatChartDate(value, period);
};

const formatDayAndDate = (value: string, period: SalesPeriod) => {
  if (period === "year") {
    return formatChartLabel(value, period);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-MY", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kuala_Lumpur",
  });
};

export function BookingsChartCard({
  data,
  monthSeries,
  yearSeries,
  defaultMonth,
  dataMonths,
  availableYears,
  dataYears,
}: BookingsChartCardProps) {
  const [period, setPeriod] = useState<SalesPeriod>("month");
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [selectedYear, setSelectedYear] = useState(() => {
    const latestDataYear = dataYears[dataYears.length - 1];
    const latestYear = availableYears[availableYears.length - 1];
    const fallback = latestDataYear ?? latestYear;
    return fallback ? String(fallback) : String(new Date().getFullYear());
  });
  const [yearPickerIndex, setYearPickerIndex] = useState(0);
  const [monthPickerYear, setMonthPickerYear] = useState(() => {
    const yearValue = Number(defaultMonth.split("-")[0]);
    return yearValue || new Date().getFullYear();
  });
  const monthsForYear = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => {
        const monthValue = String(index + 1).padStart(2, "0");
        return {
          value: `${monthPickerYear}-${monthValue}`,
          month: index + 1,
        };
      }),
    [monthPickerYear],
  );
  const dataMonthsSet = useMemo(() => new Set(dataMonths), [dataMonths]);
  const dataYearsSet = useMemo(() => new Set(dataYears), [dataYears]);
  const yearsSorted = useMemo(
    () => [...availableYears].sort((a, b) => a - b),
    [availableYears],
  );
  const yearsPerPage = 12;
  const maxYearPage = Math.max(
    0,
    Math.ceil(yearsSorted.length / yearsPerPage) - 1,
  );
  const yearPageStart = yearPickerIndex * yearsPerPage;
  const yearsPage = yearsSorted.slice(
    yearPageStart,
    yearPageStart + yearsPerPage,
  );
  const chartData = useMemo(() => {
    if (period === "month") {
      return monthSeries[selectedMonth] ?? [];
    }
    if (period === "year") {
      return yearSeries[selectedYear] ?? [];
    }
    return data[period];
  }, [data, monthSeries, period, selectedMonth, selectedYear, yearSeries]);
  const hasSales = useMemo(
    () => chartData.some((point) => point.sales > 0),
    [chartData],
  );
  const description =
    period === "week"
      ? "Showing paid ticket sales for the last 7 days."
      : period === "month"
        ? `Showing paid ticket sales for ${formatMonthLabel(selectedMonth)}.`
        : `Showing paid ticket sales for ${selectedYear}.`;

  const renderTooltipContent = ({
    active,
    payload,
  }: TooltipProps<number, string>) => {
    if (!active || !payload?.length) {
      return null;
    }

    const point = payload[0]?.payload as SalesChartPoint | undefined;
    if (!point) {
      return null;
    }

    return (
      <div className="grid min-w-48 gap-1.5 rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
        <div className="font-medium text-foreground">
          {formatDayAndDate(point.date, period)}
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Total Tickets</span>
          <span className="font-medium text-foreground tabular-nums">
            {point.totalTicket}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Total Cash Sales</span>
          <span className="font-medium text-foreground tabular-nums">
            {formatCurrency(point.totalCash)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Total E-Wallet Sales</span>
          <span className="font-medium text-foreground tabular-nums">
            {formatCurrency(point.totalEwallet)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Total Sales</span>
          <span className="font-medium text-foreground tabular-nums">
            {formatCurrency(point.sales)}
          </span>
        </div>
      </div>
    );
  };

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
                  className="h-9 min-w-45 justify-between rounded-lg bg-background"
                >
                  {formatMonthLabel(selectedMonth)}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                id="bookings-month-popover"
                className="w-65 p-3"
                align="end"
              >
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
                  {monthsForYear.map(({ value, month }) => {
                    const label = MONTH_LABELS[month - 1] ?? value;
                    const isActive = selectedMonth === value;
                    const isDisabled = !dataMonthsSet.has(value);
                    return (
                      <Button
                        key={value}
                        variant={isActive ? "default" : "ghost"}
                        size="sm"
                        className="h-8"
                        disabled={isDisabled}
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
          {period === "year" ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-9 min-w-30 justify-between bg-background"
                >
                  {selectedYear}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                id="bookings-year-popover"
                className="w-65 p-3"
                align="end"
              >
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setYearPickerIndex((prev) => Math.max(0, prev - 1))
                    }
                    disabled={yearPickerIndex === 0}
                    aria-label="Previous years"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <div className="text-sm font-semibold text-foreground">
                    {yearsSorted.length === 0 ? "No years" : "Select year"}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setYearPickerIndex((prev) =>
                        Math.min(maxYearPage, prev + 1),
                      )
                    }
                    disabled={yearPickerIndex >= maxYearPage}
                    aria-label="Next years"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {yearsPage.map((yearValue) => {
                    const isActive = selectedYear === String(yearValue);
                    const isDisabled = !dataYearsSet.has(yearValue);
                    return (
                      <Button
                        key={yearValue}
                        variant={isActive ? "default" : "ghost"}
                        size="sm"
                        className="h-8"
                        disabled={isDisabled}
                        onClick={() => setSelectedYear(String(yearValue))}
                      >
                        {yearValue}
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
              className="w-40 rounded-lg bg-background"
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
          <div className="flex h-62.5 items-center justify-center text-sm text-muted-foreground">
            No sales data yet for this period.
          </div>
        ) : (
          <ChartContainer
            id="bookings-sales-chart"
            config={chartConfig}
            className="aspect-auto h-62.5 w-full"
          >
            <BarChart data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={24}
                tickFormatter={(value) =>
                  formatChartDate(String(value), period)
                }
              />
              <ChartTooltip cursor={false} content={renderTooltipContent} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="sales"
                fill="var(--color-sales)"
                radius={[5, 5, 5, 5]}
              >
                <LabelList
                  dataKey="sales"
                  position="top"
                  className="fill-muted-foreground text-[11px]"
                  formatter={(value: number) =>
                    Number(value) > 0
                      ? Number(value).toLocaleString("en-MY")
                      : ""
                  }
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

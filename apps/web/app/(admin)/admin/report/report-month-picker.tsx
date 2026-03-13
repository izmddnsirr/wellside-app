"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kuala_Lumpur",
  }).format(new Date(year, month - 1, 1));
};

type ReportMonthPickerProps = {
  selectedMonth: string;
  dataMonths: string[];
  className?: string;
};

export function ReportMonthPicker({
  selectedMonth,
  dataMonths,
  className,
}: ReportMonthPickerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => {
    const year = Number(selectedMonth.split("-")[0]);
    return year || new Date().getFullYear();
  });
  const dataMonthsSet = useMemo(() => new Set(dataMonths), [dataMonths]);

  const monthsForYear = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => {
        const month = index + 1;
        return {
          month,
          value: `${pickerYear}-${String(month).padStart(2, "0")}`,
        };
      }),
    [pickerYear],
  );

  const handleSelectMonth = (value: string) => {
    if (!dataMonthsSet.has(value) && value !== selectedMonth) {
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", value);
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-9 justify-between rounded-lg bg-background text-sm",
            className,
          )}
        >
          {formatMonthLabel(selectedMonth)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-65 p-3" align="end">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPickerYear((prev) => prev - 1)}
            aria-label="Previous year"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <div className="text-sm font-semibold">{pickerYear}</div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPickerYear((prev) => prev + 1)}
            aria-label="Next year"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {monthsForYear.map(({ month, value }) => {
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
                onClick={() => handleSelectMonth(value)}
              >
                {label}
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

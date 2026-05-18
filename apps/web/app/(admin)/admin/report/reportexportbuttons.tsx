"use client";

import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Printer } from "lucide-react";

type DailyRow = {
  date: string;
  dayLabel: string;
  bookings: number;
  paidTickets: number;
  sales: number;
};

type WeeklyRow = {
  weekLabel: string;
  bookings: number;
  paidTickets: number;
  sales: number;
};

type BarberRow = {
  name: string;
  paidTickets: number;
  sales: number;
};

type ServiceRow = {
  name: string;
  qty: number;
  sales: number;
};

type ProductRow = {
  name: string;
  qty: number;
  sales: number;
};

type SummaryCard = {
  label: string;
  value: string;
  delta: string;
};

type ReportExportButtonsProps = {
  monthHeading: string;
  selectedMonthValue: string;
  dailyRows: DailyRow[];
  weeklyRows: WeeklyRow[];
  topBarbers: BarberRow[];
  topServices: ServiceRow[];
  topProducts: ProductRow[];
  summaryCards: SummaryCard[];
};

const formatMYR = (value: number) =>
  new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0,
  }).format(value);

const avgTicket = (sales: number, tickets: number) =>
  tickets > 0 ? sales / tickets : 0;

export function ReportExportButtons({
  monthHeading,
  selectedMonthValue,
  dailyRows,
  weeklyRows,
  topBarbers,
  topServices,
  topProducts,
  summaryCards,
}: ReportExportButtonsProps) {
  const handleExcelExport = async () => {
    const XLSX = await import("xlsx");

    const wb = XLSX.utils.book_new();

    // ── Sheet 1: Daily ────────────────────────────────────────────
    const dailyData = [
      ["Wellside Barbershop — Sales Report", "", "", "", ""],
      [`Month: ${monthHeading}`, "", "", "", ""],
      ["", "", "", "", ""],
      ["Date", "Bookings", "Paid Tickets", "Sales (MYR)", "Avg Ticket (MYR)"],
      ...dailyRows.map((row) => [
        row.dayLabel,
        row.bookings,
        row.paidTickets,
        row.sales,
        avgTicket(row.sales, row.paidTickets),
      ]),
      ["", "", "", "", ""],
      [
        "TOTAL",
        dailyRows.reduce((s, r) => s + r.bookings, 0),
        dailyRows.reduce((s, r) => s + r.paidTickets, 0),
        dailyRows.reduce((s, r) => s + r.sales, 0),
        avgTicket(
          dailyRows.reduce((s, r) => s + r.sales, 0),
          dailyRows.reduce((s, r) => s + r.paidTickets, 0),
        ),
      ],
    ];

    const wsDaily = XLSX.utils.aoa_to_sheet(dailyData);

    wsDaily["!cols"] = [
      { wch: 20 },
      { wch: 12 },
      { wch: 14 },
      { wch: 16 },
      { wch: 18 },
    ];

    XLSX.utils.book_append_sheet(wb, wsDaily, "Daily");

    // ── Sheet 2: Weekly ───────────────────────────────────────────
    const weeklyData = [
      ["Wellside Barbershop — Sales Report", "", "", "", ""],
      [`Month: ${monthHeading}`, "", "", "", ""],
      ["", "", "", "", ""],
      ["Week", "Bookings", "Paid Tickets", "Sales (MYR)", "Avg Ticket (MYR)"],
      ...weeklyRows.map((row) => [
        row.weekLabel,
        row.bookings,
        row.paidTickets,
        row.sales,
        avgTicket(row.sales, row.paidTickets),
      ]),
    ];

    const wsWeekly = XLSX.utils.aoa_to_sheet(weeklyData);

    wsWeekly["!cols"] = [
      { wch: 32 },
      { wch: 12 },
      { wch: 14 },
      { wch: 16 },
      { wch: 18 },
    ];

    XLSX.utils.book_append_sheet(wb, wsWeekly, "Weekly");

    // ── Sheet 3: Monthly ──────────────────────────────────────────
    const monthlyData: (string | number)[][] = [
      ["Wellside Barbershop — Sales Report", "", ""],
      [`Month: ${monthHeading}`, "", ""],
      ["", "", ""],
      ["=== SUMMARY ===", "", ""],
      ["Metric", "Value", "vs Prev Month"],
      ...summaryCards.map((c) => [c.label, c.value, c.delta]),
      ["", "", ""],
      ["=== TOP BARBERS ===", "", ""],
      ["Barber", "Paid Tickets", "Sales (MYR)"],
      ...topBarbers.map((r) => [r.name, r.paidTickets, r.sales]),
      ["", "", ""],
      ["=== TOP SERVICES ===", "", ""],
      ["Service", "Units Sold", "Sales (MYR)"],
      ...topServices.map((r) => [r.name, r.qty, r.sales]),
      ["", "", ""],
      ["=== TOP PRODUCTS ===", "", ""],
      ["Product", "Units Sold", "Sales (MYR)"],
      ...topProducts.map((r) => [r.name, r.qty, r.sales]),
    ];

    const wsMonthly = XLSX.utils.aoa_to_sheet(monthlyData);

    wsMonthly["!cols"] = [{ wch: 28 }, { wch: 16 }, { wch: 20 }];

    XLSX.utils.book_append_sheet(wb, wsMonthly, "Monthly");

    XLSX.writeFile(wb, `wellside-report-${selectedMonthValue}.xlsx`);
  };

  const handlePdfExport = () => {
    window.print();
  };

  return (
    <div className="flex gap-2 print-hide">
      <Button
        variant="outline"
        size="sm"
        className="h-9 gap-2"
        onClick={handleExcelExport}
      >
        <FileSpreadsheet className="h-4 w-4" />
        Export Excel
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-9 gap-2"
        onClick={handlePdfExport}
      >
        <Printer className="h-4 w-4" />
        Export PDF
      </Button>
    </div>
  );
}

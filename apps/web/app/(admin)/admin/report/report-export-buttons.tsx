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
    const toMYR = (v: number) =>
      new Intl.NumberFormat("en-MY", {
        style: "currency",
        currency: "MYR",
        maximumFractionDigits: 0,
      }).format(v);

    const avg = (sales: number, tickets: number) =>
      tickets > 0 ? sales / tickets : 0;

    const totalBookings = dailyRows.reduce((s, r) => s + r.bookings, 0);
    const totalTickets = dailyRows.reduce((s, r) => s + r.paidTickets, 0);
    const totalSales = dailyRows.reduce((s, r) => s + r.sales, 0);

    const footer = () =>
      `<div class="footer">
        <span>Wellside Barbershop &nbsp;·&nbsp; 24, Jalan Palas 5, Taman Teratai, 81300 Skudai, Johor</span>
        <span>No. Pendaftaran: 202503039267 (PG0566885-D)</span>
      </div>`;

    const header = (page: number) =>
      `<div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1.5px solid #111;padding-bottom:6px;margin-bottom:12px;">
        <img src="${window.location.origin}/wellside-logo.png" style="height:28px;width:auto;" alt="Wellside"/>
        <div style="text-align:right;">
          <div style="font-size:15px;font-weight:700;">Sales Report</div>
          <div style="font-size:10px;color:#555;margin-top:2px;">${monthHeading} &nbsp;·&nbsp; Page ${page} of 2</div>
        </div>
      </div>`;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Wellside Report — ${monthHeading}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous"/>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet"/>
  <style>
    @page { size: A4 portrait; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #111; background: white; }
    .page {
      width: 210mm;
      height: 297mm;
      padding: 12mm 14mm;
      display: flex;
      flex-direction: column;
      page-break-after: always;
      overflow: hidden;
    }
    .page:last-child { page-break-after: auto; }
    .grow { flex: 1; display: flex; flex-direction: column; }
    table { width: 100%; border-collapse: collapse; table-layout: auto; }
    th:first-child, td:first-child { min-width: 80px; }
    thead th { padding:4px 8px; text-align:left; font-size:8px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:#111; border-bottom:1px solid #ccc; background:#f5f5f5; }
    thead th.r { text-align:left; }
    tbody td { padding:4px 8px; font-size:10px; border-bottom:1px solid #eee; }
    tbody td.r { text-align:left; }
    tbody td.bold { font-weight:700; border-bottom:none; border-top:1.5px solid #bbb; background:#f5f5f5; }
    tbody tr:last-child td { border-bottom: none; }
    .block { border:1px solid #ddd; margin-bottom:10px; }
    .block:last-child { margin-bottom:0; }
    .block-title { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:#fff !important; background:#111 !important; padding:5px 8px; border-bottom:1px solid #111; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .weekly-table { table-layout:fixed; }
    .weekly-label { width:44%; }
    .weekly-bookings, .weekly-tickets, .weekly-sales, .weekly-avg { width:14%; }
    .page-fill-block { flex:1; display:flex; flex-direction:column; }
    .page-fill-table { flex:1; height:100%; }
    .ranking-table { table-layout:fixed; }
    .ranking-name { width:72%; }
    .ranking-count { width:14%; }
    .ranking-sales { width:14%; }
    .grid3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; }
    .fill { flex:1; display:flex; flex-direction:column; }
    .fill .block { flex:1; display:flex; flex-direction:column; }
    .fill .block table { flex:1; }
    .footer { margin-top:auto; padding-top:8px; font-size:7.5px; color:#777; display:flex; justify-content:space-between; }
  </style>
</head>
<body>

  <!-- PAGE 1: Summary + Daily -->
  <div class="page">
    ${header(1)}
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6px;margin-bottom:12px;">
      ${summaryCards.map(c => `
        <div style="border:1px solid #ddd;padding:7px 8px;">
          <div style="font-size:8px;text-transform:uppercase;letter-spacing:.06em;color:#777;margin-bottom:4px;">${c.label}</div>
          <div style="font-size:16px;font-weight:700;">${c.value}</div>
          <div style="font-size:8px;color:#666;margin-top:3px;">${c.delta}</div>
        </div>`).join("")}
    </div>
    <div class="grow">
      <div class="block page-fill-block">
        <div class="block-title">Daily Breakdown</div>
        <table class="weekly-table page-fill-table">
          <colgroup>
            <col class="weekly-label"/>
            <col class="weekly-bookings"/>
            <col class="weekly-tickets"/>
            <col class="weekly-sales"/>
            <col class="weekly-avg"/>
          </colgroup>
          <thead><tr>
            <th>Date</th>
            <th class="r">Bookings</th>
            <th class="r">Tickets</th>
            <th class="r">Avg (MYR)</th>
            <th class="r">Sales (MYR)</th>
          </tr></thead>
          <tbody>
            ${dailyRows.map(r => `<tr>
              <td>${r.dayLabel}</td>
              <td class="r">${r.bookings}</td>
              <td class="r">${r.paidTickets}</td>
              <td class="r">${toMYR(avg(r.sales, r.paidTickets))}</td>
              <td class="r">${toMYR(r.sales)}</td>
            </tr>`).join("")}
            <tr>
              <td class="bold">Total</td>
              <td class="bold r">${totalBookings}</td>
              <td class="bold r">${totalTickets}</td>
              <td class="bold r">${toMYR(avg(totalSales, totalTickets))}</td>
              <td class="bold r">${toMYR(totalSales)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    ${footer()}
  </div>

  <!-- PAGE 2: Weekly + Barbers/Services/Products -->
  <div class="page">
    ${header(2)}
    <div class="grow">
      <div class="block">
        <div class="block-title">Weekly Summary</div>
        <table class="weekly-table">
          <colgroup>
            <col class="weekly-label"/>
            <col class="weekly-bookings"/>
            <col class="weekly-tickets"/>
            <col class="weekly-sales"/>
            <col class="weekly-avg"/>
          </colgroup>
          <thead><tr>
            <th>Week</th>
            <th class="r">Bookings</th>
            <th class="r">Tickets</th>
            <th class="r">Sales (MYR)</th>
            <th class="r">Avg (MYR)</th>
          </tr></thead>
          <tbody>
            ${weeklyRows.map(r => `<tr>
              <td>${r.weekLabel}</td>
              <td class="r">${r.bookings}</td>
              <td class="r">${r.paidTickets}</td>
              <td class="r">${toMYR(r.sales)}</td>
              <td class="r">${toMYR(avg(r.sales, r.paidTickets))}</td>
            </tr>`).join("")}
          </tbody>
        </table>
      </div>
      <div class="block">
          <div class="block-title">Top Barbers</div>
          <table class="ranking-table">
            <colgroup>
              <col class="ranking-name"/>
              <col class="ranking-count"/>
              <col class="ranking-sales"/>
            </colgroup>
            <thead><tr><th>Barber</th><th class="r">Tickets</th><th class="r">Sales (MYR)</th></tr></thead>
            <tbody>
              ${topBarbers.length > 0
                ? topBarbers.map(r => `<tr><td>${r.name}</td><td class="r">${r.paidTickets}</td><td class="r">${toMYR(r.sales)}</td></tr>`).join("")
                : `<tr><td colspan="3" style="color:#999;">No data</td></tr>`}
            </tbody>
          </table>
        </div>
        <div class="block">
          <div class="block-title">Top Services</div>
          <table class="ranking-table">
            <colgroup>
              <col class="ranking-name"/>
              <col class="ranking-count"/>
              <col class="ranking-sales"/>
            </colgroup>
            <thead><tr><th>Service</th><th class="r">Units</th><th class="r">Sales (MYR)</th></tr></thead>
            <tbody>
              ${topServices.length > 0
                ? topServices.map(r => `<tr><td>${r.name}</td><td class="r">${r.qty}</td><td class="r">${toMYR(r.sales)}</td></tr>`).join("")
                : `<tr><td colspan="3" style="color:#999;">No data</td></tr>`}
            </tbody>
          </table>
        </div>
        <div class="block">
          <div class="block-title">Top Products</div>
          <table class="ranking-table">
            <colgroup>
              <col class="ranking-name"/>
              <col class="ranking-count"/>
              <col class="ranking-sales"/>
            </colgroup>
            <thead><tr><th>Product</th><th class="r">Units</th><th class="r">Sales (MYR)</th></tr></thead>
            <tbody>
              ${topProducts.length > 0
                ? topProducts.map(r => `<tr><td>${r.name}</td><td class="r">${r.qty}</td><td class="r">${toMYR(r.sales)}</td></tr>`).join("")
                : `<tr><td colspan="3" style="color:#999;">No data</td></tr>`}
            </tbody>
          </table>
        </div>
    </div>
    ${footer()}
  </div>

</body>
</html>`;

    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:0;left:0;width:0;height:0;border:none;visibility:hidden;";
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
      }, 800);
    };
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

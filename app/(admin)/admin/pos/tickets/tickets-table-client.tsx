"use client";

import dynamic from "next/dynamic";
import type { TicketRow } from "./tickets-table";

const TicketsTable = dynamic(
  () => import("./tickets-table").then((mod) => mod.TicketsTable),
  { ssr: false }
);

type TicketsTableClientProps = {
  tickets: TicketRow[];
};

export function TicketsTableClient({ tickets }: TicketsTableClientProps) {
  return <TicketsTable tickets={tickets} />;
}

"use client";

import type { TicketRow } from "./tickets-table";
import { TicketsTable } from "./tickets-table";

type TicketsTableClientProps = {
  tickets: TicketRow[];
};

export function TicketsTableClient({ tickets }: TicketsTableClientProps) {
  return <TicketsTable tickets={tickets} />;
}

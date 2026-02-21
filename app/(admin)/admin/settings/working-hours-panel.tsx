"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { createAdminClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";

type Barber = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  working_start_time: string | null;
  working_end_time: string | null;
  is_active: boolean | null;
};

type LoadState = {
  status: "idle" | "loading" | "loaded" | "error";
  data: Barber[];
  error: string | null;
};
const DAYS = [
  { key: "monday", label: "Monday", enabled: true },
  { key: "tuesday", label: "Tuesday", enabled: true },
  { key: "wednesday", label: "Wednesday", enabled: true },
  { key: "thursday", label: "Thursday", enabled: true },
  { key: "friday", label: "Friday", enabled: true },
  { key: "saturday", label: "Saturday", enabled: true },
  { key: "sunday", label: "Sunday", enabled: false },
];

const getBarberName = (barber: Barber) => {
  if (barber.display_name) {
    return barber.display_name;
  }
  const name = [barber.first_name, barber.last_name].filter(Boolean).join(" ");
  return name.length > 0 ? name : "Unnamed barber";
};

export function WorkingHoursPanel() {
  const [openByDay, setOpenByDay] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(DAYS.map((day) => [day.key, false]))
  );
  const [enabledByDay, setEnabledByDay] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(DAYS.map((day) => [day.key, day.enabled]))
  );
  const [barbersByDay, setBarbersByDay] = useState<Record<string, LoadState>>(() =>
    Object.fromEntries(
      DAYS.map((day) => [day.key, { status: "idle", data: [], error: null }])
    )
  );

  const loadBarbers = async (dayKey: string) => {
    setBarbersByDay((prev) => ({
      ...prev,
      [dayKey]: { status: "loading", data: prev[dayKey]?.data ?? [], error: null },
    }));
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, first_name, last_name, display_name, working_start_time, working_end_time, is_active"
      )
      .eq("role", "barber")
      .order("created_at", { ascending: false });

    if (error) {
      setBarbersByDay((prev) => ({
        ...prev,
        [dayKey]: {
          status: "error",
          data: prev[dayKey]?.data ?? [],
          error: "Failed to load barbers. Please try again.",
        },
      }));
      return;
    }

    setBarbersByDay((prev) => ({
      ...prev,
      [dayKey]: { status: "loaded", data: data ?? [], error: null },
    }));
  };

  const handleOpenChange = (dayKey: string, nextOpen: boolean) => {
    setOpenByDay((prev) => ({ ...prev, [dayKey]: nextOpen }));
    if (nextOpen && barbersByDay[dayKey]?.status === "idle") {
      void loadBarbers(dayKey);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>Working Hours</CardTitle>
            <CardDescription>Weekly Operating Hours</CardDescription>
          </div>
          <Button type="button" className="shrink-0">
            Save
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {DAYS.map((day) => {
            const isOpen = openByDay[day.key];
            const isEnabled = enabledByDay[day.key];
            const state = barbersByDay[day.key];
            const barbersList = state?.data ?? [];
            return (
              <Collapsible
                key={day.key}
                open={isOpen}
                onOpenChange={(nextOpen) => handleOpenChange(day.key, nextOpen)}
              >
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/60 bg-background/60 px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{day.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {isEnabled ? "Open for bookings" : "Closed"}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-wrap items-center justify-end gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`working-${day.key}`}
                        checked={isEnabled}
                        onCheckedChange={(checked) =>
                          setEnabledByDay((prev) => ({ ...prev, [day.key]: checked }))
                        }
                        aria-label={`${day.label} working hours`}
                      />
                    </div>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-2" aria-label="Toggle details">
                        <ChevronDown
                          className={cn("size-4 transition-transform", isOpen && "rotate-180")}
                        />
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </div>

                <CollapsibleContent className="mt-3">
                  <div className="rounded-lg border bg-muted/30">
                    {barbersList.length > 0 ? (
                      <Table>
                        <TableBody>
                          {barbersList.map((barber) => (
                            <TableRow key={barber.id} className="align-top">
                              <TableCell className="w-52 py-4 font-medium">
                                {getBarberName(barber)}
                              </TableCell>
                              <TableCell className="w-28 py-4">
                                <Badge variant={barber.is_active ? "default" : "secondary"}>
                                  {barber.is_active ? "Active" : "Inactive"}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-4">
                                <div className="flex flex-wrap items-start gap-6">
                                  <div className="space-y-1">
                                    <Label
                                      htmlFor={`barber-${day.key}-${barber.id}-working-start-time`}
                                      className="text-[11px] uppercase tracking-wide text-muted-foreground"
                                    >
                                      Working start time
                                    </Label>
                                    <Input
                                      id={`barber-${day.key}-${barber.id}-working-start-time`}
                                      name="working_start_time"
                                      type="time"
                                      className="h-9 w-36 text-sm"
                                      defaultValue={barber.working_start_time ?? ""}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label
                                      htmlFor={`barber-${day.key}-${barber.id}-working-end-time`}
                                      className="text-[11px] uppercase tracking-wide text-muted-foreground"
                                    >
                                      Working end time
                                    </Label>
                                    <Input
                                      id={`barber-${day.key}-${barber.id}-working-end-time`}
                                      name="working_end_time"
                                      type="time"
                                      className="h-9 w-36 text-sm"
                                      defaultValue={barber.working_end_time ?? ""}
                                    />
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : null}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

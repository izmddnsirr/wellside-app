import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { TemporaryClosure, WeeklySchedule } from "@/utils/shop-operations";
import { WEEKDAY_KEYS } from "@/utils/shop-operations";
import {
  addTemporaryClosure,
  deleteTemporaryClosure,
  saveWeeklySchedule,
} from "./actions";

const WEEKDAY_LABELS: Record<(typeof WEEKDAY_KEYS)[number], string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

type OperationsSettingsPanelProps = {
  weeklySchedule: WeeklySchedule;
  temporaryClosures: TemporaryClosure[];
};

const formatDateLabel = (value: string) =>
  new Intl.DateTimeFormat("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00+08:00`));

export function OperationsSettingsPanel({
  weeklySchedule,
  temporaryClosures,
}: OperationsSettingsPanelProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
          <CardDescription>
            Set fixed open/closed days for the whole shop.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={saveWeeklySchedule} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {WEEKDAY_KEYS.map((weekday) => (
                <Label
                  key={weekday}
                  htmlFor={`weekday-${weekday}`}
                  className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2"
                >
                  <Checkbox
                    id={`weekday-${weekday}`}
                    name={weekday}
                    defaultChecked={weeklySchedule[weekday]}
                  />
                  <span className="text-sm">{WEEKDAY_LABELS[weekday]}</span>
                </Label>
              ))}
            </div>
            <div className="flex justify-end">
              <Button type="submit">Save weekly schedule</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Temporary Closures</CardTitle>
          <CardDescription>
            Add date-range closures (Raya, renovation, public holiday, etc).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            action={addTemporaryClosure}
            className="grid gap-3 lg:grid-cols-[1fr_1fr_2fr_auto] lg:items-end"
          >
            <div className="space-y-1">
              <Label htmlFor="closure-start">Start date</Label>
              <Input
                id="closure-start"
                name="start_date"
                type="date"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="closure-end">End date</Label>
              <Input id="closure-end" name="end_date" type="date" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="closure-reason">Reason (optional)</Label>
              <Input
                id="closure-reason"
                name="reason"
                placeholder="Cuti Raya"
              />
            </div>
            <Button type="submit">Add closure</Button>
          </form>

          <Separator />

          {temporaryClosures.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No temporary closure set.
            </p>
          ) : (
            <div className="space-y-2">
              {temporaryClosures.map((closure) => (
                <div
                  key={closure.id}
                  className="flex flex-col gap-2 rounded-lg border border-border/60 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {formatDateLabel(closure.start_date)} -{" "}
                      {formatDateLabel(closure.end_date)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {closure.reason || "No reason"}
                    </p>
                  </div>
                  <form action={deleteTemporaryClosure}>
                    <input type="hidden" name="closure_id" value={closure.id} />
                    <Button type="submit" variant="outline" size="sm">
                      Remove
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

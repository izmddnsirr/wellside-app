"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Plus, Search, UserX } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createAdminClient } from "@/utils/supabase/client";

type Barber = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  is_active: boolean | null;
  created_at: string | null;
  working_start_time: string | null;
  working_end_time: string | null;
  barber_level: string | null;
};

type BarbersCardProps = {
  barbers: Barber[];
  errorMessage?: string | null;
};

const formatDate = (value: string | null) => {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleDateString("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export function BarbersCard({ barbers, errorMessage }: BarbersCardProps) {
  const [query, setQuery] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedBarberLevel, setSelectedBarberLevel] = useState<string>("");
  const [updateError, setUpdateError] = useState<string | null>(null);
  const router = useRouter();
  const filteredBarbers = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return barbers;
    }
    return barbers.filter((barber) => {
      const name = [barber.first_name, barber.last_name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return (
        name.includes(trimmed) ||
        barber.email?.toLowerCase().includes(trimmed) ||
        barber.phone?.toLowerCase().includes(trimmed)
      );
    });
  }, [barbers, query]);

  const openUpdateDialog = (barber: Barber) => {
    setSelectedBarber(barber);
    setSelectedBarberLevel(barber.barber_level ?? "");
    setIsUpdateOpen(true);
  };

  const closeUpdateDialog = () => {
    setIsUpdateOpen(false);
    setSelectedBarber(null);
    setSelectedBarberLevel("");
    setUpdateError(null);
  };

  const normalizeValue = (value: FormDataEntryValue | null) => {
    if (value === null) {
      return null;
    }
    const text = String(value).trim();
    return text.length > 0 ? text : null;
  };

  const handleUpdateSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUpdateError(null);

    if (!selectedBarber) {
      setUpdateError("No barber selected.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const payload = {
      first_name: normalizeValue(formData.get("first_name")),
      last_name: normalizeValue(formData.get("last_name")),
      email: normalizeValue(formData.get("email")),
      phone: normalizeValue(formData.get("phone")),
      working_start_time: normalizeValue(formData.get("working_start_time")),
      working_end_time: normalizeValue(formData.get("working_end_time")),
      barber_level: selectedBarberLevel || null,
    };

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", selectedBarber.id);

    if (error) {
      setUpdateError("Failed to update barber. Please try again.");
      return;
    }

    closeUpdateDialog();
    router.refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Barber directory</CardTitle>
        <CardDescription>Track staff profiles and contact details.</CardDescription>
        <CardAction>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="barber-search"
                placeholder="Search barbers"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-56 pl-9"
              />
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus />
                  Add barber
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add barber</DialogTitle>
                  <DialogDescription>
                    Create a barber profile and invite them later.
                  </DialogDescription>
                </DialogHeader>
                <form className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="barber-first-name">First name</Label>
                      <Input
                        id="barber-first-name"
                        name="first_name"
                        placeholder="Haziq"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="barber-last-name">Last name</Label>
                      <Input
                        id="barber-last-name"
                        name="last_name"
                        placeholder="Azman"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="barber-email">Email</Label>
                    <Input
                      id="barber-email"
                      name="email"
                      type="email"
                      placeholder="haziq@wellside.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="barber-phone">Phone</Label>
                    <Input
                      id="barber-phone"
                      name="phone"
                      placeholder="+60 12-345 6789"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="barber-display-name">Display name</Label>
                    <Input
                      id="barber-display-name"
                      name="display_name"
                      placeholder="Haziq"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="barber-working-start-time">Working start time</Label>
                      <Input
                        id="barber-working-start-time"
                        name="working_start_time"
                        type="time"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="barber-working-end-time">Working end time</Label>
                      <Input
                        id="barber-working-end-time"
                        name="working_end_time"
                        type="time"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="barber-level">Barber level</Label>
                      <Select name="barber_level">
                        <SelectTrigger id="barber-level">
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Junior">Junior</SelectItem>
                          <SelectItem value="Senior">Senior</SelectItem>
                          <SelectItem value="Professional">Professional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <input
                    type="hidden"
                    name="is_active"
                    value={isActive ? "on" : ""}
                  />
                  <div className="flex items-center gap-2 text-sm">
                    <Checkbox
                      id="barber-active"
                      checked={isActive}
                      onCheckedChange={(value) => setIsActive(value === true)}
                    />
                    <Label htmlFor="barber-active" className="text-sm">
                      Active barber
                    </Label>
                  </div>
                  <DialogFooter>
                    <Button type="submit">
                      <Plus />
                      Add barber
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Dialog open={isUpdateOpen} onOpenChange={(open) => (open ? null : closeUpdateDialog())}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update barber</DialogTitle>
              <DialogDescription>
                Update barber profile details and working hours.
              </DialogDescription>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleUpdateSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="update-barber-first-name">First name</Label>
                  <Input
                    id="update-barber-first-name"
                    name="first_name"
                    defaultValue={selectedBarber?.first_name ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="update-barber-last-name">Last name</Label>
                  <Input
                    id="update-barber-last-name"
                    name="last_name"
                    defaultValue={selectedBarber?.last_name ?? ""}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="update-barber-email">Email</Label>
                <Input
                  id="update-barber-email"
                  name="email"
                  type="email"
                  defaultValue={selectedBarber?.email ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="update-barber-phone">Phone</Label>
                <Input
                  id="update-barber-phone"
                  name="phone"
                  defaultValue={selectedBarber?.phone ?? ""}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="update-barber-working-start-time">
                    Working start time
                  </Label>
                  <Input
                    id="update-barber-working-start-time"
                    name="working_start_time"
                    type="time"
                    defaultValue={selectedBarber?.working_start_time ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="update-barber-working-end-time">Working end time</Label>
                  <Input
                    id="update-barber-working-end-time"
                    name="working_end_time"
                    type="time"
                    defaultValue={selectedBarber?.working_end_time ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="update-barber-level">Barber level</Label>
                  <Select
                    name="barber_level"
                    value={selectedBarberLevel || undefined}
                    onValueChange={(value) => setSelectedBarberLevel(value)}
                  >
                    <SelectTrigger id="update-barber-level">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Junior">Junior</SelectItem>
                      <SelectItem value="Senior">Senior</SelectItem>
                      <SelectItem value="Professional">Professional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {updateError ? (
                <p className="text-sm text-red-600">{updateError}</p>
              ) : null}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeUpdateDialog}>
                  Cancel
                </Button>
                <Button type="submit">Update barber</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {errorMessage ? (
          <p className="text-sm text-red-600">{errorMessage}</p>
        ) : filteredBarbers.length > 0 ? (
          <Table>
            <TableHeader>
                <TableRow>
                  <TableHead className="w-[18%]">Name</TableHead>
                  <TableHead className="w-[20%]">Email</TableHead>
                  <TableHead className="w-[12%]">Phone</TableHead>
                  <TableHead className="w-[10%]">Start time</TableHead>
                  <TableHead className="w-[10%]">End time</TableHead>
                  <TableHead className="w-[12%]">Level</TableHead>
                  <TableHead className="w-[10%]">Status</TableHead>
                  <TableHead className="w-[8%]">Joined</TableHead>
                  <TableHead className="w-[10%] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBarbers.map((barber) => (
                  <TableRow key={barber.id}>
                    <TableCell className="w-[18%] font-medium">
                      {[barber.first_name, barber.last_name]
                        .filter(Boolean)
                        .join(" ") || "-"}
                    </TableCell>
                    <TableCell className="w-[20%]">{barber.email || "-"}</TableCell>
                    <TableCell className="w-[12%]">{barber.phone || "-"}</TableCell>
                    <TableCell className="w-[10%]">
                      {barber.working_start_time || "-"}
                    </TableCell>
                    <TableCell className="w-[10%]">
                      {barber.working_end_time || "-"}
                    </TableCell>
                    <TableCell className="w-[12%]">{barber.barber_level || "-"}</TableCell>
                    <TableCell className="w-[10%]">
                      <Badge
                        variant="outline"
                        className={
                          barber.is_active
                            ? "bg-emerald-100 text-emerald-900 border-emerald-200"
                            : "bg-rose-100 text-rose-900 border-rose-200"
                        }
                    >
                      {barber.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                    <TableCell className="w-[8%]">
                      {formatDate(barber.created_at)}
                    </TableCell>
                    <TableCell className="w-[10%] text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openUpdateDialog(barber)}
                      >
                        <Pencil />
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
          </Table>
        ) : (
          <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/30 px-6 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl border border-border bg-background shadow-sm">
              <UserX className="size-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold">No barbers found yet</p>
              <p className="text-sm text-muted-foreground">
                Add a barber to start building your team.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

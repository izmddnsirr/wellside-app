"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useEffect, useMemo, useState } from "react";
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

const getStatusTone = (isActive: boolean | null) =>
  isActive
    ? {
        badge: "bg-emerald-100 text-emerald-900 border-emerald-200",
        dot: "bg-emerald-500",
      }
    : {
        badge: "bg-rose-100 text-rose-900 border-rose-200",
        dot: "bg-rose-500",
      };

export function BarbersCard({ barbers, errorMessage }: BarbersCardProps) {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState({ status: "all", level: "all" });
  const [sort, setSort] = useState("name_asc");
  const [isActive, setIsActive] = useState(true);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedBarberLevel, setSelectedBarberLevel] = useState<string>("");
  const [updateError, setUpdateError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchInput.trim().toLowerCase());
    }, 300);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const levelOptions = useMemo(() => {
    const levels = new Set<string>();
    barbers.forEach((barber) => {
      if (barber.barber_level) {
        levels.add(barber.barber_level);
      }
    });
    const preferred = ["Junior", "Senior", "Professional"];
    const ordered = preferred.filter((level) => levels.has(level));
    levels.forEach((level) => {
      if (!preferred.includes(level)) {
        ordered.push(level);
      }
    });
    return ordered;
  }, [barbers]);
  const hasUnassignedLevel = useMemo(
    () => barbers.some((barber) => !barber.barber_level),
    [barbers]
  );

  const filteredBarbers = useMemo(() => {
    const matchesSearch = (barber: Barber) => {
      if (!debouncedSearch) {
        return true;
      }
      const name = [barber.first_name, barber.last_name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return (
        name.includes(debouncedSearch) ||
        barber.email?.toLowerCase().includes(debouncedSearch) ||
        barber.phone?.toLowerCase().includes(debouncedSearch)
      );
    };

    const matchesStatus = (barber: Barber) => {
      if (filters.status === "all") {
        return true;
      }
      const isActiveValue = Boolean(barber.is_active);
      return filters.status === "active" ? isActiveValue : !isActiveValue;
    };

    const matchesLevel = (barber: Barber) => {
      if (filters.level === "all") {
        return true;
      }
      if (filters.level === "unassigned") {
        return !barber.barber_level;
      }
      return barber.barber_level === filters.level;
    };

    return barbers.filter(
      (barber) =>
        matchesSearch(barber) && matchesStatus(barber) && matchesLevel(barber)
    );
  }, [barbers, debouncedSearch, filters.level, filters.status]);

  const sortedBarbers = useMemo(() => {
    const sorted = filteredBarbers.slice();
    sorted.sort((a, b) => {
      const nameA = [a.first_name, a.last_name].filter(Boolean).join(" ");
      const nameB = [b.first_name, b.last_name].filter(Boolean).join(" ");
      const createdA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const createdB = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (sort === "name_asc") {
        return nameA.localeCompare(nameB);
      }
      if (sort === "name_desc") {
        return nameB.localeCompare(nameA);
      }
      if (sort === "joined_desc") {
        return createdB - createdA;
      }
      if (sort === "joined_asc") {
        return createdA - createdB;
      }
      return 0;
    });
    return sorted;
  }, [filteredBarbers, sort]);

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

  const resetFilters = () => {
    setFilters({ status: "all", level: "all" });
    setSort("name_asc");
    setSearchInput("");
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={filters.status}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.level}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, level: value }))
              }
            >
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All levels</SelectItem>
                {levelOptions.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
                {hasUnassignedLevel ? (
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                ) : null}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="h-9 w-[200px]">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name_asc">Name: A {"->"} Z</SelectItem>
                <SelectItem value="name_desc">Name: Z {"->"} A</SelectItem>
                <SelectItem value="joined_desc">
                  Joined: Newest {"->"} Oldest
                </SelectItem>
                <SelectItem value="joined_asc">
                  Joined: Oldest {"->"} Newest
                </SelectItem>
              </SelectContent>
            </Select>
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="barber-search"
                placeholder="Search barbers"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                className="w-full pl-9"
              />
            </div>
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Reset
            </Button>
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
                      <Label htmlFor="barber-working-start-time">
                        Working start time
                      </Label>
                      <Input
                        id="barber-working-start-time"
                        name="working_start_time"
                        type="time"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="barber-working-end-time">
                        Working end time
                      </Label>
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
                          <SelectItem value="Professional">
                            Professional
                          </SelectItem>
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
        </div>
      </div>
      <Dialog
        open={isUpdateOpen}
        onOpenChange={(open) => (open ? null : closeUpdateDialog())}
      >
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
                <Label htmlFor="update-barber-working-end-time">
                  Working end time
                </Label>
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
              <Button
                type="button"
                variant="outline"
                onClick={closeUpdateDialog}
              >
                Cancel
              </Button>
              <Button type="submit">Update barber</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {errorMessage ? (
        <p className="text-sm text-red-600">{errorMessage}</p>
      ) : sortedBarbers.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-border/60 bg-white">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="border-border/60">
                <TableHead className="w-[18%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Name
                </TableHead>
                <TableHead className="w-[20%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Email
                </TableHead>
                <TableHead className="w-[12%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Phone
                </TableHead>
                <TableHead className="w-[10%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Start time
                </TableHead>
                <TableHead className="w-[10%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  End time
                </TableHead>
                <TableHead className="w-[12%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Level
                </TableHead>
                <TableHead className="w-[10%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="w-[8%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Joined
                </TableHead>
                <TableHead className="w-[10%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedBarbers.map((barber) => {
                const tone = getStatusTone(barber.is_active);
                return (
                  <TableRow key={barber.id} className="bg-white hover:bg-slate-50/70">
                    <TableCell className="w-[18%] px-4 py-3 font-semibold text-slate-900">
                      {[barber.first_name, barber.last_name]
                        .filter(Boolean)
                        .join(" ") || "-"}
                    </TableCell>
                    <TableCell className="w-[20%] px-4 py-3 text-slate-600">
                      {barber.email || "-"}
                    </TableCell>
                    <TableCell className="w-[12%] px-4 py-3 text-slate-600">
                      {barber.phone || "-"}
                    </TableCell>
                    <TableCell className="w-[10%] px-4 py-3 text-slate-600">
                      {barber.working_start_time || "-"}
                    </TableCell>
                    <TableCell className="w-[10%] px-4 py-3 text-slate-600">
                      {barber.working_end_time || "-"}
                    </TableCell>
                    <TableCell className="w-[12%] px-4 py-3 text-slate-700">
                      {barber.barber_level || "-"}
                    </TableCell>
                    <TableCell className="w-[10%] px-4 py-3">
                      <Badge variant="outline" className={`gap-2 ${tone.badge}`}>
                        <span className={`size-2 rounded-full ${tone.dot}`} />
                        {barber.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="w-[8%] px-4 py-3 text-slate-600">
                      {formatDate(barber.created_at)}
                    </TableCell>
                    <TableCell className="w-[10%] px-4 py-3">
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
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/30 px-6 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl border border-border bg-background shadow-sm">
            <UserX className="size-8 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold">
              {debouncedSearch
                ? "No barbers match your search"
                : "No barbers found yet"}
            </p>
            <p className="text-sm text-muted-foreground">
              {debouncedSearch
                ? "Try a different name, email, or phone."
                : "Add a barber to start building your team."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

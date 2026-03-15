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
import { PasswordInput } from "@/components/ui/password-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createAdminClient } from "@/utils/supabase/client";
import { isValidE164, normalizePhone } from "@/src/lib/phone";
import { toast } from "sonner";

type Barber = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  is_active: boolean | null;
  created_at: string | null;
  working_start_time: string | null;
  working_end_time: string | null;
  barber_level: string | null;
  off_days: string[] | null;
};

type BarbersCardProps = {
  barbers: Barber[];
  errorMessage?: string | null;
  createBarber: (formData: FormData) => Promise<void>;
  moveBarberToCustomer: (formData: FormData) => Promise<void>;
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

const formatWorkingTime = (value: string | null) => {
  if (!value) {
    return "-";
  }
  const [hourPart, minutePart] = value.split(":");
  const hour = Number(hourPart);
  const minute = Number(minutePart ?? "0");
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return value;
  }
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;
};

const formatMalaysiaPhoneInput = (value: string | null) => {
  if (!value) {
    return "";
  }

  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("60")) {
    return digits.slice(2);
  }
  if (digits.startsWith("0")) {
    return digits.slice(1);
  }
  return digits;
};

const getStatusTone = (isActive: boolean | null) =>
  isActive
    ? {
        badge:
          "bg-emerald-100 text-emerald-900 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
        dot: "bg-emerald-500",
      }
    : {
        badge:
          "bg-rose-100 text-rose-900 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800",
        dot: "bg-rose-500",
      };

const OFF_DAY_OPTIONS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
] as const;

export function BarbersCard({
  barbers,
  errorMessage,
  createBarber,
  moveBarberToCustomer,
}: BarbersCardProps) {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState({ status: "all", level: "all" });
  const [sort, setSort] = useState("name_asc");
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [isDemoteOpen, setIsDemoteOpen] = useState(false);
  const [demoteTarget, setDemoteTarget] = useState<Barber | null>(null);
  const [selectedBarberLevel, setSelectedBarberLevel] = useState<string>("");
  const [selectedBarberActive, setSelectedBarberActive] = useState(true);
  const [selectedOffDays, setSelectedOffDays] = useState<string[]>([]);
  const [newBarberLevel, setNewBarberLevel] = useState("");
  const [newBarberActive, setNewBarberActive] = useState(true);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const toastKey = searchParams.get("toast");
  const searchParamsString = searchParams.toString();

  useEffect(() => {
    if (!toastKey) {
      return;
    }
    const messageMap: Record<
      string,
      { type: "success" | "error"; message: string }
    > = {
      "barber-created": {
        type: "success",
        message: "Barber account created.",
      },
      "barber-converted": {
        type: "success",
        message: "Customer converted to barber.",
      },
      "barber-password-invalid": {
        type: "error",
        message: "Password invalid or mismatch.",
      },
      "barber-password-failed": {
        type: "error",
        message: "Failed to update password.",
      },
      "barber-demoted": {
        type: "success",
        message: "Barber moved to customer.",
      },
      "barber-demote-blocked": {
        type: "error",
        message: "Cannot move barber while there are active bookings assigned.",
      },
      "barber-demote-failed": {
        type: "error",
        message: "Failed to move barber to customer.",
      },
      "barber-demote-invalid": {
        type: "error",
        message: "Invalid barber selected for move.",
      },
    };
    const config = messageMap[toastKey];
    if (config) {
      if (config.type === "success") {
        toast.success(config.message, { id: toastKey });
      } else {
        toast.error(config.message, { id: toastKey });
      }
    }
    const params = new URLSearchParams(searchParamsString);
    params.delete("toast");
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [toastKey, pathname, router, searchParamsString]);

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
    [barbers],
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
        matchesSearch(barber) && matchesStatus(barber) && matchesLevel(barber),
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
    setSelectedBarberActive(Boolean(barber.is_active));
    setSelectedOffDays((barber.off_days ?? []).map((day) => day.toLowerCase()));
    setIsUpdateOpen(true);
  };

  const closeUpdateDialog = () => {
    setIsUpdateOpen(false);
    setSelectedBarber(null);
    setSelectedBarberLevel("");
    setSelectedBarberActive(true);
    setSelectedOffDays([]);
    setUpdateError(null);
  };

  const openDemoteDialog = (barber: Barber) => {
    setDemoteTarget(barber);
    setIsDemoteOpen(true);
  };

  const closeDemoteDialog = () => {
    setIsDemoteOpen(false);
    setDemoteTarget(null);
  };

  const normalizeValue = (value: FormDataEntryValue | null) => {
    if (value === null) {
      return null;
    }
    const text = String(value).trim();
    return text.length > 0 ? text : null;
  };

  const handleUpdateSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setUpdateError(null);

    if (!selectedBarber) {
      setUpdateError("No barber selected.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const readField = (name: string, fallback: string | null) => {
      if (!formData.has(name)) {
        return fallback;
      }
      return normalizeValue(formData.get(name));
    };

    const firstName = readField("first_name", selectedBarber.first_name);
    const lastName = readField("last_name", selectedBarber.last_name);
    const displayNameInput = readField(
      "display_name",
      selectedBarber.display_name,
    );
    const fallbackDisplayName = [firstName, lastName].filter(Boolean).join(" ");
    const displayName =
      displayNameInput || fallbackDisplayName
        ? (displayNameInput ?? fallbackDisplayName)
        : null;

    const emailValue = readField("email", selectedBarber.email);
    const phoneInput = readField("phone", selectedBarber.phone);
    const normalizedPhone = phoneInput
      ? normalizePhone(phoneInput, "MY")
      : null;
    if (normalizedPhone && !isValidE164(normalizedPhone)) {
      setUpdateError("Phone number must be a valid E.164 value.");
      return;
    }

    const payload = {
      first_name: firstName,
      last_name: lastName,
      display_name: displayName,
      email: emailValue,
      phone: normalizedPhone,
      working_start_time: normalizeValue(formData.get("working_start_time")),
      working_end_time: normalizeValue(formData.get("working_end_time")),
      barber_level: selectedBarberLevel || null,
      off_days: selectedOffDays,
      is_active: formData.get("is_active") === "on",
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
              <SelectTrigger className="h-9 w-40">
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
              <SelectTrigger className="h-9 w-40">
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
              <SelectTrigger className="h-9 w-50">
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
                    Create a barber account and set their password.
                  </DialogDescription>
                </DialogHeader>
                <form action={createBarber} className="space-y-4">
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
                      required
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="barber-password">Password</Label>
                      <PasswordInput
                        id="barber-password"
                        name="password"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="barber-confirm-password">
                        Confirm password
                      </Label>
                      <PasswordInput
                        id="barber-confirm-password"
                        name="confirm_password"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="barber-phone">Phone</Label>
                    <div className="flex">
                      <div className="flex items-center gap-2 rounded-l-md border border-border bg-muted/40 px-3 text-sm font-medium text-foreground/80">
                        <span aria-hidden="true" className="text-base">
                          🇲🇾
                        </span>
                        <span className="text-sm">+60</span>
                      </div>
                      <Input
                        id="barber-phone"
                        name="phone"
                        placeholder="123456789"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        onInput={(event) => {
                          const target = event.currentTarget;
                          target.value = target.value.replace(/\D/g, "");
                        }}
                        className="rounded-l-none"
                      />
                    </div>
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
                      <Select
                        value={newBarberLevel}
                        onValueChange={(value) => setNewBarberLevel(value)}
                      >
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
                    name="barber_level"
                    value={newBarberLevel}
                  />
                  <input
                    type="hidden"
                    name="is_active"
                    value={newBarberActive ? "on" : ""}
                  />
                  <div className="flex items-center gap-2 text-sm">
                    <Checkbox
                      id="barber-active"
                      checked={newBarberActive}
                      onCheckedChange={(value) =>
                        setNewBarberActive(value === true)
                      }
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
            <Tabs defaultValue="profile" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4">
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
                  <div className="flex">
                    <div className="flex items-center gap-2 rounded-l-md border border-border bg-muted/40 px-3 text-sm font-medium text-foreground/80">
                      <span aria-hidden="true" className="text-base">
                        🇲🇾
                      </span>
                      <span className="text-sm">+60</span>
                    </div>
                    <Input
                      id="update-barber-phone"
                      name="phone"
                      defaultValue={formatMalaysiaPhoneInput(
                        selectedBarber?.phone ?? null,
                      )}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      onInput={(event) => {
                        const target = event.currentTarget;
                        target.value = target.value.replace(/\D/g, "");
                      }}
                      className="rounded-l-none"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="schedule" className="space-y-4">
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
                        <SelectItem value="Professional">
                          Professional
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Off Days (Select Multiple)</Label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {OFF_DAY_OPTIONS.map((day) => {
                      const isChecked = selectedOffDays.includes(day.key);
                      return (
                        <Label
                          key={day.key}
                          htmlFor={`update-barber-offday-${day.key}`}
                          className="flex items-center gap-2 text-sm font-normal"
                        >
                          <Checkbox
                            id={`update-barber-offday-${day.key}`}
                            checked={isChecked}
                            onCheckedChange={(value) =>
                              setSelectedOffDays((prev) =>
                                value === true
                                  ? [...prev, day.key]
                                  : prev.filter((item) => item !== day.key),
                              )
                            }
                          />
                          {day.label}
                        </Label>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Selected off days will be saved with this barber profile.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
            <input
              type="hidden"
              name="is_active"
              value={selectedBarberActive ? "on" : ""}
            />
            <div className="flex items-center gap-2 text-sm">
              <Checkbox
                id="update-barber-active"
                checked={selectedBarberActive}
                onCheckedChange={(value) =>
                  setSelectedBarberActive(value === true)
                }
              />
              <Label htmlFor="update-barber-active" className="text-sm">
                Active barber
              </Label>
            </div>
            {updateError ? (
              <p className="text-sm text-red-600">{updateError}</p>
            ) : null}
            <DialogFooter className="justify-between">
              <Button
                type="button"
                variant="ghost"
                className="text-amber-700 hover:text-amber-800"
                onClick={() => {
                  if (selectedBarber) {
                    closeUpdateDialog();
                    openDemoteDialog(selectedBarber);
                  }
                }}
              >
                Move to customer
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeUpdateDialog}
                >
                  Cancel
                </Button>
                <Button type="submit">Update barber</Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isDemoteOpen}
        onOpenChange={(open) => (open ? null : closeDemoteDialog())}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move to customer</DialogTitle>
            <DialogDescription>
              This will move{" "}
              <span className="font-medium text-foreground">
                {demoteTarget
                  ? [demoteTarget.first_name, demoteTarget.last_name]
                      .filter(Boolean)
                      .join(" ") || "this barber"
                  : "this barber"}
              </span>{" "}
              from barber role to customer role.
            </DialogDescription>
          </DialogHeader>
          <form action={moveBarberToCustomer} className="space-y-4">
            <input type="hidden" name="id" value={demoteTarget?.id ?? ""} />
            <div className="rounded-md border border-border/60 bg-muted/30 p-3 text-sm text-muted-foreground">
              This action will be blocked if the barber still has active
              bookings (`scheduled` or `in_progress`).
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeDemoteDialog}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={!demoteTarget?.id}
              >
                Move to customer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {errorMessage ? (
        <p className="text-sm text-red-600">{errorMessage}</p>
      ) : sortedBarbers.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
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
                <TableHead className="w-[10%] px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="w-[8%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Joined
                </TableHead>
                <TableHead className="w-[10%] px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedBarbers.map((barber) => {
                const tone = getStatusTone(barber.is_active);
                return (
                  <TableRow
                    key={barber.id}
                    className="bg-background hover:bg-muted/50"
                  >
                    <TableCell className="w-[18%] px-4 py-3 font-semibold text-foreground">
                      {[barber.first_name, barber.last_name]
                        .filter(Boolean)
                        .join(" ") || "-"}
                    </TableCell>
                    <TableCell className="w-[20%] px-4 py-3 text-muted-foreground">
                      {barber.email || "-"}
                    </TableCell>
                    <TableCell className="w-[12%] px-4 py-3 text-muted-foreground">
                      {barber.phone || "-"}
                    </TableCell>
                    <TableCell className="w-[10%] px-4 py-3 text-muted-foreground">
                      {formatWorkingTime(barber.working_start_time)}
                    </TableCell>
                    <TableCell className="w-[10%] px-4 py-3 text-muted-foreground">
                      {formatWorkingTime(barber.working_end_time)}
                    </TableCell>
                    <TableCell className="w-[12%] px-4 py-3 text-foreground">
                      {barber.barber_level || "-"}
                    </TableCell>
                    <TableCell className="w-[10%] px-4 py-3 text-center">
                      <div className="flex justify-center">
                        <Badge variant="outline" className={tone.badge}>
                          {barber.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="w-[8%] px-4 py-3 text-muted-foreground">
                      {formatDate(barber.created_at)}
                    </TableCell>
                    <TableCell className="w-[10%] px-4 py-3 text-right">
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openUpdateDialog(barber)}
                        >
                          <Pencil />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex min-h-60 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/30 px-6 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl border border-border bg-background">
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
                : "Barbers will show up here once they are added."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

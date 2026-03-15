"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogClose,
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Scissors,
  Search,
  Trash2,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

type Service = {
  id: string;
  name: string;
  service_code: string | null;
  base_price: number | null;
  duration_minutes: number | null;
  is_active: boolean;
  allow_booking?: boolean | null;
};

type ServicesCardProps = {
  services: Service[];
  errorMessage?: string | null;
  createService: (formData: FormData) => Promise<void>;
  updateService: (formData: FormData) => Promise<void>;
  updateServiceBooking: (payload: {
    id: string;
    allowBooking: boolean;
  }) => Promise<{ ok: boolean; message?: string }>;
  archiveService: (formData: FormData) => Promise<void>;
  reactivateService: (formData: FormData) => Promise<void>;
};

const priceFormatter = new Intl.NumberFormat("en-MY", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatPrice = (value: number | null) => {
  if (value === null || Number.isNaN(value)) {
    return "Custom price";
  }
  return `RM ${priceFormatter.format(value)}`;
};

const formatDuration = (value: number | null) => {
  if (value === null || Number.isNaN(value)) {
    return "-";
  }
  return `${value} mins`;
};

const getStatusTone = (isActive: boolean) =>
  isActive
    ? {
        badge:
          "bg-emerald-100 text-emerald-900 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
        dot: "bg-emerald-500",
      }
    : {
        badge:
          "bg-red-100 text-red-900 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
        dot: "bg-red-500",
      };

const ServiceFormFields = ({ service }: { service?: Service | null }) => (
  <>
    <div className="space-y-2">
      <Label htmlFor={service ? `name-${service.id}` : "service-name"}>
        Service name
      </Label>
      <Input
        id={service ? `name-${service.id}` : "service-name"}
        name="name"
        defaultValue={service?.name ?? ""}
        placeholder="Signature haircut"
        required
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor={service ? `duration-${service.id}` : "service-duration"}>
        Duration (minutes)
      </Label>
      <Input
        id={service ? `duration-${service.id}` : "service-duration"}
        name="duration_minutes"
        type="number"
        min="1"
        step="1"
        defaultValue={service?.duration_minutes ?? ""}
        required
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor={service ? `price-${service.id}` : "service-price"}>
        Base price (RM)
      </Label>
      <Input
        id={service ? `price-${service.id}` : "service-price"}
        name="base_price"
        type="number"
        min="0.01"
        step="0.01"
        defaultValue={service?.base_price ?? ""}
      />
    </div>
  </>
);

const ServiceAvailabilityFields = ({
  service,
}: {
  service?: Service | null;
}) => {
  const [allowInQueue, setAllowInQueue] = useState(Boolean(service?.is_active));
  const [allowInBooking, setAllowInBooking] = useState(
    service?.allow_booking ?? Boolean(service?.is_active),
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-2xl border border-border px-4 py-4">
        <div className="space-y-1 pr-4">
          <p className="text-base font-medium text-foreground">
            Allow in Queue
          </p>
          <p className="text-sm text-muted-foreground">
            Enable this service for walk-in queue bookings
          </p>
        </div>
        <Switch checked={allowInQueue} onCheckedChange={setAllowInQueue} />
      </div>
      <div className="flex items-center justify-between rounded-2xl border border-border px-4 py-4">
        <div className="space-y-1 pr-4">
          <p className="text-base font-medium text-foreground">
            Allow in Booking
          </p>
          <p className="text-sm text-muted-foreground">
            Enable this service for advance bookings
          </p>
        </div>
        <Switch checked={allowInBooking} onCheckedChange={setAllowInBooking} />
      </div>
      <input
        type="hidden"
        name="allow_booking"
        value={allowInBooking ? "on" : "off"}
      />
    </div>
  );
};

export function ServicesCard({
  services,
  errorMessage,
  createService,
  updateService,
  updateServiceBooking,
  archiveService,
  reactivateService,
}: ServicesCardProps) {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState({ status: "all" });
  const [sort, setSort] = useState("code_asc");
  const [serviceAvailabilityOverrides, setServiceAvailabilityOverrides] =
    useState<Record<string, { queue: boolean; booking: boolean }>>({});
  const [isBookingPending, startBookingTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const toastKey = searchParams.get("toast");
  const searchParamsString = searchParams.toString();

  useEffect(() => {
    if (!toastKey) {
      return;
    }
    const message = {
      "service-created": "Service created.",
      "service-updated": "Service updated.",
      "service-deactivated": "Service deactivated.",
      "service-reactivated": "Service reactivated.",
    }[toastKey];
    if (message) {
      toast.success(message, { id: toastKey });
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

  const filteredServices = useMemo(() => {
    const matchesSearch = (service: Service) => {
      if (!debouncedSearch) {
        return true;
      }
      const nameMatch = service.name.toLowerCase().includes(debouncedSearch);
      const codeMatch =
        service.service_code?.toLowerCase().includes(debouncedSearch) ?? false;
      return nameMatch || codeMatch;
    };

    const matchesStatus = (service: Service) => {
      if (filters.status === "all") {
        return true;
      }
      if (filters.status === "active") {
        return service.is_active;
      }
      if (filters.status === "deactivated") {
        return !service.is_active;
      }
      return true;
    };

    const filtered = services.filter(
      (service) => matchesSearch(service) && matchesStatus(service),
    );

    const sorted = filtered.slice();
    sorted.sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      const codeA = (a.service_code ?? "").toLowerCase();
      const codeB = (b.service_code ?? "").toLowerCase();
      const priceA = a.base_price ?? 0;
      const priceB = b.base_price ?? 0;
      const durationA = a.duration_minutes ?? 0;
      const durationB = b.duration_minutes ?? 0;
      if (sort === "code_asc") {
        return codeA.localeCompare(codeB);
      }
      if (sort === "code_desc") {
        return codeB.localeCompare(codeA);
      }
      if (sort === "name_asc") {
        return nameA.localeCompare(nameB);
      }
      if (sort === "name_desc") {
        return nameB.localeCompare(nameA);
      }
      if (sort === "price_desc") {
        return priceB - priceA;
      }
      if (sort === "price_asc") {
        return priceA - priceB;
      }
      if (sort === "duration_desc") {
        return durationB - durationA;
      }
      if (sort === "duration_asc") {
        return durationA - durationB;
      }
      return 0;
    });

    return sorted;
  }, [debouncedSearch, filters.status, services, sort]);

  const resetFilters = () => {
    setFilters({ status: "all" });
    setSort("code_asc");
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
                <SelectItem value="deactivated">Deactivated</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="h-9 w-50">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="code_asc">Code: A {"->"} Z</SelectItem>
                <SelectItem value="code_desc">Code: Z {"->"} A</SelectItem>
                <SelectItem value="name_asc">Name: A {"->"} Z</SelectItem>
                <SelectItem value="name_desc">Name: Z {"->"} A</SelectItem>
                <SelectItem value="price_desc">
                  Price: High {"->"} Low
                </SelectItem>
                <SelectItem value="price_asc">
                  Price: Low {"->"} High
                </SelectItem>
                <SelectItem value="duration_desc">
                  Duration: Long {"->"} Short
                </SelectItem>
                <SelectItem value="duration_asc">
                  Duration: Short {"->"} Long
                </SelectItem>
              </SelectContent>
            </Select>
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="service-search"
                placeholder="Search services"
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
                  Add service
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add service</DialogTitle>
                  <DialogDescription>
                    Create a new service entry.
                  </DialogDescription>
                </DialogHeader>
                <form action={createService} className="space-y-4">
                  <input type="hidden" name="is_active" value="on" />
                  <ServiceFormFields />
                  <ServiceAvailabilityFields />
                  <DialogFooter>
                    <Button type="submit">
                      <Save />
                      Save service
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
      {errorMessage ? (
        <p className="text-sm text-red-600">{errorMessage}</p>
      ) : filteredServices.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="border-border/60">
                <TableHead className="w-[12%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Code
                </TableHead>
                <TableHead className="w-[24%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Service
                </TableHead>
                <TableHead className="w-[10%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Duration
                </TableHead>
                <TableHead className="w-[12%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Price
                </TableHead>
                <TableHead className="w-[10%] px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Queue
                </TableHead>
                <TableHead className="w-[10%] px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Booking
                </TableHead>
                <TableHead className="w-[14%] px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="w-[8%] px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServices.map((service) => {
                const tone = getStatusTone(service.is_active);
                const isActive = service.is_active;
                const availability = serviceAvailabilityOverrides[
                  service.id
                ] ?? {
                  queue: Boolean(service.is_active),
                  booking: service.allow_booking ?? Boolean(service.is_active),
                };
                return (
                  <TableRow
                    key={service.id}
                    className="bg-background hover:bg-muted/50"
                  >
                    <TableCell className="w-[12%] px-4 py-3 text-muted-foreground">
                      {service.service_code || "-"}
                    </TableCell>
                    <TableCell className="w-[24%] px-4 py-3 font-semibold text-foreground">
                      <span className="block truncate">{service.name}</span>
                    </TableCell>
                    <TableCell className="w-[10%] px-4 py-3 text-muted-foreground">
                      {formatDuration(service.duration_minutes)}
                    </TableCell>
                    <TableCell className="w-[12%] px-4 py-3 text-foreground">
                      <span className="block truncate">
                        {formatPrice(service.base_price)}
                      </span>
                    </TableCell>
                    <TableCell className="w-[10%] px-4 py-3 text-center">
                      <div className="flex justify-center">
                        <Switch
                          checked={availability.queue}
                          onCheckedChange={(checked) =>
                            setServiceAvailabilityOverrides((current) => ({
                              ...current,
                              [service.id]: {
                                queue: checked,
                                booking:
                                  current[service.id]?.booking ??
                                  availability.booking,
                              },
                            }))
                          }
                          aria-label={`Toggle queue availability for ${service.name}`}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="w-[10%] px-4 py-3 text-center">
                      <div className="flex justify-center">
                        <Switch
                          checked={availability.booking}
                          disabled={isBookingPending}
                          onCheckedChange={(checked) => {
                            const previousBooking = availability.booking;
                            setServiceAvailabilityOverrides((current) => ({
                              ...current,
                              [service.id]: {
                                queue:
                                  current[service.id]?.queue ??
                                  availability.queue,
                                booking: checked,
                              },
                            }));

                            startBookingTransition(async () => {
                              const result = await updateServiceBooking({
                                id: service.id,
                                allowBooking: checked,
                              });

                              if (!result.ok) {
                                setServiceAvailabilityOverrides((current) => ({
                                  ...current,
                                  [service.id]: {
                                    queue:
                                      current[service.id]?.queue ??
                                      availability.queue,
                                    booking: previousBooking,
                                  },
                                }));
                                toast.error(
                                  result.message ??
                                    "Failed to update booking availability.",
                                );
                                return;
                              }

                              toast.success("Booking availability updated.");
                            });
                          }}
                          aria-label={`Toggle booking availability for ${service.name}`}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="w-[14%] px-4 py-3 text-center">
                      <div className="flex justify-center">
                        <Badge variant="outline" className={tone.badge}>
                          {service.is_active ? "Active" : "Deactivated"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="w-[8%] px-4 py-3 text-right">
                      <div className="flex justify-end">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="icon">
                              <Pencil />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Manage service</DialogTitle>
                              <DialogDescription>
                                {isActive
                                  ? "Update details or deactivate this service."
                                  : "Update details or reactivate this service."}
                              </DialogDescription>
                            </DialogHeader>
                            <form
                              id={`service-update-${service.id}`}
                              action={updateService}
                              className="space-y-4"
                            >
                              <input
                                type="hidden"
                                name="id"
                                value={service.id}
                              />
                              <input
                                type="hidden"
                                name="is_active"
                                value={service.is_active ? "on" : "off"}
                              />
                              <ServiceFormFields service={service} />
                              <ServiceAvailabilityFields service={service} />
                            </form>
                            <DialogFooter className="flex-row justify-end">
                              {isActive ? (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="destructive" type="button">
                                      <Trash2 />
                                      Deactivate
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>
                                        Deactivate service
                                      </DialogTitle>
                                      <DialogDescription>
                                        This will hide the service from the POS
                                        catalog but keep existing tickets
                                        intact.
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="text-sm text-foreground">
                                      <p>
                                        Service:{" "}
                                        <span className="font-medium text-foreground">
                                          {service.name}
                                        </span>
                                      </p>
                                    </div>
                                    <form action={archiveService}>
                                      <input
                                        type="hidden"
                                        name="id"
                                        value={service.id}
                                      />
                                      <DialogFooter>
                                        <DialogClose asChild>
                                          <Button variant="ghost" type="button">
                                            Cancel
                                          </Button>
                                        </DialogClose>
                                        <Button
                                          variant="destructive"
                                          type="submit"
                                        >
                                          <Trash2 />
                                          Deactivate
                                        </Button>
                                      </DialogFooter>
                                    </form>
                                  </DialogContent>
                                </Dialog>
                              ) : (
                                <form
                                  action={reactivateService}
                                  className="inline-flex"
                                >
                                  <input
                                    type="hidden"
                                    name="id"
                                    value={service.id}
                                  />
                                  <Button
                                    type="submit"
                                    className="bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-300/50"
                                  >
                                    <RefreshCw />
                                    Reactivate
                                  </Button>
                                </form>
                              )}
                              <Button
                                type="submit"
                                form={`service-update-${service.id}`}
                              >
                                <Save />
                                Update service
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex min-h-60 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-6 text-center">
          <div className="flex size-16 items-center justify-center rounded-xl border border-border bg-background">
            <Scissors className="size-8 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold">
              {debouncedSearch
                ? "No services match your search"
                : "No services found yet"}
            </p>
            <p className="text-sm text-muted-foreground">
              {debouncedSearch
                ? "Try a different name or code."
                : "Add a service to start building your catalog."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

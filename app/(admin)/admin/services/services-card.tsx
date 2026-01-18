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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Eye,
  EyeOff,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Scissors,
  Search,
  Trash2,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type Service = {
  id: string;
  name: string;
  service_code: string | null;
  price: number | null;
  duration_minutes: number | null;
  is_active: boolean;
};

type ServicesCardProps = {
  services: Service[];
  errorMessage?: string | null;
  createService: (formData: FormData) => Promise<void>;
  updateService: (formData: FormData) => Promise<void>;
  archiveService: (formData: FormData) => Promise<void>;
  reactivateService: (formData: FormData) => Promise<void>;
};

const priceFormatter = new Intl.NumberFormat("en-MY", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatPrice = (value: number | null) => {
  if (value === null || Number.isNaN(value)) {
    return "-";
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
        badge: "bg-emerald-100 text-emerald-900 border-emerald-200",
        dot: "bg-emerald-500",
      }
    : {
        badge: "bg-slate-100 text-slate-900 border-slate-200",
        dot: "bg-slate-500",
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
        Price (RM)
      </Label>
      <Input
        id={service ? `price-${service.id}` : "service-price"}
        name="price"
        type="number"
        min="0"
        step="0.01"
        defaultValue={service?.price ?? ""}
        required
      />
    </div>
  </>
);

export function ServicesCard({
  services,
  errorMessage,
  createService,
  updateService,
  archiveService,
  reactivateService,
}: ServicesCardProps) {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState({ status: "all" });
  const [sort, setSort] = useState("code_asc");
  const [showInactive, setShowInactive] = useState(false);
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
      if (showInactive) {
        return !service.is_active;
      }
      if (!service.is_active) {
        return false;
      }
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
      (service) => matchesSearch(service) && matchesStatus(service)
    );

    const sorted = filtered.slice();
    sorted.sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      const codeA = (a.service_code ?? "").toLowerCase();
      const codeB = (b.service_code ?? "").toLowerCase();
      const priceA = a.price ?? 0;
      const priceB = b.price ?? 0;
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
  }, [debouncedSearch, filters.status, services, showInactive, sort]);

  const resetFilters = () => {
    setFilters({ status: "all" });
    setSort("code_asc");
    setSearchInput("");
    setShowInactive(false);
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
                <SelectItem value="deactivated">Deactivated</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="h-9 w-[200px]">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="code_asc">Code: A {"->"} Z</SelectItem>
                <SelectItem value="code_desc">Code: Z {"->"} A</SelectItem>
                <SelectItem value="name_asc">Name: A {"->"} Z</SelectItem>
                <SelectItem value="name_desc">Name: Z {"->"} A</SelectItem>
                <SelectItem value="price_desc">Price: High {"->"} Low</SelectItem>
                <SelectItem value="price_asc">Price: Low {"->"} High</SelectItem>
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
                  <DialogDescription>Create a new service entry.</DialogDescription>
                </DialogHeader>
                <form action={createService} className="space-y-4">
                  <input type="hidden" name="is_active" value="on" />
                  <ServiceFormFields />
                  <DialogFooter>
                    <Button type="submit">
                      <Save />
                      Save service
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Button
              variant={showInactive ? "secondary" : "outline"}
              size="icon"
              onClick={() => setShowInactive((prev) => !prev)}
              aria-label={
                showInactive ? "Show active services" : "Show deactivated services"
              }
              title={showInactive ? "Show active services" : "Show deactivated services"}
            >
              {showInactive ? <Eye /> : <EyeOff />}
            </Button>
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
                <TableHead className="w-[16%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Code
                </TableHead>
                <TableHead className="w-[28%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Service
                </TableHead>
                <TableHead className="w-[16%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Duration
                </TableHead>
                <TableHead className="w-[16%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Price
                </TableHead>
                <TableHead className="w-[12%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="w-[12%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServices.map((service) => {
                const tone = getStatusTone(service.is_active);
                const isActive = service.is_active;
                return (
                  <TableRow key={service.id} className="bg-background hover:bg-muted/50">
                    <TableCell className="w-[16%] px-4 py-3 text-muted-foreground">
                      {service.service_code || "-"}
                    </TableCell>
                    <TableCell className="w-[28%] px-4 py-3 font-semibold text-foreground">
                      {service.name}
                    </TableCell>
                    <TableCell className="w-[16%] px-4 py-3 text-muted-foreground">
                      {formatDuration(service.duration_minutes)}
                    </TableCell>
                    <TableCell className="w-[16%] px-4 py-3 text-foreground">
                      {formatPrice(service.price)}
                    </TableCell>
                    <TableCell className="w-[12%] px-4 py-3">
                      <Badge variant="outline" className={`gap-2 ${tone.badge}`}>
                        <span className={`size-2 rounded-full ${tone.dot}`} />
                        {service.is_active ? "Active" : "Deactivated"}
                      </Badge>
                    </TableCell>
                    <TableCell className="w-[12%] px-4 py-3">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Pencil />
                            Manage
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
                            <input type="hidden" name="id" value={service.id} />
                            <input
                              type="hidden"
                              name="is_active"
                              value={service.is_active ? "on" : "off"}
                            />
                            <ServiceFormFields service={service} />
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
                                    <DialogTitle>Deactivate service</DialogTitle>
                                    <DialogDescription>
                                      This will hide the service from the POS catalog but
                                      keep existing tickets intact.
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
                                      <Button variant="destructive" type="submit">
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
                                <input type="hidden" name="id" value={service.id} />
                                <Button
                                  type="submit"
                                  className="bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-300/50"
                                >
                                  <RefreshCw />
                                  Reactivate
                                </Button>
                              </form>
                            )}
                            <Button type="submit" form={`service-update-${service.id}`}>
                              <Save />
                              Update service
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-6 text-center">
          <div className="flex size-16 items-center justify-center rounded-xl border border-border bg-background shadow-sm">
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

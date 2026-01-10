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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PackageX, Pencil, Plus, Save, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

type Service = {
  id: string;
  name: string;
  price: number | null;
  duration_minutes: number | null;
  is_active: boolean;
};

type ServicesCardProps = {
  services: Service[];
  errorMessage?: string | null;
  createService: (formData: FormData) => Promise<void>;
  updateService: (formData: FormData) => Promise<void>;
  deleteService: (formData: FormData) => Promise<void>;
};

const formatPrice = (value: number | null) => {
  if (value === null || Number.isNaN(value)) {
    return "-";
  }
  return new Intl.NumberFormat("ms-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 2,
  }).format(value);
};

const formatDuration = (value: number | null) => {
  if (value === null || Number.isNaN(value)) {
    return "-";
  }
  return `${value} mins`;
};

const serviceStatusClass = (isActive: boolean) =>
  isActive
    ? "bg-emerald-100 text-emerald-900 border-emerald-200"
    : "bg-slate-100 text-slate-900 border-slate-200";

const ServiceFormFields = ({ service }: { service?: Service | null }) => (
  <ServiceFormFieldsContent service={service} />
);

const ServiceFormFieldsContent = ({ service }: { service?: Service | null }) => {
  const [isActive, setIsActive] = useState(service?.is_active ?? true);

  return (
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
      <input type="hidden" name="is_active" value={isActive ? "on" : ""} />
      <div className="flex items-center gap-2 text-sm">
        <Checkbox
          id={service ? `active-${service.id}` : "service-active"}
          checked={isActive}
          onCheckedChange={(value) => setIsActive(value === true)}
        />
        <Label
          htmlFor={service ? `active-${service.id}` : "service-active"}
          className="text-sm"
        >
          Active service
        </Label>
      </div>
    </>
  );
};

export function ServicesCard({
  services,
  errorMessage,
  createService,
  updateService,
  deleteService,
}: ServicesCardProps) {
  const [query, setQuery] = useState("");
  const filteredServices = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return services;
    }
    return services.filter((service) =>
      service.name.toLowerCase().includes(trimmed)
    );
  }, [query, services]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Service catalog</CardTitle>
        <CardDescription>Add, update, or delete services.</CardDescription>
        <CardAction>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="service-search"
                placeholder="Search services"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-56 pl-9"
              />
            </div>
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
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        {errorMessage ? (
          <p className="text-sm text-red-600">{errorMessage}</p>
        ) : filteredServices.length > 0 ? (
          <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[32%]">Service</TableHead>
                    <TableHead className="w-[16%]">Duration</TableHead>
                    <TableHead className="w-[16%]">Price</TableHead>
                    <TableHead className="w-[16%]">Status</TableHead>
                    <TableHead className="w-[20%] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="w-[32%] font-medium">
                        {service.name}
                      </TableCell>
                      <TableCell className="w-[16%]">
                        {formatDuration(service.duration_minutes)}
                      </TableCell>
                      <TableCell className="w-[16%]">
                        {formatPrice(service.price)}
                      </TableCell>
                      <TableCell className="w-[16%]">
                        <Badge
                          variant="outline"
                          className={serviceStatusClass(service.is_active)}
                        >
                          {service.is_active ? "Active" : "Hidden"}
                        </Badge>
                      </TableCell>
                      <TableCell className="w-[20%] text-right">
                        <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Pencil />
                            Manage
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit service</DialogTitle>
                            <DialogDescription>
                              Update name, pricing, or visibility.
                            </DialogDescription>
                          </DialogHeader>
                          <form action={updateService} className="space-y-4">
                            <input type="hidden" name="id" value={service.id} />
                            <ServiceFormFields service={service} />
                            <DialogFooter>
                              <Button type="submit">
                                <Save />
                                Update service
                              </Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                      <form action={deleteService}>
                        <input type="hidden" name="id" value={service.id} />
                        <Button variant="destructive" size="sm" type="submit">
                          <Trash2 />
                          Delete
                        </Button>
                      </form>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-6 text-center">
            <div className="flex size-16 items-center justify-center rounded-xl border border-border bg-background shadow-sm">
              <PackageX className="size-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold">No services found yet</p>
              <p className="text-sm text-muted-foreground">
                Add a service to start building your catalog.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

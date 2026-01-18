"use client";

import { AdminShell } from "../../components/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, Package, Scissors, Search, ShoppingCart } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createAdminClient } from "@/utils/supabase/client";
import { createUnpaidTicket, payTicket } from "./actions";
import { toast } from "sonner";

type CatalogItem = {
  id: string;
  type: "service" | "product";
  code: string;
  name: string;
  price: number;
  meta: string;
  stockQty?: number | null;
};

type CartItem = {
  item: CatalogItem;
  qty: number;
};

type ShiftSummary = {
  id: string;
  shift_code: string | null;
  label: string | null;
  start_at: string | null;
  status: string | null;
};

type BarberSummary = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  is_active: boolean | null;
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 2,
  }).format(value);

const timeFormatter = new Intl.DateTimeFormat("en-MY", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const formatTime = (value: string | null) => {
  if (!value) {
    return "-";
  }
  return timeFormatter
    .formatToParts(new Date(value))
    .map((part) =>
      part.type === "dayPeriod" ? part.value.toUpperCase() : part.value
    )
    .join("");
};

const getLocalDateValue = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });

export default function Page() {
  const [isShiftOpen, setIsShiftOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [activeShift, setActiveShift] = useState<ShiftSummary | null>(null);
  const [shiftError, setShiftError] = useState<string | null>(null);
  const [shiftLoading, setShiftLoading] = useState(true);
  const [openShiftDialogOpen, setOpenShiftDialogOpen] = useState(false);
  const [closeShiftDialogOpen, setCloseShiftDialogOpen] = useState(false);
  const [openShiftLoading, setOpenShiftLoading] = useState(false);
  const [closeShiftLoading, setCloseShiftLoading] = useState(false);
  const [shiftActionError, setShiftActionError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "ewallet">("cash");
  const [ticketLoading, setTicketLoading] = useState(false);
  const [ticketError, setTicketError] = useState<string | null>(null);
  const [heldTicketId, setHeldTicketId] = useState<string | null>(null);
  const [heldTicketNo, setHeldTicketNo] = useState<string | null>(null);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [cashReceived, setCashReceived] = useState("");
  const [cartError, setCartError] = useState<string | null>(null);
  const [services, setServices] = useState<CatalogItem[]>([]);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [products, setProducts] = useState<CatalogItem[]>([]);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [productsLoading, setProductsLoading] = useState(true);
  const [barbers, setBarbers] = useState<BarberSummary[]>([]);
  const [barbersLoading, setBarbersLoading] = useState(true);
  const [barbersError, setBarbersError] = useState<string | null>(null);
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
  useEffect(() => {
    let isMounted = true;

    const fetchShift = async () => {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("shifts")
        .select("id, shift_code, label, start_at, status")
        .eq("status", "active")
        .is("end_at", null)
        .order("start_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      if (error) {
        console.error("Failed to load shift", error);
        setShiftError("Failed to load shift.");
        setActiveShift(null);
        setShiftLoading(false);
        return;
      }

      setActiveShift(data ?? null);
      setShiftError(null);
      setShiftLoading(false);

      setIsShiftOpen(Boolean(data));
    };

    const fetchServices = async () => {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("services")
        .select("id, name, price, duration_minutes, service_code, is_active")
        .eq("is_active", true)
        .order("service_code", { ascending: true });

      if (!isMounted) {
        return;
      }

      if (error) {
        console.error("Failed to load services", error);
        setServicesError("Failed to load services.");
        setServices([]);
        setServicesLoading(false);
        return;
      }

      const mapped =
        data?.map((service) => ({
          id: service.id,
          type: "service" as const,
          code: service.service_code || service.id,
          name: service.name,
          price: Number(service.price ?? 0),
          meta:
            typeof service.duration_minutes === "number"
              ? `${service.duration_minutes}m`
              : "-",
        })) ?? [];

      mapped.sort((a, b) => a.code.localeCompare(b.code));
      setServices(mapped);
      setServicesError(null);
      setServicesLoading(false);
    };

    const fetchProducts = async () => {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, stock_qty, sku, is_active")
        .eq("is_active", true)
        .order("sku", { ascending: true });

      if (!isMounted) {
        return;
      }

      if (error) {
        console.error("Failed to load products", error);
        setProductsError("Failed to load products.");
        setProducts([]);
        setProductsLoading(false);
        return;
      }

      const mapped =
        data?.map((product) => ({
          id: product.id,
          type: "product" as const,
          code: product.sku || product.id,
          name: product.name,
          price: Number(product.price ?? 0),
          meta:
            typeof product.stock_qty === "number"
              ? `Stock ${product.stock_qty}`
              : "Stock -",
          stockQty:
            typeof product.stock_qty === "number" ? product.stock_qty : null,
        })) ?? [];

      mapped.sort((a, b) => a.code.localeCompare(b.code));
      setProducts(mapped);
      setProductsError(null);
      setProductsLoading(false);
    };

    const fetchBarbers = async () => {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, is_active")
        .eq("role", "barber")
        .eq("is_active", true)
        .order("first_name", { ascending: true });

      if (!isMounted) {
        return;
      }

      if (error) {
        console.error("Failed to load barbers", error);
        setBarbersError("Failed to load barbers.");
        setBarbers([]);
        setBarbersLoading(false);
        return;
      }

      setBarbers(data ?? []);
      setBarbersError(null);
      setBarbersLoading(false);
    };

    fetchServices();
    fetchProducts();
    fetchShift();
    fetchBarbers();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenShift = async () => {
    if (isShiftOpen || activeShift) {
      setShiftActionError("Shift is already active.");
      return;
    }
    setOpenShiftLoading(true);
    setShiftActionError(null);
    const now = new Date();
    const shiftDateValue = getLocalDateValue();
    const supabase = createAdminClient();
    let nextLabel: string | null = null;

    const { data: lastShift, error: lastShiftError } = await supabase
      .from("shifts")
      .select("label")
      .eq("shift_date", shiftDateValue)
      .order("label", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastShiftError) {
      console.error("Failed to fetch last shift label", lastShiftError);
      const errorMessage =
        lastShiftError.message ||
        lastShiftError.details ||
        "Failed to open shift.";
      setShiftActionError(errorMessage);
      setOpenShiftLoading(false);
      return;
    }

    if (!lastShift?.label) {
      nextLabel = "A";
    } else {
      const lastChar = lastShift.label.trim().toUpperCase();
      const nextChar = lastChar.charCodeAt(0) + 1;
      if (nextChar > "Z".charCodeAt(0)) {
        setShiftActionError("Shift label exceeded Z for today.");
        setOpenShiftLoading(false);
        return;
      }
      nextLabel = String.fromCharCode(nextChar);
    }

    const { data, error } = await supabase
      .from("shifts")
      .insert({
        shift_date: shiftDateValue,
        label: nextLabel,
        start_at: now.toISOString(),
        end_at: null,
        status: "active",
      })
      .select("id, shift_code, label, start_at, status")
      .single();

    if (error) {
      console.error("Failed to open shift", error);
      const errorMessage =
        error.message || error.details || "Failed to open shift.";
      setShiftActionError(errorMessage);
      setOpenShiftLoading(false);
      return;
    }

    setActiveShift(data);
    setIsShiftOpen(true);
    setOpenShiftDialogOpen(false);
    setOpenShiftLoading(false);
  };

  const handleCloseShift = async () => {
    if (!activeShift?.id) {
      setShiftActionError("No active shift to close.");
      return;
    }
    setCloseShiftLoading(true);
    setShiftActionError(null);
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("shifts")
      .update({
        end_at: new Date().toISOString(),
        status: "inactive",
      })
      .eq("id", activeShift.id);

    if (error) {
      console.error("Failed to close shift", error);
      const errorMessage =
        error.message || error.details || "Failed to close shift.";
      setShiftActionError(errorMessage);
      setCloseShiftLoading(false);
      return;
    }

    setActiveShift(null);
    setIsShiftOpen(false);
    setCloseShiftDialogOpen(false);
    setCloseShiftLoading(false);
  };

  const filteredServices = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return services;
    }
    return services.filter((service) =>
      [service.code, service.name].some((value) =>
        value.toLowerCase().includes(trimmed)
      )
    );
  }, [query, services]);

  const filteredProducts = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return products;
    }
    return products.filter((product) =>
      [product.code, product.name].some((value) =>
        value.toLowerCase().includes(trimmed)
      )
    );
  }, [query, products]);

  const subtotal = useMemo(
    () =>
      cartItems.reduce(
        (total, entry) => total + entry.item.price * entry.qty,
        0
      ),
    [cartItems]
  );

  const addToCart = (item: CatalogItem) => {
    setCartItems((prev) => {
      const existing = prev.find((entry) => entry.item.id === item.id);
      if (existing) {
        if (
          item.type === "product" &&
          typeof item.stockQty === "number" &&
          existing.qty >= item.stockQty
        ) {
          setCartError("Insufficient stock.");
          return prev;
        }
        return prev.map((entry) =>
          entry.item.id === item.id
            ? { ...entry, qty: entry.qty + 1 }
            : entry
        );
      }
      if (
        item.type === "product" &&
        typeof item.stockQty === "number" &&
        item.stockQty <= 0
      ) {
        setCartError("Out of stock.");
        return prev;
      }
      return [...prev, { item, qty: 1 }];
    });
  };

  const updateQty = (itemId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((entry) => {
          if (entry.item.id !== itemId) {
            return entry;
          }
          const nextQty = entry.qty + delta;
          if (
            entry.item.type === "product" &&
            typeof entry.item.stockQty === "number" &&
            nextQty > entry.item.stockQty
          ) {
            setCartError("Insufficient stock.");
            return entry;
          }
          return { ...entry, qty: nextQty };
        })
        .filter((entry) => entry.qty > 0)
    );
  };

  const handleClearCart = () => {
    setCartItems([]);
    setCartError(null);
    setTicketError(null);
  };

  const handleOpenCheckout = () => {
    if (!activeShift?.id) {
      setTicketError("No active shift.");
      return;
    }
    if (cartItems.length === 0) {
      setTicketError("Cart is empty.");
      return;
    }
    setTicketError(null);
    setCheckoutDialogOpen(true);
  };

  const cashReceivedValue = Number(cashReceived || 0);
  const changeDue = cashReceivedValue - subtotal;

  const handleCharge = async () => {
    if (!activeShift?.id) {
      setTicketError("No active shift.");
      return;
    }
    if (cartItems.length === 0) {
      setTicketError("Cart is empty.");
      return;
    }
    if (paymentMethod === "cash" && changeDue < 0) {
      setTicketError("Cash received is insufficient.");
      return;
    }

    setTicketLoading(true);
    setTicketError(null);

    let ticketId = heldTicketId;
    let ticketNo = heldTicketNo;

    if (!ticketId) {
      const itemsPayload = cartItems.map((entry) => ({
        item_type: entry.item.type,
        service_id: entry.item.type === "service" ? entry.item.id : null,
        product_id: entry.item.type === "product" ? entry.item.id : null,
        qty: entry.qty,
        unit_price: entry.item.price,
      }));

      const result = await createUnpaidTicket({
        shiftId: activeShift.id,
        barberId: selectedBarberId,
        items: itemsPayload,
      });

      if (!result.ok) {
        setTicketError(result.error ?? "Failed to create ticket.");
        setTicketLoading(false);
        return;
      }

      ticketId = result.ticketId ?? null;
      ticketNo = result.ticketNo ?? null;
      setHeldTicketId(result.ticketId ?? null);
      setHeldTicketNo(result.ticketNo ?? null);
    }

    if (!ticketId) {
      setTicketError("Failed to create ticket.");
      setTicketLoading(false);
      return;
    }

    const payResult = await payTicket({
      ticketId,
      paymentMethod,
      cashReceived: paymentMethod === "cash" ? cashReceivedValue : null,
    });

    if (!payResult.ok) {
      setTicketError(payResult.error ?? "Failed to pay ticket.");
      setTicketLoading(false);
      return;
    }

    setCartItems([]);
    setHeldTicketId(null);
    setHeldTicketNo(null);
    setCashReceived("");
    setCheckoutDialogOpen(false);
    toast.success(`Payment confirmed for ${ticketNo ?? ticketId ?? "-"}.`, {
      position: "top-center",
    });
    setTicketLoading(false);
  };

  return (
    <AdminShell>
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        {isShiftOpen ? (
          <>
            <div className="space-y-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 text-sm">
                  <p className="font-semibold">
                    {shiftLoading
                      ? "Loading shift..."
                      : shiftError
                      ? "Shift unavailable"
                      : activeShift?.shift_code ||
                        activeShift?.label ||
                        activeShift?.id ||
                        "No shift code"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {shiftLoading
                      ? "Loading shift time..."
                      : shiftError
                      ? "Unable to load shift time"
                      : `Opened at ${formatTime(activeShift?.start_at ?? null)}`}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 lg:gap-4">
                  <Dialog
                    open={closeShiftDialogOpen}
                    onOpenChange={setCloseShiftDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button>Close shift</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Close shift</DialogTitle>
                        <DialogDescription>
                          Confirm closing the current shift.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Shift
                          </p>
                          <p className="font-semibold">
                            {activeShift?.shift_code ||
                              activeShift?.label ||
                              activeShift?.id ||
                              "-"}
                          </p>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Opened at
                            </p>
                            <p>{formatTime(activeShift?.start_at ?? null)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Close at
                            </p>
                            <p>{formatTime(new Date().toISOString())}</p>
                          </div>
                        </div>
                        {shiftActionError ? (
                          <p className="text-xs text-red-500">
                            {shiftActionError}
                          </p>
                        ) : null}
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setCloseShiftDialogOpen(false)}
                          disabled={closeShiftLoading}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleCloseShift}
                          disabled={closeShiftLoading}
                        >
                          {closeShiftLoading ? "Closing..." : "Close shift"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" size="icon" className="sm:hidden">
                    <Search className="size-4" />
                  </Button>
                  <div className="relative hidden sm:block sm:w-[280px]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search Service or Product"
                      className="h-9 pl-9"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-[1.4fr_0.9fr]">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <h3 className="text-sm font-semibold">Catalog</h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground">
                          Services
                        </p>
                        <div className="mt-3">
                          {servicesLoading ? (
                            <p className="text-xs text-muted-foreground">
                              Loading services...
                            </p>
                          ) : servicesError ? (
                            <p className="text-xs text-red-500">
                              {servicesError}
                            </p>
                          ) : filteredServices.length === 0 ? (
                            <div className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-8 py-4 text-center">
                              <div className="flex size-12 items-center justify-center rounded-xl border border-border bg-background shadow-sm">
                                <Scissors className="size-6 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold">
                                  No services available
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Services will appear here once they are added.
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                              {filteredServices.map((service) => (
                                <button
                                  key={service.code}
                                  type="button"
                                  className="flex flex-col items-start gap-2 rounded-xl border border-border bg-muted/40 px-5 py-4 text-left text-foreground transition hover:bg-muted/60"
                                  onClick={() => addToCart(service)}
                                >
                                  <span className="text-xs text-muted-foreground">
                                    {service.code}
                                  </span>
                                  <span className="text-sm font-semibold">
                                    {service.name}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatMoney(service.price)} · {service.meta}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-muted-foreground">
                          Products
                        </p>
                        <div className="mt-3">
                          {productsLoading ? (
                            <p className="text-xs text-muted-foreground">
                              Loading products...
                            </p>
                          ) : productsError ? (
                            <p className="text-xs text-red-500">
                              {productsError}
                            </p>
                          ) : filteredProducts.length === 0 ? (
                            <div className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-8 py-4 text-center">
                              <div className="flex size-12 items-center justify-center rounded-xl border border-border bg-background shadow-sm">
                                <Package className="size-6 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold">
                                  No products available
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Products will appear here once they are added.
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                              {filteredProducts.map((product) => (
                                <button
                                  key={product.code}
                                  type="button"
                                  className="flex flex-col items-start gap-2 rounded-xl border border-border bg-muted/40 px-5 py-4 text-left text-foreground transition hover:bg-muted/60"
                                  onClick={() => addToCart(product)}
                                >
                                  <span className="text-xs text-muted-foreground">
                                    {product.code}
                                  </span>
                                  <span className="text-sm font-semibold">
                                    {product.name}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatMoney(product.price)} · {product.meta}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-full bg-muted/60">
                          <ShoppingCart className="size-4 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold">Cart</h3>
                          <p className="text-xs text-muted-foreground">
                            {cartItems.length} item(s)
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearCart}
                        disabled={cartItems.length === 0}
                      >
                        Clear cart
                      </Button>
                    </div>
                    {cartItems.length === 0 ? (
                      <div className="mt-4 overflow-hidden rounded-2xl border border-dashed border-border bg-muted/30 px-5 py-4 text-left">
                        <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-center sm:text-left">
                          <div className="flex size-10 items-center justify-center rounded-full border border-border/70 bg-background shadow-sm">
                            <ShoppingCart className="size-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              Cart is empty
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Add items from the catalog to start a ticket.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-2">
                        {cartItems.map((entry) => (
                          <div
                            key={entry.item.id}
                            className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-5 py-4 text-sm text-foreground"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-semibold">
                                {entry.item.name}
                              </p>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <span>{entry.item.code}</span>
                                <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                                <span className="rounded-full bg-background/80 px-2 py-0.5 text-[11px] text-muted-foreground">
                                  {formatMoney(entry.item.price)}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                onClick={() => updateQty(entry.item.id, -1)}
                              >
                                -
                              </Button>
                              <span className="min-w-[20px] text-center text-sm font-medium text-foreground">
                                {entry.qty}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                onClick={() => updateQty(entry.item.id, 1)}
                                disabled={
                                  entry.item.type === "product" &&
                                  typeof entry.item.stockQty === "number" &&
                                  entry.qty >= entry.item.stockQty
                                }
                              >
                                +
                              </Button>
                            </div>
                          </div>
                        ))}
                        {cartError ? (
                          <p className="text-xs text-red-500">{cartError}</p>
                        ) : null}
                      </div>
                    )}
                    <Separator className="my-5" />
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Subtotal</span>
                        <span>{formatMoney(subtotal)}</span>
                      </div>
                      <div className="flex items-center justify-between font-semibold">
                        <span>Total</span>
                        <span>{formatMoney(subtotal)}</span>
                      </div>
                    </div>
                    <div className="mt-5 rounded-xl border border-border bg-muted/20 p-4">
                      <div className="flex items-center justify-between text-sm">
                        <Label>Checkout details</Label>
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-end">
                        <div className="grid gap-3">
                          <div>
                            <Label htmlFor="barber-id" className="text-xs">
                              Optional barber
                            </Label>
                            {barbersLoading ? (
                              <p className="mt-2 text-xs text-muted-foreground">
                                Loading barbers...
                              </p>
                            ) : barbersError ? (
                              <p className="mt-2 text-xs text-red-500">
                                {barbersError}
                              </p>
                            ) : (
                              <Select
                                value={selectedBarberId ?? "none"}
                                onValueChange={(value) =>
                                  setSelectedBarberId(
                                    value === "none" ? null : value
                                  )
                                }
                              >
                                <SelectTrigger
                                  id="barber-id"
                                  className="mt-2 h-10 min-h-10 w-full bg-background"
                                >
                                  <SelectValue placeholder="No barber selected" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">No barber</SelectItem>
                                  {barbers.length === 0 ? (
                                    <SelectItem value="no-barbers" disabled>
                                      No active barbers
                                    </SelectItem>
                                  ) : (
                                    barbers.map((barber) => (
                                      <SelectItem key={barber.id} value={barber.id}>
                                        {[barber.first_name, barber.last_name]
                                          .filter(Boolean)
                                          .join(" ") || "Unnamed barber"}
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        </div>
                        <Dialog
                          open={checkoutDialogOpen}
                          onOpenChange={(open) => {
                            setCheckoutDialogOpen(open);
                            if (!open) {
                              setCashReceived("");
                              setPaymentMethod("cash");
                              setTicketError(null);
                            }
                          }}
                        >
                          <Button
                            className="h-10 min-h-10 w-full"
                            disabled={
                              cartItems.length === 0 ||
                              ticketLoading ||
                              !activeShift
                            }
                            onClick={handleOpenCheckout}
                          >
                            {ticketLoading ? "Processing..." : "Checkout"}
                          </Button>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Charge customer</DialogTitle>
                              <DialogDescription>
                                Select payment method and confirm charge.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="rounded-2xl bg-muted/30 px-4 py-6 text-center">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                  Total
                                </p>
                                <p className="mt-2 text-3xl font-semibold">
                                  {formatMoney(subtotal)}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs">Payment method</Label>
                                <div className="grid gap-3 sm:grid-cols-2">
                                  <Button
                                    type="button"
                                    variant={paymentMethod === "cash" ? "default" : "outline"}
                                    className="h-11 w-full"
                                    onClick={() => setPaymentMethod("cash")}
                                  >
                                    Cash
                                  </Button>
                                  <Button
                                    type="button"
                                    variant={
                                      paymentMethod === "ewallet" ? "default" : "outline"
                                    }
                                    className="h-11 w-full"
                                    onClick={() => setPaymentMethod("ewallet")}
                                  >
                                    E-wallet
                                  </Button>
                                </div>
                              </div>
                              {paymentMethod === "cash" ? (
                                <div className="space-y-2">
                                  <Label htmlFor="cash-received" className="text-xs">
                                    Cash received
                                  </Label>
                                  <div className="rounded-2xl border border-border bg-background px-4 py-3 text-center">
                                    <Input
                                      id="cash-received"
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      placeholder="0.00"
                                      value={cashReceived}
                                      onChange={(event) =>
                                        setCashReceived(event.target.value)
                                      }
                                      className="h-12 border-0 p-0 text-center text-2xl font-semibold shadow-none focus-visible:ring-0"
                                    />
                                    <p className="mt-1 text-xs text-muted-foreground">
                                      Enter amount given by customer
                                    </p>
                                  </div>
                                  <div className="rounded-2xl bg-muted/30 px-4 py-5 text-center">
                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                      Balance
                                    </p>
                                    <p className="mt-2 text-2xl font-semibold">
                                      {changeDue >= 0
                                        ? formatMoney(changeDue)
                                        : `-${formatMoney(Math.abs(changeDue))}`}
                                    </p>
                                  </div>
                                </div>
                              ) : null}
                              {ticketError ? (
                                <p className="text-xs text-red-500">
                                  {ticketError}
                                </p>
                              ) : null}
                            </div>
                            <DialogFooter>
                              <Button
                                className="w-full"
                                onClick={handleCharge}
                                disabled={
                                  ticketLoading ||
                                  (paymentMethod === "cash" &&
                                    (cashReceived.trim() === "" || changeDue < 0))
                                }
                              >
                                {ticketLoading ? "Charging..." : "Charge"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                      {ticketError ? (
                        <p className="mt-2 text-xs text-red-500">
                          {ticketError}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold">Create ticket</h3>
              <p className="text-xs text-muted-foreground">
                Open a shift to start a new transaction.
              </p>
            </div>
            <div className="flex min-h-[240px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-muted/30 px-6 text-center">
              <div className="flex size-16 items-center justify-center rounded-xl border border-border bg-background shadow-sm">
                <Clock className="size-8 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold">No active shift yet</p>
                <p className="text-sm text-muted-foreground">
                  Click “Open shift” to unlock ticket creation.
                </p>
              </div>
              <Dialog
                open={openShiftDialogOpen}
                onOpenChange={setOpenShiftDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button>Open shift</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Open shift</DialogTitle>
                    <DialogDescription>Start a new shift for today.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="shift-date">Shift date</Label>
                      <Input
                        id="shift-date"
                        value={getLocalDateValue()}
                        readOnly
                      />
                    </div>
                    {shiftActionError ? (
                      <p className="text-xs text-red-500">{shiftActionError}</p>
                    ) : null}
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setOpenShiftDialogOpen(false)}
                      disabled={openShiftLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleOpenShift}
                      disabled={openShiftLoading}
                    >
                      {openShiftLoading ? "Opening..." : "Open shift"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}

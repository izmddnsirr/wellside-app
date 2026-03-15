"use client";

import { Button } from "@/components/ui/button";
import { CustomPriceDialog } from "@/components/custom-price-dialog";
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
import { deleteTicket } from "../tickets/actions";
import { toast } from "sonner";

type CatalogItem = {
  id: string;
  type: "service" | "product";
  code: string;
  name: string;
  basePrice: number | null;
  meta: string;
  stockQty?: number | null;
};

type CartItem = {
  item: CatalogItem;
  qty: number;
  unitPrice: number;
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

type ShiftMetrics = {
  ticketCount: number;
  paidSales: number;
  cashSales: number;
  ewalletSales: number;
};

const EMPTY_SHIFT_METRICS: ShiftMetrics = {
  ticketCount: 0,
  paidSales: 0,
  cashSales: 0,
  ewalletSales: 0,
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
      part.type === "dayPeriod" ? part.value.toUpperCase() : part.value,
    )
    .join("");
};

const formatDuration = (startAt: string | null, endAt: Date) => {
  if (!startAt) {
    return "-";
  }

  const startedAt = new Date(startAt);
  if (Number.isNaN(startedAt.getTime())) {
    return "-";
  }

  const totalMinutes = Math.floor(
    Math.max(endAt.getTime() - startedAt.getTime(), 0) / 60000,
  );
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
};

const getLocalDateValue = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });

type AddItemResult = {
  ok: boolean;
  unitPrice?: number;
  error?: string;
  requiresCustomPrice?: boolean;
  itemName?: string | null;
};

const addServiceToTicket = async ({
  serviceId,
  customPrice,
}: {
  serviceId: string;
  customPrice?: number | null;
}): Promise<AddItemResult> => {
  try {
    const supabase = createAdminClient();
    const { data: service, error: serviceError } = await supabase
      .from("services")
      .select("id, name, base_price, is_active")
      .eq("id", serviceId)
      .maybeSingle();

    if (serviceError || !service) {
      console.error("Failed to load service", serviceError);
      return { ok: false, error: "Failed to load service." };
    }

    if (!service.is_active) {
      return { ok: false, error: "Service is inactive." };
    }

    const basePrice =
      service.base_price === null ? null : Number(service.base_price);
    if (basePrice !== null && !Number.isFinite(basePrice)) {
      return { ok: false, error: "Invalid service price." };
    }

    // NULL base_price means a custom price is required.
    if (basePrice === null) {
      if (!customPrice || customPrice <= 0) {
        return {
          ok: false,
          requiresCustomPrice: true,
          itemName: service.name ?? "Service",
        };
      }
    }

    const unitPrice = basePrice === null ? Number(customPrice) : basePrice;

    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      return { ok: false, error: "Invalid price." };
    }

    return { ok: true, unitPrice };
  } catch (error) {
    console.error("Failed to add service to ticket", error);
    return { ok: false, error: "Failed to add service." };
  }
};

const addProductToTicket = async ({
  productId,
  customPrice,
}: {
  productId: string;
  customPrice?: number | null;
}): Promise<AddItemResult> => {
  try {
    const supabase = createAdminClient();
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, name, base_price, is_active")
      .eq("id", productId)
      .maybeSingle();

    if (productError || !product) {
      console.error("Failed to load product", productError);
      return { ok: false, error: "Failed to load product." };
    }

    if (!product.is_active) {
      return { ok: false, error: "Product is inactive." };
    }

    const basePrice =
      product.base_price === null ? null : Number(product.base_price);
    if (basePrice !== null && !Number.isFinite(basePrice)) {
      return { ok: false, error: "Invalid product price." };
    }

    // NULL base_price means a custom price is required.
    if (basePrice === null) {
      if (!customPrice || customPrice <= 0) {
        return {
          ok: false,
          requiresCustomPrice: true,
          itemName: product.name ?? "Product",
        };
      }
    }

    const unitPrice = basePrice === null ? Number(customPrice) : basePrice;

    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      return { ok: false, error: "Invalid price." };
    }

    return { ok: true, unitPrice };
  } catch (error) {
    console.error("Failed to add product to ticket", error);
    return { ok: false, error: "Failed to add product." };
  }
};

export function TransactionsClient() {
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
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "ewallet">(
    "cash",
  );
  const [ticketLoading, setTicketLoading] = useState(false);
  const [ticketError, setTicketError] = useState<string | null>(null);
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
  const [customPriceDialogOpen, setCustomPriceDialogOpen] = useState(false);
  const [pendingCustomItem, setPendingCustomItem] =
    useState<CatalogItem | null>(null);
  const [shiftMetrics, setShiftMetrics] =
    useState<ShiftMetrics>(EMPTY_SHIFT_METRICS);

  const loadShiftMetrics = async (shiftId: string) => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("tickets")
      .select("total_amount, payment_status, payment_method")
      .eq("shift_id", shiftId);

    if (error) {
      console.error("Failed to load shift metrics", error);
      return;
    }

    const nextMetrics = (data ?? []).reduce<ShiftMetrics>(
      (acc, ticket) => {
        acc.ticketCount += 1;

        const status = (ticket.payment_status ?? "").toLowerCase();
        const method = (ticket.payment_method ?? "").toLowerCase();
        const amount = Number(ticket.total_amount ?? 0);

        if (status === "paid") {
          acc.paidSales += amount;
          if (method === "cash") {
            acc.cashSales += amount;
          }
          if (method === "ewallet") {
            acc.ewalletSales += amount;
          }
        }

        return acc;
      },
      {
        ticketCount: 0,
        paidSales: 0,
        cashSales: 0,
        ewalletSales: 0,
      },
    );

    setShiftMetrics(nextMetrics);
  };
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

      if (data?.id) {
        void loadShiftMetrics(data.id);
      } else {
        setShiftMetrics(EMPTY_SHIFT_METRICS);
      }
    };

    const fetchServices = async () => {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("services")
        .select(
          "id, name, base_price, duration_minutes, service_code, is_active",
        )
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
          basePrice: (() => {
            const value =
              service.base_price === null ? null : Number(service.base_price);
            return value !== null && Number.isFinite(value) ? value : null;
          })(),
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
        .select("id, name, base_price, stock_qty, sku, is_active")
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
          basePrice: (() => {
            const value =
              product.base_price === null ? null : Number(product.base_price);
            return value !== null && Number.isFinite(value) ? value : null;
          })(),
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

  const displayedShiftMetrics = activeShift?.id
    ? shiftMetrics
    : EMPTY_SHIFT_METRICS;

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
      toast.error(errorMessage, { position: "top-center" });
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
        toast.error("Shift label exceeded Z for today.", {
          position: "top-center",
        });
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
      toast.error(errorMessage, { position: "top-center" });
      setOpenShiftLoading(false);
      return;
    }

    setActiveShift(data);
    void loadShiftMetrics(data.id);
    setIsShiftOpen(true);
    setOpenShiftDialogOpen(false);
    toast.success("Shift opened.", { position: "top-center" });
    setOpenShiftLoading(false);
  };

  const handleCloseShift = async () => {
    if (!activeShift?.id) {
      setShiftActionError("No active shift to close.");
      toast.error("No active shift to close.", { position: "top-center" });
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
      toast.error(errorMessage, { position: "top-center" });
      setCloseShiftLoading(false);
      return;
    }

    setActiveShift(null);
    setShiftMetrics(EMPTY_SHIFT_METRICS);
    setIsShiftOpen(false);
    setCloseShiftDialogOpen(false);
    toast.success("Shift closed.", { position: "top-center" });
    setCloseShiftLoading(false);
  };

  const filteredServices = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return services;
    }
    return services.filter((service) =>
      [service.code, service.name].some((value) =>
        value.toLowerCase().includes(trimmed),
      ),
    );
  }, [query, services]);

  const filteredProducts = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return products;
    }
    return products.filter((product) =>
      [product.code, product.name].some((value) =>
        value.toLowerCase().includes(trimmed),
      ),
    );
  }, [query, products]);

  const cartItemCount = useMemo(
    () => cartItems.reduce((total, entry) => total + entry.qty, 0),
    [cartItems],
  );

  const cartQtyByItemId = useMemo(() => {
    const map = new Map<string, number>();
    cartItems.forEach((entry) => {
      map.set(entry.item.id, (map.get(entry.item.id) ?? 0) + entry.qty);
    });
    return map;
  }, [cartItems]);

  const subtotal = useMemo(
    () =>
      cartItems.reduce(
        (total, entry) => total + entry.unitPrice * entry.qty,
        0,
      ),
    [cartItems],
  );

  const updateCartEntry = (
    item: CatalogItem,
    unitPrice: number,
    delta: number,
  ) => {
    const unitKey = unitPrice.toFixed(2);

    if (delta > 0) {
      const totalQtyForItem = cartItems.reduce((total, entry) => {
        if (entry.item.id !== item.id) {
          return total;
        }
        return total + entry.qty;
      }, 0);

      if (
        item.type === "product" &&
        typeof item.stockQty === "number" &&
        totalQtyForItem >= item.stockQty
      ) {
        setCartError("Insufficient stock.");
        return;
      }

      setCartItems((prev) => {
        const existing = prev.find(
          (entry) =>
            entry.item.id === item.id && entry.unitPrice.toFixed(2) === unitKey,
        );
        if (existing) {
          return prev.map((entry) =>
            entry.item.id === item.id && entry.unitPrice.toFixed(2) === unitKey
              ? { ...entry, qty: entry.qty + 1 }
              : entry,
          );
        }
        return [...prev, { item, qty: 1, unitPrice }];
      });
      return;
    }

    const entry = cartItems.find(
      (cartEntry) =>
        cartEntry.item.id === item.id &&
        cartEntry.unitPrice.toFixed(2) === unitKey,
    );

    if (!entry) {
      return;
    }

    setCartItems((prev) =>
      prev
        .map((cartEntry) => {
          if (
            cartEntry.item.id !== item.id ||
            cartEntry.unitPrice.toFixed(2) !== unitKey
          ) {
            return cartEntry;
          }
          const nextQty = cartEntry.qty - 1;
          return { ...cartEntry, qty: nextQty };
        })
        .filter((cartEntry) => cartEntry.qty > 0),
    );
  };

  const appendCartItem = (item: CatalogItem, unitPrice: number) => {
    const unitKey = unitPrice.toFixed(2);
    setCartItems((prev) => {
      const existing = prev.find(
        (entry) =>
          entry.item.id === item.id && entry.unitPrice.toFixed(2) === unitKey,
      );
      if (existing) {
        return prev.map((entry) =>
          entry.item.id === item.id && entry.unitPrice.toFixed(2) === unitKey
            ? { ...entry, qty: entry.qty + 1 }
            : entry,
        );
      }
      return [...prev, { item, qty: 1, unitPrice }];
    });
  };

  const handleAddCatalogItem = async (
    item: CatalogItem,
    customPrice?: number | null,
  ) => {
    if (!activeShift?.id) {
      setTicketError("No active shift.");
      return;
    }

    const currentQty = cartItems.reduce((total, entry) => {
      if (entry.item.id !== item.id) {
        return total;
      }
      return total + entry.qty;
    }, 0);

    if (
      item.type === "product" &&
      typeof item.stockQty === "number" &&
      currentQty >= item.stockQty
    ) {
      setCartError("Out of stock.");
      return;
    }

    const addResult =
      item.type === "service"
        ? await addServiceToTicket({
            serviceId: item.id,
            customPrice,
          })
        : await addProductToTicket({
            productId: item.id,
            customPrice,
          });

    if (!addResult.ok) {
      if (addResult.requiresCustomPrice) {
        setPendingCustomItem(item);
        setCustomPriceDialogOpen(true);
        return;
      }
      const message = addResult.error ?? "Failed to add item.";
      setCartError(message);
      toast.error(message, { position: "top-center" });
      return;
    }

    if (typeof addResult.unitPrice === "number") {
      appendCartItem(item, addResult.unitPrice);
    }
    setCartError(null);
  };

  const handleClearCart = async () => {
    setCartItems([]);
    setCartError(null);
    setTicketError(null);
  };

  const handleOpenCheckout = () => {
    if (!activeShift?.id) {
      setTicketError("No active shift.");
      return;
    }
    if (cartItemCount === 0) {
      setTicketError("Cart is empty.");
      return;
    }
    setTicketError(null);
    setCheckoutDialogOpen(true);
  };

  const cashReceivedValue = parseInt(cashReceived || "0", 10) / 100;
  const changeDue = cashReceivedValue - subtotal;
  const cashPresets = [50, 100];
  const isCashPayment = paymentMethod === "cash";
  const hasCashInput = cashReceivedValue > 0;
  const hasEnoughCash = !isCashPayment || (hasCashInput && changeDue >= 0);
  const chargeButtonLabel = !isCashPayment
    ? `Charge ${formatMoney(subtotal)}`
    : !hasCashInput || changeDue < 0
      ? "Insufficient Cash"
      : changeDue > 0
        ? `Return Change ${formatMoney(changeDue)}`
        : `Charge ${formatMoney(subtotal)}`;
  const shiftClosePreviewTime = new Date();
  const shiftDurationLabel = formatDuration(
    activeShift?.start_at ?? null,
    shiftClosePreviewTime,
  );

  const applyCashPreset = (value: number) => {
    const digits = String(Math.round(value * 100));
    setCashReceived(digits === "0" ? "" : digits);
    setTicketError(null);
  };

  const clearCashReceived = () => {
    setCashReceived("");
    setTicketError(null);
  };

  const appendCashInput = (token: string) => {
    setCashReceived((prev) => {
      const next = (prev + token).replace(/^0+/, "");
      if (next.length > 9) return prev;
      return next;
    });
    setTicketError(null);
  };

  const backspaceCashInput = () => {
    setCashReceived((prev) => prev.slice(0, -1));
    setTicketError(null);
  };

  const handleCharge = async () => {
    if (!activeShift?.id) {
      setTicketError("No active shift.");
      return;
    }
    if (cartItemCount === 0) {
      setTicketError("Cart is empty.");
      return;
    }
    if (paymentMethod === "cash" && changeDue < 0) {
      setTicketError("Cash received is insufficient.");
      return;
    }

    setTicketLoading(true);
    setTicketError(null);

    const itemsPayload = cartItems.map((entry) => ({
      item_type: entry.item.type,
      service_id: entry.item.type === "service" ? entry.item.id : null,
      product_id: entry.item.type === "product" ? entry.item.id : null,
      qty: entry.qty,
      unit_price: entry.unitPrice,
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

    const ticketId = result.ticketId ?? null;
    const ticketNo = result.ticketNo ?? null;

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
      const cleanup = await deleteTicket(ticketId);
      if (!cleanup.ok) {
        console.error("Failed to cleanup unpaid ticket", cleanup.error);
      }
      setTicketError(payResult.error ?? "Failed to pay ticket.");
      setTicketLoading(false);
      return;
    }

    setCartItems([]);
    setCashReceived("");
    setCheckoutDialogOpen(false);
    setShiftMetrics((prev) => ({
      ticketCount: prev.ticketCount + 1,
      paidSales: prev.paidSales + subtotal,
      cashSales:
        paymentMethod === "cash" ? prev.cashSales + subtotal : prev.cashSales,
      ewalletSales:
        paymentMethod === "ewallet"
          ? prev.ewalletSales + subtotal
          : prev.ewalletSales,
    }));
    toast.success(`Payment confirmed for ${ticketNo ?? ticketId ?? "-"}.`, {
      position: "top-center",
    });
    setTicketLoading(false);
  };

  const handleCustomPriceConfirm = async (price: number) => {
    if (!pendingCustomItem) {
      return;
    }
    await handleAddCatalogItem(pendingCustomItem, price);
    setPendingCustomItem(null);
    setCustomPriceDialogOpen(false);
  };

  return (
    <>
      <CustomPriceDialog
        open={customPriceDialogOpen}
        onOpenChange={(open) => {
          setCustomPriceDialogOpen(open);
          if (!open) {
            setPendingCustomItem(null);
          }
        }}
        title={pendingCustomItem?.name ?? "Custom price"}
        description="Enter a custom price for this item."
        onConfirm={handleCustomPriceConfirm}
      />
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
                          Review the shift summary before closing it.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-5 text-sm">
                        <div className="grid gap-4 sm:grid-cols-2">
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
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Duration
                            </p>
                            <p className="font-semibold">
                              {shiftDurationLabel}
                            </p>
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                            <p className="text-xs text-muted-foreground">
                              Opened at
                            </p>
                            <p className="font-semibold">
                              {formatTime(activeShift?.start_at ?? null)}
                            </p>
                          </div>
                          <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                            <p className="text-xs text-muted-foreground">
                              Close at
                            </p>
                            <p className="font-semibold">
                              {formatTime(shiftClosePreviewTime.toISOString())}
                            </p>
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                            <p className="text-xs text-muted-foreground">
                              Tickets
                            </p>
                            <p className="font-semibold">
                              {displayedShiftMetrics.ticketCount}
                            </p>
                          </div>
                          <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                            <p className="text-xs text-muted-foreground">
                              Paid sales
                            </p>
                            <p className="font-semibold">
                              {formatMoney(displayedShiftMetrics.paidSales)}
                            </p>
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                            <p className="text-xs text-muted-foreground">
                              Cash sales
                            </p>
                            <p className="font-semibold">
                              {formatMoney(displayedShiftMetrics.cashSales)}
                            </p>
                          </div>
                          <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                            <p className="text-xs text-muted-foreground">
                              E-wallet sales
                            </p>
                            <p className="font-semibold">
                              {formatMoney(displayedShiftMetrics.ewalletSales)}
                            </p>
                          </div>
                        </div>
                        {cartItemCount > 0 ? (
                          <p className="text-xs text-muted-foreground">
                            Current cart has {cartItemCount} item
                            {cartItemCount > 1 ? "s" : ""} worth{" "}
                            {formatMoney(subtotal)}. Complete or clear it before
                            closing if needed.
                          </p>
                        ) : null}
                        {shiftActionError ? (
                          <p className="text-xs text-red-500">
                            {shiftActionError}
                          </p>
                        ) : null}
                      </div>
                      <DialogFooter>
                        <Button
                          className="h-11 w-full"
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
                  <div className="relative hidden sm:block sm:w-70">
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
                            <div className="flex min-h-45 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-8 py-4 text-center">
                              <div className="flex size-12 items-center justify-center rounded-xl border border-border bg-background">
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
                            <div className="grid gap-4 grid-cols-3 md:grid-cols-4">
                              {filteredServices.map((service) => (
                                <button
                                  key={service.code}
                                  type="button"
                                  className="flex flex-col items-start gap-2 rounded-xl border border-border bg-muted/40 px-5 py-4 text-left text-foreground transition hover:bg-muted/60"
                                  onClick={() => handleAddCatalogItem(service)}
                                >
                                  {/* code hidden per request */}
                                  <span className="w-full truncate text-sm font-semibold">
                                    {service.name}
                                  </span>
                                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                    {service.basePrice === null ? (
                                      <p>Custom</p>
                                    ) : (
                                      <span>
                                        {formatMoney(service.basePrice)}
                                      </span>
                                    )}
                                    {/* <span className="text-muted-foreground">
                                      · {service.meta}
                                    </span> */}
                                  </div>
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
                            <div className="flex min-h-45 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-8 py-4 text-center">
                              <div className="flex size-12 items-center justify-center rounded-xl border border-border bg-background">
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
                            <div className="grid gap-4 grid-cols-3 md:grid-cols-4">
                              {filteredProducts.map((product) => (
                                <button
                                  key={product.code}
                                  type="button"
                                  className="flex flex-col items-start gap-2 rounded-xl border border-border bg-muted/40 px-5 py-4 text-left text-foreground transition hover:bg-muted/60"
                                  onClick={() => handleAddCatalogItem(product)}
                                >
                                  {/* code hidden per request */}
                                  <span className="w-full truncate text-sm font-semibold">
                                    {product.name}
                                  </span>
                                  <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                                    {product.basePrice === null ? (
                                      <p>Custom</p>
                                    ) : (
                                      <span>
                                        {formatMoney(product.basePrice)}
                                      </span>
                                    )}
                                    {/* <span className="text-muted-foreground">
                                      {product.meta}
                                    </span> */}
                                  </div>
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
                            {cartItemCount} item(s)
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearCart}
                        disabled={cartItemCount === 0}
                      >
                        Clear cart
                      </Button>
                    </div>
                    {cartItemCount === 0 ? (
                      <div className="mt-4 overflow-hidden rounded-2xl border border-dashed border-border bg-muted/30 px-5 py-4 text-left">
                        <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-center sm:text-left">
                          <div className="flex size-10 items-center justify-center rounded-full border border-border/70 bg-background">
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
                            key={`${entry.item.id}-${entry.unitPrice.toFixed(2)}`}
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
                                  {formatMoney(entry.unitPrice)}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                onClick={() =>
                                  updateCartEntry(
                                    entry.item,
                                    entry.unitPrice,
                                    -1,
                                  )
                                }
                              >
                                -
                              </Button>
                              <span className="min-w-5 text-center text-sm font-medium text-foreground">
                                {entry.qty}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                onClick={() =>
                                  updateCartEntry(
                                    entry.item,
                                    entry.unitPrice,
                                    1,
                                  )
                                }
                                disabled={
                                  entry.item.type === "product" &&
                                  typeof entry.item.stockQty === "number" &&
                                  (cartQtyByItemId.get(entry.item.id) ??
                                    entry.qty) >= entry.item.stockQty
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
                      <div className="mt-3 grid gap-3 sm:grid-cols-2 sm:items-end">
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
                                    value === "none" ? null : value,
                                  )
                                }
                              >
                                <SelectTrigger
                                  id="barber-id"
                                  className="mt-2 h-10 min-h-10 w-full overflow-hidden text-ellipsis whitespace-nowrap bg-background"
                                >
                                  <SelectValue placeholder="No barber selected" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">
                                    No barber
                                  </SelectItem>
                                  {barbers.length === 0 ? (
                                    <SelectItem value="no-barbers" disabled>
                                      No active barbers
                                    </SelectItem>
                                  ) : (
                                    barbers.map((barber) => (
                                      <SelectItem
                                        key={barber.id}
                                        value={barber.id}
                                      >
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
                              cartItemCount === 0 ||
                              ticketLoading ||
                              !activeShift
                            }
                            onClick={handleOpenCheckout}
                          >
                            {ticketLoading ? "Processing..." : "Checkout"}
                          </Button>
                          <DialogContent
                            className={`gap-0 overflow-hidden p-0 ${paymentMethod === "cash" ? "sm:max-w-5xl" : "sm:max-w-md"}`}
                            onInteractOutside={(event) =>
                              event.preventDefault()
                            }
                            onEscapeKeyDown={(event) => event.preventDefault()}
                          >
                            <DialogHeader className="border-b border-border/60 px-6 pb-4 pt-5">
                              <DialogTitle>Charge customer</DialogTitle>
                              <DialogDescription>
                                Select payment method and confirm charge.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 px-6 py-5">
                              <div
                                className={
                                  paymentMethod === "cash"
                                    ? "grid gap-4 sm:grid-cols-2"
                                    : "w-full"
                                }
                              >
                                <div className="flex min-h-26 flex-col items-center justify-center rounded-2xl border border-border/60 bg-muted/20 px-5 py-4 text-center">
                                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                    Total
                                  </p>
                                  <p className="mt-1 text-3xl font-semibold leading-none">
                                    {formatMoney(subtotal)}
                                  </p>
                                </div>
                                {paymentMethod === "cash" ? (
                                  <div className="flex min-h-26 flex-col items-center justify-center rounded-2xl border border-border/60 bg-muted/20 px-5 py-4 text-center">
                                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                      Balance
                                    </p>
                                    <p
                                      className={`mt-1 text-3xl font-semibold leading-none ${
                                        changeDue < 0
                                          ? "text-red-400"
                                          : changeDue > 0
                                            ? "text-emerald-400"
                                            : "text-foreground"
                                      }`}
                                    >
                                      {changeDue >= 0
                                        ? formatMoney(changeDue)
                                        : `-${formatMoney(Math.abs(changeDue))}`}
                                    </p>
                                  </div>
                                ) : null}
                              </div>

                              <div className="space-y-4 p-0">
                                {paymentMethod === "ewallet" ? (
                                  <div className="grid w-full grid-cols-2 gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      className="h-11 w-full text-sm font-semibold"
                                      onClick={() => setPaymentMethod("cash")}
                                    >
                                      Cash
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="default"
                                      className="h-11 w-full text-sm font-semibold"
                                      onClick={() =>
                                        setPaymentMethod("ewallet")
                                      }
                                    >
                                      E-wallet
                                    </Button>
                                  </div>
                                ) : null}

                                {paymentMethod === "cash" ? (
                                  <>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="grid grid-cols-2 gap-2">
                                        <Button
                                          type="button"
                                          variant="default"
                                          className="h-11 w-full text-sm font-semibold"
                                          onClick={() =>
                                            setPaymentMethod("cash")
                                          }
                                        >
                                          Cash
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          className="h-11 w-full text-sm font-semibold"
                                          onClick={() =>
                                            setPaymentMethod("ewallet")
                                          }
                                        >
                                          E-wallet
                                        </Button>
                                      </div>
                                      <div className="grid grid-cols-3 gap-2">
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant={
                                            cashReceived.trim() !== "" &&
                                            Math.abs(
                                              cashReceivedValue - subtotal,
                                            ) < 0.001
                                              ? "default"
                                              : "outline"
                                          }
                                          className="h-11 w-full text-sm font-semibold"
                                          onClick={() =>
                                            applyCashPreset(subtotal)
                                          }
                                        >
                                          Exact
                                        </Button>
                                        {cashPresets.map((preset) => (
                                          <Button
                                            key={preset}
                                            type="button"
                                            size="sm"
                                            variant={
                                              cashReceived.trim() !== "" &&
                                              Math.abs(
                                                cashReceivedValue - preset,
                                              ) < 0.001
                                                ? "default"
                                                : "outline"
                                            }
                                            className="h-11 w-full text-sm font-semibold"
                                            onClick={() =>
                                              applyCashPreset(preset)
                                            }
                                          >
                                            RM {preset}
                                          </Button>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="grid gap-4 lg:grid-cols-2 lg:items-stretch">
                                      <div
                                        id="cash-received"
                                        className="flex min-h-63 items-center justify-center rounded-2xl border border-border/60 bg-muted/30 px-6 text-center"
                                      >
                                        <p className="text-4xl font-semibold leading-none">
                                          RM{" "}
                                          {(
                                            parseInt(cashReceived || "0", 10) /
                                            100
                                          ).toFixed(2)}
                                        </p>
                                      </div>
                                      <div className="space-y-2">
                                        <div className="grid grid-cols-3 gap-2">
                                          {[
                                            "1",
                                            "2",
                                            "3",
                                            "4",
                                            "5",
                                            "6",
                                            "7",
                                            "8",
                                            "9",
                                          ].map((key) => (
                                            <Button
                                              key={key}
                                              type="button"
                                              variant="outline"
                                              className="h-11 w-full text-sm font-semibold"
                                              onClick={() =>
                                                appendCashInput(key)
                                              }
                                            >
                                              {key}
                                            </Button>
                                          ))}
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                          {["0", "00"].map((key) => (
                                            <Button
                                              key={key}
                                              type="button"
                                              variant="outline"
                                              className="h-11 w-full text-sm font-semibold"
                                              onClick={() =>
                                                appendCashInput(key)
                                              }
                                            >
                                              {key}
                                            </Button>
                                          ))}
                                          <Button
                                            type="button"
                                            variant="default"
                                            className="h-11 w-full text-sm font-semibold"
                                            onClick={backspaceCashInput}
                                          >
                                            ⌫
                                          </Button>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2">
                                          <Button
                                            type="button"
                                            variant="outline"
                                            className="h-11 w-full text-sm font-semibold"
                                            onClick={clearCashReceived}
                                          >
                                            Clear
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </>
                                ) : null}
                              </div>

                              {ticketError ? (
                                <p className="text-xs text-red-500">
                                  {ticketError}
                                </p>
                              ) : null}
                            </div>
                            <DialogFooter className="border-t border-border/60 px-6 py-4">
                              <Button
                                className="h-11 w-full"
                                onClick={handleCharge}
                                disabled={
                                  ticketLoading ||
                                  (paymentMethod === "cash" && !hasEnoughCash)
                                }
                              >
                                {ticketLoading
                                  ? "Charging..."
                                  : chargeButtonLabel}
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
            <div className="flex min-h-60 flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-muted/30 px-6 text-center">
              <div className="flex size-16 items-center justify-center rounded-xl border border-border bg-background">
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
                    <DialogDescription>
                      Start a new shift for today.
                    </DialogDescription>
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
    </>
  );
}

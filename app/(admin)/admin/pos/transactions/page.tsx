"use client";

import { AdminShell } from "../../components/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ShoppingCart, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";

type CatalogItem = {
  id: string;
  type: "service" | "product";
  code: string;
  name: string;
  price: number;
  meta: string;
};

type CartItem = {
  item: CatalogItem;
  qty: number;
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 2,
  }).format(value);

export default function Page() {
  const [isShiftOpen, setIsShiftOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const services: CatalogItem[] = [
    {
      id: "service-haircut",
      type: "service",
      code: "S001",
      name: "Haircut",
      price: 25,
      meta: "30m",
    },
    {
      id: "service-beard-trim",
      type: "service",
      code: "S002",
      name: "Beard Trim",
      price: 15,
      meta: "15m",
    },
    {
      id: "service-haircut-wash",
      type: "service",
      code: "S003",
      name: "Haircut + Wash",
      price: 45,
      meta: "45m",
    },
    {
      id: "service-kids-cut",
      type: "service",
      code: "S004",
      name: "Kids Cut",
      price: 20,
      meta: "25m",
    },
    {
      id: "service-skin-fade",
      type: "service",
      code: "S005",
      name: "Skin Fade",
      price: 35,
      meta: "40m",
    },
    {
      id: "service-hair-color",
      type: "service",
      code: "S006",
      name: "Hair Color",
      price: 60,
      meta: "60m",
    },
  ];
  const products: CatalogItem[] = [
    {
      id: "product-pomade",
      type: "product",
      code: "P001",
      name: "Pomade",
      price: 30,
      meta: "Stok 15",
    },
    {
      id: "product-razor-refill",
      type: "product",
      code: "P002",
      name: "Razor Refill",
      price: 12,
      meta: "Stok 20",
    },
    {
      id: "product-sea-salt",
      type: "product",
      code: "P003",
      name: "Sea Salt Spray",
      price: 28,
      meta: "Stok 8",
    },
    {
      id: "product-clay",
      type: "product",
      code: "P004",
      name: "Texturizing Clay",
      price: 38,
      meta: "Stok 10",
    },
    {
      id: "product-shampoo",
      type: "product",
      code: "P005",
      name: "Daily Shampoo",
      price: 22,
      meta: "Stok 18",
    },
    {
      id: "product-beard-oil",
      type: "product",
      code: "P006",
      name: "Beard Oil",
      price: 25,
      meta: "Stok 12",
    },
  ];

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
        return prev.map((entry) =>
          entry.item.id === item.id
            ? { ...entry, qty: entry.qty + 1 }
            : entry
        );
      }
      return [...prev, { item, qty: 1 }];
    });
  };

  const updateQty = (itemId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((entry) =>
          entry.item.id === itemId
            ? { ...entry, qty: entry.qty + delta }
            : entry
        )
        .filter((entry) => entry.qty > 0)
    );
  };

  return (
    <AdminShell>
      <div className="flex flex-col gap-3 px-3 md:px-4 lg:px-6">
        {isShiftOpen ? (
          <>
            <Card>
              <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <CardTitle>Create ticket</CardTitle>
                  <CardDescription>Build a cart for checkout.</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-3 lg:gap-4">
                  <div className="text-right text-sm">
                    <p className="font-semibold">SHIFT-2024-09-12</p>
                    <p className="text-xs text-muted-foreground">Opened at 9:00 AM</p>
                  </div>
                  <Button onClick={() => setIsShiftOpen(false)}>Close shift</Button>
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
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-[1.4fr_0.9fr]">
                <div className="space-y-3">
                  <div className="rounded-2xl border border-border p-3">
                    <h3 className="text-sm font-semibold">Catalog</h3>
                    <div className="mt-3 space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground">
                          Services
                        </p>
                        <div className="mt-2 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                          {filteredServices.map((service) => (
                            <button
                              key={service.code}
                              type="button"
                              className="flex flex-col items-start gap-2 rounded-xl bg-slate-950 px-4 py-3 text-left text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                              onClick={() => addToCart(service)}
                            >
                              <span className="text-xs text-slate-300">
                                {service.code}
                              </span>
                              <span className="text-sm font-semibold">
                                {service.name}
                              </span>
                              <span className="text-xs text-slate-300">
                                {formatMoney(service.price)} · {service.meta}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-muted-foreground">
                          Products
                        </p>
                        <div className="mt-2 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                          {filteredProducts.map((product) => (
                            <button
                              key={product.code}
                              type="button"
                              className="flex flex-col items-start gap-2 rounded-xl bg-slate-950 px-4 py-3 text-left text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                              onClick={() => addToCart(product)}
                            >
                              <span className="text-xs text-slate-300">
                                {product.code}
                              </span>
                              <span className="text-sm font-semibold">
                                {product.name}
                              </span>
                              <span className="text-xs text-slate-300">
                                {formatMoney(product.price)} · {product.meta}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="h-full rounded-2xl border border-border bg-white p-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold">Cart</h3>
                        <p className="text-xs text-muted-foreground">
                          {cartItems.length} item(s)
                        </p>
                      </div>
                      <div className="flex size-9 items-center justify-center rounded-full bg-muted/60">
                        <ShoppingCart className="size-4 text-muted-foreground" />
                      </div>
                    </div>
                    {cartItems.length === 0 ? (
                      <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
                        <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full border border-border bg-white shadow-sm">
                          <ShoppingCart className="size-4 text-muted-foreground" />
                        </div>
                        Cart is empty. Add items from the catalog.
                      </div>
                    ) : (
                      <div className="mt-4 space-y-3">
                        {cartItems.map((entry) => (
                          <div
                            key={entry.item.id}
                            className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-3 py-2 text-sm"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-medium">
                                {entry.item.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {entry.item.code} · {formatMoney(entry.item.price)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => updateQty(entry.item.id, -1)}
                              >
                                -
                              </Button>
                              <span className="min-w-[18px] text-center text-sm">
                                {entry.qty}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => updateQty(entry.item.id, 1)}
                              >
                                +
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <Separator className="my-4" />
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
                    <div className="mt-4 rounded-xl border border-border bg-muted/20 p-3">
                      <div className="flex items-center justify-between text-sm">
                        <Label htmlFor="payment-method">Payment Method</Label>
                        <span className="text-xs text-muted-foreground">Required</span>
                      </div>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2 sm:items-stretch">
                        <Select defaultValue="cash">
                          <SelectTrigger
                            id="payment-method"
                            className="h-10 min-h-10 w-full bg-white"
                          >
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="ewallet">E-wallet</SelectItem>
                            <SelectItem value="card">Card</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          className="h-10 min-h-10 w-full"
                          disabled={cartItems.length === 0}
                        >
                          Checkout
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        className="mt-3 h-10 w-full border-dashed"
                        onClick={() => setCartItems([])}
                        disabled={cartItems.length === 0}
                      >
                        Clear Cart
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Create ticket</CardTitle>
              <CardDescription>
                Open a shift to start a new transaction.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-6 text-center">
                <p className="text-sm font-semibold">No active shift yet</p>
                <p className="text-sm text-muted-foreground">
                  Click “Open shift” to unlock ticket creation.
                </p>
                <Button onClick={() => setIsShiftOpen(true)}>
                  Open shift
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminShell>
  );
}

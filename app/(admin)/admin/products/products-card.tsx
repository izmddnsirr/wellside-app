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
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type Product = {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  base_price: number | null;
  stock_qty: number | null;
  is_active: boolean;
};

type ProductsCardProps = {
  products: Product[];
  errorMessage?: string | null;
  createProduct: (formData: FormData) => Promise<void>;
  updateProduct: (formData: FormData) => Promise<void>;
  archiveProduct: (formData: FormData) => Promise<void>;
  reactivateProduct: (formData: FormData) => Promise<void>;
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

const formatStock = (value: number | null) => {
  if (value === null || Number.isNaN(value)) {
    return "-";
  }
  return value.toString();
};

const getStockStatus = (stockQty: number | null, isActive: boolean) => {
  if (!isActive) {
    return {
      label: "Deactivated",
      className:
        "bg-slate-100 text-slate-900 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
      dot: "bg-slate-500",
    };
  }
  if (stockQty === null || Number.isNaN(stockQty)) {
    return {
      label: "Active",
      className:
        "bg-blue-100 text-blue-900 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
      dot: "bg-blue-500",
    };
  }
  if (stockQty <= 0) {
    return {
      label: "Out of stock",
      className:
        "bg-rose-100 text-rose-900 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800",
      dot: "bg-rose-500",
    };
  }
  if (stockQty <= 5) {
    return {
      label: "Low stock",
      className:
        "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
      dot: "bg-amber-500",
    };
  }
  return {
    label: "In stock",
    className:
      "bg-emerald-100 text-emerald-900 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
    dot: "bg-emerald-500",
  };
};

const ProductFormFields = ({ product }: { product?: Product | null }) => (
  <>
    <div className="space-y-2">
      <Label htmlFor={product ? `name-${product.id}` : "product-name"}>
        Product name
      </Label>
      <Input
        id={product ? `name-${product.id}` : "product-name"}
        name="name"
        defaultValue={product?.name ?? ""}
        placeholder="Pomade"
        required
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor={product ? `price-${product.id}` : "product-price"}>
        Base price (RM)
      </Label>
      <Input
        id={product ? `price-${product.id}` : "product-price"}
        name="base_price"
        type="number"
        min="0.01"
        step="0.01"
        defaultValue={product?.base_price ?? ""}
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor={product ? `stock-${product.id}` : "product-stock"}>
        Stock quantity
      </Label>
      <Input
        id={product ? `stock-${product.id}` : "product-stock"}
        name="stock_qty"
        type="number"
        min="0"
        step="1"
        defaultValue={product?.stock_qty ?? ""}
        required
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor={product ? `desc-${product.id}` : "product-description"}>
        Description
      </Label>
      <Input
        id={product ? `desc-${product.id}` : "product-description"}
        name="description"
        defaultValue={product?.description ?? ""}
        placeholder="Matte finish, medium hold"
      />
    </div>
  </>
);

export function ProductsCard({
  products,
  errorMessage,
  createProduct,
  updateProduct,
  archiveProduct,
  reactivateProduct,
}: ProductsCardProps) {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState({ status: "all" });
  const [sort, setSort] = useState("sku_asc");
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
      "product-created": "Product created.",
      "product-updated": "Product updated.",
      "product-deactivated": "Product deactivated.",
      "product-reactivated": "Product reactivated.",
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

  const filteredProducts = useMemo(() => {
    const matchesSearch = (product: Product) => {
      if (!debouncedSearch) {
        return true;
      }
      const nameMatch = product.name.toLowerCase().includes(debouncedSearch);
      const skuMatch =
        product.sku?.toLowerCase().includes(debouncedSearch) ?? false;
      const descriptionMatch =
        product.description?.toLowerCase().includes(debouncedSearch) ?? false;
      return nameMatch || skuMatch || descriptionMatch;
    };

    const matchesStatus = (product: Product) => {
      if (showInactive) {
        return !product.is_active;
      }
      if (!product.is_active) {
        return false;
      }
      if (filters.status === "all") {
        return true;
      }
      if (filters.status === "active") {
        return product.is_active;
      }
      const stockQty = product.stock_qty;
      if (filters.status === "in_stock") {
        return stockQty !== null && stockQty > 5;
      }
      if (filters.status === "low_stock") {
        return stockQty !== null && stockQty > 0 && stockQty <= 5;
      }
      if (filters.status === "out_of_stock") {
        return stockQty !== null && stockQty <= 0;
      }
      return true;
    };

    const filtered = products.filter(
      (product) => matchesSearch(product) && matchesStatus(product),
    );

    const sorted = filtered.slice();
    sorted.sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      const skuA = (a.sku ?? "").toLowerCase();
      const skuB = (b.sku ?? "").toLowerCase();
      const priceA = a.base_price ?? 0;
      const priceB = b.base_price ?? 0;
      const stockA = a.stock_qty ?? 0;
      const stockB = b.stock_qty ?? 0;
      if (sort === "sku_asc") {
        return skuA.localeCompare(skuB);
      }
      if (sort === "sku_desc") {
        return skuB.localeCompare(skuA);
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
      if (sort === "stock_desc") {
        return stockB - stockA;
      }
      if (sort === "stock_asc") {
        return stockA - stockB;
      }
      return 0;
    });

    return sorted;
  }, [debouncedSearch, filters.status, products, showInactive, sort]);

  const resetFilters = () => {
    setFilters({ status: "all" });
    setSort("sku_asc");
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
              <SelectTrigger className="h-9 w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="in_stock">In stock</SelectItem>
                <SelectItem value="low_stock">Low stock</SelectItem>
                <SelectItem value="out_of_stock">Out of stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="h-9 w-50">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sku_asc">SKU: A {"->"} Z</SelectItem>
                <SelectItem value="sku_desc">SKU: Z {"->"} A</SelectItem>
                <SelectItem value="name_asc">Name: A {"->"} Z</SelectItem>
                <SelectItem value="name_desc">Name: Z {"->"} A</SelectItem>
                <SelectItem value="price_desc">
                  Price: High {"->"} Low
                </SelectItem>
                <SelectItem value="price_asc">
                  Price: Low {"->"} High
                </SelectItem>
                <SelectItem value="stock_desc">
                  Stock: High {"->"} Low
                </SelectItem>
                <SelectItem value="stock_asc">
                  Stock: Low {"->"} High
                </SelectItem>
              </SelectContent>
            </Select>
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="product-search"
                placeholder="Search products"
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
                  Add product
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add product</DialogTitle>
                  <DialogDescription>
                    Create a new product entry.
                  </DialogDescription>
                </DialogHeader>
                <form action={createProduct} className="space-y-4">
                  <input type="hidden" name="is_active" value="on" />
                  <ProductFormFields />
                  <DialogFooter>
                    <Button type="submit">
                      <Save />
                      Save product
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
                showInactive
                  ? "Show active products"
                  : "Show deactivated products"
              }
              title={
                showInactive
                  ? "Show active products"
                  : "Show deactivated products"
              }
            >
              {showInactive ? <Eye /> : <EyeOff />}
            </Button>
          </div>
        </div>
      </div>
      {errorMessage ? (
        <p className="text-sm text-red-600">{errorMessage}</p>
      ) : filteredProducts.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="border-border/60">
                <TableHead className="w-[16%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  SKU
                </TableHead>
                <TableHead className="w-[28%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Product
                </TableHead>
                <TableHead className="w-[16%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Price
                </TableHead>
                <TableHead className="w-[16%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Stock
                </TableHead>
                <TableHead className="w-[16%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="w-[16%] px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const status = getStockStatus(
                  product.stock_qty,
                  product.is_active,
                );
                const isActive = product.is_active;
                return (
                  <TableRow
                    key={product.id}
                    className="bg-background hover:bg-muted/50"
                  >
                    <TableCell className="w-[16%] px-4 py-3 text-muted-foreground">
                      {product.sku || "-"}
                    </TableCell>
                    <TableCell className="w-[28%] px-4 py-3 font-semibold text-foreground">
                      {product.name}
                    </TableCell>
                    <TableCell className="w-[16%] px-4 py-3 text-foreground">
                      {formatPrice(product.base_price)}
                    </TableCell>
                    <TableCell className="w-[16%] px-4 py-3 text-muted-foreground">
                      {formatStock(product.stock_qty)}
                    </TableCell>
                    <TableCell className="w-[16%] px-4 py-3">
                      <Badge variant="outline" className={status.className}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="w-[20%] px-4 py-3">
                      <div className="flex justify-end">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="icon">
                              <Pencil />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Manage product</DialogTitle>
                              <DialogDescription>
                                {isActive
                                  ? "Update details or deactivate this product."
                                  : "Update details or reactivate this product."}
                              </DialogDescription>
                            </DialogHeader>
                            <form
                              id={`product-update-${product.id}`}
                              action={updateProduct}
                              className="space-y-4"
                            >
                              <input
                                type="hidden"
                                name="id"
                                value={product.id}
                              />
                              <input
                                type="hidden"
                                name="is_active"
                                value={product.is_active ? "on" : "off"}
                              />
                              <ProductFormFields product={product} />
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
                                        Deactivate product
                                      </DialogTitle>
                                      <DialogDescription>
                                        This will hide the product from the POS
                                        catalog but keep existing tickets
                                        intact.
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="text-sm text-foreground">
                                      <p>
                                        Product:{" "}
                                        <span className="font-medium text-foreground">
                                          {product.name}
                                        </span>
                                      </p>
                                    </div>
                                    <form action={archiveProduct}>
                                      <input
                                        type="hidden"
                                        name="id"
                                        value={product.id}
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
                                  action={reactivateProduct}
                                  className="inline-flex"
                                >
                                  <input
                                    type="hidden"
                                    name="id"
                                    value={product.id}
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
                                form={`product-update-${product.id}`}
                              >
                                <Save />
                                Update product
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
        <div className="flex min-h-60 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/30 px-6 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl border border-border bg-background">
            <Package className="size-8 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold">
              {debouncedSearch
                ? "No products match your search"
                : "No products found yet"}
            </p>
            <p className="text-sm text-muted-foreground">
              {debouncedSearch
                ? "Try a different name, SKU, or description."
                : "Add a product to start tracking inventory."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  stock_qty: number | null;
  is_active: boolean;
};

type ProductsCardProps = {
  products: Product[];
  errorMessage?: string | null;
  createProduct: (formData: FormData) => Promise<void>;
  updateProduct: (formData: FormData) => Promise<void>;
  deleteProduct: (formData: FormData) => Promise<void>;
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

const formatStock = (value: number | null) => {
  if (value === null || Number.isNaN(value)) {
    return "-";
  }
  return value.toString();
};

const getStockStatus = (stockQty: number | null, isActive: boolean) => {
  if (!isActive) {
    return {
      label: "Hidden",
      className: "bg-slate-100 text-slate-900 border-slate-200",
    };
  }
  if (stockQty === null || Number.isNaN(stockQty)) {
    return {
      label: "Active",
      className: "bg-blue-100 text-blue-900 border-blue-200",
    };
  }
  if (stockQty <= 0) {
    return {
      label: "Out of stock",
      className: "bg-rose-100 text-rose-900 border-rose-200",
    };
  }
  if (stockQty <= 5) {
    return {
      label: "Low stock",
      className: "bg-amber-100 text-amber-900 border-amber-200",
    };
  }
  return {
    label: "In stock",
    className: "bg-emerald-100 text-emerald-900 border-emerald-200",
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
        Price (RM)
      </Label>
      <Input
        id={product ? `price-${product.id}` : "product-price"}
        name="price"
        type="number"
        min="0"
        step="0.01"
        defaultValue={product?.price ?? ""}
        required
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
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        name="is_active"
        defaultChecked={product?.is_active ?? true}
        className="h-4 w-4 rounded border border-input"
      />
      Active product
    </label>
  </>
);

export function ProductsCard({
  products,
  errorMessage,
  createProduct,
  updateProduct,
  deleteProduct,
}: ProductsCardProps) {
  const [query, setQuery] = useState("");
  const filteredProducts = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return products;
    }
    return products.filter((product) => {
      const nameMatch = product.name.toLowerCase().includes(trimmed);
      const descriptionMatch =
        product.description?.toLowerCase().includes(trimmed) ?? false;
      return nameMatch || descriptionMatch;
    });
  }, [products, query]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product inventory</CardTitle>
        <CardDescription>Update pricing and stock quantities.</CardDescription>
        <CardAction>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="product-search"
                placeholder="Search products"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-56 pl-9"
              />
            </div>
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
                  <DialogDescription>Create a new product entry.</DialogDescription>
                </DialogHeader>
                <form action={createProduct} className="space-y-4">
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
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        {errorMessage ? (
          <p className="text-sm text-red-600">{errorMessage}</p>
        ) : filteredProducts.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[32%]">Product</TableHead>
                <TableHead className="w-[16%]">Price</TableHead>
                <TableHead className="w-[16%]">Stock</TableHead>
                <TableHead className="w-[16%]">Status</TableHead>
                <TableHead className="w-[20%] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const status = getStockStatus(
                  product.stock_qty,
                  product.is_active
                );
                return (
                  <TableRow key={product.id}>
                    <TableCell className="w-[32%] font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell className="w-[16%]">
                      {formatPrice(product.price)}
                    </TableCell>
                    <TableCell className="w-[16%]">
                      {formatStock(product.stock_qty)}
                    </TableCell>
                    <TableCell className="w-[16%]">
                      <Badge variant="outline" className={status.className}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="w-[20%] text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Pencil />
                              Update
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit product</DialogTitle>
                              <DialogDescription>
                                Update name, pricing, or stock levels.
                              </DialogDescription>
                            </DialogHeader>
                            <form action={updateProduct} className="space-y-4">
                              <input type="hidden" name="id" value={product.id} />
                              <ProductFormFields product={product} />
                              <DialogFooter>
                                <Button type="submit">
                                  <Save />
                                  Update product
                                </Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>
                        <form action={deleteProduct}>
                          <input type="hidden" name="id" value={product.id} />
                          <Button variant="destructive" size="sm" type="submit">
                            <Trash2 />
                            Delete
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/30 px-6 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl border border-border bg-background shadow-sm">
              <PackageX className="size-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold">No products found yet</p>
              <p className="text-sm text-muted-foreground">
                Add a product to start tracking inventory.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

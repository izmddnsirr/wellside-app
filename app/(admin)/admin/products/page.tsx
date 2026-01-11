import { AdminShell } from "../components/admin-shell";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ProductsCard } from "./products-card";
import { createAdminClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

const createProduct = async (formData: FormData) => {
  "use server";
  const supabase = await createAdminClient();
  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("price"));
  const stockQty = Number(formData.get("stock_qty"));
  const isActive = formData.get("is_active") === "on";
  const description = String(formData.get("description") ?? "").trim();

  if (!name || Number.isNaN(price) || Number.isNaN(stockQty)) {
    return;
  }

  const { error } = await supabase.from("products").insert({
    name,
    price,
    stock_qty: stockQty,
    is_active: isActive,
    description: description.length ? description : null,
  });

  if (error) {
    console.error("Failed to create product", error);
    return;
  }

  revalidatePath("/admin/products");
  redirect("/admin/products");
};

const updateProduct = async (formData: FormData) => {
  "use server";
  const supabase = await createAdminClient();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("price"));
  const stockQty = Number(formData.get("stock_qty"));
  const isActive = formData.get("is_active") === "on";
  const description = String(formData.get("description") ?? "").trim();

  if (!id || !name || Number.isNaN(price) || Number.isNaN(stockQty)) {
    return;
  }

  const { error } = await supabase
    .from("products")
    .update({
      name,
      price,
      stock_qty: stockQty,
      is_active: isActive,
      description: description.length ? description : null,
    })
    .eq("id", id);

  if (error) {
    console.error("Failed to update product", error);
    return;
  }

  revalidatePath("/admin/products");
  redirect("/admin/products");
};

const deleteProduct = async (formData: FormData) => {
  "use server";
  const supabase = await createAdminClient();
  const id = String(formData.get("id") ?? "");
  if (!id) {
    return;
  }

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    console.error("Failed to delete product", error);
    return;
  }

  revalidatePath("/admin/products");
  redirect("/admin/products");
};

export default async function Page() {
  const supabase = await createAdminClient();
  const { data: products, error } = await supabase
    .from("products")
    .select(
      "id, name, sku, description, price, stock_qty, is_active, created_at"
    )
    .order("created_at", { ascending: false });
  const errorMessage = error
    ? "Failed to load products. Please try again."
    : null;

  return (
    <AdminShell
      title="Products"
      description="Manage product catalog and inventory."
    >
      <div className="px-4 lg:px-6">
        <ProductsCard
          products={products ?? []}
          errorMessage={errorMessage}
          createProduct={createProduct}
          updateProduct={updateProduct}
          deleteProduct={deleteProduct}
        />
      </div>
    </AdminShell>
  );
}

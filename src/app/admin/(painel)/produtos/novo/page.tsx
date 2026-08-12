import { prisma } from "@/lib/db";
import { createProduct } from "@/lib/admin-actions";
import { AdminPageHeader, AdminCard } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const [categories, brands] = await Promise.all([
    prisma.category.findMany({ orderBy: { order: "asc" }, include: { attributeDefs: { orderBy: { order: "asc" }, select: { id: true, key: true, name: true, type: true } } } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <AdminPageHeader title="Novo produto" subtitle="Cadastre um produto com ficha técnica dinâmica." back="/admin/produtos/" />
      <AdminCard>
        <ProductForm
          categories={categories}
          brands={brands}
          saveAction={createProduct}
          initial={{ name: "", slug: "", brandId: "", categoryId: categories[0]?.id ?? "", summary: "", description: "", imageUrl: "/images/products/celulares.svg", releaseDate: "", rating: 0, reviewCount: 0, featured: false, isNew: false, attributes: {}, pros: "", cons: "" }}
        />
      </AdminCard>
    </>
  );
}

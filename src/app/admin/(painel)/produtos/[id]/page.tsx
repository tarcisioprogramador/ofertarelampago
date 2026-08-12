import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { updateProduct } from "@/lib/admin-actions";
import { AdminPageHeader, AdminCard } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const [product, categories, brands] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { attributes: { include: { attribute: true } }, images: { orderBy: { order: "asc" } }, pros: true, tags: { include: { tag: true } } },
    }),
    prisma.category.findMany({ orderBy: { order: "asc" }, include: { attributeDefs: { orderBy: { order: "asc" }, select: { id: true, key: true, name: true, type: true } } } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!product) notFound();

  return (
    <>
      <AdminPageHeader title={`Editar: ${product.name}`} back="/admin/produtos/" />
      <AdminCard>
        <ProductForm
          categories={categories}
          brands={brands}
          saveAction={updateProduct.bind(null, product.id)}
          initial={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            brandId: product.brandId,
            categoryId: product.categoryId,
            summary: product.summary ?? "",
            description: product.description ?? "",
            imageUrl: product.imageUrl ?? "",
            galleryImages: product.images.map((i) => i.url),
            releaseDate: product.releaseDate ? product.releaseDate.toISOString().slice(0, 10) : "",
            rating: product.rating,
            reviewCount: product.reviewCount,
            featured: product.featured,
            isNew: product.isNew,
            attributes: Object.fromEntries(product.attributes.map((a) => [a.attribute.key, a.value])),
            pros: product.pros.filter((p) => p.type === "PRO").map((p) => p.text).join("\n"),
            cons: product.pros.filter((p) => p.type === "CON").map((p) => p.text).join("\n"),
            tags: product.tags.map((t) => t.tag.name).join(", "),
          }}
        />
      </AdminCard>
    </>
  );
}

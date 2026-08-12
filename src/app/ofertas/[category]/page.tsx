import OffersPage from "../page";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ category: string }> };

export default async function OffersCategoryPage({ params }: Props) {
  const { category } = await params;
  return <OffersPage params={Promise.resolve({ category })} />;
}

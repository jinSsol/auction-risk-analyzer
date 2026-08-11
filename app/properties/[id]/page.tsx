import { items } from "../../auction-data";
import { PropertyDetailClient } from "./PropertyDetailClient";

export function generateStaticParams() {
  return items.map((item) => ({ id: item.id }));
}

export default async function PropertyDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PropertyDetailClient id={id} />;
}

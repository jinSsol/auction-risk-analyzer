import { PropertyForm } from "../../PropertyForm";

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PropertyForm mode="edit" itemId={id} />;
}

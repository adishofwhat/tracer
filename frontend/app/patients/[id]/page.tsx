import { notFound } from "next/navigation";
import { getPatientById } from "@/app/lib/dataLoader";
import PatientDetailView from "@/app/components/PatientDetailView";

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patient = getPatientById(id);
  if (!patient) notFound();

  return <PatientDetailView patient={patient} />;
}

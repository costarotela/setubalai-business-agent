import HistorialView from "./historial-view";

export default async function PacienteHistorialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <HistorialView id={id} />;
}

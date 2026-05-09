import type { SessionData } from "@/types";

export function countMappedFields(session: SessionData) {
  return session.mappings.filter(
    (mapping) => !mapping.isDynamic && mapping.sourceColumn,
  ).length;
}

export function getSessionSummary(session: SessionData) {
  const targetMappings = session.mappings.filter((mapping) => {
    return !mapping.isDynamic;
  });
  const dynamicCount = session.mappings.length - targetMappings.length;
  const mapped = countMappedFields(session);
  const missing = targetMappings.length - mapped;
  const mappingStatus = missing
    ? `${missing} campos necesitan revisión.`
    : "Todos los campos objetivo están mapeados.";
  const dynamicStatus = dynamicCount
    ? `Agregué ${dynamicCount} campos dinámicos al JSON.`
    : null;

  return [
    `Cargué ${session.rowCount} productos desde ${session.originalFileName}.`,
    `Mapeé ${mapped}/${targetMappings.length} campos objetivo.`,
    mappingStatus,
    dynamicStatus,
  ]
    .filter(Boolean)
    .join(" ");
}

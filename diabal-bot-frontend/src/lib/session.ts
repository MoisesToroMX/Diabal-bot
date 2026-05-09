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
    ? `${missing} fields need review.`
    : "All target fields mapped.";
  const dynamicStatus = dynamicCount
    ? `Added ${dynamicCount} dynamic JSON fields.`
    : null;

  return [
    `Loaded ${session.rowCount} products from ${session.originalFileName}.`,
    `Mapped ${mapped}/${targetMappings.length} target fields.`,
    mappingStatus,
    dynamicStatus,
  ]
    .filter(Boolean)
    .join(" ");
}

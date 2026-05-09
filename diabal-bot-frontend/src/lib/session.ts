import type { SessionData } from "@/types";

export function countMappedFields(session: SessionData) {
  return session.mappings.filter((mapping) => mapping.sourceColumn).length;
}

export function getSessionSummary(session: SessionData) {
  const mapped = countMappedFields(session);
  const missing = session.mappings.length - mapped;
  const mappingStatus = missing
    ? `${missing} fields need review.`
    : "All target fields mapped.";

  return [
    `Loaded ${session.rowCount} products from ${session.originalFileName}.`,
    `Mapped ${mapped}/${session.mappings.length} JSON fields.`,
    mappingStatus,
  ].join(" ");
}

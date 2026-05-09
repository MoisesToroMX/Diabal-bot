import type { SessionData } from "@/types";

import { describe, expect, it } from "vitest";

import { countMappedFields, getSessionSummary } from "./session";

function makeSession(overrides: Partial<SessionData> = {}): SessionData {
  return {
    ok: true,
    sessionId: "test-room",
    originalFileName: "products.csv",
    uploadedAt: "2026-05-08T00:00:00.000Z",
    confirmedAt: null,
    products: [],
    mappings: [
      {
        field: "product_name",
        label: "Product name",
        description: "",
        sourceColumn: "Product",
        sourceIndex: 0,
        confidence: 1,
      },
      {
        field: "supplier_email",
        label: "Supplier email",
        description: "",
        sourceColumn: null,
        sourceIndex: null,
        confidence: 0,
      },
      {
        field: "qa_owner",
        label: "QA Owner",
        description: "",
        sourceColumn: "QA Owner",
        sourceIndex: 2,
        confidence: 1,
        isDynamic: true,
      },
    ],
    warnings: [],
    headerRow: 1,
    rowCount: 3,
    downloadUrl: "/api/sessions/test-room/final-json",
    ...overrides,
  };
}

describe("session helpers", () => {
  it("counts mapped fields", () => {
    expect(countMappedFields(makeSession())).toBe(1);
  });

  it("summarizes upload state", () => {
    const summary = getSessionSummary(makeSession());

    expect(summary).toContain("Cargué 3 productos desde products.csv.");
    expect(summary).toContain("Mapeé 1/2 campos objetivo.");
    expect(summary).toContain("1 campos necesitan revisión.");
    expect(summary).toContain("Agregué 1 campos dinámicos al JSON.");
  });
});

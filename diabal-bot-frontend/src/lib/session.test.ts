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

    expect(summary).toContain("Loaded 3 products from products.csv.");
    expect(summary).toContain("Mapped 1/2 JSON fields.");
    expect(summary).toContain("1 fields need review.");
  });
});

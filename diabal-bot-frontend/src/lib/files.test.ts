import { describe, expect, it } from "vitest";

import { formatFileSize, isAcceptedProductFile } from "./files";

describe("file helpers", () => {
  it("accepts CSV and XLSX files only", () => {
    expect(isAcceptedProductFile("products.csv")).toBe(true);
    expect(isAcceptedProductFile("products.XLSX")).toBe(true);
    expect(isAcceptedProductFile("products.xls")).toBe(false);
    expect(isAcceptedProductFile("notes.txt")).toBe(false);
  });

  it("formats file sizes for upload messages", () => {
    expect(formatFileSize(0)).toBe("1 KB");
    expect(formatFileSize(1536)).toBe("2 KB");
  });
});

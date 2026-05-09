import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";

import { getDownloadUrl, getSession, uploadProductFile } from "./uploader";

vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedAxios = vi.mocked(axios);

describe("uploader helper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uploads a product file with the session header", async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { ok: true, sessionId: "room-1" },
    });

    const file = new File(["product_name\nDress"], "products.csv", {
      type: "text/csv",
    });

    const result = await uploadProductFile(file, "room-1");

    expect(result.sessionId).toBe("room-1");
    expect(mockedAxios.post).toHaveBeenCalledWith(
      "http://localhost:3001/api/upload",
      expect.any(FormData),
      {
        headers: {
          "x-session-id": "room-1",
        },
      },
    );
  });

  it("loads session data by id", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { ok: true, sessionId: "room-2" },
    });

    const result = await getSession("room-2");

    expect(result.sessionId).toBe("room-2");
    expect(mockedAxios.get).toHaveBeenCalledWith(
      "http://localhost:3001/api/sessions/room-2",
    );
  });

  it("builds final JSON download URL", () => {
    expect(getDownloadUrl("room 2")).toBe(
      "http://localhost:3001/api/sessions/room%202/final-json",
    );
  });
});

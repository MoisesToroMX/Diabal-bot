import type { SessionData } from "@/types";

import axios from "axios";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ChatView from "./chat";

const socketMock = vi.hoisted(() => ({
  emit: vi.fn(),
  off: vi.fn(),
  on: vi.fn(),
}));

vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));
vi.mock("socket.io-client", () => ({
  io: vi.fn(() => socketMock),
}));

const mockedAxios = vi.mocked(axios);

function makeSession(overrides: Partial<SessionData> = {}): SessionData {
  return {
    ok: true,
    sessionId: "1",
    originalFileName: "products.csv",
    uploadedAt: "2026-05-08T00:00:00.000Z",
    confirmedAt: null,
    products: [{ product_name: "Dress", qa_owner: "Mariana" }],
    mappings: [
      {
        field: "product_name",
        label: "Product name",
        description: "",
        sourceColumn: "Product",
        sourceIndex: 0,
        confidence: 0.95,
      },
      {
        field: "qa_owner",
        label: "QA Owner",
        description: "Dynamic field imported from the source file.",
        sourceColumn: "QA Owner",
        sourceIndex: 1,
        confidence: 1,
        isDynamic: true,
      },
    ],
    warnings: [],
    headerRow: 1,
    rowCount: 1,
    downloadUrl: "/api/sessions/1/final-json",
    ...overrides,
  };
}

function renderChat() {
  return render(
    <MemoryRouter
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
      initialEntries={["/chats/1"]}
    >
      <Routes>
        <Route element={<ChatView />} path="/chats/:chatId" />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ChatView", () => {
  beforeEach(() => {
    let messageId = 0;

    vi.clearAllMocks();
    mockedAxios.get.mockResolvedValue({ data: null });
    vi.stubGlobal("crypto", {
      randomUUID: () => `message-id-${messageId++}`,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("keeps file details behind a header button", async () => {
    mockedAxios.get.mockResolvedValue({ data: makeSession() });

    renderChat();

    expect(screen.queryByText("Field mapping")).not.toBeInTheDocument();

    const detailsButton = await screen.findByTestId("file-details-button");

    await waitFor(() =>
      expect(detailsButton).toHaveTextContent("File details"),
    );
    expect(screen.getByTestId("messages-scroll")).toHaveClass(
      "overflow-y-auto",
    );
    expect(screen.getByTestId("messages-scroll")).toHaveClass("flex-1");
    expect(screen.getByTestId("messages-scroll")).toHaveClass("min-h-0");
    expect(screen.queryByText("products.csv")).not.toBeInTheDocument();

    await userEvent.click(detailsButton);

    expect(await screen.findByTestId("file-details-panel")).toBeInTheDocument();
    expect(screen.getByText("products.csv")).toBeInTheDocument();
    expect(screen.getByText("Field mapping")).toBeInTheDocument();
    expect(screen.getByText("dynamic")).toBeInTheDocument();
  });

  it("uploads a dropped CSV file from the chat surface", async () => {
    const droppedSession = makeSession({ originalFileName: "drop.csv" });

    mockedAxios.get.mockResolvedValue({ data: null });
    mockedAxios.post.mockResolvedValue({ data: droppedSession });

    renderChat();

    const dropZone = await screen.findByTestId("chat-drop-zone");
    const file = new File(["product_name\nDress"], "drop.csv", {
      type: "text/csv",
    });

    fireEvent.dragEnter(dropZone, {
      dataTransfer: { files: [file], types: ["Files"] },
    });

    expect(screen.getByText("Drop file to upload")).toBeInTheDocument();

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file], types: ["Files"] },
    });

    await waitFor(() =>
      expect(mockedAxios.post).toHaveBeenCalledWith(
        "http://localhost:3001/api/upload",
        expect.any(FormData),
        { headers: { "x-session-id": "1" } },
      ),
    );
    expect(
      await screen.findByText(/Loaded 1 products from drop\.csv\./),
    ).toBeInTheDocument();
  });
});

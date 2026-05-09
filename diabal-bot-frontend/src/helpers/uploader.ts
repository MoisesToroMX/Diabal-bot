import type { SessionData } from "@/types";

import axios from "axios";

const apiBaseUrl = import.meta.env.VITE_API_URL || "";

function buildUrl(path: string) {
  return `${apiBaseUrl}${path}`;
}

export async function uploadProductFile(file: File, sessionId: string) {
  const formData = new FormData();

  formData.append("file", file);

  const response = await axios.post<SessionData>(
    buildUrl("/api/upload"),
    formData,
    {
      headers: {
        "x-session-id": sessionId,
      },
    },
  );

  return response.data;
}

export async function getSession(sessionId: string) {
  const response = await axios.get<SessionData | undefined>(
    buildUrl(`/api/sessions/${encodeURIComponent(sessionId)}`),
  );

  return response.data ?? null;
}

export function getDownloadUrl(sessionId: string) {
  return buildUrl(`/api/sessions/${encodeURIComponent(sessionId)}/final-json`);
}

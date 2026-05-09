import { io, Socket } from "socket.io-client";

import { AuthPayload } from "@/types";

let socket: Socket | null = null;

export function getSocket(auth?: AuthPayload) {
  const url = import.meta.env.VITE_SOCKET_URL || window.location.origin;

  if (!socket) {
    socket = io(url, {
      transports: ["websocket"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      auth,
    });
  }

  return socket!;
}

import { WebSocketServer } from "ws";
import { verifyToken } from "./auth.js";

// Map of projectId → Set<WebSocket>
const rooms = new Map();

export function setupWebSocket(server) {
  const wss = new WebSocketServer({ noServer: true });

  // Handle HTTP upgrade
  server.on("upgrade", (req, socket, head) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname !== "/ws") {
      socket.destroy();
      return;
    }

    const token = url.searchParams.get("token");
    const projectId = url.searchParams.get("projectId");

    if (!token || !projectId) {
      socket.destroy();
      return;
    }

    const user = verifyToken(token);
    if (!user) {
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      ws.projectId = projectId;
      ws.user = user;
      wss.emit("connection", ws);
    });
  });

  wss.on("connection", (ws) => {
    const { projectId } = ws;

    // Join room
    if (!rooms.has(projectId)) {
      rooms.set(projectId, new Set());
    }
    rooms.get(projectId).add(ws);

    ws.on("close", () => {
      const room = rooms.get(projectId);
      if (room) {
        room.delete(ws);
        if (room.size === 0) rooms.delete(projectId);
      }
    });

    ws.on("error", () => {
      ws.close();
    });
  });

  return wss;
}

// Broadcast an event to all clients watching a project
export function broadcast(projectId, event, data) {
  const room = rooms.get(projectId);
  if (!room) return;

  const message = JSON.stringify({ event, data });
  for (const ws of room) {
    if (ws.readyState === 1) {
      ws.send(message);
    }
  }
}

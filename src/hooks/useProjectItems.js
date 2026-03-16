import { useState, useEffect, useCallback, useRef } from "react";
import { apiFetch, getToken } from "../lib/api";
import { itemToRow, rowToItem } from "../lib/serializers";
import { today } from "../data/constants";

export function useProjectItems(projectId) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef(null);

  // Fetch items + subscribe to WebSocket
  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    // Fetch items (server returns items with embedded comments)
    apiFetch(`/projects/${projectId}/items`)
      .then((rows) => {
        setItems(rows.map((row) => rowToItem(row, row.comments || [])));
      })
      .catch((err) => {
        console.error("Failed to fetch items:", err);
      })
      .finally(() => setLoading(false));

    // WebSocket for realtime
    const token = getToken();
    if (!token) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(
      `${protocol}//${window.location.host}/ws?projectId=${projectId}&token=${token}`
    );

    ws.onmessage = (event) => {
      try {
        const { event: evt, data } = JSON.parse(event.data);

        if (evt === "item:upsert") {
          const item = rowToItem(data, data.comments || []);
          setItems((prev) => {
            const idx = prev.findIndex((i) => i.id === item.id);
            if (idx >= 0) return prev.map((v, j) => (j === idx ? item : v));
            return [...prev, item];
          });
        } else if (evt === "item:delete") {
          setItems((prev) => prev.filter((i) => i.id !== data.id));
        } else if (evt === "comment:insert") {
          setItems((prev) =>
            prev.map((i) => {
              if (i.id !== data.itemId) return i;
              return {
                ...i,
                comments: [...(i.comments || []), data.comment],
              };
            })
          );
        }
      } catch (err) {
        console.error("WS message parse error:", err);
      }
    };

    ws.onerror = () => ws.close();
    wsRef.current = ws;

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [projectId]);

  // Save item (create or update)
  const saveItem = useCallback(
    async (item) => {
      const row = itemToRow(item, projectId);
      const existing = items.find((i) => i.id === item.id);

      if (existing) {
        await apiFetch(`/projects/${projectId}/items/${item.id}`, {
          method: "PATCH",
          body: JSON.stringify(row),
        });
      } else {
        await apiFetch(`/projects/${projectId}/items`, {
          method: "POST",
          body: JSON.stringify(row),
        });
      }

      // Optimistic update
      setItems((prev) => {
        const idx = prev.findIndex((i) => i.id === item.id);
        if (idx >= 0) return prev.map((v, j) => (j === idx ? item : v));
        return [...prev, item];
      });
    },
    [projectId, items]
  );

  // Delete item
  const deleteItem = useCallback(
    async (id) => {
      await apiFetch(`/projects/${projectId}/items/${id}`, {
        method: "DELETE",
      });
      setItems((prev) => prev.filter((i) => i.id !== id));
    },
    [projectId]
  );

  // Add comment
  const addComment = useCallback(
    async (itemId, comment) => {
      await apiFetch(`/projects/${projectId}/items/${itemId}/comments`, {
        method: "POST",
        body: JSON.stringify(comment),
      });

      // Also update the item's activity_log and updated_at
      const item = items.find((i) => i.id === itemId);
      if (item) {
        const newLog = [
          ...(item.activityLog || []),
          { actor: comment.author, action: "Added a comment", timestamp: comment.timestamp },
        ];
        const row = itemToRow({ ...item, activityLog: newLog, updatedAt: today() }, projectId);
        await apiFetch(`/projects/${projectId}/items/${itemId}`, {
          method: "PATCH",
          body: JSON.stringify({ activity_log: row.activity_log, updated_at: row.updated_at }),
        });
      }

      // Optimistic update
      setItems((prev) =>
        prev.map((i) => {
          if (i.id !== itemId) return i;
          return {
            ...i,
            comments: [...(i.comments || []), comment],
            activityLog: [
              ...(i.activityLog || []),
              { actor: comment.author, action: "Added a comment", timestamp: comment.timestamp },
            ],
            updatedAt: today(),
          };
        })
      );
    },
    [projectId, items]
  );

  // Change status
  const changeStatus = useCallback(
    async (id, newStatus, actor) => {
      const item = items.find((i) => i.id === id);
      if (!item) return;

      const logEntry = {
        actor,
        action: `Changed status from ${item.status} → ${newStatus}`,
        timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
      };
      const newLog = [...(item.activityLog || []), logEntry];

      await apiFetch(`/projects/${projectId}/items/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: newStatus,
          activity_log: JSON.stringify(newLog),
          updated_at: today(),
        }),
      });

      // Optimistic update
      setItems((prev) =>
        prev.map((i) => {
          if (i.id !== id) return i;
          return { ...i, status: newStatus, updatedAt: today(), activityLog: newLog };
        })
      );
    },
    [projectId, items]
  );

  return { items, loading, saveItem, deleteItem, addComment, changeStatus };
}

import { Router } from "express";
import { randomUUID } from "crypto";
import pool from "../db.js";
import { authMiddleware } from "../auth.js";
import { broadcast } from "../ws.js";

const router = Router({ mergeParams: true });
router.use(authMiddleware);

// GET /api/projects/:pid/items — returns items with embedded comments
router.get("/", async (req, res) => {
  const { pid } = req.params;
  try {
    const itemsResult = await pool.query(
      "SELECT * FROM items WHERE project_id = $1 ORDER BY created_at",
      [pid]
    );

    const commentsResult = await pool.query(
      `SELECT c.* FROM comments c
       JOIN items i ON c.item_id = i.id
       WHERE i.project_id = $1
       ORDER BY c.timestamp`,
      [pid]
    );

    // Group comments by item_id
    const commentsByItem = {};
    for (const c of commentsResult.rows) {
      if (!commentsByItem[c.item_id]) commentsByItem[c.item_id] = [];
      commentsByItem[c.item_id].push({
        author: c.author,
        text: c.text,
        timestamp: c.timestamp,
      });
    }

    // Attach comments to items
    const items = itemsResult.rows.map((item) => ({
      ...item,
      comments: commentsByItem[item.id] || [],
    }));

    res.json(items);
  } catch (err) {
    console.error("List items error:", err);
    res.status(500).json({ error: "Failed to list items" });
  }
});

// POST /api/projects/:pid/items
router.post("/", async (req, res) => {
  const { pid } = req.params;
  const {
    id, type, title, module, source, owner, assignee, status,
    tags, related_items, activity_log, type_fields,
    created_at, updated_at,
  } = req.body;

  try {
    const { rows } = await pool.query(
      `INSERT INTO items
        (id, project_id, type, title, module, source, owner, assignee, status,
         tags, related_items, activity_log, type_fields, created_at, updated_at, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [
        id, pid, type, title || "", module || "", source || "", owner || "", assignee || "", status || "",
        JSON.stringify(tags || []),
        JSON.stringify(related_items || []),
        JSON.stringify(activity_log || []),
        JSON.stringify(type_fields || {}),
        created_at || "", updated_at || "",
        req.user.id,
      ]
    );

    const item = { ...rows[0], comments: [] };
    broadcast(pid, "item:upsert", item);
    res.status(201).json(item);
  } catch (err) {
    console.error("Create item error:", err);
    res.status(500).json({ error: "Failed to create item" });
  }
});

// PATCH /api/projects/:pid/items/:id
router.patch("/:id", async (req, res) => {
  const { pid, id } = req.params;
  const fields = req.body;

  const allowed = [
    "type", "title", "module", "source", "owner", "assignee", "status",
    "tags", "related_items", "activity_log", "type_fields",
    "created_at", "updated_at",
  ];
  const sets = [];
  const values = [];
  let idx = 1;

  for (const key of allowed) {
    if (fields[key] !== undefined) {
      sets.push(`${key} = $${idx}`);
      const val = typeof fields[key] === "object" ? JSON.stringify(fields[key]) : fields[key];
      values.push(val);
      idx++;
    }
  }

  if (sets.length === 0) {
    return res.status(400).json({ error: "No valid fields to update" });
  }

  values.push(id);
  values.push(pid);

  try {
    const { rows } = await pool.query(
      `UPDATE items SET ${sets.join(", ")} WHERE id = $${idx} AND project_id = $${idx + 1} RETURNING *`,
      values
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    // Fetch comments for the updated item
    const commentsResult = await pool.query(
      "SELECT author, text, timestamp FROM comments WHERE item_id = $1 ORDER BY timestamp",
      [id]
    );

    const item = { ...rows[0], comments: commentsResult.rows };
    broadcast(pid, "item:upsert", item);
    res.json(item);
  } catch (err) {
    console.error("Update item error:", err);
    res.status(500).json({ error: "Failed to update item" });
  }
});

// DELETE /api/projects/:pid/items/:id
router.delete("/:id", async (req, res) => {
  const { pid, id } = req.params;
  try {
    const { rowCount } = await pool.query(
      "DELETE FROM items WHERE id = $1 AND project_id = $2",
      [id, pid]
    );
    if (rowCount === 0) {
      return res.status(404).json({ error: "Item not found" });
    }
    broadcast(pid, "item:delete", { id });
    res.status(204).end();
  } catch (err) {
    console.error("Delete item error:", err);
    res.status(500).json({ error: "Failed to delete item" });
  }
});

// POST /api/projects/:pid/items/batch — bulk create (note import, templates)
// Entries may carry status/owner/tags/type_fields; imported notes default to
// "pending_review" so they show up in the triage queue.
router.post("/batch", async (req, res) => {
  const { pid } = req.params;
  const { items: entries, source, actor, action } = req.body;

  if (!Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({ error: "items array required" });
  }

  const ts = new Date().toISOString().replace("T", " ").slice(0, 19);
  const dateStr = new Date().toISOString().slice(0, 10);
  const created = [];

  try {
    for (const entry of entries) {
      const id = entry.id || randomUUID();
      const activityLog = [{ actor: actor || "System", action: action || "Imported from meeting notes", timestamp: ts }];

      const { rows } = await pool.query(
        `INSERT INTO items
          (id, project_id, type, title, module, source, owner, assignee, status,
           tags, related_items, activity_log, type_fields, created_at, updated_at, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         RETURNING *`,
        [
          id, pid,
          entry.type || "requirement",
          entry.title || "",
          entry.module || "",
          entry.source || source || "",
          entry.owner || "", entry.assignee || "",
          entry.status || "pending_review",
          JSON.stringify(entry.tags || []),
          JSON.stringify(entry.related_items || []),
          JSON.stringify(activityLog),
          JSON.stringify(entry.type_fields || {}),
          dateStr, dateStr,
          req.user.id,
        ]
      );

      const item = { ...rows[0], comments: [] };
      broadcast(pid, "item:upsert", item);
      created.push(item);
    }

    res.status(201).json(created);
  } catch (err) {
    console.error("Batch import error:", err);
    res.status(500).json({ error: "Batch import failed" });
  }
});

// POST /api/projects/:pid/items/:id/comments
router.post("/:id/comments", async (req, res) => {
  const { pid, id } = req.params;
  const { author, text, timestamp } = req.body;

  try {
    const { rows } = await pool.query(
      `INSERT INTO comments (item_id, author, text, timestamp, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, author, text, timestamp, req.user.id]
    );

    const comment = { author: rows[0].author, text: rows[0].text, timestamp: rows[0].timestamp };
    broadcast(pid, "comment:insert", { itemId: id, comment });
    res.status(201).json(comment);
  } catch (err) {
    console.error("Create comment error:", err);
    res.status(500).json({ error: "Failed to create comment" });
  }
});

export default router;

import { Router } from "express";
import pool from "../db.js";
import { authMiddleware } from "../auth.js";

const router = Router();
router.use(authMiddleware);

// GET /api/projects
router.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM projects ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("List projects error:", err);
    res.status(500).json({ error: "Failed to list projects" });
  }
});

// POST /api/projects
router.post("/", async (req, res) => {
  const {
    id, name, description, icon_name, color,
    modules, statuses, done_statuses, priorities,
    dependencies, sources, team_members, enabled_types, meta,
  } = req.body;

  try {
    const { rows } = await pool.query(
      `INSERT INTO projects
        (id, name, description, icon_name, color, modules, statuses, done_statuses, priorities, dependencies, sources, team_members, enabled_types, meta, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [
        id, name, description || "", icon_name || "Flask", color || "blue",
        JSON.stringify(modules || []),
        JSON.stringify(statuses || {}),
        JSON.stringify(done_statuses || []),
        JSON.stringify(priorities || []),
        JSON.stringify(dependencies || []),
        JSON.stringify(sources || []),
        JSON.stringify(team_members || []),
        JSON.stringify(enabled_types || []),
        JSON.stringify(meta || {}),
        req.user.id,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Create project error:", err);
    res.status(500).json({ error: "Failed to create project" });
  }
});

// PATCH /api/projects/:id
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const fields = req.body;

  // Build dynamic SET clause from provided fields
  const allowed = [
    "name", "description", "icon_name", "color",
    "modules", "statuses", "done_statuses", "priorities",
    "dependencies", "sources", "team_members", "enabled_types", "meta",
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

  try {
    const { rows } = await pool.query(
      `UPDATE projects SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("Update project error:", err);
    res.status(500).json({ error: "Failed to update project" });
  }
});

// DELETE /api/projects/:id
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query("DELETE FROM projects WHERE id = $1", [id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.status(204).end();
  } catch (err) {
    console.error("Delete project error:", err);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

export default router;

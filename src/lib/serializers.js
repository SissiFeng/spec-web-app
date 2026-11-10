import { ITEM_TYPES } from "../data/itemTypes";

// ─── Type-specific field keys per item type ───────────────────────

const TYPE_FIELD_KEYS = Object.fromEntries(
  Object.entries(ITEM_TYPES).map(([type, meta]) => [type, meta.fields.map((f) => f.key)])
);

// ─── Item ↔ Row conversion ────────────────────────────────────────

export function itemToRow(item, projectId) {
  const typeKeys = TYPE_FIELD_KEYS[item.type] || [];
  const typeFields = {};
  for (const key of typeKeys) {
    if (item[key] !== undefined) {
      typeFields[key] = item[key];
    }
  }

  return {
    id: item.id,
    project_id: projectId,
    type: item.type,
    title: item.title || "",
    module: item.module || "",
    source: item.source || "",
    owner: item.owner || "",
    assignee: item.assignee || "",
    status: item.status || "",
    tags: item.tags || [],
    related_items: item.relatedItems || [],
    activity_log: item.activityLog || [],
    type_fields: typeFields,
    created_at: item.createdAt || "",
    updated_at: item.updatedAt || "",
  };
}

export function rowToItem(row, comments = []) {
  const item = {
    id: row.id,
    type: row.type,
    title: row.title,
    module: row.module,
    source: row.source,
    owner: row.owner,
    assignee: row.assignee,
    status: row.status,
    tags: row.tags || [],
    relatedItems: row.related_items || [],
    activityLog: row.activity_log || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    comments: comments.map((c) => ({
      author: c.author,
      text: c.text,
      timestamp: c.timestamp,
    })),
    // Spread type-specific fields
    ...(row.type_fields || {}),
  };

  return item;
}

// ─── Project ↔ Row conversion ─────────────────────────────────────

export function projectToRow(config) {
  return {
    id: config.id,
    name: config.name,
    description: config.description || "",
    icon_name: config.iconName || config.icon_name || "Flask",
    color: config.color || "blue",
    modules: config.modules || [],
    statuses: config.statuses || {},
    done_statuses: config.doneStatuses || config.done_statuses || [],
    priorities: config.priorities || [],
    dependencies: config.dependencies || [],
    sources: config.sources || [],
    team_members: config.teamMembers || config.team_members || [],
    enabled_types: config.enabledTypes || config.enabled_types || [],
    meta: config.meta || {},
  };
}

export function rowToProject(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description || "",
    iconName: row.icon_name || "Flask",
    color: row.color || "blue",
    modules: row.modules || [],
    statuses: row.statuses || {},
    doneStatuses: row.done_statuses || [],
    priorities: row.priorities || [],
    dependencies: row.dependencies || [],
    sources: row.sources || [],
    teamMembers: row.team_members || [],
    enabledTypes: row.enabled_types || [],
    meta: row.meta || {},
  };
}

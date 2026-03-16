-- ─── Seed Data for Spec Hub ────────────────────────────────────────
-- Run after schema.sql to populate initial projects and items

-- ─── Projects ─────────────────────────────────────────────────────

INSERT INTO projects (id, name, description, icon_name, color, modules, statuses, done_statuses, priorities, dependencies, sources, team_members, enabled_types) VALUES
('sdl-battery', 'SDL Battery', 'Real-time monitoring & data management', 'Battery', 'blue',
 '["Overview", "Campaign", "Alerts", "Analysis", "Data Explorer"]',
 '{"requirement": ["proposed", "confirmed", "rejected", "implemented", "deprecated"], "decision": ["open", "needs_clarification", "confirmed", "implemented", "deprecated"], "definition": ["draft", "needs_clarification", "confirmed", "deprecated"], "rule": ["proposed", "confirmed", "implemented", "deprecated"], "release": ["planned", "in_progress", "completed", "reverted"]}',
 '["implemented", "completed", "deprecated", "rejected", "reverted"]',
 '["critical", "high", "medium", "low"]',
 '["frontend_only", "backend_only", "ETL", "schema", "scientific_definition_needed", "PM_approval_needed"]',
 '["Ali", "Scientist", "PM", "Meeting", "Code Review", "Slack"]',
 '["Ali", "Dr. Chen", "PM", "Tech Lead", "Unassigned"]',
 '["requirement", "decision", "definition", "rule", "release"]'),

('catalyst-lab', 'Catalyst Lab', 'Catalyst synthesis experiment tracking', 'Flask', 'emerald',
 '["Dashboard", "Experiments", "Reagents", "Results"]',
 '{"requirement": ["proposed", "confirmed", "rejected", "implemented", "deprecated"], "decision": ["open", "confirmed", "implemented", "deprecated"], "definition": ["draft", "needs_clarification", "confirmed", "deprecated"], "rule": ["proposed", "confirmed", "implemented", "deprecated"]}',
 '["implemented", "completed", "deprecated", "rejected", "reverted"]',
 '["critical", "high", "medium", "low"]',
 '["frontend_only", "backend_only", "lab_equipment", "reagent_order"]',
 '["Lead Chemist", "Lab Tech", "PI", "Meeting", "Lab Notebook"]',
 '["Dr. Park", "Lab Tech A", "Lab Tech B", "PI", "Unassigned"]',
 '["requirement", "decision", "definition", "rule"]'),

('solar-cell', 'Solar Cell Team', 'Photovoltaic efficiency research specs', 'Sun', 'amber',
 '["Overview", "Fabrication", "Characterization", "Modeling"]',
 '{"requirement": ["proposed", "confirmed", "implemented", "deprecated"], "decision": ["open", "confirmed", "implemented"], "definition": ["draft", "confirmed"], "release": ["planned", "in_progress", "completed"]}',
 '["implemented", "completed", "deprecated"]',
 '["high", "medium", "low"]',
 '["frontend_only", "backend_only", "equipment_booking", "simulation_cluster"]',
 '["PI", "Postdoc", "PhD Student", "Meeting"]',
 '["Prof. Zhang", "Dr. Liu", "Student A", "Student B", "Unassigned"]',
 '["requirement", "decision", "definition", "release"]');

-- ─── SDL Battery Items ────────────────────────────────────────────

INSERT INTO items (id, project_id, type, title, module, source, owner, assignee, status, tags, related_items, activity_log, type_fields, created_at, updated_at) VALUES
-- Requirements
('r1-sdl', 'sdl-battery', 'requirement', 'Change Overview subtitle to ''Real-time monitoring & data management''', 'Overview', 'Ali', 'Ali', 'Ali', 'confirmed',
 '["UI", "copy"]', '["d1-sdl"]',
 '[{"actor":"Ali","action":"Created this requirement","timestamp":"2026-03-10 09:15:00"},{"actor":"PM","action":"Changed status from proposed → confirmed","timestamp":"2026-03-11 11:00:00"}]',
 '{"userIntent":"Make the Overview page subtitle more accurately describe system capabilities","priority":"medium","version":"v2.1"}',
 '2026-03-10', '2026-03-11'),

('r2-sdl', 'sdl-battery', 'requirement', 'Change KPI target to 0.99', 'Overview', 'Scientist', 'Dr. Chen', 'Dr. Chen', 'proposed',
 '["KPI", "threshold"]', '["rule1-sdl"]',
 '[{"actor":"Dr. Chen","action":"Created this requirement","timestamp":"2026-03-11 10:00:00"}]',
 '{"userIntent":"Adjust KPI target threshold from current value to 0.99, reflecting higher quality standards","priority":"high","version":"v2.1"}',
 '2026-03-11', '2026-03-11'),

('r3-sdl', 'sdl-battery', 'requirement', 'Analysis must be attached to a Campaign — no Campaign, no Analysis', 'Analysis', 'PM', 'PM', 'Ali', 'implemented',
 '["architecture", "constraint"]', '["d3-sdl", "def1-sdl"]',
 '[{"actor":"PM","action":"Created this requirement","timestamp":"2026-03-08 14:00:00"},{"actor":"PM","action":"Changed status from proposed → confirmed","timestamp":"2026-03-09 09:00:00"},{"actor":"Ali","action":"Changed status from confirmed → implemented","timestamp":"2026-03-11 16:00:00"}]',
 '{"userIntent":"Ensure Analysis page data is always linked to a Campaign to prevent orphan analyses","priority":"critical","version":"v2.0"}',
 '2026-03-08', '2026-03-11'),

('r4-sdl', 'sdl-battery', 'requirement', 'Add severity filter to Alerts page', 'Alerts', 'Scientist', '', 'Unassigned', 'proposed',
 '["filter", "UX"]', '[]',
 '[{"actor":"Scientist","action":"Created this requirement","timestamp":"2026-03-12 10:00:00"}]',
 '{"userIntent":"Scientists want to quickly find critical alerts without scrolling through pages","priority":"high","version":"v2.2"}',
 '2026-03-12', '2026-03-12'),

('r5-sdl', 'sdl-battery', 'requirement', 'Support CSV export in Data Explorer', 'Data Explorer', 'Meeting', 'Ali', 'Ali', 'confirmed',
 '["export", "data"]', '[]',
 '[{"actor":"Ali","action":"Created this requirement","timestamp":"2026-03-09 10:00:00"}]',
 '{"userIntent":"Scientists need to download filtered data locally for further analysis","priority":"medium","version":"v2.1"}',
 '2026-03-09', '2026-03-10'),

-- Decisions
('d1-sdl', 'sdl-battery', 'decision', '''This Week'' defined as Sunday 00:00 to Saturday 23:59', 'Overview', '2026-03-11 Ali dashboard discussion', 'Ali', 'Ali', 'confirmed',
 '["time", "definition"]', '["r1-sdl"]',
 '[{"actor":"Ali","action":"Created this decision","timestamp":"2026-03-11 10:00:00"}]',
 '{"statement":"All ''This Week'' time ranges in the system are unified as: Sunday 00:00:00 UTC to Saturday 23:59:59 UTC","rationale":"Prevent inconsistencies between frontend, backend, and scientist interpretations of the time window","decidedBy":"Ali + PM","decidedAt":"2026-03-11","supersedes":false,"impactedComponents":["Overview KPI","Campaign timeline","Data Explorer filter"]}',
 '2026-03-11', '2026-03-11'),

('d2-sdl', 'sdl-battery', 'decision', 'Alerts scope limited to experiment quality only, not system errors', 'Alerts', '2026-03-10 product review', 'PM', 'PM', 'confirmed',
 '["scope", "alerts"]', '[]',
 '[{"actor":"PM","action":"Created this decision","timestamp":"2026-03-10 10:00:00"}]',
 '{"statement":"The Alerts module is scoped to experiment quality alerts (e.g. data validation failures, KPI threshold breaches), excluding system-level errors (e.g. server errors, ETL failures)","rationale":"System errors should go through DevOps monitoring channels (PagerDuty/Datadog), not mixed into the scientist''s working interface","decidedBy":"PM + Tech Lead","decidedAt":"2026-03-10","supersedes":false,"impactedComponents":["Alerts page","Notification system"]}',
 '2026-03-10', '2026-03-10'),

('d3-sdl', 'sdl-battery', 'decision', 'Warning data retained but requires manual verification', 'Analysis', '2026-03-11 scientist feedback', 'Dr. Chen', 'Dr. Chen', 'confirmed',
 '["validation", "data-quality"]', '["r3-sdl", "rule2-sdl"]',
 '[{"actor":"Dr. Chen","action":"Created this decision","timestamp":"2026-03-11 10:00:00"}]',
 '{"statement":"When a data row has status ''warning'', it is not automatically discarded. It remains in the system but is marked as requiring scientist manual verification before being included in KPI calculations","rationale":"Automatic discard could cause data loss, but unverified data would pollute KPIs","decidedBy":"Dr. Chen + PM","decidedAt":"2026-03-11","supersedes":true,"impactedComponents":["Validation pipeline","KPI calculation","Status rollup"]}',
 '2026-03-11', '2026-03-11'),

-- Definitions
('def1-sdl', 'sdl-battery', 'definition', '', 'Campaign', '2026-03-08 kickoff meeting', 'PM', 'PM', 'confirmed',
 '["core"]', '["r3-sdl"]',
 '[{"actor":"PM","action":"Created this definition","timestamp":"2026-03-08 10:00:00"}]',
 '{"term":"Campaign","definition":"A group of experiments linked to a particular goal. Campaigns can be dynamically adjusted and may contain multiple sessions. Each Campaign has a clear start time, target metrics, and an owner.","scope":"System-wide","examples":["Stability optimization Q1 2026","Yield improvement for Substrate A"],"unresolvedQuestions":["Can a Campaign span multiple quarters?","Are nested Campaigns allowed?"]}',
 '2026-03-08', '2026-03-11'),

('def2-sdl', 'sdl-battery', 'definition', '', 'Campaign', '2026-03-09 definition workshop', 'Dr. Chen', 'Dr. Chen', 'confirmed',
 '["core"]', '["def1-sdl"]',
 '[{"actor":"Dr. Chen","action":"Created this definition","timestamp":"2026-03-09 10:00:00"}]',
 '{"term":"Session","definition":"A single continuous experimental run belonging to a Campaign. A Session contains fixed experimental conditions (substrate, temperature, pressure, etc.) and a set of data cycles.","scope":"Within Campaign","examples":["Session #42: Substrate A, 25C, 1atm, 200 cycles"],"unresolvedQuestions":["Are mid-session condition changes allowed?","If yes, how should sessions be split?"]}',
 '2026-03-09', '2026-03-09'),

('def3-sdl', 'sdl-battery', 'definition', '', 'Analysis', '2026-03-11 Ali dashboard discussion', '', 'Unassigned', 'draft',
 '["KPI", "unresolved"]', '[]',
 '[{"actor":"Ali","action":"Created this definition","timestamp":"2026-03-11 10:00:00"}]',
 '{"term":"Stability Score","definition":"A composite metric measuring performance degradation of an experiment under given conditions. Calculation method TBD.","scope":"Analysis module","examples":[],"unresolvedQuestions":["Exact formula?","Use degradation rate vs baseline?","Time window for calculation?"]}',
 '2026-03-11', '2026-03-11'),

('def4-sdl', 'sdl-battery', 'definition', '', 'Analysis', '2026-03-10 product review', 'Dr. Chen', 'Dr. Chen', 'needs_clarification',
 '["status", "validation"]', '["rule1-sdl", "rule2-sdl", "d3-sdl"]',
 '[{"actor":"Dr. Chen","action":"Created this definition","timestamp":"2026-03-10 10:00:00"}]',
 '{"term":"Valid / Invalid / Questionable","definition":"Row-level data quality statuses. Valid = passes all validation rules; Invalid = at least one blocking rule fails; Questionable = at least one warning rule triggers but no blocking failures.","scope":"Validation pipeline","examples":["dc_row_count < 100 → Invalid","cycle_count deviates > 2σ from mean → Questionable"],"unresolvedQuestions":["Does Questionable data participate in KPI calculation?","What status is completed_partial?"]}',
 '2026-03-10', '2026-03-11'),

-- Rules
('rule1-sdl', 'sdl-battery', 'rule', '', 'Analysis', '', 'Dr. Chen', 'Dr. Chen', 'implemented',
 '["validation", "data-quality"]', '["def4-sdl"]',
 '[{"actor":"Dr. Chen","action":"Created this rule","timestamp":"2026-03-08 10:00:00"}]',
 '{"ruleId":"VAL-001","layer":"Row Validation","ruleName":"dc_row_count minimum","description":"Each data cycle must contain at least 100 data rows, otherwise it is marked Invalid","severity":"error","blocking":true,"threshold":"dc_row_count >= 100","appliesTo":"Data Cycle","sourceOfTruth":"Scientist requirement"}',
 '2026-03-08', '2026-03-10'),

('rule2-sdl', 'sdl-battery', 'rule', '', 'Analysis', '', 'Dr. Chen', 'Dr. Chen', 'implemented',
 '["validation", "statistical"]', '["def4-sdl", "d3-sdl"]',
 '[{"actor":"Dr. Chen","action":"Created this rule","timestamp":"2026-03-08 10:00:00"}]',
 '{"ruleId":"VAL-002","layer":"Row Validation","ruleName":"cycle_count warning","description":"When cycle count deviates more than 2 standard deviations from the session mean, trigger a warning","severity":"warning","blocking":false,"threshold":"|cycle_count - session_mean| > 2σ","appliesTo":"Data Cycle","sourceOfTruth":"Scientist requirement"}',
 '2026-03-08', '2026-03-10'),

('rule3-sdl', 'sdl-battery', 'rule', '', 'Analysis', '', 'Dr. Chen', 'Dr. Chen', 'confirmed',
 '["validation", "baseline"]', '[]',
 '[{"actor":"Dr. Chen","action":"Created this rule","timestamp":"2026-03-09 10:00:00"}]',
 '{"ruleId":"VAL-003","layer":"Session Validation","ruleName":"baseline_ce_range","description":"Baseline coulombic efficiency must be within 0.95-1.05 range; values outside mark the entire session for review","severity":"warning","blocking":false,"threshold":"0.95 <= baseline_CE <= 1.05","appliesTo":"Session","sourceOfTruth":"Scientist requirement"}',
 '2026-03-09', '2026-03-11'),

('rule4-sdl', 'sdl-battery', 'rule', '', 'Overview', '', 'PM', 'PM', 'confirmed',
 '["rollup", "KPI"]', '["def4-sdl"]',
 '[{"actor":"PM","action":"Created this rule","timestamp":"2026-03-10 10:00:00"}]',
 '{"ruleId":"KPI-001","layer":"KPI Calculation","ruleName":"Status Rollup Logic","description":"Session-level status is determined by all contained data cycle statuses: any Invalid → Session Invalid; all Valid → Session Valid; otherwise → Session Questionable","severity":"info","blocking":false,"threshold":"rollup(cycle_statuses)","appliesTo":"Session → Campaign","sourceOfTruth":"PM + Scientist"}',
 '2026-03-10', '2026-03-11'),

-- Releases
('rel1-sdl', 'sdl-battery', 'release', '', 'Overview', 'r2', 'Ali', 'Ali', 'planned',
 '["KPI"]', '["r2-sdl"]',
 '[{"actor":"Ali","action":"Created this release item","timestamp":"2026-03-11 10:00:00"}]',
 '{"component":"Overview / KPI Card","currentBehavior":"KPI target displayed as 0.95","requestedChange":"Change KPI target to 0.99","dependency":["backend_only"],"backendRequired":true,"versionTarget":"v2.1"}',
 '2026-03-11', '2026-03-11'),

('rel2-sdl', 'sdl-battery', 'release', '', 'Overview', 'r1', 'Ali', 'Ali', 'completed',
 '["UI", "copy"]', '["r1-sdl", "d1-sdl"]',
 '[{"actor":"Ali","action":"Created this release item","timestamp":"2026-03-10 09:00:00"},{"actor":"Ali","action":"Changed status from planned → in_progress","timestamp":"2026-03-10 14:00:00"},{"actor":"Ali","action":"Changed status from in_progress → completed","timestamp":"2026-03-11 10:00:00"}]',
 '{"component":"Overview / Subtitle","currentBehavior":"Displays old subtitle","requestedChange":"Change to ''Real-time monitoring & data management''","dependency":["frontend_only"],"backendRequired":false,"versionTarget":"v2.1"}',
 '2026-03-10', '2026-03-11'),

('rel3-sdl', 'sdl-battery', 'release', '', 'Alerts', 'r4', '', 'Unassigned', 'planned',
 '["filter"]', '["r4-sdl"]',
 '[{"actor":"PM","action":"Created this release item","timestamp":"2026-03-12 10:00:00"}]',
 '{"component":"Alerts / Filter Bar","currentBehavior":"No filter functionality","requestedChange":"Add severity filter (critical / warning / info)","dependency":["frontend_only"],"backendRequired":false,"versionTarget":"v2.2"}',
 '2026-03-12', '2026-03-12');

-- ─── SDL Battery Comments ─────────────────────────────────────────

INSERT INTO comments (item_id, author, text, timestamp) VALUES
('r1-sdl', 'Ali', 'Confirmed in product review — subtitle should reflect monitoring focus.', '2026-03-11 14:30:00'),
('r3-sdl', 'Ali', 'This is effectively a product rule — should be synced to the Rule Registry.', '2026-03-09 10:00:00'),
('d3-sdl', 'Dr. Chen', 'This supersedes the previous approach of directly discarding warning data.', '2026-03-11 15:00:00'),
('def3-sdl', 'Ali', 'This is one of the highest-priority terms to define.', '2026-03-11 16:00:00');

-- ─── Catalyst Lab Items ───────────────────────────────────────────

INSERT INTO items (id, project_id, type, title, module, source, owner, assignee, status, tags, related_items, activity_log, type_fields, created_at, updated_at) VALUES
-- Requirements
('r1-cat', 'catalyst-lab', 'requirement', 'Track reagent lot numbers for each experiment', 'Reagents', 'Lead Chemist', 'Dr. Park', 'Lab Tech A', 'confirmed',
 '["traceability", "reagent"]', '["def1-cat"]',
 '[{"actor":"Dr. Park","action":"Created this requirement","timestamp":"2026-03-05 10:00:00"},{"actor":"PI","action":"Changed status from proposed → confirmed","timestamp":"2026-03-07 14:00:00"}]',
 '{"userIntent":"Enable traceability of reagent batches to experiment outcomes for quality investigations","priority":"high","version":"v1.0"}',
 '2026-03-05', '2026-03-07'),

('r2-cat', 'catalyst-lab', 'requirement', 'Dashboard must show active experiments with real-time yield estimates', 'Dashboard', 'PI', 'PI', 'Unassigned', 'proposed',
 '["dashboard", "real-time"]', '[]',
 '[{"actor":"PI","action":"Created this requirement","timestamp":"2026-03-08 10:00:00"}]',
 '{"userIntent":"PI needs at-a-glance view of all running experiments and their projected outcomes","priority":"high","version":"v1.0"}',
 '2026-03-08', '2026-03-08'),

('r3-cat', 'catalyst-lab', 'requirement', 'Experiment results must include selectivity and conversion metrics', 'Results', 'Lead Chemist', 'Dr. Park', 'Dr. Park', 'confirmed',
 '["metrics", "results"]', '["def2-cat"]',
 '[{"actor":"Dr. Park","action":"Created this requirement","timestamp":"2026-03-04 10:00:00"}]',
 '{"userIntent":"Standard metrics for catalyst evaluation need to be captured for every experiment","priority":"critical","version":"v1.0"}',
 '2026-03-04', '2026-03-06'),

-- Decisions
('d1-cat', 'catalyst-lab', 'decision', 'Use SMILES notation for catalyst structure representation', 'Experiments', '2026-03-06 lab meeting', 'Dr. Park', 'Dr. Park', 'confirmed',
 '["data-format", "chemistry"]', '[]',
 '[{"actor":"Dr. Park","action":"Created this decision","timestamp":"2026-03-06 10:00:00"}]',
 '{"statement":"All catalyst structures in the system will be stored and displayed using SMILES notation, with optional InChI for cross-referencing","rationale":"SMILES is more compact and widely supported by our existing cheminformatics tools","decidedBy":"Dr. Park + PI","decidedAt":"2026-03-06","supersedes":false,"impactedComponents":["Experiment form","Results display","Search"]}',
 '2026-03-06', '2026-03-06'),

('d2-cat', 'catalyst-lab', 'decision', 'Experiments are immutable after 48h', 'Experiments', '2026-03-07 PI directive', 'PI', 'Lab Tech A', 'confirmed',
 '["compliance", "data-integrity"]', '[]',
 '[{"actor":"PI","action":"Created this decision","timestamp":"2026-03-07 10:00:00"}]',
 '{"statement":"Experiment records cannot be modified after 48 hours from completion. Corrections must be added as amendments.","rationale":"Ensures data integrity for regulatory compliance while allowing reasonable correction window","decidedBy":"PI","decidedAt":"2026-03-07","supersedes":false,"impactedComponents":["Experiment editor","Audit trail"]}',
 '2026-03-07', '2026-03-07'),

-- Definitions
('def1-cat', 'catalyst-lab', 'definition', '', 'Reagents', '2026-03-05 reagent workshop', 'Lab Tech A', 'Lab Tech A', 'confirmed',
 '["core", "reagent"]', '["r1-cat"]',
 '[{"actor":"Lab Tech A","action":"Created this definition","timestamp":"2026-03-05 10:00:00"}]',
 '{"term":"Reagent Lot","definition":"A specific batch of a chemical reagent from a single manufacturing run. Each lot has a unique identifier, supplier, purity grade, and expiration date.","scope":"System-wide","examples":["Lot #CAT-2026-0342: Pd(OAc)₂, Sigma-Aldrich, 99.9%, exp 2027-06"],"unresolvedQuestions":["Should we track sub-lots for aliquoted reagents?"]}',
 '2026-03-05', '2026-03-05'),

('def2-cat', 'catalyst-lab', 'definition', '', 'Results', '2026-03-04 definition review', 'Dr. Park', 'Dr. Park', 'needs_clarification',
 '["metric", "chemistry"]', '["r3-cat"]',
 '[{"actor":"Dr. Park","action":"Created this definition","timestamp":"2026-03-04 10:00:00"}]',
 '{"term":"Selectivity","definition":"The ratio of desired product to total products formed in a catalytic reaction, expressed as a percentage.","scope":"Results module","examples":["85% selectivity = 85g desired product per 100g total product"],"unresolvedQuestions":["Include unreacted starting material in calculation?"]}',
 '2026-03-04', '2026-03-06'),

-- Rules
('rule1-cat', 'catalyst-lab', 'rule', '', 'Experiments', '', 'PI', 'Lab Tech B', 'implemented',
 '["validation", "safety"]', '[]',
 '[{"actor":"PI","action":"Created this rule","timestamp":"2026-03-03 10:00:00"}]',
 '{"ruleId":"EXP-001","layer":"Experiment Validation","ruleName":"temperature_range","description":"Reaction temperature must be within -78°C to 300°C; values outside are rejected as instrument error","severity":"error","blocking":true,"threshold":"-78 <= temp_C <= 300","appliesTo":"Experiment","sourceOfTruth":"Lab safety protocol"}',
 '2026-03-03', '2026-03-05');

-- Catalyst Lab Comments
INSERT INTO comments (item_id, author, text, timestamp) VALUES
('r1-cat', 'Dr. Park', 'Critical for GLP compliance.', '2026-03-06 09:00:00');

-- ─── Solar Cell Items ─────────────────────────────────────────────

INSERT INTO items (id, project_id, type, title, module, source, owner, assignee, status, tags, related_items, activity_log, type_fields, created_at, updated_at) VALUES
-- Requirements
('r1-sol', 'solar-cell', 'requirement', 'Track PCE (Power Conversion Efficiency) for every fabricated cell', 'Characterization', 'PI', 'Prof. Zhang', 'Dr. Liu', 'confirmed',
 '["KPI", "characterization"]', '["def1-sol"]',
 '[{"actor":"Prof. Zhang","action":"Created this requirement","timestamp":"2026-03-01 10:00:00"},{"actor":"Prof. Zhang","action":"Changed status from proposed → confirmed","timestamp":"2026-03-03 11:00:00"}]',
 '{"userIntent":"PCE is our primary KPI — every cell must have a measured PCE before being considered complete","priority":"high","version":"v1.0"}',
 '2026-03-01', '2026-03-03'),

('r2-sol', 'solar-cell', 'requirement', 'Support J-V curve upload and visualization', 'Characterization', 'Postdoc', 'Dr. Liu', 'Unassigned', 'proposed',
 '["data", "visualization"]', '[]',
 '[{"actor":"Dr. Liu","action":"Created this requirement","timestamp":"2026-03-05 10:00:00"}]',
 '{"userIntent":"Researchers need to upload raw J-V measurement files and see the curve plotted with key parameters extracted","priority":"high","version":"v1.1"}',
 '2026-03-05', '2026-03-05'),

('r3-sol', 'solar-cell', 'requirement', 'Fabrication log must capture layer-by-layer deposition parameters', 'Fabrication', 'PhD Student', 'Dr. Liu', 'Student A', 'confirmed',
 '["fabrication", "traceability"]', '[]',
 '[{"actor":"Student A","action":"Created this requirement","timestamp":"2026-03-02 10:00:00"}]',
 '{"userIntent":"Need full process traceability — every layer''s spin speed, annealing temp, thickness must be recorded","priority":"medium","version":"v1.0"}',
 '2026-03-02', '2026-03-04'),

-- Decisions
('d1-sol', 'solar-cell', 'decision', 'Standard test conditions: AM1.5G, 100 mW/cm², 25°C', 'Characterization', '2026-03-01 group meeting', 'Prof. Zhang', 'Dr. Liu', 'confirmed',
 '["standard", "measurement"]', '["r1-sol"]',
 '[{"actor":"Prof. Zhang","action":"Created this decision","timestamp":"2026-03-01 10:00:00"}]',
 '{"statement":"All PCE measurements must be performed under AM1.5G illumination at 100 mW/cm² and 25°C ambient temperature to ensure comparability","rationale":"Industry standard conditions enable comparison with published literature values","decidedBy":"Prof. Zhang","decidedAt":"2026-03-01","supersedes":false,"impactedComponents":["Measurement protocol","Results comparison"]}',
 '2026-03-01', '2026-03-01'),

-- Definitions
('def1-sol', 'solar-cell', 'definition', '', 'Characterization', '2026-03-01 group meeting', 'Prof. Zhang', 'Prof. Zhang', 'confirmed',
 '["core", "KPI"]', '["r1-sol"]',
 '[{"actor":"Prof. Zhang","action":"Created this definition","timestamp":"2026-03-01 10:00:00"}]',
 '{"term":"PCE (Power Conversion Efficiency)","definition":"The ratio of electrical power output to incident light power input, expressed as a percentage. PCE = (Jsc × Voc × FF) / Pin × 100%","scope":"System-wide","examples":["22.5% PCE = champion perovskite cell","26.7% PCE = silicon HJT record"],"unresolvedQuestions":["Report stabilized PCE or instantaneous scan PCE?"]}',
 '2026-03-01', '2026-03-01'),

('def2-sol', 'solar-cell', 'definition', '', 'Characterization', '2026-03-02 definition session', 'Dr. Liu', 'Dr. Liu', 'confirmed',
 '["metric"]', '["def1-sol"]',
 '[{"actor":"Dr. Liu","action":"Created this definition","timestamp":"2026-03-02 10:00:00"}]',
 '{"term":"Fill Factor (FF)","definition":"The ratio of maximum obtainable power to the product of open-circuit voltage and short-circuit current. FF = Pmax / (Voc × Jsc)","scope":"Characterization module","examples":["FF > 0.80 is excellent","FF < 0.60 suggests series resistance issues"],"unresolvedQuestions":[]}',
 '2026-03-02', '2026-03-02'),

-- Releases
('rel1-sol', 'solar-cell', 'release', '', 'Characterization', 'r2', 'Dr. Liu', 'Student B', 'planned',
 '["automation"]', '["r2-sol"]',
 '[{"actor":"Dr. Liu","action":"Created this release item","timestamp":"2026-03-06 10:00:00"}]',
 '{"component":"Characterization / PCE Input","currentBehavior":"Manual text input for PCE value","requestedChange":"Auto-extract PCE from uploaded J-V curve data","dependency":["backend_only"],"backendRequired":true,"versionTarget":"v1.1"}',
 '2026-03-06', '2026-03-06');

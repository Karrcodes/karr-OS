-- Add notes column to fin_tasks for extra context and checklists
ALTER TABLE fin_tasks ADD COLUMN IF NOT EXISTS notes JSONB;

-- Notes Structure Tip:
-- {
--   "type": "text" | "bullets" | "checklist",
--   "content": "raw string" | [{ "id": "uuid", "text": "item text", "completed": boolean }]
-- }

COMMENT ON COLUMN fin_tasks.notes IS 'Stores task notes, bullet points, or checklist subtasks in JSONB format.';

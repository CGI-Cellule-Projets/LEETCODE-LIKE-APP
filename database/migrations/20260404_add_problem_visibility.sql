-- Add visibility lifecycle to problems.
-- States:
--   HIDDEN: not visible anywhere public
--   CONTEST_ONLY: visible only through active contest APIs
--   PUBLIC: visible in practice list and public problem detail

ALTER TABLE problems
  ADD COLUMN IF NOT EXISTS visibility VARCHAR(20);

UPDATE problems
SET visibility = CASE
  WHEN is_published = TRUE THEN 'PUBLIC'
  ELSE 'HIDDEN'
END
WHERE visibility IS NULL;

ALTER TABLE problems
  ALTER COLUMN visibility SET NOT NULL;

ALTER TABLE problems
  ALTER COLUMN visibility SET DEFAULT 'HIDDEN';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'problems_visibility_check'
  ) THEN
    ALTER TABLE problems
      ADD CONSTRAINT problems_visibility_check
      CHECK (visibility IN ('HIDDEN', 'CONTEST_ONLY', 'PUBLIC'));
  END IF;
END $$;

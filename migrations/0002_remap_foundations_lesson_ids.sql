-- One-time data migration. Not a schema change (no new columns), so it does
-- NOT belong in server/index.ts's schemaCols boot pattern. Run this once by
-- hand against production (Railway DB console, or `psql "$DATABASE_URL" -f
-- migrations/0002_remap_foundations_lesson_ids.sql`) after the app code that
-- renames these lesson IDs has deployed. Safe to run more than once — every
-- statement is a no-op on rows that don't contain the old IDs.
--
-- Why: the Foundations module's lesson IDs were inconsistent with every
-- other module (semantic slugs like 'foundations-intro' mixed with numbered
-- ones like 'foundations-1'). The curriculum and code now use a consistent
-- foundations-1..foundations-9 scheme in lesson-order. This migration
-- remaps the OLD id strings to the NEW ones wherever they're stored in a
-- user's own progress data, so nobody's completed lessons or quiz scores
-- silently reset because of a naming cleanup.
--
-- Old -> new mapping (matches client/src/lib/curriculum.ts and
-- client/src/lib/careerTracks.ts):
--   foundations-intro     -> foundations-1
--   foundations-1         -> foundations-2
--   foundations-players   -> foundations-3
--   foundations-2         -> foundations-4
--   foundations-contracts -> foundations-5
--   foundations-lifecycle -> foundations-6
--   foundations-3         -> foundations-7
--   foundations-4         -> foundations-8
--   foundations-money     -> foundations-9
--
-- module_assessment_scores is keyed by MODULE id ('foundations'), not lesson
-- id, so it's untouched by this migration.

-- ── Preview affected rows before running the UPDATEs below ─────────────────
-- SELECT id, email, completed_lessons, quiz_scores FROM users
-- WHERE completed_lessons && ARRAY['foundations-intro','foundations-1','foundations-players','foundations-2','foundations-contracts','foundations-lifecycle','foundations-3','foundations-4','foundations-money']
--    OR quiz_scores ?| ARRAY['foundations-intro','foundations-1','foundations-players','foundations-2','foundations-contracts','foundations-lifecycle','foundations-3','foundations-4','foundations-money'];

BEGIN;

-- completed_lessons: text[] — remap each element based on its OLD value in a
-- single pass (not sequential replacements), so e.g. old 'foundations-1'
-- becomes 'foundations-2' without then also being caught by a later rule
-- meant for a different old value.
UPDATE users
SET completed_lessons = (
  SELECT array_agg(
    CASE elem
      WHEN 'foundations-intro'     THEN 'foundations-1'
      WHEN 'foundations-1'         THEN 'foundations-2'
      WHEN 'foundations-players'   THEN 'foundations-3'
      WHEN 'foundations-2'         THEN 'foundations-4'
      WHEN 'foundations-contracts' THEN 'foundations-5'
      WHEN 'foundations-lifecycle' THEN 'foundations-6'
      WHEN 'foundations-3'         THEN 'foundations-7'
      WHEN 'foundations-4'         THEN 'foundations-8'
      WHEN 'foundations-money'     THEN 'foundations-9'
      ELSE elem
    END
  )
  FROM unnest(completed_lessons) AS elem
)
WHERE completed_lessons && ARRAY['foundations-intro','foundations-1','foundations-players','foundations-2','foundations-contracts','foundations-lifecycle','foundations-3','foundations-4','foundations-money'];

-- quiz_scores: jsonb keyed by lesson id — drop the old keys and re-insert
-- their values under the new keys. jsonb_strip_nulls drops any key whose
-- old counterpart didn't exist for that user (partial completion is normal).
UPDATE users
SET quiz_scores = (
  (quiz_scores
    - 'foundations-intro' - 'foundations-1' - 'foundations-players'
    - 'foundations-2' - 'foundations-contracts' - 'foundations-lifecycle'
    - 'foundations-3' - 'foundations-4' - 'foundations-money')
  || jsonb_strip_nulls(jsonb_build_object(
       'foundations-1', quiz_scores->'foundations-intro',
       'foundations-2', quiz_scores->'foundations-1',
       'foundations-3', quiz_scores->'foundations-players',
       'foundations-4', quiz_scores->'foundations-2',
       'foundations-5', quiz_scores->'foundations-contracts',
       'foundations-6', quiz_scores->'foundations-lifecycle',
       'foundations-7', quiz_scores->'foundations-3',
       'foundations-8', quiz_scores->'foundations-4',
       'foundations-9', quiz_scores->'foundations-money'
     ))
)
WHERE quiz_scores ?| ARRAY['foundations-intro','foundations-1','foundations-players','foundations-2','foundations-contracts','foundations-lifecycle','foundations-3','foundations-4','foundations-money'];

COMMIT;

-- ── Sanity check after running ──────────────────────────────────────────
-- Should return 0 rows. If it doesn't, something above didn't match.
-- SELECT id, email FROM users
-- WHERE completed_lessons && ARRAY['foundations-intro','foundations-players','foundations-contracts','foundations-lifecycle','foundations-money']
--    OR quiz_scores ?| ARRAY['foundations-intro','foundations-players','foundations-contracts','foundations-lifecycle','foundations-money'];

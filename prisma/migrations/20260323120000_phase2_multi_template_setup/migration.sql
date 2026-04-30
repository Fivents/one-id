-- AddColumn: template_set_id for Phase 2 multi-template enrollment
ALTER TABLE person_faces
ADD COLUMN IF NOT EXISTS template_set_id VARCHAR(255);

-- Add index for template_set_id queries
CREATE INDEX IF NOT EXISTS idx_person_faces_template_set_id
ON person_faces(template_set_id);

-- Drop old unique constraint on personId + pose (if exists) and add new one
-- This prevents multiple faces with same pose for same person
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'person_faces'
        AND constraint_name = 'person_faces_person_id_pose_key'
    ) THEN
        ALTER TABLE person_faces
        ADD CONSTRAINT person_faces_person_id_pose_key
        UNIQUE (person_id, face_template_position)
        DEFERRABLE INITIALLY DEFERRED;
    END IF;
END $$;

-- Backfill: first face of each person gets "center" position if no position set
UPDATE person_faces
SET face_template_position = 'center'
WHERE face_template_position IS NULL
AND deleted_at IS NULL
AND (person_id, created_at) IN (
    SELECT person_id, MIN(created_at)
    FROM person_faces
    WHERE deleted_at IS NULL
    GROUP BY person_id
);

-- Create template_set_id for new enrollments (UUID-based grouping)
-- Each person's first enrollment in Phase 2 gets a template set
-- This allows future multi-pose enrollments to be grouped
UPDATE person_faces
SET template_set_id = CONCAT('template_set_', person_id)
WHERE template_set_id IS NULL
AND deleted_at IS NULL;

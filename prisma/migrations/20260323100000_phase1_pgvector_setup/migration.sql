-- AddExtension: pgvector (if not already exists)
CREATE EXTENSION IF NOT EXISTS vector;

-- Add new columns to person_faces
ALTER TABLE person_faces
ADD COLUMN IF NOT EXISTS embedding_vector vector(512),
ADD COLUMN IF NOT EXISTS embedding_model_version VARCHAR(120) DEFAULT 'InsightFace:0.3.3',
ADD COLUMN IF NOT EXISTS embedding_normalized BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS face_quality_score FLOAT,
ADD COLUMN IF NOT EXISTS face_quality_metadata JSONB,
ADD COLUMN IF NOT EXISTS face_template_position VARCHAR(50);

-- Add unique constraint on image_hash (prevents duplicate photo registrations)
-- Only if it doesn't already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'person_faces'
        AND constraint_name = 'person_faces_image_hash_key'
    ) THEN
        ALTER TABLE person_faces
        ADD CONSTRAINT person_faces_image_hash_key UNIQUE(image_hash);
    END IF;
END $$;

-- Create index on embedding_model_version
CREATE INDEX IF NOT EXISTS idx_person_faces_embedding_model_version
ON person_faces(embedding_model_version);

-- NOTE: Keep existing embeddings in bytea format for backward compatibility
-- New enrollments will use embedding_vector with pgvector format
-- Future migration job can batch-convert old embeddings if needed
-- UPDATE statements below are safe no-ops if data already backfilled

-- Backfill embedding_model_version (assume all existing are v0.3.3)
UPDATE person_faces
SET embedding_model_version = 'InsightFace:0.3.3'
WHERE embedding_model_version IS NULL;

-- Backfill quality with placeholder (will be recalculated on next enrollment/check-in)
UPDATE person_faces
SET face_quality_score = 0.75, face_quality_metadata = ('{"backfilled": true, "migrated_at": "'|| NOW() ||'"}')::jsonb
WHERE face_quality_score IS NULL;

-- Create vector index using HNSW for cosine distance (optimal for similarity search)
-- `m=16` - number of connections per node (balance between memory and search quality)
-- `ef_construction=200` - search width during construction (bigger = better quality but slower)
-- This index will be used for new vector-format embeddings
CREATE INDEX IF NOT EXISTS idx_person_faces_embedding_vector_hnsw
ON person_faces USING hnsw (embedding_vector vector_cosine_ops)
WITH (m = 16, ef_construction = 200);



-- Normalize all face embeddings to the stage-2 format (512 float32 = 2048 bytes)
-- Legacy rows (e.g. 128-d) are zero-padded and long rows are truncated.
UPDATE person_faces
SET
  embedding = CASE
    WHEN octet_length(embedding) = 2048 THEN embedding
    WHEN octet_length(embedding) < 2048 THEN embedding || decode(repeat('00', 2048 - octet_length(embedding)), 'hex')
    ELSE substring(embedding from 1 for 2048)
  END,
  image_hash = CASE
    WHEN image_hash LIKE 'runtime-embedding-%' THEN image_hash
    ELSE 'runtime-embedding-migrated-' || substring(md5(image_hash || id) from 1 for 12)
  END,
  updated_at = NOW()
WHERE deleted_at IS NULL
  AND octet_length(embedding) <> 2048;

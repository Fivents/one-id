-- EventAIConfig: Add new fields for facial recognition rebuild
-- These fields control liveness detection, vector search, and anti-fraud

-- Add liveness threshold (0.0 to 1.0, default 0.70)
ALTER TABLE event_ai_configs
ADD COLUMN IF NOT EXISTS liveness_threshold FLOAT DEFAULT 0.70;

-- Add pgvector HNSW ef_search parameter
-- Controls search accuracy vs speed tradeoff
-- Pequeno (≤1k): 40, Médio (≤10k): 64, Grande (≤50k+): 128
ALTER TABLE event_ai_configs
ADD COLUMN IF NOT EXISTS ef_search INT DEFAULT 64;

-- Add top-K candidates for vector search (default 5)
ALTER TABLE event_ai_configs
ADD COLUMN IF NOT EXISTS top_k_candidates INT DEFAULT 5;

-- Add cooldown seconds per person (anti-fraud, default 8)
ALTER TABLE event_ai_configs
ADD COLUMN IF NOT EXISTS cooldown_seconds INT DEFAULT 8;

-- Update existing records with new defaults
UPDATE event_ai_configs
SET 
  liveness_threshold = 0.70,
  ef_search = 64,
  top_k_candidates = 5,
  cooldown_seconds = 8
WHERE liveness_threshold IS NULL;

-- Update confidence_threshold default from 0.75 to 0.62 for new events
-- (existing events keep their configured threshold)
ALTER TABLE event_ai_configs
ALTER COLUMN confidence_threshold SET DEFAULT 0.62;

-- Enable liveness detection by default for new events
ALTER TABLE event_ai_configs
ALTER COLUMN liveness_detection SET DEFAULT true;

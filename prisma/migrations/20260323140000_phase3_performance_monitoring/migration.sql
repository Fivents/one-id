-- FASE 3: Performance Optimization & Adaptive Thresholds

-- Extend TotemEventSubscription with Phase 3 fields
ALTER TABLE totem_event_subscriptions
ADD COLUMN confidence_threshold_adaptive BOOLEAN DEFAULT false,
ADD COLUMN confidence_threshold_min FLOAT DEFAULT 0.50,
ADD COLUMN confidence_threshold_max FLOAT DEFAULT 0.90,
ADD COLUMN cooldown_strategy_type VARCHAR(50) DEFAULT 'FIXED',
ADD COLUMN cooldown_initial_ms INTEGER DEFAULT 5000,
ADD COLUMN cooldown_max_ms INTEGER DEFAULT 60000,
ADD COLUMN last_check_in_at TIMESTAMP,
ADD COLUMN total_check_ins INTEGER DEFAULT 0,
ADD COLUMN success_check_ins INTEGER DEFAULT 0,
ADD COLUMN avg_check_in_latency_ms INTEGER,
ADD COLUMN avg_confidence FLOAT;

-- Create PersonCheckInCooldown table
CREATE TABLE person_check_in_cooldowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_participant_id VARCHAR(255) NOT NULL,
  event_id VARCHAR(255) NOT NULL,
  failed_attempts INTEGER DEFAULT 0,
  current_cooldown_ms INTEGER NOT NULL,
  cooldown_ends_at TIMESTAMP NOT NULL,
  last_attempt_at TIMESTAMP NOT NULL,
  reset_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT person_check_in_cooldown_unique UNIQUE(event_participant_id, event_id)
);

-- Create indices for PersonCheckInCooldown
CREATE INDEX idx_person_check_in_cooldown_event_participant_id ON person_check_in_cooldowns(event_participant_id);
CREATE INDEX idx_person_check_in_cooldown_event_id ON person_check_in_cooldowns(event_id);
CREATE INDEX idx_person_check_in_cooldown_cooldown_ends_at ON person_check_in_cooldowns(cooldown_ends_at);

-- Create CheckInMetrics table
CREATE TABLE check_in_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  totem_event_subscription_id VARCHAR(255) NOT NULL,
  event_id VARCHAR(255) NOT NULL,
  organization_id VARCHAR(255) NOT NULL,
  hour TIMESTAMP NOT NULL,
  check_in_count INTEGER NOT NULL,
  success_count INTEGER NOT NULL,
  failure_count INTEGER NOT NULL,
  avg_latency_ms FLOAT NOT NULL,
  p95_latency_ms FLOAT NOT NULL,
  avg_confidence FLOAT NOT NULL,
  low_quality_count INTEGER DEFAULT 0,
  low_confidence_count INTEGER DEFAULT 0,
  cooldown_count INTEGER DEFAULT 0,
  liveness_fail_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT check_in_metrics_unique UNIQUE(totem_event_subscription_id, hour)
);

-- Create indices for CheckInMetrics
CREATE INDEX idx_check_in_metrics_event_id ON check_in_metrics(event_id);
CREATE INDEX idx_check_in_metrics_organization_id ON check_in_metrics(organization_id);
CREATE INDEX idx_check_in_metrics_hour ON check_in_metrics(hour);
CREATE INDEX idx_check_in_metrics_totem_event_subscription_id ON check_in_metrics(totem_event_subscription_id);

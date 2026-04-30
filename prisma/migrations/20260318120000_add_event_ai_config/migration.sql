CREATE TABLE "event_ai_configs" (
  "id" TEXT NOT NULL,
  "event_id" TEXT NOT NULL,
  "confidence_threshold" DOUBLE PRECISION NOT NULL DEFAULT 0.75,
  "detection_interval_ms" INTEGER NOT NULL DEFAULT 500,
  "max_faces" INTEGER NOT NULL DEFAULT 1,
  "liveness_detection" BOOLEAN NOT NULL DEFAULT false,
  "min_face_size" INTEGER NOT NULL DEFAULT 80,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "event_ai_configs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "event_ai_configs_event_id_key" ON "event_ai_configs"("event_id");

ALTER TABLE "event_ai_configs"
ADD CONSTRAINT "event_ai_configs_event_id_fkey"
FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

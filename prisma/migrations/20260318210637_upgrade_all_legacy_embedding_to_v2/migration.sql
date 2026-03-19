-- CreateIndex
CREATE INDEX "check_ins_checked_in_at_idx" ON "check_ins"("checked_in_at");

-- CreateIndex
CREATE INDEX "check_ins_event_participant_id_checked_in_at_idx" ON "check_ins"("event_participant_id", "checked_in_at");

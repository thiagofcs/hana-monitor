-- Step 1: Add columns as nullable first
ALTER TABLE "metric_snapshots" ADD COLUMN "metric_id" TEXT;
ALTER TABLE "metric_snapshots" ADD COLUMN "instance_id" TEXT;

-- Step 2: Backfill from the related schedule
UPDATE "metric_snapshots" ms
SET "metric_id" = s."metric_id",
    "instance_id" = s."instance_id"
FROM "schedules" s
WHERE ms."schedule_id" = s."id";

-- Step 3: Make columns required
ALTER TABLE "metric_snapshots" ALTER COLUMN "metric_id" SET NOT NULL;
ALTER TABLE "metric_snapshots" ALTER COLUMN "instance_id" SET NOT NULL;

-- CreateIndex
CREATE INDEX "metric_snapshots_metric_id_timestamp_idx" ON "metric_snapshots"("metric_id", "timestamp");

-- CreateIndex
CREATE INDEX "metric_snapshots_instance_id_timestamp_idx" ON "metric_snapshots"("instance_id", "timestamp");

-- AddForeignKey
ALTER TABLE "metric_snapshots" ADD CONSTRAINT "metric_snapshots_metric_id_fkey" FOREIGN KEY ("metric_id") REFERENCES "metrics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric_snapshots" ADD CONSTRAINT "metric_snapshots_instance_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "hana_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

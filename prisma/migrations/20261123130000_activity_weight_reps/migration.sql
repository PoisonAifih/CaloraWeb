-- Strength sets keep weight and reps as numbers so workout volume can be summed.
ALTER TABLE "activity_logs" ADD COLUMN "weight_kg" DOUBLE PRECISION, ADD COLUMN "reps" INTEGER;

-- Sets logged before this were only saved as a name like "Bench · 60kg × 8".
UPDATE "activity_logs"
SET "weight_kg" = substring("activity_name" from '· ([0-9]+(?:\.[0-9]+)?)kg × [0-9]+$')::DOUBLE PRECISION,
    "reps" = substring("activity_name" from '× ([0-9]+)$')::INTEGER
WHERE "activity_type" = 'STRENGTH' AND "activity_name" ~ '· [0-9]+(\.[0-9]+)?kg × [0-9]+$';

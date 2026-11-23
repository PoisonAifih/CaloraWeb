-- Each catering meal is cooked as S, M or L and costs 2, 3 or 4 tokens.
ALTER TABLE "catering_meals" ADD COLUMN "size" TEXT, ADD COLUMN "tokens" INTEGER;

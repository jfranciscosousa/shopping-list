import "dotenv/config";
import { backfillCategoryEmojis } from "@/server/category-emojis";

const batchSize = Number(process.env.CATEGORY_EMOJI_BACKFILL_BATCH_SIZE ?? 25);
const runAll = process.argv.includes("--all");

if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 100) {
  throw new Error("CATEGORY_EMOJI_BACKFILL_BATCH_SIZE must be an integer from 1 through 100.");
}

async function runBackfill() {
  const result = await backfillCategoryEmojis(batchSize);

  if (runAll && result.remaining > 0) return runBackfill();
  return result;
}

console.log(JSON.stringify(await runBackfill()));

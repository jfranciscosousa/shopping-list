# Category emoji backfill

Run the backfill manually after deployment. It updates one batch of categories with no emoji.

Pull the production environment variables, then run:

```bash
pnpm backfill:category-emojis
```

Run the command again until it reports `"remaining": 0`.

Set `CATEGORY_EMOJI_BACKFILL_BATCH_SIZE` to an integer from 1 through 100 to change the batch size.

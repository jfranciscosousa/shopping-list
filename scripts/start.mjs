import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: { port: { type: "string", default: process.env.PORT ?? "3000" } },
});

process.env.PORT = values.port;
await import("../.output/server/index.mjs");

import { expect, it, vi } from "vitest";

it("keeps one ID per tab runtime and creates a new ID after reload", async () => {
  const firstTab = await import("./tab-source");
  const sourceId = firstTab.getTabSourceId();
  expect(firstTab.getTabSourceId()).toBe(sourceId);
  vi.resetModules();
  const reloadedTab = await import("./tab-source");
  expect(reloadedTab.getTabSourceId()).not.toBe(sourceId);
});

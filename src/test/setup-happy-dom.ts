import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
// oxlint-disable-next-line import/no-unassigned-import -- registers DOM matchers
import "@testing-library/jest-dom/vitest";

afterEach(() => {
  cleanup();
});

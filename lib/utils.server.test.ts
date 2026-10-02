import { expect, it } from "vitest";
import { cn } from "./utils";

it("merges conditional classes and resolves Tailwind conflicts", () => {
  expect(cn("px-2", false, { "font-bold": true }, "px-4")).toBe("font-bold px-4");
});

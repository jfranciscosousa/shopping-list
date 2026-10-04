import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Button } from "./button";

it("disables the button while loading", () => {
  render(<Button isLoading>Save</Button>);

  expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
});

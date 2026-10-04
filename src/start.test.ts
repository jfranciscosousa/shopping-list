// @vitest-environment node
import { expect, it, vi } from "vitest";
import { startInstance } from "./start";

it.each<{ headers: Record<string, string>; allowed: boolean }>([
  { headers: { "Sec-Fetch-Site": "same-origin" }, allowed: true },
  { headers: { "Sec-Fetch-Site": "cross-site" }, allowed: false },
  { headers: { "Sec-Fetch-Site": "same-site" }, allowed: false },
  { headers: { Origin: "https://shopping.example.com" }, allowed: true },
  { headers: { Origin: "https://attacker.example.com" }, allowed: false },
  { headers: { Origin: "https://attacker.invalid" }, allowed: false },
  { headers: { Origin: "null" }, allowed: false },
  { headers: { Referer: "https://shopping.example.com/list" }, allowed: true },
  { headers: { Referer: "https://attacker.example.com/" }, allowed: false },
  { headers: {}, allowed: false },
])("validates server-function form submissions: $headers", async ({ headers, allowed }) => {
  const request = new Request("https://shopping.example.com/_serverFn/login", {
    method: "POST",
    headers: new Headers(headers),
    body: new URLSearchParams({ email: "attacker@example.com", password: "password" }),
  });
  const next = vi.fn();
  const { requestMiddleware } = await startInstance.getOptions();
  const result = await requestMiddleware![0].options.server!({
    request,
    pathname: new URL(request.url).pathname,
    handlerType: "serverFn",
    context: undefined,
    next,
  });

  expect(next).toHaveBeenCalledTimes(allowed ? 1 : 0);
  if (!allowed) {
    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(403);
  }
});

it("does not apply CSRF validation to page requests", async () => {
  const next = vi.fn();
  const { requestMiddleware } = await startInstance.getOptions();
  await requestMiddleware![0].options.server!({
    request: new Request("https://shopping.example.com/list"),
    pathname: "/list",
    handlerType: "router",
    context: undefined,
    next,
  });

  expect(next).toHaveBeenCalledOnce();
});

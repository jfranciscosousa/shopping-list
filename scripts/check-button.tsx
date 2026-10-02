import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { Button } from "@/components/ui/button";

const link = renderToStaticMarkup(
  <Button asChild variant="ghost" size="sm" className="h-10 px-4">
    <a href="/pantry">Pantry</a>
  </Button>,
);

assert.match(link, /^<a\s/);
assert.match(link, /^<a[^>]*class="[^"]*\bh-10\b/);
assert.match(link, /^<a[^>]*class="[^"]*\bpx-4\b/);
assert.match(link, /^<a[^>]*href="\/pantry"/);

const loadingButton = renderToStaticMarkup(<Button isLoading>Save</Button>);
assert.match(loadingButton, /^<button[^>]*disabled=""/);

console.log("Button semantics check passed.");

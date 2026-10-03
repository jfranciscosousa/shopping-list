const { test } = require("node:test");
const assert = require("node:assert/strict");
const cleanup = require("./neon-preview-cleanup.cjs");

const project = "winter-bird-75963371";
function fixture({
  ref = "fs/example",
  branch = {},
  pages,
  status = 200,
  pr = {},
  open = [],
} = {}) {
  const target = {
    id: "br-preview-123",
    project_id: project,
    name: `preview/${ref}`,
    parent_id: "br-production-123",
    default: false,
    protected: false,
    ...branch,
  };
  const calls = [];
  let page = 0;
  const args = {
    context: {
      eventName: "pull_request_target",
      repo: { owner: "owner", repo: "repo" },
      payload: { action: "closed", pull_request: { number: 123 } },
    },
    core: { info() {} },
    env: {
      NEON_API_KEY: "fake",
      NEON_PROJECT_ID: project,
      NEON_PRODUCTION_BRANCH_ID: "br-production-123",
    },
    github: {
      rest: {
        pulls: {
          get: async () => ({
            data: { state: "closed", head: { ref, repo: { full_name: "owner/repo" } }, ...pr },
          }),
          list() {},
        },
        repos: { get: async () => ({ data: { default_branch: "master" } }) },
      },
      paginate: async () => open,
    },
    request: async (url, options) => {
      calls.push({ url, method: options.method });
      const isDetail = new URL(url).pathname.endsWith(target.id);
      const code = isDetail ? status : 200;
      return {
        status: code,
        ok: code >= 200 && code < 300,
        json: async () =>
          isDetail ? { branch: target } : (pages?.[page++] ?? { branches: [target] }),
      };
    },
  };
  return { args, calls };
}

for (const merged of [true, false]) {
  test(`closed PR (merged=${merged}) deletes exactly the preview ID`, async () => {
    const { args, calls } = fixture({ pr: { merged } });
    await cleanup(args);
    assert.deepEqual(
      calls.map((c) => c.method),
      ["GET", "GET", "DELETE"],
    );
    assert.equal(
      calls[2].url,
      `https://console.neon.tech/api/v2/projects/${project}/branches/br-preview-123`,
    );
  });
}
for (const branch of [
  { id: "br-production-123" },
  { default: true },
  { protected: true },
  { primary: true },
  { parent_id: null },
  { protected: undefined },
  { default: undefined },
  { project_id: "wrong" },
  { id: "../production" },
]) {
  test(`unsafe metadata ${JSON.stringify(branch)} never deletes`, async () => {
    const { args, calls } = fixture({ branch });
    await assert.rejects(cleanup(args));
    assert.ok(calls.every((c) => c.method === "GET"));
  });
}
test("renamed branch fails fresh detail validation", async () => {
  const { args, calls } = fixture();
  const request = args.request;
  args.request = async (...inputs) => {
    const response = await request(...inputs);
    if (calls.length === 2) response.json = async () => ({ branch: { name: "production" } });
    return response;
  };
  await assert.rejects(cleanup(args));
  assert.equal(calls.length, 2);
});
for (const options of [
  { pr: { state: "open" } },
  { pr: { head: { ref: "fs/example", repo: { full_name: "fork/repo" } } } },
  { open: [{ head: { ref: "fs/example", repo: { full_name: "owner/repo" } } }] },
]) {
  test(`reopened, fork, or shared preview skips: ${JSON.stringify(options)}`, async () => {
    const { args, calls } = fixture(options);
    await cleanup(args);
    assert.equal(calls.length, 0);
  });
}
for (const ref of ["master", "main", "production"]) {
  test(`production Git ref ${ref} refuses cleanup`, async () => {
    const { args, calls } = fixture({ ref });
    await assert.rejects(cleanup(args));
    assert.equal(calls.length, 0);
  });
}
test("missing secrets or wrong project fail before Neon access", async () => {
  await Promise.all(
    [
      {},
      {
        NEON_API_KEY: "fake",
        NEON_PROJECT_ID: "other",
        NEON_PRODUCTION_BRANCH_ID: "br-production-123",
      },
    ].map(async (env) => {
      const { args, calls } = fixture();
      args.env = env;
      await assert.rejects(cleanup(args));
      assert.equal(calls.length, 0);
    }),
  );
});
test("absent branch succeeds without deletion", async () => {
  const { args, calls } = fixture({
    pages: [{ branches: [{ name: "preview/fs/example-extra" }, { name: "main" }] }],
  });
  await cleanup(args);
  assert.equal(calls.length, 1);
});
test("already deleted during detail GET or DELETE succeeds", async () => {
  const { args, calls } = fixture({ status: 404 });
  await cleanup(args);
  assert.equal(calls.length, 2);
  const next = fixture();
  const request = next.args.request;
  next.args.request = async (url, options) =>
    options.method === "DELETE" ? { status: 404, ok: false } : request(url, options);
  await cleanup(next.args);
});
test("pagination finds an exact name on a later page", async () => {
  const { args, calls } = fixture({
    pages: [
      { branches: [], pagination: { next: "cursor/value" } },
      { branches: [{ id: "br-preview-123", name: "preview/fs/example" }] },
    ],
  });
  await cleanup(args);
  assert.equal(new URL(calls[1].url).searchParams.get("cursor"), "cursor/value");
  assert.equal(calls.at(-1).method, "DELETE");
});
test("duplicate matches and broken pagination refuse deletion", async () => {
  await Promise.all(
    [
      [{ branches: [{ name: "preview/fs/example" }, { name: "preview/fs/example" }] }],
      [
        { branches: [], pagination: { next: "same" } },
        { branches: [], pagination: { next: "same" } },
      ],
      [{}],
    ].map(async (pages) => {
      const { args, calls } = fixture({ pages });
      await assert.rejects(cleanup(args));
      assert.ok(calls.every((c) => c.method === "GET"));
    }),
  );
});
test("HTTP failures are not treated as missing branches", async () => {
  await Promise.all(
    [401, 403, 429, 500].map(async (status) => {
      const { args, calls } = fixture({ status });
      await assert.rejects(cleanup(args));
      assert.ok(calls.every((c) => c.method === "GET"));
    }),
  );
});
test("untrusted ref remains literal data", async () => {
  const { args, calls } = fixture({ ref: 'fs/$(touch-pwned);"${process.exit()}' });
  await cleanup(args);
  assert.equal(calls.at(-1).method, "DELETE");
  assert.ok(calls.every((c) => !c.url.includes("touch-pwned")));
});

const EXPECTED_PROJECT_ID = "winter-bird-75963371";

async function findBranch(api, base, name) {
  const matches = [];
  const cursors = new Set();
  let cursor;
  do {
    const url = new URL(base);
    url.searchParams.set("limit", "100");
    if (cursor) url.searchParams.set("cursor", cursor);
    // Each page requires the cursor returned by the preceding request.
    // oxlint-disable-next-line no-await-in-loop
    const page = await api(url.href);
    if (!Array.isArray(page.branches)) throw new Error("Invalid Neon branch listing.");
    matches.push(...page.branches.filter((branch) => branch.name === name));
    cursor = page.pagination?.next;
    if (cursor) {
      if (typeof cursor !== "string" || cursors.has(cursor))
        throw new Error("Invalid Neon pagination cursor.");
      cursors.add(cursor);
    }
  } while (cursor);
  if (matches.length > 1) throw new Error("Ambiguous preview branch; refusing deletion.");
  return matches[0];
}

function verifyBranch(branch, id, project, name) {
  // Missing safety metadata must fail closed, not act like false.
  if (
    branch?.id !== id ||
    branch.project_id !== project ||
    branch.name !== name ||
    !branch.parent_id ||
    branch.default !== false ||
    branch.protected !== false ||
    branch.primary === true
  ) {
    throw new Error("Refusing root, default, protected, renamed, or unverified Neon branch.");
  }
}

async function previewRef(github, context, core) {
  const { owner, repo } = context.repo;
  const repository = `${owner}/${repo}`;
  if (context.eventName !== "pull_request_target" || context.payload.action !== "closed") {
    throw new Error("Cleanup requires a closed pull_request_target event.");
  }
  const { data: pr } = await github.rest.pulls.get({
    owner,
    repo,
    pull_number: context.payload.pull_request.number,
  });
  if (pr.state !== "closed" || pr.head.repo?.full_name !== repository) {
    core.info("Skipping reopened or fork pull request.");
    return;
  }
  const { data: repoDetails } = await github.rest.repos.get({ owner, repo });
  if (
    !pr.head.ref ||
    ["master", "main", "production", repoDetails.default_branch].includes(pr.head.ref)
  ) {
    throw new Error("Refusing cleanup for a production or default Git branch.");
  }
  const openPrs = await github.paginate(github.rest.pulls.list, {
    owner,
    repo,
    state: "open",
    per_page: 100,
  });
  if (
    openPrs.some(
      (other) => other.head.repo?.full_name === repository && other.head.ref === pr.head.ref,
    )
  ) {
    core.info("Skipping preview branch still used by an open pull request.");
    return;
  }

  return pr.head.ref;
}

module.exports = async function cleanup({
  github,
  context,
  core,
  env = process.env,
  request = fetch,
}) {
  const ref = await previewRef(github, context, core);
  if (!ref) return;
  const {
    NEON_API_KEY: key,
    NEON_PROJECT_ID: project,
    NEON_PRODUCTION_BRANCH_ID: production,
  } = env;
  if (!key || project !== EXPECTED_PROJECT_ID || !/^br-[a-z0-9-]+$/.test(production ?? "")) {
    throw new Error(
      "Configure NEON_API_KEY, the verified NEON_PROJECT_ID, and NEON_PRODUCTION_BRANCH_ID secrets.",
    );
  }
  const base = `https://console.neon.tech/api/v2/projects/${encodeURIComponent(project)}/branches`;
  async function api(url, method = "GET") {
    const response = await request(url, {
      method,
      headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
      redirect: "error",
      signal: AbortSignal.timeout(30000),
    });
    if (response.status === 404 && url.startsWith(`${base}/`)) return null;
    if (!response.ok) throw new Error(`Neon ${method} failed with HTTP ${response.status}.`);
    return method === "DELETE" ? true : response.json();
  }

  const name = `preview/${ref}`;
  const match = await findBranch(api, base, name);
  if (!match) {
    core.info("Preview branch is already absent; nothing to delete.");
    return;
  }
  const id = match.id;
  if (!/^br-[a-z0-9-]+$/.test(id ?? "") || id === production) {
    throw new Error("Refusing invalid or production Neon branch ID.");
  }
  const url = `${base}/${encodeURIComponent(id)}`;
  const details = await api(url);
  if (!details) {
    core.info("Preview branch was already deleted.");
    return;
  }
  verifyBranch(details.branch, id, project, name);
  await api(url, "DELETE");
  core.info("Preview branch deleted or already absent.");
};

import { createClient } from "@libsql/client";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
await mkdir(resolve(root, ".nuxt"), { recursive: true });
const fixture = await mkdtemp(resolve(root, ".nuxt/oauth-smoke-"));
const databaseUrl = `file:${fixture}/local.db`;
const db = createClient({ url: databaseUrl });
const migrations = (await readdir(resolve(root, "lib/db/migrations"))).filter(name => name.endsWith(".sql")).sort();
for (const migration of migrations) await db.executeMultiple(await readFile(resolve(root, "lib/db/migrations", migration), "utf8"));
const socket = createServer();
await new Promise(resolvePort => socket.listen(0, "127.0.0.1", resolvePort));
const port = socket.address().port;
await new Promise(resolvePort => socket.close(resolvePort));
const base = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, ["--import", new URL("./github-oauth-fixture.mjs", import.meta.url).href, ".output/server/index.mjs"], {
  cwd: root,
  env: {
    NODE_ENV: "production",
    NITRO_HOST: "127.0.0.1",
    NITRO_PORT: String(port),
    TURSO_DATABASE_URL: databaseUrl,
    BETTER_AUTH_URL: base,
    BETTER_AUTH_SECRET: "local-security-test-secret-with-more-than-32-characters",
    GH_CLIENT_ID: "local-fixture-client",
    GH_CLIENT_SECRET: "local-fixture-secret",
    BETTER_AUTH_TELEMETRY_ENABLED: "false",
  },
  stdio: ["ignore", "pipe", "pipe"],
});
let errors = "";
let serverOutput = "";
child.stderr.on("data", (chunk) => {
  errors += chunk.toString();
});
child.stdout.on("data", (chunk) => {
  serverOutput += chunk.toString();
});
const cookies = new Map();
async function request(path, options = {}) {
  const response = await fetch(base + path, {
    ...options,
    redirect: "manual",
    signal: AbortSignal.timeout(15000),
    headers: { "origin": base, "cookie": [...cookies].map(([key, value]) => `${key}=${value}`).join("; "), "content-type": "application/json", ...options.headers },
  });
  for (const value of response.headers.getSetCookie()) {
    const pair = value.split(";")[0];
    const index = pair.indexOf("=");
    const key = pair.slice(0, index);
    if (/max-age=0/i.test(value))
      cookies.delete(key);
    else cookies.set(key, pair.slice(index + 1));
  }
  return response;
}
try {
  await new Promise((ready, reject) => {
    let output = "";
    const timer = setTimeout(() => reject(new Error(`Server startup timed out: ${errors}`)), 30000);
    child.on("error", reject);
    child.on("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`Server exited: ${code} ${errors}`));
    });
    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
      if (output.includes(base)) {
        clearTimeout(timer);
        ready();
      }
    });
  });
  const start = await request("/api/auth/sign-in/social", { method: "POST", body: JSON.stringify({ provider: "github", callbackURL: `${base}/` }) });
  assert.equal(start.status, 200, (await start.clone().text()) + errors + serverOutput);
  const redirect = new URL((await start.json()).url);
  assert.equal(redirect.hostname, "github.com");
  assert.equal(redirect.searchParams.get("client_id"), "local-fixture-client");
  assert.equal(redirect.searchParams.get("redirect_uri"), `${base}/api/auth/callback/github`);
  const state = redirect.searchParams.get("state");
  assert(state);
  const callback = await request(`/api/auth/callback/github?code=local-fixture-code&state=${encodeURIComponent(state)}`);
  assert.equal(callback.status, 302, await callback.clone().text());
  assert.equal(callback.headers.get("location"), `${base}/`, errors);
  const session = await request("/api/auth/get-session");
  assert.equal(session.status, 200);
  const authenticated = await session.json();
  assert.equal(authenticated?.user?.email, "fixture@example.invalid", errors);
  assert.equal((await db.execute("SELECT count(*) AS n FROM user WHERE email='fixture@example.invalid'")).rows[0].n, 1);
  assert.equal((await db.execute("SELECT count(*) AS n FROM account WHERE provider_id='github'")).rows[0].n, 1);
  assert.equal((await db.execute("SELECT count(*) AS n FROM session")).rows[0].n, 1);
  const logout = await request("/api/auth/sign-out", { method: "POST", body: "{}" });
  assert.equal(logout.status, 200);
  assert.equal((await db.execute("SELECT count(*) AS n FROM session")).rows[0].n, 0);
  const anonymous = await request("/api/auth/get-session");
  assert.equal(await anonymous.json(), null);
  process.stdout.write("GitHub redirect/callback, user/account/session writes, authenticated session read, and sign-out passed against committed migrations.\n");
}
finally {
  if (child.exitCode === null && child.signalCode === null) {
    const exited = new Promise(resolveExit => child.once("exit", resolveExit));
    child.kill("SIGTERM");
    const timer = setTimeout(() => child.kill("SIGKILL"), 2000);
    await exited;
    clearTimeout(timer);
  }
  db.close();
  await rm(fixture, { recursive: true, force: true });
}

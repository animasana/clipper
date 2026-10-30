import { spawnSync } from "node:child_process";

const command = process.platform === "win32" ? "npx.cmd" : "npx";
// shell: true is required on Windows: Node refuses to spawn .cmd files without a shell (CVE-2024-27980).
const result = spawnSync(
  command,
  ["wrangler", "d1", "execute", "DB", "--local", "--file=scripts/seed.sql", "--config", "wrangler.jsonc"],
  { cwd: process.cwd(), stdio: "inherit", shell: true },
);

if (result.error) throw result.error;
process.exit(result.status ?? 1);

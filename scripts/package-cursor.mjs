import { spawnSync } from "node:child_process";
import process from "node:process";

const build = spawnSync("corepack", ["pnpm", "--dir", "packages/cursor-extension", "build"], {
  stdio: "inherit",
  shell: process.platform === "win32"
});

if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

const result = spawnSync("corepack", ["pnpm", "--dir", "packages/cursor-extension", "exec", "vsce", "package", "--no-dependencies"], {
  stdio: "inherit",
  shell: process.platform === "win32"
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

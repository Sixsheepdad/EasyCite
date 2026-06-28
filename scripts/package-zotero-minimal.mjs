import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const staging = path.join(repoRoot, ".tmp-zotero-minimal-xpi");
const output = path.join(repoRoot, "citebridge-zotero-minimal-0.0.1.xpi");

await fs.rm(staging, { recursive: true, force: true });
await fs.rm(output, { force: true });
await fs.mkdir(staging, { recursive: true });

await fs.writeFile(
  path.join(staging, "manifest.json"),
  `${JSON.stringify(
    {
      manifest_version: 2,
      name: "CiteBridge Minimal",
      version: "0.0.1",
      description: "Minimal install test for CiteBridge.",
      homepage_url: "https://example.com/citebridge",
      author: "CiteBridge",
      applications: {
        zotero: {
          id: "citebridge-minimal@easycite.com",
          update_url: "https://example.com/citebridge/updates.json",
          strict_min_version: "6.999",
          strict_max_version: "9.*"
        }
      }
    },
    null,
    2
  )}\n`,
  "utf8"
);

await fs.writeFile(
  path.join(staging, "bootstrap.js"),
  [
    "async function install() {}",
    "async function startup() { Zotero.debug('CiteBridge Minimal startup'); }",
    "async function shutdown() {}",
    "async function uninstall() {}",
    ""
  ].join("\n"),
  "utf8"
);

const pythonScript = [
  "import os, zipfile",
  "root = r'''%STAGING%'''",
  "out = r'''%OUTPUT%'''",
  "with zipfile.ZipFile(out, 'w', compression=zipfile.ZIP_DEFLATED) as z:",
  "    files = []",
  "    for dirpath, _, filenames in os.walk(root):",
  "        for name in filenames:",
  "            full = os.path.join(dirpath, name)",
  "            rel = os.path.relpath(full, root).replace(os.sep, '/')",
  "            files.append((rel, full))",
  "    files.sort(key=lambda item: (item[0] != 'manifest.json', item[0]))",
  "    for rel, full in files:",
  "        z.write(full, rel)"
]
  .join("\n")
  .replace("%STAGING%", staging)
  .replace("%OUTPUT%", output);

const result = spawnSync("python", ["-c", pythonScript], { stdio: "inherit" });
await fs.rm(staging, { recursive: true, force: true });
process.exit(result.status ?? 0);

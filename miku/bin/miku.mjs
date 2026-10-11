#!/usr/bin/env node
/**
 * `miku` launcher.
 *
 * MIKU ships TypeScript source so it needs no build step, which is what lets it
 * sit in a host's app without a compile pipeline. That leaves the CLI needing to
 * run a .ts file directly, which Node only learned to do in 22.6.
 *
 * This shim exists so `npx miku ingest` works on a plain Node install with no
 * extra dependency. It re-executes the CLI with type stripping enabled, passing
 * the flag only where it is still needed, and gives a usable message where the
 * runtime is too old to run it at all.
 */
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const here = dirname(fileURLToPath(import.meta.url))
const cli = join(here, "..", "src", "cli.ts")
const args = process.argv.slice(2)

const [major, minor] = process.versions.node.split(".").map(Number)
const stripsByDefault = major > 23 || (major === 23 && minor >= 6)
const canStrip = stripsByDefault || (major === 22 && minor >= 6)

if (!canStrip) {
  console.error(
    `miku requires Node 22.6 or newer (this is ${process.versions.node}).\n` +
      `Either upgrade Node, or run the CLI through your project's TypeScript runner:\n\n` +
      `  npx tsx node_modules/miku/src/cli.ts ${args.join(" ")}\n`
  )
  process.exit(1)
}

const nodeArgs = stripsByDefault ? [] : ["--experimental-strip-types", "--no-warnings"]
const result = spawnSync(process.execPath, [...nodeArgs, cli, ...args], {
  stdio: "inherit",
})

if (result.error) {
  console.error(`miku: ${result.error.message}`)
  process.exit(1)
}
process.exit(result.status ?? 1)

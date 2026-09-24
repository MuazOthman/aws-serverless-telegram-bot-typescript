/**
 * Bundles src/handler.ts into dist/handler.mjs, the folder `sam deploy` uploads.
 *
 * Usage: pnpm build
 */
import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = new URL("..", import.meta.url);
const path = (relative: string) => fileURLToPath(new URL(relative, root));

rmSync(path("dist"), { recursive: true, force: true });

await build({
  entryPoints: [path("src/handler.ts")],
  outfile: path("dist/handler.mjs"),
  bundle: true,
  platform: "node",
  target: "node24",
  format: "esm",
  sourcemap: true,
  minify: true,
  // Minifying renames classes, and some dependencies check class names at runtime.
  // Without this the bot's requests to Telegram hang until the Lambda times out.
  keepNames: true,
  // Swap grammY's node-fetch v2 and abort-controller dependencies for Node's built-ins,
  // which avoids node-fetch's deprecation warnings and shrinks the bundle (see src/shims/).
  alias: {
    "node-fetch": path("src/shims/node-fetch.ts"),
    "abort-controller": path("src/shims/abort-controller.ts"),
  },
  // Bundled CommonJS dependencies call require(), which ESM output doesn't define.
  banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" },
  logLevel: "info",
});

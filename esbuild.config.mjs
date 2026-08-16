import { context } from "esbuild";
import { obsidianCopyEsbuild } from "@22-2/obsidian-copy-bundler-plugin";

const watch = process.argv.includes("--watch");

const buildOptions = {
  entryPoints: ["src/main.ts"],
  bundle: true,
  platform: "browser",
  format: "cjs",
  target: "esnext",
  external: ["obsidian"],
  outfile: "main.js",
  logLevel: "info",
  plugins: [
    obsidianCopyEsbuild({
      targetDir: "E:\\AppData\\obsidian\\vaults\\suizen\\.obsidian\\plugins\\japanese-manuscript-counter",
      force: true,
    }),
  ],
};

const builder = await context(buildOptions);

if (watch) {
  await builder.watch();
  console.log("Watching for changes...");
} else {
  await builder.rebuild();
  await builder.dispose();
}

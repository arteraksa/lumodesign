import { cp, mkdir, rm, writeFile } from "node:fs/promises";

const outputDirectory = new URL("./dist/", import.meta.url);
const excluded = new Set(["dist", "build.mjs", "package.json", "vercel.json", "supabase-config.js", "supabase-config.example.js"]);

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

for (const entry of ["app.js", "data", "index.html", "modules", "styles.css"]) {
  await cp(new URL(`./${entry}`, import.meta.url), new URL(`./${entry}`, outputDirectory), { recursive: true });
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !anonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
}

await writeFile(
  new URL("./supabase-config.js", outputDirectory),
  `window.RAKSA_SUPABASE = ${JSON.stringify({ url, anonKey })};\n`,
  "utf8",
);

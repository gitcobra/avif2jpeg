import { readdirSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const srcDir = join(__dirname, "..", "src");
const localesDir = join(srcDir, "locales");
const outputPath = join(srcDir, "langlist.json");

const output = {};

for (const name of readdirSync(localesDir)) {
  if (!name.endsWith(".json")) continue;

  const lang = name.replace(/\.json$/i, "");
  const path = join(localesDir, name);

  const dat = JSON.parse(readFileSync(path, "utf8"));
  output[lang] = `${dat.lang.replace(/\s+\(.+/, "")}` +
    (lang !== 'en' ? ` (${dat.langName})` : '');
}

writeFileSync(outputPath, JSON.stringify(output, null, "\t"));
console.log("output:", outputPath);

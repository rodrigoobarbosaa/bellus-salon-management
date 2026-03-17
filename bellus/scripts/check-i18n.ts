import fs from "fs";
import path from "path";

const LOCALES_DIR = path.resolve(__dirname, "../src/locales");
const BASE_LOCALE = "es";
const LOCALES = ["pt", "en", "ru"];

function flattenKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      keys.push(...flattenKeys(value as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function loadJson(locale: string): Record<string, unknown> {
  const filePath = path.join(LOCALES_DIR, locale, "common.json");
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

let hasErrors = false;

const baseJson = loadJson(BASE_LOCALE);
const baseKeys = flattenKeys(baseJson).sort();

console.log(`Base locale (${BASE_LOCALE}): ${baseKeys.length} keys\n`);

for (const locale of LOCALES) {
  const json = loadJson(locale);
  const keys = flattenKeys(json).sort();

  const missing = baseKeys.filter((k) => !keys.includes(k));
  const extra = keys.filter((k) => !baseKeys.includes(k));

  console.log(`--- ${locale.toUpperCase()} ---`);
  console.log(`  Keys: ${keys.length}/${baseKeys.length}`);

  if (missing.length > 0) {
    hasErrors = true;
    console.log(`  MISSING (${missing.length}):`);
    missing.forEach((k) => console.log(`    - ${k}`));
  }

  if (extra.length > 0) {
    console.log(`  EXTRA (${extra.length}):`);
    extra.forEach((k) => console.log(`    + ${k}`));
  }

  if (missing.length === 0 && extra.length === 0) {
    console.log(`  OK - All keys match`);
  }

  console.log();
}

if (hasErrors) {
  console.error("i18n coverage check FAILED - missing keys found");
  process.exit(1);
} else {
  console.log("i18n coverage check PASSED");
}

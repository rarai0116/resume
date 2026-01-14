// scripts/render-md.js
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" }); // ローカルの実値
dotenv.config(); // .env があれば併用（任意）

const SRC = resolve("docs/resume.template.md");
const OUT = resolve(".tmp/resume.local.md");

const src = readFileSync(SRC, "utf8");

// {{KEY}} or {{KEY|default}} を置換
const rendered = src.replace(/{{\s*([A-Z0-9_]+)(?:\|([^}]*))?\s*}}/g, (_, key, def) => {
  const v = process.env[key];
  if (v && v.trim().length > 0) return v;
  return def !== undefined ? def : "";
});

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, rendered, "utf8");

console.log("Rendered:", OUT);
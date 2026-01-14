import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { extname } from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" }); // ローカルの実値

const env = process.env;

// 基本PIIキー
const baseKeys = ["NAME", "DOB", "RESIDENCE", "LASTEDUCATION"];

// 組織系（匿名キー）：P_ORG_001..999
const orgKeys = Object.keys(env).filter((k) => /^P_ORG_\d{3}$/.test(k));

// 任意追加（カンマ区切り）
const extraKeys = (env.SENSITIVE_KEYS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const keys = [...baseKeys, ...orgKeys, ...extraKeys];

const sensitiveValues = keys
  .map((k) => env[k])
  .filter((v) => v && v.trim().length >= 2);

const allowPatterns = (env.LEAK_ALLOW_PATTERNS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function isTextExt(p) {
  const e = extname(p).toLowerCase();
  return [
    ".md",".txt",".json",".yml",".yaml",".js",".ts",".tsx",".jsx",
    ".css",".html",".cjs",".mjs"
  ].includes(e);
}

function getTrackedFiles() {
  const r = spawnSync("git", ["ls-files"], { encoding: "utf8" });
  if (r.status !== 0) {
    console.error("git ls-files に失敗しました");
    process.exit(2);
  }
  return r.stdout
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((p) => !p.startsWith(".husky/"))
    .filter((p) => !p.startsWith(".tmp/"))
    .filter((p) => !p.startsWith("node_modules/"))
    .filter((p) => !p.startsWith(".env"))
    .filter(isTextExt);
}

function containsAllowed(text) {
  if (allowPatterns.length === 0) return false;
  return allowPatterns.some((pat) => pat && text.includes(pat));
}

function scan() {
  if (sensitiveValues.length === 0) {
    process.exit(0);
  }

  const files = getTrackedFiles();
  const hits = [];

  for (const f of files) {
    let content;
    try {
      content = readFileSync(f, "utf8");
    } catch {
      continue;
    }
    for (const val of sensitiveValues) {
      if (!val || containsAllowed(val)) continue;
      if (content.includes(val)) {
        hits.push({ file: f, value: val });
      }
    }
  }

  if (hits.length > 0) {
    console.error("リークチェックに失敗しました。以下の実値が検出されました:");
    for (const h of hits) {
      console.error(`- ${h.file}: "${h.value}"`);
    }
    console.error('対処: テンプレをプレースホルダへ置換し、実値は .env.local で管理してください。');
    process.exit(1);
  } else {
    console.log("リークチェックOK（実値の検出なし）");
    process.exit(0);
  }
}

scan();
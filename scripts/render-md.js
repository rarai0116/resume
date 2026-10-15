// scripts/render-md.js
//
// 使い方:
//   node scripts/render-md.js --variant agent
//   node scripts/render-md.js --variant direct --src private/MX-202610-001.md
//
//   --variant  agent（業務委託・エージェント用）か direct（転職用）。省略時は agent
//   --src      原稿のパス。省略時は docs/resume.template.md
//
// 出力は .tmp/<名前>.<種類>.local.md。<名前> は原稿のファイル名から拡張子と ".template" を除いたもの。
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname, basename } from "node:path";
import { parseArgs } from "node:util";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" }); // ローカルの実値
dotenv.config(); // .env があれば併用（任意）

export const VARIANTS = ["agent", "direct"];
export const DEFAULT_SRC = "docs/resume.template.md";

// 原稿のパスと種類から、出力するMarkdownのパスを決める
export function outputPathFor(src, variant) {
  const name = basename(src).replace(/\.md$/, "").replace(/\.template$/, "");
  return resolve(".tmp", `${name}.${variant}.local.md`);
}

// <!-- only:種類 --> 〜 <!-- /only --> で囲んだ部分を、ビルドする種類に応じて残すか消す
function selectVariant(text, variant) {
  const blocks = /<!--\s*only:([a-z]+)\s*-->[^\S\n]*\n?([\s\S]*?)<!--\s*\/only\s*-->[^\S\n]*\n?/g;
  const result = text.replace(blocks, (_, name, body) => {
    if (!VARIANTS.includes(name)) {
      throw new Error(`未知の種類の印があります: only:${name}（使えるのは ${VARIANTS.join(", ")}）`);
    }
    return name === variant ? body : "";
  });
  if (/<!--\s*\/?only(:[a-z]+)?\s*-->/.test(result)) {
    throw new Error("only の印の対応が取れていません（開きと閉じの数、入れ子の有無を確認してください）");
  }
  return result;
}

// ビルド時に決まる値。環境変数に同じキーがあればそちらを優先する（提出日を固定したいときなど）
const builtins = {
  // 例: 令和8年10月15日（CIはUTCで動くため、日本時間の日付にする）
  BUILD_DATE: new Intl.DateTimeFormat("ja-JP-u-ca-japanese", {
    era: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Tokyo",
  }).format(new Date()),
};

// {{KEY}} or {{KEY|default}} を置換（表の整形で入る "|" 前後の空白と、表の中で使う "\|" も許容）
function fillPlaceholders(text) {
  return text.replace(/{{\s*([A-Z0-9_]+)\s*(?:\\?\|([^}]*))?\s*}}/g, (_, key, def) => {
    const v = process.env[key] || builtins[key];
    if (v && v.trim().length > 0) return v;
    return def !== undefined ? def.trim() : "";
  });
}

export function render({ src = DEFAULT_SRC, variant = "agent" } = {}) {
  if (!VARIANTS.includes(variant)) {
    throw new Error(`--variant は ${VARIANTS.join(" か ")} を指定してください（指定値: ${variant}）`);
  }
  const out = outputPathFor(src, variant);
  const text = readFileSync(resolve(src), "utf8");
  const rendered = fillPlaceholders(selectVariant(text, variant));
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, rendered, "utf8");
  console.log("Rendered:", out);
  return out;
}

// 直接実行されたときだけ引数を読んで動く（build-pdf.js から import されたときは動かない）
if (process.argv[1]?.endsWith("render-md.js")) {
  const { values } = parseArgs({
    options: {
      variant: { type: "string", default: "agent" },
      src: { type: "string", default: DEFAULT_SRC },
    },
  });
  try {
    render({ src: values.src, variant: values.variant });
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}

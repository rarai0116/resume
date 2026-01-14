import { spawnSync } from "node:child_process";
import { accessSync, constants, mkdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

function fileExists(p) {
	try {
		accessSync(p, constants.X_OK);
		return true;
	} catch {
		try {
			accessSync(p, constants.F_OK);
			return true;
		} catch {
			return false;
		}
	}
}

function whichFirst(cmds) {
	const isWin = process.platform === "win32";
	const whichCmd = isWin ? "where" : "which";
	for (const c of cmds) {
		const r = spawnSync(whichCmd, [c], { encoding: "utf8" });
		if (r.status === 0) {
			const first = r.stdout.split(/\r?\n/).find((l) => l.trim());
			if (first && fileExists(first.trim())) return first.trim();
		}
	}
	return null;
}

function detectChrome() {
	const envPath =
		process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH;
	if (envPath && fileExists(envPath)) return envPath;

	const onPath = whichFirst(
		process.platform === "win32"
			? ["chrome", "chrome.exe", "google-chrome", "msedge"]
			: [
					"google-chrome-stable",
					"google-chrome",
					"chromium-browser",
					"chromium",
					"chrome",
				],
	);
	if (onPath) return onPath;

	const candidates = [];
	if (process.platform === "darwin") {
		candidates.push(
			"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
			"/Applications/Chromium.app/Contents/MacOS/Chromium",
			"/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
		);
	} else if (process.platform === "win32") {
		// biome-ignore lint/complexity/useLiteralKeys: 環境変数のキーはリテラルで扱う
		const pf = process.env["PROGRAMFILES"] || "C:\\\\Program Files";
		const pfx86 =
			process.env["PROGRAMFILES(X86)"] || "C:\\\\Program Files (x86)";
		// biome-ignore lint/complexity/useLiteralKeys: 環境変数のキーはリテラルで扱う
		const local = process.env["LOCALAPPDATA"];
		candidates.push(
			join(pf, "Google", "Chrome", "Application", "chrome.exe"),
			join(pfx86, "Google", "Chrome", "Application", "chrome.exe"),
		);
		if (local) {
			candidates.push(
				join(local, "Google", "Chrome", "Application", "chrome.exe"),
			);
		}
	} else {
		candidates.push(
			"/usr/bin/google-chrome-stable",
			"/usr/bin/google-chrome",
			"/usr/bin/chromium",
			"/usr/bin/chromium-browser",
			"/snap/bin/chromium",
		);
	}

	for (const c of candidates) {
		if (fileExists(c)) return c;
	}
	throw new Error(
		"Chrome/Chromium が見つかりません。Chrome をインストールするか、PUPPETEER_EXECUTABLE_PATH を設定してください。",
	);
}

function ensureOutDir() {
	try {
		const cfg = JSON.parse(
			readFileSync(resolve("md-to-pdf.config.json"), "utf8"),
		);
		const out = cfg?.out ? cfg.out : null;
		if (out) {
			const dir = dirname(out);
			if (dir && dir !== ".") mkdirSync(dir, { recursive: true });
		}
	} catch {
		// 何もしない（任意）
	}
}

function main() {
  const chrome = detectChrome();
  ensureOutDir();

  const isWin = process.platform === "win32";
  const mdToPdfBin = resolve("node_modules", ".bin", isWin ? "md-to-pdf.cmd" : "md-to-pdf");

  // 1) 前処理: テンプレを実値でレンダリング
  const renderRes = spawnSync(process.execPath, ["scripts/render-md.js"], {
    stdio: "inherit",
    env: process.env,
  });
  if (renderRes.status !== 0) process.exit(renderRes.status);

  // 2) PDF生成はレンダリング済みの一時MDを入力に
  const args = [".tmp/resume.local.md", "--config-file", "md-to-pdf.config.json"];
  const commonOpts = {
    stdio: "inherit",
    env: { ...process.env, PUPPETEER_EXECUTABLE_PATH: chrome },
  };

  // Windowsは .cmd を直接叩くと EINVAL のことがあるため cmd.exe 経由
  const res = isWin
    ? spawnSync(process.env.comspec || "cmd.exe", ["/c", mdToPdfBin, ...args], commonOpts)
    : spawnSync(mdToPdfBin, args, commonOpts);

  if (res.error) {
    console.error(res.error);
    process.exit(1);
  }
  process.exit(res.status || 0);
}

main();

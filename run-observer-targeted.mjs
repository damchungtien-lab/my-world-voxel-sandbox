import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire("C:/Users/Administrator/.claude/skills/develop-web-game/scripts/web_game_playwright_client.js");
const { chromium } = require("playwright");

const outDir = "output/observer-targeted";
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ["--use-gl=angle", "--use-angle=swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push({ type: "console.error", text: msg.text() });
});
page.on("pageerror", (err) => errors.push({ type: "pageerror", text: String(err) }));
await page.goto("http://127.0.0.1:5173", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(500);
const script = fs.readFileSync("observer-targeted-eval.js", "utf8");
const result = await page.evaluate(script);
await page.screenshot({ path: path.join(outDir, "observer-targeted.png"), fullPage: true });
fs.writeFileSync(path.join(outDir, "result.json"), JSON.stringify(result, null, 2));
fs.writeFileSync(path.join(outDir, "errors.json"), JSON.stringify(errors, null, 2));
await browser.close();
if (!result?.ok || errors.length) {
  console.error(JSON.stringify({ result, errors }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(result, null, 2));

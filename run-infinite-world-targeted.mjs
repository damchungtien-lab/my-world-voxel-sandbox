import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire("C:/Users/Administrator/.codex/skills/develop-web-game/scripts/web_game_playwright_client.js");
const { chromium } = require("playwright");

const outDir = "output/infinite-world-targeted";
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ["--use-gl=angle", "--use-angle=swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push({ type: "console.error", text: msg.text() });
});
page.on("pageerror", (err) => errors.push({ type: "pageerror", text: String(err) }));

await page.goto("http://127.0.0.1:5173", { waitUntil: "domcontentloaded" });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(500);

const script = fs.readFileSync("infinite-world-eval.js", "utf8");
const firstResult = await page.evaluate(script);
await page.screenshot({ path: path.join(outDir, "far-travel.png"), fullPage: true });

await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(500);
const persisted = await page.evaluate((marker) => {
  const api = window.gameTestApi;
  document.querySelector("#play-button")?.click();
  const raw = localStorage.getItem("my-world-voxel-save-v1");
  const saved = raw ? JSON.parse(raw) : null;
  const markerKey = `${marker.x},${marker.y},${marker.z}`;
  const markerEntry = saved?.modified?.find(([key]) => key === markerKey);
  return {
    hasApi: Boolean(api),
    markerKey,
    markerEntry,
    markerBlock: api?.getBlock(marker.x, marker.y, marker.z),
    world: api?.worldInfo(),
    textWorld: JSON.parse(window.render_game_to_text()).world,
  };
}, firstResult.marker);
await page.screenshot({ path: path.join(outDir, "after-reload.png"), fullPage: true });

const result = { firstResult, persisted };
fs.writeFileSync(path.join(outDir, "result.json"), JSON.stringify(result, null, 2));
fs.writeFileSync(path.join(outDir, "errors.json"), JSON.stringify(errors, null, 2));
await browser.close();

const persistedOk = persisted?.markerEntry?.[1] === 10 && persisted?.markerBlock === 10;
if (!firstResult?.ok || !persistedOk || errors.length) {
  console.error(JSON.stringify({ result, errors }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(result, null, 2));

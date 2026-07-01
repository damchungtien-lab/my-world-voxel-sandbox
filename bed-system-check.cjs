const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

(async () => {
  const outDir = path.resolve("output/bed-system-check");
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true, args: ["--use-gl=angle", "--use-angle=swiftshader"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push({ type: "console.error", text: msg.text() });
  });
  page.on("pageerror", (err) => errors.push({ type: "pageerror", text: String(err) }));

  await page.goto("http://127.0.0.1:5173/", { waitUntil: "domcontentloaded" });
  await page.click("#play-button");
  await page.waitForTimeout(250);
  await page.evaluate(() => window.advanceTime?.(500));

  const result = await page.evaluate(() => {
    const api = window.gameTestApi;
    const ids = api.getIds();
    api.addItem(ids.ITEM.WOOL, 3);
    api.addItem(ids.BLOCK.PLANKS, 3);
    const crafted = api.craft("床");
    api.setSelectedItem(ids.BLOCK.BED);
    api.placeBlock(2, 26, 1, ids.BLOCK.BED);
    api.setTargetBlock(2, 26, 1);
    api.setTimeOfDay(0.75);
    const used = api.useTarget();
    const state = JSON.parse(window.render_game_to_text());
    return { crafted, used, state };
  });

  await page.screenshot({ path: path.join(outDir, "bed-check.png"), fullPage: true });
  fs.writeFileSync(path.join(outDir, "results.json"), JSON.stringify({ result, errors }, null, 2));
  await browser.close();

  if (errors.length) {
    console.error(JSON.stringify(errors, null, 2));
    process.exit(1);
  }
  if (!result.crafted || !result.used) {
    console.error("Bed craft/use failed", JSON.stringify(result, null, 2));
    process.exit(1);
  }
  if (result.state.world.timeOfDay < 0.24 || result.state.world.timeOfDay > 0.27) {
    console.error("Bed did not skip to morning", JSON.stringify(result.state.world, null, 2));
    process.exit(1);
  }
  if (!result.state.player.spawnPoint || Math.abs(result.state.player.spawnPoint.x - 2.5) > 0.01) {
    console.error("Bed did not set spawn point", JSON.stringify(result.state.player, null, 2));
    process.exit(1);
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});

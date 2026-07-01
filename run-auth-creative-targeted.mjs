import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire("C:/Users/Administrator/.codex/skills/develop-web-game/scripts/web_game_playwright_client.js");
const { chromium } = require("playwright");

const outDir = "output/auth-creative-targeted";
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ["--use-gl=angle", "--use-angle=swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push({ type: "console.error", text: msg.text() });
});
page.on("pageerror", (err) => errors.push({ type: "pageerror", text: String(err) }));

async function load() {
  await page.goto("http://127.0.0.1:5173/?testApi=1", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(350);
}

async function evalPage(fn, ...args) {
  return page.evaluate(fn, ...args);
}

await load();
await evalPage(() => {
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith("my-world-")) localStorage.removeItem(key);
  }
});
await load();

const failures = [];
const initial = await evalPage(() => window.gameTestApi.authState());
const guestDenied = await evalPage(() => window.gameTestApi.setMode("creative"));

const aliceRegistered = await evalPage(async () => window.gameTestApi.registerAccount("alice", "pass1234"));
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(350);
const aliceState = await evalPage(() => window.gameTestApi.authState());
const aliceDenied = await evalPage(() => window.gameTestApi.setMode("creative"));
const aliceWrongCode = await evalPage(() => window.gameTestApi.unlockCreative("wrong-code"));
const aliceUnlocked = await evalPage(() => window.gameTestApi.unlockCreative("qwertyuiop"));
const aliceCreative = await evalPage(() => window.gameTestApi.setMode("creative"));
const aliceSave = await evalPage(() => {
  const { BLOCK } = window.gameTestApi.getIds();
  window.gameTestApi.placeBlock(10, 32, 10, BLOCK.PLANKS);
  window.gameTestApi.saveNow();
  return window.gameTestApi.savedData();
});
const aliceRendered = await evalPage(() => JSON.parse(window.render_game_to_text()).account);

const bobRegistered = await evalPage(async () => window.gameTestApi.registerAccount("bob", "pass5678"));
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(350);
const bobState = await evalPage(() => window.gameTestApi.authState());
const bobDenied = await evalPage(() => window.gameTestApi.setMode("creative"));
const bobSave = await evalPage(() => {
  const { BLOCK } = window.gameTestApi.getIds();
  window.gameTestApi.placeBlock(11, 32, 10, BLOCK.STONE);
  window.gameTestApi.saveNow();
  return window.gameTestApi.savedData();
});

const aliceLogin = await evalPage(async () => window.gameTestApi.loginAccount("alice", "pass1234"));
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(350);
const aliceAgain = await evalPage(() => window.gameTestApi.authState());
const aliceCreativeAgain = await evalPage(() => window.gameTestApi.setMode("creative"));

const markers = await evalPage(() => {
  const aliceRaw = localStorage.getItem("my-world-voxel-save-v1:alice");
  const bobRaw = localStorage.getItem("my-world-voxel-save-v1:bob");
  const alice = aliceRaw ? JSON.parse(aliceRaw) : null;
  const bob = bobRaw ? JSON.parse(bobRaw) : null;
  return {
    alice: Object.fromEntries(alice?.modified ?? []),
    bob: Object.fromEntries(bob?.modified ?? []),
  };
});

const { BLOCK } = await evalPage(() => window.gameTestApi.getIds());
if (initial.account !== "guest") failures.push("initial account should be guest after storage reset");
if (guestDenied !== "survival") failures.push("guest could enter creative before unlock");
if (!aliceRegistered || aliceState.account !== "alice") failures.push("alice registration/login failed");
if (aliceState.creativeUnlocked) failures.push("alice should not start with creative unlocked");
if (aliceDenied !== "survival") failures.push("alice entered creative before code unlock");
if (aliceWrongCode) failures.push("wrong creative code unlocked creative");
if (!aliceUnlocked || aliceCreative !== "creative") failures.push("correct creative code did not enable creative");
if (!aliceRendered.creativeUnlocked || aliceRendered.name !== "alice") failures.push("render text did not report alice creative unlock");
if (!bobRegistered || bobState.account !== "bob") failures.push("bob registration/login failed");
if (bobState.creativeUnlocked) failures.push("bob inherited alice creative unlock");
if (bobDenied !== "survival") failures.push("bob entered creative without code");
if (!aliceLogin || aliceAgain.account !== "alice" || !aliceAgain.creativeUnlocked) failures.push("alice relogin did not restore creative unlock");
if (aliceCreativeAgain !== "creative") failures.push("alice could not re-enter creative after relogin");
if (aliceState.saveKey === bobState.saveKey) failures.push("alice and bob share the same save key");
if (aliceSave?.player?.mode !== "creative") failures.push("alice save did not retain creative mode after unlock");
if (bobSave?.player?.mode === "creative") failures.push("bob save should not be creative without unlock");
if (markers.alice["10,32,10"] !== BLOCK.PLANKS) failures.push("alice save missing alice marker block");
if (markers.alice["11,32,10"] === BLOCK.STONE) failures.push("alice save contains bob marker block");
if (markers.bob["11,32,10"] !== BLOCK.STONE) failures.push("bob save missing bob marker block");
if (markers.bob["10,32,10"] === BLOCK.PLANKS) failures.push("bob save contains alice marker block");

const result = {
  ok: failures.length === 0,
  failures,
  initial,
  aliceState,
  bobState,
  aliceAgain,
  aliceRendered,
  aliceSaveMode: aliceSave?.player?.mode,
  bobSaveMode: bobSave?.player?.mode,
  markers,
};

await page.screenshot({ path: path.join(outDir, "auth-creative-targeted.png"), fullPage: true });
fs.writeFileSync(path.join(outDir, "result.json"), JSON.stringify(result, null, 2));
fs.writeFileSync(path.join(outDir, "errors.json"), JSON.stringify(errors, null, 2));
await browser.close();
if (!result.ok || errors.length) {
  console.error(JSON.stringify({ result, errors }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(result, null, 2));

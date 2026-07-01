(() => {
  const api = window.gameTestApi;
  const failures = [];
  if (!api || !window.advanceTime || !window.render_game_to_text) {
    return { ok: false, failures: ["test api unavailable"] };
  }

  document.querySelector("#play-button")?.click();

  const { BLOCK } = api.getIds();
  const y = 32;
  api.setMode("creative");
  api.clearEntities();
  api.setTimeOfDay(0.25);
  api.setPlayerPose(2.5, y, 2.5, 0, -0.3);

  for (let x = -3; x <= 12; x += 1) {
    for (let z = -3; z <= 3; z += 1) {
      api.placeBlock(x, y - 1, z, BLOCK.STONE);
      for (let yy = y; yy <= y + 4; yy += 1) api.placeBlock(x, yy, z, BLOCK.AIR);
    }
  }

  api.placeBlock(0, y, 0, BLOCK.LEVER);
  api.placeBlock(1, y, 0, BLOCK.REDSTONE_WIRE);
  api.placeBlock(2, y, 0, BLOCK.PISTON, "east");
  api.placeBlock(3, y, 0, BLOCK.STONE);
  const meta = api.getBlockMeta(2, y, 0);

  api.placeBlock(0, y, 0, BLOCK.LEVER_ON);
  api.updateRedstone();
  window.advanceTime(80);
  const extended = {
    piston: api.getBlock(2, y, 0),
    head: api.getBlock(3, y, 0),
    pushed: api.getBlock(4, y, 0),
    oldSpot: api.getBlock(3, y, 0),
    meta: api.getBlockMeta(2, y, 0),
    redstone: api.redstoneState(),
  };

  api.saveNow();
  const savedWhileExtended = api.savedData();
  const modifiedWhileExtended = Object.fromEntries(savedWhileExtended.modified);

  api.placeBlock(0, y, 0, BLOCK.LEVER);
  api.updateRedstone();
  window.advanceTime(80);
  const retracted = {
    piston: api.getBlock(2, y, 0),
    headSpot: api.getBlock(3, y, 0),
    pushed: api.getBlock(4, y, 0),
    redstone: api.redstoneState(),
  };

  api.placeBlock(6, y, 0, BLOCK.PISTON, "east");
  api.placeBlock(7, y, 0, BLOCK.CHEST);
  api.placeBlock(5, y, 0, BLOCK.LEVER_ON);
  api.updateRedstone();
  window.advanceTime(80);
  const blocked = {
    piston: api.getBlock(6, y, 0),
    chest: api.getBlock(7, y, 0),
    beyond: api.getBlock(8, y, 0),
    redstone: api.redstoneState(),
  };

  api.setMode("survival");
  api.placeBlock(2, y, 2, BLOCK.CRAFTING);
  api.addItem(BLOCK.PLANKS, 3);
  api.addItem(BLOCK.COBBLESTONE, 4);
  api.addItem(BLOCK.REDSTONE_WIRE, 1);
  const beforePistonCount = api.itemCount(BLOCK.PISTON);
  const crafted = api.craft("活塞");
  const afterPistonCount = api.itemCount(BLOCK.PISTON);

  if (meta?.facing !== "east") failures.push("piston facing metadata was not saved as east");
  if (extended.piston !== BLOCK.PISTON_ON) failures.push("powered piston did not become extended piston");
  if (extended.head !== BLOCK.PISTON_HEAD) failures.push("piston did not create a piston head in front");
  if (extended.pushed !== BLOCK.STONE) failures.push("piston did not push the stone block forward");
  if (extended.redstone.poweredPistons < 1 || extended.redstone.extendedPistons < 1) failures.push("redstone state did not report powered/extended piston");
  if (modifiedWhileExtended[`2,${y},0`] !== BLOCK.PISTON) failures.push("saved extended piston was not normalized to base piston");
  if (modifiedWhileExtended[`3,${y},0`] !== BLOCK.AIR) failures.push("saved piston head was not normalized to air");
  if (modifiedWhileExtended[`4,${y},0`] !== BLOCK.STONE) failures.push("saved pushed stone position missing");
  if (retracted.piston !== BLOCK.PISTON) failures.push("piston did not retract to base piston after power loss");
  if (retracted.headSpot !== BLOCK.AIR) failures.push("piston head did not clear after retraction");
  if (retracted.pushed !== BLOCK.STONE) failures.push("normal piston should leave pushed stone in place");
  if (blocked.piston !== BLOCK.PISTON) failures.push("blocked piston should not extend into an immovable chest");
  if (blocked.chest !== BLOCK.CHEST || blocked.beyond !== BLOCK.AIR) failures.push("blocked piston moved an immovable chest");
  if (!crafted) failures.push("piston recipe could not be crafted");
  if (afterPistonCount < beforePistonCount + 1) failures.push("piston craft did not add piston item");

  const state = JSON.parse(window.render_game_to_text());
  return {
    ok: failures.length === 0,
    failures,
    meta,
    extended,
    retracted,
    blocked,
    modifiedWhileExtended,
    crafted,
    beforePistonCount,
    afterPistonCount,
    state,
  };
})()

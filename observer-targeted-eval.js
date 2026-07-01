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

  for (let x = -2; x <= 9; x += 1) {
    for (let z = -2; z <= 2; z += 1) {
      api.placeBlock(x, y - 1, z, BLOCK.STONE);
      for (let yy = y; yy <= y + 4; yy += 1) api.placeBlock(x, yy, z, BLOCK.AIR);
    }
  }

  api.placeBlock(0, y, 0, BLOCK.REDSTONE_LAMP);
  api.placeBlock(1, y, 0, BLOCK.OBSERVER, "east");
  const meta = api.getBlockMeta(1, y, 0);
  api.placeBlock(2, y, 0, BLOCK.DIRT);
  const firstPulse = {
    observer: api.getBlock(1, y, 0),
    lamp: api.getBlock(0, y, 0),
    watched: api.getBlock(2, y, 0),
    redstone: api.redstoneState(),
  };

  api.saveNow();
  const modifiedWhilePulsing = Object.fromEntries(api.savedData().modified);

  window.advanceTime(520);
  const released = {
    observer: api.getBlock(1, y, 0),
    lamp: api.getBlock(0, y, 0),
    redstone: api.redstoneState(),
  };

  api.placeBlock(2, y, 0, BLOCK.AIR);
  const removalPulse = {
    observer: api.getBlock(1, y, 0),
    lamp: api.getBlock(0, y, 0),
    watched: api.getBlock(2, y, 0),
    redstone: api.redstoneState(),
  };

  window.advanceTime(520);
  api.placeBlock(6, y, 0, BLOCK.REDSTONE_LAMP);
  api.placeBlock(5, y, 0, BLOCK.OBSERVER, "west");
  api.placeBlock(4, y, 0, BLOCK.STONE);
  const reverseFacingPulse = {
    observer: api.getBlock(5, y, 0),
    lamp: api.getBlock(6, y, 0),
    redstone: api.redstoneState(),
    meta: api.getBlockMeta(5, y, 0),
  };

  api.setMode("survival");
  api.placeBlock(2, y, 1, BLOCK.CRAFTING);
  api.addItem(BLOCK.COBBLESTONE, 2);
  api.addItem(BLOCK.REDSTONE_WIRE, 1);
  const beforeObserverCount = api.itemCount(BLOCK.OBSERVER);
  const crafted = api.craft("侦测器");
  const afterObserverCount = api.itemCount(BLOCK.OBSERVER);

  if (meta?.facing !== "east") failures.push("observer facing metadata was not saved as east");
  if (firstPulse.observer !== BLOCK.OBSERVER_ON) failures.push("observer did not pulse on watched block placement");
  if (firstPulse.lamp !== BLOCK.REDSTONE_LAMP_ON) failures.push("observer did not power its back-side lamp");
  if (firstPulse.redstone.poweredObservers < 1) failures.push("redstone state did not report powered observer");
  if (modifiedWhilePulsing[`1,${y},0`] !== BLOCK.OBSERVER) failures.push("saved pulsing observer is not normalized to base observer id");
  if (released.observer !== BLOCK.OBSERVER) failures.push("observer did not turn off after pulse duration");
  if (released.lamp !== BLOCK.REDSTONE_LAMP) failures.push("lamp did not turn off after observer pulse");
  if (removalPulse.observer !== BLOCK.OBSERVER_ON) failures.push("observer did not pulse on watched block removal");
  if (removalPulse.lamp !== BLOCK.REDSTONE_LAMP_ON) failures.push("observer removal pulse did not power lamp");
  if (reverseFacingPulse.meta?.facing !== "west") failures.push("west-facing observer metadata missing");
  if (reverseFacingPulse.lamp !== BLOCK.REDSTONE_LAMP_ON) failures.push("west-facing observer did not output to its back side");
  if (!crafted) failures.push("observer recipe could not be crafted");
  if (afterObserverCount < beforeObserverCount + 1) failures.push("observer craft did not add observer item");

  const state = JSON.parse(window.render_game_to_text());
  return {
    ok: failures.length === 0,
    failures,
    firstPulse,
    released,
    removalPulse,
    reverseFacingPulse,
    modifiedWhilePulsing,
    crafted,
    beforeObserverCount,
    afterObserverCount,
    state,
  };
})()

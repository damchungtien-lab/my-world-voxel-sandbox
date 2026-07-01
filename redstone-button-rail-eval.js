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
      for (let yy = y; yy <= y + 3; yy += 1) api.placeBlock(x, yy, z, BLOCK.AIR);
    }
  }

  api.placeBlock(0, y, 0, BLOCK.BUTTON);
  api.placeBlock(1, y, 0, BLOCK.REDSTONE_WIRE);
  api.placeBlock(1, y, 1, BLOCK.REDSTONE_LAMP);
  api.placeBlock(2, y, 0, BLOCK.POWERED_RAIL);
  for (let x = 3; x <= 7; x += 1) api.placeBlock(x, y, 0, BLOCK.RAIL);

  const trigger = api.triggerButton(0, y, 0, 1);
  const cartSpawn = api.spawnEntityAt("minecart", 2.5, y + 0.18, 0.5, {
    vx: 0,
    vz: 0,
    targetYaw: -Math.PI / 2,
    railAxis: "x",
  });
  window.advanceTime(450);
  const poweredCart = api.entityList().find((entity) => entity.type === "minecart");
  const powered = {
    button: api.getBlock(0, y, 0),
    wire: api.getBlock(1, y, 0),
    lamp: api.getBlock(1, y, 1),
    poweredRail: api.getBlock(2, y, 0),
    redstone: api.redstoneState(),
    cart: poweredCart,
  };

  api.saveNow();
  const modifiedWhilePowered = Object.fromEntries(api.savedData().modified);

  window.advanceTime(1250);
  const released = {
    button: api.getBlock(0, y, 0),
    wire: api.getBlock(1, y, 0),
    lamp: api.getBlock(1, y, 1),
    poweredRail: api.getBlock(2, y, 0),
    redstone: api.redstoneState(),
  };

  api.clearEntities();
  api.spawnEntityAt("minecart", 2.5, y + 0.18, 0.5, {
    vx: 3,
    vz: 0,
    targetYaw: -Math.PI / 2,
    railAxis: "x",
  });
  window.advanceTime(500);
  const brakedCart = api.entityList().find((entity) => entity.type === "minecart");

  if (!trigger.ok) failures.push("button trigger api failed");
  if (!cartSpawn || cartSpawn.type !== "minecart") failures.push("minecart did not spawn");
  if (powered.button !== BLOCK.BUTTON_ON) failures.push("button did not turn on");
  if (powered.wire !== BLOCK.REDSTONE_WIRE_ON) failures.push("button did not power redstone wire");
  if (powered.lamp !== BLOCK.REDSTONE_LAMP_ON) failures.push("button did not power lamp");
  if (powered.poweredRail !== BLOCK.POWERED_RAIL_ON) failures.push("button did not power rail");
  if (powered.redstone.poweredButtons < 1) failures.push("redstone state did not report powered button");
  if (powered.redstone.poweredRails < 1) failures.push("redstone state did not report powered rail");
  if (!powered.cart || powered.cart.speed < 0.5 || powered.cart.x <= 2.55) failures.push("powered rail did not accelerate minecart");

  if (modifiedWhilePowered[`0,${y},0`] !== BLOCK.BUTTON) failures.push("saved button is not base id");
  if (modifiedWhilePowered[`1,${y},0`] !== BLOCK.REDSTONE_WIRE) failures.push("saved wire is not base id");
  if (modifiedWhilePowered[`1,${y},1`] !== BLOCK.REDSTONE_LAMP) failures.push("saved lamp is not base id");
  if (modifiedWhilePowered[`2,${y},0`] !== BLOCK.POWERED_RAIL) failures.push("saved powered rail is not base id");

  if (released.button !== BLOCK.BUTTON) failures.push("button did not release after pulse");
  if (released.wire !== BLOCK.REDSTONE_WIRE) failures.push("wire did not turn off after pulse");
  if (released.lamp !== BLOCK.REDSTONE_LAMP) failures.push("lamp did not turn off after pulse");
  if (released.poweredRail !== BLOCK.POWERED_RAIL) failures.push("powered rail did not turn off after pulse");
  if (released.redstone.poweredButtons !== 0) failures.push("redstone state still reports powered button");
  if (released.redstone.poweredRails !== 0) failures.push("redstone state still reports powered rail");
  if (!brakedCart || brakedCart.speed > 1.1) failures.push("unpowered powered rail did not brake minecart");

  const state = JSON.parse(window.render_game_to_text());
  return { ok: failures.length === 0, failures, powered, released, brakedCart, modifiedWhilePowered, state };
})()

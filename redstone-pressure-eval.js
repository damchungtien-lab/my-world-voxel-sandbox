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
  api.setPlayerPose(4.5, y, 1.5, Math.PI, -0.2);

  for (let x = -2; x <= 7; x += 1) {
    for (let z = -2; z <= 3; z += 1) {
      api.placeBlock(x, y - 1, z, BLOCK.STONE);
      for (let yy = y; yy <= y + 3; yy += 1) api.placeBlock(x, yy, z, BLOCK.AIR);
    }
  }

  api.placeBlock(0, y, 0, BLOCK.PRESSURE_PLATE);
  api.placeBlock(1, y, 0, BLOCK.REDSTONE_WIRE);
  api.placeBlock(2, y, 0, BLOCK.REDSTONE_LAMP);
  api.placeBlock(1, y, 1, BLOCK.DOOR, "north");

  api.setPlayerPose(0.5, y, 0.5, Math.PI, -0.2);
  window.advanceTime(250);
  api.updatePressurePlates();
  const pressed = {
    plate: api.getBlock(0, y, 0),
    wire: api.getBlock(1, y, 0),
    lamp: api.getBlock(2, y, 0),
    door: api.getBlock(1, y, 1),
    doorMeta: api.getBlockMeta(1, y, 1),
    redstone: api.redstoneState(),
  };

  api.saveNow();
  const savedWhilePressed = api.savedData();
  const modifiedWhilePressed = Object.fromEntries(savedWhilePressed.modified);

  api.setPlayerPose(4.5, y, 1.5, Math.PI, -0.2);
  window.advanceTime(250);
  api.updatePressurePlates();
  const released = {
    plate: api.getBlock(0, y, 0),
    wire: api.getBlock(1, y, 0),
    lamp: api.getBlock(2, y, 0),
    door: api.getBlock(1, y, 1),
    doorMeta: api.getBlockMeta(1, y, 1),
    redstone: api.redstoneState(),
  };

  if (pressed.plate !== BLOCK.PRESSURE_PLATE_ON) failures.push("pressure plate did not turn on");
  if (pressed.wire !== BLOCK.REDSTONE_WIRE_ON) failures.push("redstone wire did not turn on");
  if (pressed.lamp !== BLOCK.REDSTONE_LAMP_ON) failures.push("redstone lamp did not turn on");
  if (pressed.door !== BLOCK.OPEN_DOOR) failures.push("door did not open from redstone");
  if (pressed.doorMeta?.facing !== "north") failures.push("door facing metadata lost while powered");
  if (pressed.redstone.poweredPressurePlates < 1) failures.push("redstone state did not report powered pressure plate");
  if (pressed.redstone.poweredDoors < 1) failures.push("redstone state did not report powered door");

  if (modifiedWhilePressed[`0,${y},0`] !== BLOCK.PRESSURE_PLATE) failures.push("saved pressure plate is not base id");
  if (modifiedWhilePressed[`1,${y},0`] !== BLOCK.REDSTONE_WIRE) failures.push("saved redstone wire is not base id");
  if (modifiedWhilePressed[`2,${y},0`] !== BLOCK.REDSTONE_LAMP) failures.push("saved redstone lamp is not base id");
  if (modifiedWhilePressed[`1,${y},1`] !== BLOCK.DOOR) failures.push("saved redstone-opened door is not closed base door");

  if (released.plate !== BLOCK.PRESSURE_PLATE) failures.push("pressure plate did not release");
  if (released.wire !== BLOCK.REDSTONE_WIRE) failures.push("redstone wire did not turn off");
  if (released.lamp !== BLOCK.REDSTONE_LAMP) failures.push("redstone lamp did not turn off");
  if (released.door !== BLOCK.DOOR) failures.push("door did not close after redstone release");
  if (released.doorMeta?.facing !== "north") failures.push("door facing metadata lost after release");
  if (released.redstone.poweredPressurePlates !== 0) failures.push("redstone state still reports powered pressure plate");
  if (released.redstone.poweredDoors !== 0) failures.push("redstone state still reports powered door");

  const state = JSON.parse(window.render_game_to_text());
  return { ok: failures.length === 0, failures, pressed, released, modifiedWhilePressed, state };
})()

(() => {
  const api = window.gameTestApi;
  const failures = [];
  if (!api || !window.advanceTime || !window.render_game_to_text) {
    return { ok: false, failures: ["test api unavailable"] };
  }

  document.querySelector("#play-button")?.click();

  const { BLOCK } = api.getIds();
  api.setMode("creative");
  api.clearEntities();

  const origin = api.worldInfo();
  const farSamples = [
    api.sampleChunkAt(4096, -3072),
    api.sampleChunkAt(-8192, 5120),
    api.sampleChunkAt(12345, -9876),
  ];

  const marker = farSamples[0];
  api.setPlayerPose(marker.x + 0.5, marker.surfaceY + 4, marker.z + 0.5, Math.PI, -0.25);
  window.advanceTime(1800);
  const afterTravel = JSON.parse(window.render_game_to_text()).world;

  const markerY = marker.surfaceY + 2;
  api.placeBlock(marker.x, markerY, marker.z, BLOCK.PLANKS);
  const placed = api.getBlock(marker.x, markerY, marker.z);
  api.saveNow();
  const saved = api.savedData();
  const savedMarker = Object.fromEntries(saved.modified)[`${marker.x},${markerY},${marker.z}`];

  if (origin.renderDistanceChunks < 6) failures.push("render distance was not expanded to at least 6 chunks");
  if (origin.renderDistanceBlocks < 96) failures.push("render distance in blocks is too small");
  if (!origin.horizontalScale.includes("infinite")) failures.push("world info does not report infinite horizontal streaming");
  if (farSamples.some((sample) => sample.surfaceY < 1 || sample.surfaceBlock === BLOCK.AIR)) {
    failures.push("far terrain sample did not produce solid surface terrain");
  }
  if (afterTravel.loadedChunks < 90) failures.push("far travel did not stream in the expanded chunk set");
  if (placed !== BLOCK.PLANKS) failures.push("far marker block was not placed");
  if (savedMarker !== BLOCK.PLANKS) failures.push("far marker block was not persisted in save data");

  return {
    ok: failures.length === 0,
    failures,
    origin,
    farSamples,
    afterTravel,
    marker: { x: marker.x, y: markerY, z: marker.z, placed, savedMarker },
  };
})()

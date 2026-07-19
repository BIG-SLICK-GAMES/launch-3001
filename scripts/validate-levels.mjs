import { LevelManager } from '../src/game/LevelManager.js';

const manager = new LevelManager();
const starts = manager.levels.map((level) => level.id);
const failures = [];

for (const startId of starts) {
  const level = manager.load(startId);
  const hazards = [
    ...level.obstacles,
    ...level.roofs,
    ...level.walls,
    ...(level.tunnels ?? []),
    ...(level.movers ?? [])
  ];
  for (const checkpoint of level.checkpoints.slice(0, 20)) {
    const padClear = hazards.some((spec) => overlapsPad(spec, checkpoint));
    if (padClear) failures.push(`Start ${startId}: checkpoint ${checkpoint.id} pad intersects hazard`);
  }
  const firstCheckpoint = level.checkpoints[0];
  if (!firstCheckpoint) failures.push(`Start ${startId}: no checkpoints generated`);
  if (firstCheckpoint && firstCheckpoint.id <= (level.launchPad.id || 0)) {
    failures.push(`Start ${startId}: first checkpoint does not advance marker id`);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`Validated ${starts.length} starts and early checkpoint pads.`);

function overlapsPad(spec, pad) {
  const padHalfX = pad.size.x / 2 + 0.8;
  const padHalfZ = pad.size.z / 2 + 0.8;
  const halfX = spec.size.x / 2;
  const halfZ = spec.size.z / 2;
  const overlapsX = Math.abs(spec.position.x - pad.position.x) < halfX + padHalfX;
  const overlapsZ = Math.abs(spec.position.z - pad.position.z) < halfZ + padHalfZ;
  const bottom = spec.position.y - spec.size.y / 2;
  return overlapsX && overlapsZ && bottom < 4.2;
}

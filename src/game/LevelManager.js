const ROUTE_LENGTH = 5400;
const MARKER_SPACING = 180;
const MARKER_COUNT = Math.floor(ROUTE_LENGTH / MARKER_SPACING);

export class LevelManager {
  constructor() {
    this.level = this.#buildEndlessLevel(0);
    this.levels = [
      { id: 1, name: 'Launch', startDistance: 0, markerId: 0 },
      ...Array.from({ length: MARKER_COUNT }, (_, index) => {
        const markerId = index + 1;
        return {
          id: markerId + 1,
          name: `Marker ${markerId}`,
          startDistance: MARKER_SPACING * markerId,
          markerId
        };
      })
    ];
    this.index = 0;
  }

  get current() {
    return this.level;
  }

  getById(id) {
    return this.levels.find((level) => level.id === id) ?? this.levels[0];
  }

  load(id = 1) {
    this.index = Math.max(0, this.levels.findIndex((level) => level.id === id));
    const start = this.getById(id);
    this.level = this.#buildEndlessLevel(start.startDistance, start.markerId ?? 0);
    return this.level;
  }

  next() {
    return this.level;
  }

  #buildEndlessLevel(startDistance, startMarkerId = 0) {
    const launchZ = 18 - startDistance;
    const launchX = startMarkerId > 0 ? this.#markerX(startMarkerId) : 0;
    const checkpoints = [];
    const pickups = [];
    let obstacles = [];
    const walls = [];
    const roofs = [];
    const tunnels = [];
    const movers = [];
    const safeCorridors = [];
    const markerCount = MARKER_COUNT;

    for (let i = 1; i <= markerCount; i += 1) {
      const markerId = startMarkerId + i;
      const distance = markerId * MARKER_SPACING;
      const difficulty = this.#difficulty(distance);
      const z = launchZ - i * MARKER_SPACING;
      const x = this.#markerX(markerId);
      const previous = checkpoints[i - 2] ?? { position: { x: launchX, z: launchZ } };
      checkpoints.push({
        id: markerId,
        distance,
        position: { x, y: 0.12, z },
        size: { x: 6.6, y: 0.2, z: 6.6 }
      });
      safeCorridors.push({
        routeX: x,
        z,
        width: 9.4,
        bottom: 0,
        top: 7.2,
        depth: 13
      });

      safeCorridors.push(this.#addForcedGate({
        walls,
        roofs,
        routeX: previous.position.x + (x - previous.position.x) * 0.58,
        z: z + MARKER_SPACING * 0.48,
        difficulty,
        firstGate: i === 1,
        gateIndex: markerId
      }));

      this.#addFuelRun({
        pickups,
        markerId,
        routeX: previous.position.x + (x - previous.position.x) * 0.5,
        z,
        difficulty
      });

      if (markerId > 1) {
        this.#addSideWallCanyon({
          walls,
          routeX: previous.position.x + (x - previous.position.x) * 0.5,
          z: z + 12,
          difficulty,
          markerId
        });
      }

      const laneCount = 3 + Math.floor(difficulty * 5);
      for (let j = 0; j < laneCount; j += 1) {
        const phase = markerId * 13.37 + j * 5.19;
        const ox = Math.sin(phase) * (7 + difficulty * 7);
        const oz = z + 38 + j * (MARKER_SPACING / laneCount) - MARKER_SPACING;
        const h = 2.4 + difficulty * 6 + ((markerId + j) % 3);
        obstacles.push({
          type: 'spire',
          position: { x: ox, y: h / 2 - 0.05, z: oz },
          size: { x: 1.8 + difficulty * 1.1, y: h, z: 1.8 + difficulty * 1.1 }
        });
      }

      if (markerId > 1) {
        [-1, 1].forEach((side, index) => {
          const h = 8 + difficulty * 10 + ((markerId + index) % 5);
          obstacles.push({
            type: 'mountain',
            position: {
              x: x + side * (8.2 + Math.sin(markerId * 0.71 + index) * 2.2),
              y: h / 2 - 0.2,
              z: z - 54 - index * 38
            },
            size: { x: 6.2 + difficulty * 4.2, y: h, z: 6.2 + difficulty * 4.2 }
          });
        });
        this.#addBoulderField({
          obstacles,
          routeX: previous.position.x + (x - previous.position.x) * 0.42,
          z: z - 18,
          difficulty,
          markerId
        });
      }

      if (markerId > 1 && markerId % 2 === 0) {
        const gateZ = z + 72;
        const gapY = 4.2 + difficulty * 4.8 + (markerId % 2) * 2.2;
        const gapHeight = Math.max(3.4, 5.6 - difficulty * 1.6);
        walls.push({
          type: 'wall',
          position: { x: Math.sin(markerId * 0.91) * 4 - 10.5, y: gapY, z: gateZ },
          size: { x: 4.8 + difficulty * 2.5, y: 9 + difficulty * 5, z: 0.9 }
        });
        walls.push({
          type: 'wall',
          position: { x: Math.sin(markerId * 0.91) * 4 + 10.5, y: gapY, z: gateZ },
          size: { x: 4.8 + difficulty * 2.5, y: 9 + difficulty * 5, z: 0.9 }
        });
        roofs.push({
          type: 'roof',
          position: { x: Math.sin(markerId * 0.91) * 4, y: gapY + gapHeight * 0.5 + 4.2, z: gateZ },
          size: { x: 17 + difficulty * 6, y: 0.9, z: 1.2 }
        });
        roofs.push({
          type: 'roof',
          position: { x: Math.sin(markerId * 0.91) * 4, y: Math.max(1, gapY - gapHeight * 0.5 - 2.4), z: gateZ },
          size: { x: 14 + difficulty * 4, y: 0.55, z: 1.2 }
        });
      }

      if (markerId > 2 && markerId % 4 === 0) {
        roofs.push({
          type: 'roof',
          position: { x: Math.cos(markerId * 0.71) * 5, y: 7.4 - difficulty * 1.6, z: z + 24 },
          size: { x: 13 + difficulty * 9, y: 0.75, z: 11 }
        });
      }

      if (markerId > 2 && markerId % 3 === 1) {
        safeCorridors.push(this.#addCaveSection({
          obstacles,
          roofs,
          routeX: previous.position.x + (x - previous.position.x) * 0.35,
          z: z - 74,
          difficulty,
          caveIndex: markerId
        }));
      }

      if (markerId > 1 && markerId % 3 === 0) {
        const tunnelZ = z - 44;
        const tunnelX = Math.sin(markerId * 0.63) * 4.5;
        const tunnelY = 6.2 + difficulty * 6.8;
        const tunnelWidth = Math.max(7.2, 11.5 - difficulty * 2.4);
        const tunnelHeight = Math.max(5.2, 8.5 - difficulty * 1.6);
        const tunnelDepth = 32 + difficulty * 18;
        const wallThickness = 1.05;
        tunnels.push(
          {
            type: 'tunnel',
            segment: 'left',
            position: { x: tunnelX - tunnelWidth / 2 - wallThickness / 2, y: tunnelY, z: tunnelZ },
            size: { x: wallThickness, y: tunnelHeight + wallThickness * 2, z: tunnelDepth }
          },
          {
            type: 'tunnel',
            segment: 'right',
            position: { x: tunnelX + tunnelWidth / 2 + wallThickness / 2, y: tunnelY, z: tunnelZ },
            size: { x: wallThickness, y: tunnelHeight + wallThickness * 2, z: tunnelDepth }
          },
          {
            type: 'tunnel',
            segment: 'top',
            position: { x: tunnelX, y: tunnelY + tunnelHeight / 2 + wallThickness / 2, z: tunnelZ },
            size: { x: tunnelWidth + wallThickness * 2, y: wallThickness, z: tunnelDepth }
          },
          {
            type: 'tunnel',
            segment: 'bottom',
            position: { x: tunnelX, y: Math.max(0.7, tunnelY - tunnelHeight / 2 - wallThickness / 2), z: tunnelZ },
            size: { x: tunnelWidth + wallThickness * 2, y: wallThickness, z: tunnelDepth }
          }
        );
        pickups.push({
          id: markerId * 10 + 9,
          type: 'instant',
          amount: 25,
          position: { x: tunnelX, y: tunnelY, z: tunnelZ },
          radius: 1.35
        });
      }

      if (markerId > 2) {
        const movingCount = 2 + Math.floor(Math.min(3, difficulty));
        for (let m = 0; m < movingCount; m += 1) {
          const sweep = 8 + difficulty * 3.4;
          const movingZ = z - 26 - m * 52;
          const movingBoulder = m % 3 === 2;
          movers.push({
            type: movingBoulder ? 'movingBoulder' : m % 2 === 0 ? 'movingWall' : 'movingSpire',
            motion: movingBoulder ? 'slideZ' : m % 2 === 0 ? 'slideX' : 'bobY',
            phase: markerId * 0.9 + m * 1.7,
            speed: 0.88 + difficulty * 0.48,
            amplitude: movingBoulder ? 18 + difficulty * 4 : m % 2 === 0 ? sweep : 2.8 + difficulty * 1.1,
            position: {
              x: previous.position.x + (x - previous.position.x) * 0.48 + Math.sin(markerId * 0.67 + m) * 3.8,
              y: movingBoulder ? 3.6 + difficulty * 1.2 : m % 2 === 0 ? 4.4 + difficulty * 1.8 : 5.2 + difficulty * 2,
              z: movingZ
            },
            size: movingBoulder
              ? { x: 3.4 + difficulty, y: 3.4 + difficulty, z: 3.4 + difficulty }
              : m % 2 === 0
                ? { x: 2.4 + difficulty, y: 6.2 + difficulty * 2, z: 1.0 }
                : { x: 2.4 + difficulty * 0.7, y: 5.2 + difficulty * 1.9, z: 2.4 + difficulty * 0.7 }
          });
        }
      }
    }

    obstacles = obstacles.filter((spec) => !this.#blocksSafeCorridor(spec, safeCorridors) && !this.#blocksPad(spec, checkpoints));
    this.#removePadIntersections(walls, checkpoints);
    this.#removePadIntersections(roofs, checkpoints);
    this.#removePadIntersections(tunnels, checkpoints);
    this.#removePadIntersections(movers, checkpoints);

    return {
      id: 1,
      name: 'Endless Route',
      description: 'One route that keeps escalating with each save marker.',
      gravity: -3.9,
      thrustPower: 7.35,
      steeringPower: 3.65,
      damping: 0.992,
      fuelBurnRate: 8.2,
      windStrength: 0,
      windDirection: { x: 0, y: 0, z: 0 },
      maxSpeed: { horizontal: 7.6, verticalUp: 7.6, verticalDown: 8.8 },
      launchPad: { id: startMarkerId || 'launch', position: { x: launchX, y: 0.1, z: launchZ }, size: { x: 6, y: 0.2, z: 6 } },
      landingPad: checkpoints[0],
      checkpoints,
      pickups,
      landingThresholds: { verticalSpeed: 2.15, horizontalSpeed: 1.95, angle: 0.44 },
      worldBounds: { minX: -26, maxX: 26, minZ: launchZ - ROUTE_LENGTH - 220, maxZ: launchZ + 28, maxY: 32 },
      terrain: { width: 62, depth: ROUTE_LENGTH + 380, segments: 128, amplitude: 0.72, frequency: 0.085, seed: 11 + Math.floor(startDistance / MARKER_SPACING), centerZ: launchZ - ROUTE_LENGTH / 2, startDistance },
      obstacles,
      roofs,
      walls,
      tunnels,
      movers,
      tutorialMessages: ['Reach save markers', 'Collect Drop fuel', 'Harder route ahead'],
      scoreMultiplier: 1,
      visualTheme: { terrain: 0x202833 },
      startDistance
    };
  }

  #addFuelRun({ pickups, markerId, routeX, z, difficulty }) {
    const laneCount = markerId < 3 ? 4 : markerId < 9 ? 3 : 2;
    const offsets = markerId < 3
      ? [-0.62, -0.28, 0.12, 0.46]
      : markerId < 9
        ? [-0.56, -0.08, 0.42]
        : [-0.42, 0.34];
    offsets.slice(0, laneCount).forEach((offset, dropIndex) => {
      const highLane = 3.6 + difficulty * 1.9;
      const climb = (dropIndex % 2) * (2.4 + difficulty * 1.2);
      const wave = Math.sin(markerId * 0.73 + dropIndex * 1.31) * (1.2 + difficulty * 0.7);
      const refill = markerId % 6 === 0 && dropIndex === offsets.length - 1;
      pickups.push({
        id: markerId * 10 + dropIndex,
        type: refill ? 'refill' : 'instant',
        amount: refill ? 80 : 22,
        refillRate: 20,
        position: {
          x: routeX + Math.sin(markerId * 1.11 + dropIndex * 1.7) * (4.2 + difficulty * 2.9),
          y: Math.max(3.2, highLane + climb + wave),
          z: z + MARKER_SPACING * offset
        },
        radius: refill ? 1.25 : 1.1
      });
    });
  }

  #addSideWallCanyon({ walls, routeX, z, difficulty, markerId }) {
    const width = Math.max(10.4, 16.5 - difficulty * 2.1);
    const height = 9 + difficulty * 6;
    const depth = 46 + difficulty * 12;
    const lean = Math.sin(markerId * 0.83) * 1.2;
    [-1, 1].forEach((side) => {
      walls.push({
        type: 'sideWall',
        position: {
          x: routeX + side * (width / 2 + 1.25) + lean,
          y: height / 2 - 0.1,
          z
        },
        size: { x: 2.2 + difficulty * 0.8, y: height, z: depth }
      });
    });
  }

  #addBoulderField({ obstacles, routeX, z, difficulty, markerId }) {
    const count = 3 + Math.floor(Math.min(4, difficulty * 1.4));
    for (let i = 0; i < count; i += 1) {
      const side = i % 2 === 0 ? -1 : 1;
      const radius = 1.8 + difficulty * 0.72 + (i % 3) * 0.38;
      obstacles.push({
        type: 'boulder',
        position: {
          x: routeX + side * (3.2 + i * 1.15) + Math.sin(markerId * 1.2 + i) * 1.6,
          y: radius * 0.58,
          z: z - 58 + i * (15 + difficulty * 2)
        },
        size: { x: radius * 2, y: radius * 1.55, z: radius * 2 }
      });
    }
  }

  #difficulty(distance) {
    return Math.min(2.6, 0.35 + distance / 900);
  }

  #markerX(markerId) {
    const distance = markerId * MARKER_SPACING;
    return Math.sin(markerId * 1.73) * Math.min(11, 3 + this.#difficulty(distance) * 9);
  }

  #addForcedGate({ walls, roofs, routeX, z, difficulty, firstGate, gateIndex }) {
    const minX = -26;
    const maxX = 26;
    const maxY = 31.5;
    const gateDepth = 1.25 + difficulty * 0.18;
    const openingWidth = Math.max(firstGate ? 8.6 : 5.6, 12.2 - difficulty * 2.65);
    const openingHeight = Math.max(firstGate ? 6.2 : 4.3, 7.1 - difficulty * 0.9);
    const altitudePattern = gateIndex % 6;
    const baseBottom = firstGate ? 0.9 : altitudePattern === 1 ? 0.9 : altitudePattern === 2 ? 2.4 : altitudePattern === 3 ? 4.2 : altitudePattern === 4 ? 6.1 : altitudePattern === 5 ? 3.1 : 1.5;
    const waveLift = firstGate ? 0 : Math.max(0, Math.sin(gateIndex * 1.37)) * (0.7 + difficulty * 0.45);
    const openingBottom = Math.min(maxY - openingHeight - 2.5, baseBottom + waveLift);
    const openingTop = openingBottom + openingHeight;
    const leftEdge = routeX - openingWidth / 2;
    const rightEdge = routeX + openingWidth / 2;
    const leftWidth = Math.max(0.1, leftEdge - minX);
    const rightWidth = Math.max(0.1, maxX - rightEdge);

    walls.push(
      {
        type: 'wall',
        position: { x: minX + leftWidth / 2, y: maxY / 2, z },
        size: { x: leftWidth, y: maxY, z: gateDepth }
      },
      {
        type: 'wall',
        position: { x: rightEdge + rightWidth / 2, y: maxY / 2, z },
        size: { x: rightWidth, y: maxY, z: gateDepth }
      }
    );
    roofs.push({
      type: 'roof',
      position: { x: routeX, y: openingTop + (maxY - openingTop) / 2, z },
      size: { x: openingWidth + 1.4, y: maxY - openingTop, z: gateDepth }
    });
    if (openingBottom > 0.75) {
      roofs.push({
        type: 'roof',
        position: { x: routeX, y: openingBottom / 2, z },
        size: { x: openingWidth + 1.4, y: openingBottom, z: gateDepth }
      });
    }
    return { routeX, z, width: openingWidth, bottom: openingBottom, top: openingTop, depth: 68 };
  }

  #addCaveSection({ obstacles, roofs, routeX, z, difficulty, caveIndex }) {
    const roofY = Math.min(21, 11.8 + difficulty * 2.5);
    const caveWidth = Math.min(34, 20 + difficulty * 4.4);
    const caveDepth = 68 + difficulty * 16;
    roofs.push({
      type: 'caveRoof',
      position: { x: routeX, y: roofY, z },
      size: { x: caveWidth, y: 1.1, z: caveDepth }
    });

    const spikeCount = 6 + Math.floor(Math.min(5, difficulty * 1.7));
    for (let s = 0; s < spikeCount; s += 1) {
      const side = s % 2 === 0 ? -1 : 1;
      const lane = 2.8 + (s % 3) * 1.8 + difficulty * 0.55;
      const height = Math.min(12.8, 5.6 + difficulty * 2.4 + ((caveIndex + s) % 3) * 1.5);
      obstacles.push({
        type: 'caveSpike',
        position: {
          x: routeX + side * lane + Math.sin(caveIndex * 0.8 + s) * 1.2,
          y: roofY - height / 2,
          z: z - caveDepth * 0.35 + (s + 0.5) * (caveDepth / spikeCount)
        },
        size: { x: 2.4 + difficulty * 0.7, y: height, z: 2.4 + difficulty * 0.7 }
      });
    }
    return { routeX, z, width: Math.max(6.2, 9.6 - difficulty), bottom: 2.8, top: roofY - 2.8, depth: caveDepth + 18 };
  }

  #blocksSafeCorridor(spec, safeCorridors) {
    return safeCorridors.some((corridor) => {
      const halfX = spec.size.x / 2;
      const halfZ = spec.size.z / 2;
      const reserveX = corridor.width / 2 + 2.8;
      const reserveZ = corridor.depth / 2;
      const overlapsX = Math.abs(spec.position.x - corridor.routeX) < halfX + reserveX;
      const overlapsZ = Math.abs(spec.position.z - corridor.z) < halfZ + reserveZ;
      const specBottom = spec.position.y - spec.size.y / 2;
      const specTop = spec.position.y + spec.size.y / 2;
      const blocksOpeningHeight = specTop > corridor.bottom - 1.2 && specBottom < corridor.top + 1.2;
      return overlapsX && overlapsZ && blocksOpeningHeight;
    });
  }

  #removePadIntersections(specs, checkpoints) {
    for (let i = specs.length - 1; i >= 0; i -= 1) {
      if (this.#blocksPad(specs[i], checkpoints)) specs.splice(i, 1);
    }
  }

  #blocksPad(spec, checkpoints) {
    return checkpoints.some((pad) => {
      const padHalfX = pad.size.x / 2 + 1.15;
      const padHalfZ = pad.size.z / 2 + 1.15;
      const halfX = spec.size.x / 2;
      const halfZ = spec.size.z / 2;
      const overlapsX = Math.abs(spec.position.x - pad.position.x) < halfX + padHalfX;
      const overlapsZ = Math.abs(spec.position.z - pad.position.z) < halfZ + padHalfZ;
      const bottom = spec.position.y - spec.size.y / 2;
      return overlapsX && overlapsZ && bottom < 4.8;
    });
  }
}

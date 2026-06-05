export const sceneLayout = {
  view: {
    width: 1280,
    height: 720
  },
  world: {
    width: 2400,
    height: 900
  },
  gameplay: {
    floorY: 640
  },
  level: {
    terrainScale: 1.3,
    terrainPanStrength: 0.25
  },
  camera: {
    lookAheadX: 180,
    centerY: 430,
    minCenterX: 640,
    maxCenterX: 1760,
    followLerpX: 0.08,
    followLerpY: 0.08,
    followOffsetX: 120,
    followOffsetY: 0
  },
  layers: {
    back: {
      x: 0,
      y: 0,
      scrollFactorX: 0,
      scrollFactorY: 0,
      depth: -10
    },
    terrain: {
      yOffsetFromFloor: -38,
      alpha: 1,
      tint: 0xffffff,
      scrollFactorX: 0,
      scrollFactorY: 0,
      depth: -1
    },
    terrainDebug: {
      x: 18,
      y: 180,
      depth: 100
    }
  },
  rocketSpawn: {
    x: 250,
    y: 270,
    velocityX: 0,
    velocityY: -10
  },
  landingPad: {
    x: 1840,
    yOffsetFromFloor: 0,
    width: 230,
    height: 18
  },
  resultBanner: {
    yOffsetFromRocket: -105,
    floatUpDistance: 26,
    depth: 40
  }
} as const;

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
    floorY: 790
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
      x: 640,
      y: 360,
      width: 1280,
      height: 720,
      scrollFactorX: 0,
      scrollFactorY: 0,
      depth: -10
    },
    middle: {
      x: 1200,
      yOffsetFromFloor: 34,
      width: 2880,
      height: 168,
      alpha: 0.72,
      tint: 0x917164,
      scrollFactorX: 1,
      scrollFactorY: 1,
      depth: -3
    },
    front: {
      x: 1200,
      yOffsetFromFloor: 62,
      width: 2400,
      height: 178,
      scrollFactorX: 1,
      scrollFactorY: 1,
      depth: -2
    },
    groundFill: {
      x: 1200,
      yOffsetFromFloor: 94,
      width: 2400,
      height: 124,
      color: 0x4b2e24,
      alpha: 0.78,
      depth: -1
    }
  },
  rocketSpawn: {
    x: 250,
    y: 270,
    velocityX: 95,
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

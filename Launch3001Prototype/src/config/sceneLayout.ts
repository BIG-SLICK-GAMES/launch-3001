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
    terrainScale: 1
  },
  camera: {
    verticalScrollY: 0
  },
  layers: {
    back: {
      x: 0,
      y: 0,
      scrollFactorX: 0,
      scrollFactorY: 0,
      depth: -10
    },
    mid: {
      yOffsetFromFloor: -820,
      alpha: 1,
      tint: 0xffffff,
      scrollFactorX: 0.5,
      scrollFactorY: 1,
      depth: -5
    },
    groundFront: {
      yOffsetFromFloor: 280,
      widthScale: 1,
      alpha: 1,
      tint: 0xffffff,
      scrollFactorX: 1,
      scrollFactorY: 1,
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

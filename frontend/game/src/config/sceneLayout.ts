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
    verticalScrollY: 0,
    zoom: 1.1
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
      x: 0,
      y: 180,
      alpha: 1,
      tint: 0xffffff,
      scrollFactorX: 0.25,
      scrollFactorY: 1,
      depth: -5,
      visible: false
    },
    groundFront: {
      x: 0,
      y: 500,
      widthScale: 1,
      alpha: 1,
      tint: 0xffffff,
      scrollFactorX: 1,
      scrollFactorY: 1,
      depth: -1,
      visible: false
    },
    terrainDebug: {
      x: 18,
      y: 180,
      depth: 100,
      visible: false
    }
  },
  rocketSpawn: {
    x: 250,
    y: 579,
    velocityX: 0,
    velocityY: 0
  },
  launchPad: {
    x: 250,
    yOffsetFromFloor: 12,
    width: 190,
    height: 24
  },
  landingPad: {
    x: 1840,
    yOffsetFromFloor: 9,
    width: 230,
    height: 18
  },
  resultBanner: {
    yOffsetFromRocket: -105,
    floatUpDistance: 26,
    depth: 40
  }
} as const;

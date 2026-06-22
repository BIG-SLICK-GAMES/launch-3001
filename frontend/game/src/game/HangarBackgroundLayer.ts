import Phaser from 'phaser';
import { sceneLayout } from '../config/sceneLayout';
import parallax0Url from '../assets/levels/parallax-space/bkgd_0.png';
import parallax1Url from '../assets/levels/parallax-space/bkgd_1.png';
import parallax2Url from '../assets/levels/parallax-space/bkgd_2.png';
import parallax3Url from '../assets/levels/parallax-space/bkgd_3.png';
import parallax4Url from '../assets/levels/parallax-space/bkgd_4.png';
import parallax5Url from '../assets/levels/parallax-space/bkgd_5.png';
import parallax6Url from '../assets/levels/parallax-space/bkgd_6.png';
import parallax7Url from '../assets/levels/parallax-space/bkgd_7.png';

type LayerSpec = {
  key: string;
  url: string;
};

type SceneLayerSpec = {
  key: string;
  depth: number;
  scrollFactorX: number;
  scrollFactorY: number;
  y: number;
  width: number;
  height: number;
  preserveAspectRatio?: boolean;
  alpha?: number;
  tint?: number;
};

export type BackgroundTheme = {
  backTint: number;
  midTint: number;
  frontTint: number;
  midAlpha: number;
  frontAlpha: number;
};

const VIEW_WIDTH = sceneLayout.view.width;
const VIEW_HEIGHT = sceneLayout.view.height;
const FLOOR_HEIGHT = 72;
export const BACKGROUND_WORLD_WIDTH = 3600;
export const BACKGROUND_WORLD_HEIGHT = VIEW_HEIGHT;
export const BACKGROUND_FLOOR_Y = VIEW_HEIGHT - FLOOR_HEIGHT;

const assetSpecs: LayerSpec[] = [
  { key: 'parallax-space-0', url: parallax0Url },
  { key: 'parallax-space-1', url: parallax1Url },
  { key: 'parallax-space-2', url: parallax2Url },
  { key: 'parallax-space-3', url: parallax3Url },
  { key: 'parallax-space-4', url: parallax4Url },
  { key: 'parallax-space-5', url: parallax5Url },
  { key: 'parallax-space-6', url: parallax6Url },
  { key: 'parallax-space-7', url: parallax7Url }
];

const parallaxSceneSpecs: SceneLayerSpec[][] = [
  [
    createSceneLayer('parallax-space-0', -34, 0, 0, 1, 0xffffff),
    createSceneLayer('parallax-space-1', -26, 0.06, -20, 0.64, 0xbfd9ff),
    createSceneLayer('parallax-space-2', -18, 0.14, -55, 0.86, 0xffffff),
    createSceneLayer('parallax-space-6', -8, 0.34, 35, 0.9, 0xd9f3ff)
  ],
  [
    createSceneLayer('parallax-space-0', -34, 0, 0, 1, 0xffeee6),
    createSceneLayer('parallax-space-5', -24, 0.09, -80, 0.82, 0xff8f55),
    createSceneLayer('parallax-space-3', -14, 0.24, 8, 0.8, 0xffc17a),
    createSceneLayer('parallax-space-7', -6, 0.42, 50, 0.78, 0xfff1c8)
  ],
  [
    createSceneLayer('parallax-space-0', -34, 0, 0, 1, 0xe9d8ff),
    createSceneLayer('parallax-space-2', -25, 0.08, -100, 0.76, 0xa875ff),
    createSceneLayer('parallax-space-5', -16, 0.18, -50, 0.68, 0xffd4fa),
    createSceneLayer('parallax-space-4', -7, 0.38, 24, 0.86, 0xf7e6ff)
  ],
  [
    createSceneLayer('parallax-space-0', -34, 0, 0, 1, 0xd8fff5),
    createSceneLayer('parallax-space-1', -27, 0.05, -36, 0.6, 0x7dfff1),
    createSceneLayer('parallax-space-3', -16, 0.2, 0, 0.92, 0xffeb9d),
    createSceneLayer('parallax-space-6', -8, 0.45, 54, 0.92, 0xffffff)
  ],
  [
    createSceneLayer('parallax-space-0', -34, 0, 0, 1, 0xffe0f4),
    createSceneLayer('parallax-space-5', -24, 0.1, -105, 0.78, 0xff5fa8),
    createSceneLayer('parallax-space-2', -15, 0.22, -30, 0.72, 0xfff7b8),
    createSceneLayer('parallax-space-7', -5, 0.48, 42, 0.86, 0xffffff)
  ]
];

export class HangarBackgroundLayer {
  readonly root: Phaser.GameObjects.Container;

  private readonly layers: Phaser.GameObjects.Image[];
  private readonly scene: Phaser.Scene;

  static preload(scene: Phaser.Scene): void {
    assetSpecs.forEach((layer) => {
      if (!scene.textures.exists(layer.key)) {
        scene.load.image(layer.key, layer.url);
      }
    });
  }

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.root = scene.add.container(0, 0);
    this.layers = [];
    this.applyScene(0);
  }

  applyScene(sceneIndex: number, theme?: BackgroundTheme): void {
    this.layers.forEach((layer) => layer.destroy());
    this.layers.length = 0;
    const specs = parallaxSceneSpecs[sceneIndex % parallaxSceneSpecs.length];
    specs.forEach((spec, index) => {
      const themedSpec = this.applyThemeToSpec(spec, index, theme);
      this.layers.push(this.createLayer(this.scene, themedSpec));
    });
  }

  destroy(): void {
    this.layers.forEach((layer) => layer.destroy());
    this.root.destroy(true);
  }

  private applyThemeToSpec(spec: SceneLayerSpec, index: number, theme?: BackgroundTheme): SceneLayerSpec {
    if (!theme) {
      return spec;
    }

    if (index === 0) {
      return { ...spec, tint: theme.backTint };
    }

    if (index === 1) {
      return { ...spec, tint: theme.midTint, alpha: Math.min(spec.alpha ?? 1, theme.midAlpha) };
    }

    return { ...spec, tint: spec.tint ?? theme.frontTint, alpha: Math.min(spec.alpha ?? 1, theme.frontAlpha) };
  }

  private createLayer(scene: Phaser.Scene, spec: SceneLayerSpec): Phaser.GameObjects.Image {
    const image = scene.add.image(0, spec.y, spec.key);
    image.setOrigin(0, 0);
    if (spec.preserveAspectRatio) {
      const source = scene.textures.get(spec.key).getSourceImage() as HTMLImageElement;
      const scale = Math.max(spec.width / source.width, spec.height / source.height);
      image.setScale(scale);
    } else {
      image.setDisplaySize(spec.width, spec.height);
    }
    image.setDepth(spec.depth);
    image.setScrollFactor(spec.scrollFactorX, spec.scrollFactorY);
    image.setAlpha(spec.alpha ?? 1);
    image.setTint(spec.tint ?? 0xffffff);
    this.root.add(image);

    return image;
  }
}

function createSceneLayer(
  key: string,
  depth: number,
  scrollFactorX: number,
  y: number,
  alpha: number,
  tint: number
): SceneLayerSpec {
  return {
    key,
    depth,
    scrollFactorX,
    scrollFactorY: 0,
    y,
    width: BACKGROUND_WORLD_WIDTH,
    height: VIEW_HEIGHT,
    preserveAspectRatio: true,
    alpha,
    tint
  };
}

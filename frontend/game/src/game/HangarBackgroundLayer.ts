import Phaser from 'phaser';
import { sceneLayout } from '../config/sceneLayout';
import backStarsUrl from '../assets/levels/training-orbit/back-stars.png';
import midNebulaUrl from '../assets/levels/training-orbit/mid-nebula.png';
import frontStarsUrl from '../assets/levels/training-orbit/front-stars.png';

type LayerSpec = {
  key: string;
  url: string;
  depth: number;
  scrollFactorX: number;
  scrollFactorY: number;
  y: number;
  width: number;
  height: number;
  preserveAspectRatio?: boolean;
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
export const BACKGROUND_WORLD_WIDTH = 2400;
export const BACKGROUND_WORLD_HEIGHT = VIEW_HEIGHT;
export const BACKGROUND_FLOOR_Y = VIEW_HEIGHT - FLOOR_HEIGHT;

const layerSpecs: LayerSpec[] = [
  {
    key: 'training-orbit-back-stars',
    url: backStarsUrl,
    depth: -30,
    scrollFactorX: 0,
    scrollFactorY: 0,
    y: 0,
    width: BACKGROUND_WORLD_WIDTH,
    height: VIEW_HEIGHT,
    preserveAspectRatio: true
  },
  {
    key: 'training-orbit-mid-nebula',
    url: midNebulaUrl,
    depth: -12,
    scrollFactorX: 0.16,
    scrollFactorY: 0,
    y: -115,
    width: BACKGROUND_WORLD_WIDTH,
    height: VIEW_HEIGHT,
    preserveAspectRatio: true
  },
  {
    key: 'training-orbit-front-stars',
    url: frontStarsUrl,
    depth: -4,
    scrollFactorX: 0.42,
    scrollFactorY: 0,
    y: -60,
    width: BACKGROUND_WORLD_WIDTH,
    height: VIEW_HEIGHT,
    preserveAspectRatio: true
  }
];

export class HangarBackgroundLayer {
  readonly root: Phaser.GameObjects.Container;

  private readonly layers: Phaser.GameObjects.Image[];

  static preload(scene: Phaser.Scene): void {
    layerSpecs.forEach((layer) => {
      if (!scene.textures.exists(layer.key)) {
        scene.load.image(layer.key, layer.url);
      }
    });
  }

  constructor(scene: Phaser.Scene) {
    this.root = scene.add.container(0, 0);
    this.layers = layerSpecs.map((layer) => this.createLayer(scene, layer));
  }

  applyTheme(theme: BackgroundTheme): void {
    const [back, mid, front] = this.layers;
    back.setTint(theme.backTint);
    mid.setTint(theme.midTint);
    front.setTint(theme.frontTint);
    mid.setAlpha(theme.midAlpha);
    front.setAlpha(theme.frontAlpha);
  }

  destroy(): void {
    this.layers.forEach((layer) => layer.destroy());
    this.root.destroy(true);
  }

  private createLayer(scene: Phaser.Scene, spec: LayerSpec): Phaser.GameObjects.Image {
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
    this.root.add(image);

    return image;
  }
}

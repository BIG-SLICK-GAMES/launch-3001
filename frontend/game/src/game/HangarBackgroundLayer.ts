import Phaser from 'phaser';
import { sceneLayout } from '../config/sceneLayout';
import spaceUrl from '../../../../art-source/backgrounds/launch3001SpaceBG.png';
import hangarUrl from '../../../../art-source/backgrounds/launch3001hangerBG.png';
import floorUrl from '../../../../art-source/backgrounds/launch3001floorBG.png';

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

const VIEW_WIDTH = sceneLayout.view.width;
const VIEW_HEIGHT = sceneLayout.view.height;
const FLOOR_HEIGHT = 72;
export const BACKGROUND_WORLD_WIDTH = 2400;
export const BACKGROUND_WORLD_HEIGHT = VIEW_HEIGHT;
export const BACKGROUND_FLOOR_Y = VIEW_HEIGHT - FLOOR_HEIGHT;

const layerSpecs: LayerSpec[] = [
  {
    key: 'background-space',
    url: spaceUrl,
    depth: -30,
    scrollFactorX: 0,
    scrollFactorY: 0,
    y: 0,
    width: BACKGROUND_WORLD_WIDTH,
    height: VIEW_HEIGHT,
    preserveAspectRatio: true
  },
  {
    key: 'background-hangar',
    url: hangarUrl,
    depth: -12,
    scrollFactorX: 0.35,
    scrollFactorY: 1,
    y: 0,
    width: BACKGROUND_WORLD_WIDTH,
    height: VIEW_HEIGHT - FLOOR_HEIGHT
  },
  {
    key: 'background-floor',
    url: floorUrl,
    depth: 1,
    scrollFactorX: 1,
    scrollFactorY: 1,
    y: BACKGROUND_FLOOR_Y,
    width: BACKGROUND_WORLD_WIDTH,
    height: FLOOR_HEIGHT
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

  destroy(): void {
    this.layers.forEach((layer) => layer.destroy());
    this.root.destroy(true);
  }

  private createLayer(scene: Phaser.Scene, spec: LayerSpec): Phaser.GameObjects.Image {
    const image = scene.add.image(0, spec.y, spec.key);
    image.setOrigin(0, 0);
    if (spec.preserveAspectRatio) {
      const source = scene.textures.get(spec.key).getSourceImage() as HTMLImageElement;
      const scale = spec.width / source.width;
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

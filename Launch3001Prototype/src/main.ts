import Phaser from 'phaser';
import { sceneLayout } from './config/sceneLayout';
import { LaunchScene } from './game/LaunchScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: sceneLayout.view.width,
  height: sceneLayout.view.height,
  backgroundColor: '#080b14',
  scene: [LaunchScene],
  physics: {
    default: 'arcade'
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

new Phaser.Game(config);

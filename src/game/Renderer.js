import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';

export class Renderer {
  constructor(container) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x05070b, 1);
    this.renderer.shadowMap.enabled = false;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.xr.enabled = true;
    this.renderer.xr.setReferenceSpaceType('local');
    this.renderer.domElement.className = 'game-canvas';
    this.renderer.domElement.setAttribute('aria-label', 'Launch3001 gameplay');
    container.appendChild(this.renderer.domElement);
    this.vrButton = VRButton.createButton(this.renderer);
    this.vrButton.classList.add('vr-entry-button');
    container.appendChild(this.vrButton);
    this.width = 1;
    this.height = 1;
  }

  resize(camera) {
    const rect = this.container.getBoundingClientRect();
    this.width = Math.max(1, Math.floor(rect.width));
    this.height = Math.max(1, Math.floor(rect.height));
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    this.renderer.setSize(this.width, this.height, false);
    camera.aspect = this.width / this.height;
    camera.updateProjectionMatrix();
  }

  render(scene, camera) {
    this.renderer.render(scene, camera);
  }

  setAnimationLoop(callback) {
    this.renderer.setAnimationLoop(callback);
  }

  isPresentingXR() {
    return this.renderer.xr.isPresenting;
  }
}

import * as THREE from 'three';

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a, b, t) {
  return a + (b - a) * clamp(t, 0, 1);
}

export function smoothDamp(current, target, factor, dt) {
  return lerp(current, target, 1 - Math.exp(-factor * dt));
}

export function disposeObject3D(object) {
  object.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.filter(Boolean).forEach((material) => material.dispose());
  });
}

export function makeBoxFromSpec(spec) {
  const center = new THREE.Vector3(spec.position.x, spec.position.y, spec.position.z);
  const half = new THREE.Vector3(spec.size.x / 2, spec.size.y / 2, spec.size.z / 2);
  return new THREE.Box3(center.clone().sub(half), center.clone().add(half));
}

export function formatNumber(value, digits = 1) {
  return Number.isFinite(value) ? value.toFixed(digits) : '0.0';
}

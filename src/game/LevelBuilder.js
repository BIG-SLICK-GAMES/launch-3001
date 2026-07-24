import * as THREE from 'three';
import { makeBoxFromSpec } from './utils.js';

export class LevelBuilder {
  build(level) {
    const group = new THREE.Group();
    group.name = `Level ${level.id}: ${level.name}`;
    const terrain = this.#terrain(level);
    group.add(terrain.mesh);
    const launchPad = this.#pad(level.launchPad, 0x24b7ff, 'Launch');
    const landingPad = this.#pad(level.landingPad, 0x33ff8a, 'Save Marker');
    const checkpointGroup = new THREE.Group();
    for (const checkpoint of level.checkpoints ?? [level.landingPad]) {
      checkpointGroup.add(this.#checkpoint(checkpoint));
    }
    group.add(launchPad, checkpointGroup);
    const obstacleMeshes = [];
    const hazardSpecs = [...level.obstacles, ...level.roofs, ...level.walls, ...(level.tunnels ?? []), ...(level.movers ?? [])];
    hazardSpecs.forEach((spec) => {
      const mesh = this.#box(spec);
      obstacleMeshes.push(mesh);
      group.add(mesh);
    });
    const pickupGroup = new THREE.Group();
    for (const pickup of level.pickups ?? []) {
      pickupGroup.add(this.#pickup(pickup));
    }
    group.add(pickupGroup, this.#bounds(level.worldBounds), this.#routeMarkers(level), this.#skyline(level), this.#stars(level));
    return {
      group,
      terrain,
      launchPad,
      landingPad,
      obstacleMeshes,
      pickupMeshes: pickupGroup.children,
      checkpointMeshes: checkpointGroup.children,
      boxes: hazardSpecs.map((spec, index) => ({ spec, mesh: obstacleMeshes[index], box: makeBoxFromSpec(spec), origin: { ...spec.position } }))
    };
  }

  #terrain(level) {
    const { width, depth, segments, amplitude, frequency, seed, centerZ = 0, startDistance = 0 } = level.terrain;
    const geometry = new THREE.PlaneGeometry(width, depth, segments, segments);
    geometry.rotateX(-Math.PI / 2);
    const positions = geometry.attributes.position;
    const heights = [];
    for (let z = 0; z <= segments; z += 1) {
      heights[z] = [];
      for (let x = 0; x <= segments; x += 1) {
        const i = z * (segments + 1) + x;
        const px = positions.getX(i);
        const pz = positions.getZ(i);
        const worldZ = pz + centerZ;
        const safeLaunch = this.#nearPad(px, worldZ, level.launchPad, 5);
        const safeLanding = (level.checkpoints ?? [level.landingPad]).some((pad) => this.#nearPad(px, worldZ, pad, 6));
        const routeDistance = Math.max(0, startDistance + level.launchPad.position.z - worldZ);
        const terrainDifficulty = Math.min(2.4, 0.18 + routeDistance / 1500);
        const wave = Math.sin((px + seed) * frequency) * Math.cos((pz - seed) * frequency * 0.72);
        const ridge = Math.sin((px * 0.31 + pz * 0.19 + seed) * frequency * 1.7);
        const brokenGround = Math.sin((px * 0.47 - pz * 0.23 + seed) * frequency * 3.1) * 0.22;
        const sideRise = Math.max(0, Math.abs(px) / (width / 2) - 0.42);
        const canyonWall = sideRise ** 2.2 * (4.2 + terrainDifficulty * 4.6);
        const centerDip = Math.max(0, 1 - Math.abs(px) / 16) * terrainDifficulty * -0.18;
        let h = ((wave * 0.65 + ridge * 0.35 + brokenGround) * amplitude * (0.85 + terrainDifficulty * 0.82)) + canyonWall + centerDip;
        if (safeLaunch || safeLanding) h = -0.06;
        positions.setY(i, h);
        heights[z][x] = h;
      }
    }
    geometry.computeVertexNormals();
    const material = new THREE.MeshStandardMaterial({
      color: level.visualTheme.terrain,
      roughness: 0.88,
      metalness: 0.12,
      emissive: 0x0a2030,
      emissiveIntensity: 0.32,
      flatShading: false
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = centerZ;
    mesh.receiveShadow = false;
    const wire = new THREE.LineSegments(
      new THREE.WireframeGeometry(geometry),
      new THREE.LineBasicMaterial({ color: 0x1f6f92, transparent: true, opacity: 0.28 })
    );
    mesh.add(wire);
    return { mesh, width, depth, segments, heights, centerZ };
  }

  #nearPad(x, z, pad, margin) {
    return Math.abs(x - pad.position.x) < pad.size.x / 2 + margin && Math.abs(z - pad.position.z) < pad.size.z / 2 + margin;
  }

  #pad(pad, color, label) {
    const group = new THREE.Group();
    group.name = label;
    group.position.set(pad.position.x, pad.position.y, pad.position.z);
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(pad.size.x, 0.18, pad.size.z),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.55, roughness: 0.28, metalness: 0.22 })
    );
    group.add(base);
    const glow = new THREE.Mesh(
      new THREE.BoxGeometry(pad.size.x + 0.35, 0.03, pad.size.z + 0.35),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending })
    );
    glow.position.y = 0.13;
    group.add(glow);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(Math.min(pad.size.x, pad.size.z) * 0.24, Math.min(pad.size.x, pad.size.z) * 0.34, 36),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.95 })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.12;
    group.add(ring);
    return group;
  }

  #box(spec) {
    const color = spec.type === 'tunnel' ? 0x24dfff : spec.type === 'roof' ? 0xff334f : spec.type === 'caveRoof' ? 0x536985 : spec.type === 'wall' || spec.type === 'sideWall' || spec.type === 'movingWall' ? 0xff2433 : spec.type === 'mountain' || spec.type === 'caveSpike' || spec.type === 'boulder' || spec.type === 'movingBoulder' ? 0x8a98a7 : 0xff8a24;
    const group = new THREE.Group();
    group.position.set(spec.position.x, spec.position.y, spec.position.z);
    group.name = spec.type;
    const material = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.58, transparent: true, opacity: 0.97, roughness: 0.34, metalness: 0.18 });
    const geometry = spec.type === 'boulder' || spec.type === 'movingBoulder'
      ? new THREE.DodecahedronGeometry(Math.max(spec.size.x, spec.size.y, spec.size.z) * 0.48, 1)
      : spec.type === 'spire' || spec.type === 'movingSpire' || spec.type === 'mountain' || spec.type === 'caveSpike'
        ? new THREE.ConeGeometry(Math.max(spec.size.x, spec.size.z) * 0.55, spec.size.y, 7)
        : new THREE.BoxGeometry(spec.size.x, spec.size.y, spec.size.z);
    const mesh = new THREE.Mesh(
      geometry,
      material
    );
    mesh.name = `${spec.type} core`;
    if (spec.type === 'caveSpike') mesh.rotation.z = Math.PI;
    if (spec.type === 'boulder' || spec.type === 'movingBoulder') {
      mesh.scale.y = spec.size.y / Math.max(spec.size.x, spec.size.z);
      mesh.rotation.set(spec.position.z * 0.07, spec.position.x * 0.09, spec.position.y * 0.11);
    }
    group.add(mesh);
    const edge = new THREE.LineSegments(
      new THREE.EdgesGeometry(mesh.geometry),
      new THREE.LineBasicMaterial({ color: spec.type === 'mountain' || spec.type === 'caveSpike' || spec.type === 'boulder' || spec.type === 'movingBoulder' ? 0x9ff7ff : 0xffc08a, transparent: true, opacity: 0.62 })
    );
    mesh.add(edge);
    if (spec.type !== 'roof' && spec.type !== 'caveRoof' && spec.type !== 'tunnel' && spec.type !== 'mountain' && spec.type !== 'caveSpike' && spec.type !== 'boulder' && spec.type !== 'movingBoulder' && spec.type !== 'sideWall') {
      const cap = new THREE.Mesh(
        new THREE.TorusGeometry(Math.max(spec.size.x, spec.size.z) * 0.35, 0.055, 8, 22),
        new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.75 })
      );
      cap.position.y = spec.size.y * 0.5;
      cap.rotation.x = Math.PI / 2;
      group.add(cap);
    }
    if (spec.type === 'wall' || spec.type === 'sideWall') {
      for (let i = -2; i <= 2; i += 1) {
        const slit = new THREE.Mesh(
          new THREE.BoxGeometry(0.16, spec.size.y * 0.82, spec.size.z + 0.04),
          new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.7 })
        );
        slit.position.x = i * spec.size.x * 0.16;
        group.add(slit);
      }
      const trimMat = new THREE.MeshBasicMaterial({ color: 0x24dfff, transparent: true, opacity: 0.68, blending: THREE.AdditiveBlending });
      const trimTop = new THREE.Mesh(new THREE.BoxGeometry(spec.size.x + 0.12, 0.08, spec.size.z + 0.08), trimMat);
      const trimBottom = trimTop.clone();
      trimTop.position.y = spec.size.y * 0.5 + 0.04;
      trimBottom.position.y = -spec.size.y * 0.5 - 0.04;
      group.add(trimTop, trimBottom);
    }
    if (spec.type === 'tunnel') {
      const band = new THREE.Mesh(
        new THREE.BoxGeometry(spec.size.x + 0.08, spec.size.y + 0.08, 0.08),
        new THREE.MeshBasicMaterial({ color: 0x9ff7ff, transparent: true, opacity: 0.58 })
      );
      band.position.z = -spec.size.z / 2;
      group.add(band);
      const band2 = band.clone();
      band2.position.z = spec.size.z / 2;
      group.add(band2);
    }
    if (spec.type === 'caveRoof') {
      for (let i = -2; i <= 2; i += 1) {
        const seam = new THREE.Mesh(
          new THREE.BoxGeometry(spec.size.x + 0.1, 0.05, 0.08),
          new THREE.MeshBasicMaterial({ color: 0x24dfff, transparent: true, opacity: 0.38 })
        );
        seam.position.z = i * spec.size.z * 0.18;
        seam.position.y = -spec.size.y * 0.52;
        group.add(seam);
      }
    }
    return group;
  }

  #checkpoint(marker) {
    const group = this.#pad(marker, 0x33ff8a, `Save ${marker.id}`);
    const archMat = new THREE.MeshStandardMaterial({ color: 0x21ffd4, emissive: 0x0fb48e, emissiveIntensity: 1.1, roughness: 0.24 });
    const left = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.2, 10), archMat);
    const right = left.clone();
    const top = new THREE.Mesh(new THREE.BoxGeometry(marker.size.x + 0.6, 0.16, 0.16), archMat);
    left.position.set(-marker.size.x * 0.5, 1.65, 0);
    right.position.set(marker.size.x * 0.5, 1.65, 0);
    top.position.set(0, 3.25, 0);
    group.add(left, right, top, this.#checkpointNumber(marker));
    return group;
  }

  #checkpointNumber(marker) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = 'rgba(4, 12, 20, 0.72)';
    context.strokeStyle = '#33ff8a';
    context.lineWidth = 8;
    this.#roundRectPath(context, 42, 18, 172, 92, 22);
    context.fill();
    context.stroke();
    context.shadowColor = '#33ff8a';
    context.shadowBlur = 18;
    context.fillStyle = '#eafff5';
    context.font = '700 64px Arial, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(String(marker.id), 128, 66);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
    sprite.name = `Save ${marker.id} number`;
    sprite.position.set(0, 4.35, 0);
    sprite.scale.set(2.7, 1.35, 1);
    return sprite;
  }

  #roundRectPath(context, x, y, width, height, radius) {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.lineTo(x + width - radius, y);
    context.quadraticCurveTo(x + width, y, x + width, y + radius);
    context.lineTo(x + width, y + height - radius);
    context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    context.lineTo(x + radius, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - radius);
    context.lineTo(x, y + radius);
    context.quadraticCurveTo(x, y, x + radius, y);
    context.closePath();
  }

  #pickup(pickup) {
    const group = new THREE.Group();
    group.name = `Drop ${pickup.id}`;
    group.position.set(pickup.position.x, pickup.position.y, pickup.position.z);
    if (pickup.type === 'refill') return this.#refillPickup(group);
    const mat = new THREE.MeshStandardMaterial({ color: 0x4de6ff, emissive: 0x17b8ff, emissiveIntensity: 1.5, roughness: 0.18, metalness: 0.1 });
    const drop = new THREE.Mesh(new THREE.SphereGeometry(0.48, 18, 14), mat);
    drop.scale.set(0.72, 1.15, 0.72);
    const point = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.75, 18), mat);
    point.position.y = -0.55;
    point.rotation.x = Math.PI;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.82, 0.035, 8, 34),
      new THREE.MeshBasicMaterial({ color: 0x9ff7ff, transparent: true, opacity: 0.72, blending: THREE.AdditiveBlending })
    );
    ring.rotation.x = Math.PI / 2;
    group.add(drop, point, ring);
    return group;
  }

  #refillPickup(group) {
    const mat = new THREE.MeshStandardMaterial({ color: 0x66ff9a, emissive: 0x24ff7a, emissiveIntensity: 1.65, roughness: 0.18, metalness: 0.1 });
    const drop = new THREE.Mesh(new THREE.SphereGeometry(0.5, 18, 14), mat);
    drop.scale.set(0.72, 1.18, 0.72);
    const point = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.78, 18), mat);
    point.position.y = -0.58;
    point.rotation.x = Math.PI;
    const markMat = new THREE.MeshBasicMaterial({ color: 0xeaff9f, transparent: true, opacity: 0.86, blending: THREE.AdditiveBlending });
    const barA = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.07, 0.07), markMat);
    const barB = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.52, 0.07), markMat);
    barA.position.z = 0.42;
    barB.position.z = 0.42;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.84, 0.035, 8, 34),
      new THREE.MeshBasicMaterial({ color: 0x9fffc7, transparent: true, opacity: 0.72, blending: THREE.AdditiveBlending })
    );
    ring.rotation.x = Math.PI / 2;
    const outerRing = ring.clone();
    outerRing.scale.set(1.22, 1.22, 1.22);
    outerRing.material = ring.material.clone();
    outerRing.material.opacity = 0.32;
    group.add(drop, point, barA, barB, ring, outerRing);
    return group;
  }

  #bounds(bounds) {
    const group = new THREE.Group();
    const mat = new THREE.LineBasicMaterial({ color: 0x197bff });
    const points = [
      new THREE.Vector3(bounds.minX, 0.1, bounds.minZ),
      new THREE.Vector3(bounds.maxX, 0.1, bounds.minZ),
      new THREE.Vector3(bounds.maxX, 0.1, bounds.maxZ),
      new THREE.Vector3(bounds.minX, 0.1, bounds.maxZ),
      new THREE.Vector3(bounds.minX, 0.1, bounds.minZ)
    ];
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), mat));
    return group;
  }

  #stars(level) {
    const group = new THREE.Group();
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const color = new THREE.Color();
    let seed = (level.terrain.seed ?? 1) * 9973;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let i = 0; i < 180; i += 1) {
      positions.push((random() - 0.5) * 140, 18 + random() * 44, -36 - random() * 70);
      color.setHex(i % 5 === 0 ? 0x24dfff : 0xb8d7ff);
      colors.push(color.r, color.g, color.b);
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    group.add(new THREE.Points(geometry, new THREE.PointsMaterial({ size: 0.12, vertexColors: true, transparent: true, opacity: 0.9 })));
    return group;
  }

  #routeMarkers(level) {
    const group = new THREE.Group();
    const material = new THREE.MeshBasicMaterial({ color: 0x24dfff, transparent: true, opacity: 0.62 });
    const markers = level.checkpoints ?? [level.landingPad];
    for (const end of markers) {
      const x = end.position.x;
      const z = end.position.z;
      const marker = new THREE.Mesh(new THREE.RingGeometry(0.28, 0.34, 20), material);
      marker.rotation.x = -Math.PI / 2;
      marker.position.set(x, 0.18, z);
      group.add(marker);
    }
    return group;
  }

  #skyline(level) {
    const group = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color: 0x081727, transparent: true, opacity: 0.85 });
    for (let i = 0; i < 24; i += 1) {
      const h = 2 + ((i * 17 + level.terrain.seed) % 8);
      const tower = new THREE.Mesh(new THREE.BoxGeometry(1.2, h, 1.2), mat);
      tower.position.set(-34 + i * 3, h / 2 - 0.5, -52 - (i % 4) * 5);
      group.add(tower);
    }
    return group;
  }
}

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
      const mesh = this.#box(spec, level);
      obstacleMeshes.push(mesh);
      group.add(mesh);
    });
    const checkpointCollisionSpecs = (level.checkpoints ?? [level.landingPad]).flatMap((checkpoint) => this.#checkpointCollisionSpecs(checkpoint));
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
      boxes: [
        ...hazardSpecs.map((spec, index) => ({ spec, mesh: obstacleMeshes[index], box: makeBoxFromSpec(spec), origin: { ...spec.position } })),
        ...checkpointCollisionSpecs.map((spec) => ({ spec, mesh: null, box: makeBoxFromSpec(spec), origin: { ...spec.position } }))
      ]
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
        let h = this.#terrainHeight(level, px, worldZ, pz);
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

  #terrainHeight(level, px, worldZ, localZ = worldZ - (level.terrain.centerZ ?? 0)) {
    const { width, amplitude, frequency, seed, startDistance = 0 } = level.terrain;
    const routeDistance = Math.max(0, startDistance + level.launchPad.position.z - worldZ);
    const terrainDifficulty = Math.min(2.4, 0.18 + routeDistance / 1500);
    const wave = Math.sin((px + seed) * frequency) * Math.cos((localZ - seed) * frequency * 0.72);
    const ridge = Math.sin((px * 0.31 + localZ * 0.19 + seed) * frequency * 1.7);
    const brokenGround = Math.sin((px * 0.47 - localZ * 0.23 + seed) * frequency * 3.1) * 0.22;
    const sideRise = Math.max(0, Math.abs(px) / (width / 2) - 0.42);
    const canyonWall = sideRise ** 2.2 * (4.2 + terrainDifficulty * 4.6);
    const centerDip = Math.max(0, 1 - Math.abs(px) / 16) * terrainDifficulty * -0.18;
    return ((wave * 0.65 + ridge * 0.35 + brokenGround) * amplitude * (0.85 + terrainDifficulty * 0.82)) + canyonWall + centerDip;
  }

  #pad(pad, color, label) {
    const group = new THREE.Group();
    group.name = label;
    group.position.set(pad.position.x, pad.position.y, pad.position.z);
    const sx = pad.size.x;
    const sz = pad.size.z;
    const coreSize = Math.min(sx, sz);
    const isLaunch = /launch/i.test(label);
    const padText = isLaunch ? 'LAUNCH' : 'LAND';
    const deckMaterial = this.#padDeckMaterial(color, padText);
    const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x1f252d, emissive: 0x050b10, emissiveIntensity: 0.35, roughness: 0.46, metalness: 0.62 });
    const edgeMaterial = new THREE.MeshStandardMaterial({ color: 0x394552, emissive: 0x07131b, emissiveIntensity: 0.45, roughness: 0.32, metalness: 0.72 });
    const glowMaterial = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false });
    const hotMaterial = new THREE.MeshBasicMaterial({ color: isLaunch ? 0xff8a24 : color, transparent: true, opacity: 0.92, blending: THREE.AdditiveBlending, depthWrite: false });

    const foundation = new THREE.Mesh(
      new THREE.BoxGeometry(sx + 1.1, 0.24, sz + 1.1),
      baseMaterial
    );
    foundation.position.y = -0.03;
    group.add(foundation);

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(sx, 0.18, sz),
      deckMaterial
    );
    base.position.y = 0.08;
    group.add(base);

    const glow = new THREE.Mesh(
      new THREE.BoxGeometry(sx + 0.55, 0.03, sz + 0.55),
      glowMaterial
    );
    glow.position.y = 0.18;
    group.add(glow);

    const rails = [
      { x: 0, z: -sz / 2 - 0.16, w: sx + 0.85, d: 0.16 },
      { x: 0, z: sz / 2 + 0.16, w: sx + 0.85, d: 0.16 },
      { x: -sx / 2 - 0.16, z: 0, w: 0.16, d: sz + 0.85 },
      { x: sx / 2 + 0.16, z: 0, w: 0.16, d: sz + 0.85 }
    ];
    rails.forEach((rail) => {
      const rim = new THREE.Mesh(new THREE.BoxGeometry(rail.w, 0.16, rail.d), edgeMaterial);
      rim.position.set(rail.x, 0.22, rail.z);
      group.add(rim);
    });

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(coreSize * 0.25, coreSize * 0.36, 56),
      hotMaterial
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.235;
    group.add(ring);

    const outerRing = new THREE.Mesh(
      new THREE.RingGeometry(coreSize * 0.47, coreSize * 0.5, 64),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    outerRing.rotation.x = -Math.PI / 2;
    outerRing.position.y = 0.238;
    group.add(outerRing);

    const crossMaterial = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.78, blending: THREE.AdditiveBlending, depthWrite: false });
    const crossA = new THREE.Mesh(new THREE.BoxGeometry(coreSize * 0.82, 0.025, 0.08), crossMaterial);
    const crossB = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.025, coreSize * 0.82), crossMaterial);
    crossA.position.y = 0.245;
    crossB.position.y = 0.246;
    group.add(crossA, crossB);

    const lightGeometry = new THREE.BoxGeometry(0.32, 0.04, 0.09);
    for (let i = -2; i <= 2; i += 1) {
      const front = new THREE.Mesh(lightGeometry, hotMaterial);
      front.position.set((sx / 6) * i, 0.31, sz / 2 + 0.28);
      const back = front.clone();
      back.position.z = -sz / 2 - 0.28;
      group.add(front, back);
    }
    for (const x of [-sx / 2 - 0.22, sx / 2 + 0.22]) {
      for (const z of [-sz / 2 - 0.22, sz / 2 + 0.22]) {
        const beacon = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.16, 0.18, 12),
          hotMaterial
        );
        beacon.position.set(x, 0.38, z);
        group.add(beacon);
      }
    }

    const hoseMaterial = new THREE.MeshStandardMaterial({ color: 0x101820, roughness: 0.54, metalness: 0.44 });
    const hose = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.045, 8, 32), hoseMaterial);
    hose.rotation.x = Math.PI / 2;
    hose.position.set(-sx / 2 - 0.58, 0.22, -sz * 0.18);
    group.add(hose);
    const pipe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, sz * 0.52), hoseMaterial);
    pipe.position.set(-sx / 2 - 0.48, 0.2, sz * 0.11);
    group.add(pipe);

    const consoleMaterial = new THREE.MeshStandardMaterial({ color: 0x26323c, emissive: 0x071923, emissiveIntensity: 0.38, roughness: 0.38, metalness: 0.68 });
    const console = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.32), consoleMaterial);
    console.position.set(sx / 2 + 0.46, 0.31, -sz * 0.26);
    const screen = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.16, 0.02),
      new THREE.MeshBasicMaterial({ color: 0x9ff7ff, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending })
    );
    screen.position.set(sx / 2 + 0.46, 0.38, -sz * 0.43);
    group.add(console, screen);

    const crateMaterial = new THREE.MeshStandardMaterial({ color: 0x515b64, roughness: 0.62, metalness: 0.36 });
    const crateA = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.28, 0.34), crateMaterial);
    crateA.position.set(-sx / 2 - 0.42, 0.22, sz * 0.34);
    const crateB = crateA.clone();
    crateB.scale.set(0.8, 0.7, 1.15);
    crateB.position.set(-sx / 2 - 0.72, 0.19, sz * 0.48);
    group.add(crateA, crateB);

    const guideLight = new THREE.PointLight(color, 0.55, Math.max(sx, sz) * 3.2, 2.2);
    guideLight.position.set(0, 1.4, 0);
    group.add(guideLight);
    return group;
  }

  #padDeckMaterial(color, label) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    context.fillStyle = '#252d35';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#465461';
    context.lineWidth = 5;
    for (let i = 64; i < 512; i += 96) {
      context.beginPath();
      context.moveTo(i, 24);
      context.lineTo(i, 488);
      context.stroke();
      context.beginPath();
      context.moveTo(24, i);
      context.lineTo(488, i);
      context.stroke();
    }
    context.strokeStyle = '#121820';
    context.lineWidth = 14;
    context.strokeRect(22, 22, 468, 468);
    context.strokeStyle = '#f59a23';
    context.lineWidth = 12;
    for (let i = -120; i < 520; i += 56) {
      context.beginPath();
      context.moveTo(i, 492);
      context.lineTo(i + 42, 452);
      context.stroke();
      context.beginPath();
      context.moveTo(i, 60);
      context.lineTo(i + 42, 20);
      context.stroke();
    }
    context.strokeStyle = `#${color.toString(16).padStart(6, '0')}`;
    context.lineWidth = 8;
    context.beginPath();
    context.arc(256, 256, 122, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.arc(256, 256, 178, 0, Math.PI * 2);
    context.stroke();
    context.fillStyle = 'rgba(5, 12, 18, 0.72)';
    context.fillRect(155, 228, 202, 56);
    context.shadowColor = `#${color.toString(16).padStart(6, '0')}`;
    context.shadowBlur = 16;
    context.fillStyle = '#eaffff';
    context.font = '700 38px Arial, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(label, 256, 257);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    texture.needsUpdate = true;
    return new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: texture,
      emissive: 0x071018,
      emissiveIntensity: 0.42,
      roughness: 0.36,
      metalness: 0.7
    });
  }

  #box(spec, level) {
    if (spec.type === 'caveRoof') return this.#invertedTerrainRoof(spec, level);
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

  #invertedTerrainRoof(spec, level) {
    const group = new THREE.Group();
    group.position.set(spec.position.x, spec.position.y, spec.position.z);
    group.name = spec.type;
    const segmentsX = 18;
    const segmentsZ = Math.max(22, Math.min(52, Math.round(spec.size.z / 2.2)));
    const geometry = new THREE.PlaneGeometry(spec.size.x, spec.size.z, segmentsX, segmentsZ);
    geometry.rotateX(-Math.PI / 2);
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i += 1) {
      const localX = positions.getX(i);
      const localZ = positions.getZ(i);
      const worldX = spec.position.x + localX;
      const worldZ = spec.position.z + localZ;
      const sourceHeight = this.#terrainHeight(level, worldX, worldZ);
      const relief = Math.max(0, Math.min(spec.size.y * 0.82, Math.abs(sourceHeight) * 0.34 + Math.max(0, sourceHeight) * 0.16));
      positions.setY(i, -spec.size.y * 0.48 + relief);
    }
    geometry.computeVertexNormals();
    const material = new THREE.MeshStandardMaterial({
      color: level.visualTheme.terrain,
      roughness: 0.9,
      metalness: 0.1,
      emissive: 0x0a2030,
      emissiveIntensity: 0.26,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);
    const wire = new THREE.LineSegments(
      new THREE.WireframeGeometry(geometry),
      new THREE.LineBasicMaterial({ color: 0x1f6f92, transparent: true, opacity: 0.28 })
    );
    mesh.add(wire);
    return group;
  }

  #checkpoint(marker) {
    const group = this.#pad(marker, 0x33ff8a, `Save ${marker.id}`);
    const archMat = new THREE.MeshStandardMaterial({ color: 0x21ffd4, emissive: 0x0fb48e, emissiveIntensity: 1.1, roughness: 0.24 });
    const left = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.2, 10), archMat);
    const right = left.clone();
    left.position.set(-marker.size.x * 0.5, 1.65, 0);
    right.position.set(marker.size.x * 0.5, 1.65, 0);
    group.add(left, right, this.#checkpointNumber(marker));
    return group;
  }

  #checkpointCollisionSpecs(marker) {
    const postHeight = 3.2;
    const postWidth = 0.24;
    return [
      {
        type: 'checkpointPillar',
        position: { x: marker.position.x - marker.size.x * 0.5, y: marker.position.y + 1.65, z: marker.position.z },
        size: { x: postWidth, y: postHeight, z: postWidth }
      },
      {
        type: 'checkpointPillar',
        position: { x: marker.position.x + marker.size.x * 0.5, y: marker.position.y + 1.65, z: marker.position.z },
        size: { x: postWidth, y: postHeight, z: postWidth }
      }
    ];
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
    const innerRing = this.#pickupRing(0.82, 0x9fffc7, 0.88);
    const outerRing = this.#pickupRing(1.22, 0xffd166, 0.62);
    const hoverZone = new THREE.Mesh(
      new THREE.CylinderGeometry(1.08, 1.08, 2.7, 42, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x66ff9a, transparent: true, opacity: 0.11, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    );
    hoverZone.position.y = -0.06;
    const column = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 2.45, 18),
      new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.46, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    column.position.y = -0.05;
    const holdHalo = this.#pickupRing(1.08, 0x66ff9a, 0.34);
    holdHalo.position.y = -0.92;
    group.add(drop, point, barA, barB, hoverZone, column, innerRing, outerRing, holdHalo);
    return group;
  }

  #pickupRing(radius, color, opacity) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.035, 8, 42),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    ring.rotation.x = Math.PI / 2;
    return ring;
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

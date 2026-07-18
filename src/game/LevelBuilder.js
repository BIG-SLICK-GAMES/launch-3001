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
    [...level.obstacles, ...level.roofs, ...level.walls, ...(level.tunnels ?? [])].forEach((spec) => {
      const mesh = this.#box(spec);
      obstacleMeshes.push(mesh);
      group.add(mesh);
    });
    const pickupGroup = new THREE.Group();
    for (const pickup of level.pickups ?? []) {
      pickupGroup.add(this.#pickup(pickup));
    }
    group.add(
      pickupGroup,
      this.#bounds(level.worldBounds),
      this.#routeMarkers(level),
      this.#runway(level),
      this.#skyline(level),
      this.#stars()
    );
    return {
      group,
      terrain,
      launchPad,
      landingPad,
      obstacleMeshes,
      pickupMeshes: pickupGroup.children,
      checkpointMeshes: checkpointGroup.children,
      boxes: [...level.obstacles, ...level.roofs, ...level.walls, ...(level.tunnels ?? [])].map((spec) => ({ spec, box: makeBoxFromSpec(spec) }))
    };
  }

  #terrain(level) {
    const { width, depth, segments, amplitude, frequency, seed, centerZ = 0 } = level.terrain;
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
        const wave = Math.sin((px + seed) * frequency) * Math.cos((pz - seed) * frequency * 0.72);
        const ridge = Math.sin((px * 0.31 + pz * 0.19 + seed) * frequency * 1.7);
        let h = (wave * 0.65 + ridge * 0.35) * amplitude;
        if (safeLaunch || safeLanding) h = -0.06;
        positions.setY(i, h);
        heights[z][x] = h;
      }
    }
    geometry.computeVertexNormals();
    const material = new THREE.MeshStandardMaterial({
      color: 0x08111d,
      roughness: 0.62,
      metalness: 0.38,
      emissive: 0x020915,
      emissiveIntensity: 0.42,
      flatShading: false
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = centerZ;
    mesh.receiveShadow = false;
    const wire = new THREE.LineSegments(
      new THREE.WireframeGeometry(geometry),
      new THREE.LineBasicMaterial({ color: 0x144c70, transparent: true, opacity: 0.22 })
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
    const deckMat = new THREE.MeshStandardMaterial({ color: 0x071322, emissive: 0x061a27, emissiveIntensity: 0.6, roughness: 0.34, metalness: 0.55 });
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(pad.size.x + 0.5, 0.2, pad.size.z + 0.5),
      deckMat
    );
    group.add(base);
    const core = new THREE.Mesh(
      new THREE.BoxGeometry(pad.size.x, 0.08, pad.size.z),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending })
    );
    core.position.y = 0.13;
    group.add(core);
    const glow = new THREE.Mesh(
      new THREE.BoxGeometry(pad.size.x + 1.0, 0.035, pad.size.z + 1.0),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.26, blending: THREE.AdditiveBlending })
    );
    glow.position.y = 0.16;
    group.add(glow);
    const frame = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(pad.size.x + 0.55, 0.24, pad.size.z + 0.55)),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.95 })
    );
    frame.position.y = 0.02;
    group.add(frame);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(Math.min(pad.size.x, pad.size.z) * 0.24, Math.min(pad.size.x, pad.size.z) * 0.34, 36),
      new THREE.MeshBasicMaterial({ color: 0x7ff7ff, side: THREE.DoubleSide, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.18;
    group.add(ring);
    const ring2 = ring.clone();
    ring2.geometry = new THREE.RingGeometry(Math.min(pad.size.x, pad.size.z) * 0.39, Math.min(pad.size.x, pad.size.z) * 0.42, 48);
    group.add(ring2);
    return group;
  }

  #box(spec) {
    const color = spec.type === 'tunnel' ? 0x24dfff : spec.type === 'roof' ? 0xff7a26 : spec.type === 'wall' ? 0x24dfff : 0xff8b2c;
    const group = new THREE.Group();
    group.position.set(spec.position.x, spec.position.y, spec.position.z);
    group.name = spec.type;
    const material = new THREE.MeshStandardMaterial({ color: 0x0b1727, emissive: color, emissiveIntensity: 0.36, transparent: true, opacity: 0.96, roughness: 0.32, metalness: 0.52 });
    const mesh = new THREE.Mesh(
      spec.type === 'spire'
        ? new THREE.ConeGeometry(Math.max(spec.size.x, spec.size.z) * 0.55, spec.size.y, 7)
        : new THREE.BoxGeometry(spec.size.x, spec.size.y, spec.size.z),
      material
    );
    mesh.name = `${spec.type} core`;
    group.add(mesh);
    const edge = new THREE.LineSegments(
      new THREE.EdgesGeometry(mesh.geometry),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.82 })
    );
    mesh.add(edge);
    const glowShell = new THREE.Mesh(
      mesh.geometry.clone(),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, side: THREE.BackSide })
    );
    glowShell.scale.set(1.08, 1.04, 1.08);
    group.add(glowShell);
    if (spec.type !== 'roof' && spec.type !== 'tunnel') {
      const cap = new THREE.Mesh(
        new THREE.TorusGeometry(Math.max(spec.size.x, spec.size.z) * 0.35, 0.055, 8, 22),
        new THREE.MeshBasicMaterial({ color: 0xffa24a, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending })
      );
      cap.position.y = spec.size.y * 0.5;
      cap.rotation.x = Math.PI / 2;
      group.add(cap);
    }
    if (spec.type === 'wall') {
      for (let i = -2; i <= 2; i += 1) {
        const slit = new THREE.Mesh(
          new THREE.BoxGeometry(0.16, spec.size.y * 0.82, spec.size.z + 0.04),
          new THREE.MeshBasicMaterial({ color: 0x25e7ff, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending })
        );
        slit.position.x = i * spec.size.x * 0.16;
        group.add(slit);
      }
    }
    if (spec.type === 'tunnel') {
      const band = new THREE.Mesh(
        new THREE.BoxGeometry(spec.size.x + 0.08, spec.size.y + 0.08, 0.08),
        new THREE.MeshBasicMaterial({ color: 0x9ff7ff, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending })
      );
      band.position.z = -spec.size.z / 2;
      group.add(band);
      const band2 = band.clone();
      band2.position.z = spec.size.z / 2;
      group.add(band2);
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
    group.add(left, right, top);
    return group;
  }

  #pickup(pickup) {
    const group = new THREE.Group();
    group.name = `Drop ${pickup.id}`;
    group.position.set(pickup.position.x, pickup.position.y, pickup.position.z);
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

  #bounds(bounds) {
    const group = new THREE.Group();
    const mat = new THREE.LineBasicMaterial({ color: 0x19d7ff, transparent: true, opacity: 0.72 });
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

  #runway(level) {
    const group = new THREE.Group();
    const startZ = level.worldBounds.maxZ;
    const endZ = level.worldBounds.minZ;
    const cyan = new THREE.LineBasicMaterial({ color: 0x18dfff, transparent: true, opacity: 0.74 });
    const blueDim = new THREE.LineBasicMaterial({ color: 0x0b6dff, transparent: true, opacity: 0.28 });
    const orange = new THREE.LineBasicMaterial({ color: 0xff7a26, transparent: true, opacity: 0.62 });

    for (let x = -18; x <= 18; x += 3) {
      const mat = Math.abs(x) === 15 ? cyan : blueDim;
      group.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x, 0.08, startZ),
          new THREE.Vector3(x, 0.08, endZ)
        ]),
        mat
      ));
    }
    for (let z = Math.floor(endZ / 5) * 5; z <= startZ; z += 5) {
      group.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-18, 0.085, z),
          new THREE.Vector3(18, 0.085, z)
        ]),
        blueDim
      ));
    }
    for (let z = startZ - 14; z > endZ; z -= 22) {
      const left = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 0.035, 0.16),
        new THREE.MeshBasicMaterial({ color: z % 44 === 0 ? 0xff7a26 : 0x18dfff, transparent: true, opacity: 0.82, blending: THREE.AdditiveBlending })
      );
      left.position.set(-21, 0.13, z);
      const right = left.clone();
      right.position.x = 21;
      group.add(left, right);
    }
    for (let z = startZ - 28; z > endZ; z -= 42) {
      const tri = new THREE.Mesh(
        new THREE.ConeGeometry(1.25, 0.08, 3),
        new THREE.MeshBasicMaterial({ color: 0xff8b2c, transparent: true, opacity: 0.72, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
      );
      tri.rotation.y = Math.PI / 3;
      tri.position.set(z % 84 === 0 ? -24 : 24, 0.35, z);
      group.add(tri);
      const halo = new THREE.PointLight(0xff7a26, 0.35, 8);
      halo.position.copy(tri.position);
      group.add(halo);
    }
    return group;
  }

  #stars() {
    const group = new THREE.Group();
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const color = new THREE.Color();
    for (let i = 0; i < 520; i += 1) {
      positions.push((Math.random() - 0.5) * 190, 13 + Math.random() * 62, 24 - Math.random() * 190);
      color.setHex(i % 13 === 0 ? 0x24dfff : i % 7 === 0 ? 0x4c83ff : 0xd6e8ff);
      colors.push(color.r, color.g, color.b);
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    group.add(new THREE.Points(geometry, new THREE.PointsMaterial({ size: 0.1, vertexColors: true, transparent: true, opacity: 0.95 })));
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
    const mat = new THREE.MeshStandardMaterial({ color: 0x071221, emissive: 0x020814, emissiveIntensity: 0.55, roughness: 0.5, metalness: 0.4 });
    const cyan = new THREE.MeshBasicMaterial({ color: 0x18dfff, transparent: true, opacity: 0.82, blending: THREE.AdditiveBlending });
    const orange = new THREE.MeshBasicMaterial({ color: 0xff7a26, transparent: true, opacity: 0.72, blending: THREE.AdditiveBlending });
    for (let i = 0; i < 42; i += 1) {
      const h = 2 + ((i * 17 + level.terrain.seed) % 8);
      const width = 0.7 + (i % 3) * 0.35;
      const side = i % 2 === 0 ? -1 : 1;
      const tower = new THREE.Mesh(new THREE.BoxGeometry(width, h, width), mat);
      tower.position.set(side * (24 + (i % 11) * 3.5), h / 2 - 0.5, -28 - i * 5.6);
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.08, h * 0.75, 0.04), i % 4 === 0 ? orange : cyan);
      strip.position.set(0, 0, -width / 2 - 0.025);
      tower.add(strip);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(width * 0.82, 0.08, width * 0.82), cyan);
      cap.position.y = h / 2 + 0.05;
      tower.add(cap);
      group.add(tower);
    }
    return group;
  }
}

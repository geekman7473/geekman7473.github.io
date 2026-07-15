// Live three.js render: players seated at a folding table.
// One script drives every <div data-lan-table> on the page. Attributes:
//   data-feet    table length in feet (6 -> 4 seats, 8 -> 6 seats). Default 6.
//   data-laptops how many players are on laptops instead of desktops. Default 1.
// Units: 1 unit = 1 foot. Drag to orbit, scroll to zoom. Hover a render and
// press "P" to download a 1600x1000 PNG of that view (for baking a static image).

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.166.1/+esm';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.166.1/examples/jsm/controls/OrbitControls.js/+esm';
import { RoundedBoxGeometry } from 'https://cdn.jsdelivr.net/npm/three@0.166.1/examples/jsm/geometries/RoundedBoxGeometry.js/+esm';

document.querySelectorAll('[data-lan-table]').forEach(init);

function init(container) {
  const TABLE_L = parseFloat(container.dataset.feet || '6');
  const NUM_LAPTOPS = parseInt(container.dataset.laptops || '1', 10);
  const TABLE_W = 2.5;      // 30"
  const TABLE_H = 2.42;     // 29"
  const TOP_T = 0.15;
  const SEAT_H = 1.45;
  const SPACING = 2.6;      // between neighboring players on a side
  const PER_SIDE = TABLE_L >= 8 ? 3 : 2;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf2efe9);

  const camScale = TABLE_L / 6;
  const camera = new THREE.PerspectiveCamera(40, 16 / 10, 0.1, 100);
  camera.position.set(9.5 * camScale, 7.5 * camScale, 10.5 * camScale);

  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1.9, 0);
  controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI / 2 - 0.05;
  controls.addEventListener('end', () => {
    console.log(
      '[%sft] camera.position.set(%s, %s, %s); controls.target.set(%s, %s, %s);',
      TABLE_L,
      camera.position.x.toFixed(2), camera.position.y.toFixed(2), camera.position.z.toFixed(2),
      controls.target.x.toFixed(2), controls.target.y.toFixed(2), controls.target.z.toFixed(2)
    );
  });

  // ---------- helpers ----------
  const mat = (color, opts = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.0, ...opts });

  function box(w, h, d, material) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  // A box "limb" running from point a to point b.
  function limb(a, b, thickness, material) {
    const from = new THREE.Vector3(...a);
    const to = new THREE.Vector3(...b);
    const len = from.distanceTo(to);
    const m = box(thickness, thickness, len, material);
    m.position.copy(from).add(to).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      to.clone().sub(from).normalize()
    );
    return m;
  }

  // ---------- lights ----------
  scene.add(new THREE.HemisphereLight(0xfff6e8, 0xb0a898, 0.9));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(6, 12, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -10;
  sun.shadow.camera.right = 10;
  sun.shadow.camera.top = 10;
  sun.shadow.camera.bottom = -10;
  sun.shadow.bias = -0.0005;
  scene.add(sun);

  // ---------- floor ----------
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(26, 18),
    mat(0xd9d2c6, { roughness: 1 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // ---------- folding table ----------
  const table = new THREE.Group();
  const top = box(TABLE_L, TOP_T, TABLE_W, mat(0xece9e2, { roughness: 0.6 }));
  top.position.y = TABLE_H - TOP_T / 2;
  table.add(top);

  const legMat = mat(0x6b6b6b, { metalness: 0.6, roughness: 0.4 });
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const leg = limb(
        [sx * (TABLE_L / 2 - 0.55), TABLE_H - TOP_T, sz * (TABLE_W / 2 - 0.25)],
        [sx * (TABLE_L / 2 - 0.35), 0.02, sz * (TABLE_W / 2 - 0.15)],
        0.09, legMat
      );
      table.add(leg);
    }
    // cross brace between each leg pair
    table.add(limb(
      [sx * (TABLE_L / 2 - 0.45), 0.5, -(TABLE_W / 2 - 0.2)],
      [sx * (TABLE_L / 2 - 0.45), 0.5, (TABLE_W / 2 - 0.2)],
      0.07, legMat
    ));
  }
  scene.add(table);

  // ---------- cable bundle ----------
  // runs down the table's spine, then drapes over the +x end to the floor,
  // angled toward +z where neither layout parks a tower
  const cableColors = [0x202020, 0x2e3138, 0x1c2433];
  cableColors.forEach((c, i) => {
    const oz = (i - 1) * 0.09; // fan the strands out slightly
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-(TABLE_L / 2 - 0.25), TABLE_H + 0.05, oz),
      new THREE.Vector3(0, TABLE_H + 0.05, oz),
      new THREE.Vector3(TABLE_L / 2 - 0.3, TABLE_H + 0.05, oz + 0.15),
      new THREE.Vector3(TABLE_L / 2 + 0.1, TABLE_H - 0.15, 0.35 + oz),
      new THREE.Vector3(TABLE_L / 2 + 0.45, 0.6, 0.5 + oz),
      new THREE.Vector3(TABLE_L / 2 + 0.75, 0.045, 0.55 + oz + i * 0.06),
    ]);
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 80, 0.045, 8),
      mat(c, { roughness: 0.7 })
    );
    tube.castShadow = tube.receiveShadow = true;
    scene.add(tube);
  });

  // ---------- folding chair ----------
  function foldingChair(frameColor = 0x4a4a4a) {
    const g = new THREE.Group();
    const frame = mat(frameColor, { metalness: 0.4, roughness: 0.5 });
    const padding = mat(0x3a3d46, { roughness: 0.95 });

    // puffy padded seat cushion on a thin frame pan
    const pan = box(1.3, 0.05, 1.25, frame);
    pan.position.y = SEAT_H - 0.1;
    g.add(pan);
    const seat = new THREE.Mesh(new RoundedBoxGeometry(1.3, 0.22, 1.25, 4, 0.09), padding);
    seat.castShadow = seat.receiveShadow = true;
    seat.position.y = SEAT_H;
    g.add(seat);

    // legs (slightly splayed, front pair and rear pair)
    for (const sx of [-1, 1]) {
      g.add(limb([sx * 0.55, SEAT_H - 0.04, 0.5], [sx * 0.62, 0.02, 0.72], 0.07, frame));
      g.add(limb([sx * 0.55, SEAT_H - 0.04, -0.5], [sx * 0.62, 0.02, -0.72], 0.07, frame));
      // backrest posts
      g.add(limb([sx * 0.55, SEAT_H, -0.55], [sx * 0.5, SEAT_H + 1.35, -0.65], 0.07, frame));
    }

    // padded highback cushion
    const backrest = new THREE.Mesh(new RoundedBoxGeometry(1.3, 0.85, 0.18, 4, 0.08), padding);
    backrest.castShadow = backrest.receiveShadow = true;
    backrest.position.set(0, SEAT_H + 1.0, -0.61);
    backrest.rotation.x = 0.07;
    g.add(backrest);
    return g;
  }

  // ---------- seated person (local forward = +z, toward the table) ----------
  function person(shirtColor, skinColor, pantsColor = 0x3d4756) {
    const g = new THREE.Group();
    const shirt = mat(shirtColor);
    const skin = mat(skinColor);
    const pants = mat(pantsColor);

    // torso, slightly leaned in
    const torso = box(1.1, 1.5, 0.55, shirt);
    torso.position.set(0, SEAT_H + 0.95, -0.15);
    torso.rotation.x = 0.12;
    g.add(torso);

    // head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 18), skin);
    head.castShadow = true;
    head.position.set(0, SEAT_H + 2.05, 0.0);
    g.add(head);

    for (const sx of [-1, 1]) {
      // thigh: hip -> knee (forward, under the table)
      g.add(limb([sx * 0.3, SEAT_H + 0.22, -0.25], [sx * 0.3, SEAT_H + 0.18, 1.05], 0.34, pants));
      // shin: knee -> floor
      g.add(limb([sx * 0.3, SEAT_H + 0.1, 1.1], [sx * 0.3, 0.15, 1.2], 0.28, pants));
      // shoe
      const shoe = box(0.32, 0.16, 0.55, mat(0x2b2b2b));
      shoe.position.set(sx * 0.3, 0.08, 1.35);
      g.add(shoe);
      // arm: shoulder -> hand at keyboard height
      g.add(limb([sx * 0.62, SEAT_H + 1.55, -0.1], [sx * 0.3, TABLE_H + 0.15, 1.05], 0.2, shirt));
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), skin);
      hand.castShadow = true;
      hand.position.set(sx * 0.3, TABLE_H + 0.15, 1.1);
      g.add(hand);
    }
    return g;
  }

  // ---------- gear (local forward = +z, screen faces +z toward its player) ----------
  function monitor(screenHue) {
    const g = new THREE.Group();
    const dark = mat(0x24262b, { roughness: 0.5 });
    const base = box(0.6, 0.05, 0.4, dark);
    base.position.y = 0.025;
    g.add(base);
    const neck = box(0.09, 0.55, 0.09, dark);
    neck.position.set(0, 0.3, -0.05);
    g.add(neck);
    const panel = box(1.95, 1.15, 0.08, dark);
    panel.position.set(0, 1.05, 0);
    panel.rotation.x = -0.06;
    g.add(panel);
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(1.8, 1.0),
      new THREE.MeshStandardMaterial({
        color: 0x0c0f14,
        emissive: screenHue,
        emissiveIntensity: 0.9,
        roughness: 0.4,
      })
    );
    screen.position.set(0, 1.05, 0.045);
    screen.rotation.x = -0.06;
    g.add(screen);
    return g;
  }

  function mouseMesh() {
    return box(0.2, 0.09, 0.32, mat(0x30333a, { roughness: 0.5 }));
  }

  function keyboardAndMouse() {
    const g = new THREE.Group();
    const kb = box(1.15, 0.06, 0.42, mat(0x30333a, { roughness: 0.6 }));
    kb.position.y = 0.03;
    g.add(kb);
    const mouse = mouseMesh();
    mouse.position.set(0.85, 0.045, 0.02);
    g.add(mouse);
    return g;
  }

  function tower(ledColor) {
    const g = new THREE.Group();
    const body = box(0.55, 1.35, 1.5, mat(0x1e2126, { roughness: 0.45, metalness: 0.2 }));
    body.position.y = 0.675;
    g.add(body);
    // glass side glow strip (LAN party RGB)
    const strip = box(0.02, 1.1, 0.08, new THREE.MeshStandardMaterial({
      color: 0x111111, emissive: ledColor, emissiveIntensity: 1.6,
    }));
    strip.position.set(0.28, 0.675, 0.55);
    g.add(strip);
    return g;
  }

  function laptop(screenHue) {
    const g = new THREE.Group();
    const shell = mat(0x9aa0a8, { metalness: 0.5, roughness: 0.4 });
    const base = box(1.1, 0.06, 0.78, shell);
    base.position.y = 0.03;
    g.add(base);
    const lid = new THREE.Group();
    lid.position.set(0, 0.05, -0.39);      // hinge at the rear edge
    lid.rotation.x = THREE.MathUtils.degToRad(-20); // open ~110 degrees (20 past vertical)
    const lidPanel = box(1.1, 0.75, 0.05, shell);
    lidPanel.position.set(0, 0.375, 0);
    lid.add(lidPanel);
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(1.0, 0.65),
      new THREE.MeshStandardMaterial({
        color: 0x0c0f14, emissive: screenHue, emissiveIntensity: 0.9, roughness: 0.4,
      })
    );
    screen.position.set(0, 0.375, 0.03);
    lid.add(screen);
    g.add(lid);
    return g;
  }

  // ---------- assemble the stations ----------
  // side = -1: player seated at negative z, facing +z. side = +1: mirrored.
  const SHIRTS = [0xc0504d, 0x4f81bd, 0x9bbb59, 0x8064a2, 0xd9a441, 0x4bacc6];
  const SKINS = [0xe0ac69, 0x8d5524, 0xf1c27d, 0xc68642, 0xffdbac, 0x9c6b3f];
  const SCREENS = [0x7fd4ff, 0xaefab2, 0xffd28a, 0xffb3c8, 0xc9b6ff, 0x9ff0e0];

  const players = [];
  for (const side of [-1, 1]) {
    for (let i = 0; i < PER_SIDE; i++) {
      const x = (i - (PER_SIDE - 1) / 2) * SPACING;
      players.push({ x, side });
    }
  }
  players.forEach((p, i) => {
    p.shirt = SHIRTS[i % SHIRTS.length];
    p.skin = SKINS[i % SKINS.length];
    p.screen = SCREENS[i % SCREENS.length];
  });
  // desktops claim the seats nearest the table ends (their towers sit there);
  // laptops get the rest
  const numDesktops = Math.max(0, players.length - NUM_LAPTOPS);
  [...players]
    .sort((a, b) => Math.abs(b.x) - Math.abs(a.x))
    .forEach((p, i) => { p.desktop = i < numDesktops; });

  for (const p of players) {
    const facing = p.side === -1 ? 0 : Math.PI;     // person local +z faces the table
    const gearFacing = p.side === -1 ? Math.PI : 0; // gear local +z (screen) faces the player

    const chair = foldingChair();
    chair.position.set(p.x, 0, p.side * 2.1);
    chair.rotation.y = facing;
    scene.add(chair);

    const dude = person(p.shirt, p.skin);
    dude.position.set(p.x, 0, p.side * 2.1);
    dude.rotation.y = facing;
    scene.add(dude);

    if (p.desktop) {
      const mon = monitor(p.screen);
      mon.position.set(p.x, TABLE_H, p.side * 0.38);
      mon.rotation.y = gearFacing;
      scene.add(mon);

      const kbm = keyboardAndMouse();
      kbm.position.set(p.x, TABLE_H, p.side * 0.95);
      kbm.rotation.y = gearFacing;
      scene.add(kbm);

      const pc = tower(p.screen);
      if (Math.abs(p.x) > 0.5) {
        // end seat: tower on the floor snug against the table legs, outside them
        pc.position.set(Math.sign(p.x) * (TABLE_L / 2 - 0.02), 0, p.side * 0.55);
        pc.rotation.y = gearFacing;
      } else {
        // middle seat: tower on the floor beside the chair, player's right
        pc.position.set(p.x + p.side * 1.4, 0, p.side * 2.15);
        pc.rotation.y = facing;
      }
      scene.add(pc);
    } else {
      const lap = laptop(p.screen);
      lap.position.set(p.x, TABLE_H, p.side * 0.75);
      lap.rotation.y = gearFacing;
      scene.add(lap);

      // wireless mouse on the table, player's right of the laptop
      const wMouse = mouseMesh();
      wMouse.position.set(p.x + p.side * 0.85, TABLE_H + 0.045, p.side * 0.85);
      scene.add(wMouse);
    }
  }

  // ---------- sizing / render loop ----------
  function resize() {
    const w = container.clientWidth;
    const h = Math.round(w * 10 / 16);
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  renderer.setAnimationLoop(() => {
    controls.update();
    renderer.render(scene, camera);
  });

  // Hover this render and press "P" to download a 1600x1000 PNG of it.
  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() !== 'p' || e.metaKey || e.ctrlKey || e.altKey) return;
    if (!renderer.domElement.matches(':hover')) return;
    const prevRatio = renderer.getPixelRatio();
    renderer.setPixelRatio(1);
    renderer.setSize(1600, 1000, false);
    camera.aspect = 1.6;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
    const a = document.createElement('a');
    a.href = renderer.domElement.toDataURL('image/png');
    a.download = `lan-table-${TABLE_L}ft.png`;
    a.click();
    renderer.setPixelRatio(prevRatio);
    resize();
  });
}

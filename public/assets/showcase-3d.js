import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const PROJECTS_URL = "/projects_extracted.json";

const PALETTE = {
  ground: 0xa3c9a3,
  groundDark: 0x7fb07f,
  water: 0xb8e3f0,
  path: 0xf0e6c5,
  trunk: 0xa08065,
  leaves: 0x7ab87a,
  cloud: 0xfffdf5,
  rock: 0x8a8a8a,
  rockLight: 0xa8a8a8,
  wood: 0x8d6e4a,
  woodDark: 0x6b5237,
  flowerRed: 0xe26a6a,
  flowerYellow: 0xf4d03f,
  flowerPurple: 0x9b59b6,
  reeds: 0x7d9c6a,
};

function lighten(hex, amount) {
  const c = new THREE.Color(hex);
  c.r = THREE.MathUtils.lerp(c.r, 1, amount);
  c.g = THREE.MathUtils.lerp(c.g, 1, amount);
  c.b = THREE.MathUtils.lerp(c.b, 1, amount);
  return c;
}

let scene, camera, renderer, controls, raycaster, pointer;
let projects = [];
let buildings = [];
let hoveredBuilding = null;
let selectedBuilding = null;
let autoRotate = true;
let clouds = [];
let birds = [];
let waterMesh = null;
let beaconBeam = null;

const tooltip = document.getElementById("tooltip");
const panel = document.getElementById("project-panel");
const loading = document.getElementById("loading");

async function init() {
  try {
    const res = await fetch(PROJECTS_URL);
    projects = await res.json();

    setupScene();
    setupLighting();
    createEnvironment();
    createBuildings();
    setupInteractions();
    setupUI();

    loading.classList.add("hidden", "force-hidden");

    const urlParams = new URLSearchParams(window.location.search);
    const openSlug = urlParams.get("project");
    if (openSlug) {
      const target = buildings.find((b) => b.userData.project.slug === openSlug);
      if (target) selectBuilding(target);
    }

    animate();
  } catch (e) {
    console.error("init failed", e);
    loading.innerHTML = `<div class="loading-text" style="color:#b33">加载失败：${e.message}</div><pre style="font-size:12px;color:#666;max-width:80vw;white-space:pre-wrap">${e.stack}</pre>`;
  }
}

function setupScene() {
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xfdf6e3, 38, 95);

  const canvas = document.getElementById("map-canvas");
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.SoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  camera = new THREE.PerspectiveCamera(
    42,
    window.innerWidth / window.innerHeight,
    0.1,
    300
  );
  camera.position.set(0, 26, 46);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 18;
  controls.maxDistance = 75;
  controls.maxPolarAngle = Math.PI / 2 - 0.12;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.55;
  controls.target.set(0, 0, 0);

  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();
}

function setupLighting() {
  const ambient = new THREE.AmbientLight(0xffecd2, 0.62);
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight(0xfff4e0, 0x7da97d, 0.55);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff2d6, 0.9);
  sun.position.set(28, 38, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.width = 2048;
  sun.shadow.mapSize.height = 2048;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 120;
  sun.shadow.camera.left = -45;
  sun.shadow.camera.right = 45;
  sun.shadow.camera.top = 45;
  sun.shadow.camera.bottom = -45;
  sun.shadow.bias = -0.0005;
  scene.add(sun);

  const rim = new THREE.DirectionalLight(0xc2e3ff, 0.35);
  rim.position.set(-22, 14, -22);
  scene.add(rim);
}

function createEnvironment() {
  const islandGeo = new THREE.CylinderGeometry(24, 19, 4.5, 72, 5);
  const pos = islandGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const r = Math.sqrt(x * x + z * z);
    const angle = Math.atan2(z, x);
    const noise =
      Math.sin(angle * 3) * 1.3 +
      Math.cos(angle * 5 + 1) * 0.9 +
      Math.sin(r * 0.55) * 0.8 +
      Math.sin(angle * 7 + r * 0.3) * 0.35;
    let newY = y + noise;
    if (y > 0) newY += Math.max(0, (21 - r) * 0.16);
    if (r > 19) newY -= (r - 19) * 0.65;
    pos.setY(i, newY);
  }
  islandGeo.computeVertexNormals();

  const groundMat = new THREE.MeshToonMaterial({
    color: PALETTE.ground,
  });
  const island = new THREE.Mesh(islandGeo, groundMat);
  island.position.y = -2.6;
  island.receiveShadow = true;
  scene.add(island);

  const waterGeo = new THREE.CylinderGeometry(30, 24, 2.8, 64, 1);
  const waterMat = new THREE.MeshToonMaterial({
    color: PALETTE.water,
    transparent: true,
    opacity: 0.78,
  });
  waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.position.y = -5.2;
  scene.add(waterMesh);

  createPathNetwork();
  createRocks();
  createVegetation();
  createDockAndBoat();
  createBirds();

  for (let i = 0; i < 12; i++) {
    createCloud();
  }
}

function getTerrainHeight(x, z) {
  const r = Math.sqrt(x * x + z * z);
  const angle = Math.atan2(z, x);
  const noise =
    Math.sin(angle * 3) * 1.3 +
    Math.cos(angle * 5 + 1) * 0.9 +
    Math.sin(r * 0.55) * 0.8 +
    Math.sin(angle * 7 + r * 0.3) * 0.35;
  let y = -2.6 + noise;
  if (r < 21) y += Math.max(0, (21 - r) * 0.16);
  return y + 1.8;
}

function createPathNetwork() {
  const pathPoints = [
    new THREE.Vector3(-11, 0.35, -7),
    new THREE.Vector3(-7, 0.35, -4),
    new THREE.Vector3(-3, 0.35, -1),
    new THREE.Vector3(0, 0.55, 0),
    new THREE.Vector3(3, 0.35, 1),
    new THREE.Vector3(6, 0.35, 3),
    new THREE.Vector3(9, 0.35, -9),
    new THREE.Vector3(5, 0.35, -5),
    new THREE.Vector3(-7, 0.35, 9),
    new THREE.Vector3(-2, 0.35, 5),
    new THREE.Vector3(11, 0.35, 7),
    new THREE.Vector3(7, 0.35, 4),
  ];

  const segments = [
    [0, 1, 2, 3],
    [3, 4, 5, 10],
    [3, 9, 8],
    [3, 7, 6],
    [5, 11, 10],
  ];

  segments.forEach((indices) => {
    const points = indices.map((i) => pathPoints[i]);
    const curve = new THREE.CatmullRomCurve3(points);
    curve.curveType = "catmullrom";
    curve.tension = 0.45;
    const pathGeo = new THREE.TubeGeometry(curve, 48, 0.42, 10, false);
    const pathMat = new THREE.MeshToonMaterial({ color: PALETTE.path });
    const path = new THREE.Mesh(pathGeo, pathMat);
    path.receiveShadow = true;
    scene.add(path);

    // Stepping stones along the path
    for (let t = 0.1; t < 0.95; t += 0.18) {
      const point = curve.getPoint(t);
      const y = getTerrainHeight(point.x, point.z) - 0.05;
      const stone = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.28, 0.1, 7),
        new THREE.MeshToonMaterial({ color: 0xdcd0b0 })
      );
      stone.position.set(point.x, y, point.z);
      stone.rotation.y = Math.random() * Math.PI;
      stone.scale.setScalar(0.8 + Math.random() * 0.35);
      stone.receiveShadow = true;
      scene.add(stone);
    }
  });
}

function createRocks() {
  const rockMat = new THREE.MeshToonMaterial({ color: PALETTE.rock });
  const rockLightMat = new THREE.MeshToonMaterial({ color: PALETTE.rockLight });
  for (let i = 0; i < 26; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 18 + Math.random() * 7;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    const s = 0.5 + Math.random() * 1.1;
    const geo = new THREE.DodecahedronGeometry(0.6, 0);
    const rock = new THREE.Mesh(geo, Math.random() > 0.5 ? rockMat : rockLightMat);
    rock.position.set(x, -3.2 + Math.random() * 0.8, z);
    rock.scale.set(
      1 + Math.random() * 0.6,
      0.6 + Math.random() * 0.5,
      1 + Math.random() * 0.6
    );
    rock.scale.multiplyScalar(s);
    rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    rock.castShadow = true;
    rock.receiveShadow = true;
    scene.add(rock);
  }
}

function createVegetation() {
  for (let i = 0; i < 22; i++) {
    const angle = (i / 22) * Math.PI * 2 + Math.random() * 0.6;
    const r = 6 + Math.random() * 12;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    const s = 0.75 + Math.random() * 0.55;
    createTree(x, getTerrainHeight(x, z), z, s);
  }

  for (let i = 0; i < 35; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 5 + Math.random() * 13;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    createBush(x, getTerrainHeight(x, z), z, 0.6 + Math.random() * 0.6);
  }

  for (let i = 0; i < 60; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 4 + Math.random() * 14;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    createGrassTuft(x, getTerrainHeight(x, z), z);
  }

  for (let i = 0; i < 28; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 5 + Math.random() * 12;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    createFlower(x, getTerrainHeight(x, z), z);
  }

  for (let i = 0; i < 16; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 19 + Math.random() * 4;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    createReeds(x, -3.2 + Math.random() * 0.5, z);
  }
}

function createTree(x, y, z, scale) {
  const group = new THREE.Group();

  const trunkGeo = new THREE.CylinderGeometry(0.14, 0.22, 1.25, 8);
  const trunkMat = new THREE.MeshToonMaterial({ color: PALETTE.trunk });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 0.62;
  trunk.castShadow = true;
  group.add(trunk);

  const leavesGeo = new THREE.DodecahedronGeometry(0.82, 0);
  const leavesMat = new THREE.MeshToonMaterial({ color: PALETTE.leaves });
  const leaves = new THREE.Mesh(leavesGeo, leavesMat);
  leaves.position.y = 1.65;
  leaves.scale.set(1, 1.25, 1);
  leaves.castShadow = true;
  group.add(leaves);

  const leaves2 = leaves.clone();
  leaves2.position.y = 2.35;
  leaves2.scale.set(0.7, 0.9, 0.7);
  group.add(leaves2);

  group.position.set(x, y, z);
  group.scale.setScalar(scale);
  group.rotation.y = Math.random() * Math.PI;
  scene.add(group);
}

function createBush(x, y, z, scale) {
  const group = new THREE.Group();
  const mat = new THREE.MeshToonMaterial({ color: 0x6aa86a });
  const n = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i++) {
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.35, 0), mat);
    mesh.position.set(
      (Math.random() - 0.5) * 0.7,
      Math.random() * 0.3,
      (Math.random() - 0.5) * 0.7
    );
    mesh.scale.setScalar(0.7 + Math.random() * 0.5);
    mesh.castShadow = true;
    group.add(mesh);
  }
  group.position.set(x, y, z);
  group.scale.setScalar(scale);
  scene.add(group);
}

function createGrassTuft(x, y, z) {
  const group = new THREE.Group();
  const mat = new THREE.MeshToonMaterial({ color: 0x8dbf7a });
  const count = 3 + Math.floor(Math.random() * 4);
  for (let i = 0; i < count; i++) {
    const blade = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.35 + Math.random() * 0.25, 4), mat);
    blade.position.set(
      (Math.random() - 0.5) * 0.18,
      blade.geometry.parameters.height / 2,
      (Math.random() - 0.5) * 0.18
    );
    blade.rotation.z = (Math.random() - 0.5) * 0.35;
    blade.rotation.x = (Math.random() - 0.5) * 0.35;
    group.add(blade);
  }
  group.position.set(x, y, z);
  scene.add(group);
}

function createFlower(x, y, z) {
  const colors = [PALETTE.flowerRed, PALETTE.flowerYellow, PALETTE.flowerPurple];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const group = new THREE.Group();
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.25, 4),
    new THREE.MeshToonMaterial({ color: 0x7cb87c })
  );
  stem.position.y = 0.12;
  group.add(stem);
  const bloom = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 6, 6),
    new THREE.MeshToonMaterial({ color })
  );
  bloom.position.y = 0.26;
  group.add(bloom);
  group.position.set(x, y, z);
  group.scale.setScalar(0.8 + Math.random() * 0.4);
  scene.add(group);
}

function createReeds(x, y, z) {
  const group = new THREE.Group();
  const mat = new THREE.MeshToonMaterial({ color: PALETTE.reeds });
  for (let i = 0; i < 4 + Math.floor(Math.random() * 4); i++) {
    const reed = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.04, 0.8 + Math.random() * 0.6, 5),
      mat
    );
    reed.position.set(
      (Math.random() - 0.5) * 0.25,
      reed.geometry.parameters.height / 2,
      (Math.random() - 0.5) * 0.25
    );
    reed.rotation.z = (Math.random() - 0.5) * 0.25;
    group.add(reed);
  }
  group.position.set(x, y, z);
  scene.add(group);
}

function createDockAndBoat() {
  const dockGroup = new THREE.Group();
  const plankMat = new THREE.MeshToonMaterial({ color: PALETTE.wood });
  const postMat = new THREE.MeshToonMaterial({ color: PALETTE.woodDark });

  for (let i = 0; i < 6; i++) {
    const plank = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.08, 1.8),
      plankMat
    );
    plank.position.set(i * 0.5 - 1.25, 0, 0);
    plank.receiveShadow = true;
    dockGroup.add(plank);
  }

  for (let i = 0; i < 4; i++) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.4, 8), postMat);
    post.position.set(i * 0.7 - 1.05, -0.5, 0.65);
    dockGroup.add(post);
    const post2 = post.clone();
    post2.position.set(i * 0.7 - 1.05, -0.5, -0.65);
    dockGroup.add(post2);
  }

  dockGroup.position.set(17, -2.6, 12);
  dockGroup.rotation.y = -0.4;
  scene.add(dockGroup);

  // Boat
  const boatGroup = new THREE.Group();
  const hullMat = new THREE.MeshToonMaterial({ color: 0x8d5e3c });
  const hull = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.45, 3.2), hullMat);
  hull.position.y = 0.22;
  boatGroup.add(hull);

  const bow = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.2, 4), hullMat);
  bow.rotation.x = Math.PI / 2;
  bow.rotation.y = Math.PI / 4;
  bow.position.set(0, 0.22, 1.9);
  boatGroup.add(bow);

  const stern = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.2, 4), hullMat);
  stern.rotation.x = -Math.PI / 2;
  stern.rotation.y = Math.PI / 4;
  stern.position.set(0, 0.22, -1.9);
  boatGroup.add(stern);

  const sailMat = new THREE.MeshToonMaterial({ color: 0xfdf6e3, side: THREE.DoubleSide });
  const sail = new THREE.Mesh(new THREE.BufferGeometry(), sailMat);
  const sailShape = new THREE.Shape();
  sailShape.moveTo(0, 0);
  sailShape.lineTo(1.6, 0.8);
  sailShape.lineTo(0, 2.4);
  sailShape.lineTo(0, 0);
  sail.geometry = new THREE.ShapeGeometry(sailShape);
  sail.position.set(0.05, 0.5, 0);
  sail.castShadow = true;
  boatGroup.add(sail);

  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.6, 8), postMat);
  mast.position.set(0, 1.3, 0);
  boatGroup.add(mast);

  boatGroup.position.set(20, -3.1, 15);
  boatGroup.rotation.y = 0.6;
  boatGroup.userData = { bobOffset: Math.random() * Math.PI * 2 };
  scene.add(boatGroup);
  birds.push({ type: "boat", mesh: boatGroup });
}

function createBirds() {
  const birdMat = new THREE.MeshBasicMaterial({ color: 0xfffdf5 });
  for (let i = 0; i < 8; i++) {
    const bird = new THREE.Group();
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 4), birdMat);
    body.rotation.z = Math.PI / 2;
    bird.add(body);
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.04, 0.12), birdMat);
    wingL.position.set(-0.1, 0.05, 0.12);
    bird.add(wingL);
    const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.04, 0.12), birdMat);
    wingR.position.set(-0.1, 0.05, -0.12);
    bird.add(wingR);

    bird.position.set(
      (Math.random() - 0.5) * 50,
      18 + Math.random() * 10,
      (Math.random() - 0.5) * 40
    );
    bird.userData = {
      speed: 0.03 + Math.random() * 0.03,
      angle: Math.random() * Math.PI * 2,
      radius: 15 + Math.random() * 15,
      centerY: bird.position.y,
      wingSpeed: 8 + Math.random() * 6,
      wingOffset: Math.random() * Math.PI * 2,
      wings: [wingL, wingR],
    };
    scene.add(bird);
    birds.push({ type: "bird", mesh: bird });
  }
}

function createCloud() {
  const group = new THREE.Group();
  const geo = new THREE.SphereGeometry(1, 12, 10);
  const mat = new THREE.MeshToonMaterial({
    color: PALETTE.cloud,
    transparent: true,
    opacity: 0.92,
  });
  const nBlobs = 3 + Math.floor(Math.random() * 4);
  for (let i = 0; i < nBlobs; i++) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      (Math.random() - 0.5) * 2.5,
      (Math.random() - 0.5) * 0.6,
      (Math.random() - 0.5) * 1.5
    );
    const s = 0.7 + Math.random() * 0.8;
    mesh.scale.set(s, s * 0.7, s);
    group.add(mesh);
  }
  group.position.set(
    (Math.random() - 0.5) * 75,
    17 + Math.random() * 10,
    (Math.random() - 0.5) * 55 - 10
  );
  group.userData = {
    speed: 0.008 + Math.random() * 0.015,
    limit: 60,
  };
  scene.add(group);
  clouds.push(group);
}

function createBuildings() {
  const layouts = [
    { slug: "book-ingest", pos: new THREE.Vector3(-11, 0, -7), builder: buildLibrary },
    { slug: "focusor", pos: new THREE.Vector3(9, 0, -9), builder: buildLighthouse },
    { slug: "gridnote", pos: new THREE.Vector3(-7, 0, 9), builder: buildPavilion },
    { slug: "ai-stroke-writer", pos: new THREE.Vector3(11, 0, 7), builder: buildWorkshop },
    { slug: "apple-notes-webclipper", pos: new THREE.Vector3(0, 0.5, 0), builder: buildCottage },
  ];

  layouts.forEach((layout) => {
    const project = projects.find((p) => p.slug === layout.slug);
    if (!project) return;

    const y = getTerrainHeight(layout.pos.x, layout.pos.z);
    const group = layout.builder(project);
    group.position.set(layout.pos.x, y, layout.pos.z);
    group.userData = { project, originalY: y, hovered: false };
    scene.add(group);
    buildings.push(group);
  });
}

function addHitbox(group, width, height, depth, yCenter) {
  const hitbox = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hitbox.position.y = yCenter;
  hitbox.userData = { parentGroup: group };
  group.add(hitbox);
}

function createCanvasTexture(text, color, bgColor, width = 256, height = 128, rounded = false) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = bgColor;
  if (rounded) {
    const r = 18;
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, r);
    ctx.fill();
  } else {
    ctx.fillRect(0, 0, width, height);
  }

  // Border
  ctx.strokeStyle = color;
  ctx.lineWidth = 8;
  if (rounded) {
    const r = 14;
    ctx.beginPath();
    ctx.roundRect(6, 6, width - 12, height - 12, r);
    ctx.stroke();
  } else {
    ctx.strokeRect(6, 6, width - 12, height - 12);
  }

  // Text with subtle shadow for depth
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.25)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = color;
  ctx.font = `bold ${Math.floor(height * 0.48)}px 'PingFang SC', 'Microsoft YaHei', sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, width / 2, height / 2);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createWoodSign(text, accent) {
  const group = new THREE.Group();
  const postMat = new THREE.MeshToonMaterial({ color: PALETTE.woodDark });
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.1, 8), postMat);
  post.position.y = 1.05;
  group.add(post);

  const boardW = 2.4;
  const boardH = 0.95;
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(boardW, boardH, 0.14),
    new THREE.MeshToonMaterial({ color: PALETTE.wood })
  );
  board.position.y = 1.75;
  group.add(board);

  const tex = createCanvasTexture(text, "#5a3e25", "#f5e6c8", 320, 130, true);
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(boardW * 0.92, boardH * 0.86),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true })
  );
  label.position.set(0, 1.75, 0.08);
  group.add(label);

  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, boardW + 0.12, 8),
    postMat
  );
  cap.rotation.z = Math.PI / 2;
  cap.position.y = 1.75;
  group.add(cap);

  return group;
}

function createStoneTablet(text, accent) {
  const group = new THREE.Group();
  const stoneMat = new THREE.MeshToonMaterial({ color: 0x9e9e9e });
  const tablet = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 1.35, 0.28),
    stoneMat
  );
  tablet.position.y = 0.85;
  tablet.castShadow = true;
  group.add(tablet);

  const tex = createCanvasTexture(text, "#2a2a2a", "#d8d4c8", 320, 240, true);
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(1.55, 1.12),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true })
  );
  label.position.set(0, 0.85, 0.15);
  group.add(label);

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 0.45, 0.65),
    new THREE.MeshToonMaterial({ color: 0x8a8a8a })
  );
  base.position.y = 0.23;
  group.add(base);

  return group;
}

function createHangingBanner(text, accent) {
  const group = new THREE.Group();
  const poleMat = new THREE.MeshToonMaterial({ color: PALETTE.woodDark });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.8, 8), poleMat);
  pole.position.y = 1.4;
  group.add(pole);

  const bannerW = 1.5;
  const bannerH = 2.0;
  const bannerGeo = new THREE.PlaneGeometry(bannerW, bannerH, 4, 4);
  const pos = bannerGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    if (pos.getY(i) < -bannerH * 0.3) {
      const t = (pos.getY(i) + bannerH * 0.3) / (bannerH * 0.7);
      pos.setZ(i, Math.sin(t * Math.PI) * 0.15);
    }
  }
  bannerGeo.computeVertexNormals();

  const bannerMat = new THREE.MeshToonMaterial({
    color: lighten(accent, 0.4),
    side: THREE.DoubleSide,
  });
  const banner = new THREE.Mesh(bannerGeo, bannerMat);
  banner.position.set(0, 0.9, 0.18);
  group.add(banner);

  const tex = createCanvasTexture(text, "#fff", "rgba(255,255,255,0)", 260, 360, true);
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(bannerW * 0.85, bannerH * 0.8),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide })
  );
  label.position.set(0, 0.9, 0.2);
  group.add(label);

  const topBar = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, bannerW + 0.2, 8), poleMat);
  topBar.rotation.z = Math.PI / 2;
  topBar.position.set(0, 1.85, 0.18);
  group.add(topBar);

  return group;
}

function createToriiSign(text, accent) {
  const group = new THREE.Group();
  const redMat = new THREE.MeshToonMaterial({ color: lighten(accent, 0.2) });
  const postMat = new THREE.MeshToonMaterial({ color: 0x3a2e25 });

  const pillarL = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 3.0, 8), redMat);
  pillarL.position.set(-1.2, 1.5, 0);
  group.add(pillarL);
  const pillarR = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 3.0, 8), redMat);
  pillarR.position.set(1.2, 1.5, 0);
  group.add(pillarR);

  const topBar = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.22, 0.32), redMat);
  topBar.position.y = 2.85;
  group.add(topBar);

  const lintel = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.16, 0.26), postMat);
  lintel.position.y = 2.35;
  group.add(lintel);

  const tex = createCanvasTexture(text, "#fff", "#3a2e25", 300, 100, true);
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(1.9, 0.65),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true })
  );
  label.position.set(0, 2.35, 0.14);
  group.add(label);

  return group;
}

function buildLibrary(project) {
  const group = new THREE.Group();
  const accent = new THREE.Color(project.accent);

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 0.4, 4.2),
    new THREE.MeshToonMaterial({ color: 0xa8957d })
  );
  base.position.y = 0.2;
  base.receiveShadow = true;
  base.castShadow = true;
  group.add(base);

  const colors = [lighten(accent, 0.45), 0x8d7b68, 0xc4b49c, 0x6d5a48];
  for (let i = 0; i < 3; i++) {
    const w = 3.4 - i * 0.5;
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(w, 0.9, w),
      new THREE.MeshToonMaterial({ color: colors[i % colors.length] })
    );
    box.position.y = 0.8 + i * 0.9;
    box.castShadow = true;
    box.receiveShadow = true;
    group.add(box);

    const spine = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.08, 0.14, w + 0.08),
      new THREE.MeshToonMaterial({ color: 0xfff8e7 })
    );
    spine.position.y = box.position.y;
    group.add(spine);
  }

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(2.6, 1.6, 4),
    new THREE.MeshToonMaterial({ color: 0x7a6655 })
  );
  roof.position.y = 3.6;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  group.add(roof);

  const lantern = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.7, 0.5),
    new THREE.MeshToonMaterial({ color: 0xffe9a8, emissive: 0xffaa00, emissiveIntensity: 0.4 })
  );
  lantern.position.set(1.6, 0.8, 1.6);
  group.add(lantern);

  // Stone tablet sign in front
  const sign = createStoneTablet("阅读", project.accent);
  sign.position.set(3.0, 0, 2.8);
  sign.rotation.y = -Math.PI / 5;
  group.add(sign);

  // Scroll pile beside entrance
  for (let i = 0; i < 4; i++) {
    const scroll = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.5, 8),
      new THREE.MeshToonMaterial({ color: 0xfff8e7 })
    );
    scroll.rotation.z = Math.PI / 2;
    scroll.rotation.y = Math.random() * Math.PI;
    scroll.position.set(-2.2 + i * 0.25, 0.12, 2.1 + Math.random() * 0.3);
    group.add(scroll);
  }

  addHitbox(group, 4.5, 5, 4.5, 2.5);
  return group;
}

function buildLighthouse(project) {
  const group = new THREE.Group();
  const accent = new THREE.Color(project.accent);

  const rock = new THREE.Mesh(
    new THREE.CylinderGeometry(1.8, 2.2, 1.2, 8),
    new THREE.MeshToonMaterial({ color: 0x7a7a7a })
  );
  rock.position.y = 0.55;
  rock.castShadow = true;
  group.add(rock);

  const tower = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 1.4, 5.5, 16),
    new THREE.MeshToonMaterial({ color: 0xfff8ed })
  );
  tower.position.y = 3.2;
  tower.castShadow = true;
  tower.receiveShadow = true;
  group.add(tower);

  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(
      new THREE.CylinderGeometry(1.0 + i * 0.05, 1.05 + i * 0.05, 0.35, 16),
      new THREE.MeshToonMaterial({ color: lighten(accent, 0.35) })
    );
    ring.position.y = 1.6 + i * 1.5;
    group.add(ring);
  }

  const lampRoom = new THREE.Mesh(
    new THREE.CylinderGeometry(1.3, 1.3, 1.1, 8),
    new THREE.MeshToonMaterial({ color: 0x4a4a4a })
  );
  lampRoom.position.y = 6.5;
  group.add(lampRoom);

  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.5, 0.8, 8),
    new THREE.MeshToonMaterial({ color: 0xffe9a8, emissive: 0xffaa00, emissiveIntensity: 0.8 })
  );
  core.position.y = 6.5;
  group.add(core);

  const point = new THREE.PointLight(0xffaa00, 1.2, 18);
  point.position.y = 6.5;
  group.add(point);

  const beamGroup = new THREE.Group();
  beamGroup.position.y = 6.5;
  const beamGeo = new THREE.ConeGeometry(0.6, 12, 32, 1, true);
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xffe9a8,
    transparent: true,
    opacity: 0.15,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.rotation.x = Math.PI / 2;
  beam.position.z = 6;
  beamGroup.add(beam);
  group.add(beamGroup);
  beaconBeam = beamGroup;

  const cap = new THREE.Mesh(
    new THREE.ConeGeometry(1.5, 1, 8),
    new THREE.MeshToonMaterial({ color: 0x3a3a3a })
  );
  cap.position.y = 7.4;
  group.add(cap);

  // Lighthouse name plate
  const sign = createWoodSign("指引", project.accent);
  sign.position.set(-2.8, 0, 1.8);
  sign.rotation.y = Math.PI / 3;
  group.add(sign);

  // Buoys around the lighthouse
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const buoy = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 10, 10),
      new THREE.MeshToonMaterial({ color: lighten(accent, 0.25) })
    );
    buoy.position.set(Math.cos(angle) * 3.5, -0.3, Math.sin(angle) * 3.5);
    buoy.userData = { bobOffset: i * 2 };
    group.add(buoy);
  }

  addHitbox(group, 3.4, 8, 3.4, 4);
  return group;
}

function buildPavilion(project) {
  const group = new THREE.Group();
  const accent = new THREE.Color(project.accent);

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(4.4, 0.35, 4.4),
    new THREE.MeshToonMaterial({ color: 0x8d7b68 })
  );
  base.position.y = 0.18;
  base.receiveShadow = true;
  group.add(base);

  const grid = new THREE.Mesh(
    new THREE.PlaneGeometry(3.8, 3.8),
    new THREE.MeshToonMaterial({ color: 0xd9cbb6 })
  );
  grid.rotation.x = -Math.PI / 2;
  grid.position.y = 0.38;
  group.add(grid);

  // Grid lines on the floor
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xb0a08a });
  for (let i = 0; i <= 6; i++) {
    const x = -1.9 + (i / 6) * 3.8;
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 3.8), lineMat);
    line.position.set(x, 0.39, 0);
    group.add(line);
    const z = -1.9 + (i / 6) * 3.8;
    const lineZ = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.02, 0.04), lineMat);
    lineZ.position.set(0, 0.39, z);
    group.add(lineZ);
  }

  const colMat = new THREE.MeshToonMaterial({ color: 0xb87272 });
  for (let i = 0; i < 4; i++) {
    const col = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 2.8, 8),
      colMat
    );
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
    col.position.set(Math.cos(angle) * 1.6, 1.6, Math.sin(angle) * 1.6);
    col.castShadow = true;
    group.add(col);
  }

  for (let i = 0; i < 2; i++) {
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(2.8 - i * 0.6, 0.9, 4),
      new THREE.MeshToonMaterial({ color: i === 0 ? 0x6e6e6e : lighten(accent, 0.35) })
    );
    roof.position.y = 3.2 + i * 0.55;
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(1, 0.6, 1);
    roof.castShadow = true;
    group.add(roof);
  }

  const scroll = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 1.4, 8),
    new THREE.MeshToonMaterial({ color: 0xfff8e7 })
  );
  scroll.rotation.z = Math.PI / 2;
  scroll.position.y = 1.0;
  group.add(scroll);

  // Torii-style sign at the front
  const sign = createToriiSign("格字", project.accent);
  sign.position.set(0, 0, 3.8);
  group.add(sign);

  // Practice tablets leaning nearby
  for (let i = 0; i < 3; i++) {
    const tablet = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.75, 0.06),
      new THREE.MeshToonMaterial({ color: 0xfff8e7 })
    );
    tablet.position.set(-2.8 + i * 0.7, 0.4, 2.3);
    tablet.rotation.z = -0.1 - i * 0.05;
    tablet.rotation.y = 0.15;
    group.add(tablet);
  }

  addHitbox(group, 4.8, 4.5, 4.8, 2.25);
  return group;
}

function buildWorkshop(project) {
  const group = new THREE.Group();
  const accent = new THREE.Color(project.accent);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(1.6, 1.8, 1, 6),
    new THREE.MeshToonMaterial({ color: 0x6b7b8d })
  );
  base.position.y = 0.5;
  base.receiveShadow = true;
  base.castShadow = true;
  group.add(base);

  const tower = new THREE.Mesh(
    new THREE.CylinderGeometry(1.1, 1.5, 4.5, 6),
    new THREE.MeshToonMaterial({ color: lighten(accent, 0.5), transparent: true, opacity: 0.92 })
  );
  tower.position.y = 3;
  tower.castShadow = true;
  group.add(tower);

  for (let i = 0; i < 3; i++) {
    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(1.15 + i * 0.05, 1.15 + i * 0.05, 0.18, 6),
      new THREE.MeshToonMaterial({ color: 0xffe9a8, emissive: 0xffaa00, emissiveIntensity: 0.4 })
    );
    band.position.y = 1.5 + i * 1.3;
    group.add(band);
  }

  const nib = new THREE.Mesh(
    new THREE.ConeGeometry(0.4, 1.8, 6),
    new THREE.MeshToonMaterial({ color: 0xfff8e7, emissive: 0xffffff, emissiveIntensity: 0.15 })
  );
  nib.position.y = 6.1;
  group.add(nib);

  for (let i = 0; i < 4; i++) {
    const bit = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.22, 0),
      new THREE.MeshToonMaterial({ color: 0xa8d8ff, emissive: 0x4488ff, emissiveIntensity: 0.25 })
    );
    const angle = (i / 4) * Math.PI * 2;
    bit.position.set(Math.cos(angle) * 1.9, 2.5 + Math.sin(Date.now() * 0.001 + i) * 0.2, Math.sin(angle) * 1.9);
    bit.userData = { orbitAngle: angle, orbitSpeed: 0.005 + i * 0.002, orbitY: bit.position.y };
    group.add(bit);
  }

  // Hanging banner sign
  const sign = createHangingBanner("笔画", project.accent);
  sign.position.set(-3.0, 0, -0.8);
  sign.rotation.y = Math.PI / 6;
  group.add(sign);

  // Ink drops / glowing stones
  for (let i = 0; i < 6; i++) {
    const drop = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 8, 8),
      new THREE.MeshToonMaterial({ color: 0x2a2a2a })
    );
    drop.position.set(
      2.0 + Math.random() * 1.0,
      0.1 + Math.random() * 0.15,
      -1.0 + Math.random() * 1.5
    );
    drop.scale.set(1, 0.5, 1);
    group.add(drop);
  }

  addHitbox(group, 3.6, 7, 3.6, 3.5);
  return group;
}

function buildCottage(project) {
  const group = new THREE.Group();
  const accent = new THREE.Color(project.accent);

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 2.2, 2.8),
    new THREE.MeshToonMaterial({ color: 0xf5f0e6 })
  );
  base.position.y = 1.1;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(2.6, 1.5, 4),
    new THREE.MeshToonMaterial({ color: 0x8d7b68 })
  );
  roof.position.y = 2.9;
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(1, 0.7, 1);
  roof.castShadow = true;
  group.add(roof);

  // Note-paper roof lines
  for (let i = 0; i < 3; i++) {
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(2.8, 0.06, 0.08),
      new THREE.MeshToonMaterial({ color: 0x4a4a4a })
    );
    line.position.set(0, 2.6 + i * 0.18, 1.45 - i * 0.05);
    group.add(line);
  }

  const door = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 1.3, 0.1),
    new THREE.MeshToonMaterial({ color: 0x6b4c35 })
  );
  door.position.set(0, 0.75, 1.42);
  group.add(door);

  const windowFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.9, 0.1),
    new THREE.MeshToonMaterial({ color: 0x8d7b68 })
  );
  windowFrame.position.set(0.9, 1.4, 1.42);
  group.add(windowFrame);

  const windowGlass = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.7, 0.12),
    new THREE.MeshToonMaterial({ color: 0xffe9a8, emissive: 0xffaa00, emissiveIntensity: 0.3 })
  );
  windowGlass.position.set(0.9, 1.4, 1.42);
  group.add(windowGlass);

  // Chimney
  const chimney = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 1.0, 0.4),
    new THREE.MeshToonMaterial({ color: 0x7a5c47 })
  );
  chimney.position.set(-1.0, 2.6, -0.6);
  group.add(chimney);

  // Apple tree (group-local)
  const treeGroup = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.18, 1.0, 8),
    new THREE.MeshToonMaterial({ color: PALETTE.trunk })
  );
  trunk.position.y = 0.5;
  trunk.castShadow = true;
  treeGroup.add(trunk);

  const foliage = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.7, 0),
    new THREE.MeshToonMaterial({ color: PALETTE.leaves })
  );
  foliage.position.y = 1.35;
  foliage.scale.set(1, 1.2, 1);
  foliage.castShadow = true;
  treeGroup.add(foliage);
  treeGroup.position.set(2.2, 0, 1.2);
  treeGroup.scale.setScalar(0.85);
  group.add(treeGroup);

  // Apples
  const appleMat = new THREE.MeshToonMaterial({ color: 0xd65a5a });
  for (let i = 0; i < 4; i++) {
    const apple = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), appleMat);
    apple.position.set(
      2.2 + (Math.random() - 0.5) * 0.9,
      1.3 + Math.random() * 0.5,
      1.2 + (Math.random() - 0.5) * 0.7
    );
    group.add(apple);
  }

  // Mailbox / sign
  const sign = createWoodSign("备忘", project.accent);
  sign.position.set(-2.6, 0, 2.0);
  sign.rotation.y = Math.PI / 4;
  group.add(sign);

  // Envelopes on the path
  for (let i = 0; i < 3; i++) {
    const envelope = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.04, 0.25),
      new THREE.MeshToonMaterial({ color: 0xffffff })
    );
    envelope.position.set(-1.2 + i * 0.3, 0.06, 2.4 + Math.random() * 0.2);
    envelope.rotation.y = Math.random() * 0.3;
    group.add(envelope);
  }

  addHitbox(group, 4.0, 4.0, 4.0, 2);
  return group;
}

function setupInteractions() {
  window.addEventListener("resize", onWindowResize);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerdown", onPointerDown);

  renderer.domElement.addEventListener("touchstart", () => {}, { passive: true });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onPointerMove(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

  updateTooltipPosition(event.clientX, event.clientY);
}

function updateTooltipPosition(x, y) {
  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
}

function onPointerDown(event) {
  if (hoveredBuilding) {
    selectBuilding(hoveredBuilding);
  } else if (!event.target.closest(".project-panel") && !event.target.closest(".map-controls") && !event.target.closest(".back-link")) {
    closePanel();
  }
}

function getBuildingFromHit(object) {
  let curr = object;
  while (curr) {
    if (curr.userData && curr.userData.project) return curr;
    if (curr.userData && curr.userData.parentGroup) return curr.userData.parentGroup;
    curr = curr.parent;
  }
  return null;
}

function setupUI() {
  document.getElementById("reset-view").addEventListener("click", () => {
    controls.reset();
    camera.position.set(0, 26, 46);
    controls.target.set(0, 0, 0);
  });

  document.getElementById("toggle-rotation").addEventListener("click", (e) => {
    autoRotate = !autoRotate;
    controls.autoRotate = autoRotate;
    e.currentTarget.textContent = autoRotate ? "暂停旋转" : "继续旋转";
  });

  document.getElementById("close-panel").addEventListener("click", closePanel);

  // Close panel on Escape
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePanel();
  });
}

function selectBuilding(group) {
  selectedBuilding = group;
  const project = group.userData.project;
  fillPanel(project);
  panel.classList.add("open");
  panel.setAttribute("aria-hidden", "false");

  // Nudge camera toward building without fully losing orbit
  const target = new THREE.Vector3(group.position.x, group.position.y + 2, group.position.z);
  controls.target.lerp(target, 0.3);
}

function fillPanel(project) {
  document.getElementById("panel-image").src = project.thumbnailUrl;
  document.getElementById("panel-image").alt = project.name;
  document.getElementById("panel-kicker").textContent = project.reelKicker;
  document.getElementById("panel-kicker").style.backgroundColor = project.accent;
  document.getElementById("panel-title").textContent = project.name;
  document.getElementById("panel-tagline").textContent = project.tagline;
  document.getElementById("panel-summary").textContent = project.summary;

  const stepsList = document.getElementById("panel-steps");
  stepsList.innerHTML = "";
  project.clipSteps.forEach((step) => {
    const li = document.createElement("li");
    li.textContent = step;
    stepsList.appendChild(li);
  });

  const link = document.getElementById("panel-link");
  link.href = `/#${project.slug}`;
  link.style.backgroundColor = project.accent;
  link.style.boxShadow = `0 4px 16px ${project.accent}55`;
}

function closePanel() {
  panel.classList.remove("open");
  panel.setAttribute("aria-hidden", "true");
  selectedBuilding = null;
}

function animate() {
  requestAnimationFrame(animate);

  const time = Date.now() * 0.001;

  controls.update();

  if (beaconBeam) {
    beaconBeam.rotation.y += 0.015;
  }

  if (waterMesh) {
    waterMesh.position.y = -5.2 + Math.sin(time * 0.6) * 0.08;
    waterMesh.scale.set(1 + Math.sin(time * 0.4) * 0.005, 1, 1 + Math.cos(time * 0.4) * 0.005);
  }

  clouds.forEach((cloud) => {
    cloud.position.x += cloud.userData.speed;
    if (cloud.position.x > cloud.userData.limit) {
      cloud.position.x = -cloud.userData.limit;
    }
  });

  birds.forEach((entry) => {
    if (entry.type === "boat") {
      entry.mesh.position.y = -3.1 + Math.sin(time * 0.8 + entry.mesh.userData.bobOffset) * 0.12;
      entry.mesh.rotation.z = Math.sin(time * 0.5 + entry.mesh.userData.bobOffset) * 0.04;
    } else if (entry.type === "bird") {
      const bird = entry.mesh;
      const data = bird.userData;
      data.angle += data.speed * 0.02;
      bird.position.x = Math.cos(data.angle) * data.radius;
      bird.position.z = Math.sin(data.angle) * data.radius;
      bird.position.y = data.centerY + Math.sin(time * 0.7 + data.wingOffset) * 0.6;
      bird.rotation.y = -data.angle;
      const flap = Math.sin(time * data.wingSpeed + data.wingOffset) * 0.35;
      data.wings[0].rotation.z = flap;
      data.wings[1].rotation.z = -flap;
    }
  });

  // Buoys bobbing inside lighthouse group
  buildings.forEach((group) => {
    if (group.userData.project.slug === "focusor") {
      group.children.forEach((child) => {
        if (child.userData.bobOffset !== undefined) {
          child.position.y = -0.3 + Math.sin(time * 1.2 + child.userData.bobOffset) * 0.12;
        }
      });
    }
  });

  buildings.forEach((group) => {
    if (group.userData.targetScale !== undefined) {
      const s = THREE.MathUtils.lerp(group.scale.x, group.userData.targetScale, 0.12);
      group.scale.setScalar(s);
    }
    if (group.userData.targetY !== undefined) {
      group.position.y = THREE.MathUtils.lerp(group.position.y, group.userData.targetY, 0.12);
    }

    if (group.userData.project.slug === "ai-stroke-writer") {
      group.children.forEach((child) => {
        if (child.userData.orbitAngle !== undefined) {
          child.userData.orbitAngle += child.userData.orbitSpeed;
          child.position.x = Math.cos(child.userData.orbitAngle) * 1.9;
          child.position.z = Math.sin(child.userData.orbitAngle) * 1.9;
          child.position.y = child.userData.orbitY + Math.sin(time * 2 + child.userData.orbitAngle) * 0.15;
        }
      });
    }
  });

  updateRaycaster();
  renderer.render(scene, camera);
}

function updateRaycaster() {
  raycaster.setFromCamera(pointer, camera);

  const hitboxes = [];
  buildings.forEach((group) => {
    group.traverse((child) => {
      if (child.userData && child.userData.parentGroup) {
        hitboxes.push(child);
      }
    });
  });

  const intersects = raycaster.intersectObjects(hitboxes, false);
  const hitGroup = intersects.length > 0 ? getBuildingFromHit(intersects[0].object) : null;

  if (hitGroup !== hoveredBuilding) {
    if (hoveredBuilding) {
      hoveredBuilding.userData.hovered = false;
      animateBuilding(hoveredBuilding, false);
    }
    hoveredBuilding = hitGroup;
    if (hoveredBuilding) {
      hoveredBuilding.userData.hovered = true;
      animateBuilding(hoveredBuilding, true);
      tooltip.textContent = hoveredBuilding.userData.project.name;
      tooltip.classList.add("visible");
      document.body.style.cursor = "pointer";
    } else {
      tooltip.classList.remove("visible");
      document.body.style.cursor = "default";
    }
  }
}

function animateBuilding(group, hovered) {
  group.userData.targetScale = hovered ? 1.08 : 1.0;
  group.userData.targetY = group.userData.originalY + (hovered ? 0.4 : 0);
}

init();

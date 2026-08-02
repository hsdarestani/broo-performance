const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

const theme = document.createElement('link');
theme.rel = 'stylesheet';
theme.href = 'brand-theme.css';
document.head.appendChild(theme);

function installOfficialBrand() {
  $$('.brand').forEach((brand) => {
    const img = document.createElement('img');
    img.src = 'assets/broo-logo.svg';
    img.alt = 'BROO Performance';
    img.decoding = 'async';
    brand.replaceChildren(img);
  });
  const preloaderMark = $('.preloader-mark');
  if (preloaderMark) {
    const img = document.createElement('img');
    img.src = 'assets/broo-logo.svg';
    img.alt = 'BROO Performance';
    img.decoding = 'async';
    preloaderMark.replaceChildren(img);
  }
}
installOfficialBrand();

const preloader = $('[data-preloader]');
const loadBar = $('[data-load-bar]');
const loadValue = $('[data-load-value]');
let loadProgress = 0;
const loadTimer = setInterval(() => {
  loadProgress = Math.min(loadProgress + Math.ceil(Math.random() * 9), 91);
  if (loadBar) loadBar.style.width = `${loadProgress}%`;
  if (loadValue) loadValue.textContent = `${loadProgress}%`;
}, 120);

function finishLoading() {
  clearInterval(loadTimer);
  if (loadBar) loadBar.style.width = '100%';
  if (loadValue) loadValue.textContent = '100%';
  setTimeout(() => preloader?.classList.add('done'), 280);
}

const chapters = $$('.chapter');
const navButtons = $$('.scene-nav button');
const progress = $('[data-progress]');
const sceneCurrent = $('[data-scene-current]');
const scrollLabel = $('[data-scroll-label]');
const systemLabel = $('[data-system-label]');
const hudX = $('[data-hud-x]');
const hudY = $('[data-hud-y]');
const fpsEl = $('[data-fps]');
const labels = ['IGNITION', 'SOFTWARE', 'POWER', 'HARDWARE', 'DYNO', 'CONTACT'];
const systemLabels = [
  'ECU LINK // ONLINE',
  'CALIBRATION // ACTIVE',
  'BOOST CONTROL // ARMED',
  'HARDWARE MAP // SYNC',
  'DYNO DATA // VERIFIED',
  'PROJECT CHANNEL // OPEN'
];

let active = 0;
let targetScene = 0;
let lastChange = 0;
let touchStartY = 0;
let soundEnabled = false;
let audioCtx = null;

function ping(frequency = 220) {
  if (!soundEnabled) return;
  try {
    audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.025, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.11);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.12);
  } catch (_) {}
}

function animateCounters(scope) {
  if (!scope) return;
  $$('[data-counter]', scope).forEach((element) => {
    const end = Number(element.dataset.counter);
    const decimal = String(end).includes('.');
    const start = performance.now();
    const run = (time) => {
      const ratio = Math.min((time - start) / 900, 1);
      const value = end * (1 - Math.pow(1 - ratio, 3));
      element.textContent = decimal ? value.toFixed(1) : Math.round(value);
      if (ratio < 1) requestAnimationFrame(run);
    };
    requestAnimationFrame(run);
  });
}

function setScene(index, force = false) {
  index = Math.max(0, Math.min(chapters.length - 1, index));
  if (index === active && !force) return;
  active = index;
  targetScene = index;
  chapters.forEach((element, i) => element.classList.toggle('active', i === index));
  navButtons.forEach((element, i) => element.classList.toggle('active', i === index));
  if (progress) progress.style.width = `${index / Math.max(chapters.length - 1, 1) * 100}%`;
  if (sceneCurrent) sceneCurrent.textContent = String(index + 1).padStart(2, '0');
  if (scrollLabel) scrollLabel.textContent = labels[index];
  if (systemLabel) systemLabel.textContent = systemLabels[index];
  document.body.dataset.scene = String(index);
  animateCounters(chapters[index]);
  ping(180 + index * 46);
}

function step(direction) {
  const now = performance.now();
  if (now - lastChange < 620) return;
  lastChange = now;
  setScene(active + direction);
}

window.addEventListener('wheel', (event) => {
  event.preventDefault();
  if (Math.abs(event.deltaY) > 8) step(event.deltaY > 0 ? 1 : -1);
}, { passive: false });
window.addEventListener('touchstart', (event) => {
  touchStartY = event.touches[0].clientY;
}, { passive: true });
window.addEventListener('touchend', (event) => {
  const delta = touchStartY - event.changedTouches[0].clientY;
  if (Math.abs(delta) > 42) step(delta > 0 ? 1 : -1);
}, { passive: true });
window.addEventListener('keydown', (event) => {
  if (['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(event.key)) {
    event.preventDefault();
    step(1);
  }
  if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(event.key)) {
    event.preventDefault();
    step(-1);
  }
  if (event.key === 'Home') setScene(0);
  if (event.key === 'End') setScene(chapters.length - 1);
});
$$('[data-go]').forEach((element) => element.addEventListener('click', (event) => {
  event.preventDefault();
  setScene(Number(element.dataset.go));
}));

const soundButton = $('[data-sound]');
soundButton?.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  soundButton.classList.toggle('on', soundEnabled);
  soundButton.setAttribute('aria-pressed', String(soundEnabled));
  const textNode = [...soundButton.childNodes].find((node) => node.nodeType === Node.TEXT_NODE);
  if (textNode) textNode.textContent = soundEnabled ? ' SOUND ON' : ' SOUND OFF';
  ping(330);
});

$('[data-mail-form]')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const subject = 'Fahrzeuganfrage über BROO 3D Experience';
  const body = `Hallo BROO Performance,\n\nich interessiere mich für eine Fahrzeugoptimierung.\n\nMarke / Modell: ${data.get('vehicle')}\nBaujahr / Motor: ${data.get('engine')}\nSerienleistung: ${data.get('power') || '-'}\n\nBitte senden Sie mir eine erste Einschätzung.\n`;
  location.href = `mailto:info@broo-performance.de?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});

setScene(0, true);

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = matchMedia('(max-width: 900px)').matches;
const canvas = $('[data-canvas]');

import('https://cdn.jsdelivr.net/npm/three@0.167.1/build/three.module.js')
  .then((THREE) => init3D(THREE))
  .catch(() => {
    document.body.classList.add('no-webgl');
    finishLoading();
  });

function init3D(THREE) {
  const ACCENT = 0xe10600;
  const ACCENT_DARK = 0x690000;
  const GRAPHITE = 0x151515;
  const SILVER = 0xbfc2c4;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !isMobile,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.35 : 1.8));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = !isMobile;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050505, 0.036);
  const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 150);
  camera.position.set(7, 3.2, 10);

  const ambient = new THREE.HemisphereLight(0xd5d5d5, 0x090909, 1.22);
  scene.add(ambient);
  const key = new THREE.DirectionalLight(0xffffff, 3.3);
  key.position.set(4, 8, 4);
  key.castShadow = !isMobile;
  scene.add(key);
  const rim = new THREE.PointLight(ACCENT, 48, 27, 2);
  rim.position.set(-4, 2, -2);
  scene.add(rim);
  const silverLight = new THREE.PointLight(SILVER, 14, 20, 2);
  silverLight.position.set(4, 0.5, -4);
  scene.add(silverLight);

  const root = new THREE.Group();
  scene.add(root);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(90, 90),
    new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.76, metalness: 0.34, transparent: true, opacity: 0.94 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.22;
  floor.receiveShadow = true;
  scene.add(floor);

  const grid = new THREE.GridHelper(80, 80, 0x8a0000, 0x292929);
  grid.position.y = -1.2;
  grid.material.transparent = true;
  grid.material.opacity = 0.4;
  scene.add(grid);

  const rings = new THREE.Group();
  for (let i = 0; i < 9; i += 1) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(5.4 + i * 0.36, 0.012, 5, 100),
      new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.24 - i * 0.014 })
    );
    ring.rotation.y = Math.PI / 2;
    ring.position.z = -i * 3.8 - 4;
    rings.add(ring);
  }
  scene.add(rings);

  const particlesGeometry = new THREE.BufferGeometry();
  const count = isMobile ? 450 : 950;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 45;
    positions[i * 3 + 1] = (Math.random() - 0.25) * 20;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 65;
  }
  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(
    particlesGeometry,
    new THREE.PointsMaterial({ color: 0xc8c8c8, size: 0.025, transparent: true, opacity: 0.38 })
  );
  scene.add(particles);

  const bodyMaterial = new THREE.MeshPhysicalMaterial({
    color: GRAPHITE,
    metalness: 0.92,
    roughness: 0.18,
    clearcoat: 1,
    clearcoatRoughness: 0.1
  });
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x25282b,
    metalness: 0.4,
    roughness: 0.08,
    transmission: 0.14,
    transparent: true,
    opacity: 0.8
  });
  const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x050505, metalness: 0.88, roughness: 0.28 });
  const accentMaterial = new THREE.MeshStandardMaterial({
    color: ACCENT,
    emissive: ACCENT_DARK,
    emissiveIntensity: 1.85,
    metalness: 0.62,
    roughness: 0.28
  });
  const silverMaterial = new THREE.MeshStandardMaterial({ color: SILVER, metalness: 0.9, roughness: 0.2 });

  const car = new THREE.Group();
  root.add(car);
  const body = new THREE.Mesh(new THREE.BoxGeometry(5.7, 0.78, 2.45), bodyMaterial);
  body.position.y = -0.08;
  body.castShadow = true;
  car.add(body);
  const hood = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.22, 2.28), bodyMaterial);
  hood.position.set(1.68, 0.43, 0);
  hood.rotation.z = -0.04;
  car.add(hood);
  const rear = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.28, 2.34), bodyMaterial);
  rear.position.set(-2.05, 0.38, 0);
  car.add(rear);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.86, 1.95), glassMaterial);
  cabin.position.set(-0.35, 0.7, 0);
  cabin.rotation.z = -0.06;
  car.add(cabin);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.12, 1.84), bodyMaterial);
  roof.position.set(-0.52, 1.16, 0);
  car.add(roof);
  const frontLip = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.18, 2.5), darkMaterial);
  frontLip.position.set(3.02, -0.34, 0);
  car.add(frontLip);
  const spoilerBar = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.55, 1.8), darkMaterial);
  spoilerBar.position.set(-2.82, 0.68, 0);
  car.add(spoilerBar);
  const spoilerWing = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.09, 2.28), darkMaterial);
  spoilerWing.position.set(-2.9, 0.98, 0);
  car.add(spoilerWing);

  const wheels = [];
  for (const x of [-1.85, 1.78]) {
    for (const z of [-1.23, 1.23]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.38, 32), darkMaterial);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(x, -0.48, z);
      wheel.castShadow = true;
      const rimMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.4, 12), silverMaterial);
      rimMesh.rotation.x = Math.PI / 2;
      wheel.add(rimMesh);
      car.add(wheel);
      wheels.push(wheel);
    }
  }
  for (const z of [-0.72, 0.72]) {
    const headlight = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.55), accentMaterial);
    headlight.position.set(3.08, 0.12, z);
    car.add(headlight);
  }
  car.rotation.y = -0.52;
  car.position.set(1.2, 0.05, 0);
  car.scale.setScalar(0.95);

  const ecu = new THREE.Group();
  root.add(ecu);
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(4.5, 0.16, 3.2),
    new THREE.MeshStandardMaterial({ color: 0x151515, metalness: 0.5, roughness: 0.5, transparent: true, opacity: 0.97 })
  );
  ecu.add(board);
  const chip = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.34, 1.45), darkMaterial);
  chip.position.y = 0.25;
  ecu.add(chip);
  const chipTop = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.02, 1.05), accentMaterial);
  chipTop.position.y = 0.44;
  ecu.add(chipTop);
  for (let i = 0; i < 12; i += 1) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.65 + Math.random() * 1.3, 0.018, 0.025), accentMaterial);
    line.position.set((Math.random() - 0.5) * 3.6, 0.11, (Math.random() - 0.5) * 2.5);
    line.rotation.y = Math.random() > 0.5 ? 0 : Math.PI / 2;
    ecu.add(line);
  }
  ecu.rotation.set(-0.5, -0.15, 0.18);
  ecu.position.set(1.2, 0.5, 0);
  ecu.visible = false;

  const turbo = new THREE.Group();
  root.add(turbo);
  const shell = new THREE.Mesh(
    new THREE.TorusGeometry(1.55, 0.5, 28, 70),
    new THREE.MeshPhysicalMaterial({ color: 0x454545, metalness: 1, roughness: 0.2 })
  );
  turbo.add(shell);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.55, 28), darkMaterial);
  hub.rotation.x = Math.PI / 2;
  turbo.add(hub);
  for (let i = 0; i < 10; i += 1) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.06, 0.28), accentMaterial);
    blade.position.x = 0.72;
    blade.rotation.y = i / 10 * Math.PI * 2;
    blade.rotateZ(0.35);
    turbo.add(blade);
  }
  turbo.position.set(1.35, 0.5, 0);
  turbo.rotation.set(0.2, 0.5, 0.2);
  turbo.visible = false;

  const dyno = new THREE.Group();
  root.add(dyno);
  for (const x of [-1.7, 1.7]) {
    for (const z of [-1.05, 1.05]) {
      const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 1.35, 32), darkMaterial);
      roller.rotation.x = Math.PI / 2;
      roller.position.set(x, -0.78, z);
      dyno.add(roller);
    }
  }
  const dynoLine = new THREE.Mesh(
    new THREE.BoxGeometry(6.5, 0.04, 3.5),
    new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.33, wireframe: true })
  );
  dynoLine.position.y = -1;
  dyno.add(dynoLine);
  dyno.visible = false;

  const scan = new THREE.Mesh(
    new THREE.PlaneGeometry(7, 3.8),
    new THREE.MeshBasicMaterial({
      color: ACCENT,
      transparent: true,
      opacity: 0.09,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    })
  );
  scan.rotation.y = Math.PI / 2;
  scan.position.x = -3.5;
  car.add(scan);

  const configs = [
    { cam: [7, 3.2, 10], look: [0.5, 0.2, 0], car: [1.2, 0.05, 0], rot: [0, -0.52, 0], scale: 0.95, obj: 'car' },
    { cam: [6.4, 3.8, 8.4], look: [0.8, 0.3, 0], car: [4, -1, -2], rot: [0, -1.2, 0], scale: 0.55, obj: 'ecu' },
    { cam: [7.5, 2.6, 8], look: [1, 0.2, 0], car: [4, -1, -2], rot: [0, -0.4, 0], scale: 0.6, obj: 'turbo' },
    { cam: [6.8, 2.4, 9.2], look: [0.7, 0.2, 0], car: [1.3, 0.1, 0], rot: [0, -0.2, 0], scale: 0.88, obj: 'car' },
    { cam: [7.8, 3.6, 10.6], look: [0.5, -0.1, 0], car: [0.9, 0.05, 0], rot: [0, -0.62, 0], scale: 0.82, obj: 'dyno' },
    { cam: [5.5, 2.8, 11.5], look: [0, 0.1, 0], car: [2.7, 0, -1.4], rot: [0, -0.95, 0], scale: 0.72, obj: 'car' }
  ];

  let mouseX = 0;
  let mouseY = 0;
  let frames = 0;
  let fpsTime = performance.now();
  const lookAt = new THREE.Vector3();
  addEventListener('pointermove', (event) => {
    mouseX = (event.clientX / innerWidth - 0.5) * 2;
    mouseY = (event.clientY / innerHeight - 0.5) * 2;
  }, { passive: true });

  const clock = new THREE.Clock();
  function render(now) {
    requestAnimationFrame(render);
    const delta = Math.min(clock.getDelta(), 0.04);
    const time = clock.elapsedTime;
    const config = configs[targetScene];
    const ease = reduced ? 1 : 1 - Math.pow(0.0008, delta);

    camera.position.x += (config.cam[0] + mouseX * 0.22 - camera.position.x) * ease;
    camera.position.y += (config.cam[1] - mouseY * 0.12 - camera.position.y) * ease;
    camera.position.z += (config.cam[2] - camera.position.z) * ease;
    lookAt.set(config.look[0], config.look[1], config.look[2]);
    camera.lookAt(lookAt);

    car.position.x += (config.car[0] - car.position.x) * ease;
    car.position.y += (config.car[1] - car.position.y) * ease;
    car.position.z += (config.car[2] - car.position.z) * ease;
    car.rotation.x += (config.rot[0] - car.rotation.x) * ease;
    car.rotation.y += (config.rot[1] - car.rotation.y) * ease;
    car.rotation.z += (config.rot[2] - car.rotation.z) * ease;
    const scale = car.scale.x + (config.scale - car.scale.x) * ease;
    car.scale.setScalar(scale);

    const showCar = ['car', 'dyno'].includes(config.obj);
    const showEcu = config.obj === 'ecu';
    const showTurbo = config.obj === 'turbo';
    car.visible = showCar || targetScene === 3;
    ecu.visible = showEcu;
    turbo.visible = showTurbo;
    dyno.visible = config.obj === 'dyno';

    if (showEcu) {
      ecu.rotation.y += delta * 0.25;
      ecu.position.y = 0.45 + Math.sin(time * 1.5) * 0.08;
    }
    if (showTurbo) {
      turbo.rotation.y += delta * 0.7;
      turbo.children.slice(2).forEach((blade) => { blade.rotation.y += delta * 1.8; });
    }
    if (car.visible) {
      wheels.forEach((wheel) => { wheel.rotation.y -= delta * (targetScene === 4 ? 5 : 0.45); });
      scan.position.x = (time * 1.6) % 7 - 3.5;
      scan.visible = targetScene === 3;
    }

    rings.position.z = (time * 0.6) % 3.8;
    particles.rotation.y = time * 0.006;
    grid.position.z = (time * 0.45) % 1;
    rim.position.x = -4 + Math.sin(time * 0.7) * 1.2;
    silverLight.intensity = 11 + Math.sin(time * 2) * 4;
    if (hudX) hudX.textContent = (48.135 + mouseX * 0.003).toFixed(3);
    if (hudY) hudY.textContent = (11.582 + mouseY * 0.003).toFixed(3);

    renderer.render(scene, camera);
    frames += 1;
    if (now - fpsTime > 600) {
      if (fpsEl) fpsEl.textContent = String(Math.min(Math.round(frames * 1000 / (now - fpsTime)), 99));
      frames = 0;
      fpsTime = now;
    }
  }

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(devicePixelRatio, matchMedia('(max-width: 900px)').matches ? 1.35 : 1.8));
    renderer.setSize(innerWidth, innerHeight);
  });

  finishLoading();
  requestAnimationFrame(render);
}

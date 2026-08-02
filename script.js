const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

const preloader = $('[data-preloader]');
const loadBar = $('[data-load-bar]');
const loadValue = $('[data-load-value]');
const model = $('[data-model]');
const fallback = $('[data-fallback]');
const modelState = $('[data-model-state]');
let loadProgress = 0;
let loadTimer = setInterval(() => {
  loadProgress = Math.min(loadProgress + Math.ceil(Math.random() * 7), 88);
  if (loadBar) loadBar.style.width = `${loadProgress}%`;
  if (loadValue) loadValue.textContent = `${loadProgress}%`;
}, 120);

const finishLoading = () => {
  clearInterval(loadTimer);
  if (loadBar) loadBar.style.width = '100%';
  if (loadValue) loadValue.textContent = '100%';
  setTimeout(() => preloader?.classList.add('done'), 260);
};

const chapters = $$('.chapter');
const navButtons = $$('.scene-nav button');
const progress = $('[data-progress]');
const sceneCurrent = $('[data-scene-current]');
const scrollLabel = $('[data-scroll-label]');
const systemLabel = $('[data-system-label]');
const soundButton = $('[data-sound]');

const labels = ['IGNITION', 'SOFTWARE', 'POWER', 'HARDWARE', 'DYNO', 'CONTACT'];
const systemLabels = [
  'BROO EXPERIENCE // READY',
  'CUSTOM CALIBRATION // ACTIVE',
  'BOOST RESPONSE // CONTROLLED',
  'HARDWARE SETUP // MATCHED',
  'DYNO VALIDATION // VERIFIED',
  'PROJECT CHANNEL // OPEN'
];

const scenes = [
  { orbit: '-34deg 76deg 7.2m', target: '0m 0.55m 0m', fov: '18deg', exposure: '1.08' },
  { orbit: '20deg 75deg 6.2m', target: '0m 0.6m 0m', fov: '17deg', exposure: '1.08' },
  { orbit: '88deg 76deg 6.5m', target: '0m 0.6m 0m', fov: '16deg', exposure: '1.1' },
  { orbit: '146deg 75deg 6.8m', target: '0m 0.58m 0m', fov: '17deg', exposure: '1.1' },
  { orbit: '218deg 76deg 7.6m', target: '0m 0.52m 0m', fov: '18deg', exposure: '1.15' },
  { orbit: '308deg 77deg 8.2m', target: '0m 0.54m 0m', fov: '19deg', exposure: '1.12' }
];

let active = 0;
let lastChange = 0;
let touchStartY = 0;
let soundEnabled = false;
let audioCtx = null;

function ping(freq = 220) {
  if (!soundEnabled) return;
  try {
    audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = freq;
    gain.gain.setValueAtTime(0.025, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.12);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.13);
  } catch {}
}

function updateModelForScene(index) {
  if (!model) return;
  const scene = scenes[index];
  model.cameraOrbit = scene.orbit;
  model.cameraTarget = scene.target;
  model.fieldOfView = scene.fov;
  model.exposure = scene.exposure;
}

function animateCounters(scope) {
  $$('[data-counter]', scope).forEach((el) => {
    const end = Number(el.dataset.counter);
    const decimal = String(end).includes('.');
    const startTime = performance.now();
    const run = (time) => {
      const progress = Math.min((time - startTime) / 900, 1);
      const value = end * (1 - Math.pow(1 - progress, 3));
      el.textContent = decimal ? value.toFixed(1) : Math.round(value);
      if (progress < 1) requestAnimationFrame(run);
    };
    requestAnimationFrame(run);
  });
}

function setScene(index, force = false) {
  index = Math.max(0, Math.min(chapters.length - 1, index));
  if (index === active && !force) return;
  active = index;
  chapters.forEach((el, i) => el.classList.toggle('active', i === index));
  navButtons.forEach((el, i) => el.classList.toggle('active', i === index));
  if (progress) progress.style.width = `${(index / (chapters.length - 1)) * 100}%`;
  if (sceneCurrent) sceneCurrent.textContent = String(index + 1).padStart(2, '0');
  if (scrollLabel) scrollLabel.textContent = labels[index];
  if (systemLabel) systemLabel.textContent = systemLabels[index];
  updateModelForScene(index);
  animateCounters(chapters[index]);
  ping(180 + index * 42);
}

function step(direction) {
  const now = performance.now();
  if (now - lastChange < 650) return;
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

$$('[data-go]').forEach((el) => {
  el.addEventListener('click', (event) => {
    event.preventDefault();
    setScene(Number(el.dataset.go));
  });
});

soundButton?.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  soundButton.classList.toggle('on', soundEnabled);
  soundButton.setAttribute('aria-pressed', String(soundEnabled));
  soundButton.lastChild.textContent = soundEnabled ? ' SOUND ON' : ' SOUND OFF';
  ping(330);
});

$('[data-mail-form]')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const subject = 'Fahrzeuganfrage über BROO 3D Experience';
  const body = `Hallo BROO Performance,\n\nich interessiere mich für eine Fahrzeugoptimierung.\n\nMarke / Modell: ${data.get('vehicle')}\nBaujahr / Motor: ${data.get('engine')}\nSerienleistung: ${data.get('power') || '-'}\n\nBitte senden Sie mir eine erste Einschätzung.\n`;
  window.location.href = `mailto:info@broo-performance.de?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});

if (model) {
  model.addEventListener('load', () => {
    if (modelState) modelState.textContent = 'READY';
    fallback?.classList.remove('is-visible');
    finishLoading();
    setScene(0, true);
  });

  model.addEventListener('error', () => {
    if (modelState) modelState.textContent = 'FALLBACK';
    fallback?.classList.add('is-visible');
    finishLoading();
  });

  setTimeout(() => {
    if (!preloader?.classList.contains('done')) {
      if (modelState) modelState.textContent = 'READY';
      finishLoading();
    }
  }, 3200);
} else {
  finishLoading();
}

setScene(0, true);

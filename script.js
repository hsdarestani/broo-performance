(() => {
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

  const preloader = $('[data-preloader]');
  const loadBar = $('[data-load-bar]');
  const loadValue = $('[data-load-value]');
  const sceneCards = $$('[data-scene-card]');
  const navButtons = $$('[data-go]');
  const progress = $('[data-progress]');
  const scrollLabel = $('[data-scroll-label]');
  const sceneCurrent = $('[data-scene-current]');
  const systemLabel = $('[data-system-label]');
  const sceneKicker = $('[data-scene-kicker]');
  const sceneTitle = $('[data-scene-title]');
  const model = $('[data-model]');
  const soundToggle = $('[data-sound]');

  const labels = ['HERO', 'SOFTWARE', 'POWER', 'HARDWARE', 'DYNO', 'CONTACT'];
  const systemLabels = [
    'INDIVIDUAL PERFORMANCE // READY',
    'CUSTOM CALIBRATION // ACTIVE',
    'POWER DELIVERY // CONTROLLED',
    'HARDWARE PACKAGE // MATCHED',
    'MEASUREMENT // VERIFIED',
    'PROJECT CHANNEL // OPEN'
  ];
  const visualKickers = [
    'PREMIUM AUTOMOTIVE EXPERIENCE',
    'ECU CALIBRATION FOCUS',
    'POWER DELIVERY FOCUS',
    'HARDWARE SYSTEM FOCUS',
    'VALIDATION FOCUS',
    'PROJECT START FOCUS'
  ];

  const scenes = [
    { orbit: '-30deg 78deg 7.4m', target: '0m 0.62m 0m', fov: '18deg', exposure: '1.05' },
    { orbit: '20deg 77deg 6.6m', target: '0m 0.64m 0m', fov: '17deg', exposure: '1.08' },
    { orbit: '95deg 77deg 6.8m', target: '0m 0.62m 0m', fov: '16deg', exposure: '1.08' },
    { orbit: '150deg 76deg 7m', target: '0m 0.6m 0m', fov: '17deg', exposure: '1.1' },
    { orbit: '220deg 77deg 7.5m', target: '0m 0.58m 0m', fov: '18deg', exposure: '1.12' },
    { orbit: '310deg 78deg 8.1m', target: '0m 0.58m 0m', fov: '19deg', exposure: '1.08' }
  ];

  let active = 0;
  let lastChange = 0;
  let touchStartY = 0;
  let soundEnabled = false;
  let audioCtx = null;

  let fakeProgress = 0;
  const loadTimer = setInterval(() => {
    fakeProgress = Math.min(fakeProgress + Math.ceil(Math.random() * 9), 88);
    if (loadBar) loadBar.style.width = `${fakeProgress}%`;
    if (loadValue) loadValue.textContent = `${fakeProgress}%`;
  }, 120);

  function finishLoading() {
    clearInterval(loadTimer);
    if (loadBar) loadBar.style.width = '100%';
    if (loadValue) loadValue.textContent = '100%';
    setTimeout(() => preloader?.classList.add('done'), 260);
  }

  function ping(freq = 240) {
    if (!soundEnabled) return;
    try {
      audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.12);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.13);
    } catch {}
  }

  function animateCounters(scope) {
    $$('[data-counter]', scope).forEach((el) => {
      const end = Number(el.dataset.counter);
      const decimal = String(end).includes('.');
      const start = performance.now();
      const run = (time) => {
        const p = Math.min((time - start) / 900, 1);
        const value = end * (1 - Math.pow(1 - p, 3));
        el.textContent = decimal ? value.toFixed(1) : Math.round(value);
        if (p < 1) requestAnimationFrame(run);
      };
      requestAnimationFrame(run);
    });
  }

  function updateModel(index) {
    if (!model) return;
    const cfg = scenes[index];
    model.cameraOrbit = cfg.orbit;
    model.cameraTarget = cfg.target;
    model.fieldOfView = cfg.fov;
    model.exposure = cfg.exposure;
  }

  function setScene(index, force = false) {
    index = Math.max(0, Math.min(sceneCards.length - 1, index));
    if (index === active && !force) return;
    active = index;

    sceneCards.forEach((card, i) => card.classList.toggle('is-active', i === index));
    navButtons.forEach((btn) => {
      const match = Number(btn.dataset.go) === index;
      if (btn.tagName === 'BUTTON') btn.classList.toggle('is-active', match);
    });

    if (progress) progress.style.width = `${(index / (sceneCards.length - 1)) * 100}%`;
    if (scrollLabel) scrollLabel.textContent = labels[index];
    if (sceneCurrent) sceneCurrent.textContent = String(index + 1).padStart(2, '0');
    if (systemLabel) systemLabel.textContent = systemLabels[index];
    if (sceneKicker) sceneKicker.textContent = visualKickers[index];
    if (sceneTitle) sceneTitle.textContent = `SCENE ${String(index + 1).padStart(2, '0')} / ${labels[index]}`;

    updateModel(index);
    animateCounters(sceneCards[index]);
    ping(200 + index * 38);
  }

  function step(direction) {
    const now = performance.now();
    if (now - lastChange < 650) return;
    lastChange = now;
    setScene(active + direction);
  }

  window.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (Math.abs(e.deltaY) > 8) step(e.deltaY > 0 ? 1 : -1);
  }, { passive: false });

  window.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchend', (e) => {
    const delta = touchStartY - e.changedTouches[0].clientY;
    if (Math.abs(delta) > 38) step(delta > 0 ? 1 : -1);
  }, { passive: true });

  window.addEventListener('keydown', (e) => {
    if (['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(e.key)) {
      e.preventDefault();
      step(1);
    }
    if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) {
      e.preventDefault();
      step(-1);
    }
    if (e.key === 'Home') setScene(0);
    if (e.key === 'End') setScene(sceneCards.length - 1);
  });

  navButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const scene = Number(btn.dataset.go);
      if (!Number.isNaN(scene)) setScene(scene);
    });
  });

  soundToggle?.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundToggle.classList.toggle('is-on', soundEnabled);
    soundToggle.setAttribute('aria-pressed', String(soundEnabled));
    soundToggle.lastChild.textContent = soundEnabled ? 'SOUND ON' : 'SOUND OFF';
    ping(330);
  });

  $('[data-mail-form]')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const subject = 'Fahrzeuganfrage über BROO 3D Experience';
    const body = `Hallo BROO Performance,\n\nich interessiere mich für eine Fahrzeugoptimierung.\n\nMarke / Modell: ${data.get('vehicle')}\nBaujahr / Motor: ${data.get('engine')}\nSerienleistung: ${data.get('power') || '-'}\n\nBitte senden Sie mir eine erste Einschätzung.\n`;
    location.href = `mailto:info@broo-performance.de?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });

  if (model) {
    model.addEventListener('load', () => {
      finishLoading();
      setScene(0, true);
    });
    model.addEventListener('error', finishLoading);
    setTimeout(() => {
      if (!preloader?.classList.contains('done')) finishLoading();
    }, 3200);
  } else {
    finishLoading();
  }

  setScene(0, true);
})();

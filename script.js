(() => {
  const $ = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => [...p.querySelectorAll(s)];
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t * t * (3 - 2 * t);

  const experience = $('[data-experience]');
  const preloader = $('[data-preloader]');
  const loadBar = $('[data-load-bar]');
  const loadValue = $('[data-load-value]');
  const chapters = $$('[data-chapter]');
  const fx = $$('[data-fx]');
  const nav = $$('[data-jump]');
  const currentEl = $('[data-current]');
  const sceneLabel = $('[data-scene-label]');
  const systemLabel = $('[data-system-label]');
  const giantA = $('[data-giant-a]');
  const giantB = $('[data-giant-b]');
  const iframe = $('#api-frame');
  const form = $('[data-mail-form]');

  const labels = ['BMW REVEAL', 'VEHICLE DIAGNOSTIC', 'ECU CALIBRATION', 'HARDWARE SYSTEM', 'POWER DELIVERY', 'INSORIC VALIDATION', 'PROJECT START'];
  const systemLabels = ['COMMERCIAL SEQUENCE // READY', 'VEHICLE DATA // READING', 'CUSTOM MAP // CALIBRATING', 'HARDWARE FLOW // SYNC', 'BOOST CONTROL // LIVE', 'MEASUREMENT // VERIFIED', 'PROJECT CHANNEL // OPEN'];
  const giantWords = [
    ['BEYOND', 'STANDARD'],
    ['READ', 'THE CAR'],
    ['YOUR', 'OWN MAP'],
    ['ONE', 'SYSTEM'],
    ['POWER', 'CONTROL'],
    ['MEASURE', 'PROVE'],
    ['START', 'YOUR PROJECT']
  ];

  const desktopUid = '3fdc4ab04e384ec5bdc26eed6700517f';
  const mobileUid = '25d5b4f6d13e4217afa09bbf89f8d993';
  const uid = matchMedia('(max-width:820px)').matches ? mobileUid : desktopUid;
  const maxScene = Math.max(1, chapters.length - 1);

  let api = null;
  let baseCamera = null;
  let targetProgress = 0;
  let renderedProgress = 0;
  let activeScene = -1;
  let lastCameraTick = 0;
  let fakeLoad = 0;
  let isReady = false;

  let wheelAccumulator = 0;
  let wheelResetTimer = 0;
  let inputLockedUntil = 0;
  let touchStartY = 0;
  let touchStartProgress = 0;
  let touchStartScene = 0;
  let touchBlocked = false;

  const cameraKeys = [
    { yaw: -.48, pitch: .98, radius: 1.08, tx: 0, ty: 0, tz: 0, fov: 38 },
    { yaw: -.08, pitch: .78, radius: .82, tx: .02, ty: .02, tz: 0, fov: 29 },
    { yaw: .52, pitch: .84, radius: .76, tx: .02, ty: .04, tz: 0, fov: 27 },
    { yaw: 1.28, pitch: .9, radius: .84, tx: 0, ty: .02, tz: 0, fov: 30 },
    { yaw: 2.0, pitch: .82, radius: .82, tx: 0, ty: .03, tz: 0, fov: 29 },
    { yaw: 2.74, pitch: 1.04, radius: 1.0, tx: 0, ty: 0, tz: 0, fov: 35 },
    { yaw: 3.25, pitch: .98, radius: 1.12, tx: 0, ty: 0, tz: 0, fov: 39 }
  ];

  const loaderTimer = setInterval(() => {
    fakeLoad = Math.min(fakeLoad + Math.ceil(Math.random() * 7), 90);
    if (loadBar) loadBar.style.width = `${fakeLoad}%`;
    if (loadValue) loadValue.textContent = `${fakeLoad}%`;
  }, 120);

  function doneLoading() {
    if (isReady) return;
    isReady = true;
    clearInterval(loaderTimer);
    if (loadBar) loadBar.style.width = '100%';
    if (loadValue) loadValue.textContent = '100%';
    if (experience) experience.dataset.ready = 'true';
    setTimeout(() => preloader?.classList.add('done'), 300);
  }

  function animateCounters(scope) {
    $$('[data-counter]', scope).forEach(el => {
      const end = Number(el.dataset.counter);
      const decimal = String(end).includes('.');
      const start = performance.now();
      const run = time => {
        const p = Math.min((time - start) / 850, 1);
        const value = end * (1 - Math.pow(1 - p, 3));
        el.textContent = decimal ? value.toFixed(1) : Math.round(value);
        if (p < 1) requestAnimationFrame(run);
      };
      requestAnimationFrame(run);
    });
  }

  function setActiveScene(index) {
    index = clamp(index, 0, chapters.length - 1);
    if (index === activeScene) return;
    activeScene = index;
    chapters.forEach((el, i) => el.classList.toggle('is-active', i === index));
    fx.forEach((el, i) => el.classList.toggle('is-active', i === index));
    nav.forEach(el => el.classList.toggle('is-active', Number(el.dataset.jump) === index));
    if (currentEl) currentEl.textContent = String(index + 1).padStart(2, '0');
    if (sceneLabel) sceneLabel.textContent = labels[index];
    if (systemLabel) systemLabel.textContent = systemLabels[index];
    if (giantA) giantA.textContent = giantWords[index][0];
    if (giantB) giantB.textContent = giantWords[index][1];
    animateCounters(chapters[index]);
    if (fx[index]) animateCounters(fx[index]);
    experience?.classList.remove('is-cutting');
    void experience?.offsetWidth;
    experience?.classList.add('is-cutting');
    setTimeout(() => experience?.classList.remove('is-cutting'), 620);
  }

  function cameraFromKey(key) {
    const t = baseCamera.target;
    const dx = baseCamera.position[0] - t[0];
    const dy = baseCamera.position[1] - t[1];
    const dz = baseCamera.position[2] - t[2];
    const radius = Math.max(.1, Math.hypot(dx, dz)) * key.radius;
    const baseYaw = Math.atan2(dz, dx);
    const yaw = baseYaw + key.yaw;
    return {
      position: [t[0] + Math.cos(yaw) * radius, t[1] + dy * key.pitch, t[2] + Math.sin(yaw) * radius],
      target: [t[0] + key.tx, t[1] + key.ty, t[2] + key.tz],
      fov: key.fov
    };
  }

  function updateCamera(sceneFloat, now) {
    if (!api || !baseCamera || now - lastCameraTick < 55) return;
    lastCameraTick = now;
    const a = Math.floor(sceneFloat);
    const b = Math.min(a + 1, cameraKeys.length - 1);
    const t = ease(sceneFloat - a);
    const ca = cameraFromKey(cameraKeys[a]);
    const cb = cameraFromKey(cameraKeys[b]);
    const pos = ca.position.map((v, i) => lerp(v, cb.position[i], t));
    const target = ca.target.map((v, i) => lerp(v, cb.target[i], t));
    api.setFov(lerp(ca.fov, cb.fov, t));
    api.setCameraLookAt(pos, target, .08);
  }

  function goToScene(index) {
    const next = clamp(Math.round(index), 0, maxScene);
    targetProgress = next / maxScene;
    wheelAccumulator = 0;
  }

  function snapToNearest() {
    goToScene(Math.round(targetProgress * maxScene));
  }

  function render(now) {
    renderedProgress += (targetProgress - renderedProgress) * .075;
    if (Math.abs(targetProgress - renderedProgress) < .00008) renderedProgress = targetProgress;
    const sceneFloat = renderedProgress * maxScene;
    const nearest = Math.round(sceneFloat);
    const local = 1 - Math.min(1, Math.abs(sceneFloat - nearest) * 1.75);
    document.documentElement.style.setProperty('--progress', renderedProgress.toFixed(5));
    document.documentElement.style.setProperty('--scene', sceneFloat.toFixed(4));
    document.documentElement.style.setProperty('--local', local.toFixed(4));
    setActiveScene(nearest);
    updateCamera(sceneFloat, now);
    requestAnimationFrame(render);
  }

  function getScrollableChapter(target) {
    const chapter = target instanceof Element ? target.closest('.chapter') : null;
    if (!chapter) return null;
    return chapter.scrollHeight > chapter.clientHeight + 4 ? chapter : null;
  }

  window.addEventListener('wheel', e => {
    const scrollable = getScrollableChapter(e.target);
    if (scrollable) {
      const atTop = scrollable.scrollTop <= 1;
      const atBottom = scrollable.scrollTop + scrollable.clientHeight >= scrollable.scrollHeight - 1;
      if ((e.deltaY < 0 && !atTop) || (e.deltaY > 0 && !atBottom)) return;
    }

    e.preventDefault();
    const now = performance.now();
    const modeScale = e.deltaMode === 1 ? 18 : e.deltaMode === 2 ? innerHeight : 1;
    wheelAccumulator += clamp(e.deltaY * modeScale, -120, 120);
    clearTimeout(wheelResetTimer);

    if (Math.abs(wheelAccumulator) >= 42 && now >= inputLockedUntil) {
      const direction = Math.sign(wheelAccumulator);
      const basis = Math.round(targetProgress * maxScene);
      goToScene(basis + direction);
      inputLockedUntil = now + 640;
    }

    wheelResetTimer = setTimeout(() => {
      wheelAccumulator = 0;
      snapToNearest();
    }, 140);
  }, { passive: false });

  window.addEventListener('touchstart', e => {
    const interactive = e.target instanceof Element && e.target.closest('input,textarea,select,button,a');
    const scrollable = getScrollableChapter(e.target);
    touchBlocked = Boolean(interactive || scrollable);
    if (touchBlocked) return;
    touchStartY = e.touches[0].clientY;
    touchStartProgress = targetProgress;
    touchStartScene = Math.round(targetProgress * maxScene);
  }, { passive: true });

  window.addEventListener('touchmove', e => {
    if (touchBlocked) return;
    const y = e.touches[0].clientY;
    const delta = touchStartY - y;
    const previewScenes = delta / Math.max(innerHeight * .38, 240);
    targetProgress = clamp(touchStartProgress + previewScenes / maxScene, 0, 1);
    e.preventDefault();
  }, { passive: false });

  window.addEventListener('touchend', e => {
    if (touchBlocked) {
      touchBlocked = false;
      return;
    }
    const delta = touchStartY - e.changedTouches[0].clientY;
    if (Math.abs(delta) >= 38) {
      goToScene(touchStartScene + Math.sign(delta));
    } else {
      goToScene(touchStartScene);
    }
  }, { passive: true });

  window.addEventListener('touchcancel', () => {
    if (!touchBlocked) goToScene(touchStartScene);
    touchBlocked = false;
  }, { passive: true });

  window.addEventListener('keydown', e => {
    if (['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(e.key)) {
      e.preventDefault();
      goToScene(Math.round(targetProgress * maxScene) + 1);
    }
    if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) {
      e.preventDefault();
      goToScene(Math.round(targetProgress * maxScene) - 1);
    }
    if (e.key === 'Home') goToScene(0);
    if (e.key === 'End') goToScene(maxScene);
  });

  nav.forEach(el => el.addEventListener('click', e => {
    e.preventDefault();
    const index = Number(el.dataset.jump);
    if (!Number.isNaN(index)) goToScene(index);
  }));

  form?.addEventListener('submit', e => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const subject = 'Fahrzeuganfrage über BROO BMW Commercial Experience';
    const body = `Hallo BROO Performance,\n\nich interessiere mich für eine Fahrzeugoptimierung.\n\nMarke / Modell: ${data.get('vehicle')}\nBaujahr / Motor: ${data.get('engine')}\nSerienleistung: ${data.get('power') || '-'}\n\nBitte senden Sie mir eine erste Einschätzung.\n`;
    location.href = `mailto:info@broo-performance.de?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });

  if (window.Sketchfab && iframe) {
    const client = new Sketchfab('1.12.1', iframe);
    client.init(uid, {
      autostart: 1,
      camera: 0,
      autospin: 0,
      dnt: 1,
      scrollwheel: 0,
      double_click: 0,
      transparent: 1,
      ui_controls: 0,
      ui_infos: 0,
      ui_help: 0,
      ui_settings: 0,
      ui_vr: 0,
      ui_fullscreen: 0,
      ui_annotations: 0,
      ui_stop: 0,
      ui_inspector: 0,
      ui_watermark_link: 0,
      success(instance) {
        api = instance;
        api.start();
        api.addEventListener('viewerready', () => {
          api.setUserInteraction(false);
          api.getCameraLookAt((err, camera) => {
            if (!err) {
              baseCamera = camera;
              updateCamera(0, performance.now());
            }
            doneLoading();
          });
        });
      },
      error() {
        doneLoading();
      }
    });
  } else {
    doneLoading();
  }

  setTimeout(doneLoading, 7000);
  setActiveScene(0);
  requestAnimationFrame(render);
})();
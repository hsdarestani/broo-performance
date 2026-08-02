(() => {
  const $ = (s,p=document) => p.querySelector(s);
  const $$ = (s,p=document) => [...p.querySelectorAll(s)];
  const experience = $('[data-experience]');
  const preloader = $('[data-preloader]');
  const loadBar = $('[data-load-bar]');
  const loadValue = $('[data-load-value]');
  const stories = $$('[data-story]');
  const scenarios = $$('[data-scenario]');
  const navButtons = $$('[data-go]');
  const progress = $('[data-progress]');
  const current = $('[data-current]');
  const sceneLabel = $('[data-scene-label]');
  const systemLabel = $('[data-system-label]');
  const iframe = $('#api-frame');
  const labels = ['BMW REVEAL','VEHICLE CHECK','ECU CALIBRATION','HARDWARE SYSTEM','POWER DELIVERY','VALIDATION','PROJECT START'];
  const systemLabels = ['VEHICLE LINK // READY','DIAGNOSTIC // ACTIVE','ECU MAP // CALIBRATING','HARDWARE MAP // SYNC','BOOST CONTROL // LIVE','INSORIC DATA // VERIFIED','PROJECT CHANNEL // OPEN'];
  const desktopUid = '3fdc4ab04e384ec5bdc26eed6700517f';
  const mobileUid = '72a7165bfb8c455e9dd8206e40e3347a';
  const uid = matchMedia('(max-width:820px)').matches ? mobileUid : desktopUid;
  let api = null;
  let active = 0;
  let lastChange = 0;
  let touchStart = 0;
  let baseCamera = null;

  experience.dataset.ready = 'false';
  let fake = 0;
  const timer = setInterval(() => {
    fake = Math.min(fake + Math.ceil(Math.random()*8), 88);
    loadBar.style.width = fake + '%';
    loadValue.textContent = fake + '%';
  }, 120);

  function doneLoading(){
    clearInterval(timer);
    loadBar.style.width = '100%';
    loadValue.textContent = '100%';
    experience.dataset.ready = 'true';
    setTimeout(() => preloader.classList.add('done'), 260);
  }

  function animateCounters(scope){
    $$('[data-counter]', scope).forEach(el => {
      const end = Number(el.dataset.counter);
      const decimal = String(end).includes('.');
      const start = performance.now();
      const run = t => {
        const p = Math.min((t-start)/900,1);
        const v = end * (1-Math.pow(1-p,3));
        el.textContent = decimal ? v.toFixed(1) : Math.round(v);
        if(p<1) requestAnimationFrame(run);
      };
      requestAnimationFrame(run);
    });
  }

  function makeCamera(index){
    if(!baseCamera) return null;
    const t = baseCamera.target;
    const dx = baseCamera.position[0]-t[0];
    const dy = baseCamera.position[1]-t[1];
    const dz = baseCamera.position[2]-t[2];
    const r = Math.max(0.1, Math.hypot(dx,dz));
    const baseYaw = Math.atan2(dz,dx);
    const cfg = [
      {yaw:-0.38, pitch:1.00, radius:1.02, tx:0,ty:0,tz:0,fov:36},
      {yaw:0.08, pitch:.78, radius:.86, tx:.02,ty:.02,tz:0,fov:31},
      {yaw:0.58, pitch:.86, radius:.82, tx:.01,ty:.03,tz:0,fov:30},
      {yaw:1.35, pitch:.92, radius:.9, tx:0,ty:.01,tz:0,fov:32},
      {yaw:2.08, pitch:.86, radius:.88, tx:0,ty:.02,tz:0,fov:31},
      {yaw:2.72, pitch:1.04, radius:1.0, tx:0,ty:0,tz:0,fov:35},
      {yaw:3.35, pitch:1.02, radius:1.08, tx:0,ty:0,tz:0,fov:37}
    ][index];
    const yaw = baseYaw + cfg.yaw;
    const horizontal = r * cfg.radius;
    const pos = [
      t[0] + Math.cos(yaw)*horizontal,
      t[1] + dy*cfg.pitch,
      t[2] + Math.sin(yaw)*horizontal
    ];
    const target = [t[0]+cfg.tx,t[1]+cfg.ty,t[2]+cfg.tz];
    return {pos,target,fov:cfg.fov};
  }

  function moveCamera(index){
    if(!api || !baseCamera) return;
    const cam = makeCamera(index);
    api.setCameraEasing('easeInOutQuad');
    api.setFov(cam.fov);
    api.setCameraLookAt(cam.pos, cam.target, 1.5);
  }

  function setScene(index, force=false){
    index = Math.max(0, Math.min(stories.length-1,index));
    if(index===active && !force) return;
    active = index;
    stories.forEach((el,i)=>el.classList.toggle('is-active',i===index));
    scenarios.forEach((el,i)=>el.classList.toggle('is-active',i===index));
    navButtons.forEach(btn=>btn.classList.toggle('is-active',Number(btn.dataset.go)===index));
    progress.style.width = (index/(stories.length-1)*100)+'%';
    current.textContent = String(index+1).padStart(2,'0');
    sceneLabel.textContent = labels[index];
    systemLabel.textContent = systemLabels[index];
    animateCounters(stories[index]);
    animateCounters(scenarios[index]);
    moveCamera(index);
  }

  function step(dir){
    const now = performance.now();
    if(now-lastChange<700) return;
    lastChange = now;
    setScene(active+dir);
  }

  window.addEventListener('wheel', e => {
    e.preventDefault();
    if(Math.abs(e.deltaY)>8) step(e.deltaY>0?1:-1);
  }, {passive:false});
  window.addEventListener('touchstart',e=>touchStart=e.touches[0].clientY,{passive:true});
  window.addEventListener('touchend',e=>{const d=touchStart-e.changedTouches[0].clientY;if(Math.abs(d)>38)step(d>0?1:-1)},{passive:true});
  window.addEventListener('keydown',e=>{
    if(['ArrowDown','ArrowRight','PageDown',' '].includes(e.key)){e.preventDefault();step(1)}
    if(['ArrowUp','ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();step(-1)}
  });
  navButtons.forEach(btn=>btn.addEventListener('click',e=>{e.preventDefault();setScene(Number(btn.dataset.go))}));

  $('[data-mail-form]').addEventListener('submit',e=>{
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const subject = 'Fahrzeuganfrage über BROO BMW 3D Experience';
    const body = `Hallo BROO Performance,\n\nich interessiere mich für eine Fahrzeugoptimierung.\n\nMarke / Modell: ${data.get('vehicle')}\nBaujahr / Motor: ${data.get('engine')}\nSerienleistung: ${data.get('power')||'-'}\n\nBitte senden Sie mir eine erste Einschätzung.\n`;
    location.href = `mailto:info@broo-performance.de?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });

  if(window.Sketchfab && iframe){
    const client = new Sketchfab('1.12.1',iframe);
    client.init(uid,{
      autostart:1,camera:0,autospin:0,dnt:1,scrollwheel:0,double_click:0,
      ui_controls:0,ui_infos:0,ui_help:0,ui_settings:0,ui_vr:0,ui_fullscreen:0,ui_annotations:0,ui_stop:0,ui_inspector:0,
      success(instance){
        api = instance;
        api.start();
        api.addEventListener('viewerready',()=>{
          api.setUserInteraction(false);
          api.getCameraLookAt((err,camera)=>{
            if(!err){baseCamera=camera;setScene(0,true)}
            doneLoading();
          });
        });
      },
      error(){doneLoading()}
    });
  } else {
    doneLoading();
  }

  setTimeout(()=>{if(!preloader.classList.contains('done'))doneLoading()},6000);
  setScene(0,true);
})();

(() => {
  const theme = document.createElement('link');
  theme.rel = 'stylesheet';
  theme.href = 'brand-theme.css';
  document.head.appendChild(theme);

  const applyOfficialBrand = () => {
    document.querySelectorAll('.brand').forEach((brand) => {
      const img = document.createElement('img');
      img.src = 'assets/broo-logo.svg';
      img.alt = 'BROO Performance';
      img.decoding = 'async';
      brand.replaceChildren(img);
    });
  };
  applyOfficialBrand();

  const header = document.querySelector('[data-header]');
  const toggle = document.querySelector('[data-menu-toggle]');
  const mobileMenu = document.querySelector('[data-mobile-menu]');

  const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 20);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  const closeMenu = () => {
    if (!toggle || !mobileMenu) return;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Menü öffnen');
    mobileMenu.classList.remove('is-open');
    document.body.classList.remove('menu-open');
  };

  toggle?.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    toggle.setAttribute('aria-label', open ? 'Menü öffnen' : 'Menü schließen');
    mobileMenu?.classList.toggle('is-open', !open);
    document.body.classList.toggle('menu-open', !open);
  });

  mobileMenu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1050) closeMenu();
  });

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px' });

    document.querySelectorAll('.reveal').forEach((el, index) => {
      el.style.transitionDelay = `${Math.min((index % 4) * 70, 210)}ms`;
      observer.observe(el);
    });
  }

  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  const form = document.getElementById('inquiry-form');
  const status = document.getElementById('form-status');

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = new FormData(form);
    const val = (key) => String(data.get(key) || '').trim();
    const subject = `Fahrzeuganfrage: ${val('make')} ${val('model')} (${val('year')})`;
    const body = [
      'Hallo BROO Performance,', '',
      'ich interessiere mich für eine Fahrzeugoptimierung.', '',
      'KONTAKT',
      `Name: ${val('name')}`,
      `E-Mail: ${val('email')}`,
      `Telefon: ${val('phone') || '-'}`,
      `Standort / PLZ: ${val('location') || '-'}`, '',
      'FAHRZEUG',
      `Marke: ${val('make')}`,
      `Modell: ${val('model')}`,
      `Baujahr: ${val('year')}`,
      `Motor: ${val('engine')}`,
      `Serienleistung: ${val('power') || '-'}`,
      `Getriebe: ${val('gearbox') || '-'}`, '',
      'ZIEL / UMBAUTEN',
      val('message'), '',
      'Viele Grüße', val('name')
    ].join('\n');

    if (status) {
      status.textContent = 'Dein E-Mail-Programm wird geöffnet …';
      status.classList.add('show');
    }
    window.location.href = `mailto:info@broo-performance.de?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
})();

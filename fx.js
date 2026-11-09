/**
 * Motion layer — animations and motion graphics built on the Motion library
 * (motion.dev, the engine behind Framer Motion), loaded from /vendor.
 *
 * Exposes window.SiteFX:
 *   init()   run after every page render (first load and AJAX navigations)
 *   cover()  play the page-change curtain before content is swapped
 *
 * Does nothing when the library is missing or the visitor prefers reduced
 * motion; the plain CSS reveals in style.css take over in that case.
 */
(function () {
  const M = window.Motion;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!M || reduce) return;

  const { animate, scroll, inView, stagger } = M;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const isPhone = () => window.matchMedia('(max-width: 768px)').matches;
  const EASE = [0.16, 1, 0.3, 1];

  document.documentElement.classList.add('fx');

  // Everything started for the current page; torn down on the next init().
  let cleanups = [];
  const track = (stop) => { if (typeof stop === 'function') cleanups.push(stop); };
  const run = (...args) => {
    const a = animate(...args);
    track(() => a.stop());
    return a;
  };
  const el = (tag, cls, parent) => {
    const node = document.createElement(tag);
    node.className = cls;
    node.setAttribute('aria-hidden', 'true');
    if (parent) parent.appendChild(node);
    return node;
  };

  /* ====================================================================
     GLOBAL, CREATED ONCE
     ==================================================================== */
  let globalsReady = false;
  let curtain = null;
  let covered = false;

  function initGlobals() {
    if (globalsReady) return;
    globalsReady = true;

    // Scroll progress bar
    const bar = el('div', 'fx-progress', document.body);
    scroll(animate(bar, { scaleX: [0, 1] }, { ease: 'linear' }));

    // Header: logo draws itself, bar hides while scrolling down
    const header = $('#global-header');
    $$('.logo-mark path', header).forEach((p, i) => {
      animate(p, { pathLength: [0, 1] }, { duration: 1.4, delay: 0.2 + i * 0.35, ease: 'easeInOut' });
    });
    animate('#global-header .nav-item, #global-header .nav-cta', { opacity: [0, 1], y: [-14, 0] },
      { delay: stagger(0.07, { startDelay: 0.25 }), duration: 0.6, ease: EASE });

    let lastY = window.scrollY;
    let hidden = false;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (Math.abs(y - lastY) < 8) return;
      const down = y > lastY && y > 220;
      lastY = y;
      if (down === hidden) return;
      hidden = down;
      animate(header, { y: hidden ? '-100%' : '0%' }, { duration: 0.4, ease: EASE });
    }, { passive: true });

    // Drifting background glow
    animate('.orb-1', { x: [0, -70, 30, 0], y: [0, 50, -20, 0], scale: [1, 1.15, 0.95, 1] },
      { duration: 26, repeat: Infinity, ease: 'easeInOut' });
    animate('.orb-2', { x: [0, 60, -30, 0], y: [0, -40, 20, 0] },
      { duration: 32, repeat: Infinity, ease: 'easeInOut' });

    // Shooting stars
    const sky = el('div', 'fx-sky', document.body);
    const shoot = () => {
      if (!document.hidden) {
        const star = el('i', '', sky);
        star.style.left = (Math.random() * 80) + '%';
        star.style.top = (Math.random() * 45) + '%';
        animate(star, { x: [0, 420], y: [0, 187], opacity: [0, 1, 0] },
          { duration: 1.1 + Math.random() * 0.6, ease: 'easeOut' }).then(() => star.remove());
      }
      setTimeout(shoot, (isPhone() ? 4500 : 2200) + Math.random() * 3500);
    };
    setTimeout(shoot, 1500);

    // Page-change curtain
    curtain = el('div', 'fx-curtain', document.body);
    for (let i = 0; i < 5; i++) el('i', '', curtain);

    // Project modal: content cascades in each time it opens
    const modal = $('#project-modal');
    if (modal) {
      new MutationObserver(() => {
        if (!modal.classList.contains('active')) return;
        const parts = $$('.modal-body > h3, .modal-body > .badge, .modal-body-content > *', modal);
        if (parts.length) {
          animate(parts, { opacity: [0, 1], y: [18, 0] },
            { delay: stagger(0.05, { startDelay: 0.12 }), duration: 0.5, ease: EASE });
        }
      }).observe(modal, { attributes: true, attributeFilter: ['class'] });
    }

    // Bottom tab bar: icon bounce on tap
    document.addEventListener('click', (e) => {
      const tab = e.target.closest && e.target.closest('.tab-link');
      const icon = tab && $('svg', tab);
      if (icon) animate(icon, { scale: [1, 0.75, 1.2, 1] }, { duration: 0.45, ease: 'easeOut' });
    });

    if (finePointer) initPointer();
  }

  /* --------------------------------------------- Pointer-driven effects */
  function initPointer() {
    const glow = el('div', 'fx-glow', document.body);
    const ring = el('div', 'fx-cursor', document.body);
    el('i', '', ring);

    const TILT = '.project-card, .quote-card, .cert-card, .hobby-card, .contact-glow-card, .timeline-content-card, .skills-category-card';
    const MAGNET = '.btn, .nav-cta, .footer-socials a, .link-arrow, .filter-btn';
    const HOVERABLE = 'a, button, input, textarea, .glass-card';
    const settled = (node) => !node.matches('.reveal, .reveal-left, .reveal-right') || node.classList.contains('fx-done');

    let tilted = null;
    let pulled = null;
    let shown = false;
    let frame = 0;
    let last = null;

    const release = (node, values) => {
      if (node && node.isConnected) animate(node, values, { type: 'spring', stiffness: 160, damping: 14 });
    };

    const update = () => {
      frame = 0;
      const e = last;
      if (!e) return;

      if (!shown) {
        shown = true;
        animate([glow, ring], { opacity: 1 }, { duration: 0.4 });
      }
      animate(ring, { x: e.clientX, y: e.clientY }, { type: 'spring', stiffness: 520, damping: 34, mass: 0.5 });
      animate(glow, { x: e.clientX, y: e.clientY }, { type: 'spring', stiffness: 70, damping: 18 });

      const target = e.target instanceof Element ? e.target : null;
      ring.classList.toggle('is-hover', !!(target && target.closest(HOVERABLE)));

      // 3D tilt with a glare that follows the pointer
      let card = target && target.closest(TILT);
      if (card && !settled(card)) card = null;
      if (card !== tilted) {
        release(tilted, { rotateX: 0, rotateY: 0, y: 0 });
        tilted = card;
      }
      if (card) {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', (px * 100) + '%');
        card.style.setProperty('--my', (py * 100) + '%');
        animate(card, { rotateX: (0.5 - py) * 9, rotateY: (px - 0.5) * 11, y: -6, transformPerspective: 900 },
          { type: 'spring', stiffness: 200, damping: 20 });
      }

      // Magnetic buttons
      const magnet = target && target.closest(MAGNET);
      if (magnet !== pulled) {
        release(pulled, { x: 0, y: 0 });
        pulled = magnet;
      }
      if (magnet) {
        const r = magnet.getBoundingClientRect();
        animate(magnet, {
          x: (e.clientX - (r.left + r.width / 2)) * 0.28,
          y: (e.clientY - (r.top + r.height / 2)) * 0.4
        }, { type: 'spring', stiffness: 220, damping: 16 });
      }
    };

    window.addEventListener('pointermove', (e) => {
      last = e;
      if (!frame) frame = requestAnimationFrame(update);
    }, { passive: true });
    window.addEventListener('pointerdown', () => ring.classList.add('is-down'));
    window.addEventListener('pointerup', () => ring.classList.remove('is-down'));
    document.documentElement.addEventListener('pointerleave', () => {
      shown = false;
      animate([glow, ring], { opacity: 0 }, { duration: 0.3 });
      release(tilted, { rotateX: 0, rotateY: 0, y: 0 });
      release(pulled, { x: 0, y: 0 });
      tilted = pulled = null;
    });
  }

  /* ====================================================================
     HELPERS
     ==================================================================== */

  // Hand an element back to the stylesheet once its reveal has played.
  function settle(node) {
    node.classList.add('fx-done', 'active');
    node.style.opacity = '';
    node.style.transform = '';
    node.style.filter = '';
  }

  // Wrap each word of a heading so it can rise out of a mask.
  function splitWords(node) {
    if (node.dataset.fxSplit) return $$('.fx-wi', node);
    node.dataset.fxSplit = '1';
    const walk = (parent) => {
      Array.from(parent.childNodes).forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(' '));
              return;
            }
            const mask = document.createElement('span');
            mask.className = 'fx-w';
            const inner = document.createElement('span');
            inner.className = 'fx-wi';
            inner.textContent = part;
            inner.style.transform = 'translateY(115%)';
            mask.appendChild(inner);
            frag.appendChild(mask);
          });
          parent.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') {
          walk(child);
        }
      });
    };
    walk(node);
    return $$('.fx-wi', node);
  }

  function riseWords(node, startDelay = 0) {
    const words = splitWords(node);
    if (!words.length) return;
    run(words, { y: ['115%', '0%'] },
      { delay: stagger(0.06, { startDelay }), type: 'spring', stiffness: 90, damping: 16 });
  }

  // "Decoding" text effect for small uppercase labels.
  function scramble(node) {
    const final = node.textContent;
    const glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/_<>';
    const started = performance.now();
    const duration = 500 + final.length * 28;
    let raf = 0;
    const tick = (now) => {
      const p = Math.min(1, (now - started) / duration);
      const locked = Math.floor(p * final.length);
      let out = final.slice(0, locked);
      for (let i = locked; i < final.length; i++) {
        out += /\s/.test(final[i]) ? final[i] : glyphs[(Math.random() * glyphs.length) | 0];
      }
      node.textContent = out;
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    track(() => { cancelAnimationFrame(raf); node.textContent = final; });
  }

  // Keep late-entering pieces invisible until their animation starts.
  function hide(nodes) {
    nodes.forEach((n) => { n.style.opacity = '0'; });
    track(() => nodes.forEach((n) => { n.style.opacity = ''; }));
    return nodes;
  }

  // Count a leading number up from zero ("90%", "12+", "3 internships").
  function countUp(node) {
    const match = /^(\s*)(\d+)([\s\S]*)$/.exec(node.textContent);
    if (!match) return;
    const [, lead, digits, rest] = match;
    run(0, parseInt(digits, 10), {
      duration: 1.6,
      ease: 'easeOut',
      onUpdate: (v) => { node.textContent = lead + Math.round(v) + rest; }
    });
  }

  /* ====================================================================
     PER-PAGE
     ==================================================================== */

  function initHero() {
    const hero = $('#hero');
    if (!hero) return;
    const text = $('.hero-text', hero);
    const visual = $('.hero-visual', hero);
    const orb = $('.hero-orb', hero);
    [text, visual].forEach((n) => n && settle(n));

    // Motion graphics: perspective grid floor and orbiting HUD rings
    if (!$('.fx-grid', hero)) el('i', '', el('div', 'fx-grid', hero));
    run('.fx-grid i', { backgroundPositionY: ['0px', '44px'] }, { duration: 2.2, repeat: Infinity, ease: 'linear' });

    if (orb && !$('.fx-orbits', orb)) {
      const orbits = el('div', 'fx-orbits', orb);
      orbits.innerHTML =
        '<svg class="fx-ring r1" viewBox="0 0 200 200"><circle cx="100" cy="100" r="98" stroke-dasharray="2 9"/><circle class="sat" cx="100" cy="2" r="3"/><circle class="sat" cx="100" cy="198" r="1.8"/></svg>' +
        '<svg class="fx-ring r2" viewBox="0 0 200 200"><circle cx="100" cy="100" r="98" stroke-dasharray="70 240 20 286" stroke-linecap="round"/><circle class="sat" cx="198" cy="100" r="2.6"/></svg>' +
        '<svg class="fx-ring r3" viewBox="0 0 200 200"><circle cx="100" cy="100" r="98" stroke-dasharray="1 5"/></svg>';
    }
    if (orb) {
      run($('.fx-ring.r1', orb), { rotate: [0, 360] }, { duration: 48, repeat: Infinity, ease: 'linear' });
      run($('.fx-ring.r2', orb), { rotate: [0, -360] }, { duration: 16, repeat: Infinity, ease: 'linear' });
      run($('.fx-ring.r3', orb), { rotate: [0, 360] }, { duration: 80, repeat: Infinity, ease: 'linear' });
      run($$('.fx-ring', orb), { opacity: [0, 1], scale: [0.7, 1] },
        { delay: stagger(0.15, { startDelay: 0.5 }), duration: 1.1, ease: EASE });
      run($('.hero-image-frame', orb), { opacity: [0, 1], scale: [0.55, 1], rotate: [-30, 0] },
        { type: 'spring', stiffness: 70, damping: 13, delay: 0.15 });
    }

    // Entrance sequence
    const name = $('.hero-name', hero);
    if (name) riseWords(name, 0.15);
    const greeting = $('.hero-greeting', hero);
    if (greeting) scramble(greeting);

    const rows = $$('.hero-greeting, .hero-subtitle, .hero-desc, .hero-actions .btn, .availability', hero);
    run(rows, { opacity: [0, 1], y: [26, 0] },
      { delay: stagger(0.09, { startDelay: 0.45 }), duration: 0.8, ease: EASE });

    const badges = $$('.hero-floating-badge', hero);
    run(badges, { opacity: [0, 1], scale: [0.4, 1] },
      { delay: stagger(0.14, { startDelay: 0.8 }), type: 'spring', stiffness: 230, damping: 15 });
    $$('.badge-value strong', hero).forEach(countUp);

    // Parallax as the hero scrolls away (desktop layout only)
    if (!isPhone() && visual && text) {
      const offset = ['start start', 'end start'];
      track(scroll(animate(visual, { y: [0, 110] }, { ease: 'linear' }), { target: hero, offset }));
      track(scroll(animate(text, { y: [0, -50], opacity: [1, 0.2] }, { ease: 'linear' }), { target: hero, offset }));
    }

    // Marquee of what I work with
    if (!$('.fx-marquee')) {
      const band = el('div', 'fx-marquee');
      const rows2 = [
        ['On-device AI', 'Full-stack web', '<b>Local LLMs</b>', 'Three.js', 'React', 'Flutter', '<b>PyTorch</b>', 'Node.js'],
        ['FastAPI', '<b>RAG pipelines</b>', 'TypeScript', 'Electron', 'PostgreSQL', '<b>Stable Diffusion</b>', 'Firebase', 'OpenVINO']
      ];
      band.innerHTML = rows2.map((items) => {
        const once = items.map((t) => t.startsWith('<b>')
          ? '<span class="is-solid">' + t.slice(3, -4) + '</span>'
          : '<span>' + t + '</span>').join('');
        return '<div class="fx-marquee-row">' + once + once + '</div>';
      }).join('');
      hero.insertAdjacentElement('afterend', band);
    }
    $$('.fx-marquee-row').forEach((row, i) => {
      run(row, { x: i % 2 ? ['-50%', '0%'] : ['0%', '-50%'] },
        { duration: 38 + i * 8, repeat: Infinity, ease: 'linear' });
    });
  }

  function initReveals() {
    $$('.reveal, .reveal-left, .reveal-right').forEach((node) => {
      if (node.classList.contains('fx-done')) return;
      // Already visible by design (e.g. mobile carousel cards): leave alone.
      if (getComputedStyle(node).opacity === '1') { settle(node); return; }

      const delayClass = /delay-(\d+)/.exec(node.className);
      const delay = delayClass ? parseInt(delayClass[1], 10) / 1000 : 0;
      const big = node.matches('.band, .section-title-wrap, .timeline-item');
      const frames = { opacity: [0, 1] };
      if (node.classList.contains('reveal-left')) frames.x = [-56, 0];
      else if (node.classList.contains('reveal-right')) frames.x = [56, 0];
      else frames.y = [44, 0];
      if (!big) {
        frames.scale = [0.94, 1];
        if (!isPhone()) frames.filter = ['blur(10px)', 'blur(0px)'];
      }

      track(inView(node, () => {
        run(node, frames, { duration: 0.95, delay, ease: EASE }).then(() => settle(node));
      }, { margin: '0px 0px -10% 0px' }));
    });
  }

  function initHeadings() {
    $$('.section-title, .services-intro h2, .cta-copy h2').forEach((node) => {
      splitWords(node);
      track(inView(node, () => { riseWords(node, 0.1); }, { margin: '0px 0px -8% 0px' }));
    });
    $$('.eyebrow, .tools-title').forEach((node) => {
      track(inView(node, () => { scramble(node); }, { margin: '0px 0px -8% 0px' }));
    });
    $$('.stat-number, .skill-pct').forEach((node) => {
      track(inView(node, () => { countUp(node); }));
    });
  }

  function initSections() {
    // Project images drift inside their frames while scrolling
    $$('.project-card-image-wrap').forEach((wrap) => {
      const img = $('.project-card-img', wrap);
      if (!img) return;
      track(scroll(animate(img, { y: ['-6%', '6%'] }, { ease: 'linear' }),
        { target: wrap, offset: ['start end', 'end start'] }));
    });

    // Services: tiles, tool icons and the planet
    $$('.services-list').forEach((list) => {
      const tiles = hide($$('.service-item', list));
      track(inView(list, () => {
        run(tiles, { opacity: [0, 1], y: [30, 0] },
          { delay: stagger(0.1), duration: 0.7, ease: EASE });
        run($$('.icon-ring svg', list), { scale: [0, 1], rotate: [-90, 0] },
          { delay: stagger(0.1, { startDelay: 0.15 }), type: 'spring', stiffness: 200, damping: 12 });
      }, { margin: '0px 0px -10% 0px' }));
    });
    $$('.tool-tile').forEach((tile, i) => {
      run(tile, { y: [0, -7, 0] }, { duration: 3.2, delay: i * 0.25, repeat: Infinity, ease: 'easeInOut' });
    });
    $$('.services-planet').forEach((planet) => {
      const moon = $('.fx-moon', planet) || el('div', 'fx-moon', planet);
      run(moon, { rotate: [0, 360] }, { duration: 9, repeat: Infinity, ease: 'linear' });
      run(planet, { y: [0, -10, 0] }, { duration: 6, repeat: Infinity, ease: 'easeInOut' });
    });

    // Process: the line draws with scroll, steps pop in, a pulse travels along
    $$('.process-steps').forEach((steps) => {
      steps.style.setProperty('--fx-line', '0%');
      track(scroll((p) => { steps.style.setProperty('--fx-line', (p * 100).toFixed(1) + '%'); },
        { target: steps, offset: ['start 85%', 'end 60%'] }));
      track(() => steps.style.removeProperty('--fx-line'));
      const rings = hide($$('.icon-ring', steps));
      const copy = hide($$('h3, p', steps));
      track(inView(steps, () => {
        run(rings, { opacity: [0, 1], scale: [0, 1] },
          { delay: stagger(0.16), type: 'spring', stiffness: 240, damping: 13 });
        run(copy, { opacity: [0, 1], y: [16, 0] },
          { delay: stagger(0.08, { startDelay: 0.1 }), duration: 0.6, ease: EASE });
      }, { margin: '0px 0px -12% 0px' }));
      const pulse = $('.fx-pulse', steps) || el('div', 'fx-pulse', steps);
      run(pulse, { left: ['-2%', '100%'], opacity: [0, 1, 1, 0] },
        { duration: 3.6, repeat: Infinity, repeatDelay: 1.2, ease: 'easeInOut' });
    });

    // Archway: breathing sun and rising motes
    $$('.archway').forEach((arch) => {
      const sun = $('.fx-sun', arch) || el('div', 'fx-sun', arch);
      run(sun, { scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }, { duration: 4, repeat: Infinity, ease: 'easeInOut' });
      if (!$('.fx-mote', arch)) for (let i = 0; i < 9; i++) el('i', 'fx-mote', arch);
      $$('.fx-mote', arch).forEach((mote, i) => {
        mote.style.left = (12 + ((i * 37) % 76)) + '%';
        run(mote, { y: [0, -150 - (i % 3) * 30], x: [0, (i % 2 ? 1 : -1) * 12], opacity: [0, 1, 0] },
          { duration: 4 + (i % 4), delay: i * 0.55, repeat: Infinity, ease: 'easeOut' });
      });
      run(arch, { y: [0, -8, 0] }, { duration: 7, repeat: Infinity, ease: 'easeInOut' });
    });

    // About: timeline line draws with scroll, dots pop
    $$('.timeline-track').forEach((trackEl) => {
      trackEl.style.setProperty('--fx-line', '0%');
      track(scroll((p) => { trackEl.style.setProperty('--fx-line', (p * 100).toFixed(1) + '%'); },
        { target: trackEl, offset: ['start 80%', 'end 70%'] }));
      track(() => trackEl.style.removeProperty('--fx-line'));
      $$('.timeline-dot', trackEl).forEach((dot) => {
        track(inView(dot, () => {
          run(dot, { scale: [0, 1.5, 1] }, { duration: 0.6, ease: 'easeOut' });
        }, { margin: '0px 0px -15% 0px' }));
      });
    });

    // Quote avatars and contact icons spring in
    $$('.quote-avatar, .contact-card-icon-wrap, .cert-icon, .hobby-icon-wrap').forEach((node) => {
      track(inView(node, () => {
        run(node, { scale: [0, 1], rotate: [-40, 0] }, { type: 'spring', stiffness: 220, damping: 13, delay: 0.25 });
      }));
    });

    // Contact form fields cascade
    $$('.cta-form').forEach((form) => {
      const fields = hide($$('input, textarea, .btn', form));
      track(inView(form, () => {
        run(fields, { opacity: [0, 1], x: [30, 0] },
          { delay: stagger(0.09, { startDelay: 0.2 }), duration: 0.6, ease: EASE });
      }));
    });

    // Footer
    const footer = $('footer');
    if (footer) {
      track(inView(footer, () => {
        run($$('.footer-grid > div, .footer-bottom', footer), { opacity: [0, 1], y: [24, 0] },
          { delay: stagger(0.1), duration: 0.7, ease: EASE });
        run($$('.footer-socials a', footer), { scale: [0, 1] },
          { delay: stagger(0.08, { startDelay: 0.3 }), type: 'spring', stiffness: 260, damping: 14 });
      }));
    }
  }

  /* ====================================================================
     PUBLIC API
     ==================================================================== */
  function init() {
    cleanups.forEach((stop) => { try { stop(); } catch (e) { /* element already gone */ } });
    cleanups = [];

    initGlobals();
    initHero();
    initReveals();
    initHeadings();
    initSections();

    if (covered) {
      covered = false;
      const panels = $$('i', curtain);
      panels.forEach((p) => { p.style.transformOrigin = '50% 0%'; });
      animate(panels, { scaleY: [1, 0] }, { delay: stagger(0.04), duration: 0.5, ease: EASE });
    }
  }

  function cover() {
    if (!curtain) return;
    covered = true;
    const panels = $$('i', curtain);
    panels.forEach((p) => { p.style.transformOrigin = '50% 100%'; });
    animate(panels, { scaleY: [0, 1] }, { delay: stagger(0.025), duration: 0.25, ease: 'easeIn' });
  }

  window.SiteFX = { init, cover };
})();

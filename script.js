// ============================================================
// Coffee T and Bagels — site interactions
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Footer year ----
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // ---- Nav: shadow + hide while scrolling down ----
  const nav = document.getElementById('siteNav');
  const mobileMenu = document.getElementById('mobileMenu');
  let lastY = window.scrollY, anchorGuard = 0;
  if (nav) {
    document.querySelectorAll('a[href^="#"]').forEach(a =>
      a.addEventListener('click', () => { anchorGuard = Date.now() + 900; nav.classList.remove('nav-hidden'); }));
    const onScroll = () => {
      const y = window.scrollY;
      nav.classList.toggle('nav-scrolled', y > 8);
      if (!reduceMotion) {
        const menuOpen = mobileMenu && !mobileMenu.classList.contains('hidden');
        const goingDown = y > lastY + 4 && y > 220 && Date.now() > anchorGuard && !menuOpen;
        const goingUp = y < lastY - 4 || y < 120;
        if (goingDown) nav.classList.add('nav-hidden');
        else if (goingUp) nav.classList.remove('nav-hidden');
      }
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ---- Mobile menu ----
  const menuBtn = document.getElementById('menuBtn');
  if (menuBtn && mobileMenu) {
    const setMenu = (open) => {
      mobileMenu.classList.toggle('hidden', !open);
      menuBtn.setAttribute('aria-expanded', String(open));
      if (nav && !open) nav.classList.remove('nav-hidden');
    };
    menuBtn.addEventListener('click', () => setMenu(mobileMenu.classList.contains('hidden')));
    mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  }

  // ---- Staggered scroll-in reveal ----
  if (!reduceMotion) {
    const groups = [
      ...document.querySelectorAll('#story > div'),
      ...document.querySelectorAll('#menu .grid > div'),
      ...document.querySelectorAll('#gallery img'),
      ...document.querySelectorAll('#reviews .grid > div'),
      ...document.querySelectorAll('#contact .grid > *'),
      ...document.querySelectorAll('footer > *'),
    ];
    // delay by position within each parent, so each row cascades cleanly
    const byParent = new Map();
    groups.forEach(el => {
      const p = el.parentElement;
      if (!byParent.has(p)) byParent.set(p, []);
      byParent.get(p).push(el);
    });
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    groups.forEach(el => {
      el.classList.add('anim');
      el.style.transitionDelay = Math.min(byParent.get(el.parentElement).indexOf(el) * 90, 360) + 'ms';
      io.observe(el);
    });
  }

  // ---- Gallery lightbox ----
  const galleryImgs = document.querySelectorAll('#gallery img');
  if (galleryImgs.length) {
    let lb = null;
    const close = () => { if (lb) { lb.remove(); lb = null; document.body.style.overflow = ''; } };
    galleryImgs.forEach(img => img.addEventListener('click', () => {
      close();
      lb = document.createElement('div');
      lb.id = 'lightbox';
      lb.innerHTML = '<button class="lb-close" aria-label="Close">×</button>' +
        `<img src="${img.src}" alt="${img.alt}">` +
        `<p class="lb-caption">${img.alt}</p>`;
      lb.addEventListener('click', close);
      document.addEventListener('keydown', function onKey(e) {
        if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); }
      });
      document.body.appendChild(lb);
      document.body.style.overflow = 'hidden';
    }));
  }

  // ---- 3D: hero coffee-bean scene (Three.js) ----
  (function initHero3D() {
    if (reduceMotion || typeof THREE === 'undefined') return;
    const hero = document.querySelector('header');
    const content = hero && hero.querySelector('.relative');
    if (!hero || !content) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.id = 'hero3d';
      hero.insertBefore(canvas, content);

      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
      camera.position.set(0, 0, 16);

      scene.add(new THREE.AmbientLight(0xffe0b2, 0.5));
      const key = new THREE.DirectionalLight(0xffd28a, 1.5); key.position.set(5, 8, 10); scene.add(key);
      const rim = new THREE.DirectionalLight(0xf59e0b, 0.7); rim.position.set(-6, -4, 6); scene.add(rim);

      const COUNT = 90;
      const beans = new THREE.InstancedMesh(
        new THREE.CapsuleGeometry(0.55, 0.95, 6, 12),
        new THREE.MeshStandardMaterial({ color: 0x8a5a2b, roughness: 0.55, metalness: 0.15 }),
        COUNT);
      const data = [], dummy = new THREE.Object3D();
      for (let i = 0; i < COUNT; i++) {
        data.push({
          x: (Math.random() - 0.5) * 26, y: (Math.random() - 0.5) * 18, z: (Math.random() - 0.5) * 10,
          rx: Math.random() * Math.PI, rz: Math.random() * Math.PI,
          s: 0.5 + Math.random() * 0.9,
          spd: 0.004 + Math.random() * 0.009,
          rot: (Math.random() - 0.5) * 0.02
        });
      }
      scene.add(beans);

      const pCount = 160, pos = new Float32Array(pCount * 3);
      for (let i = 0; i < pCount; i++) {
        pos[i*3] = (Math.random() - 0.5) * 28;
        pos[i*3+1] = (Math.random() - 0.5) * 18;
        pos[i*3+2] = (Math.random() - 0.5) * 12;
      }
      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const bokeh = new THREE.Points(pGeo, new THREE.PointsMaterial({
        color: 0xfbbf24, size: 0.09, transparent: true, opacity: 0.7,
        blending: THREE.AdditiveBlending, depthWrite: false }));
      scene.add(bokeh);

      let tx = 0, ty = 0, cx = 0, cy = 0;
      window.addEventListener('pointermove', e => {
        tx = (e.clientX / window.innerWidth - 0.5) * 2;
        ty = (e.clientY / window.innerHeight - 0.5) * 2;
      }, { passive: true });

      function resize() {
        const w = hero.clientWidth, h = hero.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h; camera.updateProjectionMatrix();
      }
      window.addEventListener('resize', resize); resize();

      let heroVisible = true;
      new IntersectionObserver(entries => { heroVisible = entries[0].isIntersecting; }).observe(hero);

      let t = 0;
      (function loop() {
        requestAnimationFrame(loop);
        if (!heroVisible || document.hidden) return;
        t += 0.01;
        cx += (tx - cx) * 0.04; cy += (ty - cy) * 0.04;
        camera.position.x = cx * 1.6; camera.position.y = -cy * 1.1;
        camera.lookAt(0, 0, 0);
        for (let i = 0; i < COUNT; i++) {
          const d = data[i];
          d.y += d.spd; if (d.y > 9) d.y = -9;
          d.rx += d.rot; d.rz += d.rot * 0.6;
          dummy.position.set(d.x + Math.sin(t + i) * 0.4, d.y, d.z);
          dummy.rotation.set(d.rx, 0, d.rz);
          dummy.scale.setScalar(d.s);
          dummy.updateMatrix();
          beans.setMatrixAt(i, dummy.matrix);
        }
        beans.instanceMatrix.needsUpdate = true;
        bokeh.rotation.y = t * 0.02;
        renderer.render(scene, camera);
      })();
    } catch (err) { /* WebGL unavailable: hero stays gracefully 2D */ }
  })();

  // ---- 3D: pointer tilt on cards & gallery ----
  const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!reduceMotion && canHover) {
    document.querySelectorAll('#menu .grid > div, #reviews .grid > div, #gallery img').forEach(el => {
      el.classList.add('tilt');
      if (el.tagName !== 'IMG') el.classList.add('tilt-card');
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty('--gx', ((px + 0.5) * 100).toFixed(1) + '%');
        el.style.setProperty('--gy', ((py + 0.5) * 100).toFixed(1) + '%');
        el.style.transform = 'perspective(900px) rotateX(' + (-py * 8).toFixed(2) +
          'deg) rotateY(' + (px * 10).toFixed(2) + 'deg) translateY(-4px)';
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  // ---- 3D: hero depth parallax ----
  if (!reduceMotion && canHover) {
    const heroContent = document.querySelector('header .relative');
    const heroBg = document.querySelector('header img.absolute');
    if (heroContent && heroBg) {
      let px = 0, py = 0, cxp = 0, cyp = 0;
      window.addEventListener('pointermove', e => {
        px = (e.clientX / window.innerWidth - 0.5) * 2;
        py = (e.clientY / window.innerHeight - 0.5) * 2;
      }, { passive: true });
      (function glide() {
        requestAnimationFrame(glide);
        cxp += (px - cxp) * 0.05; cyp += (py - cyp) * 0.05;
        heroContent.style.transform = 'translate3d(' + (cxp * 8).toFixed(2) + 'px,' + (cyp * 6).toFixed(2) + 'px,0)';
        heroBg.style.transform = 'translate3d(' + (cxp * -5).toFixed(2) + 'px,' + (cyp * -4).toFixed(2) + 'px,0) scale(1.05)';
      })();
    }
  }

  // ---- Contact form ----
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('submitBtn'), status = document.getElementById('formStatus');
      const data = Object.fromEntries(new FormData(form).entries());
      btn.disabled = true; btn.textContent = 'Sending...';
      status.classList.add('hidden');
      try {
        const res = await fetch('https://superagent-afff3efc.base44.app/functions/submitContactForm', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
        });
        const out = await res.json();
        if (res.ok && out.ok) {
          status.textContent = out.message;
          status.className = 'text-center text-sm font-medium rounded-lg px-4 py-3 bg-green-500/20 text-green-300';
          form.reset();
        } else {
          throw new Error(out.error || 'Something went wrong.');
        }
      } catch (err) {
        status.textContent = err.message || 'Something went wrong. Please try again.';
        status.className = 'text-center text-sm font-medium rounded-lg px-4 py-3 bg-red-500/20 text-red-300';
      }
      btn.disabled = false; btn.textContent = 'Send Message';
    });
  }
});

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

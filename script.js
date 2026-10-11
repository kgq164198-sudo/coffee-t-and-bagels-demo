// Coffee T and Bagels — site interactions
document.addEventListener('DOMContentLoaded', () => {
  // Footer year
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // Nav shadow on scroll
  const nav = document.getElementById('siteNav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('nav-scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Mobile menu
  const menuBtn = document.getElementById('menuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
    mobileMenu.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => mobileMenu.classList.add('hidden')));
  }

  // Fade-in sections on scroll
  const sections = document.querySelectorAll('main section');
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); } });
  }, { threshold: 0.08 });
  sections.forEach(s => { s.classList.add('anim'); io.observe(s); });

  // Contact form
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('submitBtn'), status = document.getElementById('formStatus');
      const data = Object.fromEntries(new FormData(form).entries());
      btn.disabled = true; btn.textContent = 'Sending...'; btn.classList.add('opacity-70');
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
        status.textContent = err.message || 'Something went down. Please try again.';
        status.className = 'text-center text-sm font-medium rounded-lg px-4 py-3 bg-red-500/20 text-red-300';
      }
      btn.disabled = false; btn.textContent = 'Send Message'; btn.classList.remove('opacity-70');
    });
  }
});

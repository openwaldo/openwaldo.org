// OpenWALDO site — small shared behaviors. No dependencies.

// Mobile nav toggle
const menuBtn = document.getElementById('menu-btn');
if (menuBtn) {
  menuBtn.addEventListener('click', () => {
    document.querySelector('nav.links').classList.toggle('open');
  });
}

// Scroll-reveal
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

// Hero: cycle a glow across the W-A-L-D-O letters
const letters = document.querySelectorAll('h1.title .k');
if (letters.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  let i = 0;
  setInterval(() => {
    letters.forEach((l) => l.classList.remove('lit'));
    letters[i % letters.length].classList.add('lit');
    i++;
  }, 900);
}

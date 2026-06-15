/* ── State ───────────────────────────────────────────────────────────────── */
let I18N       = {};
let ARTICLES   = [];
let currentLang = localStorage.getItem('lang') || 'en';

// Typing animation state
let roles = ['Software Engineer', 'Tech Lead', 'Scrum Master', 'Lecturer', 'IT Consultant'];
let ri = 0, ci = 0, del = false;

// Cursor tracking
let mx = 0, my = 0, rx = 0, ry = 0;

/* ── DOM refs ────────────────────────────────────────────────────────────── */
const cursor    = document.getElementById('cursor');
const ring      = document.getElementById('cursorRing');
const typedEl   = document.getElementById('typedText');
const ham       = document.getElementById('hamburger');
const mNav      = document.getElementById('mobileNav');
const toggleBtn = document.getElementById('themeToggle');
const grid      = document.getElementById('articlesGrid');
const overlay   = document.getElementById('readerOverlay');
const closeBtn  = document.getElementById('readerClose');

/* ── Expose closeMobile globally for inline onclick handlers ─────────────── */
window.closeMobile = function () {
  mNav.classList.remove('open');
  ham.textContent = '☰';
};

/* ── Bootstrap: load all JSON data then initialise ───────────────────────── */
Promise.all([
  fetch('locales/en.json').then(r => r.json()),
  fetch('locales/fr.json').then(r => r.json()),
  fetch('locales/de.json').then(r => r.json()),
  fetch('data/articles.json').then(r => r.json())
]).then(([en, fr, de, articles]) => {
  I18N     = { en, fr, de };
  ARTICLES = articles;
  init();
}).catch(err => {
  console.error('Failed to load data files. If opening locally, serve via HTTP server.', err);
});

/* ── Init ────────────────────────────────────────────────────────────────── */
function init() {
  setupCursor();
  startTyping();
  setupScrollReveal();
  setupProjectSpotlight();
  setupMobileNav();
  setupThemeToggle();
  renderArticles();
  setupArticleReader();
  setupLangButtons();
  setLang(currentLang);
}

/* ── Custom cursor ───────────────────────────────────────────────────────── */
function setupCursor() {
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cursor.style.transform = `translate(${mx - 4}px, ${my - 4}px)`;
  });
  (function animRing() {
    rx += (mx - rx - 17) * 0.14;
    ry += (my - ry - 17) * 0.14;
    ring.style.transform = `translate(${rx}px, ${ry}px)`;
    requestAnimationFrame(animRing);
  })();
  document.querySelectorAll('a, button, .pill, .proj-card, .stat-card').forEach(el => {
    el.addEventListener('mouseenter', () => ring.style.borderColor = 'rgba(37,99,235,0.9)');
    el.addEventListener('mouseleave', () => ring.style.borderColor = 'rgba(37,99,235,0.5)');
  });
}

/* ── Typing animation ────────────────────────────────────────────────────── */
function startTyping() {
  function type() {
    const w = roles[ri];
    typedEl.textContent = del ? w.slice(0, --ci) : w.slice(0, ++ci);
    if (!del && ci === w.length) { setTimeout(() => { del = true; type(); }, 2000); return; }
    if (del && ci === 0) { del = false; ri = (ri + 1) % roles.length; }
    setTimeout(type, del ? 45 : 80);
  }
  type();
}

/* ── Scroll reveal + timeline stagger + counter animation ────────────────── */
function setupScrollReveal() {
  // Reveal
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

  // Timeline stagger
  const tObs = new IntersectionObserver(entries => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) setTimeout(() => e.target.classList.add('visible'), i * 80);
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.t-item').forEach(el => tObs.observe(el));

  // Counter animation
  const cObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, target = +el.dataset.target;
      let n = 0; const step = target / 36;
      const t = setInterval(() => {
        n = Math.min(n + step, target);
        el.textContent = Math.floor(n) + '+';
        if (n >= target) clearInterval(t);
      }, 38);
      cObs.unobserve(el);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.stat-num[data-target]').forEach(el => cObs.observe(el));
}

/* ── Project spotlight ───────────────────────────────────────────────────── */
function setupProjectSpotlight() {
  document.querySelectorAll('.proj-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
}

/* ── Mobile nav ──────────────────────────────────────────────────────────── */
function setupMobileNav() {
  ham.addEventListener('click', () => {
    mNav.classList.toggle('open');
    ham.textContent = mNav.classList.contains('open') ? '✕' : '☰';
  });
}

/* ── Theme toggle ────────────────────────────────────────────────────────── */
function setupThemeToggle() {
  const root = document.documentElement;
  toggleBtn.addEventListener('click', () => {
    const isLight = root.getAttribute('data-theme') === 'light';
    if (isLight) {
      root.removeAttribute('data-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      root.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
  });
}

/* ── Render article cards ────────────────────────────────────────────────── */
function renderArticles() {
  const readLabel = (I18N[currentLang] && I18N[currentLang]['articles.read']) || 'Read';
  grid.innerHTML = '';
  ARTICLES.forEach(a => {
    const card = document.createElement('div');
    card.className = 'art-card';
    card.innerHTML = `
      <div class="art-meta">
        <span class="art-tag">${a.tag}</span>
        <span class="art-date">${a.date}</span>
      </div>
      <div class="art-title">${a.title}</div>
      <p class="art-excerpt">${a.excerpt}</p>
      <div class="art-footer">
        <span class="art-read-time">${a.readTime}</span>
        <button class="art-btn" data-id="${a.id}">
          ${readLabel}
          <svg fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
      </div>
    `;
    grid.appendChild(card);
  });
  // Re-attach cursor hover to new card elements
  grid.querySelectorAll('.art-card, .art-btn').forEach(el => {
    el.addEventListener('mouseenter', () => ring.style.borderColor = 'rgba(37,99,235,0.9)');
    el.addEventListener('mouseleave', () => ring.style.borderColor = 'rgba(37,99,235,0.5)');
  });
}

/* ── Article reader modal ────────────────────────────────────────────────── */
function setupArticleReader() {
  function openArticle(id) {
    const a = ARTICLES.find(x => x.id === id);
    if (!a) return;
    document.getElementById('readerTag').textContent    = a.tag;
    document.getElementById('readerTitle').textContent  = a.title;
    document.getElementById('readerByline').textContent = `${a.date} · ${a.readTime}`;
    document.getElementById('readerBody').innerHTML     = a.body;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeReader() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  grid.addEventListener('click', e => {
    const btn = e.target.closest('[data-id]');
    if (btn) openArticle(+btn.dataset.id);
  });
  closeBtn.addEventListener('click', closeReader);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeReader(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeReader(); });

  document.querySelectorAll('.reader-close').forEach(el => {
    el.addEventListener('mouseenter', () => ring.style.borderColor = 'rgba(37,99,235,0.9)');
    el.addEventListener('mouseleave', () => ring.style.borderColor = 'rgba(37,99,235,0.5)');
  });
}

/* ── i18n ────────────────────────────────────────────────────────────────── */
function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  document.documentElement.lang = lang;

  // Update all lang buttons (desktop + mobile)
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  const t = I18N[lang];
  if (!t) return;

  // textContent translations
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const val = t[el.dataset.i18n];
    if (val !== undefined) el.textContent = val;
  });

  // innerHTML translations (for elements with nested HTML like <span> in titles)
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const val = t[el.dataset.i18nHtml];
    if (val !== undefined) el.innerHTML = val;
  });

  // Update typing roles and reset animation
  const newRoles = t['hero.roles'] || I18N.en['hero.roles'];
  roles.splice(0, roles.length, ...newRoles);
  ri = 0; ci = 0; del = false;

  // Re-render article cards with updated "Read" label
  renderArticles();
}

function setupLangButtons() {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => setLang(btn.dataset.lang));
  });
}


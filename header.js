/* Route 66 Logbook · shared site header
   Edit this file once and the menu updates on every page.
   Usage on any page:
     <site-header></site-header>
     <script src="/header.js" defer></script>

   Two links: "The app" (the home page that describes the app) and "The
   route", a menu of History, Prepare your trip and the guides.

   On the home page the hero already shows the big logo, so it uses
     <site-header variant="overlay"></site-header>
   which drops the logo and floats the links over the hero, in white.

   The labels follow <html lang>: the French and Spanish home pages get their
   own words, and "The app" points back to their own home page. History,
   Prepare and the guides are English-only pages, so their links do not
   change with the language. */
(function () {
  const LABELS = {
    en: { app: 'The app',  route: 'The route', history: 'History',  prepare: 'Prepare your trip',  guides: 'Route 66 guides', home: '/' },
    fr: { app: "L'appli",  route: 'La route',  history: 'Histoire', prepare: 'Préparer son voyage', guides: 'Guides Route 66', home: '/fr/' },
    es: { app: 'La app',   route: 'La ruta',   history: 'Historia', prepare: 'Preparar el viaje',  guides: 'Guías de la Route 66', home: '/es/' },
  };

  const template = (t, active) => `
    <style>
      :host { display: block; position: relative; z-index: 50; font-family: 'Public Sans', sans-serif; }
      :host([variant="overlay"]) { position: absolute; top: 0; left: 0; right: 0; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      header {
        display: flex; align-items: center; justify-content: space-between;
        max-width: 1100px; margin: 0 auto; padding: 22px 52px; min-height: 96px;
      }
      :host([variant="overlay"]) header { max-width: none; justify-content: flex-end; padding: 34px 52px; }
      a { color: inherit; }
      .logo { display: flex; align-items: center; gap: 14px; text-decoration: none; color: #2b3033; }
      .logo img { width: 52px; height: 52px; object-fit: contain; display: block; flex-shrink: 0; }
      .logo-word { font-weight: 700; font-size: 16px; letter-spacing: -0.3px; }
      .logo-word span { color: #ea5b56; }
      :host([variant="overlay"]) .logo { display: none; }

      nav { display: flex; align-items: center; gap: 30px; }
      .item {
        font: inherit; font-size: 12px; font-weight: 600; letter-spacing: 1.2px; text-transform: uppercase;
        color: #2b3033; text-decoration: none; background: none; border: 0; cursor: pointer;
        display: inline-flex; align-items: center; gap: 7px; padding: 8px 0;
        opacity: 0.6; transition: opacity 0.2s, color 0.2s;
      }
      .item:hover, .item[aria-expanded="true"], .item.active { opacity: 1; }
      .item.active { color: #ea5b56; }
      .item svg { width: 10px; height: 10px; transition: transform 0.2s; }
      .item[aria-expanded="true"] svg { transform: rotate(180deg); }
      :host([variant="overlay"]) .item { color: #fff; opacity: 0.85; text-shadow: 0 1px 8px rgba(0,0,0,0.35); }
      :host([variant="overlay"]) .item:hover, :host([variant="overlay"]) .item[aria-expanded="true"] { opacity: 1; }

      .drop { position: relative; }
      .menu {
        position: absolute; top: calc(100% + 10px); right: -14px; min-width: 230px;
        background: #fff; border: 1px solid rgba(43,48,51,0.08); border-radius: 16px;
        box-shadow: 0 20px 44px -16px rgba(43,48,51,0.35);
        padding: 8px; list-style: none;
        opacity: 0; visibility: hidden; transform: translateY(-6px);
        transition: opacity 0.18s, transform 0.18s, visibility 0s linear 0.18s;
      }
      .drop.open .menu { opacity: 1; visibility: visible; transform: none; transition: opacity 0.18s, transform 0.18s; }
      .menu a {
        display: block; padding: 11px 14px; border-radius: 10px; text-decoration: none;
        font-size: 14px; font-weight: 600; color: #2b3033; transition: background 0.15s, color 0.15s;
      }
      .menu a:hover, .menu a:focus-visible { background: #f7f4f0; color: #ea5b56; outline: none; }
      .menu a[aria-current="page"] { color: #ea5b56; }

      .item:focus-visible { outline: 2px solid #6daeab; outline-offset: 4px; border-radius: 4px; }

      @media (max-width: 820px) {
        header { padding: 18px 24px; min-height: 80px; }
        :host([variant="overlay"]) header { padding: 22px 24px; }
        .logo img { width: 44px; height: 44px; }
        .logo-word { font-size: 15px; }
        nav { gap: 20px; }
      }
      @media (max-width: 420px) {
        .logo-word { display: none; }
      }
    </style>
    <header>
      <a class="logo" href="${t.home}">
        <img src="/images/route66logbook-logo-shield.png" alt="">
        <span class="logo-word">Route 66 <span>Logbook</span></span>
      </a>
      <nav aria-label="Main">
        <a class="item${active === 'app' ? ' active' : ''}" href="${t.home}"${active === 'app' ? ' aria-current="page"' : ''}>${t.app}</a>
        <div class="drop">
          <button class="item${active === 'route' ? ' active' : ''}" type="button" aria-expanded="false" aria-haspopup="true" aria-controls="route-menu">
            ${t.route}
            <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3.5l3 3 3-3"/></svg>
          </button>
          <ul class="menu" id="route-menu">
            <li><a href="/history/">${t.history}</a></li>
            <li><a href="/prepare/">${t.prepare}</a></li>
            <li><a href="/guides/">${t.guides}</a></li>
          </ul>
        </div>
      </nav>
    </header>
  `;

  class SiteHeader extends HTMLElement {
    connectedCallback() {
      if (this.shadowRoot) return;
      const lang = (document.documentElement.lang || 'en').slice(0, 2);
      const t = LABELS[lang] || LABELS.en;
      const path = location.pathname;
      const inRoute = /^\/(history|prepare|guides)(\/|$)/.test(path);
      const active = inRoute ? 'route' : (path === t.home || path === '/' || path === '/index.html') ? 'app' : '';

      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = template(t, active);

      // Mark the page we are on inside the menu.
      root.querySelectorAll('.menu a').forEach((a) => {
        if (path.startsWith(a.getAttribute('href').replace(/\/$/, ''))) a.setAttribute('aria-current', 'page');
      });

      const drop = root.querySelector('.drop');
      const button = root.querySelector('.drop button');
      const links = [...root.querySelectorAll('.menu a')];
      const setOpen = (open) => {
        drop.classList.toggle('open', open);
        button.setAttribute('aria-expanded', String(open));
      };

      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = !drop.classList.contains('open');
        setOpen(open);
        if (open && e.detail === 0) links[0].focus(); // opened from the keyboard
      });

      // Hover opens it too, on devices that can hover.
      if (window.matchMedia('(hover: hover)').matches) {
        let timer;
        drop.addEventListener('mouseenter', () => { clearTimeout(timer); setOpen(true); });
        drop.addEventListener('mouseleave', () => { timer = setTimeout(() => setOpen(false), 160); });
      }

      // Close on a click elsewhere, on Escape, or when focus leaves the menu.
      document.addEventListener('click', (e) => { if (!e.composedPath().includes(this)) setOpen(false); });
      root.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && drop.classList.contains('open')) { setOpen(false); button.focus(); }
        if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && drop.classList.contains('open')) {
          e.preventDefault();
          const i = links.indexOf(root.activeElement);
          const next = e.key === 'ArrowDown' ? (i + 1) % links.length : (i <= 0 ? links.length - 1 : i - 1);
          links[next].focus();
        }
      });
      drop.addEventListener('focusout', (e) => { if (!drop.contains(e.relatedTarget)) setOpen(false); });
    }
  }
  customElements.define('site-header', SiteHeader);
})();

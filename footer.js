/* Route 66 Logbook · shared site footer
   Edit this file once and the footer updates on every page. The main menu
   (History, Prepare, the guides, the app) lives in header.js; the footer
   keeps the secondary links.
   Usage on any page:
     <site-footer></site-footer>
     <script src="/footer.js" defer></script>

   The words and link prefixes follow <html lang> (en / fr / es). It also draws
   the language switcher from the page's <link rel="alternate" hreflang> tags
   (none on a page = no switcher), (the home page included, so every page has the same footer). The choice is remembered in localStorage
   under r66lang, as switcher.js does for the home page.
*/
(function () {
  const TEXT = {
    en: { prefix: '', photos: 'All photographs on this site are © Carole Richard unless credited otherwise. Please don’t copy, repost or reuse them without asking:', tagline: 'Keep the Mother Road Alive.', press: 'Press', privacy: 'Privacy', terms: 'Terms', guidelines: 'Guidelines', help: 'Help',
          instagram: 'Route 66 Logbook on Instagram', facebook: 'Route 66 Logbook on Facebook', copy: 'Built by a Route 66 lover', switchAria: 'Choose a language' },
    fr: { prefix: '/fr', photos: 'Toutes les photos de ce site sont © Carole Richard, sauf mention contraire. Merci de ne pas les copier, republier ni réutiliser sans demander :', tagline: 'Faire vivre la Mother Road.', press: 'Presse', privacy: 'Confidentialité', terms: 'Conditions', guidelines: 'Règles', help: 'Aide',
          instagram: 'Route 66 Logbook sur Instagram', facebook: 'Route 66 Logbook sur Facebook', copy: 'Créé par passion pour la Route 66', switchAria: 'Choisir une langue' },
    es: { prefix: '/es', photos: 'Todas las fotografías de este sitio son © Carole Richard, salvo que se indique lo contrario. Por favor, no las copies, no las vuelvas a publicar ni las reutilices sin pedir permiso:', tagline: 'Mantén viva la Mother Road.', press: 'Prensa', privacy: 'Privacidad', terms: 'Términos', guidelines: 'Normas', help: 'Ayuda',
          instagram: 'Route 66 Logbook en Instagram', facebook: 'Route 66 Logbook en Facebook', copy: 'Creado con pasión por la Route 66', switchAria: 'Elegir idioma' },
  };
  const ENDONYM = { en: 'English', fr: 'Français', es: 'Español' };

  const template = (t) => `
    <style>
      :host { display: block; }
      footer {
        background: #2b3033; padding: 44px 52px;
        display: flex; align-items: center; justify-content: space-between;
        flex-wrap: wrap; gap: 18px;
        font-family: 'Public Sans', sans-serif;
      }
      a { color: inherit; }
      .footer-left { display: flex; flex-direction: column; gap: 6px; }
      .footer-logo { font-weight: 700; font-size: 18px; color: #fff; letter-spacing: -0.3px; }
      .footer-logo span { color: #ea5b56; }
      .footer-tagline { font-family: 'Instrument Serif', serif; font-style: italic; font-size: 14px; color: rgba(255,255,255,0.3); }
      .footer-right { display: flex; flex-direction: column; align-items: flex-end; gap: 12px; }
      .footer-links { display: flex; gap: 22px; flex-wrap: wrap; justify-content: flex-end; }
      .footer-links a {
        font-size: 12px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;
        color: rgba(255,255,255,0.5); text-decoration: none; transition: color 0.2s;
      }
      .footer-links a:hover { color: #ea5b56; }
      .footer-socials { display: flex; align-items: center; gap: 18px; }
      .footer-socials a { color: rgba(255,255,255,0.4); display: inline-flex; transition: color 0.2s, transform 0.2s; }
      .footer-socials a:hover { color: #ea5b56; transform: translateY(-2px); }
      .footer-socials svg { width: 20px; height: 20px; display: block; }
      .lang-switch { display: flex; justify-content: flex-end; align-items: center; gap: 26px; }
      .lang-switch a {
        font-size: 12px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;
        color: rgba(255,255,255,0.5); text-decoration: none;
        padding-bottom: 4px; border-bottom: 2px solid transparent;
        transition: color 0.2s, border-color 0.2s;
      }
      .lang-switch a:hover { color: #ea5b56; }
      .lang-switch a.is-current { color: #fff; border-bottom-color: #ea5b56; }
      .footer-photos { font-size: 12px; line-height: 1.6; color: rgba(255,255,255,0.35); width: 100%; max-width: 640px; margin: 0 auto; text-align: center; }
      .footer-photos a { text-decoration: underline; text-underline-offset: 2px; }
      .footer-photos a:hover { color: #ea5b56; }
      .footer-copy { font-size: 12px; color: rgba(255,255,255,0.22); width: 100%; text-align: center; margin-top: 8px; }
      @media (max-width: 960px) {
        footer { flex-direction: column; align-items: center; text-align: center; padding: 36px 24px; }
        .footer-left, .footer-right { align-items: center; }
        .footer-links { justify-content: center; }
        .lang-switch { justify-content: center; gap: 18px; }
        .lang-switch a { font-size: 11px; letter-spacing: 0.6px; }
      }
    </style>
    <footer>
      <div class="footer-left">
        <div class="footer-logo">Route 66 <span>Logbook</span></div>
        <div class="footer-tagline">${t.tagline}</div>
      </div>
      <div class="footer-right">
        <!--SWITCH-->
        <div class="footer-links">
          <a href="${t.prefix}/press/">${t.press}</a>
          <a href="${t.prefix}/privacy/">${t.privacy}</a>
          <a href="${t.prefix}/terms/">${t.terms}</a>
          <a href="${t.prefix}/community-guidelines/">${t.guidelines}</a>
          <a href="${t.prefix}/help/">${t.help}</a>
        </div>
        <div class="footer-socials">
          <a href="https://www.instagram.com/route66logbook/" target="_blank" rel="noopener" aria-label="${t.instagram}">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.05.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.05.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.05-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.05-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.3-1.46.72-2.12 1.38C1.36 2.67.94 3.34.63 4.14.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.72 1.46 1.38 2.12.66.66 1.33 1.08 2.12 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56.79-.3 1.46-.72 2.12-1.38.66-.66 1.08-1.33 1.38-2.12.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91-.3-.79-.72-1.46-1.38-2.12C21.33 1.36 20.66.94 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84zM12 16a4 4 0 1 1 4-4 4 4 0 0 1-4 4zm6.41-10.85a1.44 1.44 0 1 0 1.44 1.44 1.44 1.44 0 0 0-1.44-1.44z"/></svg>
          </a>
          <a href="https://www.facebook.com/Route66Logbook/" target="_blank" rel="noopener" aria-label="${t.facebook}">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.24 2.69.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z"/></svg>
          </a>
        </div>
      </div>
      <div class="footer-copy">© ${new Date().getFullYear()} Route 66 Logbook · ${t.copy}</div>
      <p class="footer-photos">${t.photos} <a href="mailto:hello@route66logbook.com">hello@route66logbook.com</a></p>
    </footer>
  `;

  // Remember the reader's choice. Never silent: if storage is blocked, say so,
  // and for the English home page fall back to ?lang=en, which the first-visit
  // redirect on "/" also honours, so the choice still sticks for that navigation.
  function remember(code) {
    try { localStorage.setItem('r66lang', code); return true; }
    catch (e) { console.warn('[footer] could not store the language preference:', e && e.message); return false; }
  }

  function switcherHtml(t, lang) {
        const seen = {};
    const items = [];
    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((l) => {
      const code = (l.getAttribute('hreflang') || '').toLowerCase();
      if (!ENDONYM[code] || seen[code]) return;
      let href;
      try { href = new URL(l.getAttribute('href'), location.href).pathname; } catch (e) { return; }
      seen[code] = true;
      items.push({ code, href });
    });
    if (items.length < 2) {
      if (!items.length) console.info('[footer] no hreflang alternates on this page, so no language switcher is shown');
      return '';
    }
    items.sort((a, b) => Object.keys(ENDONYM).indexOf(a.code) - Object.keys(ENDONYM).indexOf(b.code));
    return `<nav class="lang-switch" aria-label="${t.switchAria}">` + items.map((i) =>
      `<a href="${i.href}"${i.code === lang ? ' class="is-current" aria-current="true"' : ''} hreflang="${i.code}" data-lang="${i.code}">${ENDONYM[i.code]}</a>`
    ).join('') + '</nav>';
  }

  class SiteFooter extends HTMLElement {
    connectedCallback() {
      if (this.shadowRoot) return;
      const lang = (document.documentElement.lang || 'en').slice(0, 2).toLowerCase();
      const t = TEXT[lang] || TEXT.en;
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = template(t).replace('<!--SWITCH-->', switcherHtml(t, TEXT[lang] ? lang : 'en'));
      root.querySelectorAll('.lang-switch a[data-lang]').forEach((a) => {
        a.addEventListener('click', () => {
          const code = a.getAttribute('data-lang');
          if (!remember(code) && code === 'en' && a.getAttribute('href') === '/') a.setAttribute('href', '/?lang=en');
        });
      });
    }
  }
  customElements.define('site-footer', SiteFooter);
})();

/* Route 66 Logbook · language switcher
   The links work without this file — they are plain hrefs. This exists to
   record the choice, so the first-visit redirect on the English page never
   fights a decision the reader has already made.

   It must not fail silently. If storage is unavailable (private window,
   blocked site data) it says so in the console and falls back to ?lang=en,
   which the redirect also honours, so choosing English still sticks for that
   navigation instead of quietly bouncing the reader back to /fr/. */
(function () {
  var links = document.querySelectorAll('.lang-switch a[data-lang]');
  if (!links.length) {
    console.warn('[switcher] no .lang-switch links on this page — the switcher is not doing anything');
    return;
  }

  function remember(code) {
    try {
      localStorage.setItem('r66lang', code);
      return true;
    } catch (e) {
      console.warn('[switcher] could not store the language preference:', e && e.message);
      return false;
    }
  }

  Array.prototype.forEach.call(links, function (a) {
    a.addEventListener('click', function () {
      var code = a.getAttribute('data-lang');
      if (!remember(code) && code === 'en') {
        /* Set before the browser follows the link, so the choice survives the
           navigation even with no storage at all. */
        a.setAttribute('href', '/?lang=en');
      }
    });
  });
})();

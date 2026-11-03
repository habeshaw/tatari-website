(function () {
  const body = document.body;
  const enButton = document.getElementById('btn-en');
  const amButton = document.getElementById('btn-am');
  const menuButton = document.getElementById('menu-toggle');
  const nav = document.getElementById('main-nav');

  function setLang(lang) {
    const useAmharic = lang === 'am';
    body.classList.toggle('lang-am', useAmharic);
    document.documentElement.lang = useAmharic ? 'am' : 'en';
    document.querySelectorAll('[data-en][data-am]').forEach((element) => {
      element.textContent = useAmharic ? element.dataset.am : element.dataset.en;
    });
    enButton.classList.toggle('active', !useAmharic);
    amButton.classList.toggle('active', useAmharic);
    enButton.setAttribute('aria-pressed', String(!useAmharic));
    amButton.setAttribute('aria-pressed', String(useAmharic));
    try { localStorage.setItem('tatari-lang', lang); } catch (_) { /* storage may be disabled */ }
  }

  enButton.addEventListener('click', () => setLang('en'));
  amButton.addEventListener('click', () => setLang('am'));
  menuButton.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
  });
  nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    nav.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
  }));
  document.getElementById('year').textContent = new Date().getFullYear();
  let savedLanguage = 'en';
  try { savedLanguage = localStorage.getItem('tatari-lang') || 'en'; } catch (_) { /* use default */ }
  setLang(savedLanguage);
})();

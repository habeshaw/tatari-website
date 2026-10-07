document.getElementById('year').textContent = new Date().getFullYear();
  document.getElementById('year2').textContent = new Date().getFullYear();
  function setLang(lang) {
    document.body.classList.toggle('lang-am', lang === 'am');
    document.getElementById('btn-en').classList.toggle('active', lang === 'en');
    document.getElementById('btn-am').classList.toggle('active', lang === 'am');
    document.documentElement.lang = lang;
    try { localStorage.setItem('tatari-lang', lang); } catch (e) {}
  }
  (function initLang() {
    var saved = 'en';
    try { saved = localStorage.getItem('tatari-lang') || 'en'; } catch (e) {}
    setLang(saved);
  })();

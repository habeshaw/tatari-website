(() => {
  const am = {
    'Opportunities': 'ዕድሎች',
    'Academy & Store': 'አካዳሚ እና መደብር',
    'Testimonials': 'ምስክርነቶች',
    'Login': 'ግቡ',
    'My Portal': 'የኔ መግቢያ',
    'Sign Out': 'ውጡ',
    '+ Post Vacancy': '+ ክፍት ቦታ ይለጥፉ',
    'Explore Opportunities ↗': 'ዕድሎችን ይመልከቱ ↗',
    '+ Add Testimonial': '+ ምስክርነት ያክሉ',
    'GLOBAL SEARCH ENGINE': 'ዓለም አቀፍ የፍለጋ ሞተር',
    'Jobs, Freelance Contracts & Resources': 'ሥራዎች፣ የፍሪላንስ ውሎች እና ግብአቶች',
    '🔍 All Opportunities': '🔍 ሁሉም ዕድሎች',
    '🏢 Corporate Careers': '🏢 የድርጅት ሥራዎች',
    '💼 Freelance Projects': '💼 የፍሪላንስ ፕሮጀክቶች',
    '✦ Digital Store & Courses': '✦ ዲጂታል መደብር እና ስልጠናዎች'
  };

  window.TATARI_I18N = {
    translate(root, lang) {
      if (lang !== 'am') return;
      const elements = root.querySelectorAll('h1, h2, h3, h4, p, a, button, span, label, small');
      elements.forEach(el => {
        const text = el.textContent.trim();
        if (am[text]) {
          el.textContent = am[text];
        }
      });
    }
  };
})();
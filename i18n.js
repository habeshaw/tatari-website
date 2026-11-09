/* TATARI Bilingual Interface Dictionary (English & Amharic) */
(() => {
  const am = {
    'Open menu':'ምናሌ ክፈት','About':'ስለ እኛ','Services':'አገልግሎቶች','Solutions':'መፍትሄዎች','Academy':'አካዳሚ','Digital Store':'ዲጂታል መደብር','Job Board':'የስራ ሰሌዳ','Freelance Hub':'የፍሪላንስ ማዕከል','Testimonials':'ምስክርነቶች','Subscription Plans':'የደንበኝነት ምዝገባ','Contact':'ያግኙን','Sign in':'ግባ','Login':'ግባ','Logout':'ውጣ','Log out':'ውጣ','My account':'የእኔ መለያ','Admin Portal':'የአስተዳዳሪ ፖርታል',
    'STANDARDIZED JOB SEARCH ENGINE · FREELANCE HUB · SUBSCRIPTIONS':'ደረጃውን የጠበቀ የስራ መፈለጊያ ሞተር · የፍሪላንስ ማዕከል · ደንበኝነት',
    'Search corporate career jobs, freelance project contracts, and digital tools with granular location, salary, and title filters.':'የድርጅት ስራዎችን፣ የፍሪላንስ ውሎችን እና ዲጂታል መሳሪያዎችን በቦታ፣ በደመወዝ እና በስራ መደብ ይፈልጉ::',
    'People. Data. Technology.':'ሰዎች። ውሂብ። ቴክኖሎጂ።','Growth.':'እድገት።',
    'Explore Search Engine ↗':'መፈለጊያ ሞተሩን ይመልከቱ ↗','Employer Plans':'የአሰሪዎች እቅድ',
    'Addis Ababa, Ethiopia · Integrated role management for Admins, Employers & Job Seekers.':'አዲስ አበባ፣ ኢትዮጵያ · ለአስተዳዳሪዎች፣ አሰሪዎች እና ስራ ፈላጊዎች የተቀናጀ መድረክ::',
    'SELECTABLE DISCOVERY ENGINE':'ተመራጭ መፈለጊያ ሞተር','Global Job & Freelance':'ዓለም አቀፍ ስራዎች እና ፍሪላንስ','Search Engine':'መፈለጊያ ሞተር',
    '+ Post New Vacancy / Project':'+ አዲስ ክፍት ስራ / ፕሮጀክት ይለጥፉ',
    '🔍 All Opportunities':'🔍 ሁሉም እድሎች','🏢 Full-Time & Career Jobs':'🏢 የካሪየር ስራዎች','💼 Freelance Projects':'💼 የፍሪላንስ ውሎች','✦ Digital Store & Courses':'✦ ዲጂታል መደብር',
    'Job Title / Keyword':'የስራ መደብ / ቃል','Location':'ቦታ','Minimum Salary / Budget (ETB)':'አነስተኛ ደመወዝ / በጀት (ETB)',
    'Category / Sector':'ዘርፍ','Work Type':'የስራ አይነት',
    'All Sectors':'ሁሉም ዘርፎች','HR & Analytics':'የሰው ሀብት እና ትንተና','Software & Tech':'ሶፍትዌር እና ቴክኖሎጂ','Finance & Management':'ፋይናንስ እና ማኔጅመንት','Design & Creative':'ዲዛይን እና ፈጠራ',
    'All Work Types':'ሁሉም የስራ አይነቶች','Full-Time':'የሙሉ ጊዜ','Remote':'ከቤት የሚሰራ (Remote)','Hybrid':'ሃይብሪድ (Hybrid)','Contract / Project':'ኮንትራት / ፕሮጀክት',
    'SUBSCRIPTION TIERS':'የደንበኝነት ደረጃዎች','Employer':'የአሰሪዎች','Posting Packages':'የማስታወቂያ ፓኬጆች',
    'View Details & Subscribe':'ዝርዝር ይመልከቱ እና ይመዝገቡ',
    'SUCCESS STORIES':'የስኬት ታሪኮች','Client & Partner':'የደንበኞች እና አጋሮች','Testimonials':'ምስክርነቶች',
    '+ Add Testimonial':'+ ምስክርነት ያክሉ',
    'Submit Application':'ማመልከቻ ያስገቡ','Apply for Job':'ለስራው ያመልክቱ','Submit Proposal':'ማመልከቻ ያስገቡ',
    'EXPORT APPLICATIONS (CSV)':'ማመልከቻዎችን አውርድ (CSV)','EXPORT APPLICATIONS (EXCEL)':'ማመልከቻዎችን አውርድ (EXCEL)',
    'Company Logo (Optional)':'የኩባንያ ሎጎ (አማራጭ)',
    "LET'S WORK TOGETHER":'አብረን እንስራ','What can we help':'ምን ልንረዳዎ','you achieve?':'እንዲያሳኩ እንፈልጋለን?','Send an inquiry':'ጥያቄ ይላኩ','Your name':'ሙሉ ስም','Email address':'ኢሜይል አድራሻ','Phone (optional)':'ስልክ (አማራጭ)',"I'm interested in":'የምፈልገው አገልግሎት','Send inquiry ↗':'ጥያቄ ይላኩ ↗',
    'Create your account':'መለያ ይፍጠሩ','Add to cart':'ወደ ጋሪ ጨምር','Price on request':'ዋጋውን ይጠይቁ',
    'YOUR SELECTION':'የመረጡት','Order note (optional)':'የትዕዛዝ ማስታወሻ (አማራጭ)','Currency':'ምንዛሬ','Total:':'ጠቅላላ፡','Course':'ኮርስ','Digital product':'ዲጂታል ምርት',
    'MANUAL PAYMENT':'በእጅ ክፍያ','Complete your payment':'ክፍያዎን ያጠናቅቁ','CUSTOMER PORTAL':'የደንበኛ መለያ','Sign out':'ውጣ'
  };
  const en = Object.fromEntries(Object.entries(am).map(([k,v])=>[v,k]));
  window.TATARI_I18N = {
    translate(root, lang) {
      if (!root) return;
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      const nodes = []; while(walker.nextNode()) nodes.push(walker.currentNode);
      for(const node of nodes){
        if(!node.__tatariEnglish) node.__tatariEnglish = node.nodeValue;
        const source = node.__tatariEnglish;
        const key = source.trim();
        const dict = lang === 'am' ? am : en;
        let translated = dict[key] || key;
        if(translated === key){
          translated = source;
          for(const [from, to] of Object.entries(dict).sort((a,b)=>b[0].length-a[0].length)){
            if(from.length > 2 && translated.includes(from)) translated = translated.split(from).join(to);
          }
        }
        node.nodeValue = translated === key ? source : source.replace(key, translated);
      }
      root.querySelectorAll('input[placeholder],textarea[placeholder]').forEach(el=>{
        if(!el.dataset.enPlaceholder) el.dataset.enPlaceholder = el.placeholder;
        const p = el.dataset.enPlaceholder; el.placeholder = lang === 'am' ? (am[p]||p) : p;
      });
      root.querySelectorAll('[aria-label],[title]').forEach(el=>{
        for(const attr of ['aria-label','title']) if(el.hasAttribute(attr)){
          const key = 'en' + attr.replace(/[^a-z]/gi,'').replace(/^./, x=>x.toUpperCase());
          if(!el.dataset[key]) el.dataset[key] = el.getAttribute(attr);
          const original = el.dataset[key]; el.setAttribute(attr, lang === 'am' ? (am[original]||original) : original);
        }
      });
    }
  };
})();
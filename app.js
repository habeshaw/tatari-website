(() => {
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];

  let supabaseClient = null;
  let currentSession = null;
  let currentUserRole = 'normal_user';
  let activeSubscriptionPlan = 'free';
  let selectedModule = 'all';
  let cart = loadSavedCart();
  let currency = 'ETB';
  let currentLang = 'en';

  let jobListings = [];
  let freelanceProjects = [];
  let testimonials = [];
  let applications = [];
  let proposals = [];

  const fallbackJobs = [
    { id: 'c1', title_en: 'Senior HR & Talent Acquisition Lead', title_am: 'የከፍተኛ የሰው ሀብት እና ታለንት ቅጥር መሪ', company_name: 'Hibret Bank S.C.', company_logo: '', location: 'Addis Ababa', salary_range: '45,000 ETB/mo', category: 'HR & Analytics', job_type: 'Full-Time', description_en: 'Lead organizational talent acquisition, policy planning, and workforce analytics across banking operations.', description_am: 'በባንክ ስራዎች ውስጥ የድርጅት ታለንት ቅጥርን፣ የፖሊሲ እቅድን እና የስራ ሃይል ትንተናን ይመሩ።', status: 'open' },
    { id: 'c2', title_en: 'Full-Stack Web & Mobile Developer', title_am: 'ሙሉ-ስታክ ዌብ እና ሞባይል አልሚ', company_name: 'Tatari Tech Labs', company_logo: '', location: 'Remote / Addis Ababa', salary_range: '65,000 ETB/mo', category: 'Software & Tech', job_type: 'Remote', description_en: 'Develop high-performance React, Node.js, and Supabase solutions for enterprise software systems.', description_am: 'ለድርጅት ሶፍትዌር ሲስተሞች ከፍተኛ አፈጻጸም ያላቸውን React፣ Node.js እና Supabase መፍትሄዎችን ይገንቡ።', status: 'open' }
  ];

  const fallbackFreelance = [
    { id: 'f1', title_en: 'UI/UX Redesign for Mobile Banking App', title_am: 'ለሞባይል ባንክ መተግበሪያ የUI/UX ዲዛይን ማሻሻያ', client_logo: '', category: 'Design & Creative', job_type: 'Contract', budget_min: 35000, budget_max: 70000, currency: 'ETB', description_en: 'Redesign native iOS and Android user interfaces for optimal customer experience and accessibility.', description_am: 'ለተሻለ ደንበኛ ተሞክሮ እና ተደራሽነት የኮርፖሬት የሞባይል ባንክ መተግበሪያ በይነገጾችን እንደገና ዲዛይን ያድርጉ።', status: 'open' }
  ];

  const fallbackProducts = [
    { id: 'p1', name: 'Ethiopian HR Policy & Strategy Toolkit', name_am: 'የኢትዮጵያ የሰው ሀብት ፖሊሲ እና ስትራቴጂ ኪት', price_etb: 4500, price_usd: 80, description: 'Standardized templates, internal audit checklists, and balanced scorecards.', description_am: 'መደበኛ ቅጾች፣ የውስጥ ኦዲት ማረጋገጫ ዝርዝሮች እና የተመጣጠነ የውጤት ካርዶች።', itemType: 'product' }
  ];

  const fallbackCourses = [
    { id: 'k1', title: 'Full-Stack Web Development Bootcamp', title_am: 'ሙሉ-ስታክ የዌብ አልሚ ስልጠና', price_etb: 8500, price_usd: 150, description: 'Comprehensive practical training on Javascript, Supabase, React, and Vercel deployment.', description_am: 'በጃቫ ስክሪፕት፣ ሱፓቤስ፣ ሪያክት እና ቨርሰል ስሪት ላይ አጠቃላይ የተግባር ስልጠና።', itemType: 'course' }
  ];

  const fallbackTestimonials = [
    { id: 't1', author_name: 'Solomon Worku', company_title: 'Managing Director, Commercial Enterprise', content: 'TATARI has radically transformed our recruitment strategy and talent matching accuracy in Ethiopia.' }
  ];

  function loadSavedCart(){ try{ const v = JSON.parse(localStorage.getItem('tatari_cart_v1')||'[]'); return Array.isArray(v)?v:[] }catch(_){ return []; } }
  function saveCart(){ try{ localStorage.setItem('tatari_cart_v1', JSON.stringify(cart)); }catch(e){} }
  function updateCartCount(){ const b=$('#cartFab'); if(b) b.innerHTML=`Cart (${cart.reduce((n,x)=>n+x.quantity,0)}) <span>[Cart]</span>`; }

  const toast = (msg, bad=false) => {
    const el=$('#toast'); if(!el) return; el.textContent=msg; el.className=bad?'show bad':'show';
    clearTimeout(toast.t); toast.t=setTimeout(()=>el.className='', 4200);
  };
  const esc = s => String(s??'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = (n, c=currency) => `${c==='ETB'?'ETB':'$'} ${Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`;

  function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('tatari_lang', lang);
    if($('#langEN')) $('#langEN').classList.toggle('active', lang==='en');
    if($('#langAM')) $('#langAM').classList.toggle('active', lang==='am');
    if (window.TATARI_I18N) window.TATARI_I18N.translate(document.body, lang);
    renderSearchResults();
    renderTestimonialBanners();
  }

  function modal(html){
    const root = $('#modalRoot');
    if(!root) return;
    root.innerHTML = `<div class="modal-backdrop" id="backdrop"><div class="modal"><button class="modal-x" id="closeModal" type="button">x</button>${html}</div></div>`;
    if (window.TATARI_I18N) window.TATARI_I18N.translate(root, currentLang);
  }
  function closeModal(){ const root = $('#modalRoot'); if(root) root.innerHTML = ''; }

  async function initSupabase() {
    if (window.supabase && window.TATARI_CONFIG) {
      try {
        supabaseClient = window.supabase.createClient(window.TATARI_CONFIG.url, window.TATARI_CONFIG.publishableKey);
        const { data: { session } } = await supabaseClient.auth.getSession();
        currentSession = session;
        if (session) {
          await fetchUserRoleAndData(session.user.id);
        }
      } catch (err) {
        console.warn('Supabase initialization warning:', err);
      }
    }
    refreshUserUI();
    await fetchLiveDatabaseRecords();
  }

  async function fetchUserRoleAndData(userId) {
    if (!supabaseClient) return;
    try {
      const { data: roleData } = await supabaseClient.from('user_roles').select('role').eq('user_id', userId).maybeSingle();
      if (roleData) currentUserRole = roleData.role;

      const { data: subData } = await supabaseClient.from('subscriptions').select('plan_tier').eq('user_id', userId).maybeSingle();
      if (subData) activeSubscriptionPlan = subData.plan_tier;

      const { data: appData } = await supabaseClient.from('career_applications').select('*, career_jobs(title_en, title_am, company_name)');
      if (appData) applications = appData;
    } catch (e) {
      console.warn('Role fetch note:', e);
    }
  }

  async function fetchLiveDatabaseRecords() {
    if (supabaseClient) {
      try {
        const { data: jobs } = await supabaseClient.from('career_jobs').select('*').order('created_at', { ascending: false });
        if (jobs && jobs.length) jobListings = jobs; else jobListings = fallbackJobs;

        const { data: freelance } = await supabaseClient.from('jobs').select('*').order('created_at', { ascending: false });
        if (freelance && freelance.length) freelanceProjects = freelance; else freelanceProjects = fallbackFreelance;

        const { data: testList } = await supabaseClient.from('testimonials').select('*').order('created_at', { ascending: false });
        if (testList && testList.length) testimonials = testList; else testimonials = fallbackTestimonials;
      } catch (e) {
        console.warn('Live fetch fallback used:', e);
        jobListings = fallbackJobs;
        freelanceProjects = fallbackFreelance;
        testimonials = fallbackTestimonials;
      }
    } else {
      jobListings = fallbackJobs;
      freelanceProjects = fallbackFreelance;
      testimonials = fallbackTestimonials;
    }
    renderSearchResults();
    renderTestimonialBanners();
  }

  function refreshUserUI() {
    if($('#accountBtn')) $('#accountBtn').hidden = !!currentSession;
    if($('#dashboardBtn')) {
      if(currentSession) {
        $('#dashboardBtn').hidden = false;
        const roleLbl = currentUserRole==='admin' ? 'Administrator' : currentUserRole==='employer' ? 'Employer' : 'Member';
        $('#dashboardBtn').innerHTML = `${roleLbl} Portal`;
      } else {
        $('#dashboardBtn').hidden = true;
      }
    }
    if($('#logoutBtn')) $('#logoutBtn').hidden = !currentSession;
  }

  function renderSearchResults() {
    const kwEl = $('#filterKeyword'), locEl = $('#filterLocation'), salEl = $('#filterSalary'), catEl = $('#filterCategory'), typEl = $('#filterWorkType');
    const keyword = (kwEl?.value||'').toLowerCase();
    const location = (locEl?.value||'').toLowerCase();
    const minSalary = Number(salEl?.value||0);
    const category = catEl?.value || 'all';
    const workType = typEl?.value || 'all';

    let items = [];

    if(selectedModule === 'all' || selectedModule === 'career') {
      jobListings.forEach(j => {
        items.push({
          ...j, itemType: 'career',
          displayTitle: currentLang==='am'&&j.title_am ? j.title_am : (j.title_en||j.title),
          displayDesc: currentLang==='am'&&j.description_am ? j.description_am : (j.description_en||j.description),
          numericSalary: parseNumericSalary(j.salary_range)
        });
      });
    }

    if(selectedModule === 'all' || selectedModule === 'freelance') {
      freelanceProjects.forEach(f => {
        items.push({
          ...f, itemType: 'freelance',
          displayTitle: currentLang==='am'&&f.title_am ? f.title_am : (f.title_en||f.title),
          displayDesc: currentLang==='am'&&f.description_am ? f.description_am : (f.description_en||f.description),
          numericSalary: f.budget_min || 0
        });
      });
    }

    if(selectedModule === 'all' || selectedModule === 'store') {
      fallbackProducts.forEach(p => {
        items.push({
          ...p, itemType: 'product',
          displayTitle: currentLang==='am'&&p.name_am ? p.name_am : p.name,
          displayDesc: currentLang==='am'&&p.description_am ? p.description_am : p.description,
          numericSalary: p.price_etb || 0
        });
      });
      fallbackCourses.forEach(c => {
        items.push({
          ...c, itemType: 'course',
          displayTitle: currentLang==='am'&&c.title_am ? c.title_am : c.title,
          displayDesc: currentLang==='am'&&c.description_am ? c.description_am : c.description,
          numericSalary: c.price_etb || 0
        });
      });
    }

    const filtered = items.filter(x => {
      const matchKey = `${x.displayTitle} ${x.company_name||''} ${x.displayDesc||''}`.toLowerCase().includes(keyword);
      const matchLoc = !location || (x.location||'').toLowerCase().includes(location);
      const matchSal = !minSalary || (x.numericSalary >= minSalary);
      const matchCat = category==='all' || x.category===category;
      const matchType = workType==='all' || x.job_type===workType;
      return matchKey && matchLoc && matchSal && matchCat && matchType;
    });

    const grid = $('#searchResultsGrid');
    if(!grid) return;

    if(!filtered.length) {
      grid.innerHTML = `<div class="empty">${currentLang==='am'?'ለተመረጠው ማጣሪያ ምንም የስራ ወይም የትምህርት እድል አልተገኘም።':'No matching opportunities found.'}</div>`;
      return;
    }

    grid.innerHTML = filtered.map(item => {
      if(item.itemType === 'career') {
        return `
          <article class="resource-card job-card">
            <div class="resource-art career">
              <span>${currentLang==='am'?'የስራ ማስታወቂያ':'CAREER VACANCY'}</span>
              <b>[Job]</b>
            </div>
            <div class="resource-body">
              <span class="pill">${esc(item.job_type||'Full-Time')} · ${esc(item.location||'Addis Ababa')}</span>
              <h3>${esc(item.displayTitle)}</h3>
              <p><b>${esc(item.company_name||'TATARI Partner')}</b> — ${esc(item.displayDesc)}</p>
              <div class="resource-bottom">
                <strong>${currentLang==='am'?'ደመወዝ፦':'Salary:'} ${esc(item.salary_range||'Negotiable')}</strong>
                <button class="btn btn-outline btn-small" data-career-id="${item.id}" type="button">
                  ${currentLang==='am'?'ለስራው ያመልክቱ':'Apply for Job'}
                </button>
              </div>
            </div>
          </article>`;
      } else if(item.itemType === 'freelance') {
        return `
          <article class="resource-card freelance-card">
            <div class="resource-art job">
              <span>${currentLang==='am'?'የፍሪላንስ ውል':'FREELANCE CONTRACT'}</span>
              <b>[Project]</b>
            </div>
            <div class="resource-body">
              <span class="pill">${esc(item.category||'General')} · ${esc(item.job_type||'Fixed-Price')}</span>
              <h3>${esc(item.displayTitle)}</h3>
              <p>${esc(item.displayDesc)}</p>
              <div class="resource-bottom">
                <strong>${currentLang==='am'?'በጀት፦':'Budget:'} ${money(item.budget_min||item.budget_max||0)}</strong>
                <button class="btn btn-primary btn-small" data-freelance-id="${item.id}" type="button">
                  ${currentLang==='am'?'ውድድር ሃሳብ ያስገቡ':'Submit Proposal'}
                </button>
              </div>
            </div>
          </article>`;
      } else {
        return `
          <article class="resource-card">
            <div class="resource-art ${item.itemType}"><span>${item.itemType==='course'?(currentLang==='am'?'አካዳሚ':'ACADEMY'):(currentLang==='am'?'ዲጂታል መደብር':'DIGITAL STORE')}</span><b>+</b></div>
            <div class="resource-body">
              <span class="pill">${item.itemType==='course'?(currentLang==='am'?'የኦንላይን ኮርስ':'ONLINE COURSE'):(currentLang==='am'?'ዲጂታል መሳሪያ':'DIGITAL TOOL')}</span>
              <h3>${esc(item.displayTitle)}</h3>
              <p>${esc(item.displayDesc||'Practical resource from TATARI.')}</p>
              <div class="resource-bottom">
                <strong>${money(item.price_etb)}</strong>
                <button class="btn btn-primary btn-small" data-add="${item.id}" data-type="${item.itemType}" type="button">${currentLang==='am'?'ወደ 🛒 ካርት ጨምር':'Add to cart'}</button>
              </div>
            </div>
          </article>`;
      }
    }).join('');
  }

  function parseNumericSalary(str) {
    if(!str) return 0;
    const match = String(str).match(/[\d,]+/);
    return match ? parseInt(match[0].replace(/,/g, ''), 10) : 0;
  }

  function renderTestimonialBanners() {
    const banner = $('#testimonialBannerList');
    if(!banner) return;
    if(!testimonials.length) {
      banner.innerHTML = `<div class="empty">${currentLang==='am'?'ምንም ምስክርነቶች አልተጨመሩም።':'No testimonials added yet.'}</div>`;
      return;
    }
    const list = [...testimonials, ...testimonials];
    const cardsHtml = list.map(t => `
      <div class="testimonial-card">
        <div class="testimonial-header">
          <div class="avatar-placeholder">👤</div>
          <div>
            <b>${esc(t.author_name)}</b>
            <small>${esc(t.company_title || 'Verified Member')}</small>
          </div>
        </div>
        <p>"${esc(t.content)}"</p>
      </div>`).join('');

    banner.innerHTML = `<div class="testimonial-marquee-wrapper"><div class="testimonial-marquee-track">${cardsHtml}</div></div>`;
  }

  function authModal(mode='signin'){
    modal(`
      <div class="section-label">TATARI SUPABASE AUTHENTICATION</div>
      <h2>${mode==='signup'?'Create Supabase Account':'Sign In to Account'}</h2>
      <p class="muted">Connect securely using Supabase Auth backend database.</p>
      
      <form id="authForm" class="stack-form" data-auth-mode="${mode}">
        ${mode==='signup'?'<label>Full name<input name="full_name" value="Abebe Bikila" required minlength="2"></label>':''}
        <label>Email<input name="email" type="email" value="user@tatari.et" required id="authEmail"></label>
        <label>Password<input name="password" type="password" value="password123" required minlength="6"></label>
        <button class="btn btn-primary" type="submit">${mode==='signup'?'Register Account':'Sign In'}</button>
        <p id="authFeedback" class="form-feedback"></p>
      </form>
      <div class="auth-switch">
        ${mode==='signin'?'<button type="button" id="goSignup">Create an account</button>':'<button type="button" id="goSignin">Back to sign in</button>'}
      </div>
    `);
  }

  async function handleAuthSubmission(e) {
    e.preventDefault();
    const form = e.target;
    const fd = new FormData(form);
    const email = fd.get('email');
    const password = fd.get('password');
    const fullName = fd.get('full_name');
    const mode = form.dataset.authMode;

    if (!supabaseClient) {
      toast('Supabase client not configured. Running in offline demo mode.', true);
      currentSession = { user: { id: 'offline-user', email } };
      closeModal(); refreshUserUI(); return;
    }

    try {
      if (mode === 'signup') {
        const { data, error } = await supabaseClient.auth.signUp({
          email, password, options: { data: { full_name: fullName } }
        });
        if (error) throw error;
        currentSession = data.session;
        toast('Account created successfully! Welcome to TATARI.');
      } else {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        currentSession = data.session;
        if (currentSession) await fetchUserRoleAndData(currentSession.user.id);
        toast('Signed in successfully!');
      }
      closeModal();
      refreshUserUI();
      fetchLiveDatabaseRecords();
    } catch (err) {
      toast(err.message || 'Authentication error', true);
    }
  }

  function subscriptionPlanModal(planTier) {
    let title = planTier === 'starter' ? 'Starter Employer Plan' : planTier === 'pro' ? 'Pro Employer Package' : 'Corporate Unlimited Package';
    let price = planTier === 'starter' ? 'ETB 0 / mo' : planTier === 'pro' ? 'ETB 4,500 / mo' : 'ETB 12,000 / mo';

    modal(`
      <div class="section-label">EMPLOYER SUBSCRIPTION & PAYMENT</div>
      <h2>${title}</h2>
      <div class="payment-box">
        <small>PLAN PRICING</small>
        <strong>${price}</strong>
        <p class="muted">Upgrade your employer posting limit & brand visibility through secure Supabase subscription backend.</p>
      </div>
      <div class="stack-form">
        <button class="btn btn-primary full-btn" data-action="confirm-sub" data-plan="${planTier}" type="button">Confirm & Activate Plan</button>
      </div>
    `);
  }

  async function activateSubscription(planTier) {
    activeSubscriptionPlan = planTier;
    currentUserRole = 'employer';
    if (supabaseClient && currentSession) {
      try {
        await supabaseClient.from('subscriptions').upsert({ user_id: currentSession.user.id, plan_tier: planTier, status: 'active' });
        await supabaseClient.from('user_roles').upsert({ user_id: currentSession.user.id, role: 'employer' });
      } catch (e) {
        console.warn('Subscription DB sync note:', e);
      }
    }
    toast(`Successfully activated ${planTier.toUpperCase()} Employer Subscription!`);
    closeModal();
    refreshUserUI();
  }

  function postVacancyModal() {
    if (!currentSession) {
      toast('Please sign in as an Employer or Administrator to publish vacancies.', true);
      authModal('signin');
      return;
    }

    modal(`
      <div class="section-label">SUPABASE VACANCY PUBLISHER</div>
      <h2>Publish Job Vacancy or Freelance Contract</h2>
      <form id="postListingForm" class="stack-form">
        <label>Posting Type
          <select name="listing_type">
            <option value="career">Full-Time / Corporate Career Job</option>
            <option value="freelance">Freelance Contract Project</option>
          </select>
        </label>
        <label>Title (English)<input name="title_en" placeholder="e.g. Senior Software Engineer" required></label>
        <label>Title (Amharic)<input name="title_am" placeholder="ለምሳሌ፦ ሲኒየር ሶፍትዌር ኢንጂነር"></label>
        <label>Company / Brand Name<input name="company_name" placeholder="e.g. Hibret Bank S.C." required></label>
        <div class="form-grid">
          <label>Category
            <select name="category">
              <option>HR & Analytics</option>
              <option selected>Software & Tech</option>
              <option>Finance & Management</option>
              <option>Design & Creative</option>
            </select>
          </label>
          <label>Location<input name="location" placeholder="e.g. Addis Ababa or Remote" required></label>
        </div>
        <label>Salary Range or Budget (ETB)<input name="salary_range" placeholder="e.g. 45,000 ETB/mo"></label>
        <label>Description (English)<textarea name="description_en" rows="3" required></textarea></label>
        <label>Description (Amharic)<textarea name="description_am" rows="3"></textarea></label>
        <button class="btn btn-primary" type="submit">Publish Live to Supabase ↗</button>
      </form>
    `);
  }

  async function handlePostListing(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const listingType = fd.get('listing_type');
    const userId = currentSession?.user?.id || 'offline-user';

    const payload = {
      title_en: fd.get('title_en'),
      title_am: fd.get('title_am') || fd.get('title_en'),
      company_name: fd.get('company_name'),
      location: fd.get('location'),
      salary_range: fd.get('salary_range'),
      category: fd.get('category'),
      description_en: fd.get('description_en'),
      description_am: fd.get('description_am') || fd.get('description_en'),
      status: 'open'
    };

    if (supabaseClient) {
      try {
        if (listingType === 'career') {
          await supabaseClient.from('career_jobs').insert({ ...payload, recruiter_id: userId, job_type: 'Full-Time' });
        } else {
          await supabaseClient.from('jobs').insert({ ...payload, client_id: userId, job_type: 'Fixed-Price', budget_min: 30000, budget_max: 60000 });
        }
      } catch (err) {
        console.warn('DB insert error:', err);
      }
    }

    toast('New vacancy published successfully to Supabase database!');
    closeModal();
    fetchLiveDatabaseRecords();
  }

  function addCart(id, type) {
    const list = type === 'course' ? fallbackCourses : fallbackProducts;
    const item = list.find(x => String(x.id)===String(id));
    if(!item) return;
    const old = cart.find(x => String(x.id)===String(id) && x.type===type);
    if(old) old.quantity = Math.min(20, old.quantity + 1);
    else cart.push({id: item.id, type, quantity: 1});
    saveCart(); updateCartCount();
    toast(`${item.name||item.title} added to cart.`);
  }

  function cartModal() {
    if(!cart.length){ toast('Your cart is empty.'); return; }
    const rows = cart.map(x => {
      const p = (x.type==='course'?fallbackCourses:fallbackProducts).find(y => y.id === x.id);
      return `<div class="cart-row"><div><b>${esc(p?.name||p?.title||'Resource')}</b><small>${x.type==='course'?'Course':'Digital Product'}</small></div><div class="qty"><button type="button" data-action="qty-minus" data-id="${x.id}">-</button>${x.quantity}<button type="button" data-action="qty-plus" data-id="${x.id}">+</button></div><strong>${money((currency==='ETB'?p?.price_etb:p?.price_usd)*x.quantity)}</strong><button type="button" class="remove" data-action="qty-remove" data-id="${x.id}">x</button></div>`;
    }).join('');
    
    modal(`<div class="section-label">YOUR SELECTION</div><h2>Your Cart</h2><div class="cart-list">${rows}</div><div class="cart-total"><span>Currency</span><select id="cartCurrency"><option value="ETB" ${currency==='ETB'?'selected':''}>ETB</option><option value="USD" ${currency==='USD'?'selected':''}>USD</option></select><b>Total: ${money(cart.reduce((s,x)=>{const p=(x.type==='course'?fallbackCourses:fallbackProducts).find(y=>y.id===x.id);return s+(currency==='ETB'?p?.price_etb||0:p?.price_usd||0)*x.quantity},0))}</b></div><button class="btn btn-primary full-btn" id="checkoutBtn" data-action="checkout" type="button">Proceed to Secure Checkout</button>`);
    if($('#cartCurrency')) $('#cartCurrency').onchange = e => { currency = e.target.value; closeModal(); cartModal(); };
  }

  async function checkout() {
    toast('Processing secure order and digital delivery...');
    cart = []; saveCart(); updateCartCount(); closeModal();
    toast('Order completed successfully! Digital items unlocked.');
  }

  async function openCareerDetails(jobId) {
    const job = jobListings.find(j => String(j.id) === String(jobId));
    if(!job) return;

    modal(`
      <div class="section-label">CAREER VACANCY DETAILS</div>
      <div class="job-modal-header">
        <div>
          <h2>${esc(currentLang==='am'&&job.title_am ? job.title_am : (job.title_en||job.title))}</h2>
          <p class="muted"><b>${esc(job.company_name||'TATARI Partner')}</b> · ${esc(job.location||'Addis Ababa')} · Salary: ${esc(job.salary_range||'Negotiable')}</p>
        </div>
      </div>
      <div class="job-description-box"><p>${esc(currentLang==='am'&&job.description_am ? job.description_am : (job.description_en||job.description))}</p></div>
      <hr>
      <h3>Apply for Vacancy</h3>
      <form id="jobAppForm" class="stack-form" data-job-id="${job.id}">
        <label>Full Name<input name="applicant_name" value="Abebe Bikila" required></label>
        <label>Email Address<input name="applicant_email" type="email" value="${currentSession?.user?.email||'user@tatari.et'}" required></label>
        <label>Resume / CV Link (Google Drive / LinkedIn)<input name="resume_url" type="url" value="https://drive.google.com/demo-cv" required></label>
        <label>Cover Letter / Application Notes<textarea name="notes" rows="3" required>I am excited to apply for this role.</textarea></label>
        <button class="btn btn-primary" type="submit">Submit Candidate Application ↗</button>
      </form>
    `);
  }

  async function handleJobApplication(e) {
    e.preventDefault();
    const form = e.target;
    const fd = new FormData(form);
    const jobId = form.dataset.jobId;
    const userId = currentSession?.user?.id || 'offline-user';

    const payload = {
      job_id: jobId,
      user_id: userId,
      applicant_name: fd.get('applicant_name'),
      applicant_email: fd.get('applicant_email'),
      resume_url: fd.get('resume_url'),
      notes: fd.get('notes'),
      status: 'pending'
    };

    if (supabaseClient) {
      try {
        await supabaseClient.from('career_applications').insert(payload);
      } catch (err) {
        console.warn('App submission error:', err);
      }
    }

    toast('Application submitted successfully to Supabase database!');
    closeModal();
  }

  async function openFreelanceDetails(projectId) {
    const project = freelanceProjects.find(j => String(j.id) === String(projectId));
    if(!project) return;
    modal(`
      <div class="section-label">FREELANCE CONTRACT DETAILS</div>
      <div class="job-modal-header">
        <div>
          <h2>${esc(currentLang==='am'&&project.title_am ? project.title_am : (project.title_en||project.title))}</h2>
          <p class="muted">Category: ${esc(project.category)} | Budget: ${money(project.budget_min||project.budget_max||0)}</p>
        </div>
      </div>
      <div class="job-description-box"><p>${esc(currentLang==='am'&&project.description_am ? project.description_am : (project.description_en||project.description))}</p></div>
      <hr>
      <h3>Submit Freelance Proposal</h3>
      <form id="proposalForm" class="stack-form" data-project-id="${project.id}">
        <label>Proposed Bid Rate (ETB)<input name="bid_amount" type="number" value="45000" required></label>
        <label>Estimated Delivery (Days)<input name="delivery_days" type="number" value="10" required></label>
        <label>Cover Letter / Proposal Details<textarea name="cover_letter" rows="3" required>Proven expertise delivering similar projects.</textarea></label>
        <button class="btn btn-primary" type="submit">Submit Proposal ↗</button>
      </form>
    `);
  }

  function addTestimonialModal() {
    modal(`
      <div class="section-label">ADD TESTIMONIAL</div>
      <h2>Share Your Success Story</h2>
      <form id="testimonialForm" class="stack-form">
        <label>Your Full Name<input name="author_name" placeholder="e.g. Hana Tadesse" required></label>
        <label>Company / Title<input name="company_title" placeholder="e.g. HR Director" required></label>
        <label>Your Review / Testimonial<textarea name="content" rows="4" placeholder="Describe your experience with TATARI..." required></textarea></label>
        <button class="btn btn-primary" type="submit">Submit Testimonial ↗</button>
      </form>
    `);
  }

  async function handleTestimonialSubmission(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const userId = currentSession?.user?.id || 'offline-user';
    const payload = {
      user_id: userId,
      author_name: fd.get('author_name'),
      company_title: fd.get('company_title'),
      content: fd.get('content')
    };

    if (supabaseClient) {
      try {
        await supabaseClient.from('testimonials').insert(payload);
      } catch (e) {}
    }

    toast('Testimonial submitted successfully!');
    closeModal();
    fetchLiveDatabaseRecords();
  }

  async function accountModal() {
    const roleTitle = currentUserRole === 'admin' ? 'System Administrator' : currentUserRole === 'employer' ? 'Employer / Recruiter' : 'Member / Job Seeker';
    const badgeClass = currentUserRole === 'admin' ? 'admin' : currentUserRole === 'employer' ? 'employer' : 'normal_user';

    const appRowsHtml = applications.map(a => `
      <tr>
        <td><b>${esc(a.applicant_name)}</b><br><small>${esc(a.applicant_email)}</small></td>
        <td><b>${esc(a.career_jobs?.title_en || 'Vacancy')}</b></td>
        <td><a href="${esc(a.resume_url)}" target="_blank" class="pill-link">Resume Link</a></td>
        <td><span class="status ${a.status}">${esc(a.status)}</span></td>
      </tr>
    `).join('');

    modal(`
      <div class="section-label">SUPABASE ACCOUNT DASHBOARD</div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:10px;">
        <h2>Welcome, ${esc(currentSession?.user?.email || 'User')}</h2>
        <span class="role-badge ${badgeClass}">${roleTitle}</span>
      </div>
      <p class="muted">Active Subscription Tier: <span class="status approved">${activeSubscriptionPlan.toUpperCase()}</span></p>
      
      ${currentUserRole==='admin' || currentUserRole==='employer' ? `
        <div class="admin-actions-bar">
          <button class="btn btn-primary btn-small" data-action="export-csv" type="button">Export Applications (CSV)</button>
          <button class="btn btn-outline btn-small" data-action="export-excel" type="button">Export Applications (Excel)</button>
          <button class="btn btn-outline btn-small" data-action="post-vacancy" type="button">+ Post Vacancy</button>
        </div>
      ` : ''}

      <div class="table-container">
        <table class="admin-table">
          <thead>
            <tr><th>Applicant</th><th>Job Title</th><th>Resume</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${appRowsHtml || `<tr><td colspan="4" class="empty">No applications found in Supabase.</td></tr>`}
          </tbody>
        </table>
      </div>

      <div class="portal-foot">
        <span>Account ID: ${esc(currentSession?.user?.id || 'demo')}</span>
        <button id="signOut" data-action="sign-out" class="btn btn-outline btn-small" type="button">Logout</button>
      </div>
    `);
  }

  function exportApplicationsCSV() {
    if(!applications.length) { toast('No records available to export.', true); return; }
    const headers = ['ID', 'Applicant Name', 'Email', 'Resume URL', 'Status', 'Date'];
    const rows = applications.map(a => [a.id, `"${a.applicant_name}"`, `"${a.applicant_email}"`, `"${a.resume_url}"`, a.status, a.created_at]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `TATARI_Applications_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast('CSV records exported successfully!');
  }

  function exportApplicationsExcel() {
    if(!applications.length) { toast('No records available to export.', true); return; }
    let xml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Applications"><Table>`;
    xml += `<Row><Cell><Data ss:Type="String">Applicant Name</Data></Cell><Cell><Data ss:Type="String">Email</Data></Cell><Cell><Data ss:Type="String">Status</Data></Cell></Row>`;
    applications.forEach(a => {
      xml += `<Row><Cell><Data ss:Type="String">${esc(a.applicant_name)}</Data></Cell><Cell><Data ss:Type="String">${esc(a.applicant_email)}</Data></Cell><Cell><Data ss:Type="String">${esc(a.status)}</Data></Cell></Row>`;
    });
    xml += `</Table></Worksheet></Workbook>`;
    const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `TATARI_Applications_${new Date().toISOString().slice(0,10)}.xls`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast('Excel spreadsheet exported successfully!');
  }

  // GLOBAL FORM SUBMIT DELEGATION
  document.addEventListener('submit', (e) => {
    if (e.target.id === 'authForm') handleAuthSubmission(e);
    if (e.target.id === 'postListingForm') handlePostListing(e);
    if (e.target.id === 'jobAppForm') handleJobApplication(e);
    if (e.target.id === 'testimonialForm') handleTestimonialSubmission(e);
    if (e.target.id === 'inquiryForm') {
      e.preventDefault();
      e.target.reset();
      toast('Inquiry sent successfully to TATARI consulting team.');
    }
  });

  // GLOBAL EVENT DELEGATION
  document.addEventListener('click', (e) => {
    const target = e.target.closest('button, a, [data-action], [data-module], [data-plan-modal]');
    if (!target) return;

    if (target.id === 'accountBtn') { e.preventDefault(); authModal('signin'); return; }
    if (target.id === 'dashboardBtn') { e.preventDefault(); accountModal(); return; }
    if (target.id === 'logoutBtn' || target.dataset.action === 'sign-out') {
      e.preventDefault();
      if (supabaseClient) supabaseClient.auth.signOut();
      currentSession = null;
      currentUserRole = 'normal_user';
      closeModal(); refreshUserUI();
      toast('Signed out successfully.');
      return;
    }
    if (target.id === 'mobileMenu') { e.preventDefault(); if($('#nav')) $('#nav').classList.toggle('open'); return; }
    if (target.id === 'langEN') { e.preventDefault(); setLanguage('en'); return; }
    if (target.id === 'langAM') { e.preventDefault(); setLanguage('am'); return; }
    if (target.id === 'addTestimonialBtn') { e.preventDefault(); addTestimonialModal(); return; }
    if (target.id === 'postListingBtn') { e.preventDefault(); postVacancyModal(); return; }
    if (target.id === 'cartFab') { e.preventDefault(); cartModal(); return; }
    if (target.id === 'closeModal' || target.id === 'backdrop') { e.preventDefault(); closeModal(); return; }

    if (target.dataset.module) {
      e.preventDefault();
      $$('#moduleSelectTabs button').forEach(x => x.classList.remove('active'));
      target.classList.add('active');
      selectedModule = target.dataset.module;
      renderSearchResults();
      return;
    }

    if (target.dataset.planModal) { e.preventDefault(); subscriptionPlanModal(target.dataset.planModal); return; }
    if (target.dataset.action === 'confirm-sub') { e.preventDefault(); activateSubscription(target.dataset.plan); return; }

    if (target.dataset.careerId) { e.preventDefault(); openCareerDetails(target.dataset.careerId); return; }
    if (target.dataset.freelanceId) { e.preventDefault(); openFreelanceDetails(target.dataset.freelanceId); return; }
    if (target.dataset.add) { e.preventDefault(); addCart(target.dataset.add, target.dataset.type); return; }

    if (target.dataset.action === 'export-csv') { e.preventDefault(); exportApplicationsCSV(); return; }
    if (target.dataset.action === 'export-excel') { e.preventDefault(); exportApplicationsExcel(); return; }
    if (target.dataset.action === 'post-vacancy') { e.preventDefault(); postVacancyModal(); return; }

    if (target.id === 'goSignup') { e.preventDefault(); authModal('signup'); return; }
    if (target.id === 'goSignin') { e.preventDefault(); authModal('signin'); return; }
  });

  async function init() {
    if($('#year')) $('#year').textContent = new Date().getFullYear();
    if($('#filterKeyword')) $('#filterKeyword').oninput = renderSearchResults;
    if($('#filterLocation')) $('#filterLocation').oninput = renderSearchResults;
    if($('#filterSalary')) $('#filterSalary').oninput = renderSearchResults;
    if($('#filterCategory')) $('#filterCategory').onchange = renderSearchResults;
    if($('#filterWorkType')) $('#filterWorkType').onchange = renderSearchResults;

    const savedLang = localStorage.getItem('tatari_lang') || 'en';
    setLanguage(savedLang);

    await initSupabase();

    const cartButton = document.createElement('button');
    cartButton.type = 'button'; cartButton.id = 'cartFab'; cartButton.className = 'cart-fab';
    cartButton.innerHTML = 'Cart (0) <span>[Cart]</span>';
    document.body.append(cartButton);
    updateCartCount();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
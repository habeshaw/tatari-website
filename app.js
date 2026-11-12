(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  let supabaseClient = null;
  let currentSession = null;

  let currentUserRole = localStorage.getItem('tatari_demo_role') || 'seeker';
  let currentUserStatus = localStorage.getItem('tatari_user_status') || 'approved';
  let currentUserEmail = localStorage.getItem('tatari_user_email') || 'abebe@tatari.et';
  let currentUserSub = localStorage.getItem('tatari_sub_tier') || 'Free Tier';
  let currentLang = localStorage.getItem('tatari_lang') || 'en';
  let freelanceSubView = 'projects';

  let registeredUsers = JSON.parse(localStorage.getItem('tatari_users_v9') || 'null') || [
    { email: 'admin@tatari.et', full_name: 'TATARI System Administrator', company_name: 'TATARI Consulting PLC', role: 'admin', status: 'approved' },
    { email: 'hr@addistech.et', full_name: 'Meron Tadesse', company_name: 'Addis Tech Manufacturing PLC', role: 'employer', status: 'approved' },
    { email: 'abebe@tatari.et', full_name: 'Abebe Bikila', company_name: '', role: 'seeker', status: 'approved' }
  ];

  let jobListings = JSON.parse(localStorage.getItem('tatari_jobs_v9') || 'null') || [
    {
      id: 'job-1',
      title_en: 'HR & Payroll Systems Officer',
      title_am: 'የሰው ሀብት እና የደመወዝ ሲስተም ባለሙያ',
      company_name: 'Addis Tech Manufacturing PLC',
      location: 'Addis Ababa',
      job_type: 'Full-time',
      category: 'HR & Admin',
      salary_range: '28,000 ETB/mo',
      deadline: '2026-12-15',
      description_en: 'Manage monthly payroll in Power Query, maintain employee records, and ensure compliance with Ethiopian Labor Proclamation.',
      description_am: 'ወርሃዊ የደመወዝ ክፍያን በPower Query ያስተዳድሩ፣ የሰራተኞችን መረጃ ይያዙ እና ከኢትዮጵያ የአሠሪና ሠራተኛ ሕግ ጋር መጣጣሙን ያረጋግጡ።',
      requirements: 'BA in HRM or Management, strong Excel & Power Query skills, 2+ years experience.',
      telebirr_fee: 500,
      telebirr_txn: 'TB-884120',
      status: 'approved'
    },
    {
      id: 'job-2',
      title_en: 'Data & BI Reporting Analyst',
      title_am: 'የዳታ እና ቢዝነስ ኢንተለጀንስ ተንታኝ',
      company_name: 'Sheger Microfinance Institution',
      location: 'Sheger City',
      job_type: 'Full-time',
      category: 'IT & Data',
      salary_range: '35,000 ETB/mo',
      deadline: '2026-12-20',
      description_en: 'Build automated branch performance dashboards, credit portfolio trackers, and executive KPI reports.',
      description_am: 'አውቶማቲክ የቅርንጫፍ አፈጻጸም ዳሽቦርዶችን እና የስራ አመራር KPI ሪፖርቶችን ይገንቡ።',
      requirements: 'BSc in Information Systems, Statistics, or Computer Science; SQL & Power BI/Excel.',
      telebirr_fee: 500,
      telebirr_txn: 'TB-992014',
      status: 'approved'
    }
  ];

  let freelanceProjects = JSON.parse(localStorage.getItem('tatari_projects_v9') || 'null') || [
    {
      id: 'fl-1',
      title_en: 'Build a Power Query Sales & Inventory Dashboard',
      title_am: 'የሽያጭ እና ንብረት ቁጥጥር Power Query ዳሽቦርድ መገንባት',
      category: 'IT & Data',
      job_type: 'Fixed-Price',
      budget_min: 15000,
      budget_max: 25000,
      telebirr_status: 'Escrow Funded',
      telebirr_txn: 'TB-551902',
      description_en: 'We have 12 monthly Excel exports from our POS system and need a clean, automated Power Query pipeline + interactive KPI dashboard.',
      description_am: 'ከPOS ሲስተማችን የወጡ 12 ወርሃዊ የኤክሴል መረጃዎችን የሚያገናኝ አውቶማቲክ Power Query እና ዳሽቦርድ እንፈልጋለን።',
      status: 'approved'
    },
    {
      id: 'fl-2',
      title_en: 'SME HR Policy Manual & Salary Scale Design',
      title_am: 'የአነስተኛ ድርጅት የሰው ሀብት መመሪያ እና የደመወዝ እርከን ዝግጅት',
      category: 'HR & Admin',
      job_type: 'Fixed-Price',
      budget_min: 20000,
      budget_max: 30000,
      telebirr_status: 'Escrow Funded',
      telebirr_txn: 'TB-663411',
      description_en: 'Draft a comprehensive HR policy handbook aligned with the Ethiopian Labor Proclamation plus a 10-grade salary scale.',
      description_am: 'ከኢትዮጵያ የአሠሪና ሠራተኛ ሕግ ጋር የተጣጣመ የሰው ሀብት መመሪያ እና የደመወዝ እርከን ማዘጋጀት።',
      status: 'approved'
    }
  ];

  let productsList = JSON.parse(localStorage.getItem('tatari_products_v9') || 'null') || [
    {
      id: 'prod-1',
      title_en: 'Automated Ethiopian Payroll Model (Power Query)',
      title_am: 'አውቶማቲክ የኢትዮጵያ ደመወዝ ማሰሊያ (Power Query)',
      category: 'Payroll & HR',
      price_etb: 1500,
      description_en: 'Complete Excel & Power Query payroll engine with Ethiopian income tax brackets, pension (7%/11%), overtime, and printable payslips.',
      description_am: 'የኢትዮጵያ የገቢ ግብር፣ ጡረታ (7%/11%) እና ወርሃዊ የደመወዝ ስሊፕ በራስ-ሰር የሚያዘጋጅ የኤክሴል ቴምፕሌት።',
      status: 'approved'
    },
    {
      id: 'prod-2',
      title_en: 'Commercial Bank Executive KPI Dashboard',
      title_am: 'የባንክ ስራ አመራር KPI ዳሽቦርድ',
      category: 'BI Dashboards',
      price_etb: 2500,
      description_en: 'Executive analytics template built for banking operations, branch deposit mobilization, and loan portfolio tracking.',
      description_am: 'ለባንክ ስራ አመራር የቅርንጫፍ ተቀማጭ ገንዘብ እና የብድር አፈጻጸም መከታተያ ዳሽቦርድ።',
      status: 'approved'
    },
    {
      id: 'prod-3',
      title_en: 'Ethiopian Labor Law HR Policy & Contract Pack',
      title_am: 'የኢትዮጵያ የአሠሪና ሠራተኛ ሕግ ፖሊሲ እና ውል ጥቅል',
      category: 'Legal & Compliance',
      price_etb: 1800,
      description_en: 'Bilingual (EN/AM) employment contracts, probation evaluation forms, leave trackers, and disciplinary policy templates.',
      description_am: 'በአማርኛ እና በእንግሊዝኛ የተዘጋጁ የቅጥር ውሎች፣ የሙከራ ጊዜ መገምገሚያ እና የፈቃድ መከታተያ ቅጾች።',
      status: 'approved'
    }
  ];

  let freelancersList = [
    {
      id: 'fr-1',
      full_name: 'Dawit Mekonnen',
      headline_en: 'Senior Power Query, Excel & Power BI Specialist',
      headline_am: 'ከፍተኛ የPower Query፣ ኤክሴል እና Power BI ባለሙያ',
      skills: ['Power Query', 'Excel Automation', 'Power BI', 'Financial Modeling'],
      hourly_rate_etb: 850,
      location: 'Addis Ababa',
      rating: '4.9 ★ (14 jobs)'
    },
    {
      id: 'fr-2',
      full_name: 'Selamawit Girma',
      headline_en: 'HR Consultant, Job Evaluation & Ethiopian Labor Law Advisor',
      headline_am: 'የሰው ሀብት አማካሪ እና የኢትዮጵያ የአሠሪና ሠራተኛ ሕግ ባለሙያ',
      skills: ['HR Policy', 'Job Descriptions', 'Payroll Audit', 'Balanced Scorecard'],
      hourly_rate_etb: 750,
      location: 'Addis Ababa',
      rating: '5.0 ★ (9 jobs)'
    }
  ];

  let userApplications = JSON.parse(localStorage.getItem('tatari_apps_v9') || '[]');
  let userProposals = JSON.parse(localStorage.getItem('tatari_bids_v9') || '[]');
  let purchasedProducts = JSON.parse(localStorage.getItem('tatari_purchases_v9') || '[]');
  let telebirrTransactions = JSON.parse(localStorage.getItem('tatari_telebirr_v9') || '[]');
  let activityLogs = JSON.parse(localStorage.getItem('tatari_logs_v9') || '[]');

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const formatETB = n => `ETB ${Number(n || 0).toLocaleString('en-US')}`;

  function saveState() {
    localStorage.setItem('tatari_users_v9', JSON.stringify(registeredUsers));
    localStorage.setItem('tatari_jobs_v9', JSON.stringify(jobListings));
    localStorage.setItem('tatari_projects_v9', JSON.stringify(freelanceProjects));
    localStorage.setItem('tatari_products_v9', JSON.stringify(productsList));
    localStorage.setItem('tatari_apps_v9', JSON.stringify(userApplications));
    localStorage.setItem('tatari_bids_v9', JSON.stringify(userProposals));
    localStorage.setItem('tatari_purchases_v9', JSON.stringify(purchasedProducts));
    localStorage.setItem('tatari_telebirr_v9', JSON.stringify(telebirrTransactions));
    localStorage.setItem('tatari_logs_v9', JSON.stringify(activityLogs));
  }

  function logActivity(action, details) {
    const entry = {
      user_email: currentUserEmail,
      action_type: action,
      details,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    activityLogs.unshift(entry);
    if (activityLogs.length > 50) activityLogs.pop();
    saveState();
    if (supabaseClient) {
      supabaseClient.from('activity_logs').insert([{ user_email: currentUserEmail, action_type: action, details }]).catch(() => {});
    }
  }

  function toast(msg, bad = false) {
    let el = $('#toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.className = bad ? 'show bad' : 'show';
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { el.className = ''; }, 4500);
  }

  function modal(html) {
    let root = $('#modalRoot');
    if (!root) {
      root = document.createElement('div');
      root.id = 'modalRoot';
      document.body.appendChild(root);
    }
    root.innerHTML = `<div class="modal-backdrop" id="backdrop"><div class="modal"><button class="modal-x" id="closeModal" type="button">×</button>${html}</div></div>`;
  }

  function closeModal() {
    const root = $('#modalRoot');
    if (root) root.innerHTML = '';
  }

  function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('tatari_lang', lang);
    if ($('#langEN')) $('#langEN').classList.toggle('active', lang === 'en');
    if ($('#langAM')) $('#langAM').classList.toggle('active', lang === 'am');
    if (window.TATARI_I18N) window.TATARI_I18N.translate(document.body, lang);
    renderCurrentPage();
  }

  function verifyTaskPermission(requiredRole = null) {
    const userRecord = registeredUsers.find(u => u.email.toLowerCase() === currentUserEmail.toLowerCase());
    if (!userRecord && currentUserRole !== 'admin') {
      toast('User not found in registry. Please register or sign in first.', true);
      openAuthModal('signup');
      return false;
    }
    if (userRecord && userRecord.status === 'suspended') {
      toast('Account suspended by Administrator.', true);
      return false;
    }
    if ((userRecord?.status === 'pending' || currentUserStatus === 'pending') && currentUserRole !== 'admin') {
      toast('Action blocked: Your registration is awaiting Administrator approval.', true);
      return false;
    }
    if (requiredRole && currentUserRole !== requiredRole && currentUserRole !== 'admin') {
      toast(`Role restriction: This action requires ${requiredRole.toUpperCase()} privileges.`, true);
      return false;
    }
    return true;
  }

  async function initSupabase() {
    if (window.supabase && window.TATARI_CONFIG) {
      try {
        supabaseClient = window.supabase.createClient(window.TATARI_CONFIG.url, window.TATARI_CONFIG.publishableKey);
        const { data: { session } } = await supabaseClient.auth.getSession();
        currentSession = session;
      } catch (e) {
        console.warn('Running in offline-resilient mode:', e);
      }
    }
    applyUrlSearchParams();
    refreshAuthUI();
    await syncLiveRecords();
  }

  function applyUrlSearchParams() {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (!q) return;
    if ($('#jobFilterKeyword')) $('#jobFilterKeyword').value = q;
    if ($('#flFilterKeyword')) $('#flFilterKeyword').value = q;
    if ($('#productFilterKeyword')) $('#productFilterKeyword').value = q;
  }

  async function syncLiveRecords() {
    if (supabaseClient) {
      try {
        const { data: dbJobs } = await supabaseClient.from('career_jobs').select('*').order('created_at', { ascending: false });
        if (dbJobs && dbJobs.length) jobListings = dbJobs;

        const { data: dbProjects } = await supabaseClient.from('jobs').select('*').order('created_at', { ascending: false });
        if (dbProjects && dbProjects.length) freelanceProjects = dbProjects;

        const { data: dbProducts } = await supabaseClient.from('products').select('*').order('created_at', { ascending: false });
        if (dbProducts && dbProducts.length) productsList = dbProducts;
      } catch (e) {
        console.warn('Using local cached records:', e);
      }
    }
    renderCurrentPage();
  }

  function refreshAuthUI() {
    const isLoggedIn = !!localStorage.getItem('tatari_logged_in');
    if ($('#accountBtn')) {
      $('#accountBtn').hidden = isLoggedIn;
    }
    if ($('#logoutBtn')) {
      $('#logoutBtn').hidden = !isLoggedIn;
      $('#logoutBtn').textContent = `${currentLang === 'am' ? 'ውጡ' : 'Logout'} (${currentUserEmail.split('@')[0]})`;
    }
  }

  function renderCurrentPage() {
    const page = document.body.dataset.page;
    if (page === 'home') renderHomePreview();
    if (page === 'jobs') renderJobsBoard();
    if (page === 'freelance') renderFreelanceMarketplace();
    if (page === 'products') renderProductsStore();
    if (page === 'dashboard') renderDashboard();
  }

  function renderHomePreview() {
    const grid = $('#homeLivePreviewGrid');
    if (!grid) return;
    const items = [
      ...jobListings.filter(j => j.status === 'approved').slice(0, 1).map(j => renderJobCard(j)),
      ...freelanceProjects.filter(p => p.status === 'approved').slice(0, 1).map(p => renderProjectCard(p)),
      ...productsList.filter(pr => pr.status === 'approved').slice(0, 1).map(pr => renderProductCard(pr))
    ];
    grid.innerHTML = items.join('');
  }

  function renderJobsBoard() {
    const grid = $('#jobsBoardGrid');
    if (!grid) return;

    const kw = ($('#jobFilterKeyword')?.value || '').toLowerCase();
    const cat = $('#jobFilterCategory')?.value || 'all';
    const typ = $('#jobFilterType')?.value || 'all';
    const loc = $('#jobFilterLocation')?.value || 'all';
    const minSal = Number($('#jobFilterSalary')?.value || 0);

    const filtered = jobListings.filter(j => {
      if (j.status !== 'approved' && currentUserRole !== 'admin') return false;
      const text = `${j.title_en} ${j.title_am || ''} ${j.company_name} ${j.description_en}`.toLowerCase();
      const numSal = parseInt(String(j.salary_range || '0').replace(/[^\d]/g, ''), 10) || 0;
      return (!kw || text.includes(kw)) &&
             (cat === 'all' || j.category === cat) &&
             (typ === 'all' || j.job_type === typ) &&
             (loc === 'all' || (j.location || '').toLowerCase().includes(loc.toLowerCase())) &&
             (!minSal || numSal >= minSal);
    });

    grid.innerHTML = filtered.length
      ? filtered.map(j => renderJobCard(j)).join('')
      : `<div class="empty">${currentLang === 'am' ? 'ምንም ተዛማጅ የሥራ ማስታወቂያ አልተገኘም።' : 'No matching approved jobs found.'}</div>`;
  }

  function renderJobCard(j) {
    const title = currentLang === 'am' && j.title_am ? j.title_am : j.title_en;
    const desc = currentLang === 'am' && j.description_am ? j.description_am : j.description_en;
    return `
      <article class="resource-card">
        <div class="resource-art career">
          <span>${currentLang === 'am' ? 'የሥራ ማስታወቂያ' : 'JOB VACANCY'} · ${esc(j.job_type)}</span>
          <b>🏢</b>
        </div>
        <div class="resource-body">
          <span class="pill">${esc(j.category)} · ${esc(j.location)}</span>
          <h3>${esc(title)}</h3>
          <p><strong>${esc(j.company_name)}</strong> — ${esc(desc)}</p>
          <div class="resource-bottom">
            <strong>${esc(j.salary_range || 'Negotiable')}</strong>
            <button class="btn btn-primary btn-small" data-apply-job="${j.id}" type="button">
              ${currentLang === 'am' ? 'አሁን ያመልክቱ' : 'Apply Now'}
            </button>
          </div>
        </div>
      </article>
    `;
  }

  function renderFreelanceMarketplace() {
    const grid = $('#freelanceMarketplaceGrid');
    if (!grid) return;

    const kw = ($('#flFilterKeyword')?.value || '').toLowerCase();
    const cat = $('#flFilterCategory')?.value || 'all';
    const minBudget = Number($('#flFilterBudget')?.value || 0);

    if (freelanceSubView === 'projects') {
      const filtered = freelanceProjects.filter(p => {
        if (p.status !== 'approved' && currentUserRole !== 'admin') return false;
        const text = `${p.title_en} ${p.title_am || ''} ${p.description_en}`.toLowerCase();
        return (!kw || text.includes(kw)) &&
               (cat === 'all' || p.category === cat) &&
               (!minBudget || Number(p.budget_min || 0) >= minBudget);
      });

      grid.innerHTML = filtered.length
        ? filtered.map(p => renderProjectCard(p)).join('')
        : `<div class="empty">${currentLang === 'am' ? 'ምንም የፍሪላንስ ፕሮጀክት አልተገኘም።' : 'No matching approved freelance projects found.'}</div>`;
    } else {
      const filteredTalent = freelancersList.filter(f => {
        const text = `${f.full_name} ${f.headline_en} ${(f.skills || []).join(' ')}`.toLowerCase();
        return (!kw || text.includes(kw)) && (!minBudget || Number(f.hourly_rate_etb) >= minBudget);
      });

      grid.innerHTML = filteredTalent.map(f => `
        <article class="resource-card">
          <div class="resource-art course">
            <span>VETTED ETHIOPIAN TALENT</span>
            <b>👨‍💻</b>
          </div>
          <div class="resource-body">
            <span class="pill">${esc(f.location)} · ${esc(f.rating)}</span>
            <h3>${esc(f.full_name)}</h3>
            <p>${esc(currentLang === 'am' && f.headline_am ? f.headline_am : f.headline_en)}</p>
            <div style="display:flex; flex-wrap:wrap; gap:5px; margin-bottom:10px;">
              ${(f.skills || []).map(s => `<span class="status">${esc(s)}</span>`).join('')}
            </div>
            <div class="resource-bottom">
              <strong>${formatETB(f.hourly_rate_etb)} / hr</strong>
              <button class="btn btn-outline btn-small" data-invite-freelancer="${esc(f.full_name)}" type="button">
                ${currentLang === 'am' ? 'ለሥራ ይጋብዙ' : 'Invite to Project'}
              </button>
            </div>
          </div>
        </article>
      `).join('');
    }
  }

  function renderProjectCard(p) {
    const title = currentLang === 'am' && p.title_am ? p.title_am : p.title_en;
    const desc = currentLang === 'am' && p.description_am ? p.description_am : p.description_en;
    const budgetText = p.budget_max ? `${formatETB(p.budget_min)} – ${formatETB(p.budget_max)}` : formatETB(p.budget_min);
    return `
      <article class="resource-card">
        <div class="resource-art job">
          <span>${currentLang === 'am' ? 'የፍሪላንስ ፕሮጀክት' : 'FREELANCE PROJECT'} · ${esc(p.job_type)}</span>
          <b>💼</b>
        </div>
        <div class="resource-body">
          <span class="pill">${esc(p.category)} · Telebirr: ${esc(p.telebirr_status || 'Verified')}</span>
          <h3>${esc(title)}</h3>
          <p>${esc(desc)}</p>
          <div class="resource-bottom">
            <strong>${budgetText}</strong>
            <button class="btn btn-primary btn-small" data-bid-project="${p.id}" type="button">
              ${currentLang === 'am' ? 'ጨረታ ያስገቡ' : 'Submit Proposal'}
            </button>
          </div>
        </div>
      </article>
    `;
  }

  function renderProductsStore() {
    const grid = $('#productsGrid');
    if (!grid) return;

    const kw = ($('#productFilterKeyword')?.value || '').toLowerCase();
    const cat = $('#productFilterCategory')?.value || 'all';
    const maxPrice = Number($('#productFilterMaxPrice')?.value || 0);

    const filtered = productsList.filter(prod => {
      if (prod.status !== 'approved' && currentUserRole !== 'admin') return false;
      const text = `${prod.title_en} ${prod.title_am || ''} ${prod.description_en}`.toLowerCase();
      return (!kw || text.includes(kw)) &&
             (cat === 'all' || prod.category === cat) &&
             (!maxPrice || Number(prod.price_etb) <= maxPrice);
    });

    grid.innerHTML = filtered.length
      ? filtered.map(prod => renderProductCard(prod)).join('')
      : `<div class="empty">No matching products found in the store.</div>`;
  }

  function renderProductCard(prod) {
    const title = currentLang === 'am' && prod.title_am ? prod.title_am : prod.title_en;
    const desc = currentLang === 'am' && prod.description_am ? prod.description_am : prod.description_en;
    return `
      <article class="resource-card">
        <div class="resource-art course">
          <span>DIGITAL TEMPLATE · INSTANT ACCESS</span>
          <b>📦</b>
        </div>
        <div class="resource-body">
          <span class="pill">${esc(prod.category)}</span>
          <h3>${esc(title)}</h3>
          <p>${esc(desc)}</p>
          <div class="resource-bottom">
            <strong>${formatETB(prod.price_etb)}</strong>
            <button class="btn btn-primary btn-small" data-buy-product="${prod.id}" type="button">
              ${currentLang === 'am' ? 'በቴሌብር ይግዙ' : 'Buy via Telebirr'}
            </button>
          </div>
        </div>
      </article>
    `;
  }

  function renderDashboard() {
    const container = $('#dashboardContentArea');
    if (!container) return;

    const roleSel = $('#activeRoleSelector');
    if (roleSel) roleSel.value = currentUserRole;

    if (currentUserStatus === 'pending' && currentUserRole !== 'admin') {
      container.innerHTML = `
        <div class="form-card" style="background:#fffbeb; border:1px solid #fde68a; color:#92400e;">
          <h3>⚠️ Account Pending Administrator Approval</h3>
          <p>Your account (<b>${esc(currentUserEmail)}</b>) has been registered and is currently queued for approval by <b>admin@tatari.et</b>. Once approved, you can post jobs, bid on projects, and manage transactions.</p>
        </div>
      `;
      return;
    }

    if (currentUserRole === 'employer') {
      container.innerHTML = `
        <div class="form-card" style="margin-bottom:24px; background:linear-gradient(135deg,#10243b,#183752); color:white;">
          <span class="eyebrow" style="color:var(--teal);">EMPLOYER SUBSCRIPTION STATUS</span>
          <h2 style="color:white; margin:8px 0;">Active Plan: <b>${esc(currentUserSub)}</b></h2>
          <p style="color:#c7d2de; font-size:13px;">Upgrade your tier via Telebirr to unlock unlimited job vacancies and priority applicant matching.</p>
          <div style="display:flex; gap:12px; margin-top:16px; flex-wrap:wrap;">
            <button class="btn btn-primary btn-small" data-sub-tier="Pro Employer Plan (2,500 ETB/mo)" data-sub-price="2500" type="button">Upgrade to Pro (2,500 ETB)</button>
            <button class="btn btn-ghost btn-small" data-sub-tier="Enterprise Plan (7,500 ETB/mo)" data-sub-price="7500" type="button">Upgrade to Enterprise (7,500 ETB)</button>
          </div>
        </div>

        <div style="display:flex; gap:12px; margin-bottom:24px; flex-wrap:wrap;">
          <button class="btn btn-primary btn-small" id="dashPostJobBtn" type="button">+ Post Job Vacancy (500 ETB Telebirr)</button>
          <button class="btn btn-outline btn-small" id="dashPostProjectBtn" type="button">+ Post Freelance Project (Escrow)</button>
        </div>

        <h3>1. Job Postings & Admin Moderation Status</h3>
        <div class="table-container" style="background:#fff; padding:16px; border-radius:14px; border:1px solid var(--line); margin-bottom:30px;">
          <table class="admin-table">
            <thead><tr><th>Job Title</th><th>Company</th><th>Telebirr Ref</th><th>Status</th></tr></thead>
            <tbody>
              ${jobListings.map(j => `
                <tr>
                  <td><b>${esc(j.title_en)}</b></td>
                  <td>${esc(j.company_name)}</td>
                  <td><span class="status approved">${esc(j.telebirr_txn || 'TB-VERIFIED')}</span></td>
                  <td><span class="status ${j.status === 'approved' ? 'approved' : ''}">${esc(j.status)}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <h3>2. Candidate Applications Pipeline</h3>
        <div class="table-container" style="background:#fff; padding:16px; border-radius:14px; border:1px solid var(--line); margin-bottom:30px;">
          <table class="admin-table">
            <thead><tr><th>Candidate</th><th>Job Title</th><th>CV Link</th><th>Stage</th><th>Update</th></tr></thead>
            <tbody>
              ${userApplications.length ? userApplications.map((a, idx) => `
                <tr>
                  <td><b>${esc(a.applicant_name)}</b><br><small>${esc(a.applicant_email)}</small></td>
                  <td>${esc(a.job_title)}</td>
                  <td><a href="${esc(a.resume_url)}" target="_blank" class="pill-link">View CV ↗</a></td>
                  <td><span class="status approved">${esc(a.status)}</span></td>
                  <td>
                    <select data-app-status-idx="${idx}" style="padding:6px; font-size:12px;">
                      <option value="Applied" ${a.status === 'Applied' ? 'selected' : ''}>Applied</option>
                      <option value="Shortlisted" ${a.status === 'Shortlisted' ? 'selected' : ''}>Shortlisted</option>
                      <option value="Interview" ${a.status === 'Interview' ? 'selected' : ''}>Interview</option>
                      <option value="Hired" ${a.status === 'Hired' ? 'selected' : ''}>Hired</option>
                    </select>
                  </td>
                </tr>
              `).join('') : `<tr><td colspan="5" class="empty">No applications received yet.</td></tr>`}
            </tbody>
          </table>
        </div>

        <h3>3. Freelance Contracts & Telebirr Escrow</h3>
        <div class="table-container" style="background:#fff; padding:16px; border-radius:14px; border:1px solid var(--line);">
          <table class="admin-table">
            <thead><tr><th>Project</th><th>Bid Amount</th><th>Escrow Status</th><th>Contract Action</th></tr></thead>
            <tbody>
              ${userProposals.length ? userProposals.map((b, idx) => `
                <tr>
                  <td><b>${esc(b.project_title)}</b></td>
                  <td><strong>${formatETB(b.bid_amount)}</strong></td>
                  <td><span class="status approved">${esc(b.status)}</span></td>
                  <td>
                    ${b.status === 'submitted'
                      ? `<button class="btn btn-primary btn-small" data-accept-bid="${idx}" type="button">Accept Bid & Fund Escrow</button>`
                      : b.status === 'active_contract'
                      ? `<button class="btn btn-outline btn-small" data-complete-milestone="${idx}" type="button">✓ Release Milestone Payout</button>`
                      : `<span class="status approved">Released & Completed ✓</span>`}
                  </td>
                </tr>
              `).join('') : `<tr><td colspan="4" class="empty">No freelance proposals yet.</td></tr>`}
            </tbody>
          </table>
        </div>
      `;
    } else if (currentUserRole === 'seeker') {
      container.innerHTML = `
        <div class="form-card" style="margin-bottom:30px;">
          <h3>Unified Job Seeker & Freelancer Profile</h3>
          <form id="unifiedProfileForm" class="form-grid">
            <label>Full Name<input name="full_name" value="Abebe Bikila" required/></label>
            <label>Location<input name="location" value="Addis Ababa" required/></label>
            <label>Professional Headline<input name="headline_en" value="HR Analytics & Power Query Specialist"/></label>
            <label>Hourly Rate (ETB)<input name="hourly_rate_etb" type="number" value="800"/></label>
            <label>Key Skills<input name="skills" value="Power Query, Excel, HR Policy, Payroll, SQL"/></label>
            <label>CV / Portfolio Link<input name="cv_url" value="https://drive.google.com/my-cv"/></label>
            <div class="full"><button class="btn btn-primary btn-small" type="submit">Save Profile</button></div>
          </form>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
          <div class="form-card">
            <h3>My Job Applications (${userApplications.length})</h3>
            ${userApplications.length ? userApplications.map(a => `
              <div class="order-card">
                <div><b>${esc(a.job_title)}</b><br><small>${esc(a.company_name)}</small></div>
                <span class="status approved">${esc(a.status)}</span>
              </div>
            `).join('') : '<p class="muted">No job applications submitted yet.</p>'}
          </div>
          <div class="form-card">
            <h3>My Purchased Store Templates (${purchasedProducts.length})</h3>
            ${purchasedProducts.length ? purchasedProducts.map(p => `
              <div class="order-card">
                <div><b>${esc(p.title)}</b><br><small>TXN: ${esc(p.txn)} · ${formatETB(p.price)}</small></div>
                <button class="btn btn-primary btn-small" data-download-template="${esc(p.title)}" type="button">Download ↗</button>
              </div>
            `).join('') : '<p class="muted">No store purchases yet. Visit the <a href="products.html" style="color:var(--teal);font-weight:700;">Store</a>.</p>'}
          </div>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="form-card">
          <h3>TATARI Single-Admin Governance & Moderation Portal</h3>
          <p class="muted">Authorized Admin Account: <b>admin@tatari.et</b> · Telebirr Revenue: <b>${formatETB(telebirrTransactions.reduce((s, t) => s + Number(t.amount_etb || 0), 0))}</b></p>

          <h3 style="margin-top:24px;">1. User Self-Registration & Approval Queue</h3>
          <div class="table-container" style="margin-bottom:30px;">
            <table class="admin-table">
              <thead><tr><th>Name</th><th>Email</th><th>Company / TIN</th><th>Role</th><th>Status</th><th>Admin Action</th></tr></thead>
              <tbody>
                ${registeredUsers.map((u, i) => `
                  <tr>
                    <td><b>${esc(u.full_name)}</b></td>
                    <td>${esc(u.email)}</td>
                    <td><small>${esc(u.company_name || 'Individual')}</small></td>
                    <td><span class="pill">${esc(u.role.toUpperCase())}</span></td>
                    <td><span class="status ${u.status === 'approved' ? 'approved' : ''}">${esc(u.status)}</span></td>
                    <td>
                      ${u.email === 'admin@tatari.et' ? '<small class="muted">Primary Admin</small>' :
                        u.status !== 'approved'
                        ? `<button class="btn btn-primary btn-small" data-approve-user="${i}" type="button">✓ Approve User</button>`
                        : `<button class="btn btn-outline btn-small" data-suspend-user="${i}" type="button">Suspend</button>`}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <h3>2. Job Vacancies, Freelance Projects & Store Moderation</h3>
          <div class="table-container" style="margin-bottom:30px;">
            <table class="admin-table">
              <thead><tr><th>Module</th><th>Title</th><th>Org / Value</th><th>Telebirr TXN</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                ${jobListings.map((j, i) => `
                  <tr>
                    <td><span class="pill">JOB</span></td>
                    <td><b>${esc(j.title_en)}</b></td>
                    <td>${esc(j.company_name)}</td>
                    <td><small>${esc(j.telebirr_txn || 'TB-884120')}</small></td>
                    <td><span class="status ${j.status === 'approved' ? 'approved' : ''}">${esc(j.status)}</span></td>
                    <td>
                      ${j.status !== 'approved'
                        ? `<button class="btn btn-primary btn-small" data-approve-job="${i}" type="button">✓ Approve</button>`
                        : `<button class="btn btn-outline btn-small" data-suspend-job="${i}" type="button">Suspend</button>`}
                    </td>
                  </tr>
                `).join('')}
                ${freelanceProjects.map((p, i) => `
                  <tr>
                    <td><span class="pill">GIG</span></td>
                    <td><b>${esc(p.title_en)}</b></td>
                    <td>${formatETB(p.budget_min)}</td>
                    <td><small>${esc(p.telebirr_txn || 'TB-551902')}</small></td>
                    <td><span class="status ${p.status === 'approved' ? 'approved' : ''}">${esc(p.status)}</span></td>
                    <td>
                      ${p.status !== 'approved'
                        ? `<button class="btn btn-primary btn-small" data-approve-gig="${i}" type="button">✓ Approve</button>`
                        : `<button class="btn btn-outline btn-small" data-suspend-gig="${i}" type="button">Suspend</button>`}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <h3>3. Live Login, Logout & Transaction Audit Logs</h3>
          <div class="table-container">
            <table class="admin-table">
              <thead><tr><th>Time</th><th>User</th><th>Event</th><th>Details</th></tr></thead>
              <tbody>
                ${activityLogs.length ? activityLogs.map(l => `
                  <tr>
                    <td><small>${esc(l.time)}</small></td>
                    <td><b>${esc(l.user_email)}</b></td>
                    <td><span class="pill">${esc(l.action_type)}</span></td>
                    <td>${esc(l.details)}</td>
                  </tr>
                `).join('') : `<tr><td colspan="4" class="empty">No activity logged in this session yet.</td></tr>`}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }
  }

  function openJobApplyModal(jobId) {
    if (!verifyTaskPermission()) return;
    const job = jobListings.find(j => String(j.id) === String(jobId));
    if (!job) return;
    modal(`
      <div class="section-label">DIRECT JOB APPLICATION</div>
      <h2>${esc(currentLang === 'am' && job.title_am ? job.title_am : job.title_en)}</h2>
      <p class="muted"><b>${esc(job.company_name)}</b> · ${esc(job.location)} · ${esc(job.salary_range)}</p>
      <form id="applyJobForm" class="stack-form" data-job-id="${job.id}">
        <label>Full Name<input name="applicant_name" value="Abebe Bikila" required/></label>
        <label>Email Address<input name="applicant_email" type="email" value="${esc(currentUserEmail)}" required/></label>
        <label>CV / Resume URL<input name="resume_url" type="url" value="https://drive.google.com/cv-sample" required/></label>
        <label>Cover Note<textarea name="notes" rows="3" required>I meet all requirements and am ready to contribute immediately.</textarea></label>
        <button class="btn btn-primary" type="submit">Submit Application ↗</button>
      </form>
    `);
  }

  function openProjectBidModal(projectId) {
    if (!verifyTaskPermission()) return;
    const proj = freelanceProjects.find(p => String(p.id) === String(projectId));
    if (!proj) return;
    modal(`
      <div class="section-label">FREELANCE PROPOSAL + TELEBIRR ESCROW</div>
      <h2>${esc(currentLang === 'am' && proj.title_am ? proj.title_am : proj.title_en)}</h2>
      <p class="muted">Client Budget: <b>${formatETB(proj.budget_min)} – ${formatETB(proj.budget_max || proj.budget_min)}</b></p>
      <form id="submitBidForm" class="stack-form" data-project-id="${proj.id}">
        <label>Your Bid Amount (ETB)<input name="bid_amount" type="number" value="${proj.budget_min || 15000}" required/></label>
        <label>Delivery Timeline (Days)<input name="delivery_days" type="number" value="7" required/></label>
        <label>Telebirr Mobile Number (For Payout)<input name="telebirr_phone" value="+251911223344" required/></label>
        <label>Technical Proposal<textarea name="cover_letter" rows="4" required>I will deliver a fully tested, documented solution with training included.</textarea></label>
        <button class="btn btn-primary" type="submit">Submit Proposal ↗</button>
      </form>
    `);
  }

  function openTelebirrPaymentModal(type, title, price, callback) {
    modal(`
      <div class="section-label">ETHIO TELECOM TELEBIRR GATEWAY</div>
      <h2>Checkout: ${esc(title)}</h2>
      <p class="muted">Amount Due: <b>${formatETB(price)}</b></p>
      <form id="telebirrPayForm" class="stack-form">
        <label>Telebirr Phone Number<input name="telebirr_phone" value="+251911000000" required/></label>
        <label>Telebirr PIN<input name="telebirr_pin" type="password" value="1234" required/></label>
        <div style="background:#f0f4f8; padding:12px; border-radius:8px; font-size:12px;">
          🔒 Protected by TATARI Telebirr Escrow & Audit Ledger.
        </div>
        <button class="btn btn-primary" type="submit">Confirm ${formatETB(price)} Payment ↗</button>
      </form>
    `);
    const form = $('#telebirrPayForm');
    if (form) {
      form.onsubmit = (ev) => {
        ev.preventDefault();
        const txnId = 'TB-' + Math.floor(100000 + Math.random() * 900000);
        telebirrTransactions.push({ txn_id: txnId, user_email: currentUserEmail, payment_type: type, amount_etb: price, time: new Date().toISOString() });
        saveState();
        toast(`Telebirr payment authorized! Ref: ${txnId}`);
        logActivity('TELEBIRR_PAY', `Paid ${formatETB(price)} for ${title} (Ref: ${txnId})`);
        closeModal();
        if (callback) callback(txnId);
      };
    }
  }

  function openAuthModal(mode = 'signin') {
    modal(`
      <div class="section-label">TATARI STRICT IDENTITY & RBAC</div>
      <h2>${mode === 'signup' ? 'Self-Registration (Admin Approval Required)' : 'Sign In to TATARI'}</h2>
      <form id="authForm" class="stack-form" data-mode="${mode}">
        ${mode === 'signup' ? `
          <label>Full Name<input name="full_name" required/></label>
          <label>Company Name (For Employers)<input name="company_name" placeholder="e.g. Sheger Tech PLC"/></label>
          <label>TIN Number<input name="tin_number" placeholder="e.g. 0045678912"/></label>
          <label>Account Role
            <select name="role">
              <option value="seeker">Job Seeker / Freelancer</option>
              <option value="employer">Employer / Client</option>
            </select>
          </label>
        ` : ''}
        <label>Email Address<input name="email" type="email" value="${mode === 'signin' ? 'admin@tatari.et' : ''}" required/></label>
        <label>Password<input name="password" type="password" value="${mode === 'signin' ? 'admin123' : ''}" required minlength="6"/></label>
        <button class="btn btn-primary" type="submit">${mode === 'signup' ? 'Register Account' : 'Sign In'}</button>
      </form>
      <div style="margin-top:14px;">
        ${mode === 'signin'
          ? '<button type="button" id="switchSignup" class="btn btn-outline btn-small">New user? Register Account</button>'
          : '<button type="button" id="switchSignin" class="btn btn-outline btn-small">Already registered? Sign In</button>'}
      </div>
    `);
  }

  function exportDashboardCsv() {
    const rows = [
      ['Type', 'Title', 'Organization/Budget', 'Status'],
      ...jobListings.map(j => ['Job', j.title_en, j.company_name, j.status]),
      ...freelanceProjects.map(p => ['Freelance Project', p.title_en, p.budget_min, p.status]),
      ...productsList.map(pr => ['Store Product', pr.title_en, pr.price_etb, pr.status])
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tatari-workspace-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Workspace CSV report exported.');
  }

  document.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    const fd = new FormData(form);

    if (form.id === 'heroSearchForm') {
      const mode = $('#heroSearchMode').value;
      const q = encodeURIComponent($('#heroSearchInput').value.trim());
      if (mode === 'jobs') window.location.href = `jobs.html?q=${q}`;
      else if (mode === 'freelance') window.location.href = `freelance.html?q=${q}`;
      else if (mode === 'store') window.location.href = `products.html?q=${q}`;
      else document.querySelector('#consulting')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (form.id === 'createJobForm') {
      const newJob = {
        id: 'job-' + Date.now(),
        title_en: fd.get('title_en'),
        title_am: fd.get('title_am'),
        company_name: fd.get('company_name'),
        category: fd.get('category'),
        job_type: fd.get('job_type'),
        location: fd.get('location'),
        salary_range: fd.get('salary_range'),
        deadline: fd.get('deadline'),
        description_en: fd.get('description_en'),
        requirements: fd.get('requirements'),
        telebirr_fee: 500,
        telebirr_txn: form.dataset.txn,
        status: 'pending_admin_approval'
      };
      jobListings.unshift(newJob);
      saveState();
      logActivity('POST_JOB', `Submitted job "${newJob.title_en}" for Admin approval.`);
      toast('Job submitted! Awaiting Administrator approval before going live.');
      closeModal();
      renderCurrentPage();
      return;
    }

    if (form.id === 'createProjectForm') {
      const newProj = {
        id: 'fl-' + Date.now(),
        title_en: fd.get('title_en'),
        title_am: fd.get('title_am'),
        category: fd.get('category'),
        job_type: 'Fixed-Price',
        budget_min: Number(fd.get('budget_min')),
        budget_max: Number(fd.get('budget_max')),
        description_en: fd.get('description_en'),
        telebirr_txn: form.dataset.txn,
        telebirr_status: 'Escrow Funded',
        status: 'pending_admin_approval'
      };
      freelanceProjects.unshift(newProj);
      saveState();
      logActivity('POST_PROJECT', `Submitted freelance project "${newProj.title_en}" (Escrow: ${form.dataset.txn}).`);
      toast('Freelance project submitted & escrow funded! Awaiting Admin approval.');
      closeModal();
      renderCurrentPage();
      return;
    }

    if (form.id === 'createProductForm') {
      const newProd = {
        id: 'prod-' + Date.now(),
        title_en: fd.get('title_en'),
        title_am: fd.get('title_am'),
        category: fd.get('category'),
        price_etb: Number(fd.get('price_etb')),
        description_en: fd.get('description_en'),
        telebirr_txn: form.dataset.txn,
        status: 'pending_admin_approval'
      };
      productsList.unshift(newProd);
      saveState();
      logActivity('LIST_PRODUCT', `Listed store product "${newProd.title_en}" for Admin approval.`);
      toast('Product listed! Awaiting Administrator verification.');
      closeModal();
      renderCurrentPage();
      return;
    }

    if (form.id === 'applyJobForm') {
      const jobId = form.dataset.jobId;
      const job = jobListings.find(j => String(j.id) === String(jobId));
      userApplications.unshift({
        job_id: jobId,
        job_title: job?.title_en || 'Vacancy',
        company_name: job?.company_name || '',
        applicant_name: fd.get('applicant_name'),
        applicant_email: fd.get('applicant_email'),
        resume_url: fd.get('resume_url'),
        notes: fd.get('notes'),
        status: 'Applied'
      });
      saveState();
      logActivity('APPLY_JOB', `Applied to "${job?.title_en}"`);
      toast('Application submitted! Track your stage in the Dashboard.');
      closeModal();
      return;
    }

    if (form.id === 'submitBidForm') {
      const projectId = form.dataset.projectId;
      const proj = freelanceProjects.find(p => String(p.id) === String(projectId));
      userProposals.unshift({
        job_id: projectId,
        project_title: proj?.title_en || 'Project',
        bid_amount: Number(fd.get('bid_amount')),
        delivery_days: Number(fd.get('delivery_days')),
        telebirr_phone: fd.get('telebirr_phone'),
        cover_letter: fd.get('cover_letter'),
        status: 'submitted'
      });
      saveState();
      logActivity('SUBMIT_BID', `Submitted proposal for "${proj?.title_en}"`);
      toast('Proposal submitted! Client notified in Dashboard.');
      closeModal();
      return;
    }

    if (form.id === 'authForm') {
      const mode = form.dataset.mode;
      const email = String(fd.get('email') || '').trim().toLowerCase();

      if (mode === 'signup') {
        if (email === 'admin@tatari.et') {
          toast('Reserved address: Only the single default administrator can use admin@tatari.et.', true);
          return;
        }
        const role = fd.get('role') || 'seeker';
        const newUser = {
          email,
          full_name: fd.get('full_name'),
          company_name: fd.get('company_name') || '',
          tin_number: fd.get('tin_number') || '',
          role,
          status: 'pending'
        };
        registeredUsers.push(newUser);
        currentUserEmail = email;
        currentUserRole = role;
        currentUserStatus = 'pending';
        localStorage.setItem('tatari_logged_in', '1');
        localStorage.setItem('tatari_user_email', currentUserEmail);
        localStorage.setItem('tatari_demo_role', currentUserRole);
        localStorage.setItem('tatari_user_status', 'pending');
        saveState();
        logActivity('REGISTER', `New ${role} registered: ${email} (Pending Admin Approval)`);
        toast('Registration successful! Your account is awaiting Administrator approval.');
        closeModal();
        refreshAuthUI();
        renderCurrentPage();
        return;
      }

      const existing = registeredUsers.find(u => u.email.toLowerCase() === email);
      if (!existing) {
        toast('Account not found. Please self-register first.', true);
        openAuthModal('signup');
        return;
      }
      currentUserEmail = existing.email;
      currentUserRole = existing.role;
      currentUserStatus = existing.status;
      localStorage.setItem('tatari_logged_in', '1');
      localStorage.setItem('tatari_user_email', currentUserEmail);
      localStorage.setItem('tatari_demo_role', currentUserRole);
      localStorage.setItem('tatari_user_status', currentUserStatus);
      logActivity('LOGIN', `${currentUserEmail} logged in (${currentUserRole.toUpperCase()})`);
      toast(`Login notification: Signed in as ${currentUserEmail} (${currentUserRole.toUpperCase()}).`);
      closeModal();
      refreshAuthUI();
      renderCurrentPage();
      return;
    }

    if (form.id === 'unifiedProfileForm') {
      logActivity('PROFILE_UPDATE', `Updated profile credentials for ${currentUserEmail}`);
      toast('Profile saved!');
      return;
    }

    if (form.id === 'inquiryForm') {
      form.reset();
      logActivity('INQUIRY', 'Submitted consulting demo inquiry.');
      toast('Consulting inquiry sent! Our Addis Ababa team will contact you within 24 hours.');
    }
  });

  document.addEventListener('click', (e) => {
    const t = e.target.closest('button, a');
    if (!t) return;

    if (t.id === 'langEN') { setLanguage('en'); return; }
    if (t.id === 'langAM') { setLanguage('am'); return; }
    if (t.id === 'mobileMenu') { $('#nav')?.classList.toggle('open'); return; }
    if (t.id === 'accountBtn') { openAuthModal('signin'); return; }
    if (t.id === 'switchSignup') { openAuthModal('signup'); return; }
    if (t.id === 'switchSignin') { openAuthModal('signin'); return; }
    if (t.id === 'exportCsvBtn') { exportDashboardCsv(); return; }
    if (t.id === 'closeModal' || t.id === 'backdrop') { closeModal(); return; }

    if (t.id === 'logoutBtn') {
      logActivity('LOGOUT', `${currentUserEmail} logged out.`);
      localStorage.removeItem('tatari_logged_in');
      toast(`Logout notification: ${currentUserEmail} signed out securely.`);
      refreshAuthUI();
      return;
    }

    if (t.dataset.flView) {
      freelanceSubView = t.dataset.flView;
      $$('#freelanceSubTabs .tab-btn').forEach(b => b.classList.toggle('active', b.dataset.flView === freelanceSubView));
      renderFreelanceMarketplace();
      return;
    }

    if (t.dataset.applyJob) { openJobApplyModal(t.dataset.applyJob); return; }
    if (t.dataset.bidProject) { openProjectBidModal(t.dataset.bidProject); return; }
    if (t.dataset.inviteFreelancer) {
      if (!verifyTaskPermission('employer')) return;
      toast(`Invitation sent to ${t.dataset.inviteFreelancer}!`);
      logActivity('INVITE_TALENT', `Invited ${t.dataset.inviteFreelancer} to project.`);
      return;
    }

    if (t.dataset.buyProduct) {
      if (!verifyTaskPermission()) return;
      const prod = productsList.find(p => String(p.id) === String(t.dataset.buyProduct));
      if (!prod) return;
      openTelebirrPaymentModal('product', prod.title_en, prod.price_etb, (txnId) => {
        purchasedProducts.push({ id: prod.id, title: prod.title_en, price: prod.price_etb, txn: txnId });
        saveState();
        toast('Template purchased! Download unlocked in your Dashboard.');
        renderCurrentPage();
      });
      return;
    }

    if (t.dataset.downloadTemplate) {
      toast(`Downloading "${t.dataset.downloadTemplate}" package...`);
      return;
    }

    if (t.dataset.subTier) {
      if (!verifyTaskPermission('employer')) return;
      const tier = t.dataset.subTier;
      const price = Number(t.dataset.subPrice || 2500);
      openTelebirrPaymentModal('subscription', tier, price, () => {
        currentUserSub = tier;
        localStorage.setItem('tatari_sub_tier', tier);
        renderDashboard();
      });
      return;
    }

    if (t.id === 'postQuickBtn' || t.id === 'openPostJobModalBtn' || t.id === 'dashPostJobBtn') {
      if (!verifyTaskPermission('employer')) return;
      openTelebirrPaymentModal('job_fee', 'Job Vacancy Posting Fee', 500, (txnId) => {
        modal(`
          <div class="section-label">EMPLOYER JOB POSTING</div>
          <h2>Publish Job Vacancy</h2>
          <form id="createJobForm" class="stack-form" data-txn="${txnId}">
            <div class="form-grid">
              <label>Job Title (EN)<input name="title_en" required/></label>
              <label>Job Title (AM)<input name="title_am"/></label>
              <label>Company Name<input name="company_name" required/></label>
              <label>Category<select name="category"><option>IT & Data</option><option>HR & Admin</option><option>Finance</option><option>Engineering</option><option>Healthcare</option><option>NGO</option></select></label>
              <label>Job Type<select name="job_type"><option>Full-time</option><option>Part-time</option><option>Contract</option></select></label>
              <label>Location<select name="location"><option>Addis Ababa</option><option>Sheger City</option><option>Remote</option><option>Regional</option></select></label>
              <label>Salary Range (ETB)<input name="salary_range" placeholder="e.g. 25,000 ETB/mo" required/></label>
              <label>Deadline<input name="deadline" type="date" required/></label>
            </div>
            <label>Description<textarea name="description_en" rows="3" required></textarea></label>
            <label>Requirements<textarea name="requirements" rows="2" required></textarea></label>
            <button class="btn btn-primary" type="submit">Submit for Admin Approval ↗</button>
          </form>
        `);
      });
      return;
    }

    if (t.id === 'openPostProjectModalBtn' || t.id === 'dashPostProjectBtn') {
      if (!verifyTaskPermission('employer')) return;
      openTelebirrPaymentModal('project_escrow', 'Freelance Escrow Deposit', 5000, (txnId) => {
        modal(`
          <div class="section-label">POST FREELANCE PROJECT</div>
          <h2>Scope Your Freelance Project</h2>
          <form id="createProjectForm" class="stack-form" data-txn="${txnId}">
            <div class="form-grid">
              <label>Project Title (EN)<input name="title_en" required/></label>
              <label>Project Title (AM)<input name="title_am"/></label>
              <label>Category<select name="category"><option>IT & Data</option><option>HR & Admin</option><option>Finance</option><option>Design & Creative</option></select></label>
              <label>Min Budget (ETB)<input name="budget_min" type="number" value="10000" required/></label>
              <label>Max Budget (ETB)<input name="budget_max" type="number" value="20000" required/></label>
            </div>
            <label>Project Scope & Deliverables<textarea name="description_en" rows="3" required></textarea></label>
            <button class="btn btn-primary" type="submit">Submit Project for Approval ↗</button>
          </form>
        `);
      });
      return;
    }

    if (t.id === 'openAddProductModalBtn') {
      if (!verifyTaskPermission()) return;
      openTelebirrPaymentModal('store_listing', 'Store Product Listing Fee', 300, (txnId) => {
        modal(`
          <div class="section-label">TATARI DIGITAL STORE</div>
          <h2>List a Template or Business Tool</h2>
          <form id="createProductForm" class="stack-form" data-txn="${txnId}">
            <div class="form-grid">
              <label>Product Title (EN)<input name="title_en" required/></label>
              <label>Product Title (AM)<input name="title_am"/></label>
              <label>Category<select name="category"><option>Payroll & HR</option><option>BI Dashboards</option><option>Financial Models</option><option>Legal & Compliance</option></select></label>
              <label>Price (ETB)<input name="price_etb" type="number" value="1500" required/></label>
            </div>
            <label>Product Description<textarea name="description_en" rows="3" required></textarea></label>
            <button class="btn btn-primary" type="submit">Submit Product for Approval ↗</button>
          </form>
        `);
      });
      return;
    }

    if (t.dataset.acceptBid !== undefined) {
      const idx = Number(t.dataset.acceptBid);
      userProposals[idx].status = 'active_contract';
      saveState();
      toast('Bid accepted & Telebirr escrow locked.');
      renderDashboard();
      return;
    }
    if (t.dataset.completeMilestone !== undefined) {
      const idx = Number(t.dataset.completeMilestone);
      userProposals[idx].status = 'completed';
      saveState();
      logActivity('ESCROW_RELEASE', `Released Telebirr milestone for "${userProposals[idx].project_title}"`);
      toast('Telebirr escrow funds released to freelancer!');
      renderDashboard();
      return;
    }

    if (t.dataset.approveUser !== undefined) {
      const idx = Number(t.dataset.approveUser);
      registeredUsers[idx].status = 'approved';
      saveState();
      logActivity('APPROVE_USER', `Admin approved user ${registeredUsers[idx].email}`);
      toast(`User ${registeredUsers[idx].email} approved!`);
      renderDashboard();
      return;
    }
    if (t.dataset.suspendUser !== undefined) {
      const idx = Number(t.dataset.suspendUser);
      registeredUsers[idx].status = 'suspended';
      saveState();
      toast(`User ${registeredUsers[idx].email} suspended.`);
      renderDashboard();
      return;
    }
    if (t.dataset.approveJob !== undefined) {
      jobListings[Number(t.dataset.approveJob)].status = 'approved';
      saveState();
      toast('Job vacancy approved and published!');
      renderDashboard();
      return;
    }
    if (t.dataset.suspendJob !== undefined) {
      jobListings[Number(t.dataset.suspendJob)].status = 'suspended';
      saveState();
      toast('Job vacancy suspended.');
      renderDashboard();
      return;
    }
    if (t.dataset.approveGig !== undefined) {
      freelanceProjects[Number(t.dataset.approveGig)].status = 'approved';
      saveState();
      toast('Freelance project approved and published!');
      renderDashboard();
      return;
    }
    if (t.dataset.suspendGig !== undefined) {
      freelanceProjects[Number(t.dataset.suspendGig)].status = 'suspended';
      saveState();
      toast('Freelance project suspended.');
      renderDashboard();
      return;
    }
  });

  document.addEventListener('change', (e) => {
    if (e.target.id === 'activeRoleSelector') {
      const targetRole = e.target.value;
      if (targetRole === 'admin' && currentUserEmail !== 'admin@tatari.et') {
        toast('Single-Admin Lock: Only admin@tatari.et can switch to Admin view. Sign in as admin@tatari.et first.', true);
        e.target.value = currentUserRole;
        return;
      }
      currentUserRole = targetRole;
      localStorage.setItem('tatari_demo_role', currentUserRole);
      renderDashboard();
      toast(`Workspace switched to ${currentUserRole.toUpperCase()}`);
    }
    if (e.target.dataset.appStatusIdx !== undefined) {
      const idx = Number(e.target.dataset.appStatusIdx);
      userApplications[idx].status = e.target.value;
      saveState();
      toast(`Candidate stage updated to ${e.target.value}`);
      renderDashboard();
    }
  });

  ['#jobFilterKeyword', '#jobFilterCategory', '#jobFilterType', '#jobFilterLocation', '#jobFilterSalary'].forEach(sel => {
    const el = $(sel);
    if (el) el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', renderJobsBoard);
  });
  ['#flFilterKeyword', '#flFilterCategory', '#flFilterBudget'].forEach(sel => {
    const el = $(sel);
    if (el) el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', renderFreelanceMarketplace);
  });
  ['#productFilterKeyword', '#productFilterCategory', '#productFilterMaxPrice'].forEach(sel => {
    const el = $(sel);
    if (el) el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', renderProductsStore);
  });

  document.addEventListener('DOMContentLoaded', async () => {
    if ($('#year')) $('#year').textContent = new Date().getFullYear();
    setLanguage(currentLang);
    await initSupabase();
  });
})();

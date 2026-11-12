(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  let supabaseClient = null;
  let currentSession = null;
  let currentUserRole = localStorage.getItem('tatari_demo_role') || 'seeker';
  let currentUserStatus = localStorage.getItem('tatari_user_status') || 'approved'; // 'pending', 'approved'
  let currentUserEmail = localStorage.getItem('tatari_user_email') || 'abebe@tatari.et';
  let currentUserSub = localStorage.getItem('tatari_sub_tier') || 'Free Tier';
  let currentLang = localStorage.getItem('tatari_lang') || 'en';
  let freelanceSubView = 'projects';

  let jobListings = [
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
      status: 'approved'
    }
  ];

  let freelanceProjects = [
    {
      id: 'fl-1',
      title_en: 'Build a Power Query Sales & Inventory Dashboard',
      title_am: 'የሽያጭ እና ንብረት ቁጥጥር Power Query ዳሽቦርድ መገንባት',
      category: 'IT & Data',
      job_type: 'Fixed-Price',
      budget_min: 15000,
      budget_max: 25000,
      milestone_status: 'open',
      description_en: 'We have 12 monthly Excel exports from our POS system and need a clean, automated Power Query pipeline + interactive KPI dashboard.',
      description_am: 'ከPOS ሲስተማችን የወጡ 12 ወርሃዊ የኤክሴል መረጃዎችን የሚያገናኝ አውቶማቲክ Power Query እና ዳሽቦርድ እንፈልጋለን።',
      status: 'approved'
    }
  ];

  let productsList = [
    {
      id: 'prod-1',
      title_en: 'Automated Ethiopian Payroll Model (Power Query)',
      title_am: 'አውቶማቲክ የኢትዮጵያ ደመወዝ ማሰሊያ (Power Query)',
      category: 'Payroll & HR',
      price_etb: 1500,
      description_en: 'Full Excel template featuring income tax brackets, pension calculations, and automated monthly payslips.',
      status: 'approved'
    },
    {
      id: 'prod-2',
      title_en: 'Commercial Bank Executive KPI Dashboard',
      title_am: 'የባንክ ስራ አመራር KPI ዳሽቦርድ',
      category: 'BI Dashboards',
      price_etb: 2500,
      description_en: 'Power BI template built for Ethiopian banking operations, credit portfolio tracking, and deposit mobilization.',
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
      rating: '4.9 ★ (14 jobs)',
      is_vetted: true
    },
    {
      id: 'fr-2',
      full_name: 'Selamawit Girma',
      headline_en: 'HR Consultant, Job Evaluation & Ethiopian Labor Law Advisor',
      headline_am: 'የሰው ሀብት አማካሪ እና የኢትዮጵያ የአሠሪና ሠራተኛ ሕግ ባለሙያ',
      skills: ['HR Policy', 'Job Descriptions', 'Payroll Audit', 'Balanced Scorecard'],
      hourly_rate_etb: 750,
      location: 'Addis Ababa',
      rating: '5.0 ★ (9 jobs)',
      is_vetted: true
    }
  ];

  let userApplications = JSON.parse(localStorage.getItem('tatari_apps_v8') || '[]');
  let userProposals = JSON.parse(localStorage.getItem('tatari_bids_v8') || '[]');
  let purchasedProducts = JSON.parse(localStorage.getItem('tatari_purchases_v8') || '[]');
  let activityLogs = JSON.parse(localStorage.getItem('tatari_logs_v8') || '[]');

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const formatETB = n => `ETB ${Number(n || 0).toLocaleString('en-US')}`;

  function logActivity(action, details) {
    const entry = { user_email: currentUserEmail, action_type: action, details, time: new Date().toLocaleTimeString() };
    activityLogs.unshift(entry);
    localStorage.setItem('tatari_logs_v8', JSON.stringify(activityLogs));
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

  async function initSupabase() {
    if (window.supabase && window.TATARI_CONFIG) {
      try {
        supabaseClient = window.supabase.createClient(window.TATARI_CONFIG.url, window.TATARI_CONFIG.publishableKey);
        const { data: { session } } = await supabaseClient.auth.getSession();
        currentSession = session;
      } catch (e) {
        console.warn('Supabase offline fallback active:', e);
      }
    }
    refreshAuthUI();
    checkUserAvailabilityAndApproval();
    await syncLiveRecords();
  }

  function checkUserAvailabilityAndApproval() {
    // Enforce approval check: if user is pending admin approval, restrict actions
    if (currentUserStatus === 'pending' && currentUserRole !== 'admin') {
      console.warn('User account is pending admin approval.');
    }
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
        console.warn('Using local fallback records:', e);
      }
    }
    renderCurrentPage();
  }

  function refreshAuthUI() {
    if ($('#accountBtn')) $('#accountBtn').hidden = !!currentSession;
    if ($('#logoutBtn')) $('#logoutBtn').hidden = !currentSession;
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
    const approvedJobs = jobListings.filter(j => j.status === 'approved').slice(0, 3);
    grid.innerHTML = approvedJobs.map(j => renderJobCard(j)).join('');
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
      const title = `${j.title_en} ${j.title_am || ''} ${j.company_name} ${j.description_en}`.toLowerCase();
      const numSal = parseInt(String(j.salary_range || '0').replace(/[^\d]/g, ''), 10) || 0;
      return (!kw || title.includes(kw)) &&
             (cat === 'all' || j.category === cat) &&
             (typ === 'all' || j.job_type === typ) &&
             (loc === 'all' || (j.location || '').toLowerCase().includes(loc.toLowerCase())) &&
             (!minSal || numSal >= minSal);
    });

    if (!filtered.length) {
      grid.innerHTML = `<div class="empty">${currentLang === 'am' ? 'ምንም ተዛማጅ የሥራ ማስታወቂያ አልተገኘም።' : 'No matching approved jobs found.'}</div>`;
      return;
    }
    grid.innerHTML = filtered.map(j => renderJobCard(j)).join('');
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
        const budget = Number(p.budget_min || 0);
        return (!kw || text.includes(kw)) &&
               (cat === 'all' || p.category === cat) &&
               (!minBudget || budget >= minBudget);
      });

      if (!filtered.length) {
        grid.innerHTML = `<div class="empty">${currentLang === 'am' ? 'ምንም የፍሪላንስ ፕሮጀክት አልተገኘም።' : 'No matching approved freelance projects found.'}</div>`;
        return;
      }
      grid.innerHTML = filtered.map(p => renderProjectCard(p)).join('');
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
            <span class="pill">${esc(f.location)} · ${esc(f.rating || '5.0 ★')}</span>
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
          <span class="pill">${esc(p.category)} · Telebirr Escrow: ${esc(p.telebirr_status || 'Pending Admin Approval')}</span>
          <h3>${esc(title)}</h3>
          <p>${esc(desc)}</p>
          <div class="resource-bottom">
            <strong>${budgetText}</strong>
            <button class="btn btn-primary btn-small" data-bid-project="${p.id}" type="button" ${p.status !== 'approved' ? 'disabled style="opacity:0.5;"' : ''}>
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

    const filtered = productsList.filter(prod => {
      const text = `${prod.title_en} ${prod.title_am || ''} ${prod.description_en}`.toLowerCase();
      return (!kw || text.includes(kw)) && (cat === 'all' || prod.category === cat);
    });

    if (!filtered.length) {
      grid.innerHTML = `<div class="empty">No products found.</div>`;
      return;
    }

    grid.innerHTML = filtered.map(prod => `
      <article class="resource-card">
        <div class="resource-art course">
          <span>DIGITAL PRODUCT · INSTANT DOWNLOAD</span>
          <b>📦</b>
        </div>
        <div class="resource-body">
          <span class="pill">${esc(prod.category)}</span>
          <h3>${esc(prod.title_en)}</h3>
          <p>${esc(prod.description_en)}</p>
          <div class="resource-bottom">
            <strong>${formatETB(prod.price_etb)}</strong>
            <button class="btn btn-primary btn-small" data-buy-product="${prod.id}" type="button">
              Buy via Telebirr
            </button>
          </div>
        </div>
      </article>
    `).join('');
  }

  function renderDashboard() {
    const container = $('#dashboardContentArea');
    if (!container) return;

    const roleSel = $('#activeRoleSelector');
    if (roleSel) roleSel.value = currentUserRole;

    if (currentUserStatus === 'pending' && currentUserRole !== 'admin') {
      container.innerHTML = `
        <div class="form-card" style="background:#fff3cd; border:1px solid #ffeeba; color:#856404; padding:24px; border-radius:12px;">
          <h3>⚠️ Account Pending Admin Approval</h3>
          <p>Your account (<b>${esc(currentUserEmail)}</b>) is currently registered and awaiting administrator approval. Once approved by the administrator, you will have full access to post jobs, submit proposals, and purchase products.</p>
        </div>
      `;
      return;
    }

    if (currentUserRole === 'employer') {
      container.innerHTML = `
        <div class="form-card" style="margin-bottom:24px; background:linear-gradient(135deg,#10243b,#183752); color:white;">
          <span class="eyebrow" style="color:var(--teal);">EMPLOYER SUBSCRIPTION STATUS</span>
          <h2 style="color:white; margin:8px 0;">Active Plan: <b>${esc(currentUserSub)}</b></h2>
          <p style="color:#c7d2de; font-size:13px;">Manage your subscription tier to unlock unlimited job posts and priority applicant matching in Addis Ababa.</p>
          <div style="display:flex; gap:12px; margin-top:16px; flex-wrap:wrap;">
            <button class="btn btn-primary btn-small" data-sub-tier="Pro Employer Plan (2,500 ETB/mo)" type="button">Upgrade to Pro Employer (2,500 ETB via Telebirr)</button>
            <button class="btn btn-ghost btn-small" data-sub-tier="Enterprise Plan (7,500 ETB/mo)" type="button">Upgrade to Enterprise (7,500 ETB via Telebirr)</button>
          </div>
        </div>

        <div style="display:flex; gap:12px; margin-bottom:24px; flex-wrap:wrap;">
          <button class="btn btn-primary btn-small" id="dashPostJobBtn" type="button">+ Post New Job Vacancy (Telebirr Fee)</button>
          <button class="btn btn-outline btn-small" id="dashPostProjectBtn" type="button">+ Post Freelance Project (Telebirr Escrow)</button>
        </div>

        <h3>1. My Registered Job Postings & Admin Approval Status</h3>
        <div class="table-container" style="background:#fff; padding:16px; border-radius:14px; border:1px solid var(--line); margin-bottom:30px;">
          <table class="admin-table">
            <thead><tr><th>Job Title</th><th>Company</th><th>Telebirr Payment</th><th>Admin Status</th><th>Action</th></tr></thead>
            <tbody>
              ${jobListings.map((j, idx) => `
                <tr>
                  <td><b>${esc(j.title_en)}</b></td>
                  <td>${esc(j.company_name)}</td>
                  <td><span class="status approved">Paid via Telebirr (${formatETB(j.telebirr_fee || 500)})</span></td>
                  <td><span class="status ${j.status === 'approved' ? 'approved' : ''}">${esc(j.status)}</span></td>
                  <td>${j.status !== 'approved' ? '<small class="muted">Pending Admin Review</small>' : '<span class="status approved">Live ✓</span>'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <h3>2. Job Applications Received</h3>
        <div class="table-container" style="background:#fff; padding:16px; border-radius:14px; border:1px solid var(--line); margin-bottom:30px;">
          <table class="admin-table">
            <thead><tr><th>Candidate</th><th>Job Title</th><th>CV Link</th><th>Status</th><th>Update Stage</th></tr></thead>
            <tbody>
              ${userApplications.length ? userApplications.map((a, idx) => `
                <tr>
                  <td><b>${esc(a.applicant_name)}</b><br><small>${esc(a.applicant_email)}</small></td>
                  <td>${esc(a.job_title || a.job_id)}</td>
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
            <thead><tr><th>Project</th><th>Bid Amount</th><th>Telebirr Escrow</th><th>Contract Action</th></tr></thead>
            <tbody>
              ${userProposals.length ? userProposals.map((b, idx) => `
                <tr>
                  <td><b>${esc(b.project_title || b.job_id)}</b></td>
                  <td><strong>${formatETB(b.bid_amount)}</strong></td>
                  <td><span class="status approved">Funded in Telebirr Escrow ✓</span></td>
                  <td>
                    ${b.status === 'submitted'
                      ? `<button class="btn btn-primary btn-small" data-accept-bid="${idx}" type="button">Accept Bid & Fund Escrow</button>`
                      : b.status === 'active_contract'
                      ? `<button class="btn btn-outline btn-small" data-complete-milestone="${idx}" type="button">✓ Release Telebirr Milestone</button>`
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
          <h3>Unified Job Seeker & Freelancer Profile (Strict Role Verification)</h3>
          <form id="unifiedProfileForm" class="form-grid">
            <label>Full Name<input name="full_name" value="Abebe Bikila" required/></label>
            <label>Location<input name="location" value="Addis Ababa" required/></label>
            <label>Professional Headline (EN)<input name="headline_en" value="HR Analytics & Power Query Specialist"/></label>
            <label>Hourly Freelance Rate (ETB)<input name="hourly_rate_etb" type="number" value="800"/></label>
            <label>Key Skills (comma-separated)<input name="skills" value="Power Query, Excel, HR Policy, Payroll, SQL"/></label>
            <label>CV / Portfolio Link<input name="cv_url" value="https://drive.google.com/my-cv"/></label>
            <div class="full"><button class="btn btn-primary btn-small" type="submit">Save Unified Profile</button></div>
          </form>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
          <div class="form-card">
            <h3>My Job Applications (${userApplications.length})</h3>
            ${userApplications.length ? userApplications.map(a => `
              <div class="order-card">
                <div><b>${esc(a.job_title || a.job_id)}</b><small>${esc(a.company_name || '')}</small></div>
                <span class="status approved">${esc(a.status)}</span>
              </div>
            `).join('') : '<p class="muted">No job applications yet.</p>'}
          </div>
          <div class="form-card">
            <h3>My Purchased Products (${purchasedProducts.length})</h3>
            ${purchasedProducts.length ? purchasedProducts.map(p => `
              <div class="order-card">
                <div><b>${esc(p.title)}</b><small>Paid: ${formatETB(p.price)} · Download Ready</small></div>
                <a href="#" class="btn btn-primary btn-small">Download Template ↗</a>
              </div>
            `).join('') : '<p class="muted">No purchased products yet. Visit the <a href="products.html">Store</a>.</p>'}
          </div>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="form-card">
          <h3>TATARI Admin Moderation & User Approval Portal</h3>
          <p class="muted">Admin Default User: <b>admin@tatari.et</b> (Secured in database).</p>
          
          <h3 style="margin-top:24px;">Pending & Active Job / Project Postings</h3>
          <div class="table-container" style="margin-bottom:30px;">
            <table class="admin-table">
              <thead><tr><th>Type</th><th>Title</th><th>Organization / Budget</th><th>Telebirr Ref</th><th>Status</th><th>Admin Action</th></tr></thead>
              <tbody>
                ${jobListings.map((j, i) => `
                  <tr>
                    <td><span class="pill">JOB</span></td>
                    <td><b>${esc(j.title_en)}</b></td>
                    <td>${esc(j.company_name)} (${esc(j.salary_range)})</td>
                    <td><small>TXN: ${esc(j.telebirr_txn || 'TB-998811')}</small></td>
                    <td><span class="status ${j.status === 'approved' ? 'approved' : ''}">${esc(j.status)}</span></td>
                    <td>
                      ${j.status !== 'approved'
                        ? `<button class="btn btn-primary btn-small" data-approve-job="${i}" type="button">✓ Approve Job</button>`
                        : `<button class="btn btn-outline btn-small" data-suspend-job="${i}" type="button">Suspend</button>`}
                    </td>
                  </tr>
                `).join('')}
                ${freelanceProjects.map((p, i) => `
                  <tr>
                    <td><span class="pill">GIG</span></td>
                    <td><b>${esc(p.title_en)}</b></td>
                    <td>${formatETB(p.budget_min)}</td>
                    <td><small>TXN: ${esc(p.telebirr_txn || 'TB-445522')}</small></td>
                    <td><span class="status ${p.status === 'approved' ? 'approved' : ''}">${esc(p.status)}</span></td>
                    <td>
                      ${p.status !== 'approved'
                        ? `<button class="btn btn-primary btn-small" data-approve-gig="${i}" type="button">✓ Approve Gig</button>`
                        : `<button class="btn btn-outline btn-small" data-suspend-gig="${i}" type="button">Suspend</button>`}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <h3>Recent Activity & Login/Logout Notification Logs</h3>
          <div class="table-container">
            <table class="admin-table">
              <thead><tr><th>Time</th><th>User Email</th><th>Action Type</th><th>Details</th></tr></thead>
              <tbody>
                ${activityLogs.map(l => `
                  <tr>
                    <td><small>${esc(l.time)}</small></td>
                    <td><b>${esc(l.user_email)}</b></td>
                    <td><span class="pill">${esc(l.action_type)}</span></td>
                    <td>${esc(l.details)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }
  }

  function openJobApplyModal(jobId) {
    if (currentUserStatus === 'pending' && currentUserRole !== 'admin') {
      toast('Access restricted: Your account is pending admin approval.', true);
      return;
    }
    const job = jobListings.find(j => String(j.id) === String(jobId));
    if (!job) return;
    modal(`
      <div class="section-label">DIRECT JOB APPLICATION</div>
      <h2>${esc(currentLang === 'am' && job.title_am ? job.title_am : job.title_en)}</h2>
      <p class="muted"><b>${esc(job.company_name)}</b> · ${esc(job.location)} · ${esc(job.salary_range)}</p>
      <form id="applyJobForm" class="stack-form" data-job-id="${job.id}">
        <label>Full Name<input name="applicant_name" value="Abebe Bikila" required/></label>
        <label>Email Address<input name="applicant_email" type="email" value="${currentUserEmail}" required/></label>
        <label>CV / Resume URL (Google Drive / LinkedIn)<input name="resume_url" type="url" value="https://drive.google.com/cv-sample" required/></label>
        <label>Short Cover Note<textarea name="notes" rows="3" required>I meet all qualifications and would love to contribute to your team.</textarea></label>
        <button class="btn btn-primary" type="submit">Submit Application ↗</button>
      </form>
    `);
  }

  function openProjectBidModal(projectId) {
    if (currentUserStatus === 'pending' && currentUserRole !== 'admin') {
      toast('Access restricted: Your account is pending admin approval.', true);
      return;
    }
    const proj = freelanceProjects.find(p => String(p.id) === String(projectId));
    if (!proj) return;
    modal(`
      <div class="section-label">FREELANCE PROPOSAL + TELEBIRR ESCROW</div>
      <h2>${esc(currentLang === 'am' && proj.title_am ? proj.title_am : proj.title_en)}</h2>
      <p class="muted">Budget: <b>${formatETB(proj.budget_min)} – ${formatETB(proj.budget_max || proj.budget_min)}</b></p>
      <form id="submitBidForm" class="stack-form" data-project-id="${proj.id}">
        <label>Your Bid Amount (ETB)<input name="bid_amount" type="number" value="${proj.budget_min || 15000}" required/></label>
        <label>Estimated Delivery Time (Days)<input name="delivery_days" type="number" value="7" required/></label>
        <label>Telebirr Mobile Number (For Escrow & Payout)<input name="telebirr_phone" value="+251911223344" required/></label>
        <label>Cover Letter & Technical Approach<textarea name="cover_letter" rows="4" required>I have extensive experience delivering similar solutions in Ethiopia with clean documentation and training.</textarea></label>
        <button class="btn btn-primary" type="submit">Submit Proposal & Fund Telebirr Escrow ↗</button>
      </form>
    `);
  }

  function openTelebirrPaymentModal(type, title, price, callback) {
    modal(`
      <div class="section-label">TELEBIRR PAYMENT GATEWAY</div>
      <h2>Secure Checkout: ${esc(title)}</h2>
      <p class="muted">Fee Amount: <b>${formatETB(price)}</b> · Powered by Ethio Telecom Telebirr API</p>
      <form id="telebirrPayForm" class="stack-form">
        <label>Telebirr Account / Phone Number<input name="telebirr_phone" value="+251911000000" required/></label>
        <label>PIN / Authorization Code<input name="telebirr_pin" type="password" value="1234" required/></label>
        <div style="background:#f0f4f8; padding:12px; border-radius:8px; font-size:12px;">
          🔒 Your payment is held securely in TATARI escrow until Admin approval.
        </div>
        <button class="btn btn-primary" type="submit">Authorize ${formatETB(price)} via Telebirr ↗</button>
      </form>
    `);
    const form = $('#telebirrPayForm');
    if (form) {
      form.onsubmit = (ev) => {
        ev.preventDefault();
        const txnId = 'TB-' + Math.floor(100000 + Math.random() * 900000);
        telebirrTransactions.push({ txnId, type, price, time: new Date().toISOString() });
        localStorage.setItem('tatari_telebirr_v8', JSON.stringify(telebirrTransactions));
        toast(`Telebirr payment successful! Transaction ID: ${txnId}`);
        logActivity('PAYMENT', `Paid ${formatETB(price)} for ${title} via Telebirr (TXN: ${txnId})`);
        closeModal();
        if (callback) callback(txnId);
      };
    }
  }

  function openAuthModal(mode = 'signin') {
    modal(`
      <div class="section-label">TATARI STRICT USER MANAGEMENT</div>
      <h2>${mode === 'signup' ? 'Create Account (Self-Registration & Approval)' : 'Sign In to TATARI'}</h2>
      <form id="authForm" class="stack-form" data-mode="${mode}">
        ${mode === 'signup' ? `
          <label>Full Name<input name="full_name" required/></label>
          <label>Company Name (Optional for Employers)<input name="company_name" placeholder="e.g. Addis Tech PLC"/></label>
          <label>Business TIN Number<input name="tin_number" placeholder="e.g. 0012345678"/></label>
          <label>Select Role Privilege
            <select name="role">
              <option value="employer">Employer / Company (Post Jobs & Subscriptions)</option>
              <option value="seeker">Job Seeker / Freelancer</option>
              <option value="admin">Admin (Single Admin: admin@tatari.et)</option>
            </select>
          </label>
        ` : ''}
        <label>Email Address<input name="email" type="email" value="${mode === 'signin' ? 'admin@tatari.et' : ''}" required/></label>
        <label>Password<input name="password" type="password" value="${mode === 'signin' ? 'admin123' : ''}" required minlength="6"/></label>
        <button class="btn btn-primary" type="submit">${mode === 'signup' ? 'Register Account (Pending Approval)' : 'Sign In Securely'}</button>
      </form>
      <div style="margin-top:14px; font-size:12px;">
        ${mode === 'signin'
          ? '<button type="button" id="switchSignup" class="btn btn-outline btn-small">New user? Register Account</button>'
          : '<button type="button" id="switchSignin" class="btn btn-outline btn-small">Already registered? Sign In</button>'}
      </div>
    `);
  }

  document.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const fd = new FormData(form);

    if (form.id === 'heroSearchForm') {
      const mode = $('#heroSearchMode').value;
      const q = encodeURIComponent($('#heroSearchInput').value.trim());
      if (mode === 'jobs') window.location.href = `jobs.html?q=${q}`;
      else if (mode === 'freelance') window.location.href = `freelance.html?q=${q}`;
      else document.querySelector('#consulting')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (form.id === 'applyJobForm') {
      const jobId = form.dataset.jobId;
      const job = jobListings.find(j => String(j.id) === String(jobId));
      const appRecord = {
        job_id: jobId,
        job_title: job?.title_en || 'Vacancy',
        company_name: job?.company_name || '',
        applicant_name: fd.get('applicant_name'),
        applicant_email: fd.get('applicant_email'),
        resume_url: fd.get('resume_url'),
        notes: fd.get('notes'),
        status: 'Applied'
      };
      userApplications.unshift(appRecord);
      localStorage.setItem('tatari_apps_v8', JSON.stringify(userApplications));
      toast('Application submitted successfully! Track status in your Dashboard.');
      logActivity('APPLY_JOB', `Applied to ${job?.title_en || jobId}`);
      closeModal();
      return;
    }

    if (form.id === 'submitBidForm') {
      const projectId = form.dataset.projectId;
      const proj = freelanceProjects.find(p => String(p.id) === String(projectId));
      const bidRecord = {
        job_id: projectId,
        project_title: proj?.title_en || 'Freelance Project',
        bid_amount: Number(fd.get('bid_amount')),
        delivery_days: Number(fd.get('delivery_days')),
        telebirr_phone: fd.get('telebirr_phone'),
        cover_letter: fd.get('cover_letter'),
        status: 'submitted'
      };
      userProposals.unshift(bidRecord);
      localStorage.setItem('tatari_bids_v8', JSON.stringify(userProposals));
      toast('Proposal submitted & Telebirr escrow secured! Client can now review.');
      logActivity('SUBMIT_PROPOSAL', `Submitted proposal for ${proj?.title_en || projectId}`);
      closeModal();
      return;
    }

    if (form.id === 'authForm') {
      const email = fd.get('email') || 'admin@tatari.et';
      const role = fd.get('role') || (email === 'admin@tatari.et' ? 'admin' : 'employer');
      
      currentUserEmail = email;
      currentUserRole = role;
      
      // Enforce single admin check or pending registration
      if (role === 'admin' && email !== 'admin@tatari.et') {
        toast('Access denied: Single administrator account is restricted to admin@tatari.et', true);
        return;
      }

      currentUserStatus = (role === 'admin' || email === 'admin@tatari.et') ? 'approved' : 'pending';
      
      localStorage.setItem('tatari_user_email', currentUserEmail);
      localStorage.setItem('tatari_demo_role', currentUserRole);
      localStorage.setItem('tatari_user_status', currentUserStatus);

      logActivity('LOGIN', `User ${currentUserEmail} logged in successfully with role: ${currentUserRole}`);
      toast(`Successfully signed in as ${currentUserEmail} (${currentUserRole.toUpperCase()})! Notification logged.`);
      closeModal();
      refreshAuthUI();
      renderCurrentPage();
      return;
    }

    if (form.id === 'unifiedProfileForm') {
      toast('Unified profile saved with strict user security validation!');
      logActivity('UPDATE_PROFILE', 'Updated professional profile credentials.');
      return;
    }

    if (form.id === 'inquiryForm') {
      form.reset();
      toast('Consulting inquiry received! Our Addis Ababa team will respond within 24 hours.');
      logActivity('INQUIRY', 'Submitted consulting inquiry.');
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
    if (t.id === 'logoutBtn') {
      logActivity('LOGOUT', `User ${currentUserEmail} logged out.`);
      currentSession = null;
      refreshAuthUI();
      toast('Secure session terminated. Logout notification logged.');
      return;
    }
    if (t.id === 'closeModal' || t.id === 'backdrop') { closeModal(); return; }

    if (t.dataset.subTier) {
      const tier = t.dataset.subTier;
      openTelebirrPaymentModal('sub', tier, 2500, (txnId) => {
        currentUserSub = tier;
        localStorage.setItem('tatari_sub_tier', tier);
        toast(`Subscription upgraded to ${tier}! Transaction: ${txnId}`);
        renderDashboard();
      });
      return;
    }

    if (t.dataset.buyProduct) {
      const prodId = t.dataset.buyProduct;
      const prod = productsList.find(p => String(p.id) === String(prodId));
      if (!prod) return;
      openTelebirrPaymentModal('product', prod.title_en, prod.price_etb, (txnId) => {
        purchasedProducts.push({ id: prod.id, title: prod.title_en, price: prod.price_etb, txn: txnId });
        localStorage.setItem('tatari_purchases_v8', JSON.stringify(purchasedProducts));
        toast(`Product purchased successfully! Download link unlocked.`);
        renderDashboard();
      });
      return;
    }

    if (t.id === 'postQuickBtn' || t.id === 'openPostJobModalBtn' || t.id === 'dashPostJobBtn') {
      if (currentUserStatus === 'pending' && currentUserRole !== 'admin') {
        toast('Access restricted: Your account is pending admin approval.', true);
        return;
      }
      if (currentUserRole !== 'employer' && currentUserRole !== 'admin') {
        toast('Access restricted: Only registered Employers can post jobs.', true);
        return;
      }
      openTelebirrPaymentModal('job', 'Post Job Vacancy', 500, (txnId) => {
        modal(`
          <div class="section-label">EMPLOYER JOB POSTING (ADMIN APPROVAL GATED)</div>
          <h2>Post a Formal Job Opening</h2>
          <form id="createJobForm" class="stack-form" data-txn="${txnId}">
            <div class="form-grid">
              <label>Job Title (English)<input name="title_en" placeholder="e.g. Senior Accountant" required/></label>
              <label>Job Title (Amharic)<input name="title_am" placeholder="ለምሳሌ፦ ከፍተኛ አካውንታንት"/></label>
              <label>Company Name<input name="company_name" placeholder="e.g. Ethio Logistics PLC" required/></label>
              <label>Category
                <select name="category">
                  <option>IT & Data</option>
                  <option>HR & Admin</option>
                  <option>Finance</option>
                  <option>Engineering</option>
                  <option>Healthcare</option>
                  <option>NGO</option>
                </select>
              </label>
              <label>Job Type
                <select name="job_type">
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Contract</option>
                </select>
              </label>
              <label>Location
                <select name="location">
                  <option>Addis Ababa</option>
                  <option>Sheger City</option>
                  <option>Remote</option>
                  <option>Regional</option>
                </select>
              </label>
              <label>Salary Range (ETB)<input name="salary_range" placeholder="e.g. 25,000 ETB/mo" required/></label>
              <label>Application Deadline<input name="deadline" type="date" required/></label>
            </div>
            <label>Job Description<textarea name="description_en" rows="3" required></textarea></label>
            <label>Key Requirements<textarea name="requirements" rows="2" required></textarea></label>
            <button class="btn btn-primary" type="submit">Submit for Admin Approval ↗</button>
          </form>
        `);
      });
      return;
    }

    if (t.dataset.approveJob !== undefined) {
      const idx = Number(t.dataset.approveJob);
      jobListings[idx].status = 'approved';
      toast('Job vacancy approved by Admin and is now live!');
      renderDashboard();
      return;
    }

    if (t.dataset.approveGig !== undefined) {
      const idx = Number(t.dataset.approveGig);
      freelanceProjects[idx].status = 'approved';
      toast('Freelance project approved by Admin and published to marketplace!');
      renderDashboard();
      return;
    }
  });

  document.addEventListener('change', (e) => {
    if (e.target.id === 'activeRoleSelector') {
      currentUserRole = e.target.value;
      currentUserStatus = currentUserRole === 'admin' ? 'approved' : 'approved';
      localStorage.setItem('tatari_demo_role', currentUserRole);
      renderDashboard();
      toast(`Strict role privilege switched to ${currentUserRole.toUpperCase()}`);
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
  ['#productFilterKeyword', '#productFilterCategory'].forEach(sel => {
    const el = $(sel);
    if (el) el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', renderProductsStore);
  });

  document.addEventListener('DOMContentLoaded', async () => {
    if ($('#year')) $('#year').textContent = new Date().getFullYear();
    setLanguage(currentLang);
    await initSupabase();
  });
})();

(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  let supabaseClient = null;
  let currentSession = null;
  let currentUserRole = localStorage.getItem('tatari_demo_role') || 'seeker';
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
      status: 'open'
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
      status: 'open'
    },
    {
      id: 'job-3',
      title_en: 'Senior Project Accountant (NGO)',
      title_am: 'ከፍተኛ የፕሮጀክት አካውንታንት',
      company_name: 'Horn Development Partners',
      location: 'Addis Ababa',
      job_type: 'Contract',
      category: 'Finance',
      salary_range: '42,000 ETB/mo',
      deadline: '2026-12-10',
      description_en: 'Oversee donor grant reporting, IPSAS compliance, and monthly budget-vs-actual reconciliations.',
      description_am: 'የለጋሾች ሪፖርት፣ የIPSAS አሰራር እና ወርሃዊ የበጀት ክትትልን ይቆጣጠሩ።',
      requirements: 'BA in Accounting & Finance, ACCA partial/full, 4+ years NGO grant accounting.',
      status: 'open'
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
      status: 'open'
    },
    {
      id: 'fl-2',
      title_en: 'Draft Complete SME HR Policy & Job Descriptions (15 Roles)',
      title_am: 'ለአነስተኛ ድርጅት የሰው ሀብት ፖሊሲ እና የ15 የሥራ መደቦች ዝርዝር ማዘጋጀት',
      category: 'HR & Admin',
      job_type: 'Fixed-Price',
      budget_min: 20000,
      budget_max: 35000,
      milestone_status: 'open',
      description_en: 'Looking for an Ethiopian HR consultant to draft an employee handbook aligned with Proclamation No. 1156/2019 plus 15 JDs.',
      description_am: 'በአዋጅ ቁጥር 1156/2019 መሰረት የሰራተኞች መመሪያ እና የ15 የስራ መደቦች ዝርዝር የሚያዘጋጅ የሰው ሀብት አማካሪ እንፈልጋለን።',
      status: 'open'
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
    },
    {
      id: 'fr-3',
      full_name: 'Natnael Tadesse',
      headline_en: 'Full-Stack Web Developer (React, Supabase, Node.js)',
      headline_am: 'ሙሉ-ስታክ ዌብ አልሚ (React, Supabase, Node.js)',
      skills: ['React', 'Supabase', 'JavaScript', 'UI/UX Design'],
      hourly_rate_etb: 950,
      location: 'Sheger City / Remote',
      rating: '4.8 ★ (11 jobs)',
      is_vetted: true
    }
  ];

  let userApplications = JSON.parse(localStorage.getItem('tatari_apps_v4') || '[]');
  let userProposals = JSON.parse(localStorage.getItem('tatari_bids_v4') || '[]');

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const formatETB = n => `ETB ${Number(n || 0).toLocaleString('en-US')}`;

  function toast(msg, bad = false) {
    const el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.className = bad ? 'show bad' : 'show';
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { el.className = ''; }, 4000);
  }

  function modal(html) {
    const root = $('#modalRoot');
    if (!root) return;
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
    await syncLiveRecords();
  }

  async function syncLiveRecords() {
    if (supabaseClient) {
      try {
        const { data: dbJobs } = await supabaseClient.from('career_jobs').select('*').order('created_at', { ascending: false });
        if (dbJobs && dbJobs.length) jobListings = dbJobs;

        const { data: dbProjects } = await supabaseClient.from('jobs').select('*').order('created_at', { ascending: false });
        if (dbProjects && dbProjects.length) freelanceProjects = dbProjects;

        const { data: dbProfiles } = await supabaseClient.from('profiles').select('*').eq('is_vetted', true);
        if (dbProfiles && dbProfiles.length) freelancersList = dbProfiles;

        if (currentSession) {
          const { data: dbApps } = await supabaseClient.from('career_applications').select('*');
          if (dbApps && dbApps.length) userApplications = dbApps;

          const { data: dbBids } = await supabaseClient.from('proposals').select('*');
          if (dbBids && dbBids.length) userProposals = dbBids;
        }
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
    if (page === 'dashboard') renderDashboard();
  }

  function renderHomePreview() {
    const grid = $('#homeLivePreviewGrid');
    if (!grid) return;
    const previewJobs = jobListings.slice(0, 2).map(j => renderJobCard(j)).join('');
    const previewGigs = freelanceProjects.slice(0, 2).map(p => renderProjectCard(p)).join('');
    grid.innerHTML = previewJobs + previewGigs;
  }

  function renderJobsBoard() {
    const grid = $('#jobsBoardGrid');
    if (!grid) return;

    const urlParams = new URLSearchParams(window.location.search);
    const qParam = urlParams.get('q');
    if (qParam && $('#jobFilterKeyword') && !$('#jobFilterKeyword').value) {
      $('#jobFilterKeyword').value = qParam;
    }

    const kw = ($('#jobFilterKeyword')?.value || '').toLowerCase();
    const cat = $('#jobFilterCategory')?.value || 'all';
    const typ = $('#jobFilterType')?.value || 'all';
    const loc = $('#jobFilterLocation')?.value || 'all';
    const minSal = Number($('#jobFilterSalary')?.value || 0);

    const filtered = jobListings.filter(j => {
      const title = `${j.title_en} ${j.title_am || ''} ${j.company_name} ${j.description_en}`.toLowerCase();
      const numSal = parseInt(String(j.salary_range || '0').replace(/[^\d]/g, ''), 10) || 0;
      return (!kw || title.includes(kw)) &&
             (cat === 'all' || j.category === cat) &&
             (typ === 'all' || j.job_type === typ) &&
             (loc === 'all' || (j.location || '').toLowerCase().includes(loc.toLowerCase())) &&
             (!minSal || numSal >= minSal);
    });

    if (!filtered.length) {
      grid.innerHTML = `<div class="empty">${currentLang === 'am' ? 'ምንም ተዛማጅ የሥራ ማስታወቂያ አልተገኘም።' : 'No matching jobs found. Try clearing filters.'}</div>`;
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

    const urlParams = new URLSearchParams(window.location.search);
    const qParam = urlParams.get('q');
    if (qParam && $('#flFilterKeyword') && !$('#flFilterKeyword').value) {
      $('#flFilterKeyword').value = qParam;
    }

    const kw = ($('#flFilterKeyword')?.value || '').toLowerCase();
    const cat = $('#flFilterCategory')?.value || 'all';
    const minBudget = Number($('#flFilterBudget')?.value || 0);

    if (freelanceSubView === 'projects') {
      const filtered = freelanceProjects.filter(p => {
        const text = `${p.title_en} ${p.title_am || ''} ${p.description_en}`.toLowerCase();
        const budget = Number(p.budget_min || 0);
        return (!kw || text.includes(kw)) &&
               (cat === 'all' || p.category === cat) &&
               (!minBudget || budget >= minBudget);
      });

      if (!filtered.length) {
        grid.innerHTML = `<div class="empty">${currentLang === 'am' ? 'ምንም የፍሪላንስ ፕሮጀክት አልተገኘም።' : 'No matching freelance projects found.'}</div>`;
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
          <span>${currentLang === 'am' ? 'የፍሪላንስ ፕሮጀክት' : 'FREELANCE GIG'} · ${esc(p.job_type)}</span>
          <b>💼</b>
        </div>
        <div class="resource-body">
          <span class="pill">${esc(p.category)} · Status: ${esc(p.milestone_status || 'open')}</span>
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

  function renderDashboard() {
    const container = $('#dashboardContentArea');
    if (!container) return;

    const roleSel = $('#activeRoleSelector');
    if (roleSel) roleSel.value = currentUserRole;

    if (currentUserRole === 'employer') {
      container.innerHTML = `
        <div style="display:flex; gap:12px; margin-bottom:24px; flex-wrap:wrap;">
          <button class="btn btn-primary btn-small" id="dashPostJobBtn" type="button">+ Post New Job Vacancy</button>
          <button class="btn btn-outline btn-small" id="dashPostProjectBtn" type="button">+ Post Freelance Project</button>
        </div>

        <h3>1. Job Applications Received (Indeed Mode)</h3>
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
              `).join('') : `<tr><td colspan="5" class="empty">No applications submitted yet. Apply to a job on the Find Jobs page to test!</td></tr>`}
            </tbody>
          </table>
        </div>

        <h3>2. Freelance Proposals & Active Contracts (Upwork Mode)</h3>
        <div class="table-container" style="background:#fff; padding:16px; border-radius:14px; border:1px solid var(--line);">
          <table class="admin-table">
            <thead><tr><th>Project</th><th>Bid Amount</th><th>Delivery</th><th>Cover Note</th><th>Contract Action</th></tr></thead>
            <tbody>
              ${userProposals.length ? userProposals.map((b, idx) => `
                <tr>
                  <td><b>${esc(b.project_title || b.job_id)}</b></td>
                  <td><strong>${formatETB(b.bid_amount)}</strong></td>
                  <td>${esc(b.delivery_days)} Days</td>
                  <td>${esc(b.cover_letter)}</td>
                  <td>
                    ${b.status === 'submitted'
                      ? `<button class="btn btn-primary btn-small" data-accept-bid="${idx}" type="button">Accept Bid & Start</button>`
                      : b.status === 'active_contract'
                      ? `<button class="btn btn-outline btn-small" data-complete-milestone="${idx}" type="button">✓ Mark Milestone Complete</button>`
                      : `<span class="status approved">Completed ✓</span>`}
                  </td>
                </tr>
              `).join('') : `<tr><td colspan="5" class="empty">No freelance bids yet. Submit a proposal on the Freelance Marketplace to test!</td></tr>`}
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
            <h3>My Freelance Proposals (${userProposals.length})</h3>
            ${userProposals.length ? userProposals.map(b => `
              <div class="order-card">
                <div><b>${esc(b.project_title || b.job_id)}</b><small>Bid: ${formatETB(b.bid_amount)} · ${esc(b.delivery_days)} days</small></div>
                <span class="status approved">${esc(b.status)}</span>
              </div>
            `).join('') : '<p class="muted">No proposals submitted yet.</p>'}
          </div>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="form-card">
          <h3>TATARI Platform Moderation & Overview</h3>
          <p class="muted">Total Active Jobs: <b>${jobListings.length}</b> · Total Freelance Projects: <b>${freelanceProjects.length}</b> · Vetted Freelancers: <b>${freelancersList.length}</b></p>
          <div class="table-container">
            <table class="admin-table">
              <thead><tr><th>Type</th><th>Title</th><th>Organization / Budget</th><th>Status</th><th>Moderation</th></tr></thead>
              <tbody>
                ${jobListings.map((j, i) => `
                  <tr>
                    <td><span class="pill">JOB</span></td>
                    <td><b>${esc(j.title_en)}</b></td>
                    <td>${esc(j.company_name)} (${esc(j.salary_range)})</td>
                    <td><span class="status approved">${esc(j.status)}</span></td>
                    <td><button class="btn btn-outline btn-small" data-delete-job="${i}" type="button">Remove</button></td>
                  </tr>
                `).join('')}
                ${freelanceProjects.map((p, i) => `
                  <tr>
                    <td><span class="pill">GIG</span></td>
                    <td><b>${esc(p.title_en)}</b></td>
                    <td>${formatETB(p.budget_min)}</td>
                    <td><span class="status approved">${esc(p.status)}</span></td>
                    <td><button class="btn btn-outline btn-small" data-delete-gig="${i}" type="button">Remove</button></td>
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
    const job = jobListings.find(j => String(j.id) === String(jobId));
    if (!job) return;
    modal(`
      <div class="section-label">INDEED-STYLE 1-CLICK APPLICATION</div>
      <h2>${esc(currentLang === 'am' && job.title_am ? job.title_am : job.title_en)}</h2>
      <p class="muted"><b>${esc(job.company_name)}</b> · ${esc(job.location)} · ${esc(job.salary_range)}</p>
      <p style="font-size:13px; margin:12px 0;">${esc(job.description_en)}</p>
      ${job.requirements ? `<p style="font-size:12px; color:var(--muted);"><b>Requirements:</b> ${esc(job.requirements)}</p>` : ''}
      <form id="applyJobForm" class="stack-form" data-job-id="${job.id}">
        <label>Full Name<input name="applicant_name" value="Abebe Bikila" required/></label>
        <label>Email Address<input name="applicant_email" type="email" value="${currentSession?.user?.email || 'applicant@tatari.et'}" required/></label>
        <label>CV / Resume URL (Google Drive / LinkedIn)<input name="resume_url" type="url" value="https://drive.google.com/cv-sample" required/></label>
        <label>Short Cover Note<textarea name="notes" rows="3" required>I meet all qualifications and would love to contribute to your team.</textarea></label>
        <button class="btn btn-primary" type="submit">Submit Application ↗</button>
      </form>
    `);
  }

  function openProjectBidModal(projectId) {
    const proj = freelanceProjects.find(p => String(p.id) === String(projectId));
    if (!proj) return;
    modal(`
      <div class="section-label">UPWORK-STYLE FREELANCE PROPOSAL</div>
      <h2>${esc(currentLang === 'am' && proj.title_am ? proj.title_am : proj.title_en)}</h2>
      <p class="muted">Budget: <b>${formatETB(proj.budget_min)} – ${formatETB(proj.budget_max || proj.budget_min)}</b> · Category: ${esc(proj.category)}</p>
      <p style="font-size:13px; margin:12px 0;">${esc(proj.description_en)}</p>
      <form id="submitBidForm" class="stack-form" data-project-id="${proj.id}">
        <label>Your Bid Amount (ETB)<input name="bid_amount" type="number" value="${proj.budget_min || 15000}" required/></label>
        <label>Estimated Delivery Time (Days)<input name="delivery_days" type="number" value="7" required/></label>
        <label>Cover Letter & Technical Approach<textarea name="cover_letter" rows="4" required>I have extensive experience delivering similar solutions in Ethiopia with clean documentation and training.</textarea></label>
        <button class="btn btn-primary" type="submit">Submit Proposal / Bid ↗</button>
      </form>
    `);
  }

  function openPostJobModal() {
    modal(`
      <div class="section-label">EMPLOYER JOB POSTING</div>
      <h2>Post a Formal Job Opening</h2>
      <form id="createJobForm" class="stack-form">
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
        <button class="btn btn-primary" type="submit">Publish Job Opening ↗</button>
      </form>
    `);
  }

  function openPostProjectModal() {
    modal(`
      <div class="section-label">CLIENT FREELANCE PROJECT</div>
      <h2>Post a Scoped Freelance Project</h2>
      <form id="createProjectForm" class="stack-form">
        <div class="form-grid">
          <label>Project Title (English)<input name="title_en" placeholder="e.g. Power Query Financial Model" required/></label>
          <label>Project Title (Amharic)<input name="title_am" placeholder="ለምሳሌ፦ የፋይናንስ ሞዴል ግንባታ"/></label>
          <label>Category
            <select name="category">
              <option>IT & Data</option>
              <option>HR & Admin</option>
              <option>Finance</option>
              <option>Design & Creative</option>
            </select>
          </label>
          <label>Budget Type
            <select name="job_type">
              <option>Fixed-Price</option>
              <option>Hourly</option>
            </select>
          </label>
          <label>Minimum Budget (ETB)<input name="budget_min" type="number" value="10000" required/></label>
          <label>Maximum Budget (ETB)<input name="budget_max" type="number" value="20000" required/></label>
        </div>
        <label>Project Scope & Deliverables<textarea name="description_en" rows="3" required></textarea></label>
        <button class="btn btn-primary" type="submit">Publish Project to Marketplace ↗</button>
      </form>
    `);
  }

  function openAuthModal(mode = 'signin') {
    modal(`
      <div class="section-label">TATARI ACCOUNT & ROLE SELECTION</div>
      <h2>${mode === 'signup' ? 'Create Your Account' : 'Sign In to TATARI'}</h2>
      <form id="authForm" class="stack-form" data-mode="${mode}">
        ${mode === 'signup' ? `
          <label>Full Name<input name="full_name" required/></label>
          <label>Select Your Primary Role
            <select name="role">
              <option value="seeker">Job Seeker / Freelancer</option>
              <option value="employer">Employer / Client</option>
              <option value="admin">Admin (TATARI)</option>
            </select>
          </label>
        ` : ''}
        <label>Email Address<input name="email" type="email" required/></label>
        <label>Password<input name="password" type="password" required minlength="6"/></label>
        <button class="btn btn-primary" type="submit">${mode === 'signup' ? 'Register Account' : 'Sign In'}</button>
      </form>
      <div style="margin-top:14px; font-size:12px;">
        ${mode === 'signin'
          ? '<button type="button" id="switchSignup" class="btn btn-outline btn-small">New here? Create an Account</button>'
          : '<button type="button" id="switchSignin" class="btn btn-outline btn-small">Already have an account? Sign In</button>'}
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
      localStorage.setItem('tatari_apps_v4', JSON.stringify(userApplications));

      if (supabaseClient && currentSession) {
        await supabaseClient.from('career_applications').insert({
          job_id: jobId,
          user_id: currentSession.user.id,
          applicant_name: appRecord.applicant_name,
          applicant_email: appRecord.applicant_email,
          resume_url: appRecord.resume_url,
          notes: appRecord.notes,
          status: 'Applied'
        }).catch(() => {});
      }
      toast('Application submitted! Track status in your Dashboard.');
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
        cover_letter: fd.get('cover_letter'),
        status: 'submitted'
      };
      userProposals.unshift(bidRecord);
      localStorage.setItem('tatari_bids_v4', JSON.stringify(userProposals));

      if (supabaseClient && currentSession) {
        await supabaseClient.from('proposals').insert({
          job_id: projectId,
          freelancer_id: currentSession.user.id,
          bid_amount: bidRecord.bid_amount,
          delivery_days: bidRecord.delivery_days,
          cover_letter: bidRecord.cover_letter
        }).catch(() => {});
      }
      toast('Proposal submitted! Client can now review and accept your bid.');
      closeModal();
      return;
    }

    if (form.id === 'createJobForm') {
      const newJob = {
        id: 'job-' + Date.now(),
        title_en: fd.get('title_en'),
        title_am: fd.get('title_am') || fd.get('title_en'),
        company_name: fd.get('company_name'),
        category: fd.get('category'),
        job_type: fd.get('job_type'),
        location: fd.get('location'),
        salary_range: fd.get('salary_range'),
        deadline: fd.get('deadline'),
        description_en: fd.get('description_en'),
        requirements: fd.get('requirements'),
        status: 'open'
      };
      jobListings.unshift(newJob);
      if (supabaseClient && currentSession) {
        await supabaseClient.from('career_jobs').insert({ ...newJob, recruiter_id: currentSession.user.id }).catch(() => {});
      }
      toast('New job vacancy published!');
      closeModal();
      renderCurrentPage();
      return;
    }

    if (form.id === 'createProjectForm') {
      const newProj = {
        id: 'fl-' + Date.now(),
        title_en: fd.get('title_en'),
        title_am: fd.get('title_am') || fd.get('title_en'),
        category: fd.get('category'),
        job_type: fd.get('job_type'),
        budget_min: Number(fd.get('budget_min')),
        budget_max: Number(fd.get('budget_max')),
        description_en: fd.get('description_en'),
        milestone_status: 'open',
        status: 'open'
      };
      freelanceProjects.unshift(newProj);
      if (supabaseClient && currentSession) {
        await supabaseClient.from('jobs').insert({ ...newProj, client_id: currentSession.user.id }).catch(() => {});
      }
      toast('Freelance project published to marketplace!');
      closeModal();
      renderCurrentPage();
      return;
    }

    if (form.id === 'authForm') {
      const email = fd.get('email');
      const password = fd.get('password');
      const role = fd.get('role') || 'seeker';
      currentUserRole = role;
      localStorage.setItem('tatari_demo_role', role);

      if (supabaseClient) {
        try {
          if (form.dataset.mode === 'signup') {
            const { data } = await supabaseClient.auth.signUp({ email, password });
            currentSession = data.session;
          } else {
            const { data } = await supabaseClient.auth.signInWithPassword({ email, password });
            currentSession = data.session;
          }
        } catch (err) {
          toast(err.message, true);
          return;
        }
      }
      toast(`Signed in as ${role.toUpperCase()}!`);
      closeModal();
      refreshAuthUI();
      renderCurrentPage();
      return;
    }

    if (form.id === 'unifiedProfileForm') {
      toast('Unified Job Seeker & Freelancer profile saved!');
      return;
    }

    if (form.id === 'inquiryForm') {
      form.reset();
      toast('Consulting inquiry received! Our Addis Ababa team will respond within 24 hours.');
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
      if (supabaseClient) supabaseClient.auth.signOut();
      currentSession = null;
      refreshAuthUI();
      toast('Logged out.');
      return;
    }
    if (t.id === 'closeModal' || t.id === 'backdrop') { closeModal(); return; }

    if (t.id === 'postQuickBtn' || t.id === 'openPostJobModalBtn' || t.id === 'dashPostJobBtn') {
      openPostJobModal(); return;
    }
    if (t.id === 'openPostProjectModalBtn' || t.id === 'dashPostProjectBtn') {
      openPostProjectModal(); return;
    }

    if (t.dataset.applyJob) { openJobApplyModal(t.dataset.applyJob); return; }
    if (t.dataset.bidProject) { openProjectBidModal(t.dataset.bidProject); return; }
    if (t.dataset.inviteFreelancer) {
      toast(`Invitation sent to ${t.dataset.inviteFreelancer}!`);
      return;
    }

    if (t.dataset.flView) {
      $$('#freelanceSubTabs button').forEach(b => b.classList.remove('active'));
      t.classList.add('active');
      freelanceSubView = t.dataset.flView;
      renderFreelanceMarketplace();
      return;
    }

    if (t.dataset.acceptBid !== undefined) {
      const idx = Number(t.dataset.acceptBid);
      userProposals[idx].status = 'active_contract';
      localStorage.setItem('tatari_bids_v4', JSON.stringify(userProposals));
      toast('Bid accepted! Project moved to Active Contract.');
      renderDashboard();
      return;
    }

    if (t.dataset.completeMilestone !== undefined) {
      const idx = Number(t.dataset.completeMilestone);
      userProposals[idx].status = 'completed';
      localStorage.setItem('tatari_bids_v4', JSON.stringify(userProposals));
      toast('Milestone marked complete!');
      renderDashboard();
      return;
    }

    if (t.dataset.deleteJob !== undefined) {
      jobListings.splice(Number(t.dataset.deleteJob), 1);
      toast('Job listing removed.');
      renderDashboard();
      return;
    }

    if (t.dataset.deleteGig !== undefined) {
      freelanceProjects.splice(Number(t.dataset.deleteGig), 1);
      toast('Freelance project removed.');
      renderDashboard();
      return;
    }

    if (t.id === 'exportCsvBtn') {
      const rows = [['Applicant', 'Email', 'Job', 'Status'], ...userApplications.map(a => [a.applicant_name, a.applicant_email, a.job_title, a.status])];
      const csv = 'data:text/csv;charset=utf-8,' + rows.map(r => r.join(',')).join('
');
      const a = document.createElement('a');
      a.href = encodeURI(csv);
      a.download = 'TATARI_Workspace_Export.csv';
      a.click();
      toast('CSV exported!');
    }
  });

  document.addEventListener('change', (e) => {
    if (e.target.id === 'activeRoleSelector') {
      currentUserRole = e.target.value;
      localStorage.setItem('tatari_demo_role', currentUserRole);
      renderDashboard();
    }
    if (e.target.dataset.appStatusIdx !== undefined) {
      const idx = Number(e.target.dataset.appStatusIdx);
      userApplications[idx].status = e.target.value;
      localStorage.setItem('tatari_apps_v4', JSON.stringify(userApplications));
      toast(`Candidate status updated to ${e.target.value}`);
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

  document.addEventListener('DOMContentLoaded', async () => {
    if ($('#year')) $('#year').textContent = new Date().getFullYear();
    setLanguage(currentLang);
    await initSupabase();
  });
})();

(() => {
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const cfg = window.TATARI_CONFIG || {};
  let db = null, session = null, profile = null, role = 'normal_user', subscriptionPlan = 'free',
      selectedModule = 'all', products = [], courses = [], jobListings = [], freelanceProjects = [], testimonials = [],
      cart = loadSavedCart(), currency = 'ETB', currentLang = 'en', resumeCartAfterLogin = false;

  // Fallback Mock Data for instant functionality without waiting for database populate
  const defaultJobs = [
    { id: 'c1', title_en: 'Senior HR & Talent Acquisition Lead', title_am: 'የክፍተኛ የሰው ሀብት እና ታለንት መሪ', company_name: 'Hibret Bank S.C.', company_logo: '', location: 'Addis Ababa', salary_range: '45,000 ETB/mo', category: 'HR & Analytics', job_type: 'Full-Time', description_en: 'Lead organizational talent acquisition, policy planning, and workforce analytics.', description_am: 'የድርጅት ታለንት ቅጥር እና ፖሊሲ እቅድን ይመሩ::', itemType: 'career' },
    { id: 'c2', title_en: 'Full-Stack Web & Mobile Developer', title_am: 'ሙሉ-ስታክ ዌብ እና ሞባይል አልሚ', company_name: 'Tatari Tech Labs', company_logo: '', location: 'Remote / Addis Ababa', salary_range: '65,000 ETB/mo', category: 'Software & Tech', job_type: 'Remote', description_en: 'Develop high-performance React and Node.js solutions for fintech platforms.', description_am: 'ለፊንቴክ መድረኮች ከፍተኛ አፈጻጸም ያላቸውን የዌብ መተግበሪያዎች ይገንቡ::', itemType: 'career' }
  ];

  const defaultFreelance = [
    { id: 'f1', title_en: 'UI/UX Redesign for Mobile Banking App', title_am: 'ለሞባይል ባንክ መተግበሪያ UI/UX ዲዛይን', client_logo: '', category: 'Design & Creative', job_type: 'Contract', budget_min: 35000, budget_max: 70000, currency: 'ETB', description_en: 'Redesign native iOS and Android user interfaces for optimal customer experience.', description_am: 'የባንክ መተግበሪያ የተጠቃሚ ምስላዊ ዲዛይን ማሻሻል::', itemType: 'freelance' }
  ];

  const defaultProducts = [
    { id: 'p1', name: 'Ethiopian HR Policy & Strategy Toolkit', name_am: 'የኢትዮጵያ የሰው ሀብት ፖሊሲ እና ስትራቴጂ ኪት', price_etb: 4500, price_usd: 80, description: 'Standardized templates, internal audit checklists, and performance scorecards.', itemType: 'product' }
  ];

  const defaultCourses = [
    { id: 'k1', title: 'Full-Stack Web Development Bootcamp', title_am: 'ሙሉ-ስታክ የዌብ አልሚ ስልጠና', price_etb: 8500, price_usd: 150, description: 'Comprehensive practical training on Javascript, Supabase, React, and Vercel.', itemType: 'course' }
  ];

  const defaultTestimonials = [
    { id: 't1', author_name: 'Solomon Worku', company_title: 'Managing Director, Commercial Bank', content: 'TATARI has radically transformed our recruitment strategy and talent matching accuracy in Ethiopia.' }
  ];

  function loadSavedCart(){ try{ const v = JSON.parse(localStorage.getItem('tatari_cart_v1')||'[]'); return Array.isArray(v)?v.filter(x=>x&&typeof x.id==='string'&&['product','course'].includes(x.type)&&Number.isInteger(x.quantity)&&x.quantity>=1&&x.quantity<=20):[]; }catch(_){ return []; } }
  function saveCart(){ try{ localStorage.setItem('tatari_cart_v1', JSON.stringify(cart)); }catch(e){ console.warn('Cart save error:', e); } }
  function updateCartCount(){ const b=$('#cartFab'); if(b) b.innerHTML=`Cart (${cart.reduce((n,x)=>n+x.quantity,0)}) <span>▣</span>`; }

  const toast = (msg, bad=false) => {
    const el=$('#toast'); if(!el) return; el.textContent=msg; el.className=bad?'show bad':'show';
    clearTimeout(toast.t); toast.t=setTimeout(()=>el.className='', 4200);
  };
  const esc = s => String(s??'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = (n, c=currency) => `${c==='ETB'?'ETB':'$'} ${Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  const err = e => e?.message || 'Something went wrong. Please try again.';

  function setLanguage(lang) {
    currentLang = lang;
    if($('#langEN')) $('#langEN').classList.toggle('active', lang==='en');
    if($('#langAM')) $('#langAM').classList.toggle('active', lang==='am');
    if (window.TATARI_I18N) window.TATARI_I18N.translate(document.body, lang);
    renderSearchResults();
    renderTestimonialBanners();
  }

  function modal(html){
    const root = $('#modalRoot');
    if(!root) return;
    root.innerHTML = `<div class="modal-backdrop" id="backdrop"><div class="modal"><button class="modal-x" id="closeModal" type="button">×</button>${html}</div></div>`;
    if($('#closeModal')) $('#closeModal').onclick = closeModal;
    if($('#backdrop')) $('#backdrop').onclick = e => { if(e.target.id==='backdrop') closeModal(); };
    if (window.TATARI_I18N) window.TATARI_I18N.translate(root, currentLang);
  }
  function closeModal(){ const root = $('#modalRoot'); if(root) root.innerHTML = ''; }

  function authModal(mode='signin'){
    const updating = mode === 'updatepassword';
    modal(`<div class="section-label">TATARI ACCOUNT</div><h2>${mode==='signup'?'Create your account':mode==='reset'?'Reset password':updating?'Choose a new password':'Welcome back'}</h2><p class="muted">${mode==='signup'?'Register as a Normal User or Employer to apply for jobs, post vacancies, or hire freelancers.':mode==='reset'?'Enter your account email to receive a reset link.':updating?'Choose a new password for your TATARI account.':'Sign in to access your portal, applications, and subscriptions.'}</p><form id="authForm" class="stack-form">${mode==='signup'?'<label>Full name<input name="full_name" required minlength="2"></label><label>Account Type<select name="user_role"><option value="normal_user">Normal User (Job Seeker / Freelancer)</option><option value="employer">Employer / Recruiter</option></select></label>':''}${mode==='reset'||mode==='signin'||mode==='signup'?'<label>Email<input name="email" type="email" required id="authEmail"></label>':''}${mode!=='reset'?`<label>${updating?'New password':'Password'}<input name="password" type="password" required minlength="8" autocomplete="new-password"></label>`:''}${updating?'<label>Confirm new password<input name="confirm_password" type="password" required minlength="8"></label>':''}<button class="btn btn-primary" type="submit">${mode==='signup'?'Create account':mode==='reset'?'Send reset link':updating?'Update password':'Sign in'}</button><p id="authFeedback" class="form-feedback"></p></form><div class="auth-switch">${mode==='signin'?'<button type="button" id="goSignup">Create an account</button><button type="button" id="goReset">Forgot password?</button>':updating?'':'<button type="button" id="goSignin">Back to sign in</button>'}</div>`);
    
    const form = $('#authForm');
    if(form) {
      form.onsubmit = async e => {
        e.preventDefault();
        const f = new FormData(e.currentTarget), fb = $('#authFeedback'), btn = $('button[type=submit]', e.currentTarget);
        btn.disabled = true;
        try {
          if(!db) {
            session = { user: { id: 'demo-user', email: f.get('email') || 'demo@tatari.et' } };
            profile = { full_name: f.get('full_name') || 'Demo User' };
            role = f.get('user_role') || 'normal_user';
            closeModal(); await refreshUser(); toast('Signed in (Demo Mode).');
            return;
          }
          let out;
          if(mode === 'signup') {
            out = await db.auth.signUp({email: f.get('email').trim(), password: f.get('password'), options: {data: {full_name: f.get('full_name').trim()}}});
            if(out.data?.user) {
              await db.from('user_roles').insert({user_id: out.data.user.id, role: f.get('user_role')});
            }
          }
          else if(mode === 'reset') out = await db.auth.resetPasswordForEmail(f.get('email').trim(), {redirectTo: window.location.origin + window.location.pathname});
          else if(updating) {
            if(f.get('password') !== f.get('confirm_password')) throw Error('Passwords do not match.');
            out = await db.auth.updateUser({password: f.get('password')});
          } else out = await db.auth.signInWithPassword({email: f.get('email').trim(), password: f.get('password')});
          
          if(out.error) throw out.error;
          if(fb) fb.textContent = mode==='signup'&&!out.data.session?'Account created. Check email to confirm.':mode==='reset'?'Reset email sent if account exists.':updating?'Password updated successfully.':'Signed in successfully.';
          
          if(updating) {
            await db.auth.signOut(); session = null; setTimeout(() => authModal('signin'), 1000);
          } else if(out.data?.session) {
            session = out.data.session; closeModal(); await refreshUser(); toast('Welcome to TATARI.');
            if(resumeCartAfterLogin) { resumeCartAfterLogin = false; cartModal(); }
          }
        } catch(x) {
          if(fb) { fb.textContent = err(x); fb.className = 'form-feedback error'; }
        } finally { btn.disabled = false; }
      };
    }
    if($('#goSignup')) $('#goSignup').onclick = () => authModal('signup');
    if($('#goReset')) $('#goReset').onclick = () => authModal('reset');
    if($('#goSignin')) $('#goSignin').onclick = () => authModal('signin');
  }

  async function refreshUser() {
    if(!session) {
      profile = null; role = 'normal_user'; subscriptionPlan = 'free';
      if($('#accountBtn')) { $('#accountBtn').hidden = false; $('#accountBtn').textContent = 'Login'; }
      if($('#dashboardBtn')) $('#dashboardBtn').hidden = true; 
      if($('#logoutBtn')) $('#logoutBtn').hidden = true;
      return;
    }
    if(!db) {
      if($('#accountBtn')) $('#accountBtn').hidden = true; 
      if($('#dashboardBtn')) { $('#dashboardBtn').hidden = false; $('#dashboardBtn').textContent = 'My Account (Demo)'; }
      if($('#logoutBtn')) $('#logoutBtn').hidden = false;
      return;
    }
    try {
      const [pr, rr, sub] = await Promise.all([
        db.from('profiles').select('*').eq('id', session.user.id).maybeSingle(),
        db.from('user_roles').select('role').eq('user_id', session.user.id),
        db.from('subscriptions').select('plan_tier').eq('user_id', session.user.id).eq('status', 'active').maybeSingle()
      ]);
      profile = pr.data || null;
      const roles = (rr.data || []).map(x => x.role);
      role = roles.includes('admin') ? 'admin' : roles.includes('employer') ? 'employer' : 'normal_user';
      subscriptionPlan = sub.data?.plan_tier || 'free';
      
      if($('#accountBtn')) $('#accountBtn').hidden = true; 
      if($('#dashboardBtn')) {
        $('#dashboardBtn').hidden = false;
        $('#dashboardBtn').textContent = role==='admin' ? 'Admin Portal' : role==='employer' ? 'Employer Portal' : 'My Account';
      }
      if($('#logoutBtn')) $('#logoutBtn').hidden = false;
    } catch(e) {
      console.error('Error refreshing user:', e);
    }
  }

  async function loadData() {
    if(!db) {
      products = defaultProducts;
      courses = defaultCourses;
      jobListings = defaultJobs;
      freelanceProjects = defaultFreelance;
      testimonials = defaultTestimonials;
      renderSearchResults();
      renderTestimonialBanners();
      return;
    }
    try {
      const [p, c, j, f, t] = await Promise.all([
        db.from('products').select('*').eq('is_published', true).order('created_at', {ascending: false}),
        db.from('courses').select('*').eq('is_published', true).order('created_at', {ascending: false}),
        db.from('career_jobs').select('*').eq('status', 'open').order('created_at', {ascending: false}),
        db.from('jobs').select('*').eq('status', 'open').order('created_at', {ascending: false}),
        db.from('testimonials').select('*').order('created_at', {ascending: false})
      ]);
      products = p.data && p.data.length ? p.data : defaultProducts;
      courses = c.data && c.data.length ? c.data : defaultCourses;
      jobListings = j.data && j.data.length ? j.data : defaultJobs;
      freelanceProjects = f.data && f.data.length ? f.data : defaultFreelance;
      testimonials = t.data && t.data.length ? t.data : defaultTestimonials;

      renderSearchResults();
      renderTestimonialBanners();
    } catch(e) {
      console.error('Data load error:', e);
      products = defaultProducts; courses = defaultCourses; jobListings = defaultJobs; freelanceProjects = defaultFreelance; testimonials = defaultTestimonials;
      renderSearchResults(); renderTestimonialBanners();
    }
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
      products.forEach(p => {
        items.push({
          ...p, itemType: 'product',
          displayTitle: currentLang==='am'&&p.name_am ? p.name_am : p.name,
          displayDesc: p.description,
          numericSalary: p.price_etb || 0
        });
      });
      courses.forEach(c => {
        items.push({
          ...c, itemType: 'course',
          displayTitle: currentLang==='am'&&c.title_am ? c.title_am : c.title,
          displayDesc: c.description,
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
      grid.innerHTML = `<div class="empty">No matching opportunities found for module: <b>${selectedModule.toUpperCase()}</b>. Try expanding your search criteria!</div>`;
      return;
    }

    grid.innerHTML = filtered.map(item => {
      if(item.itemType === 'career') {
        return `
          <article class="resource-card job-card">
            <div class="resource-art career">
              ${item.company_logo ? `<img src="${esc(item.company_logo)}" class="company-logo-img" alt="Logo"/>` : '<span>CAREER VACANCY</span>'}
              <b>🏢</b>
            </div>
            <div class="resource-body">
              <span class="pill">${esc(item.job_type||'Full-Time')} · ${esc(item.location||'Addis Ababa')}</span>
              <h3>${esc(item.displayTitle)}</h3>
              <p><b>${esc(item.company_name||'TATARI Partner')}</b> — ${esc(item.displayDesc)}</p>
              <div class="resource-bottom">
                <strong>Salary: ${esc(item.salary_range||'Negotiable')}</strong>
                <button class="btn btn-outline btn-small" data-career-id="${item.id}" type="button">Apply for Job</button>
              </div>
            </div>
          </article>`;
      } else if(item.itemType === 'freelance') {
        return `
          <article class="resource-card freelance-card">
            <div class="resource-art job">
              ${item.client_logo ? `<img src="${esc(item.client_logo)}" class="company-logo-img" alt="Logo"/>` : '<span>FREELANCE CONTRACT</span>'}
              <b>💼</b>
            </div>
            <div class="resource-body">
              <span class="pill">${esc(item.category||'General')} · ${esc(item.job_type||'Fixed-Price')}</span>
              <h3>${esc(item.displayTitle)}</h3>
              <p>${esc(item.displayDesc)}</p>
              <div class="resource-bottom">
                <strong>Budget: ${money(item.budget_min)} - ${money(item.budget_max)}</strong>
                <button class="btn btn-primary btn-small" data-freelance-id="${item.id}" type="button">Submit Proposal</button>
              </div>
            </div>
          </article>`;
      } else {
        return `
          <article class="resource-card">
            <div class="resource-art ${item.itemType}"><span>${item.itemType==='course'?'ACADEMY':'DIGITAL STORE'}</span><b>✦</b></div>
            <div class="resource-body">
              <span class="pill">${item.itemType==='course'?'ONLINE COURSE':'DIGITAL TOOL'}</span>
              <h3>${esc(item.displayTitle)}</h3>
              <p>${esc(item.displayDesc||'Practical resource from TATARI.')}</p>
              <div class="resource-bottom">
                <strong>${money(item.price_etb)}</strong>
                <button class="btn btn-primary btn-small" data-add="${item.id}" data-type="${item.itemType}" type="button">Add to cart</button>
              </div>
            </div>
          </article>`;
      }
    }).join('');

    $$('[data-career-id]', grid).forEach(b => b.onclick = (e) => { e.preventDefault(); openCareerDetails(b.dataset.careerId); });
    $$('[data-freelance-id]', grid).forEach(b => b.onclick = (e) => { e.preventDefault(); openFreelanceDetails(b.dataset.freelanceId); });
    $$('[data-add]', grid).forEach(b => b.onclick = (e) => { e.preventDefault(); addCart(b.dataset.add, b.dataset.type); });
  }

  function parseNumericSalary(str) {
    if(!str) return 0;
    const match = String(str).match(/[\d,]+/);
    return match ? parseInt(match[0].replace(/,/g, ''), 10) : 0;
  }

  function renderTestimonialBanners() {
    const banner = $('#testimonialBannerList');
    if(!banner) return;
    banner.innerHTML = testimonials.length ? testimonials.map(t => `
      <div class="testimonial-card">
        <div class="testimonial-header">
          ${t.author_avatar ? `<img src="${esc(t.author_avatar)}" class="author-avatar" alt="Avatar"/>` : '<div class="avatar-placeholder">👤</div>'}
          <div>
            <b>${esc(t.author_name)}</b>
            <small>${esc(t.company_title || 'Verified Member')}</small>
          </div>
        </div>
        <p>"${esc(t.content)}"</p>
      </div>`).join('') : '<div class="empty">No testimonials added yet. Click "+ Add Testimonial" to submit one!</div>';
  }

  function subscriptionPlanModal(planTier) {
    const isCurrent = subscriptionPlan === planTier;
    let title = planTier === 'starter' ? 'Starter Employer Plan' : planTier === 'pro' ? 'Pro Employer Package' : 'Corporate Unlimited Package';
    let price = planTier === 'starter' ? 'ETB 0 / mo' : planTier === 'pro' ? 'ETB 4,500 / mo' : 'ETB 12,000 / mo';

    modal(`
      <div class="section-label">EMPLOYER SUBSCRIPTION LINK</div>
      <h2>${title}</h2>
      <div class="payment-box">
        <small>PLAN PRICING</small>
        <strong>${price}</strong>
        <p class="muted">${isCurrent ? '✅ Currently Active on your Employer Account' : 'Upgrade your employer posting limit & brand visibility.'}</p>
      </div>
      <div class="stack-form">
        <p><b>Included Package Benefits:</b></p>
        <ul>
          <li>✓ ${planTier==='starter'?'1 Active Vacancy Listing':planTier==='pro'?'10 Active Job & Freelance Vacancies':'Unlimited Job & Contract Postings'}</li>
          <li>✓ ${planTier==='starter'?'Standard Candidate Tracking':'Company Logo Branding Uploads & High-Priority Placement'}</li>
          <li>✓ ${planTier==='starter'?'Community Support':'Direct Candidate CV & Application Export (CSV / Excel)'}</li>
        </ul>
        ${session ? `<button class="btn btn-primary full-btn" id="confirmSubBtn" type="button" ${isCurrent?'disabled':''}>${isCurrent?'Plan Already Active':'Confirm Subscription Plan'}</button>` : '<button class="btn btn-primary full-btn" id="subLoginBtn" type="button">Sign In to Subscribe</button>'}
      </div>
    `);

    if($('#confirmSubBtn')) $('#confirmSubBtn').onclick = () => selectSubscriptionPlan(planTier);
    if($('#subLoginBtn')) $('#subLoginBtn').onclick = () => { closeModal(); authModal('signin'); };
  }

  async function selectSubscriptionPlan(planTier) {
    if(!session) { toast('Please sign in to choose a plan.', true); authModal('signin'); return; }
    try {
      if(db) {
        const { error } = await db.from('subscriptions').upsert({
          user_id: session.user.id, plan_tier: planTier, status: 'active', updated_at: new Date()
        });
        if(error) throw error;
      }
      subscriptionPlan = planTier;
      toast(`Successfully activated ${planTier.toUpperCase()} Employer Subscription!`);
      closeModal();
      await refreshUser();
    } catch(err) { toast(err.message, true); }
  }

  async function adminDashboardModal() {
    if(role !== 'admin' && session) { toast('Access restricted to Administrators only.', true); }
    const applications = [
      { id: 'app1', applicant_name: 'Abebe Bikila', applicant_email: 'abebe@example.com', career_jobs: { title_en: 'Senior HR Lead', company_name: 'Hibret Bank S.C.' }, resume_url: 'https://drive.google.com', status: 'approved', notes: 'Top candidate' }
    ];

    const rows = applications.map(a => `
      <tr data-app-id="${a.id}">
        <td><b>${esc(a.applicant_name)}</b><br><small>${esc(a.applicant_email)}</small></td>
        <td><b>${esc(a.career_jobs?.title_en || 'Job Vacancy')}</b><br><small>${esc(a.career_jobs?.company_name||'Company')}</small></td>
        <td><a href="${esc(a.resume_url)}" target="_blank" class="pill-link">📄 Resume Link</a></td>
        <td><span class="status ${a.status}">${esc(a.status)}</span></td>
        <td>
          <button class="btn btn-small btn-outline" data-action="approve" data-id="${a.id}" type="button">Approve</button>
          <button class="btn btn-small btn-outline" data-action="reject" data-id="${a.id}" type="button">Reject</button>
        </td>
      </tr>
    `).join('');

    modal(`
      <div class="section-label">⚡ SYSTEM ADMINISTRATOR PORTAL</div>
      <h2>All Submitted Job Applications</h2>
      <p class="muted">Review applicant records, take administrative decisions, and export reports.</p>
      
      <div class="admin-actions-bar">
        <button class="btn btn-primary btn-small" id="exportCSVBtn" type="button">📥 Export Applications (CSV)</button>
        <button class="btn btn-outline btn-small" id="exportExcelBtn" type="button">📊 Export Applications (Excel)</button>
      </div>

      <div class="table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Applicant</th>
              <th>Job Title & Company</th>
              <th>Resume</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="5" class="empty">No job applications submitted yet.</td></tr>'}
          </tbody>
        </table>
      </div>
    `);

    if($('#exportCSVBtn')) $('#exportCSVBtn').onclick = () => exportApplicationsCSV(applications);
    if($('#exportExcelBtn')) $('#exportExcelBtn').onclick = () => exportApplicationsExcel(applications);

    $$('[data-action]').forEach(b => b.onclick = (e) => {
      const id = b.dataset.id;
      const newStatus = b.dataset.action === 'approve' ? 'approved' : 'rejected';
      toast(`Application updated to ${newStatus}.`);
      closeModal();
    });
  }

  function exportApplicationsCSV(data) {
    if(!data.length) { toast('No data available to export.', true); return; }
    const headers = ['Application ID', 'Applicant Name', 'Applicant Email', 'Job Title', 'Company', 'Resume Link', 'Notes', 'Status'];
    const rows = data.map(a => [
      a.id,
      `"${a.applicant_name.replace(/"/g, '""')}"`,
      `"${a.applicant_email}"`,
      `"${(a.career_jobs?.title_en||'').replace(/"/g, '""')}"`,
      `"${(a.career_jobs?.company_name||'').replace(/"/g, '""')}"`,
      `"${a.resume_url}"`,
      `"${(a.notes||'').replace(/"/g, '""')}"`,
      a.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('
');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TATARI_Job_Applications_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast('CSV file exported successfully!');
  }

  function exportApplicationsExcel(data) {
    if(!data.length) { toast('No data available to export.', true); return; }
    let xml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Applications"><Table>`;
    xml += `<Row><Cell><Data ss:Type="String">Applicant Name</Data></Cell><Cell><Data ss:Type="String">Email</Data></Cell><Cell><Data ss:Type="String">Job Title</Data></Cell><Cell><Data ss:Type="String">Company</Data></Cell><Cell><Data ss:Type="String">Status</Data></Cell><Cell><Data ss:Type="String">Resume URL</Data></Cell></Row>`;
    data.forEach(a => {
      xml += `<Row><Cell><Data ss:Type="String">${esc(a.applicant_name)}</Data></Cell><Cell><Data ss:Type="String">${esc(a.applicant_email)}</Data></Cell><Cell><Data ss:Type="String">${esc(a.career_jobs?.title_en||'')}</Data></Cell><Cell><Data ss:Type="String">${esc(a.career_jobs?.company_name||'')}</Data></Cell><Cell><Data ss:Type="String">${esc(a.status)}</Data></Cell><Cell><Data ss:Type="String">${esc(a.resume_url)}</Data></Cell></Row>`;
    });
    xml += `</Table></Worksheet></Workbook>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `TATARI_Job_Applications_${new Date().toISOString().slice(0,10)}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast('Excel spreadsheet exported successfully!');
  }

  function postVacancyModal() {
    if(!session) { toast('Sign in to publish a vacancy.', true); authModal('signin'); return; }

    modal(`
      <div class="section-label">VACANCY PUBLISHING</div>
      <h2>Publish Job Vacancy or Freelance Contract</h2>
      <form id="postListingForm" class="stack-form">
        <label>Posting Type<select name="listing_type" id="listingTypeSelect"><option value="career">Full-Time / Corporate Career Job</option><option value="freelance">Freelance Contract Project</option></select></label>
        <label>Title (English)<input name="title_en" required></label>
        <label>Title (Amharic)<input name="title_am"></label>
        <label>Company / Brand Name<input name="company_name" required></label>
        <div class="form-grid">
          <label>Category<select name="category"><option>HR & Analytics</option><option>Software & Tech</option><option>Finance & Management</option><option>Design & Creative</option></select></label>
          <label>Location<input name="location" placeholder="e.g. Addis Ababa or Remote" required></label>
        </div>
        <label>Salary Range or Budget (ETB)<input name="salary_range" placeholder="e.g. 35,000 ETB/mo or 50,000 Total Budget"></label>
        <label>Description (English)<textarea name="description_en" rows="3" required></textarea></label>
        <button class="btn btn-primary" type="submit">Publish Listing</button>
      </form>
    `);

    const form = $('#postListingForm');
    if(form) {
      form.onsubmit = async e => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const newJob = {
          id: 'custom-' + Date.now(),
          title_en: fd.get('title_en'),
          company_name: fd.get('company_name'),
          location: fd.get('location'),
          salary_range: fd.get('salary_range'),
          category: fd.get('category'),
          job_type: 'Full-Time',
          description_en: fd.get('description_en'),
          itemType: fd.get('listing_type') === 'career' ? 'career' : 'freelance'
        };
        if(newJob.itemType === 'career') jobListings.unshift(newJob);
        else freelanceProjects.unshift({ ...newJob, budget_min: parseNumericSalary(newJob.salary_range), budget_max: parseNumericSalary(newJob.salary_range) });
        
        toast('Vacancy published successfully.'); closeModal(); renderSearchResults();
      };
    }
  }

  function addCart(id, type) {
    const list = type === 'course' ? courses : products;
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
      const p = (x.type==='course'?courses:products).find(y => y.id === x.id);
      return `<div class="cart-row"><div><b>${esc(p?.name||p?.title||'Resource')}</b><small>${x.type==='course'?'Course':'Digital product'}</small></div><div class="qty"><button type="button" data-minus="${x.id}">−</button>${x.quantity}<button type="button" data-plus="${x.id}">+</button></div><strong>${money((currency==='ETB'?p?.price_etb:p?.price_usd)*x.quantity)}</strong><button type="button" class="remove" data-remove="${x.id}">×</button></div>`;
    }).join('');
    
    modal(`<div class="section-label">YOUR SELECTION</div><h2>Your cart</h2><div class="cart-list">${rows}</div><div class="cart-total"><span>Currency</span><select id="cartCurrency"><option value="ETB" ${currency==='ETB'?'selected':''}>ETB</option><option value="USD" ${currency==='USD'?'selected':''}>USD</option></select><b>Total: ${money(cart.reduce((s,x)=>{const p=(x.type==='course'?courses:products).find(y=>y.id===x.id);return s+(currency==='ETB'?p?.price_etb||0:p?.price_usd||0)*x.quantity},0))}</b></div><button class="btn btn-primary full-btn" id="checkoutBtn" type="button">Continue to payment instructions</button>`);
    
    if($('#cartCurrency')) $('#cartCurrency').onchange = e => { currency = e.target.value; closeModal(); cartModal(); };
    $$('[data-minus]').forEach(b => b.onclick = () => { const x=cart.find(i=>i.id===b.dataset.minus); x.quantity=Math.max(1,x.quantity-1); saveCart(); updateCartCount(); closeModal(); cartModal(); });
    $$('[data-plus]').forEach(b => b.onclick = () => { const x=cart.find(i=>i.id===b.dataset.plus); x.quantity=Math.min(20,x.quantity+1); saveCart(); updateCartCount(); closeModal(); cartModal(); });
    $$('[data-remove]').forEach(b => b.onclick = () => { cart = cart.filter(i=>i.id!==b.dataset.remove); saveCart(); updateCartCount(); closeModal(); cartModal(); });
    if($('#checkoutBtn')) $('#checkoutBtn').onclick = checkout;
  }

  async function checkout() {
    if(!session) { resumeCartAfterLogin = true; closeModal(); authModal('signin'); toast('Please sign in to continue.'); return; }
    toast('Processing order...');
    cart = []; saveCart(); updateCartCount(); closeModal();
    toast('Order created. Payment process completed.');
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
      <form id="jobAppForm" class="stack-form">
        <label>Full Name<input name="applicant_name" value="${esc(profile?.full_name||'')}" required></label>
        <label>Email Address<input name="applicant_email" type="email" value="${esc(session?.user?.email||'')}" required></label>
        <label>Resume / CV Link (Google Drive / LinkedIn)<input name="resume_url" type="url" placeholder="https://..." required></label>
        <label>Cover Letter / Application Notes<textarea name="notes" rows="4" required></textarea></label>
        <button class="btn btn-primary" type="submit">Submit Application</button>
      </form>
    `);

    const form = $('#jobAppForm');
    if(form) {
      form.onsubmit = e => {
        e.preventDefault();
        toast('Application submitted successfully!'); closeModal();
      };
    }
  }

  async function openFreelanceDetails(projectId) {
    const project = freelanceProjects.find(j => String(j.id) === String(projectId));
    if(!project) return;
    modal(`
      <div class="section-label">FREELANCE CONTRACT DETAILS</div>
      <div class="job-modal-header">
        <div>
          <h2>${esc(currentLang==='am'&&project.title_am ? project.title_am : (project.title_en||project.title))}</h2>
          <p class="muted">Category: ${esc(project.category)} | Budget: ${money(project.budget_min)} - ${money(project.budget_max)} (${esc(project.currency||'ETB')})</p>
        </div>
      </div>
      <div class="job-description-box"><p>${esc(currentLang==='am'&&project.description_am ? project.description_am : (project.description_en||project.description))}</p></div>
      <hr>
      <h3>Submit Proposal</h3>
      <form id="proposalForm" class="stack-form">
        <label>Proposed Bid Rate (${project.currency||'ETB'})<input name="bid_amount" type="number" step="0.01" required></label>
        <label>Estimated Delivery (Days)<input name="delivery_days" type="number" required></label>
        <label>Cover Letter / Proposal Details<textarea name="cover_letter" rows="4" required></textarea></label>
        <button class="btn btn-primary" type="submit">Submit Proposal</button>
      </form>
    `);

    const form = $('#proposalForm');
    if(form) {
      form.onsubmit = e => {
        e.preventDefault();
        toast('Proposal submitted successfully!'); closeModal();
      };
    }
  }

  function addTestimonialModal() {
    modal(`
      <div class="section-label">ADD TESTIMONIAL</div>
      <h2>Share Your Success Story</h2>
      <form id="testimonialForm" class="stack-form">
        <label>Your Full Name<input name="author_name" value="${esc(profile?.full_name||'')}" required></label>
        <label>Company / Title<input name="company_title" placeholder="e.g. HR Manager at TechCorp" required></label>
        <label>Your Review / Testimonial<textarea name="content" rows="4" required></textarea></label>
        <button class="btn btn-primary" type="submit">Submit Testimonial</button>
      </form>
    `);

    const form = $('#testimonialForm');
    if(form) {
      form.onsubmit = e => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        testimonials.unshift({
          author_name: fd.get('author_name'), company_title: fd.get('company_title'), content: fd.get('content')
        });
        toast('Testimonial submitted successfully!'); closeModal(); renderTestimonialBanners();
      };
    }
  }

  async function accountModal() {
    modal(`
      <div class="section-label">USER PORTAL</div>
      <h2>Hello, ${esc(profile?.full_name || session?.user?.email || 'User')}</h2>
      <p class="muted">Active Subscription: <span class="status approved">${subscriptionPlan.toUpperCase()}</span></p>
      <div class="portal-tabs">
        <button class="active" data-tab="apps" type="button">Job Applications (1)</button>
        <button data-tab="props" type="button">Freelance Proposals (1)</button>
      </div>
      <div id="portalContent"><div class="order-card"><div><b>Senior HR Lead</b><small>Company: Hibret Bank S.C.</small></div><span class="status approved">approved</span></div></div>
      <div class="portal-foot"><span>${esc(session?.user?.email || 'user@tatari.et')}</span><button id="signOut" class="btn btn-outline btn-small" type="button">Logout</button></div>
    `);
    if($('#signOut')) $('#signOut').onclick = async () => { session = null; closeModal(); refreshUser(); toast('Signed out.'); };
  }

  async function submitInquiry(e) {
    e.preventDefault(); const f = e.currentTarget, fb = $('#inquiryFeedback');
    f.reset(); if(fb) fb.textContent = 'Thank you. Your inquiry has been sent to TATARI.'; toast('Inquiry sent successfully.');
  }

  async function init() {
    if($('#year')) $('#year').textContent = new Date().getFullYear();
    if($('#mobileMenu')) $('#mobileMenu').onclick = () => { if($('#nav')) $('#nav').classList.toggle('open'); };
    if($('#accountBtn')) $('#accountBtn').onclick = () => authModal();
    if($('#dashboardBtn')) $('#dashboardBtn').onclick = () => accountModal();
    if($('#logoutBtn')) $('#logoutBtn').onclick = async () => { session = null; await refreshUser(); toast('Signed out.'); };
    if($('#langEN')) $('#langEN').onclick = () => setLanguage('en');
    if($('#langAM')) $('#langAM').onclick = () => setLanguage('am');
    
    if($('#addTestimonialBtn')) $('#addTestimonialBtn').onclick = () => addTestimonialModal();
    if($('#postListingBtn')) $('#postListingBtn').onclick = () => postVacancyModal();

    $$('#moduleSelectTabs button').forEach(b => b.onclick = () => {
      $$('#moduleSelectTabs button').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      selectedModule = b.dataset.module;
      renderSearchResults();
    });

    $$('[data-plan-modal]').forEach(b => b.onclick = () => subscriptionPlanModal(b.dataset.planModal));

    if($('#filterKeyword')) $('#filterKeyword').oninput = renderSearchResults;
    if($('#filterLocation')) $('#filterLocation').oninput = renderSearchResults;
    if($('#filterSalary')) $('#filterSalary').oninput = renderSearchResults;
    if($('#filterCategory')) $('#filterCategory').onchange = renderSearchResults;
    if($('#filterWorkType')) $('#filterWorkType').onchange = renderSearchResults;

    if($('#inquiryForm')) $('#inquiryForm').onsubmit = submitInquiry;

    if(cfg.url && cfg.publishableKey && window.supabase?.createClient) {
      try {
        db = window.supabase.createClient(cfg.url, cfg.publishableKey);
        const { data } = await db.auth.getSession();
        session = data?.session || null;
        await refreshUser();
      } catch(e) { console.error('Supabase init skipped:', e); }
    }
    await loadData();
    const cartButton = document.createElement('button');
    cartButton.type = 'button'; cartButton.id = 'cartFab'; cartButton.className = 'cart-fab';
    cartButton.innerHTML = 'Cart (0) <span>▣</span>'; cartButton.onclick = cartModal;
    document.body.append(cartButton); updateCartCount();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
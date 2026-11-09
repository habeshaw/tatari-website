(() => {
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const cfg = window.TATARI_CONFIG || {};
  let db = null, session = null, profile = null, role = 'normal_user', subscriptionPlan = 'free',
      selectedModule = 'all', products = [], courses = [], jobListings = [], freelanceProjects = [], testimonials = [],
      cart = loadSavedCart(), currency = 'ETB', currentLang = 'en', resumeCartAfterLogin = false;

  function loadSavedCart(){ try{ const v = JSON.parse(localStorage.getItem('tatari_cart_v1')||'[]'); return Array.isArray(v)?v.filter(x=>x&&typeof x.id==='string'&&['product','course'].includes(x.type)&&Number.isInteger(x.quantity)&&x.quantity>=1&&x.quantity<=20):[]; }catch(_){ return []; } }
  function saveCart(){ try{ localStorage.setItem('tatari_cart_v1', JSON.stringify(cart)); }catch(e){ console.warn('Cart save error:', e); } }
  function updateCartCount(){ const b=$('#cartFab'); if(b) b.innerHTML=`Cart (${cart.reduce((n,x)=>n+x.quantity,0)}) <span>▣</span>`; }

  const toast = (msg, bad=false) => {
    const el=$('#toast'); if(!el) return; el.textContent=msg; el.className=bad?'show bad':'show';
    clearTimeout(toast.t); toast.t=setTimeout(()=>el.className='', 4200);
  };
  const esc = s => String(s??'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = (n, c=currency) => `${c==='ETB'?'ETB':'$'} ${Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  const fmt = d => new Date(d).toLocaleString(currentLang==='am'?'am-ET':'en-ET');
  const err = e => e?.message || 'Something went wrong. Please try again.';
  const ready = () => { if(!db) throw Error('Connect Supabase first.'); };

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
          ready();
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
    if(!session || !db) {
      profile = null; role = 'normal_user'; subscriptionPlan = 'free';
      if($('#accountBtn')) { $('#accountBtn').hidden = false; $('#accountBtn').textContent = 'Login'; }
      if($('#dashboardBtn')) $('#dashboardBtn').hidden = true; 
      if($('#logoutBtn')) $('#logoutBtn').hidden = true;
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
      if($('#logoutBtn')) { $('#logoutBtn').hidden = false; $('#logoutBtn').textContent = 'Logout'; }
    } catch(e) {
      console.error('Error refreshing user:', e);
    }
  }

  async function loadData() {
    if(!db) {
      const grid = $('#searchResultsGrid');
      if(grid) grid.innerHTML = '<div class="empty">Connect Supabase to view listings.</div>';
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
      products = p.data || [];
      courses = c.data || [];
      jobListings = j.data || [];
      freelanceProjects = f.data || [];
      testimonials = t.data || [];

      renderSearchResults();
      renderTestimonialBanners();
    } catch(e) {
      console.error('Data load error:', e);
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
          displayTitle: currentLang==='am'&&j.title_am ? j.title_am : j.title_en,
          displayDesc: currentLang==='am'&&j.description_am ? j.description_am : j.description_en,
          numericSalary: parseNumericSalary(j.salary_range)
        });
      });
    }

    if(selectedModule === 'all' || selectedModule === 'freelance') {
      freelanceProjects.forEach(f => {
        items.push({
          ...f, itemType: 'freelance',
          displayTitle: currentLang==='am'&&f.title_am ? f.title_am : f.title_en,
          displayDesc: currentLang==='am'&&f.description_am ? f.description_am : f.description_en,
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
      ready();
      const { error } = await db.from('subscriptions').upsert({
        user_id: session.user.id, plan_tier: planTier, status: 'active', updated_at: new Date()
      });
      if(error) throw error;
      subscriptionPlan = planTier;
      toast(`Successfully activated ${planTier.toUpperCase()} Employer Subscription!`);
      closeModal();
      await refreshUser();
    } catch(err) { toast(err.message, true); }
  }

  async function adminDashboardModal() {
    if(!session || role !== 'admin') { toast('Access restricted to Administrators only.', true); return; }
    try {
      ready();
      const [appsResult, careerResult] = await Promise.all([
        db.from('career_applications').select('*, career_jobs(title_en, company_name)').order('created_at', {ascending: false}),
        db.from('career_jobs').select('*').order('created_at', {ascending: false})
      ]);

      const applications = appsResult.data || [];

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

      $$('[data-action]').forEach(b => b.onclick = async (e) => {
        const id = b.dataset.id;
        const newStatus = b.dataset.action === 'approve' ? 'approved' : 'rejected';
        await db.from('career_applications').update({status: newStatus}).eq('id', id);
        toast(`Application updated to ${newStatus}.`);
        closeModal();
        adminDashboardModal();
      });

    } catch(err) { toast(err.message, true); }
  }

  function exportApplicationsCSV(data) {
    if(!data.length) { toast('No data available to export.', true); return; }
    const headers = ['Application ID', 'Applicant Name', 'Applicant Email', 'Job Title', 'Company', 'Resume Link', 'Notes', 'Status', 'Applied Date'];
    const rows = data.map(a => [
      a.id,
      `"${a.applicant_name.replace(/"/g, '""')}"`,
      `"${a.applicant_email}"`,
      `"${(a.career_jobs?.title_en||'').replace(/"/g, '""')}"`,
      `"${(a.career_jobs?.company_name||'').replace(/"/g, '""')}"`,
      `"${a.resume_url}"`,
      `"${(a.notes||'').replace(/"/g, '""')}"`,
      a.status,
      a.created_at
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
    if(!session) { toast('Please sign in to post.', true); authModal('signin'); return; }

    const isAdmin = role === 'admin';
    const isEmployer = role === 'employer' || subscriptionPlan === 'pro' || subscriptionPlan === 'enterprise';

    if(!isAdmin && !isEmployer) {
      toast('Employer or Admin rights required to post vacancies.', true);
      window.location.hash = '#plans-pricing';
      return;
    }

    modal(`
      <div class="section-label">${isAdmin ? '⚡ ADMIN DIRECT POSTING' : 'EMPLOYER VACANCY POSTING'}</div>
      <h2>Publish Job Vacancy or Freelance Contract</h2>
      <form id="postListingForm" class="stack-form">
        <label>Posting Type<select name="listing_type" id="listingTypeSelect"><option value="career">Full-Time / Corporate Career Job</option><option value="freelance">Freelance Contract Project</option></select></label>
        <label>Title (English)<input name="title_en" required></label>
        <label>Title (Amharic)<input name="title_am"></label>
        <label>Company / Brand Name<input name="company_name" required></label>
        <label>Company Logo Image (Optional)<input name="logo_file" type="file" accept="image/*"></label>
        <div class="form-grid">
          <label>Category<select name="category"><option>HR & Analytics</option><option>Software & Tech</option><option>Finance & Management</option><option>Design & Creative</option></select></label>
          <label>Location<input name="location" placeholder="e.g. Addis Ababa or Remote" required></label>
        </div>
        <label>Salary Range or Budget (ETB)<input name="salary_range" placeholder="e.g. 35,000 ETB/mo or 50,000 Total Budget"></label>
        <label>Description (English)<textarea name="description_en" rows="3" required></textarea></label>
        <label>Description (Amharic)<textarea name="description_am" rows="3"></textarea></label>
        <button class="btn btn-primary" type="submit">Publish Listing</button>
      </form>
    `);

    const form = $('#postListingForm');
    if(form) {
      form.onsubmit = async e => {
        e.preventDefault();
        const btn = e.currentTarget.querySelector('button[type=submit]');
        btn.disabled = true; btn.textContent = 'Publishing…';
        try {
          ready();
          const fd = new FormData(e.currentTarget);
          const type = fd.get('listing_type');
          const logoFile = fd.get('logo_file');
          let logoUrl = null;
          if(logoFile && logoFile.size) {
            logoUrl = await uploadImageFile(logoFile, 'public-logos', session.user.id);
          }

          if(type === 'career') {
            await db.from('career_jobs').insert({
              recruiter_id: session.user.id, title_en: fd.get('title_en').trim(), title_am: fd.get('title_am').trim() || null,
              company_name: fd.get('company_name').trim(), company_logo: logoUrl, category: fd.get('category'),
              location: fd.get('location').trim(), salary_range: fd.get('salary_range').trim() || null,
              description_en: fd.get('description_en').trim(), description_am: fd.get('description_am').trim() || null
            });
          } else {
            await db.from('jobs').insert({
              client_id: session.user.id, title_en: fd.get('title_en').trim(), title_am: fd.get('title_am').trim() || null,
              client_logo: logoUrl, category: fd.get('category'), budget_min: parseNumericSalary(fd.get('salary_range')),
              budget_max: parseNumericSalary(fd.get('salary_range')), description_en: fd.get('description_en').trim(),
              description_am: fd.get('description_am').trim() || null
            });
          }

          toast('Vacancy published successfully.'); closeModal(); await loadData();
        } catch(err) { toast(err.message, true); btn.disabled = false; }
      };
    }
  }

  async function uploadImageFile(file, bucketName, folderPath) {
    if(!file || !file.size) return null;
    if(file.size > 5 * 1024 * 1024) throw Error('File must be 5MB or smaller.');
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${folderPath}/${Date.now()}-${safeName}`;
    const up = await db.storage.from(bucketName).upload(path, file, {upsert: true});
    if(up.error) throw up.error;
    const { data } = db.storage.from(bucketName).getPublicUrl(path);
    return data.publicUrl;
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
    try {
      ready();
      if(!session) { resumeCartAfterLogin = true; closeModal(); authModal('signin'); toast('Please sign in to continue.'); return; }
      toast('Processing order...');
      cart = []; saveCart(); updateCartCount(); closeModal();
      toast('Order created. Payment process completed.');
    } catch(e) {
      toast(err(e), true);
    }
  }

  async function openCareerDetails(jobId) {
    const job = jobListings.find(j => String(j.id) === String(jobId));
    if(!job) return;
    modal(`
      <div class="section-label">CAREER VACANCY DETAILS</div>
      <div class="job-modal-header">
        ${job.company_logo ? `<img src="${esc(job.company_logo)}" class="company-logo-modal" alt="Logo"/>` : ''}
        <div>
          <h2>${esc(currentLang==='am'&&job.title_am ? job.title_am : job.title_en)}</h2>
          <p class="muted"><b>${esc(job.company_name||'TATARI Partner')}</b> · ${esc(job.location||'Addis Ababa')} · Salary: ${esc(job.salary_range||'Negotiable')}</p>
        </div>
      </div>
      <div class="job-description-box"><p>${esc(currentLang==='am'&&job.description_am ? job.description_am : job.description_en)}</p></div>
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
      form.onsubmit = async e => {
        e.preventDefault();
        try {
          ready();
          if(!session) { toast('Please sign in to apply.', true); authModal('signin'); return; }
          const fd = new FormData(e.currentTarget);
          const { error } = await db.from('career_applications').insert({
            job_id: job.id, user_id: session.user.id, applicant_name: fd.get('applicant_name').trim(),
            applicant_email: fd.get('applicant_email').trim(), resume_url: fd.get('resume_url').trim(), notes: fd.get('notes').trim()
          });
          if(error) throw error;
          toast('Application submitted successfully!'); closeModal();
        } catch(err) { toast(err.message, true); }
      };
    }
  }

  async function openFreelanceDetails(projectId) {
    const project = freelanceProjects.find(j => String(j.id) === String(projectId));
    if(!project) return;
    modal(`
      <div class="section-label">FREELANCE CONTRACT DETAILS</div>
      <div class="job-modal-header">
        ${project.client_logo ? `<img src="${esc(project.client_logo)}" class="company-logo-modal" alt="Logo"/>` : ''}
        <div>
          <h2>${esc(currentLang==='am'&&project.title_am ? project.title_am : project.title_en)}</h2>
          <p class="muted">Category: ${esc(project.category)} | Budget: ${money(project.budget_min)} - ${money(project.budget_max)} (${esc(project.currency)})</p>
        </div>
      </div>
      <div class="job-description-box"><p>${esc(currentLang==='am'&&project.description_am ? project.description_am : project.description_en)}</p></div>
      <hr>
      <h3>Submit Proposal</h3>
      <form id="proposalForm" class="stack-form">
        <label>Proposed Bid Rate (${project.currency})<input name="bid_amount" type="number" step="0.01" required></label>
        <label>Estimated Delivery (Days)<input name="delivery_days" type="number" required></label>
        <label>Cover Letter / Proposal Details<textarea name="cover_letter" rows="4" required></textarea></label>
        <button class="btn btn-primary" type="submit">Submit Proposal</button>
      </form>
    `);

    const form = $('#proposalForm');
    if(form) {
      form.onsubmit = async e => {
        e.preventDefault();
        try {
          ready();
          if(!session) { toast('Please sign in to submit a proposal.', true); authModal('signin'); return; }
          const fd = new FormData(e.currentTarget);
          const { error } = await db.from('proposals').insert({
            job_id: project.id, freelancer_id: session.user.id, bid_amount: Number(fd.get('bid_amount')),
            delivery_days: Number(fd.get('delivery_days')), cover_letter: fd.get('cover_letter').trim()
          });
          if(error) throw error;
          toast('Proposal submitted successfully!'); closeModal();
        } catch(err) { toast(err.message, true); }
      };
    }
  }

  function addTestimonialModal() {
    if(!session) { toast('Please sign in to add a testimonial.', true); authModal('signin'); return; }
    modal(`
      <div class="section-label">ADD TESTIMONIAL</div>
      <h2>Share Your Success Story</h2>
      <form id="testimonialForm" class="stack-form">
        <label>Your Full Name<input name="author_name" value="${esc(profile?.full_name||'')}" required></label>
        <label>Company / Title<input name="company_title" placeholder="e.g. HR Manager at TechCorp" required></label>
        <label>Profile Avatar Photo (Optional)<input name="avatar_file" type="file" accept="image/*"></label>
        <label>Your Review / Testimonial<textarea name="content" rows="4" required></textarea></label>
        <button class="btn btn-primary" type="submit">Submit Testimonial</button>
      </form>
    `);

    const form = $('#testimonialForm');
    if(form) {
      form.onsubmit = async e => {
        e.preventDefault();
        try {
          ready();
          const fd = new FormData(e.currentTarget);
          const avatarFile = fd.get('avatar_file');
          let avatarUrl = null;
          if(avatarFile && avatarFile.size) {
            avatarUrl = await uploadImageFile(avatarFile, 'public-logos', session.user.id);
          }

          const { error } = await db.from('testimonials').insert({
            user_id: session.user.id, author_name: fd.get('author_name').trim(),
            company_title: fd.get('company_title').trim(), author_avatar: avatarUrl, content: fd.get('content').trim()
          });
          if(error) throw error;
          toast('Testimonial submitted successfully!'); closeModal(); await loadData();
        } catch(err) { toast(err.message, true); }
      };
    }
  }

  async function accountModal() {
    if(!session) { authModal(); return; }
    if(role === 'admin') { adminDashboardModal(); return; }

    try {
      const [myProposals, myApplications] = await Promise.all([
        db.from('proposals').select('*, jobs(title_en)').eq('freelancer_id', session.user.id).order('created_at', {ascending: false}),
        db.from('career_applications').select('*, career_jobs(title_en, company_name)').eq('user_id', session.user.id).order('created_at', {ascending: false})
      ]);

      modal(`
        <div class="section-label">USER PORTAL (${role.toUpperCase()})</div>
        <h2>Hello, ${esc(profile?.full_name || session.user.email)}</h2>
        <p class="muted">Active Subscription: <span class="status approved">${subscriptionPlan.toUpperCase()}</span></p>
        <div class="portal-tabs">
          <button class="active" data-tab="apps" type="button">Job Applications (${myApplications.data?.length||0})</button>
          <button data-tab="props" type="button">Freelance Proposals (${myProposals.data?.length||0})</button>
        </div>
        <div id="portalContent">${myApplications.data?.length ? myApplications.data.map(a => `<div class="order-card"><div><b>${esc(a.career_jobs?.title_en)}</b><small>Company: ${esc(a.career_jobs?.company_name)}</small></div><span class="status ${a.status}">${esc(a.status)}</span></div>`).join('') : '<div class="empty">No job applications submitted yet.</div>'}</div>
        <div class="portal-foot"><span>${esc(session.user.email)}</span><button id="signOut" class="btn btn-outline btn-small" type="button">Logout</button></div>
      `);
      
      const tabs = $$('[data-tab]');
      tabs.forEach(t => t.onclick = () => {
        tabs.forEach(x => x.classList.toggle('active', x===t));
        const c = $('#portalContent');
        if(c) {
          if(t.dataset.tab === 'apps') c.innerHTML = myApplications.data?.length ? myApplications.data.map(a => `<div class="order-card"><div><b>${esc(a.career_jobs?.title_en)}</b><small>Company: ${esc(a.career_jobs?.company_name)}</small></div><span class="status ${a.status}">${esc(a.status)}</span></div>`).join('') : '<div class="empty">No applications yet.</div>';
          if(t.dataset.tab === 'props') c.innerHTML = myProposals.data?.length ? myProposals.data.map(p => `<div class="order-card"><div><b>${esc(p.jobs?.title_en)}</b><small>Bid: ${money(p.bid_amount)}</small></div><span class="status ${p.status}">${esc(p.status)}</span></div>`).join('') : '<div class="empty">No proposals yet.</div>';
        }
      });
      if($('#signOut')) $('#signOut').onclick = async () => { await db.auth.signOut(); session = null; await refreshUser(); closeModal(); toast('Signed out.'); };
    } catch(e) { toast(err(e), true); }
  }

  async function submitInquiry(e) {
    e.preventDefault(); const f = e.currentTarget, fd = new FormData(f), fb = $('#inquiryFeedback');
    try {
      ready();
      const { error } = await db.from('inquiries').insert({
        customer_id: session?.user?.id || null, name: fd.get('name').trim(), email: fd.get('email').trim(), phone: fd.get('phone').trim() || null, service: fd.get('service'), message: fd.get('message').trim()
      });
      if(error) throw error;
      f.reset(); if(fb) fb.textContent = 'Thank you. Your inquiry has been sent to TATARI.'; toast('Inquiry sent successfully.');
    } catch(e) { if(fb) { fb.textContent = err(e); fb.className = 'form-feedback error'; } }
  }

  async function init() {
    if($('#year')) $('#year').textContent = new Date().getFullYear();
    if($('#mobileMenu')) $('#mobileMenu').onclick = () => { if($('#nav')) $('#nav').classList.toggle('open'); };
    if($('#accountBtn')) $('#accountBtn').onclick = () => authModal();
    if($('#dashboardBtn')) $('#dashboardBtn').onclick = () => accountModal();
    if($('#logoutBtn')) $('#logoutBtn').onclick = async () => { await db.auth.signOut(); session = null; await refreshUser(); toast('Signed out.'); };
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
      } catch(e) { console.error('Supabase init failed:', e); }
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
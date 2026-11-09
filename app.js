(() => {
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const cfg = window.TATARI_CONFIG || {};
  let db = null, session = { user: { id: 'demo-user-123', email: 'user@tatari.et' } }, profile = { full_name: 'Demo Member' }, role = 'employer', subscriptionPlan = 'pro',
      selectedModule = 'all', products = [], courses = [], jobListings = [], freelanceProjects = [], testimonials = [],
      cart = loadSavedCart(), currency = 'ETB', currentLang = 'en', resumeCartAfterLogin = false;

  const defaultJobs = [
    { id: 'c1', title_en: 'Senior HR & Talent Acquisition Lead', title_am: 'የክፍተኛ የሰው ሀብት እና ታለንት መሪ', company_name: 'Hibret Bank S.C.', company_logo: '', location: 'Addis Ababa', salary_range: '45,000 ETB/mo', category: 'HR & Analytics', job_type: 'Full-Time', description_en: 'Lead organizational talent acquisition, policy planning, and workforce analytics across banking operations.', description_am: 'የድርጅት ታለንት ቅጥር እና ፖሊሲ እቅድን ይመሩ::', itemType: 'career' },
    { id: 'c2', title_en: 'Full-Stack Web & Mobile Developer', title_am: 'ሙሉ-ስታክ ዌብ እና ሞባይል አልሚ', company_name: 'Tatari Tech Labs', company_logo: '', location: 'Remote / Addis Ababa', salary_range: '65,000 ETB/mo', category: 'Software & Tech', job_type: 'Remote', description_en: 'Develop high-performance React, Node.js, and Supabase solutions for enterprise software systems.', description_am: 'ለፊንቴክ መድረኮች ከፍተኛ አፈጻጸም ያላቸውን የዌብ መተግበሪያዎች ይገንቡ::', itemType: 'career' }
  ];

  const defaultFreelance = [
    { id: 'f1', title_en: 'UI/UX Redesign for Mobile Banking App', title_am: 'ለሞባይል ባንክ መተግበሪያ UI/UX ዲዛይን', client_logo: '', category: 'Design & Creative', job_type: 'Contract', budget_min: 35000, budget_max: 70000, currency: 'ETB', description_en: 'Redesign native iOS and Android user interfaces for optimal customer experience and accessibility.', description_am: 'የባንክ መተግበሪያ የተጠቃሚ ምስላዊ ዲዛይን ማሻሻል::', itemType: 'freelance' }
  ];

  const defaultProducts = [
    { id: 'p1', name: 'Ethiopian HR Policy & Strategy Toolkit', name_am: 'የኢትዮጵያ የሰው ሀብት ፖሊሲ እና ስትራቴጂ ኪት', price_etb: 4500, price_usd: 80, description: 'Standardized templates, internal audit checklists, and balanced scorecards.', itemType: 'product' }
  ];

  const defaultCourses = [
    { id: 'k1', title: 'Full-Stack Web Development Bootcamp', title_am: 'ሙሉ-ስታክ የዌብ አልሚ ስልጠና', price_etb: 8500, price_usd: 150, description: 'Comprehensive practical training on Javascript, Supabase, React, and Vercel deployment.', itemType: 'course' }
  ];

  const defaultTestimonials = [
    { id: 't1', author_name: 'Solomon Worku', company_title: 'Managing Director, Commercial Enterprise', content: 'TATARI has radically transformed our recruitment strategy and talent matching accuracy in Ethiopia.' }
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
    modal(`<div class="section-label">TATARI ACCOUNT</div><h2>${mode==='signup'?'Create your account':mode==='reset'?'Reset password':updating?'Choose a new password':'Welcome back'}</h2><p class="muted">${mode==='signup'?'Register as a Normal User or Employer to apply for jobs, post vacancies, or hire freelancers.':mode==='reset'?'Enter your account email to receive a reset link.':updating?'Choose a new password for your TATARI account.':'Sign in to access your portal, applications, and subscriptions.'}</p><form id="authForm" class="stack-form">${mode==='signup'?'<label>Full name<input name="full_name" required minlength="2"></label><label>Account Type / Role<select name="user_role" id="userRoleSelect"><option value="normal_user">👤 Ordinary User (Job Seeker / Freelancer)</option><option value="employer">🏢 Employer / Recruiter</option><option value="admin">⚡ System Administrator</option></select></label>':''}${mode==='reset'||mode==='signin'||mode==='signup'?'<label>Email<input name="email" type="email" required id="authEmail"></label>':''}${mode!=='reset'?`<label>${updating?'New password':'Password'}<input name="password" type="password" required minlength="8" autocomplete="new-password"></label>`:''}${updating?'<label>Confirm new password<input name="confirm_password" type="password" required minlength="8"></label>':''}<button class="btn btn-primary" type="submit">${mode==='signup'?'Create account':mode==='reset'?'Send reset link':updating?'Update password':'Sign in'}</button><p id="authFeedback" class="form-feedback"></p></form><div class="auth-switch">${mode==='signin'?'<button type="button" id="goSignup">Create an account</button><button type="button" id="goReset">Forgot password?</button>':updating?'':'<button type="button" id="goSignin">Back to sign in</button>'}</div>`);
    
    const form = $('#authForm');
    if(form) {
      form.onsubmit = async e => {
        e.preventDefault();
        const f = new FormData(e.currentTarget), fb = $('#authFeedback'), btn = $('button[type=submit]', e.currentTarget);
        btn.disabled = true;
        try {
          if(!db) {
            session = { user: { id: 'user-' + Date.now(), email: f.get('email') || 'user@tatari.et' } };
            profile = { full_name: f.get('full_name') || 'TATARI Member' };
            role = f.get('user_role') || 'employer';
            closeModal(); await refreshUser(); toast('Signed in successfully.');
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
      if($('#dashboardBtn')) { $('#dashboardBtn').hidden = false; $('#dashboardBtn').textContent = 'My Account'; }
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
        const roleLabel = role==='admin' ? '⚡ Administrator' : role==='employer' ? '🏢 Employer' : '👤 Ordinary User';
        $('#dashboardBtn').innerHTML = `${roleLabel} Portal`;
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
    if(!testimonials.length) {
      banner.innerHTML = '<div class="empty">No testimonials added yet. Click "+ Add Testimonial" to submit one!</div>';
      return;
    }
    // Duplicate list to achieve continuous infinite marquee effect
    const list = [...testimonials, ...testimonials];
    const cardsHtml = list.map(t => `
      <div class="testimonial-card">
        <div class="testimonial-header">
          ${t.author_avatar ? `<img src="${esc(t.author_avatar)}" class="author-avatar" alt="Avatar"/>` : '<div class="avatar-placeholder">👤</div>'}
          <div>
            <b>${esc(t.author_name)}</b>
            <small>${esc(t.company_title || 'Verified Member')}</small>
          </div>
        </div>
        <p>"${esc(t.content)}"</p>
      </div>`).join('');

    banner.innerHTML = `<div class="testimonial-marquee-wrapper"><div class="testimonial-marquee-track">${cardsHtml}</div></div>`;
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
        <button class="btn btn-primary full-btn" id="confirmSubBtn" type="button">${isCurrent?'Plan Already Active':'Confirm Subscription Plan'}</button>
      </div>
    `);

    if($('#confirmSubBtn')) $('#confirmSubBtn').onclick = () => selectSubscriptionPlan(planTier);
  }

  async function selectSubscriptionPlan(planTier) {
    subscriptionPlan = planTier;
    toast(`Successfully activated ${planTier.toUpperCase()} Employer Subscription!`);
    closeModal();
    refreshUser();
  }

  function postVacancyModal() {
    modal(`
      <div class="section-label">VACANCY & PROJECT PUBLISHING</div>
      <h2>Publish Job Vacancy or Freelance Contract</h2>
      <form id="postListingForm" class="stack-form">
        <label>Posting Type<select name="listing_type" id="listingTypeSelect"><option value="career">Full-Time / Corporate Career Job</option><option value="freelance">Freelance Contract Project</option></select></label>
        <label>Title (English)<input name="title_en" placeholder="e.g. Senior Software Engineer" required></label>
        <label>Title (Amharic)<input name="title_am" placeholder="e.g. ሲኒየር ሶፍትዌር ኢንጂነር"></label>
        <label>Company / Brand Name<input name="company_name" placeholder="e.g. Hibret Bank or Tech Ethiopia" required></label>
        <div class="form-grid">
          <label>Category<select name="category"><option>HR & Analytics</option><option selected>Software & Tech</option><option>Finance & Management</option><option>Design & Creative</option></select></label>
          <label>Location<input name="location" placeholder="e.g. Addis Ababa or Remote" required></label>
        </div>
        <label>Salary Range or Budget (ETB)<input name="salary_range" placeholder="e.g. 45,000 ETB/mo"></label>
        <label>Description (English)<textarea name="description_en" rows="3" placeholder="Detailed job requirements..." required></textarea></label>
        <button class="btn btn-primary" type="submit">Publish Listing Instant ↗</button>
      </form>
    `);

    const form = $('#postListingForm');
    if(form) {
      form.onsubmit = e => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const listingType = fd.get('listing_type');
        const newJob = {
          id: 'custom-' + Date.now(),
          title_en: fd.get('title_en'),
          title_am: fd.get('title_am'),
          company_name: fd.get('company_name'),
          location: fd.get('location'),
          salary_range: fd.get('salary_range'),
          category: fd.get('category'),
          job_type: 'Full-Time',
          description_en: fd.get('description_en'),
          itemType: listingType === 'career' ? 'career' : 'freelance'
        };

        if(listingType === 'career') {
          jobListings.unshift(newJob);
        } else {
          freelanceProjects.unshift({
            ...newJob,
            budget_min: parseNumericSalary(newJob.salary_range) || 30000,
            budget_max: parseNumericSalary(newJob.salary_range) || 60000
          });
        }
        
        toast('New Vacancy / Project published to Search Engine successfully!');
        closeModal();
        renderSearchResults();
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
    toast('Processing order...');
    cart = []; saveCart(); updateCartCount(); closeModal();
    toast('Order created successfully. Payment instructions sent.');
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
        <label>Your Full Name<input name="author_name" placeholder="e.g. Hana Tadesse" value="${esc(profile?.full_name||'')}" required></label>
        <label>Company / Title<input name="company_title" placeholder="e.g. HR Director at Commercial Corp" required></label>
        <label>Your Review / Testimonial<textarea name="content" rows="4" placeholder="Describe your experience with TATARI..." required></textarea></label>
        <button class="btn btn-primary" type="submit">Submit Testimonial ↗</button>
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
        toast('Testimonial added to website successfully!'); closeModal(); renderTestimonialBanners();
      };
    }
  }

  async function accountModal() {
    const roleTitle = role === 'admin' ? '⚡ Administrator' : role === 'employer' ? '🏢 Employer / Recruiter' : '👤 Ordinary User (Job Seeker)';
    const roleBadgeClass = role === 'admin' ? 'admin' : role === 'employer' ? 'employer' : 'normal_user';
    const permissionsInfo = role === 'admin' 
      ? 'Full Privileges: Moderate listings, manage candidate applications, export system CSV/Excel records, oversee platform subscriptions.' 
      : role === 'employer'
      ? 'Employer Privileges: Publish corporate vacancies, post freelance contracts, view candidate applications, purchase subscription tiers.'
      : 'Ordinary User Privileges: Search jobs & freelance opportunities, submit job applications, place freelance bids, purchase digital resources & courses.';

    modal(`
      <div class="section-label">ACCOUNT DASHBOARD & ROLE CONTROL</div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <h2>Hello, ${esc(profile?.full_name || session?.user?.email || 'User')}</h2>
        <span class="role-badge ${roleBadgeClass}">${roleTitle}</span>
      </div>
      
      <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:14px; border-radius:10px; font-size:12px; margin-bottom:18px;">
        <strong style="display:block; margin-bottom:4px; color:#1e293b;">Role Capabilities & Access Level:</strong>
        <p style="margin:0; color:#475569;">${permissionsInfo}</p>
        <div style="margin-top:10px; display:flex; gap:8px;">
          <small>Switch active role demo:</small>
          <button class="btn btn-small btn-outline" id="switchUserRole" type="button">Switch to ${role==='admin'?'Ordinary User':role==='employer'?'Administrator':'Employer'}</button>
        </div>
      </div>

      <p class="muted">Active Subscription Plan: <span class="status approved">${subscriptionPlan.toUpperCase()}</span></p>
      
      ${role==='admin' ? `
        <div class="admin-actions-bar">
          <button class="btn btn-primary btn-small" onclick="window.TATARI_ADMIN_EXPORT_CSV()" type="button">📥 Export All Applications (CSV)</button>
          <button class="btn btn-outline btn-small" onclick="window.TATARI_ADMIN_EXPORT_EXCEL()" type="button">📊 Export All Applications (Excel)</button>
        </div>
      ` : ''}

      <div class="portal-tabs">
        <button class="active" data-tab="apps" type="button">My Applications (1)</button>
        <button data-tab="props" type="button">My Proposals (1)</button>
      </div>
      <div id="portalContent"><div class="order-card"><div><b>Senior HR Lead</b><small>Company: Hibret Bank S.C.</small></div><span class="status approved">approved</span></div></div>
      <div class="portal-foot"><span>${esc(session?.user?.email || 'user@tatari.et')}</span><button id="signOut" class="btn btn-outline btn-small" type="button">Logout</button></div>
    `);

    if($('#switchUserRole')) {
      $('#switchUserRole').onclick = () => {
        role = role === 'admin' ? 'normal_user' : role === 'employer' ? 'admin' : 'employer';
        toast(`Switched role view to: ${role.toUpperCase()}`);
        refreshUser();
        closeModal();
        accountModal();
      };
    }
    if($('#signOut')) $('#signOut').onclick = async () => { session = null; closeModal(); refreshUser(); toast('Signed out.'); };
  }
  
  window.TATARI_ADMIN_EXPORT_CSV = () => exportApplicationsCSV([
    { id: 'app1', applicant_name: 'Abebe Bikila', applicant_email: 'abebe@example.com', career_jobs: { title_en: 'Senior HR Lead', company_name: 'Hibret Bank S.C.' }, resume_url: 'https://drive.google.com', status: 'approved', notes: 'Top candidate' }
  ]);
  window.TATARI_ADMIN_EXPORT_EXCEL = () => exportApplicationsExcel([
    { id: 'app1', applicant_name: 'Abebe Bikila', applicant_email: 'abebe@example.com', career_jobs: { title_en: 'Senior HR Lead', company_name: 'Hibret Bank S.C.' }, resume_url: 'https://drive.google.com', status: 'approved', notes: 'Top candidate' }
  ]);

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

    // Module Tabs Direct Handler
    const moduleTabs = $$('#moduleSelectTabs button');
    moduleTabs.forEach(b => {
      b.onclick = (e) => {
        e.preventDefault();
        moduleTabs.forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        selectedModule = b.dataset.module;
        renderSearchResults();
      };
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
        if(data?.session) session = data.session;
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
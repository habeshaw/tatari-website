(() => {
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const cfg = window.TATARI_CONFIG || {};
  let db = null, session = { user: { id: 'demo-user-123', email: 'user@tatari.et' } }, profile = { full_name: 'Demo Member' },
      role = 'normal_user', // 'admin', 'employer', 'normal_user'
      subscriptionPlan = 'free', // 'free', 'starter', 'pro', 'enterprise'
      selectedModule = 'all', products = [], courses = [], jobListings = [], freelanceProjects = [], testimonials = [],
      applications = [], proposals = [],
      cart = loadSavedCart(), currency = 'ETB', currentLang = 'en';

  // Business Logic Datasets with role attribution
  const defaultJobs = [
    { id: 'c1', title_en: 'Senior HR & Talent Acquisition Lead', title_am: 'የክፍተኛ የሰው ሀብት እና ታለንት መሪ', company_name: 'Hibret Bank S.C.', company_logo: '', location: 'Addis Ababa', salary_range: '45,000 ETB/mo', category: 'HR & Analytics', job_type: 'Full-Time', description_en: 'Lead organizational talent acquisition, policy planning, and workforce analytics across banking operations.', description_am: 'የድርጅት ታለንት ቅጥር እና ፖሊሲ እቅድን ይመሩ::', itemType: 'career', status: 'open', recruiter_id: 'employer-1' },
    { id: 'c2', title_en: 'Full-Stack Web & Mobile Developer', title_am: 'ሙሉ-ስታክ ዌብ እና ሞባይል አልሚ', company_name: 'Tatari Tech Labs', company_logo: '', location: 'Remote / Addis Ababa', salary_range: '65,000 ETB/mo', category: 'Software & Tech', job_type: 'Remote', description_en: 'Develop high-performance React, Node.js, and Supabase solutions for enterprise software systems.', description_am: 'ለፊንቴክ መድረኮች ከፍተኛ አፈጻጸም ያላቸውን የዌብ መተግበሪያዎች ይገንቡ::', itemType: 'career', status: 'open', recruiter_id: 'employer-2' }
  ];

  const defaultFreelance = [
    { id: 'f1', title_en: 'UI/UX Redesign for Mobile Banking App', title_am: 'ለሞባይል ባንክ መተግበሪያ UI/UX ዲዛይን', client_logo: '', category: 'Design & Creative', job_type: 'Contract', budget_min: 35000, budget_max: 70000, currency: 'ETB', description_en: 'Redesign native iOS and Android user interfaces for optimal customer experience and accessibility.', description_am: 'የባንክ መተግበሪያ የተጠቃሚ ምስላዊ ዲዛይን ማሻሻል::', itemType: 'freelance', status: 'open', client_id: 'employer-1' }
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

  const defaultApplications = [
    { id: 'app1', job_id: 'c1', user_id: 'demo-user-123', applicant_name: 'Abebe Bikila', applicant_email: 'abebe@example.com', resume_url: 'https://drive.google.com/demo-cv', notes: 'Experienced HR strategist.', status: 'pending', created_at: new Date().toISOString(), career_jobs: { title_en: 'Senior HR & Talent Acquisition Lead', company_name: 'Hibret Bank S.C.' } }
  ];

  const defaultProposals = [
    { id: 'prop1', job_id: 'f1', freelancer_id: 'demo-user-123', bid_amount: 45000, delivery_days: 14, cover_letter: 'I have 5+ years experience designing financial apps in Ethiopia.', status: 'submitted', created_at: new Date().toISOString(), jobs: { title_en: 'UI/UX Redesign for Mobile Banking App' } }
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

  function switchRole(newRole) {
    role = newRole;
    if(newRole === 'employer' && subscriptionPlan === 'free') subscriptionPlan = 'pro';
    toast(`Active Role Switched to: ${role === 'admin' ? '⚡ System Administrator' : role === 'employer' ? '🏢 Employer / Recruiter' : '👤 Ordinary User'}`);
    refreshUser();
    renderSearchResults();
  }

  function authModal(mode='signin'){
    const updating = mode === 'updatepassword';
    modal(`
      <div class="section-label">TATARI ACCOUNT & ROLE SELECTOR</div>
      <h2>${mode==='signup'?'Create your account':mode==='reset'?'Reset password':updating?'Choose a new password':'Welcome back'}</h2>
      <p class="muted">Select your functional role to experience customized permissions and business logic.</p>
      
      <form id="authForm" class="stack-form">
        ${mode==='signup' || mode==='signin' ? `
          <label>Select Active Role (Business Logic Rule)
            <select name="user_role" id="userRoleSelect">
              <option value="normal_user" ${role==='normal_user'?'selected':''}>👤 Ordinary User (Job Seeker / Freelancer)</option>
              <option value="employer" ${role==='employer'?'selected':''}>🏢 Employer / Recruiter (Publish Vacancies)</option>
              <option value="admin" ${role==='admin'?'selected':''}>⚡ System Administrator (Manage & Export)</option>
            </select>
          </label>
        ` : ''}
        ${mode==='signup'?'<label>Full name<input name="full_name" value="Demo Member" required minlength="2"></label>':''}
        ${mode==='reset'||mode==='signin'||mode==='signup'?'<label>Email<input name="email" type="email" value="user@tatari.et" required id="authEmail"></label>':''}
        ${mode!=='reset'?`<label>${updating?'New password':'Password'}<input name="password" type="password" value="password123" required minlength="6"></label>`:''}
        <button class="btn btn-primary" type="submit">${mode==='signup'?'Create Account':mode==='reset'?'Send Reset Link':updating?'Update Password':'Sign In & Activate Role'}</button>
        <p id="authFeedback" class="form-feedback"></p>
      </form>
      <div class="auth-switch">
        ${mode==='signin'?'<button type="button" id="goSignup">Create an account</button><button type="button" id="goReset">Forgot password?</button>':updating?'':'<button type="button" id="goSignin">Back to sign in</button>'}
      </div>
    `);

    const form = $('#authForm');
    if(form) {
      form.onsubmit = async e => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const chosenRole = f.get('user_role') || 'normal_user';
        role = chosenRole;
        session = { user: { id: 'demo-user-123', email: f.get('email') || 'user@tatari.et' } };
        profile = { full_name: f.get('full_name') || 'Demo Member' };
        closeModal();
        await refreshUser();
        toast(`Signed in as ${role === 'admin' ? '⚡ System Administrator' : role === 'employer' ? '🏢 Employer' : '👤 Ordinary User'}.`);
      };
    }
    if($('#goSignup')) $('#goSignup').onclick = () => authModal('signup');
    if($('#goReset')) $('#goReset').onclick = () => authModal('reset');
    if($('#goSignin')) $('#goSignin').onclick = () => authModal('signin');
  }

  async function refreshUser() {
    if($('#accountBtn')) {
      if(!session) { $('#accountBtn').hidden = false; $('#accountBtn').textContent = 'Login'; }
      else { $('#accountBtn').hidden = true; }
    }
    if($('#dashboardBtn')) {
      if(session) {
        $('#dashboardBtn').hidden = false;
        const roleLabel = role==='admin' ? '⚡ Administrator' : role==='employer' ? '🏢 Employer' : '👤 Ordinary User';
        $('#dashboardBtn').innerHTML = `${roleLabel} Portal`;
      } else {
        $('#dashboardBtn').hidden = true;
      }
    }
    if($('#logoutBtn')) $('#logoutBtn').hidden = !session;
  }

  async function loadData() {
    products = defaultProducts;
    courses = defaultCourses;
    jobListings = defaultJobs;
    freelanceProjects = defaultFreelance;
    testimonials = defaultTestimonials;
    applications = defaultApplications;
    proposals = defaultProposals;
    renderSearchResults();
    renderTestimonialBanners();
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
        const canApply = role === 'normal_user' || role === 'admin';
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
                <button class="btn ${canApply?'btn-outline':'btn-ghost'} btn-small" data-career-id="${item.id}" type="button">
                  ${canApply ? 'Apply for Job' : 'View Job Details'}
                </button>
              </div>
            </div>
          </article>`;
      } else if(item.itemType === 'freelance') {
        const canBid = role === 'normal_user' || role === 'admin';
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
                <button class="btn ${canBid?'btn-primary':'btn-outline'} btn-small" data-freelance-id="${item.id}" type="button">
                  ${canBid ? 'Submit Proposal' : 'View Proposal Details'}
                </button>
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
    if(role === 'normal_user') role = 'employer';
    toast(`Successfully activated ${planTier.toUpperCase()} Employer Subscription!`);
    closeModal();
    refreshUser();
  }

  // Business Logic: Only Employers & Admins can publish listings
  function postVacancyModal() {
    if(role === 'normal_user') {
      toast('Business Logic Policy: Only Employers & Admins can post vacancies. Switched to Employer mode.', true);
      switchRole('employer');
    }

    modal(`
      <div class="section-label">${role==='admin'?'⚡ ADMIN DIRECT PUBLISHING':'🏢 EMPLOYER VACANCY PUBLISHING'}</div>
      <h2>Publish Job Vacancy or Freelance Contract</h2>
      <p class="muted">Active Role: <b>${role==='admin'?'System Administrator':'Employer / Recruiter'}</b> (${subscriptionPlan.toUpperCase()} Plan)</p>
      
      <form id="postListingForm" class="stack-form">
        <label>Posting Type
          <select name="listing_type" id="listingTypeSelect">
            <option value="career">Full-Time / Corporate Career Job</option>
            <option value="freelance">Freelance Contract Project</option>
          </select>
        </label>
        <label>Title (English)<input name="title_en" placeholder="e.g. Senior Software Engineer" required></label>
        <label>Title (Amharic)<input name="title_am" placeholder="e.g. ሲኒየር ሶፍትዌር ኢንጂነር"></label>
        <label>Company / Brand Name<input name="company_name" placeholder="e.g. Hibret Bank or Tech Ethiopia" required></label>
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
          itemType: listingType === 'career' ? 'career' : 'freelance',
          recruiter_id: session?.user?.id || 'employer-1'
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

  // Business Logic: Ordinary Users apply for jobs
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
        <label>Full Name<input name="applicant_name" value="${esc(profile?.full_name||'Demo Member')}" required></label>
        <label>Email Address<input name="applicant_email" type="email" value="${esc(session?.user?.email||'user@tatari.et')}" required></label>
        <label>Resume / CV Link (Google Drive / LinkedIn)<input name="resume_url" type="url" value="https://drive.google.com/demo-cv" required></label>
        <label>Cover Letter / Application Notes<textarea name="notes" rows="3" required>I am excited to apply for this role at ${esc(job.company_name||'TATARI Partner')}.</textarea></label>
        <button class="btn btn-primary" type="submit">Submit Candidate Application</button>
      </form>
    `);

    const form = $('#jobAppForm');
    if(form) {
      form.onsubmit = e => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        applications.unshift({
          id: 'app-' + Date.now(),
          job_id: job.id,
          user_id: session?.user?.id || 'demo-user-123',
          applicant_name: fd.get('applicant_name'),
          applicant_email: fd.get('applicant_email'),
          resume_url: fd.get('resume_url'),
          notes: fd.get('notes'),
          status: 'pending',
          created_at: new Date().toISOString(),
          career_jobs: { title_en: job.title_en, company_name: job.company_name }
        });
        toast('Application submitted successfully to employer ATS!');
        closeModal();
      };
    }
  }

  // Business Logic: Ordinary Users submit freelance proposals
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
      <h3>Submit Freelance Proposal</h3>
      <form id="proposalForm" class="stack-form">
        <label>Proposed Bid Rate (${project.currency||'ETB'})<input name="bid_amount" type="number" value="${project.budget_min||45000}" required></label>
        <label>Estimated Delivery (Days)<input name="delivery_days" type="number" value="10" required></label>
        <label>Cover Letter / Proposal Details<textarea name="cover_letter" rows="3" required>Proven expertise delivering similar projects on budget.</textarea></label>
        <button class="btn btn-primary" type="submit">Submit Proposal</button>
      </form>
    `);

    const form = $('#proposalForm');
    if(form) {
      form.onsubmit = e => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        proposals.unshift({
          id: 'prop-' + Date.now(),
          job_id: project.id,
          freelancer_id: session?.user?.id || 'demo-user-123',
          bid_amount: Number(fd.get('bid_amount')),
          delivery_days: Number(fd.get('delivery_days')),
          cover_letter: fd.get('cover_letter'),
          status: 'submitted',
          created_at: new Date().toISOString(),
          jobs: { title_en: project.title_en }
        });
        toast('Freelance proposal submitted successfully!');
        closeModal();
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

  // Multi-Role Dashboard following explicit Business Logic rules
  async function accountModal() {
    const roleTitle = role === 'admin' ? '⚡ System Administrator' : role === 'employer' ? '🏢 Employer / Recruiter' : '👤 Ordinary User (Job Seeker / Freelancer)';
    const roleBadgeClass = role === 'admin' ? 'admin' : role === 'employer' ? 'employer' : 'normal_user';
    const permissionsInfo = role === 'admin' 
      ? 'FULL ADMIN PRIVILEGES: Oversee system listings, approve candidate submissions, manage user roles, export compliance reports in CSV and Excel formats.' 
      : role === 'employer'
      ? 'EMPLOYER PRIVILEGES: Publish job vacancies, post freelance project contracts, track incoming candidate applications & freelancer proposals, upgrade subscription packages.'
      : 'ORDINARY USER PRIVILEGES: Browse search engine, submit job applications, submit freelance project proposals, purchase courses and digital resources.';

    const appRowsHtml = applications.map(a => `
      <tr data-app-id="${a.id}">
        <td><b>${esc(a.applicant_name)}</b><br><small>${esc(a.applicant_email)}</small></td>
        <td><b>${esc(a.career_jobs?.title_en || 'Vacancy')}</b><br><small>${esc(a.career_jobs?.company_name||'Company')}</small></td>
        <td><a href="${esc(a.resume_url)}" target="_blank" class="pill-link">📄 Resume</a></td>
        <td><span class="status ${a.status}">${esc(a.status)}</span></td>
        ${role==='admin'||role==='employer'?`
          <td>
            <button class="btn btn-small btn-outline" data-app-action="approved" data-id="${a.id}" type="button">Approve</button>
            <button class="btn btn-small btn-outline" data-app-action="rejected" data-id="${a.id}" type="button">Reject</button>
          </td>
        `:''}
      </tr>
    `).join('');

    modal(`
      <div class="section-label">ACCOUNT DASHBOARD & ROLE CONTROL</div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:10px;">
        <h2>Hello, ${esc(profile?.full_name || session?.user?.email || 'User')}</h2>
        <span class="role-badge ${roleBadgeClass}">${roleTitle}</span>
      </div>
      
      <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:16px; border-radius:12px; font-size:12px; margin-bottom:18px;">
        <strong style="display:block; margin-bottom:6px; color:#1e293b;">Business Logic & Role Capabilities:</strong>
        <p style="margin:0; color:#475569; line-height:1.6;">${permissionsInfo}</p>
        <div style="margin-top:12px; display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
          <span style="font-weight:700;">Switch Role View:</span>
          <button class="btn btn-small ${role==='normal_user'?'btn-primary':'btn-outline'}" id="roleUserBtn" type="button">Ordinary User</button>
          <button class="btn btn-small ${role==='employer'?'btn-primary':'btn-outline'}" id="roleEmpBtn" type="button">Employer</button>
          <button class="btn btn-small ${role==='admin'?'btn-primary':'btn-outline'}" id="roleAdminBtn" type="button">Administrator</button>
        </div>
      </div>

      <p class="muted">Active Subscription Tier: <span class="status approved">${subscriptionPlan.toUpperCase()}</span></p>
      
      ${role==='admin' || role==='employer' ? `
        <div class="admin-actions-bar">
          <button class="btn btn-primary btn-small" id="exportCSVBtn" type="button">📥 Export Applications (CSV)</button>
          <button class="btn btn-outline btn-small" id="exportExcelBtn" type="button">📊 Export Applications (Excel)</button>
          <button class="btn btn-outline btn-small" id="dashPostBtn" type="button">+ Post Vacancy</button>
        </div>
      ` : ''}

      <div class="portal-tabs">
        <button class="active" data-tab="apps" type="button">Applications (${applications.length})</button>
        <button data-tab="props" type="button">Freelance Proposals (${proposals.length})</button>
      </div>

      <div id="portalContent" class="table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Applicant</th>
              <th>Job & Company</th>
              <th>Resume</th>
              <th>Status</th>
              ${role==='admin'||role==='employer'?'<th>Action</th>':''}
            </tr>
          </thead>
          <tbody>
            ${appRowsHtml || '<tr><td colspan="5" class="empty">No applications found.</td></tr>'}
          </tbody>
        </table>
      </div>

      <div class="portal-foot">
        <span>Account: ${esc(session?.user?.email || 'user@tatari.et')}</span>
        <button id="signOut" class="btn btn-outline btn-small" type="button">Logout</button>
      </div>
    `);

    if($('#roleUserBtn')) $('#roleUserBtn').onclick = () => { switchRole('normal_user'); closeModal(); accountModal(); };
    if($('#roleEmpBtn')) $('#roleEmpBtn').onclick = () => { switchRole('employer'); closeModal(); accountModal(); };
    if($('#roleAdminBtn')) $('#roleAdminBtn').onclick = () => { switchRole('admin'); closeModal(); accountModal(); };

    if($('#exportCSVBtn')) $('#exportCSVBtn').onclick = () => exportApplicationsCSV(applications);
    if($('#exportExcelBtn')) $('#exportExcelBtn').onclick = () => exportApplicationsExcel(applications);
    if($('#dashPostBtn')) $('#dashPostBtn').onclick = () => postVacancyModal();

    $$('[data-app-action]').forEach(b => b.onclick = (e) => {
      const appId = b.dataset.id;
      const newStat = b.dataset.appAction;
      const app = applications.find(x => x.id === appId);
      if(app) app.status = newStat;
      toast(`Application status updated to ${newStat.toUpperCase()}.`);
      closeModal(); accountModal();
    });

    const tabs = $$('[data-tab]');
    tabs.forEach(t => t.onclick = () => {
      tabs.forEach(x => x.classList.toggle('active', x===t));
      const c = $('#portalContent');
      if(c) {
        if(t.dataset.tab === 'apps') {
          c.innerHTML = `
            <table class="admin-table">
              <thead><tr><th>Applicant</th><th>Job & Company</th><th>Resume</th><th>Status</th>${role==='admin'||role==='employer'?'<th>Action</th>':''}</tr></thead>
              <tbody>${appRowsHtml || '<tr><td colspan="5" class="empty">No applications found.</td></tr>'}</tbody>
            </table>`;
        } else {
          c.innerHTML = proposals.length ? proposals.map(p => `<div class="order-card"><div><b>${esc(p.jobs?.title_en||'Freelance Project')}</b><small>Bid: ${money(p.bid_amount)} · Delivery: ${p.delivery_days} days</small></div><span class="status ${p.status}">${esc(p.status)}</span></div>`).join('') : '<div class="empty">No proposals submitted yet.</div>';
        }
      }
    });

    if($('#signOut')) $('#signOut').onclick = async () => { session = null; closeModal(); refreshUser(); toast('Signed out.'); };
  }

  function exportApplicationsCSV(data) {
    if(!data.length) { toast('No application records available to export.', true); return; }
    const headers = ['Application ID', 'Applicant Name', 'Applicant Email', 'Job Title', 'Company', 'Resume Link', 'Notes', 'Status', 'Applied Date'];
    const rows = data.map(a => [
      a.id,
      `"${(a.applicant_name||'').replace(/"/g, '""')}"`,
      `"${a.applicant_email||''}"`,
      `"${(a.career_jobs?.title_en||'').replace(/"/g, '""')}"`,
      `"${(a.career_jobs?.company_name||'').replace(/"/g, '""')}"`,
      `"${a.resume_url||''}"`,
      `"${(a.notes||'').replace(/"/g, '""')}"`,
      a.status||'pending',
      a.created_at||new Date().toISOString()
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
    toast('CSV application records exported successfully!');
  }

  function exportApplicationsExcel(data) {
    if(!data.length) { toast('No application records available to export.', true); return; }
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

    await loadData();
    await refreshUser();
    
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
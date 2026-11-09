(() => {
  const $ = (s, r=document) => r.querySelector(s), $$ = (s,r=document)=>[...r.querySelectorAll(s)];
  const cfg = window.TATARI_CONFIG || {};
  let db = null, session = null, profile = null, role = 'customer', subscriptionPlan = 'free',
      products = [], courses = [], jobListings = [], freelanceProjects = [], testimonials = [],
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
    $('#langEN').classList.toggle('active', lang==='en');
    $('#langAM').classList.toggle('active', lang==='am');
    if (window.TATARI_I18N) window.TATARI_I18N.translate(document.body, lang);
    renderAllViews();
  }

  function modal(html){
    $('#modalRoot').innerHTML = `<div class="modal-backdrop" id="backdrop"><div class="modal"><button class="modal-x" id="closeModal">×</button>${html}</div></div>`;
    $('#closeModal').onclick = closeModal;
    $('#backdrop').onclick = e => { if(e.target.id==='backdrop') closeModal(); };
    if (window.TATARI_I18N) window.TATARI_I18N.translate($('#modalRoot'), currentLang);
  }
  function closeModal(){ $('#modalRoot').innerHTML = ''; }

  function authModal(mode='signin'){
    const updating = mode === 'updatepassword';
    modal(`<div class="section-label">TATARI ACCOUNT</div><h2>${mode==='signup'?'Create your account':mode==='reset'?'Reset password':updating?'Choose a new password':'Welcome back'}</h2><p class="muted">${mode==='signup'?'Register to buy resources, post jobs, upload logos, or bid on projects.':mode==='reset'?'Enter your account email to receive a reset link.':updating?'Choose a new password for your TATARI account.':'Sign in to access your portal, applications, and subscription.'}</p><form id="authForm" class="stack-form">${mode==='signup'?'<label>Full name<input name="full_name" required minlength="2"></label>':''}${mode==='reset'||mode==='signin'||mode==='signup'?'<label>Email<input name="email" type="email" required id="authEmail"></label>':''}${mode!=='reset'?`<label>${updating?'New password':'Password'}<input name="password" type="password" required minlength="8" autocomplete="new-password"></label>`:''}${updating?'<label>Confirm new password<input name="confirm_password" type="password" required minlength="8"></label>':''}<button class="btn btn-primary" type="submit">${mode==='signup'?'Create account':mode==='reset'?'Send reset link':updating?'Update password':'Sign in'}</button><p id="authFeedback" class="form-feedback"></p></form><div class="auth-switch">${mode==='signin'?'<button id="goSignup">Create an account</button><button id="goReset">Forgot password?</button>':updating?'':'<button id="goSignin">Back to sign in</button>'}</div>`);
    
    $('#authForm').onsubmit = async e => {
      e.preventDefault();
      const f = new FormData(e.currentTarget), fb = $('#authFeedback'), btn = $('button[type=submit]', e.currentTarget);
      btn.disabled = true;
      try {
        ready();
        let out;
        if(mode === 'signup') out = await db.auth.signUp({email: f.get('email').trim(), password: f.get('password'), options: {data: {full_name: f.get('full_name').trim()}}});
        else if(mode === 'reset') out = await db.auth.resetPasswordForEmail(f.get('email').trim(), {redirectTo: window.location.origin + window.location.pathname});
        else if(updating) {
          if(f.get('password') !== f.get('confirm_password')) throw Error('Passwords do not match.');
          out = await db.auth.updateUser({password: f.get('password')});
        } else out = await db.auth.signInWithPassword({email: f.get('email').trim(), password: f.get('password')});
        
        if(out.error) throw out.error;
        fb.textContent = mode==='signup'&&!out.data.session?'Account created. Check email to confirm.':mode==='reset'?'Reset email sent if account exists.':updating?'Password updated successfully.':'Signed in successfully.';
        
        if(updating) {
          await db.auth.signOut(); session = null; setTimeout(() => authModal('signin'), 1000);
        } else if(out.data?.session) {
          session = out.data.session; closeModal(); await refreshUser(); toast('Welcome to TATARI.');
          if(resumeCartAfterLogin) { resumeCartAfterLogin = false; cartModal(); }
        }
      } catch(x) {
        fb.textContent = err(x); fb.className = 'form-feedback error';
      } finally { btn.disabled = false; }
    };
    if($('#goSignup')) $('#goSignup').onclick = () => authModal('signup');
    if($('#goReset')) $('#goReset').onclick = () => authModal('reset');
    if($('#goSignin')) $('#goSignin').onclick = () => authModal('signin');
  }

  async function refreshUser() {
    if(!session || !db) {
      profile = null; role = 'customer'; subscriptionPlan = 'free';
      $('#accountBtn').hidden = false; $('#accountBtn').textContent = 'Login';
      $('#dashboardBtn').hidden = true; $('#logoutBtn').hidden = true;
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
      role = roles.includes('admin') ? 'admin' : roles.includes('content_manager') ? 'content_manager' : 'customer';
      subscriptionPlan = sub.data?.plan_tier || 'free';
      
      $('#accountBtn').hidden = true; $('#dashboardBtn').hidden = false;
      $('#dashboardBtn').textContent = role==='admin' ? 'Admin Portal' : 'My account';
      $('#logoutBtn').hidden = false; $('#logoutBtn').textContent = 'Logout';
    } catch(e) {
      console.error('Error refreshing user:', e);
    }
  }

  async function loadData() {
    if(!db) {
      $('#testimonialBannerList').innerHTML = '<div class="empty">Connect Supabase to view testimonials.</div>';
      $('#storeCatalog').innerHTML = '<div class="empty">Connect Supabase to view store items.</div>';
      $('#jobPortalList').innerHTML = '<div class="empty">Connect Supabase to view jobs.</div>';
      $('#freelanceProjectList').innerHTML = '<div class="empty">Connect Supabase to view freelance projects.</div>';
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

      renderAllViews();
    } catch(e) {
      console.error('Data load error:', e);
    }
  }

  function renderAllViews() {
    renderTestimonialBanners();
    renderJobPortal();
    renderFreelanceMarketplace();
    renderStoreCatalog();
  }

  // 1. Testimonial Banners Renderer
  function renderTestimonialBanners() {
    $('#testimonialBannerList').innerHTML = testimonials.length ? testimonials.map(t => `
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

  // Unified Filtering Engine across Job Board, Freelance, and Store
  function getGlobalFilterQuery() {
    const q = ($('#globalSearchInput').value||'').toLowerCase();
    const type = $('#globalTypeSelect').value;
    const cat = $('#globalCategoryFilter').value;
    return { q, type, cat };
  }

  // 2. Full-Time Career Job Portal Renderer (with Logo Upload Display)
  function renderJobPortal() {
    const { q, type, cat } = getGlobalFilterQuery();
    if(type !== 'all' && type !== 'career') {
      $('#jobPortalList').innerHTML = '<div class="empty">Filtered out by search selection. Select "Career Jobs" or "All Modules" above.</div>';
      return;
    }

    const filtered = jobListings.filter(x => 
      (cat==='all' || x.category===cat || x.job_type===cat) &&
      `${x.title_en} ${x.company_name||''} ${x.description_en||''} ${x.title_am||''}`.toLowerCase().includes(q)
    );

    $('#jobPortalList').innerHTML = filtered.length ? filtered.map(j => `
      <article class="resource-card job-card">
        <div class="resource-art career">
          ${j.company_logo ? `<img src="${esc(j.company_logo)}" class="company-logo-img" alt="Logo"/>` : '<span>CAREER JOB</span>'}
          <b>🏢</b>
        </div>
        <div class="resource-body">
          <span class="pill">${esc(j.job_type||'Full-Time')} · ${esc(j.location||'Addis Ababa')}</span>
          <h3>${esc(currentLang==='am'&&j.title_am ? j.title_am : j.title_en)}</h3>
          <p><b>${esc(j.company_name||'TATARI Partner')}</b> — ${esc(currentLang==='am'&&j.description_am ? j.description_am : j.description_en||'')}</p>
          <div class="resource-bottom">
            <strong>Salary: ${esc(j.salary_range||'Negotiable')}</strong>
            <button class="btn btn-outline btn-small" data-career-id="${j.id}">Apply for Job</button>
          </div>
        </div>
      </article>`).join('') : '<div class="empty">No career job vacancies match your filter parameters.</div>';

    $$('[data-career-id]').forEach(b => b.onclick = (e) => { e.preventDefault(); openCareerDetails(b.dataset.careerId); });
  }

  // 3. Upwork-Style Freelance Project Marketplace Renderer
  function renderFreelanceMarketplace() {
    const { q, type, cat } = getGlobalFilterQuery();
    if(type !== 'all' && type !== 'freelance') {
      $('#freelanceProjectList').innerHTML = '<div class="empty">Filtered out by search selection. Select "Freelance Projects" or "All Modules" above.</div>';
      return;
    }

    const filtered = freelanceProjects.filter(x => 
      (cat==='all' || x.category===cat || x.job_type===cat) &&
      `${x.title_en} ${x.category||''} ${x.description_en||''} ${x.title_am||''}`.toLowerCase().includes(q)
    );

    $('#freelanceProjectList').innerHTML = filtered.length ? filtered.map(j => `
      <article class="resource-card freelance-card">
        <div class="resource-art job">
          ${j.client_logo ? `<img src="${esc(j.client_logo)}" class="company-logo-img" alt="Logo"/>` : '<span>FREELANCE CONTRACT</span>'}
          <b>💼</b>
        </div>
        <div class="resource-body">
          <span class="pill">${esc(j.category||'General')} · ${esc(j.job_type||'Fixed-Price')}</span>
          <h3>${esc(currentLang==='am'&&j.title_am ? j.title_am : j.title_en)}</h3>
          <p>${esc(currentLang==='am'&&j.description_am ? j.description_am : j.description_en||'')}</p>
          <div class="resource-bottom">
            <strong>Budget: ${money(j.budget_min)} - ${money(j.budget_max)}</strong>
            <button class="btn btn-primary btn-small" data-freelance-id="${j.id}">Submit Proposal</button>
          </div>
        </div>
      </article>`).join('') : '<div class="empty">No freelance project contracts match your filter parameters.</div>';

    $$('[data-freelance-id]').forEach(b => b.onclick = (e) => { e.preventDefault(); openFreelanceDetails(b.dataset.freelanceId); });
  }

  // 4. Digital Store & Courses Renderer
  function renderStoreCatalog() {
    const { q, type, cat } = getGlobalFilterQuery();
    if(type !== 'all' && type !== 'store') {
      $('#storeCatalog').innerHTML = '<div class="empty">Filtered out by search selection. Select "Digital Store" or "All Modules" above.</div>';
      return;
    }

    const catalog = [
      ...products.map(x => ({...x, itemType: 'product', displayTitle: currentLang==='am'&&x.name_am ? x.name_am : x.name})),
      ...courses.map(x => ({...x, itemType: 'course', displayTitle: currentLang==='am'&&x.title_am ? x.title_am : x.title}))
    ];

    const filtered = catalog.filter(x => `${x.displayTitle} ${x.description||''}`.toLowerCase().includes(q));

    $('#storeCatalog').innerHTML = filtered.length ? filtered.map(x => `
      <article class="resource-card">
        <div class="resource-art ${x.itemType}"><span>${x.itemType==='course'?'ACADEMY':'TATARI STORE'}</span><b>✦</b></div>
        <div class="resource-body">
          <span class="pill">${x.itemType==='course'?'ONLINE COURSE':'DIGITAL PRODUCT'}</span>
          <h3>${esc(x.displayTitle)}</h3>
          <p>${esc(x.description||'Practical resource from TATARI.')}</p>
          <div class="resource-bottom">
            <strong>${(currency==='ETB'?x.price_etb:x.price_usd)==null?'Price on request':money(currency==='ETB'?x.price_etb:x.price_usd)}</strong>
            ${(currency==='ETB'?x.price_etb:x.price_usd)==null?'<span class="muted">Contact TATARI</span>':`<button class="btn btn-primary btn-small" type="button" data-add="${x.id}" data-type="${x.itemType}">Add to cart</button>`}
          </div>
        </div>
      </article>`).join('') : '<div class="empty">No digital products or courses match your search.</div>';

    $$('[data-add]').forEach(b => b.onclick = (e) => { e.preventDefault(); addCart(b.dataset.add, b.dataset.type); });
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
      return `<div class="cart-row"><div><b>${esc(p?.name||p?.title||'Resource')}</b><small>${x.type==='course'?'Course':'Digital product'}</small></div><div class="qty"><button data-minus="${x.id}">−</button>${x.quantity}<button data-plus="${x.id}">+</button></div><strong>${money((currency==='ETB'?p?.price_etb:p?.price_usd)*x.quantity)}</strong><button class="remove" data-remove="${x.id}">×</button></div>`;
    }).join('');
    
    modal(`<div class="section-label">YOUR SELECTION</div><h2>Your cart</h2><div class="cart-list">${rows}</div><div class="cart-total"><span>Currency</span><select id="cartCurrency"><option value="ETB" ${currency==='ETB'?'selected':''}>ETB</option><option value="USD" ${currency==='USD'?'selected':''}>USD</option></select><b>Total: ${money(cart.reduce((s,x)=>{const p=(x.type==='course'?courses:products).find(y=>y.id===x.id);return s+(currency==='ETB'?p?.price_etb||0:p?.price_usd||0)*x.quantity},0))}</b></div><label>Order note (optional)<textarea id="orderNote" rows="2"></textarea></label><button class="btn btn-primary full-btn" id="checkoutBtn">Continue to payment instructions</button>`);
    
    $('#cartCurrency').onchange = e => { currency = e.target.value; closeModal(); cartModal(); };
    $$('[data-minus]').forEach(b => b.onclick = () => { const x=cart.find(i=>i.id===b.dataset.minus); x.quantity=Math.max(1,x.quantity-1); saveCart(); updateCartCount(); closeModal(); cartModal(); });
    $$('[data-plus]').forEach(b => b.onclick = () => { const x=cart.find(i=>i.id===b.dataset.plus); x.quantity=Math.min(20,x.quantity+1); saveCart(); updateCartCount(); closeModal(); cartModal(); });
    $$('[data-remove]').forEach(b => b.onclick = () => { cart = cart.filter(i=>i.id!==b.dataset.remove); saveCart(); updateCartCount(); closeModal(); cartModal(); });
    $('#checkoutBtn').onclick = checkout;
  }

  async function checkout() {
    try {
      ready();
      if(!session) { resumeCartAfterLogin = true; closeModal(); authModal('signin'); toast('Please sign in to continue.'); return; }
      const btn = $('#checkoutBtn'); btn.disabled = true; btn.textContent = 'Creating secure order…';
      const { data, error } = await db.rpc('create_customer_order', {
        p_currency: currency,
        p_items: cart.map(x => ({id: x.id, type: x.type, quantity: x.quantity})),
        p_customer_note: $('#orderNote').value
      });
      if(error) throw error;
      const order = data?.[0]; if(!order) throw Error('Order creation failed.');
      cart = []; saveCart(); updateCartCount();
      await paymentModal(order.order_id, order.order_number, order.total, currency);
    } catch(e) {
      toast(err(e), true);
      if($('#checkoutBtn')) { $('#checkoutBtn').disabled = false; $('#checkoutBtn').textContent = 'Continue to payment instructions'; }
    }
  }

  async function paymentModal(orderId, number, total, curr) {
    let settings = {};
    const { data } = await db.from('site_settings').select('value').eq('key', 'payment_instructions').maybeSingle();
    settings = data?.value || {};
    modal(`<div class="section-label">MANUAL PAYMENT · ${esc(number)}</div><h2>Complete your payment</h2><p>Transfer exact amount via Telebirr details below.</p><div class="payment-box"><small>AMOUNT TO PAY</small><strong>${money(total,curr)}</strong><div><span>Telebirr number</span><b>${esc(settings.telebirr_number||'Not configured yet')}</b></div><div><span>Account name</span><b>${esc(settings.account_name||'Not configured yet')}</b></div></div><form id="paymentForm" class="stack-form"><label>Transaction reference<input name="reference" required maxlength="100"></label><div class="form-grid"><label>Amount paid<input name="amount" type="number" min="0.01" step="0.01" value="${Number(total).toFixed(2)}" required></label><label>Currency<select name="currency"><option ${curr==='ETB'?'selected':''}>ETB</option><option ${curr==='USD'?'selected':''}>USD</option></select></label></div><label>Payment date<input name="payment_date" type="date" value="${new Date().toISOString().slice(0,10)}" required></label><button class="btn btn-primary" type="submit">Submit payment for verification</button><p id="paymentFeedback" class="form-feedback"></p></form>`);
    
    $('#paymentForm').onsubmit = async e => {
      e.preventDefault(); const f = e.currentTarget, fd = new FormData(f), fb = $('#paymentFeedback'), btn = $('button[type=submit]', f);
      btn.disabled = true;
      try {
        const ins = await db.from('payment_submissions').insert({
          order_id: orderId, customer_id: session.user.id, transaction_reference: fd.get('reference').trim(),
          amount: Number(fd.get('amount')), currency: fd.get('currency'), payment_date: fd.get('payment_date'), status: 'submitted'
        });
        if(ins.error) throw ins.error;
        fb.textContent = 'Payment details submitted. Order pending verification.';
        toast('Payment submitted.'); setTimeout(() => { closeModal(); accountModal(); }, 1200);
      } catch(x) { fb.textContent = err(x); fb.className = 'form-feedback error'; btn.disabled = false; }
    };
  }

  // Handle Logo Upload Helper
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

  // Full-time Career Job Posting Modal (with Logo Upload, Subscription Check, & Admin Bypass)
  function postCareerJobModal() {
    if(!session) { toast('Please sign in to post a career job.', true); authModal('signin'); return; }
    
    const isAdmin = role === 'admin';
    const isSubscribed = subscriptionPlan === 'pro' || subscriptionPlan === 'enterprise';

    if(!isAdmin && !isSubscribed) {
      toast('Employer subscription required for company logo vacancy postings.', true);
      window.location.hash = '#plans-pricing';
      return;
    }

    modal(`
      <div class="section-label">${isAdmin ? 'ADMIN VACANCY POSTING' : 'EMPLOYER VACANCY POSTING'}</div>
      <h2>Create Full-Time / Remote Job Listing</h2>
      ${isAdmin ? '<p class="admin-badge">⚡ Admin Mode: Direct posting enabled</p>' : `<p class="muted">Active Plan: <b>${subscriptionPlan.toUpperCase()}</b></p>`}
      <form id="createCareerForm" class="stack-form">
        <label>Job Title (English)<input name="title_en" required></label>
        <label>Job Title (Amharic)<input name="title_am"></label>
        <label>Company Name<input name="company_name" required></label>
        <label>Company Logo Image (Optional)<input name="logo_file" type="file" accept="image/*"></label>
        <div class="form-grid">
          <label>Job Category<select name="category"><option>HR & Analytics</option><option>Software & Tech</option><option>Finance & Management</option><option>Design & Creative</option></select></label>
          <label>Job Type<select name="job_type"><option>Full-Time</option><option>Remote</option><option>Hybrid</option><option>Contract</option></select></label>
        </div>
        <label>Location<input name="location" placeholder="e.g. Addis Ababa or Remote" required></label>
        <label>Salary Range (optional)<input name="salary_range" placeholder="e.g. 25,000 - 45,000 ETB/mo"></label>
        <label>Job Description (English)<textarea name="description_en" rows="3" required></textarea></label>
        <label>Job Description (Amharic)<textarea name="description_am" rows="3"></textarea></label>
        <button class="btn btn-primary" type="submit">Publish Vacancy</button>
      </form>
    `);

    $('#createCareerForm').onsubmit = async e => {
      e.preventDefault();
      const btn = e.currentTarget.querySelector('button[type=submit]');
      btn.disabled = true; btn.textContent = 'Uploading logo & publishing…';
      try {
        ready();
        const fd = new FormData(e.currentTarget);
        const logoFile = fd.get('logo_file');
        let logoUrl = null;
        if(logoFile && logoFile.size) {
          logoUrl = await uploadImageFile(logoFile, 'public-logos', session.user.id);
        }

        const { error } = await db.from('career_jobs').insert({
          recruiter_id: session.user.id, title_en: fd.get('title_en').trim(), title_am: fd.get('title_am').trim() || null,
          company_name: fd.get('company_name').trim(), company_logo: logoUrl, category: fd.get('category'), job_type: fd.get('job_type'),
          location: fd.get('location').trim(), salary_range: fd.get('salary_range').trim() || null,
          description_en: fd.get('description_en').trim(), description_am: fd.get('description_am').trim() || null
        });
        if(error) throw error;
        toast('Career vacancy published successfully.'); closeModal(); await loadData();
      } catch(err) { toast(err.message, true); btn.disabled = false; }
    };
  }

  // Upwork-Style Freelance Project Posting Modal (with Logo Upload & Subscription / Admin Check)
  function postFreelanceProjectModal() {
    if(!session) { toast('Please sign in to post a freelance contract.', true); authModal('signin'); return; }

    const isAdmin = role === 'admin';
    const isSubscribed = subscriptionPlan === 'pro' || subscriptionPlan === 'enterprise';

    if(!isAdmin && !isSubscribed) {
      toast('Employer subscription required for freelance contract postings.', true);
      window.location.hash = '#plans-pricing';
      return;
    }

    modal(`
      <div class="section-label">${isAdmin ? 'ADMIN FREELANCE POSTING' : 'CLIENT CONTRACT POSTING'}</div>
      <h2>Create Freelance Contract Listing</h2>
      ${isAdmin ? '<p class="admin-badge">⚡ Admin Mode: Direct posting enabled</p>' : `<p class="muted">Active Plan: <b>${subscriptionPlan.toUpperCase()}</b></p>`}
      <form id="createFreelanceForm" class="stack-form">
        <label>Project Title (English)<input name="title_en" required></label>
        <label>Project Title (Amharic)<input name="title_am"></label>
        <label>Company / Client Logo Image (Optional)<input name="logo_file" type="file" accept="image/*"></label>
        <label>Category / Skills Required<select name="category"><option>HR & Analytics</option><option>Software & Tech</option><option>Finance & Management</option><option>Design & Creative</option></select></label>
        <div class="form-grid">
          <label>Project Budget Min<input name="budget_min" type="number" step="0.01" required></label>
          <label>Project Budget Max<input name="budget_max" type="number" step="0.01" required></label>
        </div>
        <label>Project Description (English)<textarea name="description_en" rows="3" required></textarea></label>
        <label>Project Description (Amharic)<textarea name="description_am" rows="3"></textarea></label>
        <button class="btn btn-primary" type="submit">Publish Contract</button>
      </form>
    `);

    $('#createFreelanceForm').onsubmit = async e => {
      e.preventDefault();
      const btn = e.currentTarget.querySelector('button[type=submit]');
      btn.disabled = true; btn.textContent = 'Uploading logo & publishing…';
      try {
        ready();
        const fd = new FormData(e.currentTarget);
        const logoFile = fd.get('logo_file');
        let logoUrl = null;
        if(logoFile && logoFile.size) {
          logoUrl = await uploadImageFile(logoFile, 'public-logos', session.user.id);
        }

        const { error } = await db.from('jobs').insert({
          client_id: session.user.id, title_en: fd.get('title_en').trim(), title_am: fd.get('title_am').trim() || null,
          client_logo: logoUrl, category: fd.get('category'), budget_min: Number(fd.get('budget_min')), budget_max: Number(fd.get('budget_max')),
          description_en: fd.get('description_en').trim(), description_am: fd.get('description_am').trim() || null
        });
        if(error) throw error;
        toast('Freelance project contract published.'); closeModal(); await loadData();
      } catch(err) { toast(err.message, true); btn.disabled = false; }
    };
  }

  // Add Testimonial Banner Modal (with Avatar Image Upload)
  function addTestimonialModal() {
    if(!session) { toast('Please sign in to add a testimonial.', true); authModal('signin'); return; }
    modal(`
      <div class="section-label">ADD TESTIMONIAL</div>
      <h2>Share Your Success Story</h2>
      <form id="testimonialForm" class="stack-form">
        <label>Your Full Name<input name="author_name" value="${esc(profile?.full_name||'')}" required></label>
        <label>Company / Title<input name="company_title" placeholder="e.g. HR Manager at TechCorp" required></label>
        <label>Profile Avatar Photo (Optional)<input name="avatar_file" type="file" accept="image/*"></label>
        <label>Your Testimonial Review<textarea name="content" rows="4" required></textarea></label>
        <button class="btn btn-primary" type="submit">Submit Testimonial</button>
      </form>
    `);

    $('#testimonialForm').onsubmit = async e => {
      e.preventDefault();
      const btn = e.currentTarget.querySelector('button[type=submit]');
      btn.disabled = true;
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
      } catch(err) { toast(err.message, true); btn.disabled = false; }
    };
  }

  // Subscription Plan Selection Handler
  async function selectSubscriptionPlan(planTier) {
    if(!session) { toast('Please sign in to choose a subscription plan.', true); authModal('signin'); return; }
    try {
      ready();
      const { error } = await db.from('subscriptions').upsert({
        user_id: session.user.id, plan_tier: planTier, status: 'active', updated_at: new Date()
      });
      if(error) throw error;
      subscriptionPlan = planTier;
      toast(`Successfully subscribed to ${planTier.toUpperCase()} Employer Plan!`);
      await refreshUser();
    } catch(err) { toast(err.message, true); }
  }

  // Full-time Job Details Modal
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
        <label>Cover Letter / Notes<textarea name="notes" rows="4" required></textarea></label>
        <button class="btn btn-primary" type="submit">Submit Application</button>
      </form>
    `);

    $('#jobAppForm').onsubmit = async e => {
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

  // Upwork-style Freelance Project Details Modal
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

    $('#proposalForm').onsubmit = async e => {
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

  async function accountModal() {
    if(!session) { authModal(); return; }
    try {
      const [orders, myJobs, myProposals, myCareers] = await Promise.all([
        db.from('orders').select('*').eq('customer_id', session.user.id).order('created_at', {ascending: false}),
        db.from('jobs').select('*').eq('client_id', session.user.id).order('created_at', {ascending: false}),
        db.from('proposals').select('*, jobs(title_en)').eq('freelancer_id', session.user.id).order('created_at', {ascending: false}),
        db.from('career_jobs').select('*').eq('recruiter_id', session.user.id).order('created_at', {ascending: false})
      ]);
      modal(`
        <div class="section-label">${role==='admin'?'ADMIN CONTROL PORTAL':'EMPLOYER & USER PORTAL'}</div>
        <h2>Hello, ${esc(profile?.full_name || session.user.email)}</h2>
        <p class="muted">Active Subscription: <span class="status approved">${subscriptionPlan.toUpperCase()}</span> ${role==='admin'?' (Admin Rights Active)':''}</p>
        <div class="portal-tabs">
          <button class="active" data-tab="orders">Orders (${orders.data?.length||0})</button>
          <button data-tab="freelance">Freelance Contracts (${myJobs.data?.length||0})</button>
          <button data-tab="proposals">Proposals (${myProposals.data?.length||0})</button>
          <button data-tab="careers">Posted Vacancies (${myCareers.data?.length||0})</button>
        </div>
        <div id="portalContent">${ordersHTML(orders.data||[])}</div>
        <div class="portal-foot"><span>${esc(session.user.email)}</span><button id="signOut" class="btn btn-outline btn-small">Logout</button></div>
      `);
      
      const tabs = $$('[data-tab]');
      tabs.forEach(t => t.onclick = () => {
        tabs.forEach(x => x.classList.toggle('active', x===t));
        const c = $('#portalContent');
        if(t.dataset.tab === 'orders') c.innerHTML = ordersHTML(orders.data||[]);
        if(t.dataset.tab === 'freelance') c.innerHTML = (myJobs.data||[]).map(j => `<div class="order-card"><div><b>${esc(j.title_en)}</b><small>Status: ${esc(j.status)}</small></div></div>`).join('') || '<div class="empty">No freelance contracts posted.</div>';
        if(t.dataset.tab === 'proposals') c.innerHTML = (myProposals.data||[]).map(p => `<div class="order-card"><div><b>${esc(p.jobs?.title_en||'Project')}</b><small>Bid: ${money(p.bid_amount)} · Status: ${esc(p.status)}</small></div></div>`).join('') || '<div class="empty">No proposals submitted.</div>';
        if(t.dataset.tab === 'careers') c.innerHTML = (myCareers.data||[]).map(j => `<div class="order-card"><div><b>${esc(j.title_en)}</b><small>Company: ${esc(j.company_name)} · Status: ${esc(j.status)}</small></div></div>`).join('') || '<div class="empty">No career vacancies posted.</div>';
      });
      $('#signOut').onclick = async () => { await db.auth.signOut(); session = null; await refreshUser(); closeModal(); toast('Signed out.'); };
    } catch(e) { toast(err(e), true); }
  }

  function ordersHTML(rows) {
    return rows.length ? rows.map(o => `<div class="order-card"><div><b>${esc(o.order_number)}</b><small>${fmt(o.created_at)}</small></div><div><b>${money(o.subtotal, o.currency)}</b><span class="status ${o.status}">${esc(o.status)}</span></div></div>`).join('') : '<div class="empty">No orders yet.</div>';
  }

  async function submitInquiry(e) {
    e.preventDefault(); const f = e.currentTarget, fd = new FormData(f), fb = $('#inquiryFeedback');
    try {
      ready();
      const { error } = await db.from('inquiries').insert({
        customer_id: session?.user?.id || null, name: fd.get('name').trim(), email: fd.get('email').trim(), phone: fd.get('phone').trim() || null, service: fd.get('service'), message: fd.get('message').trim()
      });
      if(error) throw error;
      f.reset(); fb.textContent = 'Thank you. Your inquiry has been sent to TATARI.'; toast('Inquiry sent successfully.');
    } catch(e) { fb.textContent = err(e); fb.className = 'form-feedback error'; }
  }

  async function init() {
    $('#year').textContent = new Date().getFullYear();
    $('#mobileMenu').onclick = () => $('#nav').classList.toggle('open');
    $('#accountBtn').onclick = () => authModal();
    $('#dashboardBtn').onclick = () => accountModal();
    $('#logoutBtn').onclick = async () => { await db.auth.signOut(); session = null; await refreshUser(); toast('Signed out.'); };
    $('#langEN').onclick = () => setLanguage('en');
    $('#langAM').onclick = () => setLanguage('am');
    
    $('#addTestimonialBtn').onclick = () => addTestimonialModal();
    $('#postFullTimeJobBtn').onclick = () => postCareerJobModal();
    $('#postFreelanceProjectBtn').onclick = () => postFreelanceProjectModal();

    $$('[data-plan]').forEach(b => b.onclick = () => selectSubscriptionPlan(b.dataset.plan));

    $('#globalSearchInput').oninput = renderAllViews;
    $('#globalTypeSelect').onchange = renderAllViews;
    $('#globalCategoryFilter').onchange = renderAllViews;

    $('#inquiryForm').onsubmit = submitInquiry;

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

  document.addEventListener('DOMContentLoaded', init);
})();
(() => {
  const $ = (s, r=document) => r.querySelector(s), $$ = (s,r=document)=>[...r.querySelectorAll(s)];
  const cfg = window.TATARI_CONFIG || {};
  let db = null, session = null, profile = null, role = 'customer', catalog = [], jobs = [], cart = loadSavedCart(), currency = 'ETB', currentLang = 'en', recoveryModalOpened = false, resumeCartAfterLogin = false;

  function loadSavedCart(){ try{ const value = JSON.parse(localStorage.getItem('tatari_cart_v1')||'[]'); return Array.isArray(value)?value.filter(x=>x&&typeof x.id==='string'&&['product','course'].includes(x.type)&&Number.isInteger(x.quantity)&&x.quantity>=1&&x.quantity<=20):[]; }catch(_){ return []; } }
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
  const ready = () => { if(!db) throw Error('Connect Supabase first: add publishableKey in supabase-config.js.'); };

  function setLanguage(lang) {
    currentLang = lang;
    $('#langEN').classList.toggle('active', lang==='en');
    $('#langAM').classList.toggle('active', lang==='am');
    if (window.TATARI_I18N) window.TATARI_I18N.translate(document.body, lang);
    renderCatalog();
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
    modal(`<div class="section-label">TATARI ACCOUNT</div><h2>${mode==='signup'?'Create your account':mode==='reset'?'Reset password':updating?'Choose a new password':'Welcome back'}</h2><p class="muted">${mode==='signup'?'Register to purchase resources, access courses and post jobs.':mode==='reset'?'Enter your account email to receive a reset link.':updating?'Choose a new password for your TATARI account.':'Sign in to access your purchases, learning, and freelance proposals.'}</p><form id="authForm" class="stack-form">${mode==='signup'?'<label>Full name<input name="full_name" required minlength="2"></label>':''}${mode==='reset'||mode==='signin'||mode==='signup'?'<label>Email<input name="email" type="email" required id="authEmail"></label>':''}${mode!=='reset'?`<label>${updating?'New password':'Password'}<input name="password" type="password" required minlength="8" autocomplete="new-password"></label>`:''}${updating?'<label>Confirm new password<input name="confirm_password" type="password" required minlength="8"></label>':''}<button class="btn btn-primary" type="submit">${mode==='signup'?'Create account':mode==='reset'?'Send reset link':updating?'Update password':'Sign in'}</button><p id="authFeedback" class="form-feedback"></p></form><div class="auth-switch">${mode==='signin'?'<button id="goSignup">Create an account</button><button id="goReset">Forgot password?</button>':updating?'':'<button id="goSignin">Back to sign in</button>'}</div>`);
    
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
      profile = null; role = 'customer';
      $('#accountBtn').hidden = false; $('#accountBtn').textContent = 'Login';
      $('#dashboardBtn').hidden = true; $('#logoutBtn').hidden = true;
      return;
    }
    try {
      const [pr, rr] = await Promise.all([
        db.from('profiles').select('*').eq('id', session.user.id).maybeSingle(),
        db.from('user_roles').select('role').eq('user_id', session.user.id)
      ]);
      profile = pr.data || null;
      const roles = (rr.data || []).map(x => x.role);
      role = roles.includes('admin') ? 'admin' : roles.includes('content_manager') ? 'content_manager' : 'customer';
      $('#accountBtn').hidden = true; $('#dashboardBtn').hidden = false;
      $('#dashboardBtn').textContent = 'My account'; $('#logoutBtn').hidden = false; $('#logoutBtn').textContent = 'Logout';
    } catch(e) {
      console.error('Error refreshing user:', e);
    }
  }

  async function loadData() {
    if(!db) {
      $('#catalog').innerHTML = '<div class="empty">Connect Supabase to view live marketplace items and freelance jobs.</div>';
      return;
    }
    try {
      const [p, c, j] = await Promise.all([
        db.from('products').select('*').eq('is_published', true).order('created_at', {ascending: false}),
        db.from('courses').select('*').eq('is_published', true).order('created_at', {ascending: false}),
        db.from('jobs').select('*').eq('status', 'open').order('created_at', {ascending: false})
      ]);
      catalog = [
        ...(p.data||[]).map(x => ({...x, type: 'product', title: x.name, displayTitle: currentLang==='am'&&x.name_am ? x.name_am : x.name})),
        ...(c.data||[]).map(x => ({...x, type: 'course', title: x.title, displayTitle: currentLang==='am'&&x.title_am ? x.title_am : x.title}))
      ];
      jobs = j.data || [];
      renderCatalog();
    } catch(e) {
      $('#catalog').innerHTML = `<div class="empty">Unable to load marketplace data: ${esc(err(e))}</div>`;
    }
  }

  function renderCatalog() {
    const q = ($('#catalogSearch').value||'').toLowerCase();
    const type = $('#catalogType').value;
    let html = '';

    if(type === 'all' || type === 'products' || type === 'courses') {
      const rows = catalog.filter(x => (type==='all' || type===x.type+'s') && `${x.displayTitle} ${x.description||''}`.toLowerCase().includes(q));
      html += rows.map(x => `
        <article class="resource-card">
          <div class="resource-art ${x.type}"><span>${x.type==='course'?'ACADEMY':'TATARI'}</span><b>✦</b></div>
          <div class="resource-body">
            <span class="pill">${x.type==='course'?'ONLINE COURSE':'DIGITAL RESOURCE'}</span>
            <h3>${esc(x.displayTitle)}</h3>
            <p>${esc(x.description||'Practical resource from TATARI.')}</p>
            <div class="resource-bottom">
              <strong>${(currency==='ETB'?x.price_etb:x.price_usd)==null?'Price on request':money(currency==='ETB'?x.price_etb:x.price_usd)}</strong>
              ${(currency==='ETB'?x.price_etb:x.price_usd)==null?'<span class="muted">Contact TATARI</span>':`<button class="btn btn-primary btn-small" type="button" data-add="${x.id}" data-type="${x.type}">Add to cart</button>`}
            </div>
          </div>
        </article>`).join('');
    }

    if(type === 'all' || type === 'jobs') {
      const filteredJobs = jobs.filter(x => `${x.title_en} ${x.description_en||''} ${x.title_am||''}`.toLowerCase().includes(q));
      html += filteredJobs.map(j => `
        <article class="resource-card job-card">
          <div class="resource-art job"><span>FREELANCE JOB</span><b>💼</b></div>
          <div class="resource-body">
            <span class="pill">${esc(j.category||'General')}</span>
            <h3>${esc(currentLang==='am'&&j.title_am ? j.title_am : j.title_en)}</h3>
            <p>${esc(currentLang==='am'&&j.description_am ? j.description_am : j.description_en||'')}</p>
            <div class="resource-bottom">
              <strong>Est: ${money(j.budget_min)} - ${money(j.budget_max)}</strong>
              <button class="btn btn-outline btn-small" data-job-id="${j.id}">View & Apply</button>
            </div>
          </div>
        </article>`).join('');
    }

    $('#catalog').innerHTML = html || '<div class="empty">No products, courses, or job listings available yet.</div>';
    bindEvents();
  }

  function bindEvents() {
    $$('[data-add]').forEach(b => b.onclick = (e) => { e.preventDefault(); addCart(b.dataset.add, b.dataset.type); });
    $$('[data-job-id]').forEach(b => b.onclick = (e) => { e.preventDefault(); openJobDetails(b.dataset.jobId); });
  }

  function addCart(id, type) {
    const item = catalog.find(x => String(x.id)===String(id) && x.type===type);
    if(!item) return;
    const old = cart.find(x => String(x.id)===String(id) && x.type===type);
    if(old) old.quantity = Math.min(20, old.quantity + 1);
    else cart.push({id: item.id, type, quantity: 1});
    saveCart(); updateCartCount();
    toast(`${item.displayTitle} added to cart.`);
  }

  function cartModal() {
    if(!cart.length){ toast('Your cart is empty.'); return; }
    const rows = cart.map(x => {
      const p = catalog.find(y => y.id === x.id);
      return `<div class="cart-row"><div><b>${esc(p?.displayTitle||'Resource')}</b><small>${x.type==='course'?'Course':'Digital product'}</small></div><div class="qty"><button data-minus="${x.id}">−</button>${x.quantity}<button data-plus="${x.id}">+</button></div><strong>${money((currency==='ETB'?p?.price_etb:p?.price_usd)*x.quantity)}</strong><button class="remove" data-remove="${x.id}">×</button></div>`;
    }).join('');
    
    modal(`<div class="section-label">YOUR SELECTION</div><h2>Your cart</h2><div class="cart-list">${rows}</div><div class="cart-total"><span>Currency</span><select id="cartCurrency"><option value="ETB" ${currency==='ETB'?'selected':''}>ETB</option><option value="USD" ${currency==='USD'?'selected':''}>USD</option></select><b>Total: ${money(cart.reduce((s,x)=>{const p=catalog.find(y=>y.id===x.id);return s+(currency==='ETB'?p?.price_etb||0:p?.price_usd||0)*x.quantity},0))}</b></div><label>Order note (optional)<textarea id="orderNote" rows="2"></textarea></label><button class="btn btn-primary full-btn" id="checkoutBtn">Continue to payment instructions</button>`);
    
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
    modal(`<div class="section-label">MANUAL PAYMENT · ${esc(number)}</div><h2>Complete your payment</h2><p>Transfer the exact amount using official Telebirr details. Submit your reference below.</p><div class="payment-box"><small>AMOUNT TO PAY</small><strong>${money(total,curr)}</strong><div><span>Telebirr number</span><b>${esc(settings.telebirr_number||'Not configured yet')}</b></div><div><span>Account name</span><b>${esc(settings.account_name||'Not configured yet')}</b></div></div><form id="paymentForm" class="stack-form"><label>Transaction reference<input name="reference" required maxlength="100"></label><div class="form-grid"><label>Amount paid<input name="amount" type="number" min="0.01" step="0.01" value="${Number(total).toFixed(2)}" required></label><label>Currency<select name="currency"><option ${curr==='ETB'?'selected':''}>ETB</option><option ${curr==='USD'?'selected':''}>USD</option></select></label></div><label>Payment date<input name="payment_date" type="date" value="${new Date().toISOString().slice(0,10)}" required></label><button class="btn btn-primary" type="submit">Submit payment for verification</button><p id="paymentFeedback" class="form-feedback"></p></form>`);
    
    $('#paymentForm').onsubmit = async e => {
      e.preventDefault(); const f = e.currentTarget, fd = new FormData(f), fb = $('#paymentFeedback'), btn = $('button[type=submit]', f);
      btn.disabled = true;
      try {
        const ins = await db.from('payment_submissions').insert({
          order_id: orderId, customer_id: session.user.id, transaction_reference: fd.get('reference').trim(),
          amount: Number(fd.get('amount')), currency: fd.get('currency'), payment_date: fd.get('payment_date'), status: 'submitted'
        });
        if(ins.error) throw ins.error;
        fb.textContent = 'Payment details submitted. Your order will be verified soon.';
        toast('Payment submitted.'); setTimeout(() => { closeModal(); accountModal(); }, 1200);
      } catch(x) { fb.textContent = err(x); fb.className = 'form-feedback error'; btn.disabled = false; }
    };
  }

  async function openJobDetails(jobId) {
    const job = jobs.find(j => String(j.id) === String(jobId));
    if(!job) return;
    modal(`
      <div class="section-label">FREELANCE OPPORTUNITY</div>
      <h2>${esc(currentLang==='am'&&job.title_am ? job.title_am : job.title_en)}</h2>
      <p class="muted">Category: ${esc(job.category)} | Budget: ${money(job.budget_min)} - ${money(job.budget_max)} (${esc(job.currency)})</p>
      <div class="job-description-box"><p>${esc(currentLang==='am'&&job.description_am ? job.description_am : job.description_en)}</p></div>
      <hr>
      <h3>Submit Proposal</h3>
      <form id="proposalForm" class="stack-form">
        <label>Proposed Bid Rate (${job.currency})<input name="bid_amount" type="number" step="0.01" required></label>
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
          job_id: job.id, freelancer_id: session.user.id, bid_amount: Number(fd.get('bid_amount')),
          delivery_days: Number(fd.get('delivery_days')), cover_letter: fd.get('cover_letter').trim()
        });
        if(error) throw error;
        toast('Proposal submitted successfully!'); closeModal();
      } catch(err) { toast(err.message, true); }
    };
  }

  function postJobModal() {
    if(!session) { toast('Please sign in to post a job.', true); authModal('signin'); return; }
    modal(`
      <div class="section-label">POST A FREELANCE JOB</div>
      <h2>Create Job Listing</h2>
      <form id="createJobForm" class="stack-form">
        <label>Job Title (English)<input name="title_en" required></label>
        <label>Job Title (Amharic)<input name="title_am"></label>
        <label>Category<input name="category" placeholder="e.g., HR Analytics, Web Dev" required></label>
        <div class="form-grid">
          <label>Budget Min<input name="budget_min" type="number" step="0.01" required></label>
          <label>Budget Max<input name="budget_max" type="number" step="0.01" required></label>
        </div>
        <label>Description (English)<textarea name="description_en" rows="3" required></textarea></label>
        <label>Description (Amharic)<textarea name="description_am" rows="3"></textarea></label>
        <button class="btn btn-primary" type="submit">Publish Job</button>
      </form>
    `);

    $('#createJobForm').onsubmit = async e => {
      e.preventDefault();
      try {
        ready();
        const fd = new FormData(e.currentTarget);
        const { error } = await db.from('jobs').insert({
          client_id: session.user.id, title_en: fd.get('title_en').trim(), title_am: fd.get('title_am').trim() || null,
          category: fd.get('category').trim(), budget_min: Number(fd.get('budget_min')), budget_max: Number(fd.get('budget_max')),
          description_en: fd.get('description_en').trim(), description_am: fd.get('description_am').trim() || null
        });
        if(error) throw error;
        toast('Job posted successfully.'); closeModal(); await loadData();
      } catch(err) { toast(err.message, true); }
    };
  }

  async function accountModal() {
    if(!session) { authModal(); return; }
    try {
      const [orders, myJobs, myProposals] = await Promise.all([
        db.from('orders').select('*').eq('customer_id', session.user.id).order('created_at', {ascending: false}),
        db.from('jobs').select('*').eq('client_id', session.user.id).order('created_at', {ascending: false}),
        db.from('proposals').select('*, jobs(title_en)').eq('freelancer_id', session.user.id).order('created_at', {ascending: false})
      ]);
      modal(`
        <div class="section-label">CUSTOMER PORTAL</div>
        <h2>Hello, ${esc(profile?.full_name || session.user.email)}</h2>
        <div class="portal-tabs">
          <button class="active" data-tab="orders">Orders (${orders.data?.length||0})</button>
          <button data-tab="jobs">Posted Jobs (${myJobs.data?.length||0})</button>
          <button data-tab="proposals">Submitted Proposals (${myProposals.data?.length||0})</button>
        </div>
        <div id="portalContent">${ordersHTML(orders.data||[])}</div>
        <div class="portal-foot"><span>${esc(session.user.email)}</span><button id="signOut" class="btn btn-outline btn-small">Logout</button></div>
      `);
      
      const tabs = $$('[data-tab]');
      tabs.forEach(t => t.onclick = () => {
        tabs.forEach(x => x.classList.toggle('active', x===t));
        const c = $('#portalContent');
        if(t.dataset.tab === 'orders') c.innerHTML = ordersHTML(orders.data||[]);
        if(t.dataset.tab === 'jobs') c.innerHTML = (myJobs.data||[]).map(j => `<div class="order-card"><div><b>${esc(j.title_en)}</b><small>Status: ${esc(j.status)}</small></div></div>`).join('') || '<div class="empty">No posted jobs.</div>';
        if(t.dataset.tab === 'proposals') c.innerHTML = (myProposals.data||[]).map(p => `<div class="order-card"><div><b>${esc(p.jobs?.title_en||'Job')}</b><small>Bid: ${money(p.bid_amount)} · Status: ${esc(p.status)}</small></div></div>`).join('') || '<div class="empty">No proposals submitted.</div>';
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
    $('#postJobBtn').onclick = () => postJobModal();
    $('#catalogSearch').oninput = renderCatalog;
    $('#catalogType').onchange = renderCatalog;
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
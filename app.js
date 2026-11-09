(() => {
  const $ = (s, r=document) => r.querySelector(s), $$ = (s,r=document)=>[...r.querySelectorAll(s)];
  const cfg = window.TATARI_CONFIG || {};
  let db = null, session = null, profile = null, role = 'customer', catalog = [], jobs = [], cart = loadSavedCart(), currency = 'ETB', currentLang = 'en';

  function loadSavedCart(){ try{ return JSON.parse(localStorage.getItem('tatari_cart_v1')||'[]'); }catch(_){ return []; } }
  function saveCart(){ try{ localStorage.setItem('tatari_cart_v1', JSON.stringify(cart)); }catch(e){ console.warn('Cart save error:', e); } }
  function updateCartCount(){ const b=$('#cartFab'); if(b) b.innerHTML=`Cart (${cart.reduce((n,x)=>n+x.quantity,0)}) <span>▣</span>`; }
  
  const toast = (msg, bad=false) => {
    const el=$('#toast'); el.textContent=msg; el.className=bad?'show bad':'show';
    clearTimeout(toast.t); toast.t=setTimeout(()=>el.className='', 4200);
  };
  const esc = s => String(s??'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = (n, c=currency) => `${c==='ETB'?'ETB':'$'} ${Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  const fmt = d => new Date(d).toLocaleString(currentLang==='am'?'am-ET':'en-ET');
  const ready = () => { if(!db) throw Error('Supabase client uninitialized.'); };

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

  async function loadData() {
    if(!db) return;
    try {
      const [p, c, j] = await Promise.all([
        db.from('products').select('*').eq('is_published', true).order('created_at', {ascending: false}),
        db.from('courses').select('*').eq('is_published', true).order('created_at', {ascending: false}),
        db.from('jobs').select('*').eq('status', 'open').order('created_at', {ascending: false})
      ]);
      catalog = [
        ...(p.data||[]).map(x=>({...x, type:'product', displayTitle: currentLang==='am' && x.name_am ? x.name_am : x.name})),
        ...(c.data||[]).map(x=>({...x, type:'course', displayTitle: currentLang==='am' && x.title_am ? x.title_am : x.title}))
      ];
      jobs = j.data || [];
      renderCatalog();
    } catch(e) {
      console.error('Data loading error:', e);
    }
  }

  function renderCatalog() {
    const q = ($('#catalogSearch').value||'').toLowerCase();
    const type = $('#catalogType').value;

    let html = '';
    if(type === 'all' || type === 'products' || type === 'courses') {
      const filteredCat = catalog.filter(x => (type==='all' || type===x.type+'s') && `${x.displayTitle} ${x.description||''}`.toLowerCase().includes(q));
      html += filteredCat.map(x => `
        <article class="resource-card">
          <div class="resource-art ${x.type}"><span>${x.type==='course'?'ACADEMY':'TATARI'}</span><b>✦</b></div>
          <div class="resource-body">
            <span class="pill">${x.type==='course'?'ONLINE COURSE':'DIGITAL RESOURCE'}</span>
            <h3>${esc(x.displayTitle)}</h3>
            <p>${esc(x.description||'')}</p>
            <div class="resource-bottom">
              <strong>${money(currency==='ETB'?x.price_etb:x.price_usd)}</strong>
              <button class="btn btn-primary btn-small" data-add="${x.id}" data-type="${x.type}">Add to cart</button>
            </div>
          </div>
        </article>`).join('');
    }
    
    if(type === 'all' || type === 'jobs') {
      const filteredJobs = jobs.filter(x => `${x.title_en} ${x.description_en} ${x.title_am||''}`.toLowerCase().includes(q));
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

    $('#catalog').innerHTML = html || '<div class="empty">No matching products, courses, or jobs found.</div>';
    bindCatalogEvents();
  }

  function bindCatalogEvents() {
    $$('[data-add]').forEach(b => b.onclick = () => addCart(b.dataset.add, b.dataset.type));
    $$('[data-job-id]').forEach(b => b.onclick = () => openJobDetails(b.dataset.jobId));
  }

  function addCart(id, type) {
    const item = catalog.find(x => String(x.id)===String(id) && x.type===type);
    if(!item) return;
    const existing = cart.find(x => String(x.id)===String(id) && x.type===type);
    if(existing) existing.quantity += 1;
    else cart.push({id: item.id, type, quantity: 1});
    saveCart(); updateCartCount();
    toast(`${item.displayTitle} added to cart.`);
  }

  async function openJobDetails(jobId) {
    const job = jobs.find(j => String(j.id) === String(jobId));
    if(!job) return;
    modal(`
      <div class="section-label">FREELANCE OPPORTUNITY</div>
      <h2>${esc(currentLang==='am'&&job.title_am ? job.title_am : job.title_en)}</h2>
      <p class="muted">Category: ${esc(job.category)} | Budget: ${money(job.budget_min)} - ${money(job.budget_max)} (${esc(job.currency)})</p>
      <div class="job-description-box">
        <p>${esc(currentLang==='am'&&job.description_am ? job.description_am : job.description_en)}</p>
      </div>
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
        const current = await db.auth.getSession();
        if(!current.data?.session) {
          toast('Please sign in to submit a proposal.', true);
          return;
        }
        const fd = new FormData(e.currentTarget);
        const { error } = await db.from('proposals').insert({
          job_id: job.id,
          freelancer_id: current.data.session.user.id,
          bid_amount: Number(fd.get('bid_amount')),
          delivery_days: Number(fd.get('delivery_days')),
          cover_letter: fd.get('cover_letter').trim()
        });
        if(error) throw error;
        toast('Proposal submitted successfully!');
        closeModal();
      } catch(err) {
        toast(err.message, true);
      }
    };
  }

  function postJobModal() {
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
        const current = await db.auth.getSession();
        if(!current.data?.session) {
          toast('Please sign in to post a job.', true);
          return;
        }
        const fd = new FormData(e.currentTarget);
        const { error } = await db.from('jobs').insert({
          client_id: current.data.session.user.id,
          title_en: fd.get('title_en').trim(),
          title_am: fd.get('title_am').trim() || null,
          category: fd.get('category').trim(),
          budget_min: Number(fd.get('budget_min')),
          budget_max: Number(fd.get('budget_max')),
          description_en: fd.get('description_en').trim(),
          description_am: fd.get('description_am').trim() || null
        });
        if(error) throw error;
        toast('Job posted successfully.');
        closeModal();
        await loadData();
      } catch(err) {
        toast(err.message, true);
      }
    };
  }

  async function init() {
    $('#year').textContent = new Date().getFullYear();
    $('#langEN').onclick = () => setLanguage('en');
    $('#langAM').onclick = () => setLanguage('am');
    $('#postJobBtn').onclick = () => postJobModal();
    $('#catalogSearch').oninput = renderCatalog;
    $('#catalogType').onchange = renderCatalog;

    if(cfg.url && cfg.publishableKey && window.supabase?.createClient) {
      db = window.supabase.createClient(cfg.url, cfg.publishableKey);
      const { data } = await db.auth.getSession();
      session = data?.session || null;
    }
    await loadData();
    updateCartCount();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
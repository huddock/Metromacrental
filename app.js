/*
  Metro Mac Rentals — app.js
  Animations + functionality for the one‑page site.
  - Smooth anchor scrolling
  - Sticky header shadow
  - Scroll‑reveal animations (cards, inventory, sections)
  - Pricing estimator (with volume discounts)
  - WhatsApp deep‑link helper
  - Form enhancer (compose email/WhatsApp message)
  
  Drop this file next to index.html and include:
  <script src="app.js" defer></script>
*/

// =============================
// Config (edit these)
// =============================

const CONFIG = {
  whatsappNumber: "639000000000", // no + sign
  deliveryFeeMM: 250,
  baseRates: { // sample rates; sync with your pricing
    day:   { air: 600,  pro: 800  },
    week:  { air: 1800, pro: 2400 },
    month: { air: 4000, pro: 5500 }
  },
  volumeDiscounts: [
    { minQty: 3,  pct: 5 },  // 3–4 units → 5% off
    { minQty: 5,  pct: 8 },  // 5–9 units → 8% off
    { minQty: 10, pct: 12 }  // 10+ units → 12% off
  ],
  maxDepositUnits: 4,
  perUnitDeposit: 3000,
};

// Utility: currency format (PHP)
const fmt = (n) => `₱${Number(n || 0).toLocaleString("en-PH")}`;

// =============================
// Tiny CSS injector for animations
// =============================
(function injectAnimationCSS(){
  const css = `
  .is-stuck { box-shadow: 0 6px 22px rgba(2,6,23,.35); }
  .reveal { opacity: 0; transform: translateY(16px); transition: opacity .6s ease, transform .6s ease; }
  .reveal.show { opacity: 1; transform: translateY(0); }
  .reveal-delay-1 { transition-delay: .08s; }
  .reveal-delay-2 { transition-delay: .16s; }
  .reveal-delay-3 { transition-delay: .24s; }
  .btn:active { transform: translateY(0) scale(.99); }
  html { scroll-behavior: smooth; }
  `;
  const style = document.createElement('style');
  style.setAttribute('data-injected', 'mmr-anim');
  style.textContent = css;
  document.head.appendChild(style);
})();

// =============================
// Sticky header shadow
// =============================
(function stickyHeader(){
  const header = document.querySelector('header');
  if(!header) return;
  const onScroll = () => {
    if(window.scrollY > 8) header.classList.add('is-stuck');
    else header.classList.remove('is-stuck');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

// =============================
// Smooth anchor scrolling (enhanced for older browsers)
// =============================
(function smoothAnchors(){
  const links = Array.from(document.querySelectorAll('a[href^="#"]'));
  links.forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href').slice(1);
      if(!id) return;
      const target = document.getElementById(id);
      if(target){
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.pageYOffset - 68; // offset for sticky header
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
})();

// =============================
// Scroll‑reveal animations
// =============================
(function scrollReveal(){
  const revealables = [
    '.card', '.inv', '.badge', '.hero h1', '.hero p', '.hero-cta',
    '.section-title', '.section-sub'
  ];
  const nodes = document.querySelectorAll(revealables.join(','));
  nodes.forEach((el, i) => {
    el.classList.add('reveal');
    if(i % 3 === 1) el.classList.add('reveal-delay-1');
    if(i % 3 === 2) el.classList.add('reveal-delay-2');
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach(ent => {
      if(ent.isIntersecting){
        ent.target.classList.add('show');
        io.unobserve(ent.target);
      }
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: .12 });
  nodes.forEach(n => io.observe(n));
})();

// =============================
// WhatsApp helper (uses CONFIG)
// =============================
function openWhatsAppWith(message){
  const msg = encodeURIComponent(message || "Hi Metro Mac Rentals! I'd like to rent a MacBook. My location: ____. Duration: ____. Budget: ____. Model preference: ____.");
  window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${msg}`, '_blank');
}

// Replace global function if it exists in HTML
window.openWhatsApp = function(){
  openWhatsAppWith();
};

// =============================
// Estimator logic (id hooks must exist)
// =============================
(function estimator(){
  const form = document.querySelector('#estimate form');
  const out = document.getElementById('est-out');
  if(!form || !out) return;

  // Attach handler
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const plan = document.getElementById('plan')?.value || 'month';
    const model = document.getElementById('model')?.value || 'air';
    const qty = Math.max(1, parseInt(document.getElementById('qty')?.value || '1', 10));
    const duration = Math.max(1, parseInt(document.getElementById('duration')?.value || '1', 10));

    const base = CONFIG.baseRates[plan]?.[model] || 0;
    let subtotal = base * duration * qty;

    // Volume discount
    let discountPct = 0;
    for(const rule of CONFIG.volumeDiscounts.sort((a,b)=>b.minQty-a.minQty)){
      if(qty >= rule.minQty){ discountPct = rule.pct; break; }
    }
    const discount = Math.round(subtotal * (discountPct/100));
    subtotal -= discount;

    const depositUnits = Math.min(qty, CONFIG.maxDepositUnits);
    const deposit = CONFIG.perUnitDeposit * depositUnits;
    const delivery = CONFIG.deliveryFeeMM;
    const total = subtotal + deposit + delivery;

    // Render
    out.innerHTML = `
      <div class='card'>
        <div class='grid-3'>
          <div><div class='muted'>Plan / Model</div><div class='price'>${plan.toUpperCase()} • ${model === 'air' ? 'MacBook Air' : 'MacBook Pro'}</div></div>
          <div><div class='muted'>Qty × Duration</div><div class='price'>${qty} × ${duration}</div></div>
          <div><div class='muted'>Base Rate</div><div class='price'>${fmt(base)}</div></div>
        </div>
        <div class='grid-3' style='margin-top:12px'>
          <div><div class='muted'>Subtotal</div><div class='price'>${fmt(subtotal + discount)}</div></div>
          <div><div class='muted'>Volume Discount ${discountPct ? `(${discountPct}%)` : ''}</div><div class='price'>${discount ? '–'+fmt(discount) : fmt(0)}</div></div>
          <div><div class='muted'>After Discount</div><div class='price'>${fmt(subtotal)}</div></div>
        </div>
        <div class='grid-3' style='margin-top:12px'>
          <div><div class='muted'>Refundable Deposit</div><div class='price'>${fmt(deposit)}</div></div>
          <div><div class='muted'>Delivery (Metro Manila)</div><div class='price'>${fmt(delivery)}</div></div>
          <div><div class='muted'>Estimated Total Due</div><div class='price'>${fmt(total)}</div></div>
        </div>
        <div class='notice' style='margin-top:8px'>*For guidance only. Final quote depends on exact model, stock, and address.</div>
        <div style='display:flex; gap:10px; flex-wrap:wrap; margin-top:10px'>
          <button class='btn btn-primary' id='btn-wa-est'>Send quote via WhatsApp</button>
          <button class='btn' id='btn-copy-est'>Copy estimate</button>
        </div>
      </div>`;

    // Actions
    const text = `Metro Mac Rentals — Estimate\nPlan: ${plan}\nModel: ${model}\nQty: ${qty}\nDuration: ${duration}\nBase rate: ${fmt(base)}\nSubtotal: ${fmt(subtotal + discount)}\nDiscount: ${discountPct}% (${fmt(discount)})\nAfter discount: ${fmt(subtotal)}\nDeposit: ${fmt(deposit)}\nDelivery: ${fmt(delivery)}\nTOTAL DUE: ${fmt(total)}`;

    const btnWA = document.getElementById('btn-wa-est');
    const btnCopy = document.getElementById('btn-copy-est');
    btnWA?.addEventListener('click', () => openWhatsAppWith(text));
    btnCopy?.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(text); btnCopy.textContent = 'Copied!'; setTimeout(()=>btnCopy.textContent='Copy estimate', 1200); } catch(_){}
    });

    // Persist last selection
    try {
      localStorage.setItem('mmr_estimator', JSON.stringify({ plan, model, qty, duration }));
    } catch(_){}
  });

  // Prefill from storage
  try {
    const saved = JSON.parse(localStorage.getItem('mmr_estimator') || 'null');
    if(saved){
      const ids = ['plan','model','qty','duration'];
      ids.forEach(id => { if(document.getElementById(id) && saved[id] !== undefined) document.getElementById(id).value = saved[id]; });
    }
  } catch(_){}
})();

// =============================
// Form enhancer (builds a nicer mailto & optional WhatsApp)
// =============================
(function enhanceForm(){
  const form = document.querySelector('#contact form[action^="mailto:"]');
  if(!form) return;
  form.addEventListener('submit', (e) => {
    // Build a more structured mailto body
    const fd = new FormData(form);
    const name = fd.get('name') || '';
    const email = fd.get('email') || '';
    const phone = fd.get('phone') || '';
    const plan = fd.get('plan') || '';
    const message = fd.get('message') || '';

    const subject = encodeURIComponent(`Rental request — ${name}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nPlan: ${plan}\nMessage: ${message}\n\nSource: Website contact form`
    );

    const mailto = form.getAttribute('action');
    form.setAttribute('action', `${mailto}?subject=${subject}&body=${body}`);

    // Optional: also open WhatsApp tab with the same info for faster conversations
    openWhatsAppWith(`Hi, I'm ${name}. Plan: ${plan}. Phone/email: ${phone} / ${email}. Message: ${message}`);
  });
})();

// =============================
// UTM → WhatsApp note (if you link ads to the site)
// =============================
(function utmPassthrough(){
  const params = new URLSearchParams(window.location.search);
  if(!Array.from(params.keys()).length) return;
  const info = ['utm_source','utm_medium','utm_campaign','utm_content']
    .map(k => params.get(k) ? `${k}:${params.get(k)}` : null)
    .filter(Boolean)
    .join(' | ');
  if(!info) return;
  window._mmr_utm = info; // for debugging
})();

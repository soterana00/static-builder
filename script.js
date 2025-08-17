
const IMG_SLOTS = {
  "img-slot-1":  "./assets/jartonlobby.png",
  "img-slot-2":  "./assets/koth.png",
  "img-slot-3":  "./assets/koth2.png",
  "img-slot-4":  "./assets/newstyle2.png",
  "img-slot-5":  "./assets/clocktour.png",
  "img-slot-6":  "./assets/classicxdragon.png",
  "img-slot-7":  "./assets/heavenvhell2.png",
  "img-slot-8":  "./assets/heavenvhell.png",
  "img-slot-9":  "./assets/farm.png",
  "img-slot-10": "./assets/castle.png",
  "img-slot-11": "./assets/classicspawn.png",
  "img-slot-12": "./assets/spring.png"
};


const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));


const cursorHalo = $('#cursorHalo');
const parallaxLayers = $$('.parallax .layer');
const gallery = $('#gallery');
const galleryItems = $$('.gallery-item');
const lightbox = $('#lightbox');
const lightboxTrack = $('#lightboxTrack');
const lightboxTitle = $('#lightboxTitle');
const closeLightboxBtn = $('#closeLightbox');
const prevSlideBtn = $('#prevSlide');
const nextSlideBtn = $('#nextSlide');
const toastEl = $('#toast');
const tabs = $$('.tab');
const tabPanels = $$('.tab-panel');
const accordions = $$('.accordion .acc-item');
const contactForm = $('#contactForm');
const fab = $('#scrollTop');
const heroPreview = $('#heroPreview');
const voxels = $$('.voxel');

/* ==========================
   Init image placeholders -> set background-image (lazy)
   ========================== */
function applyImageSlots() {
  Object.entries(IMG_SLOTS).forEach(([cls, url]) => {
    const el = $(`.${cls}`);
    if (!el || !url || url.includes('REPLACE_IMG')) return;
    // set as CSS background-image, but lazy-load with Image
    el.style.backgroundImage = `linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))`;
    const img = new Image();
    img.onload = () => {
      el.style.backgroundImage = `url('${url}')`;
      el.classList.add('loaded');
    };
    img.onerror = () => {
      // leave gradient placeholder
      console.warn('Failed to load', url, 'for', cls);
    };
    img.src = url;
  });
}

/* ==========================
   Cursor halo & magnetic hover
   ========================== */
function initCursorHalo() {
  if (!cursorHalo) return;
  document.addEventListener('mousemove', e => {
    cursorHalo.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
  });

  // magnetic items: scale halo when near interactive items
  const magnetables = [...$$('.button'), ...$$('.gallery-item'), ...$$('.icon-btn'), ...$$('.play')];
  document.addEventListener('mousemove', (e) => {
    let found = false;
    magnetables.forEach(el => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width/2);
      const dy = e.clientY - (r.top + r.height/2);
      const dist = Math.sqrt(dx*dx + dy*dy);
      const threshold = Math.max(80, Math.min(220, (r.width + r.height) / 2 + 20));
      if (dist < threshold) {
        const scale = clamp(1.6 - (dist / threshold), 1, 1.6);
        cursorHalo.style.transition = 'transform 80ms linear';
        cursorHalo.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) scale(${scale})`;
        found = true;
      }
    });
    if (!found) cursorHalo.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) scale(1)`;
  });
}

/* ==========================
   Parallax
   ========================== */
function initParallax() {
  const speedFactor = 0.03;
  window.addEventListener('mousemove', (e) => {
    const cx = (e.clientX / window.innerWidth) - 0.5;
    const cy = (e.clientY / window.innerHeight) - 0.5;
    parallaxLayers.forEach(layer => {
      const depth = parseFloat(layer.dataset.depth || 0.07);
      const tx = cx * 40 * depth * speedFactor * 100;
      const ty = cy * 30 * depth * speedFactor * 100;
      layer.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
    });
  });

  // subtle scroll parallax
  window.addEventListener('scroll', () => {
    const st = window.scrollY;
    parallaxLayers.forEach(layer => {
      const depth = parseFloat(layer.dataset.depth || 0.07);
      const ty = st * depth * 0.12;
      layer.style.transform += ` translateY(${ty}px)`;
    });
  }, { passive: true });
}

/* ==========================
   Gallery lightbox builder
   ========================== */
let currentSlide = 0;
let slideCount = 0;
let slideElements = [];

function buildLightboxSlides() {
  // gather gallery items in DOM order
  const items = $$('.gallery-item');
  lightboxTrack.innerHTML = '';
  slideElements = [];
  items.forEach((it, idx) => {
    const title = it.dataset.title || '';
    const tags = (it.dataset.tags || '').split(',').map(s => s.trim()).filter(Boolean);
    const slotClass = Array.from(it.classList).find(c => c.startsWith('img-slot-'));
    const src = slotClass && IMG_SLOTS[slotClass] ? IMG_SLOTS[slotClass] : null;

    // slide element
    const slide = document.createElement('div');
    slide.className = 'slide';
    slide.style.background = "linear-gradient(180deg, rgba(0,0,0,0.06), rgba(0,0,0,0.12))";
    slide.style.display = 'grid';
    slide.style.placeItems = 'center';
    slide.style.padding = '20px';
    slide.style.minHeight = '360px';

    const inner = document.createElement('div');
    inner.style.width = '100%';
    inner.style.maxWidth = '1100px';
    inner.style.borderRadius = '12px';
    inner.style.overflow = 'hidden';
    inner.style.boxShadow = '0 18px 46px rgba(0,0,0,0.45)';
    inner.style.background = '#061018';

    // actual image box
    const imgBox = document.createElement('div');
    imgBox.style.aspectRatio = '16/9';
    imgBox.style.backgroundSize = 'cover';
    imgBox.style.backgroundPosition = 'center';
    imgBox.style.width = '100%';
    imgBox.style.minHeight = '360px';
    imgBox.style.transition = 'opacity .45s ease';
    imgBox.className = 'lightbox-img';

    if (src && !src.includes('REPLACE_IMG')) {
      imgBox.style.backgroundImage = `url('${src}')`;
    } else {
      // fallback placeholder
      imgBox.style.background = 'linear-gradient(135deg,#0f1724,#10233a)';
      imgBox.style.display = 'grid';
      imgBox.style.placeItems = 'center';
      const p = document.createElement('div');
      p.style.color = '#9fbfca';
      p.style.padding = '28px';
      p.style.textAlign = 'center';
      p.innerText = title || 'Preview unavailable — replace IMG_SLOTS with direct Imgur links';
      imgBox.appendChild(p);
    }

    // caption
    const caption = document.createElement('div');
    caption.style.padding = '12px 16px';
    caption.style.display = 'flex';
    caption.style.justifyContent = 'space-between';
    caption.style.alignItems = 'center';
    caption.style.gap = '12px';
    caption.innerHTML = `<div style="font-weight:700">${title}</div>
                         <div style="opacity:.9">${tags.map(t=>`<span style="padding:6px 10px;border-radius:999px;background:rgba(255,255,255,0.03);font-size:13px;margin-left:6px">${t}</span>`).join('')}</div>`;

    inner.appendChild(imgBox);
    inner.appendChild(caption);
    slide.appendChild(inner);
    lightboxTrack.appendChild(slide);
    slideElements.push(slide);
  });

  slideCount = slideElements.length;
  // resize track
  lightboxTrack.style.width = `${slideCount * 100}%`;
  lightboxTrack.style.display = 'flex';
  slideElements.forEach(s => s.style.flex = '0 0 100%');
}

/* ==========================
   Lightbox controls
   ========================== */
function openLightbox(index = 0, title = '') {
  if (!lightbox) return;
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
  currentSlide = clamp(index, 0, slideCount - 1);
  setLightboxTitle(title || (slideElements[currentSlide]?.querySelector('div > div')?.innerText || 'Preview'));
  updateLightboxPosition();
}

function closeLightbox() {
  if (!lightbox) return;
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
}

function setLightboxTitle(t) {
  if (lightboxTitle) lightboxTitle.innerText = t;
}

function updateLightboxPosition() {
  const percent = -(currentSlide * 100);
  lightboxTrack.style.transform = `translateX(${percent}%)`;
}

/* ==========================
   Event wiring — gallery click
   ========================== */
function wireGalleryClicks() {
  galleryItems.forEach((it, i) => {
    it.addEventListener('click', () => {
      openLightbox(i, it.dataset.title || '');
    });
    it.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') openLightbox(i, it.dataset.title || '');
    });
  });

  closeLightboxBtn?.addEventListener('click', closeLightbox);
  lightbox?.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  prevSlideBtn?.addEventListener('click', () => {
    currentSlide = (currentSlide - 1 + slideCount) % slideCount;
    updateLightboxPosition();
  });
  nextSlideBtn?.addEventListener('click', () => {
    currentSlide = (currentSlide + 1) % slideCount;
    updateLightboxPosition();
  });

  // keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (lightbox?.classList.contains('open')) {
      if (e.key === 'ArrowRight') { currentSlide = Math.min(currentSlide + 1, slideCount -1); updateLightboxPosition(); }
      if (e.key === 'ArrowLeft')  { currentSlide = Math.max(currentSlide - 1, 0); updateLightboxPosition(); }
      if (e.key === 'Escape')     { closeLightbox(); }
    }
  });
}

/* ==========================
   Tabs
   ========================== */
function initTabs() {
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      // panels
      const idx = tabs.indexOf ? tabs.indexOf(tab) : Array.from(tabs).indexOf(tab);
      tabPanels.forEach((p, i) => {
        if (i === idx) p.classList.add('active'); else p.classList.remove('active');
      });
    });
  });
}

/* ==========================
   Accordions
   ========================== */
function initAccordions() {
  accordions.forEach(item => {
    const head = item.querySelector('.acc-head');
    head.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      // close all
      accordions.forEach(a => a.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });
}

/* ==========================
   Contact form (mock) & toast
   ========================== */
function showToast(msg = 'Message sent ✓', timeout = 2400) {
  if (!toastEl) return;
  toastEl.innerText = msg;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), timeout);
}

function initContact() {
  if (!contactForm) return;
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // emulate send
    const fm = new FormData(contactForm);
    const name = fm.get('name') || 'Someone';
    showToast(`Thanks ${name}, message queued ✓`);
    contactForm.reset();
  });
}

/* ==========================
   FAB scroll top
   ========================== */
function initFab() {
  fab.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  window.addEventListener('scroll', () => {
    fab.style.opacity = window.scrollY > 200 ? '1' : '0';
    fab.style.transform = window.scrollY > 200 ? 'translateY(0)' : 'translateY(12px)';
  }, { passive: true });
}

/* ==========================
   Hero voxels gentle motion
   ========================== */
function animateVoxels() {
  voxels.forEach((v, i) => {
    const baseX = parseFloat(getComputedStyle(v).left || 0);
    const baseY = parseFloat(getComputedStyle(v).top || 0);
    // random float offsets driven by sine
    const amp = 6 + (i % 3) * 4;
    const speed = 1800 + (i * 120);
    let t = 0;
    function frame() {
      t += 16;
      const rx = Math.sin(t / speed + i) * (amp * 0.6);
      const ry = Math.cos(t / (speed * 1.2) + i) * (amp * 0.9);
      v.style.transform = `translate3d(${rx}px, ${ry}px, 0) rotate(45deg)`;
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
}

/* ==========================
   Small niceties: shimmer play, demo modal (mock)
   ========================== */

/* ==========================
   Lazy intersection observer for .loaded images (extra)
   ========================== */
function initLazyObserver() {
  const lazyEls = $$('.lightbox-img');
  // these will be set when lightbox slides created; if background contains REPLACE, skip
  // we also lazily load images already set in IMG_SLOTS via applyImageSlots above
}

/* ==========================
   Init everything
   ========================== */
function init() {
  applyImageSlots();
  initCursorHalo();
  initParallax();
  buildLightboxSlides();
  wireGalleryClicks();
  initTabs();
  initAccordions();
  initContact();
  initFab();
  
  animateVoxels();

  // small accessibility / focus helpers
  document.querySelectorAll('a,button,[tabindex]').forEach(el => {
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') el.click();
    });
  });

  // decorate gallery items with role
  galleryItems.forEach(it => it.setAttribute('role', 'button'));

  // initial toast hidden
  setTimeout(()=> { toastEl.classList.remove('show'); }, 1800);
}

/* ==========================
   Boot
   ========================== */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}


/* ═══════════════════════════════════════════
   SERVICE CARDS — BACKGROUND IMAGES
   Apply data-bg as inline background-image so
   CSS overlay (::after) renders correctly.
═══════════════════════════════════════════ */
document.querySelectorAll('.service-card[data-bg]').forEach(card => {
  card.style.backgroundImage = `url('${card.dataset.bg}')`;
});

/* ═══════════════════════════════════════════
   SERVICE CARDS — SELEÇÃO EXCLUSIVA
   ─────────────────────────────────────────────
   REGRA ABSOLUTA: apenas 1 card pode estar ativo.
   Implementação:
     1. activeCard = variável de estado global (null = nenhum ativo)
     2. Ao clicar em qualquer card:
        a. removeActiveFromAll() — remove .is-touched de TODOS os cards
           e força reflow para interromper transições em andamento
        b. Ativa somente o card clicado
     3. O CSS :hover está restrito a @media (hover:hover) and (pointer:fine)
        — em dispositivos touch, hover é desabilitado, eliminando
        ativações fantasmas por proximidade ao rolar.
     4. Clique fora de qualquer card desativa o card ativo.
═══════════════════════════════════════════ */
(function () {
  const cards = Array.from(document.querySelectorAll('.service-card'));
  if (!cards.length) return;

  /* ── Estado global: fonte única de verdade ── */
  let activeCard = null;

  /* Força a interrupção IMEDIATA de todas as transições em todos os cards.
     getComputedStyle() causa um reflow síncrono — o browser descarta
     qualquer frame de animação pendente antes de remover as classes. */
  function removeActiveFromAll() {
    cards.forEach(card => {
      if (card.classList.contains('is-touched')) {
        card.classList.remove('is-touched');
        /* Força reflow para garantir que o browser aplique o estado
           sem a classe antes de calcular qualquer nova transição */
        void card.offsetHeight; /* eslint-disable-line no-void */
      }
    });
    activeCard = null;
  }

  function activateCard(card) {
    /* Passo 1: destruir TODOS os estados visuais ativos — sem exceção */
    removeActiveFromAll();

    /* Passo 2: ativar somente o card clicado */
    if (card) {
      activeCard = card;
      card.classList.add('is-touched');
    }
  }

  /* ── Event listener: usa 'click' (não touchstart) para:
       a) evitar conflito com o swipe/touchstart do carousel
       b) garantir que cliques em botões filhos (.btn-see-service)
          não ativem o card E o modal ao mesmo tempo
       c) funcionar corretamente em todos os dispositivos ── */
  cards.forEach(card => {
    card.addEventListener('click', e => {
      /* Se o clique foi no botão "See Service", não ativa o card
         (o modal é aberto pelo seu próprio listener) */
      if (e.target.closest('.btn-see-service')) return;

      /* Toggle: clicar no card ativo o desativa */
      if (card === activeCard) {
        removeActiveFromAll();
      } else {
        activateCard(card);
      }
    });
  });

  /* Clique fora de qualquer card desativa o ativo */
  document.addEventListener('click', e => {
    if (!e.target.closest('.service-card')) {
      removeActiveFromAll();
    }
  });
})();


/* ═══════════════════════════════════════════
   MENU HAMBÚRGUER — FULLSCREEN
═══════════════════════════════════════════ */
const hamburger = document.getElementById('nav-hamburger');
const fsMenu    = document.getElementById('fs-menu');
const fsClose   = document.getElementById('fs-close');
/* #M8 — include #fs-btn-quote explicitly so it works even without .fs-link class */
const fsLinks   = document.querySelectorAll('.fs-link, #fs-logo-link, #fs-btn-quote');

function openMenu() {
  fsMenu.classList.add('is-open');
  fsMenu.removeAttribute('inert');
  hamburger.classList.add('is-open');
  hamburger.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}

function closeMenu() {
  fsMenu.classList.remove('is-open');
  fsMenu.setAttribute('inert', '');
  hamburger.classList.remove('is-open');
  hamburger.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

hamburger.addEventListener('click', () => {
  fsMenu.classList.contains('is-open') ? closeMenu() : openMenu();
});

fsClose.addEventListener('click', closeMenu);

fsLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    if (href && href.startsWith('#')) {
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        closeMenu();
        setTimeout(() => smoothScrollTo(target), 360);
        return;
      }
    }
    closeMenu();
  });
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && fsMenu.classList.contains('is-open')) closeMenu();
});

/* ═══════════════════════════════════════════
   SCROLL SUAVE
═══════════════════════════════════════════ */
function smoothScrollTo(target) {
  const navHeight = document.querySelector('nav').offsetHeight || 72;
  const targetY   = target.getBoundingClientRect().top + window.scrollY - navHeight - 8;
  const startY    = window.scrollY;
  const distance  = targetY - startY;

  /* Duration feels unhurried but never sluggish.
     Multiplier 0.35 gives ~490ms for a full-page jump. */
  const duration = Math.min(780, Math.max(400, Math.abs(distance) * 0.35));
  let startTime  = null;

  /* ease-in-out-quad: gentle acceleration from rest, peak in the
     middle, gradual deceleration to stop. Mimics natural physical
     movement — the eye reads it as intentional, not automated. */
  function ease(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function step(ts) {
    if (!startTime) startTime = ts;
    const elapsed  = ts - startTime;
    const progress = Math.min(elapsed / duration, 1);
    window.scrollTo(0, startY + distance * ease(progress));
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ═══════════════════════════════════════════
   SCROLL REVEAL
═══════════════════════════════════════════ */
const revealEls = document.querySelectorAll('.reveal');

/* Use rootMargin to start the reveal slightly before the element
   fully enters the viewport — eliminates the "already visible but
   still hidden" flicker common with threshold-only observers. */
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      /* Read any stagger delay set by the element itself (data-reveal-delay)
         or fall back to 0. This lets CSS delays remain as art direction
         while the observer fires as early as possible. */
      const delay = parseFloat(entry.target.dataset.revealDelay || 0);
      const el = entry.target;
      const activate = () => {
        el.classList.add('visible');
        /* Zerar o transition-delay após o reveal completar — no elemento
           E em todos os filhos relevantes (::before/::after não são acessíveis
           via JS, mas o CSS já garante transition-delay:0s nesses pseudo-elementos
           no bloco de estado inativo/.is-touched).
           O timeout cobre o tempo do reveal (0.8s) + o stagger delay. */
        const resetDelay = delay * 1000 + 900;
        setTimeout(() => {
          el.style.transitionDelay = '0s';
          /* Se for um service-card, zera os filhos diretos também */
          if (el.classList.contains('service-card')) {
            el.querySelectorAll('.service-card-num, .service-icon, .service-icon svg')
              .forEach(child => { child.style.transitionDelay = '0s'; });
          }
        }, resetDelay);
      };
      if (delay > 0) {
        setTimeout(activate, delay * 1000);
      } else {
        activate();
      }
      revealObs.unobserve(entry.target);
    }
  });
}, {
  /* Trigger reveal when element is still 32px below the viewport edge.
     Combined with the 0.8s ease-in-out-quad, the element is already
     mid-animation by the time the eye reaches it — feels effortless. */
  rootMargin: '0px 0px -32px 0px',
  threshold: 0
});

revealEls.forEach(el => revealObs.observe(el));

/* ═══════════════════════════════════════════
   NAV SHRINK ON SCROLL
   Uses a CSS class toggle instead of inline style mutations to
   avoid forced reflows and keep the paint on the compositor thread.
═══════════════════════════════════════════ */
const nav = document.querySelector('nav');
let navScrollTicking = false;

window.addEventListener('scroll', () => {
  if (navScrollTicking) return;
  navScrollTicking = true;
  requestAnimationFrame(() => {
    nav.classList.toggle('is-scrolled', window.scrollY > 60);
    navScrollTicking = false;
  });
}, { passive: true });

/* ═══════════════════════════════════════════
   SMOOTH SCROLL — LINKS DESKTOP
═══════════════════════════════════════════ */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    if (link.classList.contains('fs-link') || link.id === 'fs-logo-link' || link.id === 'fs-btn-quote') return;
    const target = document.querySelector(link.getAttribute('href'));
    if (target) { e.preventDefault(); smoothScrollTo(target); }
  });
});

/* ═══════════════════════════════════════════
   FORM SUBMIT
═══════════════════════════════════════════ */
function handleSubmit(btn) {
  btn.textContent = 'Sending...';
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = '✓ Request Sent! We\'ll contact you soon.';
    btn.style.background = '#1a6e3c';
    btn.style.color = 'white';
  }, 1500);
}

/* ═══════════════════════════════════════════
   BEFORE & AFTER CAROUSEL
═══════════════════════════════════════════ */
(function () {
  const total     = 9;
  let current     = 0;
  let isAnimating = false;

  const track     = document.getElementById('bacTrack');
  const prevBtn   = document.getElementById('bacPrev');
  const nextBtn   = document.getElementById('bacNext');
  const currentEl = document.getElementById('bacCurrent');
  const dots      = document.querySelectorAll('.bac-dot');

  if (!track) return; // guard in case section isn't present

  const slides    = track.querySelectorAll('.bac-slide');

  function goTo(index) {
    if (isAnimating || index === current) return;
    isAnimating = true;

    const prevSlide = slides[current];
    const nextSlide = slides[index];

    /* Fade out current */
    prevSlide.classList.add('exit');
    prevSlide.classList.remove('active');

    setTimeout(() => {
      prevSlide.classList.remove('exit');

      /* Show next */
      nextSlide.classList.add('active');
      current = index;

      /* Update counter */
      currentEl.textContent = current + 1;

      /* Update dots */
      dots.forEach((d, i) => {
        d.classList.toggle('active', i === current);
        d.setAttribute('aria-selected', i === current ? 'true' : 'false');
      });

      isAnimating = false;

      /* Re-init slider on the newly visible slide */
      initSlider(nextSlide.querySelector('[data-slider]'));
    }, 230);
  }

  prevBtn.addEventListener('click', () => goTo((current - 1 + total) % total));
  nextBtn.addEventListener('click', () => goTo((current + 1) % total));

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const idx = parseInt(dot.dataset.goto, 10);
      if (!isNaN(idx)) goTo(idx);
    });
  });

  /* #C4 — Arrow keys: guard against firing when mobile menu is open */
  document.addEventListener('keydown', e => {
    if (fsMenu.classList.contains('is-open')) return;
    if (e.key === 'ArrowLeft')  goTo((current - 1 + total) % total);
    if (e.key === 'ArrowRight') goTo((current + 1) % total);
  });

  /* Touch swipe on the track */
  let touchStartX = 0;
  track.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  track.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0
        ? goTo((current + 1) % total)
        : goTo((current - 1 + total) % total);
    }
  }, { passive: true });

  /* ── Image comparison slider logic ── */
  /* #M9 — Use WeakMap instead of storing _initialized on DOM element */
  const initializedSliders = new WeakMap();

  function initSlider(slider) {
    if (!slider || initializedSliders.has(slider)) return;
    initializedSliders.set(slider, true);

    const before  = slider.querySelector('.ba-img-before');
    const divider = slider.querySelector('.ba-divider');
    let dragging  = false;

    function setPosition(x) {
      const rect = slider.getBoundingClientRect();
      let pct = ((x - rect.left) / rect.width) * 100;
      pct = Math.min(Math.max(pct, 2), 98);
      before.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
      divider.style.left    = `${pct}%`;
    }

    /* Mouse */
    slider.addEventListener('mousedown', e => {
      dragging = true;
      slider.classList.add('is-dragging');
      setPosition(e.clientX);
    });

    /* #C3 — Named handler references so listeners can be cleaned up properly.
       Each slider gets its own closure-scoped handlers, so window only ever
       has ONE mousemove and ONE mouseup listener total (added once on the
       first initSlider call, reused for all subsequent sliders via dragging flag). */
    const onMouseMove = e => {
      if (!dragging) return;
      setPosition(e.clientX);
    };
    const onMouseUp = () => {
      if (!dragging) return;
      dragging = false;
      slider.classList.remove('is-dragging');
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup',   onMouseUp);

    /* Touch */
    slider.addEventListener('touchstart', e => {
      dragging = true;
      slider.classList.add('is-dragging');
      setPosition(e.touches[0].clientX);
    }, { passive: true });
    slider.addEventListener('touchmove', e => {
      if (!dragging) return;
      e.stopPropagation();
      setPosition(e.touches[0].clientX);
    }, { passive: false });
    slider.addEventListener('touchend', () => {
      dragging = false;
      slider.classList.remove('is-dragging');
    });
  }

  /* Init first slide's slider immediately */
  initSlider(slides[0].querySelector('[data-slider]'));
})();
/* ═══════════════════════════════════════════
   SERVICE MODAL
═══════════════════════════════════════════ */
(function () {

  /* ── Service data ── */
  const SERVICES = {
    carpet: {
      title: 'Carpet Cleaning',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="26" height="26"><path d="M3 12h18M3 6l9-3 9 3M3 18l9 3 9-3"/></svg>`,
      before: 'imagens/carpet-before.jpg',
      after:  'imagens/carpet-after.jpg',
      desc: `
        <h4>What Is It</h4>
        <p>Our carpet cleaning service uses hot-water extraction — the method recommended by most carpet manufacturers — to flush out deep-set dirt, allergens, bacteria, and stubborn stains that regular vacuuming can't reach.</p>
        <h4>How It Works</h4>
        <p>We pre-treat high-traffic areas and stains with specialized solutions, then use professional-grade steam extraction equipment to thoroughly rinse and lift contaminants from carpet fibers. Carpets typically dry within 2–4 hours.</p>
        <h4>Why Hire Us</h4>
        <p>Majestic uses professional-grade truck-mounted or portable equipment that provides far superior suction and heat compared to rental machines. Our technicians are trained to handle delicate fibers, color-sensitive dyes, and difficult stains without damage.</p>
      `,
      benefits: [
        'Professional steam extraction',
        'Stain & odor removal',
        'Allergen & bacteria reduction',
        'Safe for all fiber types',
        'Experienced technicians',
        'Satisfaction guaranteed'
      ]
    },
    upholstery: {
      title: 'Upholstery Cleaning',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="26" height="26"><path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/></svg>`,
      before: 'imagens/upholstery-before.jpg',
      after:  'imagens/upholstery-after.jpg',
      desc: `
        <h4>What Is It</h4>
        <p>We deep clean sofas, armchairs, ottomans, and other upholstered furniture, restoring color vibrancy, removing embedded dirt, and eliminating odors that accumulate from daily use and pet contact.</p>
        <h4>How It Works</h4>
        <p>Our team inspects the fabric type, then applies the appropriate cleaning method — steam extraction for most fabrics, or low-moisture dry cleaning for delicate materials. We pre-treat problem areas and carefully extract all residue.</p>
        <h4>Why Hire Us</h4>
        <p>DIY upholstery cleaning risks over-wetting, shrinkage, and color bleeding. Our technicians assess each fabric individually and use methods that are safe, thorough, and leave no sticky detergent residue behind.</p>
      `,
      benefits: [
        'Fabric-safe techniques',
        'Sofa, chair & ottoman care',
        'Pet hair & odor removal',
        'Color restoration',
        'Professional Equipment',
        'Satisfaction Guaranteed'
      ]
    },
    home: {
      title: 'Home Cleaning',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="26" height="26"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>`,
      before: 'imagens/home-before.jpg',
      after:  'imagens/home-after.jpg',
      desc: `
        <h4>What Is It</h4>
        <p>A full residential cleaning service covering every room in your home — from kitchens and bathrooms to bedrooms and living areas. Tailored to your schedule, whether weekly, bi-weekly, or monthly.</p>
        <h4>How It Works</h4>
        <p>Our team follows a systematic room-by-room checklist: dusting, surface sanitization, mopping, vacuuming, and bathroom disinfection. You choose the frequency and any add-ons to fit your lifestyle.</p>
        <h4>Why Hire Us</h4>
        <p>Majestic uses professional-grade, eco-friendly cleaning products that are safe for your family and pets. Our team is background-checked, trained, and consistent — you'll get the same level of detail every single visit.</p>
      `,
      benefits: [
        'Full room-by-room service',
        'Eco-friendly products',
        'Flexible scheduling',
        'Background-checked team',
        'Consistent results',
        'Satisfaction Guaranteed'
      ]
    },
    deep: {
      title: 'Deep Cleaning',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="26" height="26"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-5"/></svg>`,
      before: 'imagens/deep-before.jpg',
      after:  'imagens/deep-after.jpg',
      desc: `
        <h4>What Is It</h4>
        <p>An intensive, top-to-bottom cleaning that goes far beyond a standard service. Deep cleaning targets built-up grime, grease, limescale, and buildup in areas that regular cleaning often misses — behind appliances, inside ovens, grout lines, and more.</p>
        <h4>How It Works</h4>
        <p>We start at the highest surfaces and work methodically down, addressing every surface including baseboards, window sills, cabinet interiors, and appliance interiors. The process takes significantly longer than a standard clean and produces dramatically better results.</p>
        <h4>Why Hire Us</h4>
        <p>Deep cleaning is ideal for first-time service, post-holiday recovery, or seasonal refreshes. Our team has the tools, products, and experience to tackle even the most challenging build-up without damaging surfaces.</p>
      `,
      benefits: [
        'Inside oven & fridge cleaning',
        'Grout & tile scrubbing',
        'Baseboard & trim detail',
        'Cabinet interior cleaning',
        'Professional Equipment',
        'Satisfaction Guaranteed'
      ]
    },
    moveinout: {
      title: 'Move-In / Move-Out',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="26" height="26"><path d="M5 12h14M5 12l4-4m-4 4l4 4"/></svg>`,
      before: 'imagens/move-before.jpg',
      after:  'imagens/move-after.jpg',
      desc: `
        <h4>What Is It</h4>
        <p>A comprehensive cleaning service designed for transitions between occupants. Whether you're a tenant wanting your deposit back or a landlord preparing for a new resident, we leave the property spotless.</p>
        <h4>How It Works</h4>
        <p>We treat the entire property as an empty space — cleaning every surface, appliance, cabinet, closet, bathroom fixture, and floor from ceiling to floor. We follow landlord-grade inspection checklists to ensure nothing is overlooked.</p>
        <h4>Why Hire Us</h4>
        <p>Move-out cleaning can make the difference between getting your security deposit back or not. Our thorough service meets the strict standards landlords and property managers expect, and we can often schedule on short notice.</p>
      `,
      benefits: [
        'Landlord-grade checklist',
        'Full appliance interior cleaning',
        'Closet & cabinet detail',
        'Deposit-ready results',
        'Flexible scheduling',
        'Satisfaction Guaranteed'
      ]
    },
    commercial: {
      title: 'Commercial Cleaning',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="26" height="26"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>`,
      before: 'imagens/commercial-before.jpg',
      after:  'imagens/commercial-after.jpg',
      desc: `
        <h4>What Is It</h4>
        <p>Reliable, scheduled cleaning for offices, retail spaces, restaurants, gyms, and other commercial properties. A clean workspace directly impacts client perception, employee productivity, and brand image.</p>
        <h4>How It Works</h4>
        <p>We develop a custom cleaning plan based on your space size, industry, and schedule preferences. Services can run after hours to minimize disruption and can be scaled up or down based on your needs.</p>
        <h4>Why Hire Us</h4>
        <p>Majestic understands that commercial clients need consistency and reliability above all. We assign dedicated teams to each account, ensuring you always receive the same high standard and don't have to re-explain your preferences.</p>
      `,
      benefits: [
        'After-hours availability',
        'Custom cleaning plans',
        'Consistent dedicated team',
        'Office & retail spaces',
        'Professional Equipment',
        'Satisfaction Guaranteed'
      ]
    },
    postconstruction: {
      title: 'Post-Construction Cleaning',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="26" height="26"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>`,
      before: 'imagens/construction-before.jpg',
      after:  'imagens/construction-after.jpg',
      desc: `
        <h4>What Is It</h4>
        <p>Specialized cleaning after renovation, remodeling, or new construction. Construction leaves behind fine dust, paint splatter, adhesive residue, debris, and materials that require specialized tools and techniques to remove safely.</p>
        <h4>How It Works</h4>
        <p>We perform a multi-phase process: rough clean (debris removal), detail clean (surface cleaning, window scrubbing, fixture polishing), and final walkthrough. We protect new finishes and use products appropriate for each surface material.</p>
        <h4>Why Hire Us</h4>
        <p>Construction dust is pervasive and abrasive — improper cleaning can scratch new floors and surfaces. Our team is trained in post-construction protocols and brings industrial-grade vacuums with HEPA filtration to handle fine particle removal.</p>
      `,
      benefits: [
        'Multi-phase clean process',
        'HEPA filtration vacuums',
        'Window & fixture polishing',
        'Safe on new finishes',
        'Debris & dust removal',
        'Satisfaction Guaranteed'
      ]
    },
    car: {
      title: 'Detailed Car Cleaning',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="26" height="26"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`,
      before: 'imagens/car-before.jpg',
      after:  'imagens/car-after.jpg',
      desc: `
        <h4>What Is It</h4>
        <p>Professional interior detailing that transforms your vehicle's cabin — deep-cleaning seat fabric or leather, carpets, dashboard, door panels, and all hard-to-reach areas. Your car will feel brand new.</p>
        <h4>How It Works</h4>
        <p>We vacuum and extract seat fabric and floor carpets, steam-clean or shampoo surfaces as needed, condition leather, clean and protect the dashboard and door panels, and treat any stains or odors individually with targeted products.</p>
        <h4>Why Hire Us</h4>
        <p>Vehicles accumulate bacteria, allergens, and odors in areas that are nearly impossible to clean effectively with household tools. Our portable professional equipment reaches every crevice and delivers results that rival dealership detailing services.</p>
      `,
      benefits: [
        'Seat fabric & leather care',
        'Carpet deep extraction',
        'Dashboard & trim detailing',
        'Pet hair removal',
        'Odor elimination',
        'Satisfaction Guaranteed'
      ]
    },
    sanitization: {
      title: 'Specialized Sanitization',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="26" height="26"><path d="M4 4h16v2H4zM4 11h16M4 18h16M4 4v16M20 4v16"/></svg>`,
      before: 'imagens/sanitization-before.jpg',
      after:  'imagens/sanitization-after.jpg',
      desc: `
        <h4>What Is It</h4>
        <p>Advanced hygienic treatment for spaces that require more than standard cleaning — including allergy-prone environments, post-illness sanitization, high-traffic facilities, and spaces requiring EPA-approved disinfection protocols.</p>
        <h4>How It Works</h4>
        <p>We apply hospital-grade disinfectants to all high-touch surfaces, use electrostatic sprayers for full-coverage application in larger spaces, and combine this with allergen-reducing treatments for carpets and upholstery where needed.</p>
        <h4>Why Hire Us</h4>
        <p>Our sanitization protocols go beyond surface cleaning to actually reduce biological contamination. This service is ideal for medical offices, childcare facilities, gym equipment areas, or any space where hygiene is a priority.</p>
      `,
      benefits: [
        'EPA-approved disinfectants',
        'Allergen reduction treatment',
        'High-touch surface focus',
        'Odor elimination',
        'Safe Products',
        'Satisfaction Guaranteed'
      ]
    }
  };

  /* ── DOM refs ── */
  const modal        = document.getElementById('service-modal');
  const backdrop     = modal.querySelector('.svc-modal-backdrop');
  const closeBtn     = document.getElementById('svc-modal-close');
  const titleEl      = document.getElementById('svc-modal-title');
  const iconEl       = document.getElementById('svc-modal-icon');
  const descEl       = document.getElementById('svc-modal-desc');
  const benefitsEl   = document.getElementById('svc-modal-benefits');
  const ctaBtn       = document.getElementById('svc-modal-cta-btn');
  const slider       = document.getElementById('svc-modal-slider');
  const imgBefore    = document.getElementById('svc-img-before-src');
  const imgAfter     = document.getElementById('svc-img-after-src');
  const beforeClip   = slider ? slider.querySelector('.svc-ba-img-before') : null;
  const divider      = slider ? slider.querySelector('.svc-ba-divider')     : null;

  let sliderDragging  = false;
  let sliderInitialized = false;

  /* ── Open & populate ── */
  function openModal(serviceKey) {
    const data = SERVICES[serviceKey];
    if (!data) return;

    /* Populate content */
    titleEl.textContent = data.title;
    iconEl.innerHTML    = data.icon;
    descEl.innerHTML    = data.desc;
    imgBefore.src       = data.before;
    imgAfter.src        = data.after;
    imgBefore.alt       = 'Before ' + data.title;
    imgAfter.alt        = 'After '  + data.title;

    /* Build benefits list */
    benefitsEl.innerHTML = data.benefits
      .map(b => `<li>${b}</li>`)
      .join('');

    /* Reset slider to 50% */
    if (beforeClip && divider) {
      beforeClip.style.clipPath = 'inset(0 50% 0 0)';
      divider.style.left = '50%';
    }

    /* Open */
    modal.classList.add('is-open');
    modal.removeAttribute('inert');
    document.body.style.overflow = 'hidden';

    /* Init slider once (handlers persist via dragging flag) */
    if (!sliderInitialized) {
      initModalSlider();
      sliderInitialized = true;
    }

    /* Focus close button for accessibility */
    requestAnimationFrame(() => closeBtn.focus());
  }

  /* ── Close ── */
  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('inert', '');
    document.body.style.overflow = '';
  }

  /* ── Slider init ── */
  function setSliderPos(x) {
    const rect = slider.getBoundingClientRect();
    let pct = ((x - rect.left) / rect.width) * 100;
    pct = Math.min(Math.max(pct, 2), 98);
    beforeClip.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
    divider.style.left = `${pct}%`;
  }

  function initModalSlider() {
    slider.addEventListener('mousedown', e => {
      sliderDragging = true;
      slider.classList.add('is-dragging');
      setSliderPos(e.clientX);
    });
    window.addEventListener('mousemove', e => {
      if (!sliderDragging) return;
      setSliderPos(e.clientX);
    });
    window.addEventListener('mouseup', () => {
      if (!sliderDragging) return;
      sliderDragging = false;
      slider.classList.remove('is-dragging');
    });
    slider.addEventListener('touchstart', e => {
      sliderDragging = true;
      slider.classList.add('is-dragging');
      setSliderPos(e.touches[0].clientX);
    }, { passive: true });
    slider.addEventListener('touchmove', e => {
      if (!sliderDragging) return;
      e.stopPropagation();
      setSliderPos(e.touches[0].clientX);
    }, { passive: false });
    slider.addEventListener('touchend', () => {
      sliderDragging = false;
      slider.classList.remove('is-dragging');
    });
  }

  /* ── Event listeners ── */
  document.querySelectorAll('.btn-see-service').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      openModal(btn.dataset.service);
    });
  });

  closeBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', closeModal);

  /* CTA inside modal scrolls to contact and closes modal */
  ctaBtn.addEventListener('click', e => {
    const target = document.querySelector('#contact');
    if (target) {
      e.preventDefault();
      closeModal();
      setTimeout(() => smoothScrollTo(target), 360);
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });

})();
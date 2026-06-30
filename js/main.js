/* ============================================================
   SGC Wellness – Main JS
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ----------------------------------------------------------
     1. HAMBURGER / MOBILE NAV
  ---------------------------------------------------------- */
  const btnHamburger = document.getElementById('btnHamburger');
  const mainNav      = document.getElementById('mainNav');

  function toggleNav(forceClose = false) {
    const isOpen = mainNav.classList.contains('is-open');
    if (forceClose || isOpen) {
      mainNav.classList.remove('is-open');
      btnHamburger.setAttribute('aria-expanded', 'false');
    } else {
      mainNav.classList.add('is-open');
      btnHamburger.setAttribute('aria-expanded', 'true');
    }
  }

  btnHamburger.addEventListener('click', () => toggleNav());

  // Close nav when a nav link is clicked (mobile)
  mainNav.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => toggleNav(true));
  });

  // Close nav on outside click
  document.addEventListener('click', (e) => {
    if (!mainNav.contains(e.target) && !btnHamburger.contains(e.target)) {
      toggleNav(true);
    }
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') toggleNav(true);
  });

  /* ----------------------------------------------------------
     2. ACTIVE NAV LINK ON SCROLL
     Uses scroll position (not per-entry observer callbacks) so
     only one section is active when several overlap in viewport.
  ---------------------------------------------------------- */
  const sections = document.querySelectorAll('main > section[id]');
  const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
  const HEADER_HEIGHT = 64;

  function updateActiveNavLink() {
    const scrollPosition = window.scrollY + HEADER_HEIGHT + 1;

    let activeSection = sections[0];
    sections.forEach(section => {
      if (section.offsetTop <= scrollPosition) {
        activeSection = section;
      }
    });

    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${activeSection.id}`);
    });
  }

  updateActiveNavLink();
  window.addEventListener('scroll', updateActiveNavLink, { passive: true });

  /* ----------------------------------------------------------
     3. HEADER SHADOW ON SCROLL
  ---------------------------------------------------------- */
  const siteHeader = document.getElementById('site-header');

  const scrollHandler = () => {
    if (window.scrollY > 8) {
      siteHeader.style.boxShadow = '0 2px 12px rgba(0,0,0,0.12)';
    } else {
      siteHeader.style.boxShadow = '0 1px 6px rgba(0,0,0,0.08)';
    }
  };

  window.addEventListener('scroll', scrollHandler, { passive: true });

  /* ----------------------------------------------------------
     4 & 5. CATEGORY PILLS + SEARCH – unified card filtering
  ---------------------------------------------------------- */
  const tagPills    = document.querySelectorAll('.tag-pill');
  const searchInput = document.getElementById('searchInput');
  const searchBtn   = document.querySelector('.btn--search');
  let activeCategory = null;

  function matchesCategory(title, category) {
    const map = {
      masajes:  ['masaje', 'relajante'],
      faciales: ['facial', 'mascarilla'],
      spa:      ['spa', 'exfoliación', 'corporal', 'aromaterapia'],
      unas:     ['uñas', 'manicura', 'pedicura'],
    };
    const keywords = map[category] ?? [];
    return keywords.some(kw => title.includes(kw));
  }

  function cardMatchesCategory(card, category) {
    if (!category) return true;
    const title = card.querySelector('.card-title')?.textContent.toLowerCase() ?? '';
    return matchesCategory(title, category);
  }

  function cardMatchesSearch(card, query) {
    if (!query) return true;
    return card.textContent.toLowerCase().includes(query);
  }

  function applyCardFilters() {
    const query = searchInput.value.trim().toLowerCase();

    document.querySelectorAll('.service-card').forEach(card => {
      const visible = cardMatchesCategory(card, activeCategory) && cardMatchesSearch(card, query);
      card.style.opacity = visible ? '1' : (query ? '0.3' : '0.38');
      card.style.transform = visible ? '' : 'scale(0.97)';
    });

    document.querySelectorAll('.pro-card').forEach(card => {
      const visible = cardMatchesSearch(card, query);
      card.style.opacity = visible ? '1' : '0.3';
      card.style.transform = visible ? '' : 'scale(0.97)';
    });
  }

  tagPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const wasActive = pill.classList.contains('active');

      tagPills.forEach(p => p.classList.remove('active'));

      if (!wasActive) {
        pill.classList.add('active');
        activeCategory = pill.dataset.category;
      } else {
        activeCategory = null;
      }

      applyCardFilters();
    });
  });

  function runSearch() {
    applyCardFilters();

    const query = searchInput.value.trim().toLowerCase();
    if (!query) return;

    const allCards = document.querySelectorAll('.service-card, .pro-card');
    const firstMatch = Array.from(allCards).find(card => {
      const categoryOk = card.classList.contains('service-card')
        ? cardMatchesCategory(card, activeCategory)
        : true;
      return categoryOk && cardMatchesSearch(card, query);
    });

    if (firstMatch) {
      firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  searchBtn?.addEventListener('click', runSearch);

  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') runSearch();
  });

  searchInput?.addEventListener('input', () => {
    if (searchInput.value === '') applyCardFilters();
  });

  /* ----------------------------------------------------------
     6. SERVICE CARD – click → modal placeholder
  ---------------------------------------------------------- */
  const serviceCards = document.querySelectorAll('.service-card');

  serviceCards.forEach(card => {
    card.addEventListener('click', () => {
      const name  = card.querySelector('.card-title')?.textContent ?? '';
      const price = card.querySelector('.card-price')?.textContent ?? '';
      showToast(`Servicio seleccionado: ${name} — ${price}`);
    });

    // Keyboard activation
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  });

  /* ----------------------------------------------------------
     7. PROFESSIONAL CARD – click → modal placeholder
  ---------------------------------------------------------- */
  const proCards = document.querySelectorAll('.pro-card');

  proCards.forEach(card => {
    card.addEventListener('click', () => {
      const name      = card.querySelector('.pro-name')?.textContent ?? '';
      const specialty = card.querySelector('.pro-specialty')?.textContent ?? '';
      showToast(`${name} – ${specialty}`);
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  });

  /* ----------------------------------------------------------
     8. TOAST NOTIFICATION SYSTEM
  ---------------------------------------------------------- */
  let toastTimeout = null;

  function showToast(message) {
    let toast = document.getElementById('sgc-toast');

    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'sgc-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      applyToastStyles(toast);
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
    }, 3000);
  }

  function applyToastStyles(el) {
    Object.assign(el.style, {
      position:       'fixed',
      bottom:         '1.5rem',
      left:           '50%',
      transform:      'translateX(-50%) translateY(8px)',
      backgroundColor:'#2d4a3e',
      color:          '#ffffff',
      padding:        '0.65rem 1.4rem',
      borderRadius:   '9999px',
      fontSize:       '0.875rem',
      fontFamily:     'Inter, sans-serif',
      fontWeight:     '500',
      boxShadow:      '0 4px 18px rgba(0,0,0,0.18)',
      opacity:        '0',
      zIndex:         '9999',
      transition:     'opacity 0.25s ease, transform 0.25s ease',
      pointerEvents:  'none',
      whiteSpace:     'nowrap',
    });
  }

});

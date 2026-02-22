/**
 * Reference – grab & scroll s blur
 */
function initReviewsSlider() {
  var container = document.getElementById('reviews-scroll');
  if (!container) return;

  var GOOGLE_G = '<svg viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>';
  var fallback = [
    { author: 'Jan P.', initials: 'JP', rating: 5, date_relative: 'před rokem', source: 'Google', text: 'Profesionální přístup, jasná doporučení.' },
    { author: 'Marie K.', initials: 'MK', rating: 5, date_relative: 'před rokem', source: 'Google', text: 'Komplexní pohled na osobní i firemní finance.' },
    { author: 'Lucie V.', initials: 'LV', rating: 5, date_relative: 'před rokem', source: 'Google', text: 'Spolupráce na hypotéce byla bez stresu.' }
  ];

  var data = [];

  function render(list) {
    data = Array.isArray(list) && list.length ? list.slice() : fallback.slice();

    container.innerHTML = '';
    data.forEach(function (r) {
      var stars = '★'.repeat(r.rating || 5);
      var card = document.createElement('article');
      card.className = 'review-scroll-card';
      card.innerHTML =
        '<div class="review-scroll-stars">' + stars + '</div>' +
        '<p class="review-scroll-quote">' + (r.text || '').replace(/^["„]|[""]$/g, '') + '</p>' +
        '<div class="review-scroll-footer">' +
        '<div class="review-scroll-avatar">' + (r.initials || '?') + '</div>' +
        '<div class="review-scroll-meta"><h4>' + (r.author || '') + '</h4><span>' + (r.date_relative || r.date || 'Google recenze') + '</span></div>' +
        '<div class="review-scroll-google">' + GOOGLE_G + '</div></div>';
      container.appendChild(card);
    });
    requestAnimationFrame(function () { updateReviewCardsStyle(); });
  }

  function updateReviewCardsStyle() {
    var cards = container.querySelectorAll('.review-scroll-card');
    var wrap = container.parentElement;
    if (!wrap || !cards.length) return;
    var wrapRect = wrap.getBoundingClientRect();
    var centerX = wrapRect.left + wrapRect.width / 2;
    var mouseX = typeof container._lastMouseX === 'number' ? container._lastMouseX : centerX;

    cards.forEach(function (card) {
      var cr = card.getBoundingClientRect();
      var cardCenterX = cr.left + cr.width / 2;
      var distFromCenter = Math.abs(cardCenterX - centerX);
      var distFromMouse = Math.abs(cardCenterX - mouseX);
      var maxDist = wrapRect.width * 0.4;
      var t = Math.min(distFromCenter / maxDist, 1);
      /* Střední úplně vepředu, vedle za ní, vnější 3 stejná vzdálenost jako střední */
      var scale = t < 0.18 ? 1.26 : (t < 0.45 ? 0.88 : 1);
      var opacity = t < 0.18 ? 1 : (t < 0.45 ? 0.85 : 0.92);
      var blur = t > 0.45 ? (t - 0.45) * 4 : 0;
      var zIdx = t < 0.18 ? 10 : (t < 0.45 ? 5 : 3);
      var magnify = distFromMouse < 150 ? 1 + (1 - distFromMouse / 150) * 0.03 : 1;
      card.style.setProperty('--review-scale', (scale * magnify));
      card.style.setProperty('--review-opacity', opacity);
      card.style.setProperty('--review-blur', blur + 'px');
      card.style.setProperty('--review-z', zIdx);
    });
  }

  var refSection = document.getElementById('reference');
  if (refSection) {
    refSection.addEventListener('mousemove', function (e) {
      container._lastMouseX = e.clientX;
      updateReviewCardsStyle();
    });
  }
  container.addEventListener('scroll', function () { updateReviewCardsStyle(); }, { passive: true });
  window.addEventListener('resize', function () { updateReviewCardsStyle(); });

  // Grab and scroll
  var isDown = false;
  var startX;
  var scrollLeft;

  container.addEventListener('mousedown', function(e) {
    isDown = true;
    startX = e.pageX - container.offsetLeft;
    scrollLeft = container.scrollLeft;
  });

  container.addEventListener('mouseleave', function() {
    isDown = false;
  });

  container.addEventListener('mouseup', function() {
    isDown = false;
  });

  container.addEventListener('mousemove', function(e) {
    if (!isDown) return;
    e.preventDefault();
    var x = e.pageX - container.offsetLeft;
    var walk = (x - startX) * 2;
    container.scrollLeft = scrollLeft - walk;
  });

  function setupReviewArrows() {
    var prevBtn = document.getElementById('reviews-prev');
    var nextBtn = document.getElementById('reviews-next');
    if (!prevBtn || !nextBtn || !container) return;
    var step = function () {
      var card = container.querySelector('.review-scroll-card');
      var gap = 24;
      return card ? card.offsetWidth + gap : 404;
    };
    prevBtn.addEventListener('click', function () {
      container.scrollBy({ left: -step(), behavior: 'smooth' });
    });
    nextBtn.addEventListener('click', function () {
      container.scrollBy({ left: step(), behavior: 'smooth' });
    });
  }

  try {
    var el = document.getElementById('reviews-data');
    if (el && el.textContent) data = JSON.parse(el.textContent);
  } catch (err) {}
  if (Array.isArray(data) && data.length) {
    render(data);
    setupReviewArrows();
  } else {
    var base = (document.currentScript && document.currentScript.src) ? document.currentScript.src.replace(/\/[^/]*$/, '/') : '';
    var url = base ? base + '../data/reviews-marek.json' : './assets/data/reviews-marek.json';
    fetch(url)
      .then(function (res) { return res.ok ? res.json() : Promise.reject(res); })
      .then(function (d) {
        render(d);
        setupReviewArrows();
      })
      .catch(function () {
        render(fallback);
        setupReviewArrows();
      });
  }
}

/**
 * Hlavní skript – mobilní menu, dropdown Nástroje, formulář
 * Spouští se po DOMContentLoaded i po načtení partials (partialsLoaded)
 */
function init() {
  // Mobilní menu
  var menuBtn = document.getElementById('mobile-menu-btn');
  var mobileMenu = document.getElementById('mobile-menu');
  if (menuBtn && mobileMenu) {
    function openMenu() {
      mobileMenu.classList.add('open');
      mobileMenu.setAttribute('aria-hidden', 'false');
      menuBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }
    function closeMenu() {
      mobileMenu.classList.remove('open');
      mobileMenu.setAttribute('aria-hidden', 'true');
      menuBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
    menuBtn.addEventListener('click', function () {
      mobileMenu.classList.contains('open') ? closeMenu() : openMenu();
    });
    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });
    var backdrop = mobileMenu.querySelector('[data-close-menu]');
    if (backdrop) backdrop.addEventListener('click', closeMenu);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) closeMenu();
    });
  }

  // Dropdown Nástroje (desktop)
  var toolsBtn = document.getElementById('nav-tools-btn');
  var toolsDropdown = document.getElementById('nav-tools-dropdown');
  if (toolsBtn && toolsDropdown) {
    toolsBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      toolsDropdown.classList.toggle('hidden');
    });
    document.addEventListener('click', function () {
      toolsDropdown.classList.add('hidden');
    });
  }

  // Formulář lead – POST /api/lead
  var leadForm = document.getElementById('lead-form-el');
  var leadSuccess = document.getElementById('lead-success');
  var leadError = document.getElementById('lead-error');
  if (leadForm && leadSuccess) {
    leadForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (leadError) leadError.classList.add('hidden');
      var btn = leadForm.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = 'Odesílám…'; }
      var fd = new FormData(leadForm);
      var payload = {
        _subject: 'Nezávazná konzultace – web',
        name: fd.get('name') || '',
        contact: fd.get('contact') || '',
        topic: fd.get('topic') || fd.get('message') || '',
        message: fd.get('message') || '',
        consent: fd.get('consent') ? 'ano' : 'ne',
        page: location.href,
        created_at: new Date().toISOString()
      };
      fetch('https://formsubmit.co/ajax/pribramsky@premiumbrokers.cz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          if (!res.ok) throw new Error('Network error');
          return res.json().catch(function () { return {}; });
        })
        .then(function () {
          leadForm.classList.add('hidden');
          leadSuccess.classList.remove('hidden');
        })
        .catch(function () {
          if (leadError) {
            leadError.textContent = 'Nepodařilo se odeslat. Zkuste to prosím znovu.';
            leadError.classList.remove('hidden');
          }
          if (btn) { btn.disabled = false; btn.textContent = 'Nezávazná konzultace'; }
        });
    });
  }

  // Footer – lead form (jméno, email required; telefon volitelné; select)
  var footerQuickLead = document.getElementById('footer-quick-lead');
  var footerMsg = document.getElementById('footer-lead-msg');
  var footerErr = document.getElementById('footer-lead-err');
  if (footerQuickLead) {
    footerQuickLead.addEventListener('submit', function (e) {
      e.preventDefault();
      var nameInp = document.getElementById('footer-name');
      var emailInp = document.getElementById('footer-email');
      var name = nameInp && nameInp.value.trim();
      var email = emailInp && emailInp.value.trim();
      if (footerErr) { footerErr.classList.add('hidden'); footerErr.textContent = ''; }
      if (!name) { if (footerErr) { footerErr.textContent = 'Vyplňte jméno.'; footerErr.classList.remove('hidden'); } return; }
      if (!email) { if (footerErr) { footerErr.textContent = 'Vyplňte e-mail.'; footerErr.classList.remove('hidden'); } return; }
      var btn = footerQuickLead.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = 'Odesílám…'; }
      var payload = {
        _subject: 'Nezávazná konzultace – footer',
        name: name,
        email: email,
        phone: (document.getElementById('footer-phone') && document.getElementById('footer-phone').value.trim()) || '',
        interest: (document.getElementById('footer-interest') && document.getElementById('footer-interest').value) || '',
        source: 'footer-lead',
        page: location.href,
        created_at: new Date().toISOString()
      };
      fetch('https://formsubmit.co/ajax/pribramsky@premiumbrokers.cz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          if (!res.ok) throw new Error('Network error');
          return res.json().catch(function () { return {}; });
        })
        .then(function () {
          footerQuickLead.reset();
          if (footerMsg) footerMsg.classList.remove('hidden');
          if (btn) { btn.disabled = false; btn.textContent = 'Odeslat'; }
        })
        .catch(function () {
          var mailto = 'mailto:pribramsky@premiumbrokers.cz?subject=Nezávazná konzultace&body=' + encodeURIComponent('Jméno: ' + name + '\nE-mail: ' + email + '\nTelefon: ' + (payload.phone || '-') + '\nZájem: ' + (payload.interest || '-'));
          window.location.href = mailto;
          if (footerMsg) footerMsg.classList.remove('hidden');
          if (btn) { btn.disabled = false; btn.textContent = 'Odeslat'; }
        });
    });
  }

  // Reference – Apple Watch tiles
  initReviewsSlider();

  // FAQ – switcher (bubble, hover + click)
  var faqSwitcher = document.querySelector('.faq-switcher[data-tabs]');
  if (faqSwitcher) {
    var faqTabs = [].slice.call(faqSwitcher.querySelectorAll('.faq-tab'));

    function setFaqActive(tab) {
      var idx = faqTabs.indexOf(tab);
      faqTabs.forEach(function (t) { t.classList.toggle('active', t === tab); });
      faqSwitcher.style.setProperty('--bubble-x', idx * 100 + '%');

      document.querySelectorAll('.faq-panel').forEach(function (p) { p.classList.remove('active'); });
      var panel = document.querySelector('.faq-panel[data-panel="' + tab.dataset.tab + '"]');
      if (panel) panel.classList.add('active');
    }

    faqTabs.forEach(function (t) {
      t.addEventListener('mouseenter', function () { setFaqActive(t); });
      t.addEventListener('click', function (e) { setFaqActive(e.currentTarget); });
    });

    var initTab = faqSwitcher.querySelector('.faq-tab.active') || faqTabs[0];
    if (initTab) setFaqActive(initTab);
  }

  // FAQ – otázky v panelu (klik jen přepíná obsah v boxu, žádný layout shift)
  document.querySelectorAll('.faq-panel').forEach(function (panel) {
    var qs = [].slice.call(panel.querySelectorAll('.faq-q'));

    function setQ(btn) {
      qs.forEach(function (b) { b.classList.toggle('active', b === btn); });
      panel.querySelectorAll('.faq-a').forEach(function (a) { a.classList.remove('active'); });
      var id = btn.dataset.answer;
      var el = panel.querySelector('#' + id);
      if (el) el.classList.add('active');
    }

    qs.forEach(function (b) {
      b.addEventListener('click', function () { setQ(b); });
    });
    var initQ = panel.querySelector('.faq-q.active') || qs[0];
    if (initQ) setQ(initQ);
  });

  var mainHeader = document.getElementById('main-header');
  if (mainHeader) {
    function updateHeaderVisibility() {
      var sy = window.scrollY;
      mainHeader.classList.toggle('visible', sy > 60);
    }
    window.addEventListener('scroll', updateHeaderVisibility, { passive: true });
    updateHeaderVisibility();
  }

  // Můj postup – spotlight mouse tracking
  var postupBento = document.getElementById('postup-bento');
  if (postupBento) {
    postupBento.onmousemove = function (e) {
      var cards = postupBento.getElementsByClassName('postup-item');
      for (var i = 0; i < cards.length; i++) {
        var rect = cards[i].getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        cards[i].style.setProperty('--mouse-x', x + 'px');
        cards[i].style.setProperty('--mouse-y', y + 'px');
      }
    };
  }

  // Scroll handlers – optimalizované s requestAnimationFrame throttling
  var scrollTicking = false;
  var sections = ['proc-ja', 'sluzby', 'spoluprace', 'moje-cesta', 'pobocky', 'reference', 'lead-form'];
  var processCards = document.querySelectorAll('.process-card');
  var processStack = document.querySelector('.process-stack');

  function updateActiveNav() {
    var scrollY = window.scrollY + 100;
    sections.forEach(function (id) {
      var el = document.getElementById(id);
      var link = document.querySelector('.nav-link[data-section="' + id + '"]');
      if (el && link) {
        var top = el.offsetTop;
        var height = el.offsetHeight;
        link.classList.toggle('bg-brand-cyan/10', scrollY >= top && scrollY < top + height);
        link.classList.toggle('text-brand-navy', scrollY >= top && scrollY < top + height);
      }
    });
  }

  function updateProcessStack() {
    if (!processStack || !processCards.length) return;
    var viewportMid = window.innerHeight * 0.4;
    processCards.forEach(function (card) {
      var cardRect = card.getBoundingClientRect();
      var isInView = cardRect.top < viewportMid && cardRect.bottom > 100;
      card.classList.toggle('stacked', isInView);
    });
  }

  function onScroll() {
    if (!scrollTicking) {
      window.requestAnimationFrame(function() {
        updateActiveNav();
        updateProcessStack();
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('load', function() {
    updateActiveNav();
    updateProcessStack();
  });

  // Scroll-reveal (IntersectionObserver)
  var revealEls = document.querySelectorAll('.scroll-reveal');
  if (revealEls.length && 'IntersectionObserver' in window) {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) e.target.classList.add('revealed');
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { revealObs.observe(el); });
  }

  // Služby – spotlight mouse tracking
  var sluzbySection = document.getElementById('sluzby');
  if (sluzbySection) {
    sluzbySection.addEventListener('mousemove', function(e) {
      var cards = sluzbySection.querySelectorAll('.sluzby-card-inner');
      for (var i = 0; i < cards.length; i++) {
        var r = cards[i].getBoundingClientRect();
        cards[i].style.setProperty('--sluzby-mx', (e.clientX - r.left) + 'px');
        cards[i].style.setProperty('--sluzby-my', (e.clientY - r.top) + 'px');
      }
    });
  }

  // Chart.js – projekce majetku (stejný graf jako osobni-web-finance-temp)
  var chartCanvas = document.getElementById('wealthChart');
  if (chartCanvas && typeof Chart !== 'undefined') {
    var ctx = chartCanvas.getContext('2d');
    var labels = ['Start', '2 roky', '4 roky', '6 let', '8 let', '10 let'];
    var averageData = [500000, 505000, 510000, 515000, 520000, 526000];
    var strategyData = [500000, 550000, 650000, 750000, 900000, 1100000];
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Strategie fondů',
            data: strategyData,
            borderColor: '#1D2354',
            backgroundColor: function(context) {
              var ctx = context.chart.ctx;
              var gradient = ctx.createLinearGradient(0, 0, 0, 300);
              gradient.addColorStop(0, 'rgba(29, 35, 84, 0.5)');
              gradient.addColorStop(1, 'rgba(29, 35, 84, 0)');
              return gradient;
            },
            borderWidth: 3,
            pointBackgroundColor: '#fff',
            pointBorderColor: '#1D2354',
            pointRadius: 5,
            fill: true,
            tension: 0.4
          },
          {
            label: 'Běžný účet',
            data: averageData,
            borderColor: '#f87171',
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [5, 5],
            pointBackgroundColor: '#f87171',
            pointRadius: 3,
            fill: false,
            tension: 0.2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(ctx) { return ctx.dataset.label + ': ' + ctx.parsed.y.toLocaleString('cs-CZ') + ' Kč'; }
            }
          }
        },
        scales: {
          y: {
            grid: { color: 'rgba(255,255,255,0.15)' },
            ticks: { font: { size: 10 }, color: 'rgba(255,255,255,0.8)', callback: function(v) { var s = v >= 1000000 ? (v / 1000000).toFixed(1).replace('.', ',') + ' mil' : (v / 1000) + ' tis.'; return s + ' Kč'; } }
          },
          x: {
            grid: { display: false },
            ticks: { font: { size: 10 }, color: 'rgba(255,255,255,0.8)' }
          }
        }
      }
    });
  }

  // Chart card – 3D tilt + mouse-follow glow
  var chartCard = document.querySelector('.chart-card-tilt');
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (chartCard && !reducedMotion) {
    chartCard.style.setProperty('--angle', '135deg');
    chartCard.addEventListener('mousemove', function (e) {
      var rect = chartCard.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      chartCard.style.setProperty('--x', x + 'px');
      chartCard.style.setProperty('--y', y + 'px');
      var centerX = rect.width / 2;
      var centerY = rect.height / 2;
      var rotateX = ((y - centerY) / centerY) * 8;
      var rotateY = ((x - centerX) / centerX) * -8;
      chartCard.style.transform = 'rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg)';
      chartCard.style.setProperty('--angle', (135 + rotateX - rotateY) + 'deg');
    });
    chartCard.addEventListener('mouseleave', function () {
      chartCard.style.transform = 'rotateX(0deg) rotateY(0deg)';
      chartCard.style.setProperty('--angle', '135deg');
    });
  }

}
document.addEventListener('DOMContentLoaded', function() {
  init();
  // Page wipe – po animaci skrýt overlay
  var wipe = document.getElementById('page-wipe');
  if (wipe) {
    wipe.addEventListener('animationend', function(e) {
      if (e.animationName !== 'pageWipeUp') return;
      wipe.style.display = 'none';
    }, { once: false });
  }
});

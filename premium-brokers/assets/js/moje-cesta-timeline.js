/**
 * Moje cesta – pinned timeline: křivka vlevo + bod po path (CSS offset-path), karta vpravo
 * Scroll ovládá progress 0→1, text se mění jen při změně segmentu
 */
(function () {
  var MILESTONES = [
    { year: '2013', title: 'První kroky v OVB', text: 'Během studia 5. ročníku na ekonomické VŠ jsem začal pracovat v OVB Allfinanz a.s.' },
    { year: '2015', title: 'Přestup do FINGO', text: 'Pochopení, že existují lepší možnosti – přestup do F&P Consulting s.r.o. (dnešní FINGO)' },
    { year: '2016', title: 'Fulltime v Broker Trust', text: 'Ukončení zaměstnání a přechod na fulltime režim do financí v Broker Trust a.s.' },
    { year: '2019', title: 'Založení Premium Brokers', text: 'Založení vlastní firmy Premium Brokers s.r.o. pod záštitou Beplan finanční plánování s.r.o.' },
    { year: '2021', title: 'Nové pobočky', text: 'Otevření nových poboček v Litoměřicích, Štětí a Praze k současné Roudnické' },
    { year: '2024', title: 'Premium Brokers Reality', text: 'Založení realitní kanceláře Premium Brokers Reality s.r.o.' },
    { year: '2026', title: 'Lovosice a tým', text: 'Otevření pobočky v Lovosicích, velké posílení týmu ve financích i realitách' }
  ];

  var PATH_D = 'M 100 20 Q 40 120 60 200 Q 80 280 100 350 Q 120 420 80 500 Q 60 560 100 580';
  var section, dotEl, glowEl, detailYear, detailTitle, detailText;
  var scrollTriggerInstance = null;
  var activeIndex = -1;

  function setActive(index) {
    if (index < 0 || index >= MILESTONES.length || index === activeIndex) return;
    activeIndex = index;
    var m = MILESTONES[index];
    if (detailYear) detailYear.textContent = m.year;
    if (detailTitle) detailTitle.textContent = m.title;
    if (detailText) detailText.textContent = m.text;
  }

  function initTimeline() {
    section = document.getElementById('moje-cesta');
    var desktop = document.getElementById('moje-cesta-desktop');
    if (!section || !desktop || window.innerWidth < 1024) return;

    dotEl = document.getElementById('timeline-dot-moving');
    glowEl = document.getElementById('timeline-active-glow');
    detailYear = document.getElementById('timeline-detail-year');
    detailTitle = document.getElementById('timeline-detail-title');
    detailText = document.getElementById('timeline-detail-text');

    if (!dotEl || !detailYear || !detailTitle || !detailText) return;

    setActive(0);

    if (glowEl) {
      glowEl.style.background = 'radial-gradient(circle, rgba(79,198,242,0.3) 0%, transparent 70%)';
    }

    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      dotEl.style.offsetDistance = '0%';
      return;
    }

    if (typeof gsap !== 'undefined' && gsap.registerPlugin) {
      gsap.registerPlugin(ScrollTrigger);
      scrollTriggerInstance = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        pin: true,
        scrub: 0.4,
        onUpdate: function (self) {
          var progress = self.progress;
          var pct = Math.min(100, Math.max(0, progress * 100));
          dotEl.style.offsetDistance = pct + '%';
          if (glowEl) glowEl.style.offsetDistance = pct + '%';

          var idx = Math.round(progress * (MILESTONES.length - 1));
          idx = Math.max(0, Math.min(idx, MILESTONES.length - 1));
          setActive(idx);
        }
      });
    } else {
      ScrollTrigger = { create: function () { return {}; } };
    }
  }

  function destroyTimeline() {
    if (scrollTriggerInstance) {
      scrollTriggerInstance.kill();
      scrollTriggerInstance = null;
    }
  }

  function checkAndInit() {
    var desktop = document.getElementById('moje-cesta-desktop');
    if (window.innerWidth >= 1024 && desktop) {
      initTimeline();
    } else {
      destroyTimeline();
    }
  }

  document.addEventListener('DOMContentLoaded', checkAndInit);
  window.addEventListener('resize', function () {
    clearTimeout(window._mcResize);
    window._mcResize = setTimeout(function () {
      destroyTimeline();
      checkAndInit();
    }, 150);
  });
})();

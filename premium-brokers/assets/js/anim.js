/**
 * Animace – fade-in při scrollu (optimalizované s requestAnimationFrame)
 */
function initFadeIn() {
  var ticking = false;
  function check() {
    document.querySelectorAll('.animate-fade-in-up:not(.visible)').forEach(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight - 50) {
        el.classList.add('visible');
      }
    });
  }
  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(function() {
        check();
        ticking = false;
      });
      ticking = true;
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('load', check);
  if (document.readyState === 'complete') check();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFadeIn);
} else {
  initFadeIn();
}

// Granite Hills Baseball - Main JavaScript

// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', function () {
  const hamburger = document.getElementById('hamburger');
  const mainNav = document.getElementById('mainNav');

  if (hamburger && mainNav) {
    hamburger.addEventListener('click', function () {
      mainNav.classList.toggle('open');
    });

    // Close nav when clicking a link (mobile)
    mainNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mainNav.classList.remove('open');
      });
    });
  }

  // ===== Scroll Reveal Animations =====
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    // Fallback: just show everything
    revealEls.forEach(function (el) { el.classList.add('visible'); });
  }

  // ===== Count-up Animation for Stat Numbers =====
  const countEls = document.querySelectorAll('.count-up');
  if (countEls.length && 'IntersectionObserver' in window) {
    const countObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          countObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    countEls.forEach(function (el) { countObserver.observe(el); });
  }
});

// Count-up helper: animates numeric content toward its final value.
// Supports integers, decimals, and strings with suffixes like "+".
function animateCount(el) {
  const target = el.getAttribute('data-target');
  if (!target) return;
  const isDecimal = target.indexOf('.') !== -1;
  const suffix = el.getAttribute('data-suffix') || '';
  const num = parseFloat(target);
  if (isNaN(num)) return;
  const duration = 1200;
  const startTime = performance.now();

  function tick(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    // ease-out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = num * eased;
    el.textContent = (isDecimal ? current.toFixed(num < 10 ? 3 : 2) : Math.round(current)) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = target + suffix;
  }
  requestAnimationFrame(tick);
}

// Contact Form Handler
function handleContact(e) {
  e.preventDefault();
  var form = document.getElementById('contactForm');
  var name = form.querySelector('#name').value;
  alert('Thanks, ' + name + '! Your message has been sent. We\'ll get back to you soon.');
  form.reset();
  return false;
}

// Header: compacts and goes more opaque once the page is scrolled
(function () {
  var header = document.querySelector('.site-header');
  if (!header) return;
  var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 40); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

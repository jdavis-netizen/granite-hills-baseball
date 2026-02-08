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
});

// Contact Form Handler
function handleContact(e) {
  e.preventDefault();
  var form = document.getElementById('contactForm');
  var name = form.querySelector('#name').value;
  alert('Thanks, ' + name + '! Your message has been sent. We\'ll get back to you soon.');
  form.reset();
  return false;
}

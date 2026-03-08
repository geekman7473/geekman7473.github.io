const header = document.querySelector('.site-header');
const toggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelectorAll('.site-nav a');
const year = document.querySelector('#year');

if (year) {
  year.textContent = new Date().getFullYear();
}

if (toggle && header) {
  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    header.classList.toggle('nav-open', !expanded);
  });

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      toggle.setAttribute('aria-expanded', 'false');
      header.classList.remove('nav-open');
    });
  });
}

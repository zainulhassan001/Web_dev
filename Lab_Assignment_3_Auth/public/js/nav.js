const btn = document.getElementById('hamburgerBtn');
const navLinks = document.querySelector('.nav-links');

if (btn && navLinks) {
  btn.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    btn.classList.toggle('active', isOpen);
    btn.setAttribute('aria-expanded', isOpen);
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      btn.classList.remove('active');
      btn.setAttribute('aria-expanded', false);
    });
  });
}

const notifBtn = document.getElementById('notifBtn');
const notifMenu = document.getElementById('notifMenu');
if (notifBtn && notifMenu) {
  notifBtn.addEventListener('click', (e) => {
    e.preventDefault();
    notifMenu.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (!notifMenu.contains(e.target) && !notifBtn.contains(e.target)) {
      notifMenu.classList.remove('open');
    }
  });
}

const button = document.querySelector('.menu-toggle');
const nav = document.querySelector('#main-nav');
const menuLabel = button?.querySelector('.sr-only');

const setMenuState = open => {
  button?.setAttribute('aria-expanded', String(open));
  nav?.classList.toggle('open', open);
  if (menuLabel) menuLabel.textContent = open ? 'Close menu' : 'Open menu';
};

button?.addEventListener('click', () => {
  const open = button.getAttribute('aria-expanded') === 'true';
  setMenuState(!open);
});

nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  setMenuState(false);
}));

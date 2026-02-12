function updateLogo(theme) {
  const main = document.getElementById('volt-logo');
  if (main) {
    main.src = theme === 'dark' ? 'Volt Logo_white.png' : 'Volt Logo Purple.png';
    main.alt = theme === 'dark' ? 'Volt-Logo hell' : 'Volt-Logo dunkel';
  }
  const rot = document.getElementById('rotate-logo');
  if (rot) {
    rot.src = 'Volt Logo_white.png';
    rot.alt = 'Volt-Logo hell';
  }
}

const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const stored = localStorage.getItem('theme');
const effectiveTheme = stored || (prefersDark ? 'dark' : 'light');
document.documentElement.setAttribute('data-theme', effectiveTheme);
updateLogo(effectiveTheme);
window.updateLogo = updateLogo;

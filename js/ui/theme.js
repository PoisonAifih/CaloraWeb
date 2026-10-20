// Theme preference: 'system' (default), 'light' or 'dark'.
// The inline script in <head> applies the saved choice before first paint; this module handles changes.

const KEY = 'calora-theme';
const media = window.matchMedia('(prefers-color-scheme: dark)');

export function getThemePref() {
  try {
    const value = localStorage.getItem(KEY);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    return 'system';
  }
}

export function isDarkTheme() {
  const pref = getThemePref();
  return pref === 'dark' || (pref === 'system' && media.matches);
}

function apply() {
  const pref = getThemePref();
  if (pref === 'system') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.dataset.theme = pref;
  const dark = isDarkTheme();
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#121511' : '#fafaf5');
  document.querySelectorAll('[data-theme-toggle] i').forEach(icon => {
    icon.className = `ph ${dark ? 'ph-sun' : 'ph-moon'}`;
  });
  document.querySelectorAll('[data-theme-toggle]').forEach(button => {
    button.setAttribute('aria-label', dark ? 'Mode terang' : 'Mode gelap');
  });
  document.querySelectorAll('[data-theme-choice]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.themeChoice === pref));
  });
  document.dispatchEvent(new CustomEvent('theme:changed', { detail: { dark } }));
}

export function setThemePref(pref) {
  try {
    if (pref === 'system') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, pref);
  } catch {}
  apply();
}

export function toggleTheme() {
  setThemePref(isDarkTheme() ? 'light' : 'dark');
}

/** Reads a colour token so canvas-drawn charts follow the theme. */
export function themeColor(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function initTheme() {
  media.addEventListener('change', () => { if (getThemePref() === 'system') apply(); });
  document.addEventListener('click', event => {
    if (event.target.closest('[data-theme-toggle]')) toggleTheme();
    const choice = event.target.closest('[data-theme-choice]');
    if (choice) setThemePref(choice.dataset.themeChoice);
  });
  apply();
}

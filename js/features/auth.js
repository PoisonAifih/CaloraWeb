import { state } from '../state.js';
import { _rawSwitchTab, tabFromPath } from '../ui/router.js';
import { showToast } from '../ui/toast.js';
import { updateNavUserDisplay } from '../ui/nav.js';
import { renderDashboardOverview, syncAdaptiveDashboard } from './dashboard.js';
import { openScannedMenu, renderFoodLog, syncRemoteFoodLogs } from './nutrition.js';
import { syncWebhookWorkouts } from './workout.js';

// Admin accounts only use the catering console, not the personal tracker.
function redirectAdmin(user) {
  if (user?.role !== 'ADMIN') return false;
  location.replace('/admin');
  return true;
}

export function openPendingMenu() {
  const menuId = state.pendingMenuId;
  if (!menuId) return;
  if (!state.currentUser) return openLoginOverlay();
  state.pendingMenuId = null;
  openScannedMenu(menuId);
}

function applyAuthenticatedUser(user) {
  state.setCurrentUser(user.name, user.id, user.role);
  if (user.profile) state.setBodyStats(user.profile);
  updateNavUserDisplay();
}

export async function checkAuth() {
  try {
    const response = await fetch('/api/session');
    if (response.ok) {
      const { user } = await response.json();
      if (redirectAdmin(user)) return true;
      applyAuthenticatedUser(user);
      await syncAdaptiveDashboard();
      const next = tabFromPath();
      _rawSwitchTab(next, true);
      return true;
    }
  } catch {}
  state.setCurrentUser(null, null, null);
  const next = tabFromPath();
  _rawSwitchTab(next, true);
  return false;
}

export function closeLoginOverlay() {
  document.getElementById('pin-lock-overlay')?.classList.remove('open', 'unlocking');
}

export function openLoginOverlay() {
  document.getElementById('login-error-msg').textContent = '';
  document.getElementById('login-username').value = '';
  document.getElementById('login-password').value = '';
  setPasswordVisible(false);
  document.getElementById('pin-lock-overlay')?.classList.add('open');
  setTimeout(() => document.getElementById('login-username')?.focus(), 100);
}

function setPasswordVisible(visible) {
  const input = document.getElementById('login-password');
  const button = document.querySelector('.login-eye');
  if (input) input.type = visible ? 'text' : 'password';
  if (button) {
    button.setAttribute('aria-pressed', String(visible));
    button.setAttribute('aria-label', visible ? 'Sembunyikan password' : 'Tampilkan password');
    button.innerHTML = `<i class="ph ${visible ? 'ph-eye-slash' : 'ph-eye'}" aria-hidden="true"></i>`;
  }
}

export function togglePasswordVisibility() {
  setPasswordVisible(document.getElementById('login-password')?.type === 'password');
}

export function loginComingSoon(feature) {
  showToast(`${feature} belum tersedia`, 'info');
}

export async function submitLogin(event) {
  event?.preventDefault();
  const usernameInput = document.getElementById('login-username');
  const passwordInput = document.getElementById('login-password');
  const button = document.getElementById('login-unlock-btn');
  const error = document.getElementById('login-error-msg');
  const username = usernameInput?.value.trim();
  if (!username || !passwordInput?.value || button.disabled) return;
  button.disabled = true;
  button.textContent = 'Masuk…';
  error.textContent = '';
  try {
    const response = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: passwordInput.value })
    });
    let payload = {};
    try { payload = await response.json(); } catch { payload = {}; }
    if (!response.ok) throw new Error(response.status === 401 ? 'Username atau password salah' : payload.error || 'Tidak bisa masuk');
    if (redirectAdmin(payload.user)) return;
    applyAuthenticatedUser(payload.user);
    document.getElementById('pin-lock-overlay')?.classList.remove('open');
    _rawSwitchTab(state.pendingTab || 'dashboard');
    await Promise.all([syncRemoteFoodLogs(), syncWebhookWorkouts()]);
    await syncAdaptiveDashboard();
    renderFoodLog();
    renderDashboardOverview();
    showToast(`Halo, ${payload.user.name}`, 'success');
    openPendingMenu();
  } catch (loginError) {
    passwordInput.value = '';
    error.textContent = loginError instanceof TypeError ? 'Server tidak berjalan' : loginError.message;
  } finally {
    button.disabled = false;
    button.textContent = 'Masuk';
  }
}

export async function lockApp() {
  try { await fetch('/api/session', { method: 'DELETE' }); } catch {}
  state.setCurrentUser(null, null, null);
  state.pendingTab = 'dashboard';
  updateNavUserDisplay();
  _rawSwitchTab('dashboard');
  showToast('Logged out', 'info');
}

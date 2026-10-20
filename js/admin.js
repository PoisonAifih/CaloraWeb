import { initTheme } from './ui/theme.js';

const content = document.getElementById('admin-content');
const signOut = document.getElementById('admin-signout');
const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[character]));
const MEAL_LABELS = { BREAKFAST:'Breakfast', LUNCH:'Lunch', DINNER:'Dinner', SNACK:'Snack' };
const TITLES = { kitchen:"Tomorrow's Kitchen", menus:'Menus', qr:'Menu QR codes' };

let menus = [];

async function api(path, options = {}) {
  const response = await fetch(path, { ...options, headers: { 'Content-Type':'application/json', ...(options.headers || {}) } });
  let payload = null;
  try { payload = await response.json(); } catch {}
  if (!response.ok) throw new Error(payload?.error || payload?.message || `Request failed (${response.status})`);
  return payload;
}

async function loadMenus() {
  menus = await api('/api/admin/menus');
  renderMenus();
  renderQrCodes();
}

async function loadDashboard() {
  const response = await fetch('/api/admin/dashboard');
  // Admins sign in on the main login; anyone else goes back to the app.
  if (!response.ok) {
    location.replace('/');
    return false;
  }
  const data = await response.json();
  content.hidden = false;
  await loadMenus();
  const menuNames = new Map(menus.map(menu => [menu.id, menu.name]));
  const labels = { tomorrowOrders:'Tomorrow orders', confirmedPlans:'Confirmed', awaitingReview:'Awaiting review', lunchPortions:'Lunch portions' };
  document.getElementById('admin-metrics').innerHTML = Object.entries(data.metrics).map(([key,value]) => `<div><span>${escapeHtml(labels[key] || key)}</span><strong>${value}</strong></div>`).join('');
  document.getElementById('admin-plan-rows').innerHTML = data.plans.map(plan => {
    const lunch = plan.meals.find(meal => meal.mealType === 'LUNCH');
    const lunchName = lunch?.menuId ? menuNames.get(lunch.menuId) || lunch.menuId : '—';
    return `<tr><td>${escapeHtml(plan.userName)}<small>${escapeHtml(plan.dietaryPreference)}${plan.allergies ? ` · Allergy: ${escapeHtml(plan.allergies)}` : ''}</small></td><td>${plan.effectiveDailyTarget} kcal</td><td>${plan.cateringAllocation} kcal</td><td>${escapeHtml(lunchName)}</td><td>${escapeHtml((plan.explanationCodes || []).join(', '))}</td><td><select data-plan-id="${escapeHtml(plan.id)}"><option>${escapeHtml(plan.status)}</option>${['DRAFT','CONFIRMED','LOCKED','FULFILLED','CANCELLED'].filter(value => value !== plan.status).map(value => `<option>${value}</option>`).join('')}</select></td></tr>`;
  }).join('') || '<tr><td colspan="6">No lunch plans for tomorrow.</td></tr>';
  document.querySelectorAll('[data-plan-id]').forEach(select => select.addEventListener('change', async () => {
    try {
      await api(`/api/admin/plans/${encodeURIComponent(select.dataset.planId)}/status`, { method:'PUT', body:JSON.stringify({ status:select.value }) });
    } catch (updateError) { alert(updateError.message || 'Status update failed'); }
  }));
  return true;
}

// ── Views ────────────────────────────────────────────────────────────────────
function showView(view) {
  document.querySelectorAll('.admin-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.view === view));
  document.querySelectorAll('.admin-view').forEach(section => { section.hidden = section.id !== `view-${view}`; });
  document.getElementById('admin-title').textContent = TITLES[view];
  try { localStorage.setItem('calora-admin-view', view); } catch {}
}

document.querySelectorAll('.admin-tab').forEach(tab => tab.addEventListener('click', () => showView(tab.dataset.view)));

// ── Menus ────────────────────────────────────────────────────────────────────
const menuForm = document.getElementById('menu-form');
const field = id => document.getElementById(id);

function nutritionLine(menu) {
  return `${Math.round(menu.calories)} kcal · P ${menu.proteinG} g · C ${menu.carbsG} g · F ${menu.fatG} g`;
}

function renderMenus() {
  document.getElementById('menu-rows').innerHTML = menus.map(menu => {
    const allergens = (menu.allergens || []).join(', ');
    const diet = (menu.dietaryTags || []).filter(tag => tag !== 'none').join(', ');
    return `<tr class="${menu.active ? '' : 'is-inactive'}">
      <td><code>${escapeHtml(menu.id)}</code></td>
      <td>${escapeHtml(menu.name)}<small>${escapeHtml(menu.servingSize)}${allergens ? ` · Allergens: ${escapeHtml(allergens)}` : ''}${diet ? ` · ${escapeHtml(diet)}` : ''}</small></td>
      <td>${escapeHtml(MEAL_LABELS[menu.mealType] || menu.mealType)}</td>
      <td>${escapeHtml(nutritionLine(menu))}</td>
      <td>${menu.inventoryAvailable}</td>
      <td>${menu.active ? 'Active' : 'Inactive'}</td>
      <td class="row-actions"><button type="button" class="btn btn-ghost btn-sm" data-edit="${escapeHtml(menu.id)}">Edit</button><button type="button" class="btn btn-ghost btn-sm" data-toggle="${escapeHtml(menu.id)}">${menu.active ? 'Deactivate' : 'Activate'}</button></td>
    </tr>`;
  }).join('') || '<tr><td colspan="7">No menus yet. Register one above.</td></tr>';
}

function resetMenuForm() {
  menuForm.reset();
  field('menu-id').value = '';
  field('menu-form-title').textContent = 'Register a menu';
  field('menu-save').textContent = 'Register menu';
  field('menu-cancel').hidden = true;
  field('menu-error').textContent = '';
}

function editMenu(menu) {
  field('menu-id').value = menu.id;
  field('menu-name').value = menu.name;
  field('menu-meal').value = menu.mealType;
  field('menu-serving').value = menu.servingSize;
  field('menu-kcal').value = menu.calories;
  field('menu-p').value = menu.proteinG;
  field('menu-c').value = menu.carbsG;
  field('menu-f').value = menu.fatG;
  field('menu-stock').value = menu.inventoryAvailable;
  field('menu-allergens').value = (menu.allergens || []).join(', ');
  document.querySelectorAll('input[name="menu-diet"]').forEach(box => { box.checked = (menu.dietaryTags || []).includes(box.value); });
  field('menu-active').checked = menu.active;
  field('menu-form-title').textContent = `Edit ${menu.id}`;
  field('menu-save').textContent = 'Save changes';
  field('menu-cancel').hidden = false;
  field('menu-error').textContent = '';
  menuForm.scrollIntoView({ behavior:'smooth', block:'start' });
  field('menu-name').focus({ preventScroll:true });
}

menuForm.addEventListener('submit', async event => {
  event.preventDefault();
  const id = field('menu-id').value;
  const body = {
    name: field('menu-name').value,
    mealType: field('menu-meal').value,
    servingSize: field('menu-serving').value,
    calories: Number(field('menu-kcal').value),
    proteinG: Number(field('menu-p').value || 0),
    carbsG: Number(field('menu-c').value || 0),
    fatG: Number(field('menu-f').value || 0),
    inventoryAvailable: Number(field('menu-stock').value || 0),
    allergens: field('menu-allergens').value,
    dietaryTags: [...document.querySelectorAll('input[name="menu-diet"]:checked')].map(box => box.value),
    active: field('menu-active').checked
  };
  const button = field('menu-save');
  button.disabled = true;
  try {
    await api(id ? `/api/admin/menus/${encodeURIComponent(id)}` : '/api/admin/menus', { method: id ? 'PUT' : 'POST', body: JSON.stringify(body) });
    resetMenuForm();
    await loadMenus();
  } catch (saveError) {
    field('menu-error').textContent = saveError.message;
  } finally {
    button.disabled = false;
  }
});

field('menu-cancel').addEventListener('click', resetMenuForm);

document.getElementById('menu-rows').addEventListener('click', async event => {
  const editId = event.target.closest('[data-edit]')?.dataset.edit;
  const toggleId = event.target.closest('[data-toggle]')?.dataset.toggle;
  if (editId) editMenu(menus.find(menu => menu.id === editId));
  if (toggleId) {
    const menu = menus.find(item => item.id === toggleId);
    try {
      await api(`/api/admin/menus/${encodeURIComponent(toggleId)}`, { method:'PUT', body:JSON.stringify({ active: !menu.active }) });
      await loadMenus();
    } catch (toggleError) { alert(toggleError.message); }
  }
});

// ── QR codes ─────────────────────────────────────────────────────────────────
function qrUrl(menu) {
  return `/api/admin/menus/${encodeURIComponent(menu.id)}/qr.svg?base=${encodeURIComponent(location.origin)}`;
}

function renderQrCodes() {
  const filter = field('qr-filter').value;
  const list = menus.filter(menu => menu.active && (!filter || menu.mealType === filter));
  field('qr-grid').innerHTML = list.map(menu => `<article class="qr-card">
      <img src="${qrUrl(menu)}" alt="QR code for ${escapeHtml(menu.name)}" width="220" height="220" loading="lazy">
      <p class="qr-meal">${escapeHtml(MEAL_LABELS[menu.mealType] || menu.mealType)} · <code>${escapeHtml(menu.id)}</code></p>
      <h3>${escapeHtml(menu.name)}</h3>
      <p class="qr-nutrition">${escapeHtml(nutritionLine(menu))}</p>
      <p class="qr-scan">Scan to log in Calora</p>
      <a class="btn btn-ghost btn-sm qr-download" href="${qrUrl(menu)}" download="calora-${escapeHtml(menu.id)}.svg">Download SVG</a>
    </article>`).join('') || '<p class="admin-note">No active menus. Register one on the Menus page.</p>';
}

field('qr-filter').addEventListener('change', renderQrCodes);

// ── Session ──────────────────────────────────────────────────────────────────
signOut.addEventListener('click', async () => {
  try { await fetch('/api/session', { method:'DELETE' }); } catch {}
  location.replace('/');
});

let initialView = 'kitchen';
try { initialView = localStorage.getItem('calora-admin-view') || 'kitchen'; } catch {}
showView(TITLES[initialView] ? initialView : 'kitchen');
initTheme();
loadDashboard();

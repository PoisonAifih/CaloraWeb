// Catering

import { requireAuth } from '../ui/guest.js';
import { state as appState } from '../state.js';

const KEY = 'calora-catering';

const PACKAGES = [
  { id: 'p1', name: 'Package 1', title: 'Healthy Weight Loss', kcal: 429, weekly: 40 },
  { id: 'p2', name: 'Package 2', title: 'High Protein Muscle Building', kcal: 634, weekly: 50 }
];

const TOPUPS = [
  { id: 't20', tokens: 20, unit: 25000, total: 500000 },
  { id: 't40', tokens: 40, unit: 24000, total: 960000, list: 1000000, save: 40000, badge: 'Hemat 4%' },
  { id: 't60', tokens: 60, unit: 23000, total: 1380000, list: 1500000, save: 120000, badge: 'Paling Hemat! Diskon 8%', best: true }
];

const WEEKS = [1, 2, 4];

const MEAL_LABELS = { BREAKFAST: 'Sarapan', LUNCH: 'Makan siang', DINNER: 'Makan malam', SNACK: 'Camilan' };

let sheet = null;
let bound = false;
let menus = null;
let menusLoading = false;

async function loadMenus() {
  if (menus || menusLoading) return;
  menusLoading = true;
  try {
    const response = await fetch('/api/menus');
    if (response.ok) menus = await response.json();
  } catch {}
  menusLoading = false;
  if (menus) renderCatering();
}

function menusHtml() {
  if (!menus) return '<p class="catering-menus-empty">Memuat menu…</p>';
  if (!menus.length) return '<p class="catering-menus-empty">Belum ada menu aktif.</p>';
  return `<div class="catering-menus">${menus.map(menu => `
    <article class="catering-menu">
      <div class="catering-menu-top">
        <span class="catering-menu-meal">${escapeHtml(MEAL_LABELS[menu.mealType] || menu.mealType)}</span>
        <span class="catering-menu-kcal">${Math.round(menu.calories)} kcal</span>
      </div>
      <h3>${escapeHtml(menu.name)}</h3>
      <div class="catering-menu-chips">
        <span>Protein ${Math.round(menu.proteinG)}g</span>
        <span>Karbo ${Math.round(menu.carbsG)}g</span>
        <span>Lemak ${Math.round(menu.fatG)}g</span>
      </div>
    </article>`).join('')}</div>`;
}

function load() {
  const fallback = {
    balance: 20,
    packageId: 'p1',
    endsAt: '2026-10-28',
    topupId: 't60',
    weeks: 1
  };
  try {
    return { ...fallback, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return fallback;
  }
}

function save(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function getTokenBalance() {
  return load().balance;
}

function rupiah(value) {
  return `Rp ${Number(value).toLocaleString('id-ID')}`;
}

function longDate(iso) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function daysLeft(iso) {
  const end = new Date(`${iso}T12:00:00`);
  const now = new Date();
  now.setHours(12, 0, 0, 0);
  return Math.max(0, Math.round((end - now) / 86400000));
}

function addDays(iso, days) {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function packById(id) {
  return PACKAGES.find(item => item.id === id) || PACKAGES[0];
}

function topupById(id) {
  return TOPUPS.find(item => item.id === id) || TOPUPS[2];
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function pageHtml(state) {
  const pack = packById(state.packageId);
  const left = daysLeft(state.endsAt);
  const active = left > 0;
  return `
    <section class="catering-page">
      <header class="catering-head">
        <h1 class="editorial">Catering</h1>
        <p>Tukar token dengan paket menu mingguan</p>
      </header>
      <article class="catering-card catering-balance">
        <div>
          <p class="catering-kicker">Sisa token saya</p>
          <div class="catering-token-row">
            <span class="catering-token-mark">T</span>
            <span class="catering-token-num">${state.balance}</span>
            <span class="catering-token-unit">Token</span>
          </div>
          <p class="catering-note">Paket 7 hari mulai 40 Token</p>
        </div>
        <button class="btn btn-fill" type="button" data-open="topup">+ Top Up Token</button>
      </article>
      <article class="catering-card">
        <div class="catering-status">
          <span class="catering-dot"></span>
          <p class="catering-kicker">${active ? 'Langganan aktif' : 'Langganan berakhir'}</p>
        </div>
        <p class="catering-end-label">Berakhir pada</p>
        <p class="catering-end-date">${escapeHtml(longDate(state.endsAt))}</p>
        <div class="catering-pills">
          <span class="catering-pill">${escapeHtml(pack.name)} · ${escapeHtml(pack.title)}</span>
          <span class="catering-pill">Sisa ${left} hari</span>
        </div>
        <button class="btn btn-fill catering-wide" type="button" data-open="redeem">Tukarkan ${pack.weekly} Token</button>
      </article>
      <h2 class="editorial catering-section-title">Katalog paket 7 hari</h2>
      <div class="catering-catalog">
        ${PACKAGES.map(item => `
          <button class="catering-pack${item.id === state.packageId ? ' is-selected' : ''}" type="button" data-pack="${item.id}">
            <strong>${escapeHtml(item.name)}</strong>
            <span>${escapeHtml(item.title)}</span>
            <small>${item.weekly} Token</small>
          </button>
        `).join('')}
      </div>
      <h2 class="editorial catering-section-title">Menu yang tersedia</h2>
      ${menusHtml()}
    </section>
    ${topupHtml(state)}
    ${redeemHtml(state)}
  `;
}

function choiceMark(selected) {
  return `<span class="catering-radio" aria-hidden="true"></span>`;
}

function topupHtml(state) {
  const picked = topupById(state.topupId);
  return `
    <div class="catering-sheet${sheet === 'topup' ? ' open' : ''}" data-sheet="topup">
      <div class="catering-sheet-card" role="dialog" aria-labelledby="topup-title">
        <div class="catering-grab"></div>
        <h2 class="editorial catering-sheet-title" id="topup-title">Top up token</h2>
        <p class="catering-sheet-copy">Token dipakai untuk menukar paket menu mingguan. Paket lebih besar lebih hemat per token.</p>
        ${TOPUPS.map(item => `
          <button class="catering-choice${item.best ? ' is-best' : ''}${item.id === state.topupId ? ' is-selected' : ''}" type="button" data-topup="${item.id}">
            ${item.best ? '<span class="catering-flag">BEST VALUE</span>' : ''}
            ${choiceMark(item.id === state.topupId)}
            <span class="catering-choice-main">
              <strong>${item.tokens} Token</strong>
              <em>${rupiah(item.unit)} / token</em>
              ${item.badge ? `<span class="catering-badge${item.best ? ' is-best' : ''}">${escapeHtml(item.badge)}</span>` : ''}
            </span>
            <span class="catering-choice-price">
              ${item.list ? `<s>${rupiah(item.list)}</s>` : ''}
              <b>${rupiah(item.total)}</b>
              ${item.save ? `<span class="catering-save">Hemat ${rupiah(item.save)}</span>` : ''}
            </span>
          </button>
        `).join('')}
        <div class="catering-info">Saldo setelah top up: ${state.balance + picked.tokens} Token. Metode bayar: QRIS.</div>
        <div class="catering-actions">
          <button class="btn btn-fill catering-wide" type="button" data-pay>Bayar ${rupiah(picked.total)}</button>
          <button class="btn btn-ghost catering-wide" type="button" data-close>Batal</button>
        </div>
      </div>
    </div>
  `;
}

function redeemHtml(state) {
  const pack = packById(state.packageId);
  const cost = pack.weekly * state.weeks;
  const after = state.balance - cost;
  const short = after < 0;
  const nextEnd = addDays(state.endsAt, state.weeks * 7);
  return `
    <div class="catering-sheet${sheet === 'redeem' ? ' open' : ''}" data-sheet="redeem">
      <div class="catering-sheet-card" role="dialog" aria-labelledby="redeem-title">
        <div class="catering-grab"></div>
        <h2 class="editorial catering-sheet-title" id="redeem-title">Tukarkan token</h2>
        <p class="catering-sheet-copy">Masa aktif saat ini sampai ${escapeHtml(longDate(state.endsAt))}.</p>
        <p class="catering-label">PAKET</p>
        ${PACKAGES.map(item => `
          <button class="catering-choice${item.id === state.packageId ? ' is-selected' : ''}" type="button" data-pack="${item.id}">
            ${choiceMark(item.id === state.packageId)}
            <span class="catering-choice-main">
              <strong>${escapeHtml(item.name)} · ${escapeHtml(item.title)}</strong>
              <em>${item.kcal} kcal rata-rata per meal</em>
            </span>
            <b>${item.weekly} Token/mgg</b>
          </button>
        `).join('')}
        <p class="catering-label">DURASI</p>
        ${WEEKS.map(weeks => `
          <button class="catering-choice${weeks === state.weeks ? ' is-selected' : ''}" type="button" data-weeks="${weeks}">
            ${choiceMark(weeks === state.weeks)}
            <span class="catering-choice-main"><strong>${weeks} minggu</strong></span>
            <b>${pack.weekly * weeks} Token</b>
          </button>
        `).join('')}
        <div class="catering-summary">
          <div><span>Sisa Token Saat Ini</span><b>${state.balance} Token</b></div>
          <div><span>Token yang Dibutuhkan</span><b>${cost} Token</b></div>
          <div class="${short ? 'is-short' : ''}"><span>Sisa Setelah Transaksi</span><b>${short ? `Kurang ${Math.abs(after)} Token` : `${after} Token`}</b></div>
        </div>
        <div class="catering-address">
          <i class="ph ph-map-pin" aria-hidden="true"></i>
          <div>
            <strong>Dikirim ke · Rumah</strong>
            <div>Jl. Sudirman No. 45, Jakarta Selatan</div>
          </div>
        </div>
        <p class="catering-info">Langganan baru berakhir pada ${escapeHtml(longDate(nextEnd))}. Alamat diubah di Other. ${short ? 'Token belum cukup, Anda akan diarahkan ke Top Up.' : 'Token cukup untuk penukaran ini.'}</p>
        <div class="catering-actions">
          <button class="btn btn-fill catering-wide" type="button" data-redeem>Tukarkan ${cost} Token</button>
          <button class="btn btn-ghost catering-wide" type="button" data-close>Batal</button>
        </div>
      </div>
    </div>
  `;
}

export function renderCatering() {
  const root = document.getElementById('catering-root');
  if (!root) return;
  const state = load();
  root.innerHTML = pageHtml(state);
  if (appState.currentUser) loadMenus();
  if (bound) return;
  bound = true;
  root.addEventListener('click', event => {
    const current = load();
    const open = event.target.closest('[data-open]');
    const pack = event.target.closest('[data-pack]');
    const topup = event.target.closest('[data-topup]');
    const weeks = event.target.closest('[data-weeks]');
    const close = event.target.closest('[data-close]');
    const sheetEl = event.target.closest('.catering-sheet');
    if (open) {
      if (!requireAuth(event)) return;
      sheet = open.dataset.open;
    } else if (pack) {
      current.packageId = pack.dataset.pack;
      save(current);
    } else if (topup) {
      current.topupId = topup.dataset.topup;
      save(current);
    } else if (weeks) {
      current.weeks = Number(weeks.dataset.weeks);
      save(current);
    } else if (event.target.closest('[data-pay]')) {
      const picked = topupById(current.topupId);
      current.balance += picked.tokens;
      save(current);
      sheet = null;
    } else if (event.target.closest('[data-redeem]')) {
      const chosen = packById(current.packageId);
      const cost = chosen.weekly * current.weeks;
      if (current.balance < cost) {
        sheet = 'topup';
      } else {
        current.balance -= cost;
        current.endsAt = addDays(current.endsAt, current.weeks * 7);
        save(current);
        sheet = null;
      }
    } else if (close || (sheetEl && event.target === sheetEl)) {
      sheet = null;
    } else {
      return;
    }
    if (pack || topup || weeks) save(current);
    renderCatering();
  });
}

// ==========================================================================
// FITVAULT — Dashboard Renderer
//
// Called by: router.js (on tab switch), main.js (on auth/data events), auth.js (after login)
//
// ELEMENT ID MAP (index.html #tab-dashboard):
//   Greeting row:         #dash-greeting, #home-avatar, #home-token-balance
//   Calorie ring card:    #dash-kcal-consumed, #dash-kcal-target, #home-ring-fill,
//                         #dash-tile-remaining, #home-remaining-pill
//   Macro progress bars:  #dash-p-val/#dash-p-fill, #dash-c-val/#dash-c-fill,
//                         #dash-f-val/#dash-f-fill
//   Tomorrow's catering:  #catering-date, #catering-lunch, #catering-lunch-meta,
//                         #catering-lunch-macros, #catering-explanations
//   Training hero card:   #dash-wk-sessions, #dash-wk-sets, #dash-wk-duration,
//                         #dash-wk-exercises, #dash-last-session-label
//   Stat tiles:           #dash-tile-last-session, #dash-tile-last-session-sub,
//                         #dash-tile-sets
//   Preview lists:        #dash-food-preview, #dash-workout-preview
//
// IMPORTANT: All element IDs above must exist in index.html or their update is silently skipped.
// ==========================================================================

import { state } from '../state.js';
import { esc, getWorkoutTimestamp } from '../utils.js';
import { calculateDailyNutritionState, calculateNutritionTargets } from '../domain/nutrition.mjs';
import { getTokenBalance } from './catering.js';
import { showToast } from '../ui/toast.js';

function initials(name) {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'C';
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

export function showNotifications() {
  showToast('Belum ada notifikasi', 'info');
}

export async function syncAdaptiveDashboard() {
  if (!state.currentUser) return;
  try {
    const response = await fetch('/api/dashboard');
    if (!response.ok) return;
    state.setDashboard(await response.json());
  } catch (error) {
    console.warn('[CALORA] Dashboard sync skipped:', error.message);
  }
}

// ── MAIN RENDER FUNCTION ──────────────────────────────────────────────────────
// Safe to call at any time — all DOM lookups are guarded with null checks.
export function renderDashboardOverview() {
  // ── GREETING ROW ──────────────────────────────────────────────────────────
  const name = state.currentUser || '';
  const greetingEl = document.getElementById('dash-greeting');
  if (greetingEl) greetingEl.textContent = name ? `Halo, ${name.split(' ')[0]} 👋` : 'Halo 👋';

  const avatarEl = document.getElementById('home-avatar');
  if (avatarEl) avatarEl.textContent = initials(name);

  const tokenEl = document.getElementById('home-token-balance');
  if (tokenEl) tokenEl.textContent = getTokenBalance();

  // ── FOOD TOTALS (today only) ────────────────────────────────────────────────
  const todayStr = new Date().toDateString();
  // Include entries with no createdAt (legacy data) OR entries timestamped today
  const todayFood = state.foodLog.filter(
    f => !f.createdAt || new Date(f.createdAt).toDateString() === todayStr
  );
  const targets = calculateNutritionTargets(state.bodyStats);
  const daily = calculateDailyNutritionState(state.foodLog, targets);
  const food = daily.consumed;

  // ── CALORIE RING CARD ──────────────────────────────────────────────────────
  const rawPct = Math.round((food.kcal / targets.kcal) * 100);
  const pct = Math.min(100, rawPct);
  const over = rawPct > 100;

  const kcalEl = document.getElementById('dash-kcal-consumed');
  const ringEl = document.getElementById('home-ring-fill');
  const tgtEl  = document.getElementById('dash-kcal-target');
  const pillEl = document.getElementById('home-remaining-pill');
  if (kcalEl) kcalEl.textContent = food.kcal.toLocaleString('en-US');
  if (tgtEl)  tgtEl.textContent  = `/ ${targets.kcal.toLocaleString('en-US')} kcal`;
  if (ringEl) {
    ringEl.classList.toggle('is-over', over);
    // Set after a tick so the CSS transition runs
    setTimeout(() => { ringEl.style.strokeDasharray = `${pct} 100`; }, 50);
  }
  if (pillEl) {
    pillEl.classList.toggle('is-over', over);
    pillEl.innerHTML = over
      ? '<i class="ph ph-warning" aria-hidden="true"></i>kcal berlebih'
      : '<i class="ph ph-check" aria-hidden="true"></i>kcal tersisa';
  }

  // ── MACRO PROGRESS BARS ────────────────────────────────────────────────────
  // Each macro: value element + fill bar element, capped at 100%
  const macroTargets = { p: targets.protein, c: targets.carbs, f: targets.fat, s: targets.sugar };
  [
    { key: 'p', val: food.protein, valId: 'dash-p-val', fillId: 'dash-p-fill' },
    { key: 'c', val: food.carbs,   valId: 'dash-c-val', fillId: 'dash-c-fill' },
    { key: 'f', val: food.fat,     valId: 'dash-f-val', fillId: 'dash-f-fill' },
    { key: 's', val: food.sugar,   valId: 'dash-s-val', fillId: 'dash-s-fill' },
  ].forEach(({ key, val, valId, fillId }) => {
    const valEl  = document.getElementById(valId);
    const fillEl = document.getElementById(fillId);
    if (valEl)  valEl.textContent  = `${Math.round(val)}g / ${macroTargets[key]}g`;
    if (fillEl) setTimeout(() => {
      fillEl.style.width = `${Math.min(100, Math.round((val / macroTargets[key]) * 100))}%`;
    }, 80);
  });

  // ── TRAINING THIS WEEK ─────────────────────────────────────────────────────
  // Use getWorkoutTimestamp() to handle both ISO createdAt and short "5 Aug" date strings
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weekWorkouts = (state.workouts || []).filter(w => getWorkoutTimestamp(w) >= weekAgo);

  const sessionDates   = new Set(weekWorkouts.map(w => w.date || 'unknown'));
  const totalSets      = weekWorkouts.reduce((a, w) => a + (w.sets ? w.sets.length : 1), 0);
  const totalExercises = weekWorkouts.length;
  const totalMinutes   = weekWorkouts.reduce((a, w) => a + (Number(w.duration) || 0), 0);

  const wkSessionsEl  = document.getElementById('dash-wk-sessions');
  const wkSetsEl      = document.getElementById('dash-wk-sets');
  const wkDurationEl  = document.getElementById('dash-wk-duration');
  const wkExercisesEl = document.getElementById('dash-wk-exercises');
  const lastLabelEl   = document.getElementById('dash-last-session-label');

  if (wkSessionsEl)  wkSessionsEl.textContent  = sessionDates.size;
  if (wkSetsEl)      wkSetsEl.textContent       = totalSets;
  if (wkDurationEl)  wkDurationEl.textContent   = totalMinutes > 0 ? `${totalMinutes}m` : '—';
  if (wkExercisesEl) wkExercisesEl.textContent  = totalExercises;
  if (lastLabelEl) {
    if (weekWorkouts.length > 0) {
      const last = weekWorkouts[weekWorkouts.length - 1];
      lastLabelEl.textContent = `Last: ${last.name || 'Session'} · ${last.date || ''}`;
    } else {
      lastLabelEl.textContent = 'No sessions this week';
    }
  }

  // ── STAT TILES ─────────────────────────────────────────────────────────────
  const lastSessionEl  = document.getElementById('dash-tile-last-session');
  const lastSessionSub = document.getElementById('dash-tile-last-session-sub');
  if (state.workouts && state.workouts.length > 0) {
    const last = state.workouts[state.workouts.length - 1];
    if (lastSessionEl)  lastSessionEl.textContent  = last.name || '—';
    if (lastSessionSub) lastSessionSub.textContent = last.date || 'Recent';
  }

  const setsEl = document.getElementById('dash-tile-sets');
  if (setsEl) setsEl.textContent = totalSets;

  const mealsEl  = document.getElementById('dash-tile-meals');
  const mealsSub = document.getElementById('dash-tile-meals-sub');
  if (mealsEl)  mealsEl.textContent  = todayFood.length;
  if (mealsSub) mealsSub.textContent = todayFood.length === 1 ? 'entry logged' : 'entries logged';

  const remainEl = document.getElementById('dash-tile-remaining');
  if (remainEl) remainEl.textContent = Math.abs(targets.kcal - food.kcal).toLocaleString('en-US');

  // ── TOMORROW'S CATERING (server-owned rolling 7-day decision) ─────────────
  const plan = state.dashboard?.tomorrow;
  const setText = (id, value) => { const element = document.getElementById(id); if (element) element.textContent = value; };
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  setText('catering-date', tomorrow.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' }));
  const lunch = plan?.lunch;
  const chipsEl = document.getElementById('catering-lunch-macros');
  if (lunch) {
    setText('catering-lunch', lunch.name || 'Menu belum tersedia');
    const metaEl = document.getElementById('catering-lunch-meta');
    if (metaEl) metaEl.innerHTML = `Makan siang · <strong>${Number(lunch.calories).toLocaleString('en-US')} kcal</strong>`;
    if (chipsEl) chipsEl.innerHTML = [
      ['Protein', lunch.proteinG], ['Karbo', lunch.carbsG], ['Lemak', lunch.fatG]
    ].filter(([, grams]) => grams != null).map(([label, grams]) =>
      `<span class="home-chip">${label} ${Math.round(grams)}g</span>`
    ).join('');
  } else {
    setText('catering-lunch', 'Belum ada menu');
    setText('catering-lunch-meta', 'Menu besok muncul setelah paket catering aktif.');
    if (chipsEl) chipsEl.innerHTML = '';
  }
  if (plan) {
    const explanations = document.getElementById('catering-explanations');
    if (explanations) explanations.innerHTML = (plan.explanations || []).map(item =>
      `<p class="dash-insight"><strong>${esc(item.code.replaceAll('_', ' '))}</strong><br>${esc(item.message)}</p>`
    ).join('') || '<p class="dash-insight">No adjustment is required.</p>';
  }

  // ── TODAY'S MEALS PREVIEW (last 4) ─────────────────────────────────────────
  const foodPreviewEl = document.getElementById('dash-food-preview');
  if (foodPreviewEl) {
    if (todayFood.length === 0) {
      foodPreviewEl.innerHTML = `<p class="dash-empty-meals">No meals logged today.</p>`;
    } else {
      foodPreviewEl.innerHTML = todayFood.slice().reverse().slice(0, 4).map(f => `
        <div class="dash-food-row">
          <div>
            <p class="dash-food-name" style="display:flex; align-items:center;">
              ${esc(f.meal || f.mealName || 'Meal')}
              ${f.grade ? `<span class="rating-badge rating-${f.grade.toLowerCase()}" style="font-size:10px; padding:1px 5px; margin-left:6px; line-height:1;">${f.grade}</span>` : ''}
            </p>
            <p class="dash-food-meta">P${f.protein}g · C${f.carbs}g · F${f.fat}g</p>
          </div>
          <span class="dash-food-kcal">${f.kcal} kcal</span>
        </div>
      `).join('');
    }
  }

  // ── RECENT WORKOUTS PREVIEW (last 4, newest first) ─────────────────────────
  const wkPreviewEl = document.getElementById('dash-workout-preview');
  if (wkPreviewEl) {
    const recent = (state.workouts || []).slice().reverse().slice(0, 4);
    if (recent.length === 0) {
      wkPreviewEl.innerHTML = `<p class="dash-empty-meals">No workouts logged yet.</p>`;
    } else {
      wkPreviewEl.innerHTML = recent.map(w => `
        <div class="dash-workout-row">
          <div>
            <p class="dash-workout-name">${esc(w.name || 'Exercise')}</p>
            <p class="dash-workout-meta">${esc(w.date || '')}${w.weight ? ` · ${w.weight}kg` : ''}</p>
          </div>
          <span class="dash-workout-sets">${w.sets ? w.sets.length + ' sets' : (w.reps ? w.reps + ' reps' : '—')}</span>
        </div>
      `).join('');
    }
  }
}

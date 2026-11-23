import { calculateDailyNutritionState, calculateNutritionTargets } from './nutrition.mjs';

export const ADAPTIVE_ENGINE_VERSION = 'adaptive-v3';
export const ACTIVITY_PROVIDER_POLICY = Object.freeze({
  MANUAL: { canInfluenceAdaptivePlan: true },
  HEALTH_CONNECT: { canInfluenceAdaptivePlan: true },
  STRAVA: { canInfluenceAdaptivePlan: false },
  APPLE_HEALTH: { canInfluenceAdaptivePlan: false },
  OTHER: { canInfluenceAdaptivePlan: false }
});

const DAY_MS = 86_400_000;
const round = value => Math.round(Number(value) || 0);
const dateKey = value => new Date(value).toISOString().slice(0, 10);

function weightTrajectory(weightLogs, goal) {
  const values = weightLogs
    .map(item => ({ weight: Number(item.weightKg ?? item.weight_kg), at: new Date(item.measuredAt ?? item.measured_at) }))
    .filter(item => Number.isFinite(item.weight) && !Number.isNaN(item.at.getTime()))
    .sort((a, b) => a.at - b.at);
  if (values.length < 2) return { weeklyKg: null, onTarget: null };
  const first = values[0];
  const last = values.at(-1);
  const days = Math.max(1, (last.at - first.at) / DAY_MS);
  const weeklyKg = Number((((last.weight - first.weight) / days) * 7).toFixed(2));
  const onTarget = goal === 'lose' ? weeklyKg <= -0.1 : goal === 'gain' ? weeklyKg >= 0.1 : Math.abs(weeklyKg) <= 0.15;
  return { weeklyKg, onTarget };
}

export function calculateRollingNutritionState({ foodLogs = [], weightLogs = [], activityLogs = [], profile = {}, windowDays = 7, now = new Date() }) {
  const days = Math.max(1, Math.min(28, Number(windowDays) || 7));
  const targets = calculateNutritionTargets(profile);
  const end = new Date(now);
  const start = new Date(end.getTime() - (days - 1) * DAY_MS);
  const keys = Array.from({ length: days }, (_, index) => dateKey(new Date(start.getTime() + index * DAY_MS)));
  const daily = keys.map(key => calculateDailyNutritionState(foodLogs, targets, new Date(`${key}T12:00:00`)).consumed);
  const loggedDays = daily.filter(item => item.meals > 0);
  const divisor = Math.max(1, loggedDays.length);
  const average = nutrient => round(loggedDays.reduce((sum, item) => sum + item[nutrient], 0) / divisor);
  const loggingCompleteness = Number((daily.reduce((sum, item) => sum + Math.min(1, item.meals / 3), 0) / days).toFixed(2));
  const confidence = loggingCompleteness >= 0.75 ? 'HIGH' : loggingCompleteness >= 0.4 ? 'MEDIUM' : 'LOW';
  const permittedActivities = activityLogs.filter(item => ACTIVITY_PROVIDER_POLICY[String(item.provider || '').toUpperCase()]?.canInfluenceAdaptivePlan);
  const activityEnergyAverage = round(permittedActivities.reduce((sum, item) => sum + Number(item.estimatedEnergyKcal ?? item.estimated_energy_kcal ?? 0), 0) / days);
  const trajectory = weightTrajectory(weightLogs, profile.goal);
  const averageCalories = average('kcal');
  const averageProtein = average('protein');
  return {
    windowDays: days,
    profileVersion: Number(profile.version || 1),
    daysLogged: loggedDays.length,
    calorieTarget: targets.kcal,
    averageCalories,
    calorieDeviation: averageCalories - targets.kcal,
    calorieDeviationPct: Number(((averageCalories - targets.kcal) / Math.max(1, targets.kcal)).toFixed(3)),
    proteinTarget: targets.protein,
    averageProtein,
    proteinDeviation: averageProtein - targets.protein,
    carbsTarget: targets.carbs,
    averageCarbs: average('carbs'),
    fatTarget: targets.fat,
    averageFat: average('fat'),
    weightTrend: trajectory.weeklyKg,
    weightTrajectoryOnTarget: trajectory.onTarget,
    loggingCompleteness,
    activityEnergyAverage,
    confidence
  };
}

function allowedMenus(menus, profile) {
  const allergies = String(profile.allergies || '').toLowerCase().split(',').map(value => value.trim()).filter(Boolean);
  const dislikes = String(profile.dislikedFoods || '').toLowerCase().split(',').map(value => value.trim()).filter(Boolean);
  const diet = String(profile.dietaryPreference || 'none').toLowerCase();
  return menus.filter(menu => {
    if (!menu.active || Number(menu.inventoryAvailable ?? menu.inventory_available ?? 0) < 1) return false;
    const allergens = menu.allergens || [];
    if (allergens.some(value => allergies.some(allergy => String(value).toLowerCase().includes(allergy)))) return false;
    if (dislikes.some(dislike => String(menu.name || '').toLowerCase().includes(dislike))) return false;
    const tags = menu.dietaryTags || menu.dietary_tags || [];
    return diet === 'none' || tags.includes(diet);
  });
}

// Portion sizes the kitchen cooks. Calora picks one per meal and charges its tokens,
// so a smaller portion on a day the customer needs less leaves tokens for another day.
export const PORTION_SIZES = Object.freeze({
  S: { factor: 0.75, tokens: 2 },
  M: { factor: 1, tokens: 3 },
  L: { factor: 1.25, tokens: 4 }
});

// Share of the day's calories each catering meal should cover.
const MEAL_SHARES = { LUNCH: 0.35, DINNER: 0.3 };

// Kitchen mains (LUNCH or DINNER menus) can be served at either meal.
const isMain = (menu) => menu.mealType === 'LUNCH' || menu.mealType === 'DINNER';

function portion(menu, size, mealType) {
  const { factor, tokens } = PORTION_SIZES[size];
  return {
    ...menu,
    mealType,
    size,
    tokens,
    calories: round(menu.calories * factor),
    proteinG: round(menu.proteinG * factor),
    carbsG: round(menu.carbsG * factor),
    fatG: round(menu.fatG * factor)
  };
}

/** Picks the dish and portion size whose calories come closest to the meal's share of the day. */
function selectMeal(menus, mealType, allocation, proteinUp) {
  let best = null;
  for (const menu of menus) {
    for (const size of Object.keys(PORTION_SIZES)) {
      const meal = portion(menu, size, mealType);
      const score = Math.abs(meal.calories - allocation) + (proteinUp ? Math.max(0, 48 - meal.proteinG) * 8 : 0);
      if (!best || score < best.score) best = { meal, score };
    }
  }
  return best ? best.meal : null;
}

export function generateTomorrowCateringPlan({ profile = {}, rollingState, menus = [], recentMenuIds = [], now = new Date(), cutoffHour = 20 }) {
  const baseDailyTarget = rollingState.calorieTarget;
  let adjustment = 0;
  const explanationCodes = [];
  const persistentEnergyDeviation = Math.abs(rollingState.calorieDeviationPct) >= 0.1;
  if (rollingState.confidence === 'LOW') explanationCodes.push('INSUFFICIENT_LOGGING');
  if (rollingState.weightTrajectoryOnTarget === true) explanationCodes.push('WEIGHT_TRAJECTORY_ON_TARGET');
  if (rollingState.confidence === 'HIGH' && rollingState.weightTrajectoryOnTarget === false && persistentEnergyDeviation) {
    adjustment = rollingState.calorieDeviation > 0 ? -100 : 100;
    explanationCodes.push('WEIGHT_TRAJECTORY_OFF_TARGET', rollingState.calorieDeviation > 0 ? 'CALORIE_TREND_ABOVE_TARGET' : 'CALORIE_TREND_BELOW_TARGET');
  } else {
    explanationCodes.push('NO_ADJUSTMENT_REQUIRED');
  }
  const proteinUp = rollingState.confidence !== 'LOW' && rollingState.proteinDeviation <= -Math.max(15, rollingState.proteinTarget * 0.1);
  if (proteinUp) explanationCodes.push('PROTEIN_BELOW_TARGET');
  const effectiveDailyTarget = Math.max(1200, baseDailyTarget + adjustment);
  const lunchTarget = Math.round(effectiveDailyTarget * MEAL_SHARES.LUNCH);
  const dinnerTarget = Math.round(effectiveDailyTarget * MEAL_SHARES.DINNER);
  // Skip dishes from the last couple of days when there is anything else to serve.
  const allowed = allowedMenus(menus, profile).filter(isMain);
  const fresh = allowed.filter(item => !recentMenuIds.includes(item.id));
  const pool = fresh.length ? fresh : allowed;
  const lunch = selectMeal(pool, 'LUNCH', lunchTarget, proteinUp);
  const dinnerPool = pool.filter(item => item.id !== lunch?.id);
  const dinner = selectMeal(dinnerPool.length ? dinnerPool : pool, 'DINNER', dinnerTarget, proteinUp);
  const cateringAllocation = (lunch ? lunch.calories : lunchTarget) + (dinner ? dinner.calories : dinnerTarget);
  const planDate = dateKey(new Date(new Date(now).getTime() + DAY_MS));
  const afterCutoff = new Date(now).getHours() >= Number(cutoffHour);
  return {
    planDate,
    generatedAt: new Date(now).toISOString(),
    engineVersion: ADAPTIVE_ENGINE_VERSION,
    baseDailyTarget,
    effectiveDailyTarget,
    cateringAllocation,
    proteinTargetG: rollingState.proteinTarget,
    carbsTargetG: rollingState.carbsTarget,
    fatTargetG: rollingState.fatTarget,
    lunch,
    dinner,
    tokens: (lunch ? lunch.tokens : 0) + (dinner ? dinner.tokens : 0),
    adaptations: proteinUp ? ['PROTEIN_UP'] : adjustment ? [`ENERGY_${adjustment > 0 ? 'UP' : 'DOWN'}_100`] : [],
    confidence: rollingState.confidence,
    explanationCodes: [...new Set(explanationCodes)],
    status: afterCutoff ? 'LOCKED' : 'DRAFT',
    stateVersion: `${ADAPTIVE_ENGINE_VERSION}:${rollingState.windowDays}d:p${rollingState.profileVersion}`,
    rollingState
  };
}

export function explainPlan(plan) {
  const messages = {
    INSUFFICIENT_LOGGING: `Only ${plan.rollingState.daysLogged} of the last ${plan.rollingState.windowDays} days contain food logs. The base energy target remains stable.`,
    PROTEIN_BELOW_TARGET: 'Recent sufficiently logged days are below the configured protein target, so higher-protein catering was prioritized.',
    WEIGHT_TRAJECTORY_ON_TARGET: 'Weight trajectory is consistent with the current goal, so no energy correction was applied.',
    WEIGHT_TRAJECTORY_OFF_TARGET: 'Weight trajectory is not currently aligned with the configured goal.',
    CALORIE_TREND_ABOVE_TARGET: 'A persistent intake trend above target supported a bounded 100 kcal adjustment.',
    CALORIE_TREND_BELOW_TARGET: 'A persistent intake trend below target supported a bounded 100 kcal adjustment.',
    NO_ADJUSTMENT_REQUIRED: 'Recent evidence does not justify changing the base energy target.'
  };
  return plan.explanationCodes.map(code => ({ code, message: messages[code] })).filter(item => item.message);
}

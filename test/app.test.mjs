import test from 'node:test';
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../dist/create-app.js';
import { PlansService } from '../dist/plans/plans.service.js';
import { validateFood } from '../dist/common/validation.js';

process.env.CALORA_WEBHOOK_TOKEN = 'test-webhook-secret';
process.env.CALORA_USERS_JSON = JSON.stringify([
  { id: 'dave', name: 'Dave', password: 'dave-pass', profile: { bb: 70, tb: 175, age: 30, sex: 'male', activity: 'moderate', goal: 'maintain' } },
  { id: 'alex', name: 'Alex', password: 'alex-pass', profile: { bb: 60, tb: 165, age: 28, sex: 'female', activity: 'light', goal: 'maintain' } },
  { id: 'admin', name: 'Admin', password: 'admin-pass', role: 'ADMIN', profile: { bb: 70, tb: 175, age: 30, sex: 'male', activity: 'moderate', goal: 'maintain' } }
]);

async function login(baseUrl, username, password) {
  const response = await fetch(`${baseUrl}/api/session`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password })
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  const cookie = response.headers.get('set-cookie').split(';')[0];
  assert.equal(cookie, `calora_session=${body.sessionToken}`);
  assert.match(response.headers.get('set-cookie'), /Max-Age=1800/);
  return cookie;
}

test('API validates nutrition data and isolates each user', async (t) => {
  if (!process.env.DATABASE_URL) {
    t.skip('DATABASE_URL is required for API e2e');
    return;
  }
  const prisma = new PrismaClient();
  const app = await createApp();
  await app.listen(0, '127.0.0.1');
  t.after(async () => {
    await app.close();
    await prisma.$disconnect();
  });
  const baseUrl = `http://127.0.0.1:${app.getHttpServer().address().port}`;
  await prisma.foodLog.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.adaptivePlan.deleteMany({ where: { userId: 'dave' } });
  await prisma.activityLog.deleteMany({ where: { id: { in: ['activity-1', 'activity-1-dup'] } } });
  const daveCookie = await login(baseUrl, 'Dave', 'dave-pass');
  const refreshed = await fetch(`${baseUrl}/api/session`, { headers: { Cookie: daveCookie } });
  assert.equal(refreshed.status, 200);
  assert.match(refreshed.headers.get('set-cookie'), /Max-Age=1800/);
  const alexCookie = await login(baseUrl, 'Alex', 'alex-pass');
  const adminCookie = await login(baseUrl, 'Admin', 'admin-pass');

  const entry = { id: 'meal-1', meal: 'Rice and chicken', category: 'lunch', kcal: 500, protein: 35, carbs: 55, fat: 12 };
  const created = await fetch(`${baseUrl}/api/food`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: daveCookie }, body: JSON.stringify(entry)
  });
  if (created.status !== 201) console.error('food create', created.status, await created.clone().text());
  assert.equal(created.status, 201);

  const duplicate = await fetch(`${baseUrl}/api/food`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: daveCookie }, body: JSON.stringify(entry)
  });
  assert.equal(duplicate.status, 409);

  const invalid = await fetch(`${baseUrl}/api/food`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: daveCookie }, body: JSON.stringify({ meal: 'Invalid', kcal: -1 })
  });
  assert.equal(invalid.status, 400);

  const daveFoods = await fetch(`${baseUrl}/api/food`, { headers: { Cookie: daveCookie } }).then(response => response.json());
  const alexFoods = await fetch(`${baseUrl}/api/food`, { headers: { Cookie: alexCookie } }).then(response => response.json());
  assert.equal(daveFoods.length, 1);
  assert.equal(alexFoods.length, 0);

  const crossUserEdit = await fetch(`${baseUrl}/api/food/${entry.id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json', Cookie: alexCookie }, body: JSON.stringify({ ...entry, kcal: 1 })
  });
  assert.equal(crossUserEdit.status, 404);

  const profileUpdate = await fetch(`${baseUrl}/api/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: daveCookie },
    body: JSON.stringify({ bb: 82, tb: 180, age: 34, sex: 'male', activity: 'active', goal: 'lose' })
  });
  assert.equal(profileUpdate.status, 200);
  const daveProfile = await fetch(`${baseUrl}/api/profile`, { headers: { Cookie: daveCookie } }).then(response => response.json());
  const alexProfile = await fetch(`${baseUrl}/api/profile`, { headers: { Cookie: alexCookie } }).then(response => response.json());
  assert.equal(daveProfile.bb, 82);
  assert.equal(alexProfile.bb, 60);

  assert.equal((await fetch(`${baseUrl}/api/admin/dashboard`, { headers: { Cookie: daveCookie } })).status, 403);
  assert.equal((await fetch(`${baseUrl}/api/admin/dashboard`, { headers: { Cookie: adminCookie } })).status, 200);

  const plans = app.get(PlansService);
  const activity = { id: 'activity-1', provider: 'MANUAL', providerActivityId: 'provider-1', activityType: 'RUN', name: 'Run', startedAt: new Date().toISOString(), durationSeconds: 1800, estimatedEnergyKcal: 300, dataQuality: 'ESTIMATED' };
  await prisma.activityLog.create({
    data: {
      id: activity.id, userId: 'dave', provider: activity.provider, providerActivityId: activity.providerActivityId,
      activityType: activity.activityType, activityName: activity.name, startedAt: new Date(activity.startedAt),
      durationSeconds: activity.durationSeconds, estimatedEnergyKcal: activity.estimatedEnergyKcal, dataQuality: activity.dataQuality
    }
  });
  try {
    await prisma.activityLog.create({
      data: {
        id: 'activity-1-dup', userId: 'dave', provider: activity.provider, providerActivityId: activity.providerActivityId,
        activityType: activity.activityType, activityName: activity.name, startedAt: new Date(activity.startedAt),
        durationSeconds: activity.durationSeconds, estimatedEnergyKcal: activity.estimatedEnergyKcal, dataQuality: activity.dataQuality
      }
    });
    assert.fail('expected unique activity');
  } catch (error) {
    assert.equal(error.code, 'P2002');
  }

  const lockedAt = new Date('2030-01-01T21:00:00');
  const lockedPlan = await plans.ensurePlan('dave', lockedAt);
  const lateFood = validateFood({ ...entry, id: 'late-food', source: 'MANUAL', sugar: 0, sodium: 0, confidence: null, createdAt: '2030-01-01T22:00:00.000Z' });
  await prisma.foodLog.create({
    data: {
      id: lateFood.id, userId: 'dave', mealType: lateFood.category.toUpperCase(), foodName: lateFood.meal,
      calories: lateFood.kcal, proteinG: lateFood.protein, carbsG: lateFood.carbs, fatG: lateFood.fat,
      sugarG: lateFood.sugar, sodiumMg: lateFood.sodium, source: lateFood.source, confidence: lateFood.confidence,
      eatenAt: new Date(lateFood.createdAt)
    }
  });
  const unchangedPlan = await plans.ensurePlan('dave', lockedAt);
  assert.equal(lockedPlan.status, 'LOCKED');
  assert.equal(unchangedPlan.generatedAt, lockedPlan.generatedAt);
  assert.ok(lockedPlan.lunch?.size && lockedPlan.dinner?.size);
  assert.equal(lockedPlan.tokens, lockedPlan.lunch.tokens + lockedPlan.dinner.tokens);

  assert.equal((await fetch(`${baseUrl}/api/food`)).status, 401);
  assert.equal((await fetch(`${baseUrl}/api/food`, { headers: { Authorization: 'Bearer test-webhook-secret', 'X-Calora-User': 'dave' } })).status, 401);
  assert.equal((await fetch(`${baseUrl}/server.js`)).status, 404);
});

test('guest login creates an isolated throwaway account', async (t) => {
  if (!process.env.DATABASE_URL) {
    t.skip('DATABASE_URL is required for API e2e');
    return;
  }
  const prisma = new PrismaClient();
  const app = await createApp();
  await app.listen(0, '127.0.0.1');
  t.after(async () => {
    await app.close();
    await prisma.$disconnect();
  });
  const baseUrl = `http://127.0.0.1:${app.getHttpServer().address().port}`;
  const stale = await prisma.user.create({ data: { id: 'guest_stale', name: 'Guest stale', passwordHash: '!', role: 'GUEST', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) } });

  const guestLogin = async () => {
    const response = await fetch(`${baseUrl}/api/session/guest`, { method: 'POST' });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.user.role, 'GUEST');
    assert.equal(body.user.name, 'Guest CAI');
    assert.ok(body.user.profile);
    return { user: body.user, cookie: response.headers.get('set-cookie').split(';')[0] };
  };
  const first = await guestLogin();
  const second = await guestLogin();
  assert.notEqual(first.user.id, second.user.id);
  assert.equal(await prisma.user.findUnique({ where: { id: stale.id } }), null);

  const created = await fetch(`${baseUrl}/api/food`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: first.cookie },
    body: JSON.stringify({ meal: 'Guest toast', category: 'snack', kcal: 120 })
  });
  assert.equal(created.status, 201);
  const secondLogs = await (await fetch(`${baseUrl}/api/food`, { headers: { Cookie: second.cookie } })).json();
  assert.equal(secondLogs.length, 0);

  const menus = await (await fetch(`${baseUrl}/api/menus`, { headers: { Cookie: first.cookie } })).json();
  assert.deepEqual(menus.map(menu => menu.id).sort(), ['C01', 'C02', 'C03', 'C04', 'C05', 'C06', 'C07', 'C08', 'C09', 'C10', 'C11']);
  assert.ok(menus.some(menu => menu.name === "Mac 'n Cheese Cordon Bleu"));

  // Guests showcase every feature, meal analysis included (no vision provider is set up here).
  const analyze = await fetch(`${baseUrl}/api/analyze`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: first.cookie }, body: JSON.stringify({ text: 'nasi goreng' })
  });
  assert.notEqual(analyze.status, 403);
  assert.notEqual(analyze.status, 401);

  const set = await fetch(`${baseUrl}/api/activity`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: first.cookie },
    body: JSON.stringify({ activityType: 'STRENGTH', name: 'Barbel · 6kg × 200', weightKg: 6, reps: 200 })
  });
  assert.equal(set.status, 201);
  const [strength] = await (await fetch(`${baseUrl}/api/activity`, { headers: { Cookie: first.cookie } })).json();
  assert.equal(strength.weightKg, 6);
  assert.equal(strength.reps, 200);

  const passwordLogin = await fetch(`${baseUrl}/api/session`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: first.user.id.replace('guest_', 'Guest CAI '), password: '!' })
  });
  assert.equal(passwordLogin.status, 401);
  await prisma.user.deleteMany({ where: { role: 'GUEST' } });
});

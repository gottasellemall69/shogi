import { test, expect } from '@playwright/test';
import { createHmac } from 'node:crypto';
import { sessionCookie } from '../../lib/engine-access.js';

const names = ['Novice', 'Easy', 'Medium', 'Hard', 'Expert'];
const history = (page) => page.getByRole('list', { name: 'Move history' }).locator('li');
const difficulty = (page) => page.getByLabel('Difficulty (starts a new game)');
const responseMove = { bestmove: '3c3d', sfen: 'lnsgkgsnl/1r5b1/ppppppppp/9/9/2P6/PP1PPPPPP/1B5R1/LNSGKGSNL w - 2' };
async function playFirstMove(page) {
  await page.locator('[data-square="7g"]').click();
  await page.locator('[data-square="7f"]').click();
}

// Use the production server's test credentials without consuming the login
// throttle; these tests exercise difficulty controls, not the sign-in flow.
const testPassword = 'browser-test-only-password-32-characters-long';
const signingKey = createHmac('sha256', testPassword).update('shogi-site-password:').update(testPassword).digest('base64url');
const cookie = sessionCookie(signingKey).split(';')[0];
test.beforeEach(async ({ page }) => {
  await page.context().addCookies([{ name: 'shogi_session', value: cookie.slice('shogi_session='.length),
    url: 'http://127.0.0.1:3100', httpOnly: true, sameSite: 'Strict' }]);
});

test('all five per-game levels are available and sent with engine requests', async ({ page }) => {
  const requests = [];
  await page.route('**/api/engine', (route) => {
    if (route.request().method() === 'GET') return route.fulfill({ json: { ready: true, name: 'Test engine', maxMovetime: 1000 } });
    requests.push(route.request().postDataJSON());
    return route.fulfill({ json: responseMove });
  });
  await page.goto('/');
  await expect(difficulty(page)).toHaveValue('medium');
  await expect(difficulty(page).locator('option')).toHaveText(names);
  await expect(page.getByRole('status').filter({ hasText: 'Test engine' })).toBeVisible();
  await expect(page.getByLabel('Thinking time limit').locator('option')).toHaveCount(2);
  for (const name of names) {
    await difficulty(page).selectOption(name.toLowerCase());
    await expect(history(page)).toHaveCount(0);
    await playFirstMove(page);
    await expect(history(page)).toHaveCount(2);
    expect(requests.at(-1)).toEqual({ moves: ['7g7f'], movetime: 1000, difficulty: name.toLowerCase() });
  }
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(difficulty(page)).toHaveValue('expert');
  await page.getByRole('button', { name: 'Switch to Player vs Player' }).click();
  await expect(difficulty(page)).toBeDisabled();
  await page.getByRole('button', { name: 'Switch to Play vs AI' }).click();
  await expect(difficulty(page)).toBeEnabled();
  await expect(difficulty(page)).toHaveValue('expert');
});

test('changing difficulty starts fresh and ignores a reply from the old game', async ({ page }) => {
  const pending = [];
  await page.route('**/api/engine', (route) => {
    if (route.request().method() === 'GET') return route.fulfill({ json: { ready: true, name: 'Test engine' } });
    pending.push(route);
  });
  await page.goto('/');
  await expect(page.getByRole('status').filter({ hasText: 'Test engine' })).toBeVisible();
  await playFirstMove(page);
  await expect.poll(() => pending.length).toBe(1);
  await difficulty(page).selectOption('novice');
  await expect(history(page)).toHaveCount(0);
  await pending[0].fulfill({ json: responseMove }).catch(() => {});
  await expect(page.locator('[data-square="7g"]')).toHaveAttribute('aria-label', '7g sente Pawn');
  await expect(page.locator('[data-square="3c"]')).toHaveAttribute('aria-label', '3c gote Pawn');
  await playFirstMove(page);
  await expect.poll(() => pending.length).toBe(2);
  expect(pending[1].request().postDataJSON().difficulty).toBe('novice');
  await pending[1].fulfill({ json: responseMove });
  await expect(history(page)).toHaveCount(2);
  await expect(difficulty(page)).toHaveValue('novice');
});

test('the API rejects unknown and malformed difficulty values', async ({ request }) => {
  const headers = { cookie };
  for (const value of ['impossible', 'toString', 'novice\nquit', null, {}]) {
    const response = await request.post('/api/engine', { headers, data: { moves: [], difficulty: value } });
    expect(response.status()).toBe(400);
    expect((await response.json()).error).toContain('Difficulty must be');
  }
});

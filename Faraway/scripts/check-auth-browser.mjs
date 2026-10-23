import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as wait } from 'node:timers/promises';
import { chromium, expect } from '@playwright/test';

// The real SDK runs in Chromium; only the remote Supabase service is simulated.
// No test account is created in the user's project, and no real email is sent.
const cwd = new URL('../', import.meta.url).pathname;
const base = 'http://127.0.0.1:4183';
const server = spawn(process.execPath, ['artifacts/faraway/node_modules/vite/bin/vite.js', '--config', 'artifacts/faraway/vite.config.ts', '--port', '4183', '--strictPort'], {
  cwd, env: { ...process.env, VITE_SUPABASE_URL: 'https://faraway-auth-test.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test_only' }, stdio: 'pipe',
});
let output = '';
server.stdout.on('data', chunk => { output += chunk; });
server.stderr.on('data', chunk => { output += chunk; });
let browser;
let page;
try {
  for (let i = 0; ; i++) {
    if (server.exitCode !== null) throw new Error(`Test server exited: ${output}`);
    try { if ((await fetch(base)).ok) break; } catch {}
    if (i >= 100) throw new Error(`Test server did not start: ${output}`);
    await wait(100);
  }
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext();
  page = await context.newPage();
  page.setDefaultTimeout(15_000);
  const browserErrors = [];
  page.on('pageerror', error => browserErrors.push(error.message));
  page.on('dialog', dialog => void dialog.accept());
  const ids = { 'a@example.com': '11111111-1111-4111-8111-111111111111', 'b@example.com': '22222222-2222-4222-8222-222222222222' };
  const rows = new Map();
  let saveFails = false;
  let loadFails = false;
  let signupConfirmation = true;
  let saves = 0;
  const user = email => ({ id: ids[email], email, aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: { full_name: email.startsWith('a') ? 'Account A' : 'Account B' }, created_at: new Date().toISOString() });
  const token = email => [Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'), Buffer.from(JSON.stringify({ sub: ids[email], exp: Math.floor(Date.now()/1000) + 3600, role: 'authenticated' })).toString('base64url'), 'test-signature'].join('.');
  const session = email => ({ access_token: token(email), refresh_token: `test-refresh-${email}`, token_type: 'bearer', expires_in: 3600, user: user(email) });
  await context.route('https://faraway-auth-test.supabase.co/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' };
    const send = (status, value) => route.fulfill({ status, headers, body: status === 204 ? '' : JSON.stringify(value) });
    if (request.method() === 'OPTIONS') return send(204);
    const body = request.postDataJSON();
    if (path === '/auth/v1/signup') {
      assert.equal(body.password, 'PracticePassword123!');
      assert.equal(body.data.full_name, 'Account A');
      return send(200, signupConfirmation ? user(body.email) : session(body.email));
    }
    if (path === '/auth/v1/token') {
      if (body.password !== 'PracticePassword123!') return send(400, { error_code: 'invalid_credentials', msg: 'Invalid login credentials' });
      return send(200, session(body.email));
    }
    if (path === '/auth/v1/logout') return send(204);
    const auth = request.headers().authorization?.split(' ')[1];
    const accountId = auth?.includes('.') ? JSON.parse(Buffer.from(auth.split('.')[1], 'base64url').toString()).sub : null;
    if (path === '/auth/v1/user') return send(200, user(Object.keys(ids).find(email => ids[email] === accountId)));
    if (!accountId || body.expected_user_id !== accountId) return send(403, { message: 'Account mismatch' });
    if (path === '/rest/v1/rpc/load_personal_journey') return send(loadFails ? 400 : 200, loadFails ? { message: 'Tables not installed' } : rows.get(accountId) ?? null);
    if (path === '/rest/v1/rpc/save_personal_journey') {
      if (saveFails) return send(503, { message: 'Simulated network failure' });
      assert.equal('session' in body.journey, false);
      rows.set(accountId, structuredClone(body.journey)); saves++;
      return send(204);
    }
    throw new Error(`Unexpected Supabase request: ${path}`);
  });
  const login = async (email, password = 'PracticePassword123!') => {
    await page.goto(`${base}/login`);
    await page.getByTestId('button-login-email').click();
    await page.getByTestId('input-login-email').fill(email);
    await page.getByTestId('input-login-password').fill(password);
    await page.getByTestId('button-login-submit').click();
    if (password === 'PracticePassword123!') await expect(page.getByTestId('button-login-submit')).not.toBeVisible();
  };
  const signout = async () => {
    await page.getByTestId('button-avatar').click();
    await page.getByTestId('menu-signout').click();
    await expect(page.getByTestId('button-login-email')).toBeVisible();
  };
  const saved = () => expect(page.getByText('Personal profile and skills saved to your account.', { exact: true })).toBeVisible();

  await page.goto(`${base}/register`);
  await page.getByTestId('input-register-name').fill('Account A');
  await page.getByTestId('input-register-email').fill('a@example.com');
  await page.getByTestId('input-register-password').fill('PracticePassword123!');
  await page.getByTestId('button-register-enter').click();
  await expect(page.getByText(/Check your email for a confirmation link/)).toBeVisible();
  assert.equal(rows.size, 0);
  console.log('PASS browser: signup confirmation message, no false signed-in state');

  await login('a@example.com', 'WrongPassword');
  await expect(page.getByRole('alert')).toContainText('Invalid login credentials');
  await page.getByTestId('input-login-password').fill('PracticePassword123!');
  await page.getByTestId('button-login-submit').click();
  await expect(page.getByTestId('button-login-submit')).not.toBeVisible();
  await page.goto(`${base}/pathway`);
  await page.getByTestId('button-sample-profile').click();
  await page.getByTestId('button-next').click();
  await page.getByTestId('input-name').fill('My Practice Profile');
  await page.getByTestId('button-next').click();
  await page.getByTestId('button-next').click();
  const sql = page.getByTestId('range-skill-SQL');
  await sql.fill('5');
  await saved();
  await expect.poll(() => rows.get(ids['a@example.com'])?.profile.skills.SQL).toBe(5);
  assert.equal(rows.get(ids['a@example.com']).profile.name, 'My Practice Profile');
  assert.equal(await page.evaluate(() => localStorage.getItem('faraway_state_v1')), null);
  console.log('PASS browser: password sign-in, profile edits and skill assessment auto-save');

  saveFails = true;
  await sql.fill('4');
  await expect(page.getByRole('alert')).toContainText('have not been saved');
  assert.equal(rows.get(ids['a@example.com']).profile.skills.SQL, 5);
  saveFails = false;
  await page.getByRole('button', { name: 'Retry save', exact: true }).click();
  await saved();
  assert.equal(rows.get(ids['a@example.com']).profile.skills.SQL, 4);
  console.log('PASS browser: save failure is visible and retry preserves the latest assessment');

  // No reload/local cache can supply account data to a fresh browser context.
  await signout();
  await login('b@example.com');
  await page.goto(`${base}/pathway`);
  await saved();
  assert.equal(rows.get(ids['b@example.com']).profile.name, 'Account B');
  assert.deepEqual(rows.get(ids['b@example.com']).profile.skills, {});
  await signout();
  await login('a@example.com');
  await page.goto(`${base}/pathway`);
  await saved();
  await page.getByTestId('button-next').click();
  await expect(page.getByTestId('input-name')).toHaveValue('My Practice Profile');
  await page.getByTestId('button-next').click(); await page.getByTestId('button-next').click();
  await expect(page.getByTestId('range-skill-SQL')).toHaveValue('4');
  await page.reload(); await saved();
  console.log('PASS browser: sign-out, account isolation, restored profile/skills and session reload');

  await signout();
  const before = saves;
  loadFails = true;
  await login('a@example.com');
  await expect(page.getByRole('heading', { name: 'Your profile could not be restored' })).toBeVisible();
  assert.equal(saves, before);
  loadFails = false;
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await page.goto(`${base}/pathway`); await saved();
  await signout();
  await page.getByTestId('button-login-google').click();
  await page.getByTestId('button-mode-personal').click();
  await page.getByTestId('nav-explore-pathway').click();
  await page.getByTestId('button-sample-profile').click();
  await wait(700);
  assert.equal(saves, before);
  await signout();
  assert.deepEqual(browserErrors, []);
  console.log('PASS browser: failed restore blocks overwrites, retry works, demo never writes to Supabase, no uncaught browser errors');
  console.log('Browser tests use simulated Supabase responses; live project verification is separate.');
} catch (error) {
  console.error('Browser failure URL:', page?.url());
  console.error('Visible page:', (await page?.locator('body').innerText())?.slice(0, 2000));
  throw error;
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}

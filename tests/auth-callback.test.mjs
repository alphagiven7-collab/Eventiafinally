import { test } from 'node:test';
import assert from 'node:assert/strict';
import { finishBrowserSignIn } from '../src/lib/auth/callback.ts';

function authStub({ session = null, initError = null, sessionError = null } = {}) {
  return {
    initialize: async () => ({ error: initError }),
    getSession: async () => ({ data: { session }, error: sessionError }),
    exchangeCodeForSession: () => assert.fail('The browser client already exchanges the code'),
  };
}

test('a session created automatically redirects without exchanging the code again', async () => {
  const result = await finishBrowserSignIn(authStub({ session: { user: { id: 'user' } } }));
  assert.equal(result.error, null);
});

test('a repeated callback with a valid session does not show a false expiry', async () => {
  const result = await finishBrowserSignIn(authStub({
    session: { user: { id: 'user' } },
    initError: { code: 'otp_expired' },
  }));
  assert.equal(result.error, null);
});

test('concurrent effects await the same automatic sign-in before checking the session', async () => {
  let finishInitialization;
  let initialized = false;
  const initialization = new Promise((resolve) => { finishInitialization = resolve; });
  const auth = authStub();
  auth.initialize = () => initialization;
  auth.getSession = async () => {
    assert.ok(initialized);
    return { data: { session: { user: { id: 'user' } } }, error: null };
  };
  const first = finishBrowserSignIn(auth);
  const second = finishBrowserSignIn(auth);
  initialized = true;
  finishInitialization({ error: null });
  assert.deepEqual(await Promise.all([first, second]), [{ error: null }, { error: null }]);
});

test('an expired link without a session shows an actionable error', async () => {
  const result = await finishBrowserSignIn(authStub({ initError: { code: 'otp_expired' } }));
  assert.match(result.error, /expiré/);
});

test('a callback without a session does not redirect to the dashboard', async () => {
  const result = await finishBrowserSignIn(authStub());
  assert.match(result.error, /n’a pas abouti/);
});

test('a failed session lookup is not treated as a successful login', async () => {
  const result = await finishBrowserSignIn(authStub({ sessionError: { code: 'unexpected_failure' } }));
  assert.notEqual(result.error, null);
  assert.doesNotMatch(result.error, /expiré/);
});

test('a network exception is not misreported as an expired link', async () => {
  const auth = authStub();
  auth.initialize = async () => { throw new Error('offline'); };
  const result = await finishBrowserSignIn(auth);
  assert.match(result.error, /internet/);
  assert.doesNotMatch(result.error, /expiré/);
});

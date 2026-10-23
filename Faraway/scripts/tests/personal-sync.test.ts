import test from 'node:test';
import assert from 'node:assert/strict';
import { PersonalSync, type SyncStatus } from '../../artifacts/faraway/src/lib/personal-sync';
import { personalData, personalDataSchema } from '../../artifacts/faraway/src/lib/personal-data';
import { defaults } from '../../artifacts/faraway/src/lib/store';

const data = () => personalData(structuredClone(defaults));
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => { resolve = r; });
  return { promise, resolve };
}

test('late profile restoration cannot leak the previous account into a new account', async () => {
  const old = deferred<ReturnType<typeof data>>();
  const restored: string[] = [];
  const sync = new PersonalSync({ load: (id) => id === 'A' ? old.promise : Promise.resolve(data()), save: async () => {} }, () => {});
  const first = sync.connect('A', () => restored.push('A'));
  await sync.connect('B', () => restored.push('B'));
  old.resolve(data()); await first;
  assert.deepEqual(restored, ['B']);
  sync.disconnect();
});

test('rapid assessment edits are serialized and the newest value is saved last', async () => {
  const firstSave = deferred<void>();
  const ratings: number[] = [];
  const sync = new PersonalSync({ load: async () => null, save: async (id, state) => {
    assert.equal(id, 'A'); ratings.push(state.profile.skills.SQL);
    if (ratings.length === 1) await firstSave.promise;
  } }, () => {}, 60_000);
  await sync.connect('A', () => {});
  const one = data(); one.profile.skills.SQL = 1; sync.changed(one);
  const writing = sync.flush();
  const five = data(); five.profile.skills.SQL = 5; sync.changed(five);
  firstSave.resolve(); await writing;
  assert.deepEqual(ratings, [1, 5]);
  assert.equal(sync.hasPending, false);
  sync.disconnect();
});

test('save failure retains changes for retry and cannot be mistaken for a successful save', async () => {
  let fail = true;
  const statuses: SyncStatus[] = [];
  const saved: unknown[] = [];
  const sync = new PersonalSync({ load: async () => null, save: async (_id, state) => {
    if (fail) throw new Error('network unavailable'); saved.push(state);
  } }, (status) => statuses.push(status), 60_000);
  await sync.connect('A', () => {});
  const state = data(); state.profile.skills.Python = 4; sync.changed(state);
  await assert.rejects(sync.flush(), /network unavailable/);
  assert.equal(statuses.at(-1)?.phase, 'save-error');
  assert.equal(sync.hasPending, true);
  fail = false; await sync.flush();
  assert.deepEqual(saved, [state]); assert.equal(statuses.at(-1)?.phase, 'saved');
  sync.disconnect();
});

test('failed restore blocks writes, and disconnect cancels pending account writes', async () => {
  let writes = 0;
  const statuses: SyncStatus[] = [];
  const sync = new PersonalSync({ load: async () => { throw new Error('missing tables'); }, save: async () => { writes++; } }, s => statuses.push(s));
  await sync.connect('A', () => assert.fail('must not restore on failure'));
  sync.changed(data()); await sync.flush();
  assert.equal(writes, 0); assert.equal(sync.ready, false);
  assert.equal(statuses.at(-1)?.phase, 'load-error');
  sync.disconnect();
  const second = new PersonalSync({ load: async () => null, save: async () => { writes++; } }, () => {}, 60_000);
  await second.connect('A', () => {}); second.changed(data()); second.disconnect(); await second.flush();
  assert.equal(writes, 0);
});

test('cloud data validation rejects invalid skill ratings and strips injected session identity', () => {
  const state = data(); state.profile.skills.SQL = 6;
  assert.equal(personalDataSchema.safeParse(state).success, false);
  state.profile.skills.SQL = 3;
  const parsed = personalDataSchema.parse({ ...state, session: { id: 'another-user' } });
  assert.equal('session' in parsed, false);
});

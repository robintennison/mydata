import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import ts from 'typescript';

function load(path, dependencies = {}) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React },
  }).outputText;
  vm.runInNewContext(code, { exports, require: name => {
    if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
    return dependencies[name];
  } });
  return exports;
}
const schema = load('src/utils/settings.ts');
const plain = value => JSON.parse(JSON.stringify(value));
function harness() {
  let state, effect, cleanup, dependencies, next, fail;
  const writes = [], errors = [];
  let denied = false;
  const session = { user: { uid: 'one' }, isLoading: false };
  const auth = { currentUser: session.user };
  const react = {
    createContext: () => ({ Provider: 'provider' }),
    createElement: (_type, props) => props.value,
    useState: initial => { state ??= initial; return [state, value => { state = typeof value === 'function' ? value(state) : value; }]; },
    useEffect: (callback, deps) => {
      if (!dependencies || deps.some((value, index) => value !== dependencies[index])) {
        cleanup?.(); effect = callback; dependencies = deps;
      }
    },
  };
  const firestore = {
    doc: (_db, collection, id) => `${collection}/${id}`,
    onSnapshot: (_ref, _options, callback, error) => { next = callback; fail = error; return () => { next = undefined; }; },
    updateDoc: async (ref, patch) => { if (denied) throw new Error('permission-denied'); writes.push({ ref, patch }); },
    arrayUnion: value => ({ union: value }), arrayRemove: value => ({ remove: value }),
    runTransaction: async (_db, callback) => callback({
      get: async () => ({ exists: () => true, data: () => ({ locations: ['Home', 'Office', 'Concurrent addition'] }) }),
      update: (ref, patch) => writes.push({ ref, patch }),
    }),
  };
  const { SettingsProvider } = load('src/contexts/SettingsContext.tsx', {
    react, 'firebase/firestore': firestore, '../lib/firebase': { firestore: {}, auth },
    './AuthContext': { useAuth: () => session }, './ErrorContext': { useError: () => ({ setError: value => errors.push(value) }) },
    '../utils/settings': schema,
  });
  const render = () => { const result = SettingsProvider({ children: null }); if (effect) { const run = effect; effect = null; cleanup = run(); } return result; };
  render();
  return {
    render, writes, errors, session, auth,
    deny: () => { denied = true; },
    fail: () => fail(),
    snapshot: (data, metadata = {}) => next({ exists: () => data !== null, data: () => data, metadata: { fromCache: false, hasPendingWrites: false, ...metadata } }),
    subscribed: () => Boolean(next),
  };
}

test('missing cache and server documents never trigger default writes', () => {
  for (const fromCache of [true, false]) {
    const h = harness(); h.snapshot(null, { fromCache });
    assert.equal(h.writes.length, 0); assert.equal(h.render().settings, null); assert.ok(h.render().error);
  }
});
test('saved zero and false values survive decoding; absent legacy fields are read-only defaults', () => {
  const data = schema.readSettings({ goldRatePerGram: 0, EMW_interest: 0, showDelete: false });
  assert.equal(data.goldRatePerGram, 0); assert.equal(data.EMW_interest, 0); assert.equal(data.showDelete, false);
  assert.equal(data.liabilities, 0);
});
test('malformed settings retain last confirmed values and block saving', async () => {
  const h = harness(); h.snapshot({ goldRatePerGram: 13149 }); h.snapshot({ locations: 'corrupt' });
  assert.equal(h.render().settings.goldRatePerGram, 13149);
  assert.equal(await h.render().updateSettings({ goldRatePerGram: 0 }), false); assert.equal(h.writes.length, 0);
});
test('partial save does not include other settings or defaults', async () => {
  const h = harness(); h.snapshot({ goldRatePerGram: 13149 });
  assert.equal(await h.render().updateSettings({ showDelete: true }), true);
  assert.deepEqual(plain(h.writes), [{ ref: 'settings/app', patch: { showDelete: true } }]);
});
test('permission failure reports failure and preserves confirmed state', async () => {
  const h = harness(); h.snapshot({ goldRatePerGram: 13149 }); h.deny();
  assert.equal(await h.render().updateSettings({ goldRatePerGram: 1 }), false);
  assert.equal(h.render().settings.goldRatePerGram, 13149); assert.equal(h.errors.length, 1);
});
test('pending writes never replace confirmed values', () => {
  const h = harness(); h.snapshot({ goldRatePerGram: 13149 });
  h.snapshot({ goldRatePerGram: 1 }, { hasPendingWrites: true }); assert.equal(h.render().settings.goldRatePerGram, 13149);
});
test('authentication transition unsubscribes, hides settings, and resubscribes on login', () => {
  const h = harness(); h.snapshot({}); h.session.user = null; h.auth.currentUser = null;
  assert.equal(h.render().settings, null); assert.equal(h.subscribed(), false);
  h.session.user = { uid: 'two' }; h.auth.currentUser = h.session.user;
  assert.equal(h.render().settings, null); assert.equal(h.subscribed(), true);
  h.snapshot({ goldRatePerGram: 12 }); assert.equal(h.render().settings.goldRatePerGram, 12);
});
test('listener failure does not write defaults or allow saves', async () => {
  const h = harness(); h.fail();
  assert.equal(await h.render().updateSettings({ showDelete: true }), false); assert.equal(h.writes.length, 0);
});
test('invalid numeric, boolean, list, date, and unknown fields are rejected', () => {
  for (const patch of [{ goldRatePerGram: NaN }, { EMW_interest: Infinity }, { liabilities: -1 }, { showDelete: 'true' }, { locations: [null] }, { EMW_Date: '2039-13' }, { unexpected: 1 }]) {
    assert.throws(() => schema.validateSettings(patch));
  }
});
test('rename is a single transaction preserving current concurrent additions', async () => {
  const h = harness(); h.snapshot({ locations: ['Home', 'Office'] });
  assert.equal(await h.render().renameItem('locations', 'Home', 'House'), true);
  assert.deepEqual(plain(h.writes), [{ ref: 'settings/app', patch: { locations: ['House', 'Office', 'Concurrent addition'] } }]);
});
test('rename deduplicates targets and rejects stale source values', () => {
  assert.deepEqual(plain(schema.renameSettingItem(['Home', 'Office'], 'Home', 'Office')), ['Office']);
  assert.throws(() => schema.renameSettingItem(['Office'], 'Home', 'House'));
});


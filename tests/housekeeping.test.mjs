import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function load(file, dependencies = {}, suffix = '') {
  const exports = {};
  const code = ts.transpileModule(readFileSync(file, 'utf8') + suffix, {
    compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React },
  }).outputText;
  vm.runInNewContext(code, { exports, Date, Error, setTimeout, clearTimeout, console,
    require: name => { if (!(name in dependencies)) throw new Error(`Unexpected import ${name}`); return dependencies[name]; },
  });
  return exports;
}
const { toError } = load('src/utils/errors.ts');
const { parseTimestamp } = load('src/utils/timestamps.ts');
test('error normalization retains Firebase errors and safe messages for non-errors', () => {
  const original = Object.assign(new Error('Denied'), { code: 'permission-denied' });
  assert.equal(toError(original), original);
  assert.equal(toError({ message: 'Offline', code: 'unavailable' }).code, 'unavailable');
  assert.equal(toError('Problem').message, 'Problem');
  for (const value of [null, undefined, 1, {}]) assert.ok(toError(value).message);
});
test('legacy and Firestore dates normalize consistently, including epoch zero', () => {
  assert.equal(parseTimestamp(0), 0);
  assert.equal(parseTimestamp(new Date(0)), 0);
  assert.equal(parseTimestamp({ toDate: () => new Date(0) }), 0);
  assert.equal(parseTimestamp('2026-01-01T00:00:00Z'), Date.UTC(2026, 0, 1));
  for (const value of [null, undefined, NaN, Infinity, 'bad', new Date('bad'), {}, { toDate: () => 'bad' }, { toDate: () => { throw new Error('bad'); } }]) {
    assert.equal(parseTimestamp(value), null);
  }
});

const providerCases = [
  ['Banking', 'BankingDataProvider', 'accounts', 6],
  ['Online', 'OnlineDataProvider', 'items', 3],
  ['Jewellery', 'JewelleryDataProvider', 'items', 1],
];
for (const [name, exportName, listName, queryCount] of providerCases) {
  test(`${name} loads once, refreshes explicitly, and skips signed-out queries`, async () => {
    let signedIn = true, count = 0, cursor = 0;
    const values = [], effects = [], memo = [];
    const errors = [];
    const setError = message => errors.push(message);
    const react = {
      createContext: () => ({ Provider: 'provider' }),
      createElement: (_type, props) => props.value,
      useState: initial => { const index = cursor++; if (!(index in values)) values[index] = initial; return [values[index], value => { values[index] = typeof value === 'function' ? value(values[index]) : value; }]; },
      useCallback: (fn, deps) => { const index = cursor++; if (!memo[index] || deps.some((d, i) => d !== memo[index].deps[i])) memo[index] = { fn, deps }; return memo[index].fn; },
      useEffect: (fn, deps) => { const index = cursor++; if (!memo[index] || deps.some((d, i) => d !== memo[index].deps[i])) { memo[index] = { deps }; effects.push(fn); } },
    };
    const record = { id: 'one', data: () => ({ name: 'Record', code: 'J1', acctCode: 'Bank' }) };
    const firestore = {
      collection: () => ({}), query: () => ({}), orderBy: () => ({}),
      getDocs: async () => { count++; return { docs: [record], forEach: fn => fn(record) }; },
    };
    const mod = load(`src/contexts/${name}DataContext.tsx`, {
      react, 'firebase/firestore': firestore, '../lib/firebase': { firestore: {} },
      './AuthContext': { useAuth: () => ({ isAuthenticated: signedIn }) },
      './ErrorContext': { useError: () => ({ setError }) },
      './SettingsContext': { useSettings: () => ({ settings: { showInactive: true } }) },
      '../modules/Jewellery/hooks/firebaseUtils': {},
      '../modules/Online/types/online.types': { FILE_TYPES: { IMAGE: 'image', NONE: 'none' } },
    });
    const render = () => { cursor = 0; const result = mod[exportName]({ children: null }); effects.splice(0).forEach(fn => fn()); return result; };
    const flush = () => new Promise(resolve => setImmediate(resolve));
    assert.equal(render().loading, true);
    await flush();
    assert.equal(render()[listName].length, 1);
    assert.equal(render().loading, false);
    assert.equal(count, queryCount);
    await render().refresh();
    assert.equal(count, queryCount * 2);
    signedIn = false;
    // SessionData remounts providers on account changes; model that fresh state.
    values.length = 0; memo.length = 0;
    assert.equal(render()[listName].length, 0);
    await flush();
    assert.equal(count, queryCount * 2);
    assert.equal(render().loading, false);
    assert.equal(errors.length, 0);
  });
}
test('session wrapper changes the private provider tree key for account changes and logout', () => {
  let user = { uid: 'first' };
  const react = { createElement: (type, props, ...children) => ({ type, props, children }) };
  // Automatic JSX runtime is not used by the transpiler; expose React for this test.
  const app = load('src/App.tsx', {
    react, 'react-router-dom': {}, './routes': {}, './contexts/SettingsContext': {},
    './contexts/ErrorContext': {}, './contexts/AuthContext': { useAuth: () => ({ user }) },
    './contexts/BankingDataContext': { BankingDataProvider: 'banking' },
    './contexts/JewelleryDataContext': { JewelleryDataProvider: 'jewellery' },
    './contexts/OnlineDataContext': { OnlineDataProvider: 'online' },
  }, '\nimport React from "react";\nexport { SessionData };');
  assert.equal(app.SessionData({ children: null }).props.key, 'first');
  user = { uid: 'second' };
  assert.equal(app.SessionData({ children: null }).props.key, 'second');
  user = null;
  assert.equal(app.SessionData({ children: null }).props.key, 'signed-out');
});

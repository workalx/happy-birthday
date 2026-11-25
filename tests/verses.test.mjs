import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const ctx = { window: {} };
vm.runInNewContext(readFileSync(new URL('../js/verses.js', import.meta.url), 'utf8'), ctx);
const V = ctx.window.VERSES;

test('6 verses in spec order', () => {
  assert.equal(V.length, 6);
  assert.deepEqual(Array.from(V, v => v.mood), [
    'Коли сумно', 'Коли тяжко', 'Коли весело',
    'Коли ностальгійно', 'Коли хочеться поплакати', 'Коли стомлений'
  ]);
});

test('unique ids and non-empty fields', () => {
  assert.equal(new Set(V.map(v => v.id)).size, 6);
  for (const v of V) for (const k of ['id', 'mood', 'ref', 'text']) assert.ok(v[k].trim().length > 0, `${v.id}.${k}`);
});

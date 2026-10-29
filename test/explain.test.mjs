import {test} from "node:test";
import assert from "node:assert/strict";
import {explainCard} from "../scripts/explain.js";

const card = (base, stress, extra = {}) => ({title: "Observation", push: false, canPush: true, base, stress, ...extra});

test("success with stunts gives examples", () => {
  const win = explainCard(card({n: 7, sixes: 1}, {n: 2, ones: 0, sixes: 2}));
  assert.match(win.headline, /3 sixes/);
  assert.ok(win.lines.some((l) => /2 to spend/.test(l) && /\+1 damage/.test(l)));
});

test("one six is a success without stunts", () => {
  const r = explainCard(card({n: 3, sixes: 1}, null));
  assert.equal(r.tone, "fine");
  assert.ok(!r.lines.some((l) => /stunt/.test(l)));
});

test("fail and panic", () => {
  assert.equal(explainCard(card({n: 3, sixes: 0}, null)).tone, "bad");
  const panic = explainCard(card({n: 3, sixes: 1}, {n: 2, ones: 1, sixes: 0}));
  assert.equal(panic.tone, "warn");
  assert.ok(panic.lines.some((l) => /Panic/.test(l)));
});

test("pushed roll and supply roll", () => {
  assert.ok(explainCard(card({n: 3, sixes: 1}, null, {push: true, canPush: false})).lines.some((l) => /pushed roll/.test(l)));
  assert.equal(explainCard({title: "Power", base: null, stress: {n: 3, ones: 1, sixes: 0}}).headline, "Supply drops by 1");
});

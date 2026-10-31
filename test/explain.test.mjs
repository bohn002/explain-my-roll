import {test} from "node:test";
import assert from "node:assert/strict";
import {explainAlien, explainD20, explainDragonbane} from "../scripts/explain.js";

const card = (base, stress, extra = {}) => ({title: "Observation", push: false, canPush: true, base, stress, ...extra});

test("success with stunts gives examples", () => {
  const win = explainAlien(card({n: 7, sixes: 1}, {n: 2, ones: 0, sixes: 2}));
  assert.match(win.headline, /3 sixes/);
  assert.ok(win.lines.some((l) => /2 to spend/.test(l) && /\+1 damage/.test(l)));
});

test("one six is a success without stunts", () => {
  const r = explainAlien(card({n: 3, sixes: 1}, null));
  assert.equal(r.tone, "fine");
  assert.ok(!r.lines.some((l) => /stunt/.test(l)));
});

test("fail and panic", () => {
  assert.equal(explainAlien(card({n: 3, sixes: 0}, null)).tone, "bad");
  const panic = explainAlien(card({n: 3, sixes: 1}, {n: 2, ones: 1, sixes: 0}));
  assert.equal(panic.tone, "warn");
  assert.match(panic.headline, /but PANIC/);
  assert.ok(panic.lines.some((l) => /shows a 1/.test(l)));
  assert.ok(panic.lines.some((l) => /Panic/.test(l)));
});

test("pushed roll and supply roll", () => {
  assert.ok(explainAlien(card({n: 3, sixes: 1}, null, {push: true, canPush: false})).lines.some((l) => /pushed roll/.test(l)));
  assert.equal(explainAlien({title: "Power", base: null, stress: {n: 3, ones: 1, sixes: 0}}).headline, "Supply drops by 1");
});

test("D&D: attack hit, crit, fumble, advantage text", () => {
  const hit = explainD20({type: "attack", natural: 14, all: [14], advMode: 0, total: 19, target: 15});
  assert.match(hit.headline, /HIT/);
  assert.equal(explainD20({type: "attack", natural: 20, all: [20], advMode: 0, total: 25, target: 30}).tone, "fine");
  assert.match(explainD20({type: "attack", natural: 1, all: [1], advMode: 0, total: 8, target: 5}).headline, /miss/);
  const adv = explainD20({type: "check", natural: 17, all: [9, 17], advMode: 1, total: 20, target: 15});
  assert.ok(adv.lines.some((l) => /Advantage.*9 and 17.*17/.test(l)));
  assert.match(adv.headline, /SUCCESS/);
});

test("D&D: damage and death saves", () => {
  assert.match(explainD20({type: "damage", total: 12, crit: true}).headline, /critical/);
  assert.match(explainD20({type: "death", natural: 1, all: [1], advMode: 0, total: 1}).headline, /natural 1/);
  assert.match(explainD20({type: "death", natural: 12, all: [12], advMode: 0, total: 12}).headline, /SUCCESS/);
});

test("Dragonbane: dragon, demon, success, failure, push, boons", () => {
  const base = {type: "skillTest", target: 12, banes: 0, boons: 0, canPush: false, autoSuccess: false};
  assert.match(explainDragonbane({...base, result: 1, success: true, isDragon: true, isDemon: false}).headline, /DRAGON/);
  assert.match(explainDragonbane({...base, result: 20, success: false, isDragon: false, isDemon: true}).headline, /DEMON/);
  assert.match(explainDragonbane({...base, result: 9, success: true, isDragon: false, isDemon: false}).headline, /SUCCESS/);
  const f = explainDragonbane({...base, result: 15, success: false, isDragon: false, isDemon: false, canPush: true, boons: 1});
  assert.match(f.headline, /FAILURE/);
  assert.ok(f.lines.some((l) => /push/.test(l)) && f.lines.some((l) => /boon/.test(l)));
});

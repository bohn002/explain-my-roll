// Plain-language explanations of roll cards: Alien RPG, D&D 5e and Dragonbane. Pure functions, no Foundry globals, so node can test them.

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

const STUNT_EXAMPLES = "For example: +1 damage on an attack, finishing the job faster, or learning an extra clue. Your rulebook lists the stunts for each skill.";

// card = {title, push, canPush, base: {n, sixes} | null, stress: {n, ones, sixes} | null}
export function explainAlien(card) {
  const {base, stress} = card;
  const sixes = (base?.sixes ?? 0) + (stress?.sixes ?? 0);
  const lines = [];

  if (!base) {
    // Stress dice only: a Supply roll. Each 1 uses up one point of that supply.
    const ones = stress?.ones ?? 0;
    return {
      tone: ones ? "warn" : "fine",
      headline: ones ? `Supply drops by ${ones}` : "Supply holds",
      lines: [
        `Supply rolls use dice equal to the supply rating. Each 1 uses up 1 point; you rolled ${plural(ones, "one")}.`,
        ones ? "The sheet's supply is reduced for you." : "No 1s, so nothing was used up.",
      ],
    };
  }

  let tone = sixes ? "fine" : "bad";
  let headline = sixes ? `SUCCESS: ${plural(sixes, "six", "sixes")}` : "FAIL: no sixes";
  lines.push(sixes ? "One 6 is enough to succeed at most actions." : "You need at least one 6 on any die to succeed.");
  if (sixes > 1) lines.push(`Each extra 6 beyond the first is a stunt: ${sixes - 1} to spend on a bonus effect. ${STUNT_EXAMPLES}`);

  if (stress && stress.n > 0) {
    if (stress.ones > 0) {
      tone = "warn";
      headline += ", but PANIC";
      lines.push(`${plural(stress.ones, "stress die", "stress dice")} ${stress.ones === 1 ? "shows" : "show"} a 1 (facehugger): you must make a Panic roll.`);
    } else {
      lines.push("No 1s on the yellow stress dice, so no Panic roll.");
    }
  }
  if (card.push) lines.push("This is a pushed roll: dice that weren't 6 were rerolled and you gained 1 Stress Level. Totals include the sixes from before the push.");
  else if (card.canPush) lines.push(`If you don't like it you can Push once: reroll every die that isn't a 6, but gain +1 Stress Level${sixes ? "" : ". Pushing is the only way to rescue a failed roll"}.`);

  lines.push("Legend: black dice are your base dice (6 = success, 1 = nothing). Yellow dice are stress dice (6 = success, 1 = panic).");
  return {tone, headline, lines};
}


// D&D 5e. d = {type, natural, all, advMode, total, target, crit}
// type: attack | damage | save | death | initiative | check (also skills, tools, ability checks)
export function explainD20(d) {
  const lines = [];
  const tone = (t) => ({tone: t, lines});
  if (d.type === "damage") {
    lines.push(`${d.total} damage before any resistance, vulnerability or immunity the target has.`);
    if (d.crit) lines.push("This was a critical hit, so the damage dice were rolled twice (doubled).");
    return {...tone(d.crit ? "fine" : "info"), headline: `DAMAGE: ${d.total}${d.crit ? " (critical)" : ""}`};
  }
  const nat = d.natural;
  const label = {attack: "ATTACK", save: "SAVING THROW", death: "DEATH SAVE", initiative: "INITIATIVE", check: "CHECK"}[d.type] ?? "ROLL";
  let kept = "";
  if (d.advMode === 1) kept = `Advantage: two d20s were rolled (${d.all.join(" and ")}) and the higher one, ${nat}, counts.`;
  else if (d.advMode === -1) kept = `Disadvantage: two d20s were rolled (${d.all.join(" and ")}) and the lower one, ${nat}, counts.`;
  lines.push(`You rolled a d20 and got ${nat}, plus your modifiers: the total is ${d.total}.`);
  if (kept) lines.push(kept);

  let headline = `${label}: ${d.total}`;
  let t = "info";
  const hasTarget = Number.isFinite(d.target);
  if (d.type === "attack") {
    lines.push("An attack hits if the total meets or beats the target's Armor Class (AC).");
    if (nat === 20) { t = "fine"; headline += " (natural 20: critical hit)"; lines.push("A natural 20 always hits and is a critical hit: roll the damage dice twice."); }
    else if (nat === 1) { t = "bad"; headline += " (natural 1: miss)"; lines.push("A natural 1 always misses, whatever the modifiers."); }
    else if (hasTarget) { t = d.total >= d.target ? "fine" : "bad"; headline += d.total >= d.target ? ` vs AC ${d.target}: HIT` : ` vs AC ${d.target}: MISS`; }
  } else if (d.type === "death") {
    lines.push("Death save: 10 or higher is a success, below 10 a failure. Three successes make you stable, three failures mean death.");
    if (nat === 20) { t = "fine"; headline += " (natural 20)"; lines.push("A natural 20 means you regain 1 hit point and wake up."); }
    else if (nat === 1) { t = "bad"; headline += " (natural 1)"; lines.push("A natural 1 counts as two failures."); }
    else { t = d.total >= 10 ? "fine" : "bad"; headline += d.total >= 10 ? ": SUCCESS" : ": FAILURE"; }
  } else if (d.type === "initiative") {
    lines.push("Everyone rolls once. The highest total acts first, then it goes down the list.");
  } else {
    lines.push(d.type === "save"
      ? "A saving throw succeeds if the total meets or beats the DC (difficulty) of the spell or effect. Success usually avoids or halves the effect."
      : "A check succeeds if the total meets or beats the DC (difficulty) the DM has set. Higher is always better.");
    if (hasTarget) { t = d.total >= d.target ? "fine" : "bad"; headline += d.total >= d.target ? ` vs DC ${d.target}: SUCCESS` : ` vs DC ${d.target}: FAILURE`; }
    if (nat === 20 || nat === 1) lines.push(`A natural ${nat} has no special effect on ${d.type === "save" ? "a save" : "a check"} in the core rules, though some tables house-rule it.`);
  }
  return {tone: t, headline, lines};
}

// Dragonbane. d = {type, result, target, success, isDragon, isDemon, banes, boons, canPush, autoSuccess}
export function explainDragonbane(d) {
  const lines = [];
  if (d.autoSuccess) return {tone: "fine", headline: "AUTOMATIC SUCCESS", lines: ["No roll was needed: the action simply succeeds."]};
  lines.push(`Dragonbane rolls a d20 and you want to roll equal to or LOWER than your skill or attribute. You rolled ${d.result} against ${d.target}.`);
  let tone, headline;
  if (d.isDragon) { tone = "fine"; headline = "DRAGON! Critical success"; lines.push("A 1 is a Dragon: the action succeeds and you get a bonus. In combat a Dragon on an attack lets you choose an extra effect (an extra attack, extra damage or piercing). Skill rolls also get an advancement mark."); }
  else if (d.isDemon) { tone = "bad"; headline = "DEMON! Critical failure"; lines.push("A 20 is a Demon: the roll fails badly and cannot be pushed. The GM decides the mishap (in combat, a fumble table). It also earns an advancement mark."); }
  else if (d.success) { tone = "fine"; headline = `SUCCESS (${d.result} ≤ ${d.target})`; lines.push("Equal to or under the target is a success."); }
  else { tone = "bad"; headline = `FAILURE (${d.result} > ${d.target})`; lines.push("Over the target is a failure."); }
  if (d.boons || d.banes) lines.push(`${d.boons ? `${plural(d.boons, "boon")}` : ""}${d.boons && d.banes ? " and " : ""}${d.banes ? `${plural(d.banes, "bane")}` : ""}: a boon rolls an extra d20 and keeps the LOWEST; a bane rolls an extra d20 and keeps the HIGHEST.`);
  if (d.canPush) lines.push("You can push this failed roll once to try again, at the cost of taking a condition (you choose which one).");
  return {tone, headline, lines};
}

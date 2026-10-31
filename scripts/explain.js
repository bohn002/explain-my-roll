// Plain-language explanations of Alien RPG roll cards. Pure functions, no Foundry globals, so node can test them.

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

const STUNT_EXAMPLES = "For example: +1 damage on an attack, finishing the job faster, or learning an extra clue. Your rulebook lists the stunts for each skill.";

// card = {title, push, canPush, base: {n, sixes} | null, stress: {n, ones, sixes} | null}
export function explainCard(card) {
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

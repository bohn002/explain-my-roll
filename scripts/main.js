import {explainAlien, explainD20, explainDragonbane} from "./explain.js";

const MODULE_ID = "explain-my-roll";

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, "enabled", {
    name: "Explain dice rolls",
    hint: "Add a short plain-language explanation under each roll card in chat (on this client).",
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
  });
});

// Each system gets a reader: (message, html) => {root, result} or null. root is where the explanation is appended.

// Alien RPG: read from what the card shows (dice faces), so it also works on old messages.
function alien(message, html) {
  const root = html.querySelector(".chatBG");
  if (!root) return null;
  const count = (cls) => root.querySelectorAll(`.alien-diceface-${cls}`).length;
  const title = root.querySelector("h2")?.textContent.trim() ?? "";
  const [b6, b0, y6, y1, y0] = ["b6", "b0", "y6", "y1", "y0"].map(count);
  const card = {
    title,
    push: title.startsWith(game.i18n.localize("ALIENRPG.Push")),
    canPush: !!root.querySelector("button.alien-Push-button"),
    base: b6 + b0 ? {n: b6 + b0, sixes: b6} : null,
    stress: y6 + y1 + y0 ? {n: y6 + y1 + y0, ones: y1, sixes: y6} : null,
  };
  if (!card.base && !card.stress) return null;
  if (title.includes(game.i18n.localize("ALIENRPG.Radiation"))) return null; // those cards already spell out the result
  return {root, result: explainAlien(card)};
}

// D&D 5e: read the message's rolls.
function dnd5e(message, html) {
  const roll = message.rolls?.[0];
  const die = roll?.dice?.[0];
  if (!die) return null;
  const root = html.querySelector(".message-content");
  const flagType = message.flags?.dnd5e?.roll?.type;
  if (die.faces === 20) {
    const kept = die.results.filter((r) => r.active).map((r) => r.result);
    const type = {attack: "attack", save: "save", death: "death", initiative: "initiative"}[flagType] ?? "check";
    const target = Number(roll.options?.target);
    return {root, result: explainD20({
      type,
      natural: kept[0] ?? die.total,
      all: die.results.map((r) => r.result),
      advMode: roll.options?.advantageMode ?? 0,
      total: Math.round(roll.total),
      target: Number.isFinite(target) ? target : NaN,
    })};
  }
  if (flagType === "damage") return {root, result: explainD20({type: "damage", total: Math.round(roll.total), crit: !!(roll.isCritical ?? roll.options?.critical)})};
  return null;
}

// Dragonbane: the message's own data holds the outcome.
function dragonbane(message, html) {
  const s = message.system;
  if (!["attributeTest", "skillTest", "weaponTest", "spellTest"].includes(message.type) || s?.result === undefined) return null;
  return {root: html.querySelector(".message-content"), result: explainDragonbane(s)};
}

const READERS = {alienrpg: alien, dnd5e, dragonbane};

Hooks.on("renderChatMessageHTML", (message, html) => {
  if (!game.settings.get(MODULE_ID, "enabled")) return;
  const read = READERS[game.system.id];
  if (!read || html.querySelector(".emr-explain")) return;
  const found = read(message, html);
  if (!found?.root) return;
  const {tone, headline, lines} = found.result;
  const box = document.createElement("details");
  box.className = `emr-explain ${tone}`;
  box.innerHTML = `<summary>What does this mean? ${headline}</summary><ul>${lines.map((l) => `<li>${l}</li>`).join("")}</ul>`;
  found.root.append(box);
});

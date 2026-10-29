import {explainCard} from "./explain.js";

const MODULE_ID = "explain-my-roll";

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, "enabled", {
    name: "Explain dice rolls",
    hint: "Add a short plain-language explanation under each Alien RPG roll card in chat (on this client).",
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
  });
});

// Read from what the card shows (dice faces), so it also works on old messages and on every client.
function readCard(root) {
  const count = (cls) => root.querySelectorAll(`.alien-diceface-${cls}`).length;
  const title = root.querySelector("h2")?.textContent.trim() ?? "";
  const [b6, b0, y6, y1, y0] = ["b6", "b0", "y6", "y1", "y0"].map(count);
  return {
    title,
    push: title.startsWith(game.i18n.localize("ALIENRPG.Push")),
    canPush: !!root.querySelector("button.alien-Push-button"),
    base: b6 + b0 ? {n: b6 + b0, sixes: b6} : null,
    stress: y6 + y1 + y0 ? {n: y6 + y1 + y0, ones: y1, sixes: y6} : null,
  };
}

Hooks.on("renderChatMessageHTML", (message, html) => {
  if (!game.settings.get(MODULE_ID, "enabled")) return;
  const root = html.querySelector(".chatBG");
  if (!root || root.querySelector(".emr-explain")) return;
  const card = readCard(root);
  if (!card.base && !card.stress) return;
  if (card.title.includes(game.i18n.localize("ALIENRPG.Radiation"))) return; // those cards already spell out the result
  const {tone, headline, lines} = explainCard(card);
  const box = document.createElement("details");
  box.className = `emr-explain ${tone}`;
  box.innerHTML = `<summary>What does this mean? ${headline}</summary><ul>${lines.map((l) => `<li>${l}</li>`).join("")}</ul>`;
  root.append(box);
});

"use strict";

const prompts = [
  "Hafiz",
  "Has a sibling at Imperial",
  "Been to a Premier League game",
  "Went to Brampton Manor",
  "Been to a different continent this year",
  "Speaks Arabic",
  "Been on TV",
  "Can cook a traditional meal from scratch",
  "Doesn’t study medicine or engineering",
  "Doesn’t drink coffee or tea",
  "Has a driver’s licence",
  "Plays or used to play FIFA like it’s a job",
  "Free space",
  "Done umrah",
  "Grew up in the Middle East",
  "Has gotten lost on campus",
  "Been to any South Kensington museum",
  "Speaks Urdu",
  "Has been locked out of their accom room already",
  "Is the youngest sibling",
  "Listens to halal beats while studying",
  "Still hasn’t unpacked",
  "Already has ID access to the prayer room",
  "Signed up for IGym/Ethos",
  "Brought a console to accom"
];

const previousPrompts = [
  "Done umrah",
  "Hafiz",
  "Speaks Arabic",
  "Speaks Urdu",
  "Can cook a traditional meal from scratch",
  "Signed up for IGym/Ethos",
  "Is the youngest sibling",
  "Listens to halal beats while studying",
  "Has been locked out of their accom room already",
  "Has a pet",
  "Brought a console to accom",
  "Grew up in the Middle East",
  "Already has ID access to the prayer room",
  "Went to Brampton Manor",
  "Can play a musical instrument",
  "Plays or used to play FIFA like it’s a job",
  "Has a driver’s licence",
  "Still hasn’t unpacked",
  "Been to any South Kensington museum",
  "Can recommend a good place to eat near campus",
  "Been to a Premier League game",
  "Doesn’t study medicine or engineering",
  "Been on TV",
  "Been to a different continent this year",
  "Has lived in more than one city",
  "Has a sibling at Imperial",
  "Has gotten lost on campus",
  "Doesn’t drink coffee or tea",
  "Free space",
  "Loves late-night conversations"
];

const freeSpaceId = 13;
const matchableCount = prompts.length - 1;
const storageKey = "human-bingo-project-matches-v2";
const oldStorageKey = "human-bingo-project-matches-v1";
const promptIds = new Map(prompts.map((prompt, index) => [normalizePrompt(prompt), index + 1]));
const grid = document.querySelector("#bingo-grid");
const dialog = document.querySelector("#name-dialog");
const input = document.querySelector("#person-name");
const saveButton = document.querySelector("#save-name");
const removeButton = document.querySelector("#remove-name");
const clearButton = document.querySelector("#clear-board");
const countLabel = document.querySelector("#match-count");
const bingoNotice = document.querySelector("#bingo-notice");
const dialogPrompt = document.querySelector("#dialog-prompt");
const dialogTitle = document.querySelector("#dialog-title");
let matches = loadMatches();
let activeId = null;
let lastActiveTile = null;

function normalizePrompt(prompt) {
  return prompt.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9]+/g, " ").trim();
}

function readMatches(key, migrateFromPreviousBoard = false) {
  const raw = localStorage.getItem(key);
  if (raw === null) return null;
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

  return Object.fromEntries(
    Object.entries(parsed)
      .filter(([oldId, name]) => {
        const index = Number(oldId) - 1;
        return Number.isInteger(Number(oldId)) && index >= 0 && index < (migrateFromPreviousBoard ? previousPrompts.length : prompts.length) && typeof name === "string" && name.trim();
      })
      .map(([oldId, name]) => {
        const oldIndex = Number(oldId) - 1;
        const id = migrateFromPreviousBoard
          ? promptIds.get(normalizePrompt(previousPrompts[oldIndex]))
          : Number(oldId);
        return [id, name.trim().slice(0, 48)];
      })
      .filter(([id]) => Number.isInteger(id) && id !== freeSpaceId)
  );
}

function loadMatches() {
  try {
    const current = readMatches(storageKey);
    if (current !== null) return current;
    const previous = readMatches(oldStorageKey, true) || {};
    if (Object.keys(previous).length) {
      localStorage.setItem(storageKey, JSON.stringify(previous));
    }
    return previous;
  } catch {
    return {};
  }
}

function saveMatches() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(matches));
  } catch {
    // The card remains usable if this browser cannot save locally.
  }
}

function hasBingo() {
  const marked = (id) => id === freeSpaceId || Boolean(matches[id]?.trim());
  for (let row = 0; row < 5; row += 1) {
    if (Array.from({ length: 5 }, (_, column) => marked(row * 5 + column + 1)).every(Boolean)) return true;
  }
  for (let column = 0; column < 5; column += 1) {
    if (Array.from({ length: 5 }, (_, row) => marked(row * 5 + column + 1)).every(Boolean)) return true;
  }
  if (Array.from({ length: 5 }, (_, row) => marked(row * 5 + row + 1)).every(Boolean)) return true;
  if (Array.from({ length: 5 }, (_, row) => marked(row * 5 + (4 - row) + 1)).every(Boolean)) return true;
  return false;
}

function makeSpan(className, text) {
  const span = document.createElement("span");
  span.className = className;
  span.textContent = text;
  return span;
}

function renderBoard() {
  grid.replaceChildren();
  prompts.forEach((prompt, index) => {
    const id = index + 1;
    const isFreeSpace = id === freeSpaceId;
    const matchedName = matches[id];
    const tile = document.createElement(isFreeSpace ? "div" : "button");
    tile.className = `tile${matchedName ? " tile-matched" : ""}${isFreeSpace ? " tile-free" : ""}`;
    if (!isFreeSpace) {
      tile.type = "button";
      tile.setAttribute("aria-pressed", String(Boolean(matchedName)));
      tile.setAttribute("aria-label", `${prompt}${matchedName ? ` — matched with ${matchedName}` : " — add a name"}`);
      tile.addEventListener("click", () => openEditor(id, tile));
    } else {
      tile.setAttribute("role", "group");
      tile.setAttribute("aria-label", "Free space; it counts toward a bingo line.");
    }

    const number = makeSpan("tile-number", String(id).padStart(2, "0"));
    if (isFreeSpace) number.append(makeSpan("free-tag", "FREE"));
    const footer = document.createElement("span");
    footer.className = "tile-footer";
    if (isFreeSpace) {
      footer.append(makeSpan("tap-hint", "Counts toward a line"));
    } else if (matchedName) {
      const check = makeSpan("check-mark", "✓");
      check.setAttribute("aria-hidden", "true");
      footer.append(check, makeSpan("matched-name", matchedName));
    } else {
      footer.append(makeSpan("tap-hint", "Tap to add a name"));
    }
    tile.append(number, makeSpan("tile-prompt", prompt), footer);
    grid.append(tile);
  });
  updateStatus();
}

function updateStatus() {
  const count = Object.values(matches).filter((name) => name.trim()).length;
  countLabel.replaceChildren(document.createTextNode(String(count)));
  const total = document.createElement("span");
  total.textContent = ` / ${matchableCount}`;
  countLabel.append(total);
  clearButton.disabled = count === 0;
  bingoNotice.hidden = !hasBingo();
}

function openEditor(id, tile) {
  activeId = id;
  lastActiveTile = tile;
  dialogPrompt.textContent = prompts[id - 1];
  dialogTitle.textContent = matches[id] ? "Edit the name" : "Add a name";
  input.value = matches[id] || "";
  removeButton.hidden = !matches[id];
  saveButton.disabled = !input.value.trim();
  dialog.showModal();
  input.focus();
}

input.addEventListener("input", () => {
  saveButton.disabled = !input.value.trim();
});

document.querySelector("#name-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const name = input.value.trim();
  if (activeId === null || !name) return;
  matches[activeId] = name.slice(0, 48);
  saveMatches();
  renderBoard();
  dialog.close();
});

removeButton.addEventListener("click", () => {
  if (activeId === null) return;
  delete matches[activeId];
  saveMatches();
  renderBoard();
  dialog.close();
});

document.querySelector("#close-dialog").addEventListener("click", () => dialog.close());
document.querySelector("#cancel-dialog").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});
dialog.addEventListener("close", () => {
  activeId = null;
  window.setTimeout(() => lastActiveTile?.focus(), 0);
});

clearButton.addEventListener("click", () => {
  const count = Object.values(matches).filter((name) => name.trim()).length;
  if (!count || !window.confirm("Clear all names from this bingo card?")) return;
  matches = {};
  saveMatches();
  renderBoard();
});

renderBoard();

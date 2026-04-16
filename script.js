const sourceText = document.getElementById("sourceText");
const languageSelect = document.getElementById("languageSelect");
const durationSelect = document.getElementById("durationSelect");
const startBtn = document.getElementById("startBtn");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const noteTitle = document.getElementById("noteTitle");
const noteText = document.getElementById("noteText");
const saveNoteBtn = document.getElementById("saveNoteBtn");
const copyPassageBtn = document.getElementById("copyPassageBtn");
const savedNotesSelect = document.getElementById("savedNotesSelect");
const loadNoteBtn = document.getElementById("loadNoteBtn");
const deleteNoteBtn = document.getElementById("deleteNoteBtn");

const testPanel = document.getElementById("testPanel");
const displayText = document.getElementById("displayText");
const typingInput = document.getElementById("typingInput");
const timeLeft = document.getElementById("timeLeft");
const statusLabel = document.getElementById("statusLabel");
const finishBtn = document.getElementById("finishBtn");
const resetBtn = document.getElementById("resetBtn");

const resultPanel = document.getElementById("resultPanel");
const rStrokes = document.getElementById("rStrokes");
const rWords = document.getElementById("rWords");
const rTentative = document.getElementById("rTentative");
const rMistakes = document.getElementById("rMistakes");
const rNet = document.getElementById("rNet");
const rMarks = document.getElementById("rMarks");
const rQualify = document.getElementById("rQualify");
const mistakeDetails = document.getElementById("mistakeDetails");
const mistakePreview = document.getElementById("mistakePreview");
const mistakeList = document.getElementById("mistakeList");

let timerId = null;
let remainingSeconds = 0;
let totalSeconds = 0;
let activePassage = "";
let isRunning = false;
let startedAtMs = 0;
const THEME_STORAGE_KEY = "ssc_typing_theme";
const NOTES_STORAGE_KEY = "ssc_typing_notes";

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function countErrorStrokes(expected, typed) {
  const compareLength = Math.min(expected.length, typed.length);
  let errorStrokes = 0;

  for (let i = 0; i < compareLength; i += 1) {
    if (expected[i] !== typed[i]) {
      errorStrokes += 1;
    }
  }

  // Extra characters typed beyond passage length are also errors.
  if (typed.length > expected.length) {
    errorStrokes += typed.length - expected.length;
  }

  return errorStrokes;
}

function calculateMarks(language, netWpm) {
  if (language === "english") {
    if (netWpm < 30) return 0;
    if (netWpm === 30) return 10;
    if (netWpm <= 35) return 12;
    if (netWpm <= 40) return 15;
    if (netWpm <= 45) return 18;
    if (netWpm <= 50) return 21;
    return 25;
  }

  if (netWpm < 25) return 0;
  if (netWpm === 25) return 10;
  if (netWpm <= 30) return 12;
  if (netWpm <= 35) return 15;
  if (netWpm <= 40) return 18;
  if (netWpm <= 45) return 21;
  return 25;
}

function isQualified(language, netWpm) {
  return language === "english" ? netWpm >= 30 : netWpm >= 25;
}

function applyTheme(theme) {
  if (theme === "light") {
    document.body.classList.add("light-theme");
    themeToggleBtn.textContent = "Dark Mode";
    return;
  }
  document.body.classList.remove("light-theme");
  themeToggleBtn.textContent = "Light Mode";
}

function initializeTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === "light" || savedTheme === "dark") {
    applyTheme(savedTheme);
    return;
  }
  // Default theme is dark mode.
  applyTheme("dark");
}

function getSavedNotes() {
  const raw = localStorage.getItem(NOTES_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveNotes(notes) {
  localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
}

function formatNoteLabel(note) {
  const date = new Date(note.createdAt);
  const dateLabel = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
  return `${note.title} (${dateLabel})`;
}

function renderSavedNotes(selectedId = "") {
  const notes = getSavedNotes();
  savedNotesSelect.innerHTML = "";

  if (notes.length === 0) {
    savedNotesSelect.innerHTML = `<option value="">No saved notes yet</option>`;
    return;
  }

  savedNotesSelect.innerHTML = `<option value="">Select a saved note</option>`;
  notes.forEach((note) => {
    const option = document.createElement("option");
    option.value = note.id;
    option.textContent = formatNoteLabel(note);
    savedNotesSelect.appendChild(option);
  });

  if (selectedId) {
    savedNotesSelect.value = selectedId;
  }
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildWordMistakeAnalysis(expectedText, typedText) {
  const expectedWords = expectedText.trim().split(/\s+/).filter(Boolean);
  const typedWords = typedText.trim().split(/\s+/).filter(Boolean);
  const maxWords = Math.max(expectedWords.length, typedWords.length);
  const items = [];
  const previewWords = [];

  for (let i = 0; i < maxWords; i += 1) {
    const expected = expectedWords[i] || "";
    const typed = typedWords[i] || "";

    if (expected && typed && expected === typed) {
      previewWords.push(
        `<span class="good-word">${escapeHtml(expected)}</span>`
      );
      continue;
    }

    let issueType = "spelling mismatch";
    if (!typed && expected) issueType = "missing word";
    if (typed && !expected) issueType = "extra word";
    if (
      expected &&
      typed &&
      expected.toLowerCase() === typed.toLowerCase() &&
      expected !== typed
    ) {
      issueType = "capitalization mismatch";
    }

    const previewToken = typed || expected;
    previewWords.push(`<span class="bad-word">${escapeHtml(previewToken)}</span>`);
    items.push({
      expected: expected || "(none)",
      typed: typed || "(none)",
      issueType,
    });
  }

  return {
    previewHtml: previewWords.join(" "),
    items,
  };
}

function renderMistakeDetails(expectedText, typedText) {
  const analysis = buildWordMistakeAnalysis(expectedText, typedText);
  if (analysis.items.length === 0) {
    mistakeDetails.classList.add("hidden");
    mistakePreview.innerHTML = "";
    mistakeList.innerHTML = "";
    return;
  }

  mistakeDetails.classList.remove("hidden");
  mistakePreview.innerHTML = analysis.previewHtml;
  mistakeList.innerHTML = analysis.items
    .map(
      (item, index) =>
        `<div class="mistake-row"><strong>${index + 1}.</strong> Expected: <strong>${escapeHtml(
          item.expected
        )}</strong> | Typed: <strong>${escapeHtml(
          item.typed
        )}</strong> | Issue: ${escapeHtml(item.issueType)}</div>`
    )
    .join("");
}

function endTest() {
  if (!isRunning) return;
  isRunning = false;
  clearInterval(timerId);
  statusLabel.textContent = "Finished";
  typingInput.disabled = true;

  const typed = typingInput.value;
  const typedStrokes = typed.length;
  const words = typedStrokes / 5;
  const elapsedSeconds = Math.max(
    1,
    Math.floor((Date.now() - startedAtMs) / 1000)
  );
  const minutesTaken = elapsedSeconds / 60;
  const tentativeSpeed = words / minutesTaken;
  const errorStrokes = countErrorStrokes(activePassage, typed);
  const mistakes = errorStrokes / 5;
  const netSpeed = Math.max(0, tentativeSpeed - mistakes);
  const netRounded = Math.floor(netSpeed);
  const marks = calculateMarks(languageSelect.value, netRounded);
  const qualify = isQualified(languageSelect.value, netRounded);

  rStrokes.textContent = typedStrokes.toString();
  rWords.textContent = words.toFixed(2);
  rTentative.textContent = tentativeSpeed.toFixed(2);
  rMistakes.textContent = mistakes.toFixed(2);
  rNet.textContent = netRounded.toString();
  rMarks.textContent = marks.toString();
  rQualify.textContent = qualify ? "Yes" : "No";
  renderMistakeDetails(activePassage, typed);
  resultPanel.classList.remove("hidden");
}

function tick() {
  if (remainingSeconds <= 0) {
    timeLeft.textContent = "00:00";
    endTest();
    return;
  }
  remainingSeconds -= 1;
  timeLeft.textContent = formatTime(remainingSeconds);
  if (remainingSeconds <= 0) {
    endTest();
  }
}

startBtn.addEventListener("click", () => {
  const text = sourceText.value.trim();
  if (!text) {
    alert("Please paste a passage first.");
    return;
  }

  activePassage = text;
  displayText.textContent = activePassage;
  typingInput.value = "";
  typingInput.disabled = false;
  typingInput.focus();

  totalSeconds = Number(durationSelect.value) * 60;
  remainingSeconds = totalSeconds;
  startedAtMs = Date.now();
  timeLeft.textContent = formatTime(remainingSeconds);
  statusLabel.textContent = "Running";

  testPanel.classList.remove("hidden");
  resultPanel.classList.add("hidden");
  isRunning = true;
  clearInterval(timerId);
  timerId = setInterval(tick, 1000);
});

finishBtn.addEventListener("click", endTest);

themeToggleBtn.addEventListener("click", () => {
  const isLight = document.body.classList.contains("light-theme");
  const nextTheme = isLight ? "dark" : "light";
  applyTheme(nextTheme);
  localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
});

copyPassageBtn.addEventListener("click", () => {
  noteText.value = sourceText.value.trim();
  if (!noteTitle.value.trim()) {
    noteTitle.value = `Paragraph ${new Date().toLocaleDateString()}`;
  }
});

saveNoteBtn.addEventListener("click", () => {
  const title = noteTitle.value.trim();
  const text = noteText.value.trim();
  if (!title || !text) {
    alert("Please enter both note title and paragraph.");
    return;
  }

  const notes = getSavedNotes();
  const newNote = {
    id: Date.now().toString(),
    title,
    text,
    createdAt: new Date().toISOString(),
  };
  notes.unshift(newNote);
  saveNotes(notes);
  renderSavedNotes(newNote.id);
  noteTitle.value = "";
  noteText.value = "";
  alert("Note saved locally.");
});

loadNoteBtn.addEventListener("click", () => {
  const selectedId = savedNotesSelect.value;
  if (!selectedId) {
    alert("Please select a saved note first.");
    return;
  }
  const notes = getSavedNotes();
  const note = notes.find((item) => item.id === selectedId);
  if (!note) {
    alert("Selected note was not found.");
    renderSavedNotes();
    return;
  }
  sourceText.value = note.text;
});

deleteNoteBtn.addEventListener("click", () => {
  const selectedId = savedNotesSelect.value;
  if (!selectedId) {
    alert("Please select a saved note to delete.");
    return;
  }

  const notes = getSavedNotes();
  const remaining = notes.filter((item) => item.id !== selectedId);
  saveNotes(remaining);
  renderSavedNotes();
  alert("Note deleted.");
});

typingInput.addEventListener("input", () => {
  if (!isRunning) return;

  const typed = typingInput.value;
  const hasCompleted = typed.length >= activePassage.length;

  if (hasCompleted) {
    endTest();
    return;
  }

  statusLabel.textContent = "Running";
});

resetBtn.addEventListener("click", () => {
  clearInterval(timerId);
  isRunning = false;
  remainingSeconds = 0;
  totalSeconds = 0;
  activePassage = "";
  startedAtMs = 0;
  typingInput.value = "";
  typingInput.disabled = true;
  displayText.textContent = "";
  timeLeft.textContent = "00:00";
  statusLabel.textContent = "Ready";
  testPanel.classList.add("hidden");
  resultPanel.classList.add("hidden");
  mistakeDetails.classList.add("hidden");
  mistakePreview.innerHTML = "";
  mistakeList.innerHTML = "";
});

initializeTheme();
renderSavedNotes();

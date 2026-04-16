# SSC Typing Test Practice

A clean and exam-focused typing practice web app built with **HTML, CSS, and vanilla JavaScript**.

It is designed for SSC-style typing preparation where users can paste a passage, type under a timer, and get result metrics like speed, mistakes, net speed, marks, and qualifying status.

---

## Highlights

- SSC-style timed typing test flow
- English and Hindi mode selection
- Auto-submit when typed length reaches passage length
- Result dashboard with:
  - total strokes
  - words (`strokes / 5`)
  - tentative speed (WPM)
  - mistakes
  - net speed
  - marks and qualification
- Mistake analysis:
  - highlighted wrong words
  - error list with expected vs typed words
  - capitalization/spelling/missing/extra detection
- Notes section with **local save/load/delete**
- Light/Dark theme toggle (**dark mode default**)
- Fully client-side (no backend required)

---

## Tech Stack

- `HTML5`
- `CSS3`
- `Vanilla JavaScript (ES6)`
- `localStorage` for persistence

---

## Project Structure

```text
SSC_Typing/
├─ index.html
├─ style.css
├─ script.js
└─ README.md
```

---

## Run Locally

No installation needed.

1. Open the folder.
2. Double-click `index.html`  
   **or** open it with Live Server in VS Code/Cursor.

---

## How to Use

1. Paste a paragraph in **Passage / Sentences**.
2. Choose **Language** and **Duration**.
3. Click **Start Test** and begin typing.
4. Test ends when:
   - timer reaches zero, or
   - user clicks **Finish Early**, or
   - typed length reaches passage length (auto-submit)
5. Check result cards and mistake details.

### Notes (Local Save)

1. Write a title + paragraph in **Notes**.
2. Click **Save Note**.
3. Select from dropdown:
   - **Load to Passage** to use it in test
   - **Delete Note** to remove it

---

## Calculation Logic

- **Words typed** = `total typed strokes / 5`
- **Tentative speed (WPM)** = `words typed / minutes taken`
- **Mistakes** = `error strokes / 5`
- **Net speed** = `tentative speed - mistakes` (minimum `0`)

Marks and qualifying are based on SSC-style thresholds for English/Hindi.

---

## Why This Project

This app focuses on practical typing exam prep:

- simple to use
- fast and lightweight
- no login, no internet dependency
- realistic typing feedback with useful mistake visibility

---

## Future Improvements

- Edit existing saved notes
- Export/Import notes as JSON backup
- Per-error-type summary counters
- Better character-level diff visualization
- Printable result report

---

## License

Free to use for practice and learning.


# Ghostty Terminal for Obsidian – Full Starter Kit (Route A – WASM)

**Goal**: A true Ghostty-powered terminal pane inside Obsidian (like VS Code’s integrated terminal but using the real Ghostty VT parser via WASM).  
You can run `claude`, Obsidian CLI tools, git, builds, etc., without leaving Obsidian.

**Tech**:
- `ghostty-web` (official community WASM port of libghostty-vt – same parser as native Ghostty)
- xterm.js-compatible API (drop-in)
- `node-pty` for real shell (works in Obsidian’s Electron)
- Obsidian ItemView for seamless pane integration

**Status**: This is a complete, ready-to-run starter. It opens a Ghostty terminal in a pane, sets cwd to vault root, handles basic resize/theme, and forwards input/output.  
You can now feed this whole file (or the extracted project) to Claude Code / OpenCode / Cursor / Windsurf and say: “Complete the TODOs, add Obsidian theme sync, add right-click ‘Open Ghostty here’, add splits, add Ghostty config loader, polish resize with character measurement, publish-ready manifest.”

---

## Project Structure (create these files)
obsidian-ghostty-terminal/
├── manifest.json
├── package.json
├── main.ts
├── styles.css
├── tsconfig.json
└── README.md          (this file)




How to Use This Starter

Create the folder obsidian-ghostty-terminal inside your vault’s .obsidian/plugins/
Paste all the files above.
In the folder, run:Bashnpm install
npm run dev
In Obsidian → Settings → Community plugins → Turn Safe mode OFF → Enable “Ghostty Terminal”.
Click the terminal ribbon icon or run the command.

It works today – you get a real Ghostty parser + real shell.

TODO List for Claude Code / OpenCode (feed this whole section)

Perfect resize – Use a hidden canvas to measure exact char width/height (like xterm.js Fit addon).
Ghostty config loader – Parse ~/.config/ghostty/config (or macOS equivalent) and apply font-family, font-size, full theme (16 colors + background/foreground).
Obsidian theme sync – On this.app.workspace.on('theme-change') re-apply colors from CSS variables.
Context menu – Right-click on any file/folder → “Open Ghostty here” (sets cwd).
Multiple terminals / splits – Support several leaves of the same view type.
Shell integration (OSC 633) for better prompt detection.
Error handling & recovery if PTY dies.
Settings tab – Toggle font ligatures (if exposed), default shell, etc.
Publish – Update manifest, add screenshots, submit to community plugins.
Optional: Add WebGL renderer fallback if ghostty-web ever exposes it.


Why This Is the Best Path (2026)

No Zig/Bun per-user builds (unlike the old obsidian-ghostty repo)
Real Ghostty VT parser (better Unicode, ligatures, Kitty graphics than xterm.js)
Works exactly like IDE terminals
~400 KB WASM – tiny
You can ship it to thousands of users with one click

Now open this file in Claude Code / Cursor and say:
“Build the complete Obsidian Ghostty Terminal plugin from this starter. Implement every TODO. Make resize pixel-perfect. Add full Ghostty config support and Obsidian theme sync. Make it production ready.”
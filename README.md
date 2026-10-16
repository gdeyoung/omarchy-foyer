# Foyer

**The entrance every session starts from.** A KRunner-style launcher for
Omarchy: it opens on `SUPER + SPACE` as the whole Omarchy menu tree — apps,
settings, session actions, everything — with a search box on top. The caret
sits in the box; arrows walk the menu, `Enter` selects, `Esc` backs up a
level. The first keystroke swaps the tree for live results grouped by kind:
applications, the whole Omarchy menu tree, session actions, folders, files,
recent files, open windows, a calculator with unit conversion, clipboard
history, shell commands and web search.

It is a fork of the first-party `omarchy.menu` plugin, so it follows the active
Omarchy theme with no configuration.

<div align="center">
<img src="preview.png" alt="foyer preview" width="720">
</div>

## Screenshots

<div align="center">

<img src="assets/foyer.png" alt="Collapsed: one input line" width="640"><br>
<sub>Collapsed: one input line</sub>

<img src="assets/foyeromarchy.png" alt="Results grouped by kind, with Ctrl+number quick launch" width="640"><br>
<sub>Results grouped by kind, with Ctrl+number quick launch</sub>

<img src="assets/foyertest.png" alt="Menu entries and files" width="640"><br>
<sub>Menu entries and files</sub>

<img src="assets/foyerapps.png" alt="The Apps list" width="640"><br>
<sub>The Apps list</sub>

<img src="assets/foyercb.png" alt="Clipboard history behind the cb prefix" width="640"><br>
<sub>Clipboard history behind the cb prefix</sub>

<img src="assets/foyerddgg.png" alt="Web search with dd and gg" width="640"><br>
<sub>Web search with dd and gg</sub>

<img src="assets/foyerfilter.png" alt="The Foyer Sources page" width="640"><br>
<sub>The Foyer Sources page</sub>

<img src="assets/foyersettings.png" alt="The Foyer Settings page" width="640"><br>
<sub>The Foyer Settings page</sub>

</div>

## Requirements

- Omarchy 4 with its Lua Hyprland config (`~/.config/hypr/bindings.lua`) and the
  Omarchy shell (Quickshell). Verified on Omarchy 4.0.4-1 with Hyprland 0.56.
- Older Omarchy releases that configure Hyprland through `hyprland.conf` are not
  supported: the keybinding steps below do not apply there, and focusing a
  window from the Windows results uses Hyprland's Lua dispatcher.

## Installation

foyer is a standard Omarchy shell plugin. Add it, then run the setup step
to choose its keys:

```bash
omarchy plugin add https://github.com/gdeyoung/foyer.git --enable
~/.config/omarchy/plugins/gdeyoung.foyer/bin/foyer-setup
```

The first command clones the plugin into
`~/.config/omarchy/plugins/gdeyoung.foyer`, validates it and enables it. The
second asks for the keys (see Keybindings below).

Optional packages (the setup step names any that are missing):

- `libqalculate` (provides `qalc`): unit, currency and function support in the
  calculator. Plain arithmetic works without it.
- `fzf`: fuzzy ranking for file search. Without it, file search matches names
  literally.

```bash
sudo pacman -S libqalculate fzf
```

## Updating

```
omarchy plugin update gdeyoung.foyer
```

After the update, the shell's file watcher starts a live reload of the changed
plugin. Give it a couple of seconds **before** running `omarchy restart shell` —
an IPC quit landing mid-reload trips a quickshell teardown bug (SIGSEGV in a
dangling engine-generation pointer; quickshell issue #1020, also reproduced on
stock Omarchy as omarchy #8547). One crash dialog is cosmetic — the fresh
instance runs the updated code:

```
omarchy plugin update gdeyoung.foyer --yes && sleep 3 && omarchy restart shell
```

Your keybindings survive an update. If you ever remove and re-add the plugin,
run `foyer-setup` or `foyer-apply` once to regenerate them: your keys are
kept in `~/.config/omarchy/foyer.json`, but the generated `foyer.lua`
lives in the plugin folder and goes with it.

## Keybindings

A plugin cannot declare keys itself, so foyer has a setup step:

```bash
~/.config/omarchy/plugins/gdeyoung.foyer/bin/foyer-setup
```

It asks which key opens foyer (default `SUPER + SPACE`, which replaces
Omarchy's menu key) and whether to bind a second key for the Apps list
(`SUPER + ALT + SPACE`). It then:

- saves the answers under `keys` in `~/.config/omarchy/foyer.json`;
- generates `foyer.lua` in the plugin folder and adds one `pcall(dofile, …)`
  line to `~/.config/hypr/hyprland.lua` (backed up first, harmless if the plugin
  is removed), then reloads Hyprland;
- offers to put the `foyer` command on your PATH (a link in
  `~/.local/bin`), so you can run `foyer toggle` from a terminal. The keys
  themselves do not need it.

Re-run it any time, or use **Keybindings…** on the Foyer Settings page. The
bar's Omarchy button and `SUPER + CTRL + SPACE` keep opening the Omarchy menu.

For scripts: `foyer-setup --yes --launcher "SUPER + R" --apps none` (add
`--no-path` to skip the PATH link), and `foyer-apply` to regenerate the binds
from `foyer.json`. Both live in the plugin's `bin/` folder.

Prefer to write the binds yourself? Add these to `~/.config/hypr/bindings.lua`
instead, then run `hyprctl reload`:

```lua
-- foyer replaces the Omarchy root menu on SUPER+SPACE (was: Omarchy menu).
-- The bar's Omarchy logo button and SUPER+CTRL+SPACE (background switcher)
-- stay on omarchy-menu.
local foyer = "$HOME/.config/omarchy/plugins/gdeyoung.foyer/bin/foyer"
hl.unbind("SUPER + SPACE")
o.bind("SUPER + SPACE", "foyer", foyer .. " toggle")
hl.unbind("SUPER + ALT + SPACE")
o.bind("SUPER + ALT + SPACE", "foyer apps", foyer .. " toggle apps")
```

## Usage

The `foyer` command drives the plugin from a terminal or a keybinding:

```
foyer [toggle|summon|close|refresh|ping|setup|apply] [route]
```

`toggle` is the default verb and `root` the default route. A route is a menu item
id (`setup.power`) or an alias (`power`), the same routes `omarchy-menu` accepts,
plus `sources` and `foyer-settings` for foyer's own pages. `setup` and
`apply` run `foyer-setup` and `foyer-apply`.

## Uninstallation

Take the keys out first, then remove the plugin:

```bash
~/.config/omarchy/plugins/gdeyoung.foyer/bin/foyer-apply --remove
omarchy plugin remove gdeyoung.foyer
```

`foyer-apply --remove` deletes the loader line from `hyprland.lua`, the
generated `foyer.lua` and the PATH link, then reloads Hyprland, which
restores Omarchy's own keys. If you wrote the binds by hand instead, remove those
lines from `bindings.lua` (the `local` line, the `hl.unbind` lines and the
`o.bind` lines) and run `hyprctl reload`.

## Development

Clone the repo and install it from the clone, as a user would, so you test what
users get:

```bash
git clone https://github.com/gdeyoung/foyer.git ~/Projects/foyer
omarchy plugin add ~/Projects/foyer --enable
```

To try a change, commit it in the clone, update the installed copy from it and
restart the shell. The update pulls from the plugin's origin, which is your
clone, so uncommitted edits do not reach the installed plugin:

```bash
cd ~/Projects/foyer && git commit -am "..."
omarchy plugin update gdeyoung.foyer
omarchy-restart-shell
```

To undo a tried change, `git revert` it and update again.

Run the unit tests with `npm test`. They cover the pure logic of every source
(`*Model.js`), row building and grouping in `RunnerModel.js`, the settings model,
the keybinding scripts, the structure of the QML files and the CLI.

A search source is a QML file exposing `sourceId`, `groupLabel`, `hint`,
`maxRows`, `enabled`, `search(query, serial)`, `activate(value, modifiers)` and
`signal results(int serial, var rows)`, optionally `claims(query)` (a prefix
source), `leading` (rows above the menu groups) or `fallback` (rows only when
nothing else matched). Add the instance to `root.sources` in `Runner.qml`; the
Sources page picks it up from there.

`bin/foyer-diff-upstream` compares the installed first-party menu plugin
against the vendored baseline in `upstream/`, which is how drift after an Omarchy
update becomes visible.

## Applications

Application rows come from Quickshell's `DesktopEntries`, read by `AppSource.qml`
through the pure helpers in `AppModel.js`, and filtered by the same
`default/omarchy/launcher.hides` list the Omarchy launcher uses. The shell's
shared `AppLibrary` is not reachable from a third-party menu plugin, so the
runner keeps its own source; the visible difference is that launching from
foyer does not raise the shell's launch OSD.

## What you can type

Results are grouped. Calculator and Open rows sit at the top; then Omarchy,
Applications and Session, whichever holds the best match first; then Windows,
Folders, Files and Recent. A search that matches nothing offers a web search.

| Type | Example | Enter | Shift+Enter |
|---|---|---|---|
| Apps, Omarchy menu | `firefox`, `theme` | launch / open | — |
| Session | `lock`, `sleep`, `restart`, `power off` | run it | — |
| Calculator | `2+2*3`, `=2` | copy the result | copy the result |
| Unit conversion (qalc) | `10 km to mi`, `100f to c`, `5 usd in eur`, `20% of 300` | copy the result | copy the result |
| Open | `github.com/x`, `https://…`, `localhost:8080`, `~/Downloads`, `/etc` | open it | copy the URL / reveal the folder |
| Folders | `documents`, `docmuents`, `etc`, `hypr` | open the folder | terminal in the folder |
| Files | `bindlua`, `invoice pdf` | open the file | reveal its folder |
| Recent | `recent` (the newest files), `recent report`, or part of a recently opened file's name | open | reveal its folder |
| Windows | part of a window title or app name | focus it | focus it |
| Command | `> htop` | run in a terminal | run in the background |
| Kill | `kill firefox` | `kill` (SIGTERM) | `kill -KILL` |
| Clipboard | `cb`, `cb git`, `cb scr` (images), `cb list` | paste into the previous window | copy only |
| Web | `br query`, `dd query`, `gg query`, `yt query`, `wiki query` | open in the browser | copy the URL |
| AI answers | `ai question` (or `? question`) | copy the answer | — |

Prefixes (`cb`, `>`, `kill`, `recent`, `br`/`dd`/`gg`/`yt`/`wiki`/`ai` followed by a query)
hand the whole list to that one source. Clipboard history appears only behind `cb`, so
copied secrets never show in an ordinary search.

**AI answers** ask one configured OpenAI-compatible endpoint once — the answer
is a result row (Enter copies it), with a second row handing the same question
to your web browser for the longer read. Configure it in
`~/.config/omarchy/foyer.json`:

```json
"ai": { "baseUrl": "http://localhost:4000/v1", "apiKey": "sk-…", "model": "…" }
```

Any OpenAI-compatible endpoint works (LiteLLM, ollama, llama.cpp, a cloud
provider). Without the section, `ai` is just an ordinary search. The key is
written to `~/.local/state/foyer/ai-curl.conf` (mode 600) and the request body
travels over stdin, so neither the key nor the question appears in a process
listing. There is no chat: one question, one answer, no history.

**Voice-friendly queries.** Dictating into the box works without saying
"colon": *brave search for arch wifi*, *google search nim vs rust*, *ask ai why
is dns slow*, *search the web for arch linux*, and dictated colons (*br colon
x*) all land in the right source.

Folder names forgive case and small typos. With fuzzy matching on (the
default), letters typed in order also match: `frfox` finds Firefox, and files are
ranked by `fzf`.

## Keys

| Key | Action |
|---|---|
| `Ctrl+1` … `Ctrl+9` | launch that row (add Shift for its Shift action) |
| `Enter` / `Shift+Enter` | launch the selected row / its alternate action |
| `Up` / `Down`, `PageUp` / `PageDown` | move the selection |
| `Escape` | clear the query, then close; on the Sources or Settings page, go back |
| `Backspace` / `Left` on an empty query | back out of a submenu |
| `Ctrl+P` | pin or unpin the selected result (Favorites) |
| `Ctrl+Up` / `Ctrl+Down` on Settings → Favorites | move the pinned item up or down |
| `Ctrl+,` or the filter button (top left) | Sources page, press again to close |
| `Ctrl+S` or the gear (top right) | Settings page, press again to close |

Shift+click works like Shift+Enter.

## Sources and settings

The **Foyer Sources** page (filter button, `Ctrl+,`) lists every search source with a short hint and an
**ON**/**OFF** badge at the right; Enter or a click toggles one. Applications,
Omarchy and Session can be switched off the same way.

The **Foyer Settings** page (gear, `Ctrl+S`) holds: accent colour, border,
category column, corner radius, Ctrl+number hints, Favorites, font, fuzzy
matching, hint size, position, opacity, Recent launches, row height, rows before
scrolling, text size, the version and GitHub link, and width. On/off settings show an **ON**/**OFF** badge after their
name; a choice (open it to see the presets, the current one has a dot) offers
presets and a **Custom…** entry: open the setting and type a value (a number in
the range the row names, a font name, or a `#rrggbb` colour for the accent),
then pick the **Use …** row.

The **accent colour** is the theme's own by default; pick another colour from the
theme's palette, or type a hex colour. It colours the selected row, the
ON/OFF badges and the choice dots. While Settings is open, the header shows the
version and a GitHub icon beside the gear; the icon opens the project on GitHub.
Turn it off with **Version and GitHub link**.

**Position** puts the launcher in the centre of the screen (default), higher up
(High, Higher, Almost top, Very top just under the bar) or a little lower (Low,
Lower). Results grow downward from the input line.

**Favorites** are results you pin with `Ctrl+P`: apps, files, folders, opened
locations and menu entries (up to 30). While Favorites is **ON** (the default),
they are listed under a *Favorites* heading whenever foyer opens with nothing
typed. Settings → Favorites lists them: Enter unpins one, and `Ctrl+Up` /
`Ctrl+Down` reorders. Open it to switch the start-screen list **ON**/**OFF** and
pick how many show (3, 5, 8, All or a typed number).

**Recent launches** (a switch, off by default, with 3, 5, 8 or a typed number to
show) lists what you launched last, under the favorites, instead of the bare
input line. Only apps, files, folders (including recent files) and menu actions
are recorded: never clipboard entries, typed commands, kill, calculator or web
searches. Apps that were uninstalled and files that no longer exist are left out
of the list. Favorites and history live in `~/.local/state/foyer/history.json`,
in a private directory, because it stores the commands of launched menu actions.

Both pages are stored in `~/.config/omarchy/foyer.json` (`sources`,
`settings`, `webSearchUrl` for the fallback web search — Brave by
default — and `ai` for the AI provider). Hand edits to an existing file are picked up while the shell runs; if
the file is first created after the shell started, restart the shell (or toggle
something once) for edits to be watched. If the file is not valid JSON,
foyer uses defaults and, on the next change, copies the broken file to
`foyer.json.bak` before writing a fresh one.

## Relationship to omarchy.menu

The first-party `omarchy.menu` plugin stays installed and untouched. It still
serves the Omarchy logo button in the bar, the `SUPER + CTRL + SPACE` background
switcher, and the `omarchy-menu-select` / `omarchy-menu-input` dmenu helpers,
which foyer deliberately does not implement.

## Credits

This is **gdeyoung's fork** of [thevideinfra/foyer](https://github.com/thevideinfra/foyer), kept for custom tweaks.

**Fork behavior — Menu on start:** with nothing typed, the launcher opens with the original
Omarchy root menu (Apps, Learn, Style, Setup, …) in the results area, under any favorites and
recents. Arrows walk it, Enter drills into a submenu, and the first keystroke swaps the whole
list for the live all-source search, KRunner-style. Toggle it with **Menu on start** on the
Foyer Settings page; turning it off restores upstream's bare input line.

foyer is a fork of the `omarchy.menu` plugin from
[Omarchy](https://github.com/omacom/omarchy) by David Heinemeier Hansson, and
would not exist without it. `Runner.qml` and `RunnerModel.js` descend from
Omarchy's `Menu.qml` and `MenuModel.js`, and `upstream/` keeps the unmodified
originals to track changes. Omarchy is MIT licensed; its copyright notice and
license text are in [`NOTICE`](NOTICE). The launcher design borrows from KDE's
KRunner and the COSMIC launcher.

## License

MIT, see [`LICENSE`](LICENSE). Third-party notices are in [`NOTICE`](NOTICE).

## Verified on

Omarchy 4.0.4-1.

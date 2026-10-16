import { test } from "node:test"
import assert from "node:assert/strict"
import { loadJsModule } from "./helpers/load-js-module.mjs"
const Handoffs = await loadJsModule("HandoffsModel.js")
const Snippets = await loadJsModule("SnippetsModel.js")
const Timer = await loadJsModule("TimerModel.js")
const Control = await loadJsModule("ControlModel.js")
const DateTime = await loadJsModule("DateTimeModel.js")
const Emoji = await loadJsModule("EmojiModel.js")
const Trash = await loadJsModule("TrashModel.js")
const Ssh = await loadJsModule("SshModel.js")
const Settings = await loadJsModule("SettingsModel.js")

// -- Handoffs

test("handoffs: defaults when unconfigured, config wins when set", () => {
  assert.equal(Handoffs.resolve({}).length, 6)
  assert.equal(Handoffs.resolve({ handoffs: [{ prefix: "gh", label: "X", url: "https://x/%s" }] }).length, 1)
  // Every default must survive sanitize, or the first edit silently drops it.
  assert.equal(Handoffs.sanitize(Handoffs.defaults()).length, 6)
})

test("handoffs: prefixes cannot shadow built-ins or break the rules", () => {
  assert.equal(Handoffs.sanitize([{ prefix: "br", label: "X", url: "https://x/%s" }]).length, 0)
  assert.equal(Handoffs.sanitize([{ prefix: "toolong", label: "X", url: "https://x/%s" }]).length, 0)
  assert.equal(Handoffs.sanitize([{ prefix: "ok1", label: "X", url: "https://x/search" }]).length, 0, "url needs %s")
})

test("handoffs: keyword rows open the URL with the query encoded", () => {
  const rows = Handoffs.rowsFor(Handoffs.defaults(), "gh kubernetes & helm")
  assert.equal(rows.length, 1)
  assert.equal(rows[0].label, "GitHub: kubernetes & helm")
  assert.equal(rows[0].value, "https://github.com/search?q=kubernetes%20%26%20helm")
  assert.deepEqual(Handoffs.rowsFor(Handoffs.defaults(), "ghcx nope"), [])
})

test("handoffs: a typed add line parses or refuses", () => {
  assert.deepEqual(Handoffs.parseTyped("gh GitHub https://github.com/search?q=%s"),
    { prefix: "gh", label: "GitHub", url: "https://github.com/search?q=%s" })
  assert.equal(Handoffs.parseTyped("cb Evil https://x/%s"), null, "reserved")
  assert.equal(Handoffs.parseTyped("gh https://x/%s"), null, "no label")
  assert.equal(Handoffs.parseTyped("gh GitHub x/%s"), null, "not a URL")
})

// -- Snippets

test("snippets: ;name rows copy their text", () => {
  const snippets = [{ name: "sig", text: "Best, Greg" }, { name: "addr", text: "123 Main St" }]
  assert.deepEqual(Snippets.rowsFor(snippets, ";sig").map(r => r.value), ["Best, Greg"])
  // A partial name lists every match.
  assert.equal(Snippets.rowsFor(snippets, ";a").length, 1)
  assert.equal(Snippets.rowsFor(snippets, ";nope").length, 0)
})

test("snippets: typed add line, names follow the rules", () => {
  assert.deepEqual(Snippets.parseTyped("sig Best, Greg"), { name: "sig", text: "Best, Greg" })
  assert.equal(Snippets.parseTyped("nodots.here x"), null)
  assert.equal(Snippets.parseTyped("nameonly"), null)
})

// -- Timers

test("timers: the everyday forms parse", () => {
  assert.deepEqual(Timer.parse("15 break"), { minutes: 15, message: "break" })
  assert.deepEqual(Timer.parse("10m break"), { minutes: 10, message: "break" })
  assert.deepEqual(Timer.parse("1h focus"), { minutes: 60, message: "focus" })
  assert.deepEqual(Timer.parse("remind 20m laundry"), { minutes: 20, message: "laundry" })
  assert.deepEqual(Timer.parse("remind 90 water the plants"), { minutes: 90, message: "water the plants" })
  assert.deepEqual(Timer.parse("remind 6p call michelle").clock, "18:00")
  assert.deepEqual(Timer.parse("remind 6:30p call").clock, "18:30")
  assert.deepEqual(Timer.parse("remind 9am standup").clock, "09:00")
})

test("timers: claims are narrow, not everything numeric", () => {
  assert.equal(Timer.claims("15 break"), true)
  assert.equal(Timer.claims("remind 20m laundry"), true)
  assert.equal(Timer.claims("reminders"), true)
  assert.equal(Timer.claims("2+2"), false)
  assert.equal(Timer.claims("10 km to mi"), false)
  assert.equal(Timer.claims("2048 game"), false)
})

test("timers: plain minutes call omarchy directly, clock times do date math", () => {
  assert.deepEqual(Timer.setArgv({ minutes: 15, message: "break" }), ["omarchy", "reminder", "15", "break"])
  const clockArgv = Timer.setArgv({ clock: "18:00", message: "call" })
  assert.equal(clockArgv[0], "bash")
  assert.ok(clockArgv[2].includes("omarchy reminder"))
})

test("timers: the row carries its parsed value for activate", () => {
  const row = Timer.rowFor(Timer.parse("15 break"))
  assert.equal(row.label, "Remind me in 15 min — break")
  assert.deepEqual(JSON.parse(row.value), { minutes: 15, message: "break" })
})

// -- Controls

test("controls: bright, vol, mute", () => {
  assert.deepEqual(Control.parse("bright 40"), { kind: "bright", value: 40 })
  assert.deepEqual(Control.parse("volume 20%"), { kind: "vol", value: 20 })
  assert.deepEqual(Control.parse("mute"), { kind: "mute", value: "toggle" })
  assert.deepEqual(Control.setArgv({ kind: "vol", value: 20 }), ["wpctl", "set-volume", "@DEFAULT_AUDIO_SINK@", "20%"])
  assert.deepEqual(Control.setArgv({ kind: "bright", value: 40 }), ["brightnessctl", "set", "40%"])
  assert.equal(Control.claims("bright 40"), true)
  assert.equal(Control.claims("brighten my day"), false)
  assert.equal(Control.claims("voltron"), false)
  assert.equal(Control.claims("vol 150"), false)
})

// -- Date/time

test("datetime: claims stay off ordinary searches", () => {
  assert.equal(DateTime.claims("time oslo"), true)
  assert.equal(DateTime.claims("in 2 weeks"), true)
  assert.equal(DateTime.claims("today"), true)
  assert.equal(DateTime.claims("oct 20"), true)
  assert.equal(DateTime.claims("oct 20 + 3 days"), true)
  assert.equal(DateTime.claims("timeshift"), false)
  assert.equal(DateTime.claims("inkscape"), false)
  assert.equal(DateTime.claims("internet"), false)
  assert.equal(DateTime.claims("in n out burger"), false)
})

test("datetime: rows from date output, city failures explain themselves", () => {
  const rows = DateTime.rowsFor("in 2 weeks", "Sat Oct 31, 2026\t 3:00 PM", 0)
  assert.equal(rows[0].label, "Sat Oct 31, 2026")
  assert.equal(rows[0].value, "Sat Oct 31, 2026")
  const oslo = DateTime.rowsFor("time oslo", " 9:20 PM\tCEST", 0)
  assert.equal(oslo[0].label, "9:20 PM — oslo (CEST)")
  const miss = DateTime.rowsFor("time zzqx", "", 3)
  assert.ok(miss[0].label.includes("No timezone"))
})

test("datetime: the real date command answers (live)", async () => {
  const { execFile } = await import("node:child_process")
  const { promisify } = await import("node:util")
  const run = promisify(execFile)
  const argv = DateTime.dateArgv("oct 20 + 3 days")
  const { stdout } = await run(argv[0], argv.slice(1))
  assert.match(stdout, /Oct 23, 2026/)
  // "in N units" must reach date -d without the word "in", which it rejects —
  // the silent fallback prints today's date instead.
  assert.equal(DateTime.dateArgv("in 2 weeks")[2].includes("'in 2 weeks'"), false)
  const inArgv = DateTime.dateArgv("in 2 weeks")
  const later = await run(inArgv[0], inArgv.slice(1))
  assert.match(later.stdout, /Oct 30, 2026/)
})

// -- Emoji

test("emoji: :name finds by name start, word, or tag", () => {
  assert.equal(Emoji.rowsFor(":fire")[0].value, "\u{1F525}")
  assert.equal(Emoji.rowsFor(":heart")[0].value, "\u2764\uFE0F")
  assert.ok(Emoji.rowsFor(":arrow").length >= 2)
  assert.ok(Emoji.rowsFor(":hot").length >= 1, "tag match")
  assert.deepEqual(Emoji.rowsFor(":zzz"), [])
  assert.equal(Emoji.claims(":fire"), true)
  assert.equal(Emoji.claims(": x"), false)
})

// -- Trash

test("trash: two-step confirm", () => {
  assert.equal(Trash.claims("empty trash"), true)
  assert.equal(Trash.claims("trash"), true)
  assert.equal(Trash.claims("trashcan"), false)
  assert.equal(Trash.rowsFor(false)[0].value, "arm")
  assert.equal(Trash.rowsFor(true)[0].value, "go")
  assert.deepEqual(Trash.emptyArgv(), ["gio", "trash", "--empty"])
})

// -- SSH

test("ssh: parses concrete Host entries, skips globs, carries user/host/port", () => {
  const config = [
    "Host gdtower watertower",
    "  User greg",
    "  Hostname 100.94.8.74",
    "Host aibox",
    "  Hostname 100.78.79.41",
    "  Port 2222",
    "Host *",
    "  Compression yes"
  ].join("\n")
  const hosts = Ssh.parseConfig(config)
  assert.deepEqual(hosts.map(h => h.name), ["gdtower", "watertower", "aibox"])
  assert.equal(Ssh.detailFor(hosts[0]), "greg@100.94.8.74")
  assert.equal(Ssh.detailFor(hosts[2]), "100.78.79.41:2222")
  const rows = Ssh.rowsFor(config, "ssh a")
  assert.equal(rows.length, 1)
  assert.equal(rows[0].value, "aibox")
  assert.equal(Ssh.claims("ssh gdtower"), true)
  assert.equal(Ssh.claims("ssh"), false)
})

// -- Settings integration

test("the Handoffs and Snippets pages stay inline and off the root search", () => {
  assert.equal(Settings.listsInline("foyer-handoffs"), true)
  assert.equal(Settings.listsInline("foyer-snippets"), true)
  assert.equal(Settings.listsInline("foyer-settings.width"), false)
})

test("the runner wires every new source and page", async () => {
  const { readFile } = await import("node:fs/promises")
  const qml = await readFile(new URL("../Runner.qml", import.meta.url), "utf8")
  const sources = ["handoffSource", "snippetSource", "timerSource", "controlSource", "dateTimeSource", "emojiSource", "trashSource", "sshSource"]
  const list = qml.match(/property var sources: \[(.*)\]/)[1]
  for (const s of sources) {
    assert.ok(qml.includes("id: " + s), s + " instantiated")
    assert.ok(list.includes(s), s + " in sources list")
  }
  assert.ok(qml.includes('id === "foyer-handoffs" || id.indexOf("foyer-handoffs.") === 0'), "skip list covers handoffs")
  assert.ok(qml.includes('id === "foyer-snippets" || id.indexOf("foyer-snippets.") === 0'), "skip list covers snippets")
  assert.ok(qml.includes('row.kind === "handoff-item"'), "Enter removes a handoff")
  assert.ok(qml.includes("function typedRowFor("), "typed add rows")
  assert.ok(qml.includes("function applyListOption("), "list apply routing")
  // Every FileView/Process user imports Quickshell.Io — a missing import
  // takes the whole plugin down at load (caught live 2026-10-16).
  const { readFile: readSrc } = await import("node:fs/promises")
  for (const f of ["SshSource.qml", "AiSource.qml", "TimerSource.qml", "DateTimeSource.qml", "LatestProcess.qml"]) {
    const src = await readSrc(new URL("../" + f, import.meta.url), "utf8")
    if (/\bFileView|\bProcess\s*\{/.test(src)) {
      assert.ok(src.includes("import Quickshell.Io"), f + " imports Quickshell.Io for FileView/Process")
    }
  }
})

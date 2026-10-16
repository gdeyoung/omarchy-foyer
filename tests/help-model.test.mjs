import { test } from "node:test"
import assert from "node:assert/strict"
import { loadJsModule } from "./helpers/load-js-module.mjs"
const H = await loadJsModule("HelpModel.js")

test("help rows are one page of unique, ordered notes under foyer-help", () => {
  const { rows } = H.pageRows()
  assert.ok(rows.length > 15)
  const ids = new Set(rows.map(r => r.id))
  assert.equal(ids.size, rows.length)
  for (const r of rows) {
    assert.equal(r.parent, H.PAGE_ID())
    assert.equal(r.kind, "note")
    assert.equal(typeof r.label, "string")
    assert.equal(typeof r.description, "string")
  }
  for (let i = 1; i < rows.length; i++) assert.ok(rows[i].order > rows[i - 1].order)
})

test("headings introduce grouped examples with dividers", () => {
  const { rows } = H.pageRows()
  const headings = rows.filter(r => r.section === "" && r.description === "")
  assert.deepEqual(headings.map(r => r.label),
    ["Opening and moving", "Quick answers", "Hand-offs to the right room", "Finding things", "Voice — dictate it"])
  const examples = rows.filter(r => r.section !== "")
  for (const e of examples) {
    assert.match(e.section, /^group:help\d$/)
    assert.ok(e.description.length > 0, "every example explains itself")
  }
})

test("the examples cover every prefix foyer claims", () => {
  const text = JSON.stringify(H.pageRows().rows)
  for (const prefix of ["ai:", "? ", "br ", "cb ", "kill ", "recent", "> htop", "Ctrl+P", "SUPER + SPACE", "ask ai"]) {
    assert.ok(text.includes(prefix), prefix)
  }
})

test("the runner wires the help page, button and F1", async () => {
  const { readFile } = await import("node:fs/promises")
  const { join } = await import("node:path")
  const root = new URL("..", import.meta.url).pathname
  const qml = await readFile(join(root, "Runner.qml"), "utf8")
  assert.ok(qml.includes('import "HelpModel.js" as HelpModel'))
  assert.ok(qml.includes('items[HelpModel.PAGE_ID()] = { id: HelpModel.PAGE_ID(), parent: "root"'))
  assert.ok(qml.includes("function toggleHelpPage()"))
  assert.ok(qml.includes("event.key === Qt.Key_F1"))
  assert.ok(qml.includes("id: helpButton"))
  assert.ok(qml.includes("anchors.right: gearButton.left"))
  assert.ok(qml.includes("anchors.right: helpButton.left"))
})

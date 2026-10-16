import { test } from "node:test"
import assert from "node:assert/strict"
import { loadRunnerModel } from "./helpers/load-runner-model.mjs"

const RunnerModel = await loadRunnerModel()

// A miniature tree in the JSONC shape the shell parses at startup, with the
// cases the start group must care about: normal submenus, a `when`-guarded
// submenu, and a submenu with no visible children at all.
const MENU_JSONC = `{
  "root": { "label": "Omarchy" },
  "apps": { "label": "Apps" },
  "apps.editor": { "label": "Editor", "action": "run-editor" },
  "style": { "label": "Style" },
  "style.theme": { "label": "Theme", "action": "omarchy-theme-menu" },
  "guarded": { "label": "Guarded", "when": "some-guard" },
  "guarded.child": { "label": "Child", "action": "run-child" },
  "barren": { "label": "Barren" }
}`

function merged() {
  return RunnerModel.mergeMenuSources(RunnerModel.parseMenuJsonc(MENU_JSONC), [])
}

test("the start menu group lists the root children in tree order", () => {
  const { items, itemOrder } = merged()
  const group = RunnerModel.startMenuGroup(items, itemOrder, {}, {})
  assert.equal(group.section, "start:menu")
  assert.equal(group.label, "Omarchy")
  assert.deepEqual(group.rows.map(r => r.label), ["Apps", "Style", "Guarded"])
})

test("rows carry child counts and the start section for drilldown", () => {
  const { items, itemOrder } = merged()
  const group = RunnerModel.startMenuGroup(items, itemOrder, {}, {})
  assert.equal(group.rows[0].childCount, 1)
  assert.equal(group.rows[0].section, "start:menu")
  assert.equal(group.rows[0].kind, "menu")
})

test("a `when` guard that evaluated false hides the subtree", () => {
  const { items, itemOrder } = merged()
  const group = RunnerModel.startMenuGroup(items, itemOrder, { guarded: false }, {})
  assert.deepEqual(group.rows.map(r => r.label), ["Apps", "Style"])
})

test("a submenu with no visible children is skipped", () => {
  const { items, itemOrder } = merged()
  const group = RunnerModel.startMenuGroup(items, itemOrder, {}, {})
  assert.ok(!group.rows.some(r => r.label === "Barren"))
})

test("a tree with nothing to show returns null", () => {
  const bare = RunnerModel.mergeMenuSources(RunnerModel.parseMenuJsonc(`{ "root": { "label": "Omarchy" } }`), [])
  assert.equal(RunnerModel.startMenuGroup(bare.items, bare.itemOrder, {}, {}), null)
})

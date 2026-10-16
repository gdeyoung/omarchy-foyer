import { test } from "node:test"
import assert from "node:assert/strict"
import { loadJsModule } from "./helpers/load-js-module.mjs"
const V = await loadJsModule("VoiceModel.js")

test("dictated phrases become source prefixes", () => {
  assert.equal(V.normalize("brave search for arch wifi"), "br arch wifi")
  assert.equal(V.normalize("brave search arch wifi"), "br arch wifi")
  assert.equal(V.normalize("search brave for arch wifi"), "br arch wifi")
  assert.equal(V.normalize("google search nim vs rust"), "gg nim vs rust")
  assert.equal(V.normalize("duckduckgo search hyprland gaps"), "dd hyprland gaps")
  assert.equal(V.normalize("youtube search lofi beats"), "yt lofi beats")
  assert.equal(V.normalize("ask ai why is dns slow"), "ai why is dns slow")
  assert.equal(V.normalize("ask the assistant about tailscale"), "ai tailscale")
})

test("search the web keeps the default-engine row", () => {
  assert.equal(V.normalize("search the web for arch linux"), "arch linux")
  assert.equal(V.normalize("look up internet hyprland docs"), "hyprland docs")
})

test("dictated colons collapse to the typed prefix form", () => {
  assert.equal(V.normalize("br : arch wifi"), "br: arch wifi")
  assert.equal(V.normalize("DD: arch wifi"), "dd: arch wifi")
  assert.equal(V.normalize("cb  :  copied text"), "cb: copied text")
})

test("ordinary queries pass through untouched, and normalize is idempotent", () => {
  for (const q of ["firefox", "google chrome", "brave browser", "ask a friend", "searching for cats", "ai why is dns slow", "br arch wifi", "why is dns slow"]) {
    assert.equal(V.normalize(V.normalize(q)), V.normalize(q), q)
  }
  assert.equal(V.normalize("google chrome"), "google chrome")
  assert.equal(V.normalize("ask a friend"), "ask a friend")
})

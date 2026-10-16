// Snippets: ";name" rows that copy their text to the clipboard. Stored in the
// config's top-level `snippets` list: [{ name, text }]. The settings page
// adds them by typing "name The text to copy" on the page.

function sanitize(configSnippets) {
  var list = Array.isArray(configSnippets) ? configSnippets : []
  var out = []
  var seen = {}
  for (var i = 0; i < list.length; i++) {
    var s = list[i]
    if (!s || typeof s !== "object") continue
    var name = String(s.name || "").trim().toLowerCase()
    var text = String(s.text || "")
    if (!/^[a-z0-9][a-z0-9-]{0,15}$/.test(name) || seen[name]) continue
    if (!text.trim() || text.length > 2000 || text.indexOf("\n") >= 0) continue
    seen[name] = true
    out.push({ name: name, text: text })
  }
  return out
}

function resolve(config) {
  return sanitize(config && config.snippets)
}

function claims(query) {
  return /^;\S/.test(String(query || "").trim())
}

// ";sig Best" -> { name: "sig", terms: "Best" }; name alone -> terms "".
function parseKeyword(query) {
  var match = /^;([a-z0-9][a-z0-9-]*)(?:\s+(.*))?$/i.exec(String(query || "").trim())
  return match ? { name: match[1].toLowerCase(), terms: match[2] || "" } : null
}

function rowsFor(snippets, query) {
  var hit = parseKeyword(query)
  if (!hit) return []
  var out = []
  for (var i = 0; i < snippets.length; i++) {
    var s = snippets[i]
    var byName = s.name.indexOf(hit.name) === 0
    var byTerms = hit.terms !== "" && s.name.indexOf(hit.terms.toLowerCase()) >= 0
    if (!byName && !byTerms) continue
    out.push({
      itemId: "snippet." + s.name, kind: "source", icon: "", iconFont: "", appIcon: "", appId: "",
      label: ";" + s.name + " · " + (s.text.length > 60 ? s.text.slice(0, 57) + "…" : s.text),
      target: "", detail: "Enter copies · Shift+Enter pastes", path: "", childCount: 0, action: "",
      provider: "", score: 0, section: "", sourceId: "snippets", value: s.text
    })
    if (out.length >= 8) break
  }
  return out
}

// "name The text" -> { name, text }; used by the settings page's typed row.
function parseTyped(text) {
  var match = /^([a-z0-9][a-z0-9-]*)\s+(\S.*)$/i.exec(String(text || "").trim())
  if (!match) return null
  var name = match[1].toLowerCase()
  if (!/^[a-z0-9][a-z0-9-]{0,15}$/.test(name) || match[2].length > 2000) return null
  return { name: name, text: match[2] }
}

function withSnippet(snippets, snippet) {
  var out = []
  for (var i = 0; i < snippets.length; i++) out.push(snippets[i].name === snippet.name ? snippet : snippets[i])
  if (out.every(function(s) { return s.name !== snippet.name })) out.push(snippet)
  return out
}

function withoutName(snippets, name) {
  var out = []
  for (var i = 0; i < snippets.length; i++) if (snippets[i].name !== name) out.push(snippets[i])
  return out
}

if (typeof module !== "undefined") {
  module.exports = { resolve: resolve, sanitize: sanitize, claims: claims, parseKeyword: parseKeyword,
    rowsFor: rowsFor, parseTyped: parseTyped, withSnippet: withSnippet, withoutName: withoutName }
}

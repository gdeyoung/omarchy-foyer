// Custom handoffs: your own "prefix query" rows that open a URL with the
// query in it - foyer hands off, the browser does the work. Lives in the
// config's top-level `handoffs` list: [{ prefix, label, url }] with "%s" in
// the url marking where the query goes.

// Prefixes foyer already claims; a handoff may not shadow them.
function RESERVED() {
  return ["br", "dd", "gg", "yt", "wiki", "cb", "kill", "ai", "recent", "time", "in", "vol", "volume",
    "bright", "brightness", "mute", "empty", "trash"]
}

function sanitize(configHandoffs) {
  var list = Array.isArray(configHandoffs) ? configHandoffs : []
  var out = []
  var seen = {}
  for (var i = 0; i < list.length; i++) {
    var h = list[i]
    if (!h || typeof h !== "object") continue
    var prefix = String(h.prefix || "").trim().toLowerCase()
    var label = String(h.label || "").trim()
    var url = String(h.url || "").trim()
    if (!validPrefix(prefix) || RESERVED().indexOf(prefix) >= 0 || seen[prefix]) continue
    if (!/^https?:\/\//.test(url) || url.indexOf("%s") < 0 || label.length > 24) continue
    seen[prefix] = true
    out.push({ prefix: prefix, label: label, url: url })
  }
  return out
}

function validPrefix(prefix) {
  return /^[a-z]{2,6}$/.test(String(prefix || ""))
}

function defaults() {
  return [
    { prefix: "gh", label: "GitHub", url: "https://github.com/search?q=%s" },
    { prefix: "mdn", label: "MDN", url: "https://developer.mozilla.org/en-US/search?q=%s" },
    { prefix: "aur", label: "AUR", url: "https://aur.archlinux.org/packages?K=%s" },
    { prefix: "amz", label: "Amazon", url: "https://www.amazon.com/s?k=%s" },
    { prefix: "el", label: "Elastic", url: "https://www.elastic.co/search?q=%s" },
    { prefix: "m", label: "Maps", url: "https://www.google.com/maps/search/%s" }
  ]
}

// The handoffs list from the config, with the defaults first for a config
// that never named any (hand-edited ones keep exactly what they listed).
function resolve(config) {
  var raw = config && config.handoffs
  if (raw === undefined) return defaults()
  return sanitize(raw)
}

// Which handoff a query invokes: "gh kubernetes" or "gh: kubernetes".
function parseKeyword(handoffs, query) {
  var text = String(query || "").trim()
  for (var i = 0; i < handoffs.length; i++) {
    var prefix = handoffs[i].prefix
    var match = new RegExp("^" + prefix + "(?::\\s*|\\s+)(.*)$", "i").exec(text)
    if (match && match[1].trim()) return { handoff: handoffs[i], terms: match[1].trim() }
  }
  return null
}

function openUrl(handoff, terms) {
  return String(handoff.url).replace("%s", encodeURIComponent(terms))
}

function rowsFor(handoffs, query) {
  var hit = parseKeyword(handoffs, query)
  if (!hit) return []
  return [row(hit.handoff, hit.terms)]
}

function row(handoff, terms) {
  return {
    itemId: "handoff." + handoff.prefix, kind: "source", icon: "", iconFont: "", appIcon: "", appId: "",
    label: handoff.label + ": " + terms, target: "", detail: "opens in the browser", path: "",
    childCount: 0, action: "", provider: "", score: 0, section: "", sourceId: "handoffs",
    value: openUrl(handoff, terms)
  }
}

// A typed "add handoff" line on the settings page:
// "gh GitHub https://github.com/search?q=%s" -> {prefix, label, url}.
function parseTyped(text) {
  var match = /^(\S+)\s+(\S.*\S)\s+(https?:\/\/\S+%s\S*)$/.exec(String(text || "").trim())
  if (!match) return null
  var prefix = match[1].toLowerCase()
  if (!validPrefix(prefix) || RESERVED().indexOf(prefix) >= 0) return null
  if (match[2].length > 24) return null
  return { prefix: prefix, label: match[2], url: match[3] }
}

function withoutPrefix(handoffs, prefix) {
  var out = []
  for (var i = 0; i < handoffs.length; i++) if (handoffs[i].prefix !== prefix) out.push(handoffs[i])
  return out
}

function withHandoff(handoffs, handoff) {
  return withoutPrefix(handoffs, handoff.prefix).concat([handoff])
}

if (typeof module !== "undefined") {
  module.exports = { defaults: defaults, resolve: resolve, sanitize: sanitize, validPrefix: validPrefix,
    RESERVED: RESERVED, parseKeyword: parseKeyword, openUrl: openUrl, rowsFor: rowsFor, row: row,
    parseTyped: parseTyped, withoutPrefix: withoutPrefix, withHandoff: withHandoff }
}

// SSH hosts from ~/.ssh/config: "ssh <host>" rows; Enter opens a terminal
// session. Host lines only - globs and aliases with * or ? are skipped.
function claims(query) {
  return /^ssh\s+\S/.test(String(query || "").trim().toLowerCase())
}

function terms(query) {
  var match = /^ssh\s+(.+)$/i.exec(String(query || "").trim())
  return match ? match[1].trim().toLowerCase() : ""
}

// Parse Host entries: one row per concrete host name. A Host line may name
// several hosts ("Host a b"); Hostname/Port/User under it apply to all of
// them, so they are tracked as a group. Globs (* ?) are skipped.
function parseConfig(text) {
  var lines = String(text || "").split("\n")
  var hosts = []
  var group = []
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].replace(/\s+#.*$/, "")
    var host = /^Host\s+(.+)$/i.exec(line)
    if (host) {
      group = []
      var names = host[1].trim().split(/\s+/)
      for (var n = 0; n < names.length; n++) {
        if (/[*?]/.test(names[n])) continue
        var entry = { name: names[n].toLowerCase(), hostname: "", port: "", user: "" }
        group.push(entry)
        hosts.push(entry)
      }
      continue
    }
    if (group.length === 0) continue
    var pair = /^(Hostname|Port|User)\s+(.+)$/i.exec(line.trim())
    if (pair) {
      var key = pair[1].toLowerCase()
      for (var g = 0; g < group.length; g++) {
        if (key === "hostname") group[g].hostname = pair[2].trim()
        if (key === "port") group[g].port = pair[2].trim()
        if (key === "user") group[g].user = pair[2].trim()
      }
    }
  }
  return hosts
}

function detailFor(host) {
  var parts = []
  if (host.user) parts.push(host.user + "@")
  parts.push(host.hostname || host.name)
  if (host.port) parts.push(":" + host.port)
  return parts.join("")
}

function rowsFor(text, query, maxRows) {
  var needle = terms(query)
  if (!needle) return []
  var hosts = parseConfig(text)
  var out = []
  for (var i = 0; i < hosts.length && out.length < (maxRows || 6); i++) {
    if (hosts[i].name.indexOf(needle) !== 0) continue
    out.push({
      itemId: "ssh." + hosts[i].name, kind: "source", icon: "", iconFont: "", appIcon: "", appId: "",
      label: hosts[i].name, target: "", detail: detailFor(hosts[i]) + " · opens a terminal", path: "",
      childCount: 0, action: "", provider: "", score: out.length, section: "", sourceId: "ssh",
      value: hosts[i].name
    })
  }
  return out
}

if (typeof module !== "undefined") {
  module.exports = { claims: claims, terms: terms, parseConfig: parseConfig, rowsFor: rowsFor }
}

// Machine controls: "bright 40" sets brightness, "vol 20" volume, "mute"
// toggles. One keystroke, no widget hunt; the row says what will happen.
function claims(query) { return parse(query) !== null }

// { kind: "bright"|"vol"|"mute", value: number|"toggle" } or null.
function parse(query) {
  var text = String(query || "").trim().toLowerCase()
  if (text === "mute" || text === "unmute") return { kind: "mute", value: "toggle" }
  var m = /^(vol|volume|bright|brightness)\s+(\d{1,3})\s*%?$/.exec(text)
  if (!m) return null
  var kind = m[1].charAt(0) === "v" ? "vol" : "bright"
  var value = Number(m[2])
  if (value > 100) return null
  return { kind: kind, value: value }
}

function setArgv(parsed) {
  if (parsed.kind === "mute") return ["wpctl", "set-mute", "@DEFAULT_AUDIO_SINK@", "toggle"]
  if (parsed.kind === "vol") return ["wpctl", "set-volume", "@DEFAULT_AUDIO_SINK@", parsed.value + "%"]
  return ["brightnessctl", "set", parsed.value + "%"]
}

function rowFor(parsed) {
  if (!parsed) return null
  var label = parsed.kind === "mute" ? "Mute — toggle audio"
    : parsed.kind === "vol" ? "Volume \u2192 " + parsed.value + "%"
    : "Brightness \u2192 " + parsed.value + "%"
  return {
    itemId: "control." + parsed.kind, kind: "source", icon: "", iconFont: "", appIcon: "", appId: "",
    label: label, target: "", detail: "applies now", path: "", childCount: 0, action: "", provider: "",
    score: 0, section: "", sourceId: "controls", value: JSON.stringify(parsed)
  }
}

if (typeof module !== "undefined") {
  module.exports = { claims: claims, parse: parse, setArgv: setArgv, rowFor: rowFor }
}

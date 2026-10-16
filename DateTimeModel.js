// Dates and times as answer rows: "time oslo" (a city's clock), "in 2 weeks",
// "today", "oct 20 + 3 days". GNU date does the math in one short process;
// the row's value (Enter copies it) is the formatted result.
function claims(query) {
  var text = String(query || "").trim().toLowerCase()
  if (/^time\s+\S/.test(text)) return true
  if (/^in\s+\d+\s+\S/.test(text)) return true
  if (text === "today" || text === "tomorrow" || text === "yesterday") return true
  return /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}(\s+\S.*)?$/.test(text)
}

// The argv: date with the query folded in. "time <city>" first resolves the
// city to a zoneinfo entry (basename match, case-insensitive).
function dateArgv(query) {
  var text = String(query || "").trim()
  var city = /^time\s+(.+)$/i.exec(text)
  if (city) {
    var word = city[1].trim().replace(/[^a-z_ -]/gi, "").replace(/\s+/g, "_")
    return ["bash", "-c",
      'z=$(find /usr/share/zoneinfo -maxdepth 2 -type f -iname ' + sh(word) + ' -not -path "*/right/*" -not -path "*/posix/*" | head -1); ' +
      '[ -n "$z" ] || exit 3; tz=$(basename "$(dirname "$z")")/$(basename "$z"); ' +
      'printf "%s\\t%s\\n" "$(TZ=$z date "+%l:%M %p")" "$(TZ=$z date +%Z)"']
  }
  return ["bash", "-c", 'date -d ' + sh(text) + ' "+%a %b %e, %Y\\t%l:%M %p" 2>/dev/null || date "+%a %b %e, %Y\\t%l:%M %p"']
}

function sh(text) { return "'" + String(text).replace(/'/g, "'\\''") + "'" }

// Rows from the process output ("4:20 PM\tCDT" or "Oct 19, 2026\t3:00 PM").
function rowsFor(query, output, exitCode) {
  var text = String(query || "").trim()
  var city = /^time\s+(.+)$/i.exec(text)
  if (city && exitCode !== 0) {
    return [{ itemId: "dt.nocity", kind: "source", icon: "", iconFont: "", appIcon: "", appId: "",
      label: "No timezone for \u201C" + city[1].trim() + "\u201D", target: "", detail: "try a city name, like oslo", path: "",
      childCount: 0, action: "", provider: "", score: 0, section: "", sourceId: "datetime", value: "" }]
  }
  if (exitCode !== 0 || !output) return []
  var parts = String(output).trim().split("\t")
  var label = parts[0] || ""
  var zone = parts[1] || ""
  if (city) {
    return [{ itemId: "dt.city", kind: "source", icon: "", iconFont: "", appIcon: "", appId: "",
      label: label + " — " + city[1].trim() + (zone ? " (" + zone + ")" : ""), target: "",
      detail: "Enter copies", path: "", childCount: 0, action: "", provider: "", score: 0,
      section: "", sourceId: "datetime", value: label }]
  }
  return [{ itemId: "dt.date", kind: "source", icon: "", iconFont: "", appIcon: "", appId: "",
    label: label, target: "", detail: (zone ? "" : "Enter copies") || "Enter copies", path: "",
    childCount: 0, action: "", provider: "", score: 0, section: "", sourceId: "datetime", value: label }]
}

if (typeof module !== "undefined") {
  module.exports = { claims: claims, dateArgv: dateArgv, rowsFor: rowsFor }
}

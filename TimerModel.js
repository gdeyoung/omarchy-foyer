// Timers and reminders: "15 break" or "remind 20m laundry" sets an Omarchy
// desktop-notification reminder; "reminders" lists the active ones. "remind"
// also accepts clock times: "remind 6p call michelle".
function claims(query) {
  var text = String(query || "").trim().toLowerCase()
  if (text === "reminders" || text === "timers") return true
  if (/^remind\s+\S/.test(text)) return true
  // A bare "N message" claims only when it really parses as a reminder, so
  // "2048 game" or "2+2" stays an ordinary search.
  return /^\d/.test(text) && parse(query) !== null
}

// { minutes, message } or { clock, message } or null. Forms:
//   15 break            -> 15, "break"
//   10m break           -> 10, "break"
//   1h focus            -> 60, "focus"
//   remind 20m laundry  -> 20, "laundry"
//   remind 90 water     -> 90, "water"
//   remind 6p call      -> minutes-until 18:00 (negative wraps to tomorrow)
//   remind 6:30p call   -> minutes-until 18:30
// A clock time needs a colon, a meridiem, or (behind "remind") a 1-12 hour,
// so "15 break" stays minutes and "2048 game" stays unparsed.
function parse(query) {
  var text = String(query || "").trim()
  var m = /^remind\s+(.*)$/i.exec(text)
  var body = m ? m[1] : text
  var hadRemind = !!m

  var clock = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm|a|p)?\s+(.*)$/i.exec(body)
  if (clock) {
    var hour = Number(clock[1])
    var minute = Number(clock[2] || 0)
    var mer = (clock[3] || "").toLowerCase()
    var hasColon = /:/.test(clock[0].split(/\s/)[0])
    var isClock = hasColon || mer !== "" || (hadRemind && hour >= 1 && hour <= 12)
    if (isClock) {
      if (mer === "pm" || mer === "p") { if (hour < 12) hour += 12 }
      else if (mer === "am" || mer === "a") { if (hour === 12) hour = 0 }
      else if (hour < 8) hour += 12 // "remind 6 call" means the evening one
      if (hour > 23 || minute > 59) return null
      return { clock: ("0" + hour).slice(-2) + ":" + ("0" + minute).slice(-2), message: clock[4].trim() }
    }
  }

  var amount = /^(\d+)\s*(m|min|mins|minutes|h|hr|hrs|hours)?\s*(.*)$/i.exec(body)
  if (!amount) return null
  // A message that starts with an operator is math or a year, not a reminder.
  if (/^[+\-*/^]/.test(amount[3])) return null
  // Unit conversions ("10 km to mi") belong to the calculator source.
  if (/\bto\b/.test(amount[3])) return null
  var n = Number(amount[1])
  var unit = (amount[2] || "m").toLowerCase()
  var minutes = unit.charAt(0) === "h" ? n * 60 : n
  if (!amount[3].trim()) return null
  if (minutes < 1 || minutes > 24 * 60) return null
  return { minutes: minutes, message: amount[3].trim() }
}

// The argv that sets a reminder. Clock times go through bash so date can do
// the until-now math; plain minutes call omarchy directly.
function setArgv(parsed) {
  if (parsed.clock) {
    return ["bash", "-lc",
      'm=$(( ($(date -d ' + shellQuoted(parsed.clock) + ' +%s) - $(date +%s) + 59) / 60 )); [ "$m" -lt 1 ] && m=$(( m + 1440 )); omarchy reminder "$m" ' + shellQuoted(parsed.message || "reminder")]
  }
  return ["omarchy", "reminder", String(parsed.minutes), parsed.message || "reminder"]
}

function shellQuoted(text) {
  return "'" + String(text).replace(/'/g, "'\\''") + "'"
}

function rowFor(parsed, query) {
  if (!parsed) return null
  var when = parsed.clock ? "at " + parsed.clock : "in " + parsed.minutes + " min"
  return {
    itemId: "timer.set", kind: "source", icon: "", iconFont: "", appIcon: "", appId: "",
    label: "Remind me " + when + " — " + parsed.message, target: "",
    detail: "desktop notification", path: "", childCount: 0, action: "", provider: "",
    score: 0, section: "", sourceId: "timers", value: JSON.stringify(parsed)
  }
}

// Rows for "omarchy reminder show --json" output: [{name, next}...]-ish.
function listRows(json) {
  var parsed
  try { parsed = JSON.parse(String(json || "")) } catch (e) { return [] }
  var list = Array.isArray(parsed) ? parsed : parsed && Array.isArray(parsed.timers) ? parsed.timers : []
  var rows = []
  for (var i = 0; i < list.length && rows.length < 6; i++) {
    var name = String(list[i].name || list[i].unit || "")
    var timer = name.indexOf("omarchy-reminder-") === 0 ? name.slice("omarchy-reminder-".length) : name
    var next = String(list[i].next || "")
    if (!timer || !next) continue
    rows.push({
      itemId: "timer.list." + i, kind: "source", icon: "", iconFont: "", appIcon: "", appId: "",
      label: timer, target: "", detail: next.replace(/ [A-Z]{3,4} .*$/, "") + " · fires", path: "",
      childCount: 0, action: "", provider: "", score: 0, section: "", sourceId: "timers", value: ""
    })
  }
  if (rows.length === 0) {
    rows.push({
      itemId: "timer.none", kind: "source", icon: "", iconFont: "", appIcon: "", appId: "",
      label: "No active reminders", target: "", detail: "type \u201C15 break\u201D to set one", path: "",
      childCount: 0, action: "", provider: "", score: 0, section: "", sourceId: "timers", value: ""
    })
  }
  return rows
}

function listArgv() { return ["omarchy", "reminder", "show", "--json"] }

if (typeof module !== "undefined") {
  module.exports = { claims: claims, parse: parse, setArgv: setArgv, rowFor: rowFor, listArgv: listArgv, listRows: listRows }
}

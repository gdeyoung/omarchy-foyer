// Trash: "trash" or "empty trash" -> a confirming row, Enter again empties
// it via gio. Two steps so a stray Enter cannot nuke the trash.
function claims(query) {
  var text = String(query || "").trim().toLowerCase()
  return text === "trash" || text === "empty trash" || text === "empty the trash"
}

function emptyArgv() { return ["gio", "trash", "--empty"] }

function rowsFor(armed) {
  if (!armed) {
    return [{
      itemId: "trash.arm", kind: "source", icon: "", iconFont: "", appIcon: "", appId: "",
      label: "Empty trash", target: "", detail: "press Enter to confirm", path: "", childCount: 0,
      action: "", provider: "", score: 0, section: "", sourceId: "trash", value: "arm"
    }]
  }
  return [{
    itemId: "trash.go", kind: "source", icon: "", iconFont: "", appIcon: "", appId: "",
    label: "Confirm — empty the trash now", target: "", detail: "this cannot be undone", path: "",
    childCount: 0, action: "", provider: "", score: 0, section: "", sourceId: "trash", value: "go"
  }]
}

if (typeof module !== "undefined") {
  module.exports = { claims: claims, emptyArgv: emptyArgv, rowsFor: rowsFor }
}

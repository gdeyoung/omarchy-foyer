import Quickshell
import QtQuick
import qs.Commons
import "TrashModel.js" as TrashModel

// "trash" / "empty trash": a confirming row first, Enter again empties it
// via gio. Two steps so a stray Enter cannot empty the trash.
Item {
  id: root
  property string sourceId: "trash"
  property string groupLabel: "Trash"
  property string hint: "empty trash — with a confirm"
  property int maxRows: 1
  property bool enabled: true
  property bool armed: false
  property int lastSerial: -1
  signal results(int serial, var rows)

  function claims(query) { return TrashModel.claims(query) }

  function search(query, serial) {
    root.lastSerial = serial
    root.results(serial, TrashModel.rowsFor(root.armed))
  }

  function cancel() { root.armed = false }

  function activate(value, modifiers) {
    if (String(value) === "arm") {
      root.armed = true
      root.results(root.lastSerial, TrashModel.rowsFor(true))
      return
    }
    if (String(value) === "go") {
      root.armed = false
      Util.execArgv(TrashModel.emptyArgv())
    }
  }
}

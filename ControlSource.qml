import Quickshell
import QtQuick
import qs.Commons
import "ControlModel.js" as ControlModel

// Machine controls: "bright 40", "vol 20", "mute" - applied immediately.
// The row's value carries the parsed control; activate applies it.
Item {
  id: root
  property string sourceId: "controls"
  property string groupLabel: "Controls"
  property string hint: "bright 40 · vol 20 · mute"
  property int maxRows: 1
  property bool enabled: true
  property bool leading: true
  signal results(int serial, var rows)

  function claims(query) { return ControlModel.claims(query) }

  function search(query, serial) {
    var row = ControlModel.rowFor(ControlModel.parse(query))
    root.results(serial, row ? [row] : [])
  }

  function cancel() {}

  function activate(value, modifiers) {
    var parsed = null
    try { parsed = JSON.parse(String(value || "")) } catch (e) { return }
    if (parsed) Util.execArgv(ControlModel.setArgv(parsed))
  }
}

import Quickshell
import QtQuick
import qs.Commons
import "TimerModel.js" as TimerModel

// Timers and reminders: "15 break", "remind 20m laundry", "remind 6p call"
// set an Omarchy desktop-notification reminder; "reminders" lists the active
// ones. The row's value carries the parsed reminder; activate sets it.
Item {
  id: root
  property string sourceId: "timers"
  property string groupLabel: "Reminders"
  property string hint: "15 break · remind 20m laundry · reminders"
  property int maxRows: 6
  property bool enabled: true
  property bool leading: true
  signal results(int serial, var rows)

  function claims(query) { return TimerModel.claims(query) }

  function search(query, serial) {
    var text = String(query || "").trim().toLowerCase()
    if (text === "reminders" || text === "timers") {
      runner.run(TimerModel.listArgv(), serial, "", "")
      return
    }
    var row = TimerModel.rowFor(TimerModel.parse(query), query)
    root.results(serial, row ? [row] : [])
  }

  function cancel() { runner.cancel() }

  function activate(value, modifiers) {
    var parsed = null
    try { parsed = JSON.parse(String(value || "")) } catch (e) { return }
    if (parsed) Util.execArgv(TimerModel.setArgv(parsed))
  }

  LatestProcess {
    id: runner
    onFinished: function(serial, query, exitCode, output) {
      root.results(serial, TimerModel.listRows(output))
    }
  }
}

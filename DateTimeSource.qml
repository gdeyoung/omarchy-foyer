import Quickshell
import QtQuick
import qs.Commons
import "DateTimeModel.js" as DateTimeModel

// Dates and times as answer rows: "time oslo", "in 2 weeks", "oct 20 + 3d".
// GNU date does the work in one short process; Enter copies the answer.
Item {
  id: root
  property string sourceId: "datetime"
  property string groupLabel: "Time"
  property string hint: "time oslo · in 2 weeks · oct 20"
  property int maxRows: 2
  property bool enabled: true
  property bool leading: true
  signal results(int serial, var rows)

  function claims(query) { return DateTimeModel.claims(query) }

  function search(query, serial) { runner.run(DateTimeModel.dateArgv(query), serial, query, "") }

  function cancel() { runner.cancel() }

  function activate(value, modifiers) { copy.run(value) }

  CopyRunner { id: copy }

  LatestProcess {
    id: runner
    onFinished: function(serial, query, exitCode, output) {
      root.results(serial, DateTimeModel.rowsFor(query, output, exitCode))
    }
  }
}

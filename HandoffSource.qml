import Quickshell
import QtQuick
import qs.Commons
import "HandoffsModel.js" as HandoffsModel

// Custom handoffs: your own "prefix query" rows that open a URL. The list
// lives in the config (Settings → Handoffs); without one, the seed defaults
// (gh, mdn, aur, amz, el, m) apply.
Item {
  id: root
  property string sourceId: "handoffs"
  property string groupLabel: "Handoffs"
  property string hint: "gh query · amz query · your prefixes — Settings → Handoffs"
  property int maxRows: 1
  property bool enabled: true
  property var config: ({})
  property var handoffs: HandoffsModel.resolve(config)
  signal results(int serial, var rows)

  function claims(query) { return HandoffsModel.parseKeyword(root.handoffs, query) !== null }

  function search(query, serial) { root.results(serial, HandoffsModel.rowsFor(root.handoffs, query)) }

  function cancel() {}

  function activate(value, modifiers) { Util.execArgv(["xdg-open", String(value)]) }
}

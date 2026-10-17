import Quickshell
import QtQuick
import qs.Commons
import "SnippetsModel.js" as SnippetsModel

// ";name" rows that copy their text. Snippets are defined on the Settings →
// Snippets page; the list lives in the config's `snippets` key.
Item {
  id: root
  property string sourceId: "snippets"
  property string groupLabel: "Snippets"
  property string hint: ";name — copies your text · Settings → Snippets"
  property int maxRows: 8
  property bool enabled: true
  property var config: ({})
  property var snippets: SnippetsModel.resolve(config)
  signal results(int serial, var rows)

  function claims(query) { return SnippetsModel.claims(query) }

  function search(query, serial) { root.results(serial, SnippetsModel.rowsFor(root.snippets, query)) }

  function cancel() {}

  function activate(value, modifiers) { copy.run(value) }

  CopyRunner { id: copy }
}

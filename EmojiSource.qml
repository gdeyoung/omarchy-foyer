import Quickshell
import QtQuick
import qs.Commons
import "EmojiModel.js" as EmojiModel

// ":fire" rows; Enter copies the character. A curated table of the useful
// ones - emoji plus the symbols people always hunt for (™, →, ±, …).
Item {
  id: root
  property string sourceId: "emoji"
  property string groupLabel: "Emoji"
  property string hint: ":fire — Enter copies"
  property int maxRows: 8
  property bool enabled: true
  signal results(int serial, var rows)

  function claims(query) { return EmojiModel.claims(query) }

  function search(query, serial) { root.results(serial, EmojiModel.rowsFor(query, root.maxRows)) }

  function cancel() {}

  function activate(value, modifiers) { copy.run(value) }

  CopyRunner { id: copy }
}

import Quickshell
import Quickshell.Io
import QtQuick
import qs.Commons
import "SshModel.js" as SshModel
import "CommandModel.js" as CommandModel

// "ssh <host>" rows from ~/.ssh/config; Enter opens a terminal session.
// Without a config file the source stays silent.
Item {
  id: root
  property string sourceId: "ssh"
  property string groupLabel: "SSH"
  property string hint: "ssh host — from ~/.ssh/config, opens a terminal"
  property int maxRows: 6
  property bool enabled: true
  property string configText: ""
  signal results(int serial, var rows)

  function claims(query) { return SshModel.claims(query) }

  function search(query, serial) { root.results(serial, SshModel.rowsFor(root.configText, query, root.maxRows)) }

  function cancel() {}

  function activate(value, modifiers) {
    var host = String(value || "")
    if (host) Util.execArgv(CommandModel.terminalArgv("ssh " + host))
  }

  FileView {
    path: Quickshell.env("HOME") + "/.ssh/config"
    printErrors: false
    onLoaded: { root.configText = text() }
    onFileChanged: { root.configText = text() }
  }
}

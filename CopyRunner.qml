import Quickshell
import Quickshell.Io
import QtQuick
import "Copy.js" as Copy

// Copies text to the Wayland clipboard without the contents landing in a
// process argument (see Copy.js). Drop one into a source as
// `CopyRunner { id: copy }` and call `copy.run(text)`.
Item {
  id: root

  // The sources' single entry point — Copy.run drives the Process below.
  function run(text) { Copy.run(proc, text) }

  Process {
    id: proc
    property string stdinData: ""
    stdinEnabled: true
    onStarted: if (proc.stdinData !== "") { proc.write(proc.stdinData); proc.stdinData = "" }
    stdout: SplitParser { }
  }
}

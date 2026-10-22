import Quickshell
import Quickshell.Io
import QtQuick
import qs.Commons
import "AiModel.js" as AiModel

// One-shot AI answers: "ai <question>" (or "? <question>") asks the configured
// OpenAI-compatible endpoint once. The answer is a row (Enter copies it); a
// second row hands the question to the browser. The key sits in a chmod-600
// curl config file under ~/.local/state/foyer, never in a process argument.
Item {
  id: root
  property string sourceId: "ai"
  property string groupLabel: "AI"
  property string hint: "ai + question — one concise answer · set ai.baseUrl/apiKey/model in ~/.config/omarchy/foyer.json"
  property int maxRows: 2
  property bool enabled: true
  property bool leading: true
  property var config: ({})
  property string webSearchUrl: ""
  property string home: Quickshell.env("HOME")
  readonly property string confPath: home + "/.local/state/foyer/ai-curl.conf"
  readonly property bool ready: !!(config && config.baseUrl && config.apiKey && config.model)
  signal results(int serial, var rows)

  Component.onCompleted: if (root.ready) root.writeConf()
  onReadyChanged: if (root.ready) root.writeConf()
  // The curl config must track the CURRENT key/endpoint/model: replacing one
  // provider's key with another's while every field stays nonempty keeps
  // `ready` true, so the ready-flip alone never rewrote the Authorization
  // header and requests left with the previous provider's key.
  readonly property string confSignature:
    [(config && config.baseUrl) || "", (config && config.apiKey) || "", (config && config.model) || ""].join("\u0000")
  onConfSignatureChanged: if (root.ready) root.writeConf()

  function writeConf() {
    writeConfText('header = "Authorization: Bearer ' + root.config.apiKey + '"\n')
  }

  // The writer must TERMINATE per write: Quickshell never closes stdin after
  // write(), so a child that cats stdin into the target waits for EOF
  // forever, stays running, and every later `running = true` is a no-op
  // (Quickshell does not restart an already-running Process) — the first key
  // would stick forever (marketplace finding @5a67454). One `read -r line`
  // consumes the payload and exits; the write itself is a fresh run each
  // time.
  function writeConfText(text) {
    if (confWriter.running) { confWriter.queued = text; return }
    confWriter.command = ["sh", "-c",
      'mkdir -p "$(dirname "$1")" && umask 077 && IFS= read -r line && printf \'%s\\n\' "$line" > "$1" && chmod 600 "$1"',
      "sh", root.confPath]
    confWriter.stdinData = text
    confWriter.running = true
  }

  function claims(query) { return root.ready && AiModel.claims(query) }

  function search(query, serial) {
    var question = AiModel.terms(query)
    if (!question) { runner.cancel(); root.results(serial, []); return }
    root.results(serial, AiModel.thinkingRows(question, root.config.model))
    runner.run(AiModel.curlArgs(root.config.baseUrl, root.confPath), serial, question,
      AiModel.stdinFor(AiModel.requestBody(root.config.model, question)))
  }

  function cancel() { runner.cancel() }

  // The answer row copies; the "web:" row opens the browser; errors no-op.
  function activate(value, modifiers) {
    var text = String(value || "")
    if (text.indexOf("web:") === 0) Util.execArgv(["xdg-open", text.slice(4)])
    else copy.run(text)
  }

  CopyRunner { id: copy }

  Process {
    id: confWriter
    property string stdinData: ""
    // a write that arrived while the writer was still live is drained here
    property string queued: ""
    stdinEnabled: true
    onStarted: if (confWriter.stdinData !== "") { confWriter.write(confWriter.stdinData); confWriter.stdinData = "" }
    onExited: function() {
      if (confWriter.queued !== "") {
        var q = confWriter.queued
        confWriter.queued = ""
        root.writeConfText(q)
      }
    }
    stdout: SplitParser { }
  }

  LatestProcess {
    id: runner
    onFinished: function(serial, question, exitCode, output) {
      var parsed = exitCode === 0 ? AiModel.parseResponse(output) : null
      root.results(serial, AiModel.rowsFor(question, parsed, root.config.model, root.webSearchUrl))
    }
  }
}

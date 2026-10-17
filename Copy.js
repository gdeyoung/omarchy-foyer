// Private clipboard copies: the text rides stdin as one base64 line and
// never appears in a process argument, so other local accounts cannot read
// it from /proc while the copy runs. Mirrors the curl idiom in AiModel.js:
// the shell's `read` consumes exactly one line, so Quickshell's stdin —
// which stays open — cannot hang the pipeline; wl-copy gets its EOF from
// the pipe.

function argv() {
  return ["sh", "-c",
    'IFS= read -r b64; printf "%s" "$b64" | base64 -d | exec wl-copy -t text/plain;charset=utf-8',
    "sh"]
}

// One base64 line (base64 never contains a raw newline), newline-terminated
// for `read`. The encodeURIComponent round-trip makes the byte count exact
// for any UTF-8 content.
function stdinFor(text) {
  return Qt.btoa(unescape(encodeURIComponent(String(text || "")))) + "\n"
}

// Start `proc` (the CopyRunner's Process, which declares stdinData) copying
// `text`. A still-running copy is killed first — wl-copy has already forked
// its serving child by then, so the clipboard keeps whatever it received.
function run(proc, text) {
  var s = String(text === undefined || text === null ? "" : text)
  if (s === "") return
  proc.running = false
  proc.stdinData = stdinFor(s)
  proc.command = argv()
  proc.running = true
}

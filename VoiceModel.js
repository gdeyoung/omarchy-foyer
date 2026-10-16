// Voice-friendly queries: dictation (VoxType or otherwise) lands whole phrases
// like "brave search for arch wifi" or "ask the assistant about dns" in the
// search box. normalize() rewrites those into the prefixes the sources already
// claim ("br arch wifi", "ai about dns"), and collapses dictated colons
// ("br : query" -> "br: query"). It is idempotent and never touches a query
// that does not start with one of the known phrases.
function normalize(query) {
  var text = String(query || "")

  // Dictated or typed colon forms: "br : query", "DD: query".
  text = text.replace(/^(dd|gg|yt|wiki|br|ai|cb|kill)\s*:\s*/i, function(all, prefix) {
    return prefix.toLowerCase() + ": "
  })

  // "google search x" — never a bare engine name, so app searches survive.
  text = text.replace(/^google\s+search\s+/i, "gg ")
  text = text.replace(/^duckduckgo\s+search\s+/i, "dd ")
  text = text.replace(/^youtube\s+search\s+/i, "yt ")
  text = text.replace(/^(?:brave\s+search|search\s+(?:with\s+)?brave)(?:\s+for)?\s+/i, "br ")

  // Filler left when the rewrite fired early (typing one character at a time
  // rewrites at "brave search " already): "br for x" is "br x".
  text = text.replace(/^(br|dd|gg|yt|wiki)\s+for\s+/i, "$1 ")

  // "search the web for x" — the plain query keeps the default-engine row.
  text = text.replace(/^(?:search|look\s*up)\s+(?:the\s+)?(?:web|internet)(?:\s+for)?\s+/i, "")

  // "ask ai x", "ask the assistant about x".
  text = text.replace(/^ask\s+(?:the\s+)?(?:ai|assistant|computer)\s+(?:about\s+|to\s+)?/i, "ai ")

  return text
}

if (typeof module !== "undefined") {
  module.exports = { normalize: normalize }
}

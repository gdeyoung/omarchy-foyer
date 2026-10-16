// One-shot AI answers: "ai <question>" (or "? <question>") asks the configured
// OpenAI-compatible endpoint once. The answer is a result row; a second row
// hands the question to the web browser for the longer read. The API key is
// never an argument: it lives in a chmod-600 curl config file, and the request
// body travels over stdin.
function SYSTEM() {
  return "You are the quick-answer source inside a launcher. Answer in 1-3 short plain sentences, no markdown, no preamble. If uncertain, say so in one sentence."
}

function claims(query) {
  return /^(?:ai|\?)\s+\S/.test(String(query || "").trim())
}

function terms(query) {
  var match = /^(?:ai|\?)\s+(.*)$/.exec(String(query || "").trim())
  return match ? match[1].trim() : ""
}

function requestBody(model, question) {
  return JSON.stringify({
    model: String(model || ""),
    messages: [
      { role: "system", content: SYSTEM() },
      { role: "user", content: String(question || "") }
    ],
    max_tokens: 300,
    temperature: 0.2
  })
}

// curl reads the Authorization header from the config file and the JSON body
// from stdin, so neither the key nor the question appears in /proc.
function curlArgs(baseUrl, confPath) {
  var url = String(baseUrl || "").replace(/\/+$/, "") + "/chat/completions"
  return ["sh", "-c",
    'exec curl -sS --max-time 25 --config "$1" -H "Content-Type: application/json" "$2" --data @-',
    "sh", confPath, url]
}

function parseResponse(output) {
  var parsed
  try { parsed = JSON.parse(String(output || "")) } catch (e) { return null }
  if (parsed && parsed.error) return { error: String(parsed.error.message || "endpoint error") }
  var content = parsed && parsed.choices && parsed.choices[0] && parsed.choices[0].message
    ? String(parsed.choices[0].message.content || "").trim() : ""
  return content ? { answer: content } : null
}

function row(itemId, label, detail, value) {
  return {
    itemId: itemId, kind: "source", icon: "", iconFont: "", appIcon: "", appId: "",
    label: label, target: "", detail: detail, path: "", childCount: 0, action: "", provider: "",
    score: 0, section: "", sourceId: "ai", value: value
  }
}

function thinkingRows(question, model) {
  return [row("ai.pending", "Asking " + String(model || "the model") + "…", "", "")]
}

function rowsFor(question, parsed, model, webSearchUrl) {
  if (!parsed) return [row("ai.error", "AI unavailable — check the ai settings or the endpoint", "", "")]
  if (parsed.error) return [row("ai.error", "AI: " + parsed.error, "", "")]
  var rows = [row("ai.answer", parsed.answer, "ai · " + String(model || ""), parsed.answer)]
  var base = String(webSearchUrl || "https://search.brave.com/search?q=")
  rows.push(row("ai.web", "More — search the web for \u201C" + question + "\u201D",
    "opens the browser", "web:" + base + encodeURIComponent(question)))
  return rows
}

if (typeof module !== "undefined") {
  module.exports = {
    claims: claims, terms: terms, requestBody: requestBody, curlArgs: curlArgs,
    parseResponse: parseResponse, thinkingRows: thinkingRows, rowsFor: rowsFor
  }
}

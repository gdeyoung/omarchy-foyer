import { test } from "node:test"
import assert from "node:assert/strict"
import { loadJsModule } from "./helpers/load-js-module.mjs"
const Ai = await loadJsModule("AiModel.js")

test("claims only prefixed questions", () => {
  assert.equal(Ai.claims("ai why is dns slow"), true)
  assert.equal(Ai.claims("ai: why is dns slow"), true)
  assert.equal(Ai.claims("AI: why is dns slow"), true)
  assert.equal(Ai.claims("? why is dns slow"), true)
  assert.equal(Ai.claims("ai"), false)
  assert.equal(Ai.claims("why is dns slow"), false)
  assert.equal(Ai.claims("aix archive"), false)
})

test("terms strips the prefix and keeps the question", () => {
  assert.equal(Ai.terms("ai why is dns slow"), "why is dns slow")
  assert.equal(Ai.terms("ai: why is dns slow"), "why is dns slow")
  assert.equal(Ai.terms("AI: spaced out"), "spaced out")
  assert.equal(Ai.terms("?  spaced out"), "spaced out")
  assert.equal(Ai.terms("nothing"), "")
})

test("the request body is one JSON POST with a short system prompt", () => {
  const body = JSON.parse(Ai.requestBody("local-fast", "why is dns slow"))
  assert.equal(body.model, "local-fast")
  assert.equal(body.max_tokens, 300)
  assert.equal(body.messages.length, 2)
  assert.equal(body.messages[0].role, "system")
  assert.equal(body.messages[1].content, "why is dns slow")
})

test("curl reads auth and body outside argv", () => {
  const argv = Ai.curlArgs("http://100.78.79.41:4000/v1/", "/state/ai-curl.conf")
  assert.equal(argv[0], "sh")
  assert.ok(argv[2].includes("--config \"$1\""))
  assert.ok(argv[2].includes("--data @-"))
  assert.ok(argv[2].includes("read -r body"))
  assert.ok(argv.includes("http://100.78.79.41:4000/v1/chat/completions"))
  assert.ok(!argv.join(" ").includes("Bearer"))
  assert.equal(Ai.stdinFor("{}"), "{}\n")
})

test("parseResponse takes the answer, the endpoint error, or nothing", () => {
  assert.deepEqual(Ai.parseResponse(JSON.stringify({ choices: [{ message: { content: "  Yes. " } }] })), { answer: "Yes." })
  assert.deepEqual(Ai.parseResponse(JSON.stringify({ error: { message: "bad key" } })), { error: "bad key" })
  assert.equal(Ai.parseResponse("not json"), null)
  assert.equal(Ai.parseResponse(JSON.stringify({})), null)
})

test("rows: the answer copies, a second row hands off to the browser", () => {
  const rows = Ai.rowsFor("why is dns slow", { answer: "MagicDNS overhead." }, "local-fast", "")
  assert.equal(rows.length, 2)
  assert.equal(rows[0].itemId, "ai.answer")
  assert.equal(rows[0].value, "MagicDNS overhead.")
  assert.equal(rows[1].itemId, "ai.web")
  assert.ok(rows[1].value.startsWith("web:https://"))
  assert.ok(rows[1].value.includes(encodeURIComponent("why is dns slow")))
})

test("thinking and error rows", () => {
  assert.equal(Ai.thinkingRows("q", "local-fast")[0].itemId, "ai.pending")
  assert.equal(Ai.rowsFor("q", null, "m", "").length, 1)
  assert.equal(Ai.rowsFor("q", { error: "nope" }, "m", "")[0].label, "AI: nope")
})

test("ai-curl.conf is rewritten whenever key/endpoint/model change, not only on ready flips", async () => {
  const { readFileSync } = await import("node:fs")
  const qml = readFileSync("AiSource.qml", "utf8")
  // signature over every credential-bearing field + change handler
  assert.match(qml, /confSignature:/)
  assert.match(qml, /config\.baseUrl.*config\.apiKey.*config\.model/s)
  assert.match(qml, /onConfSignatureChanged: if \(root\.ready\) root\.writeConf\(\)/)
  // the startup and ready-flip triggers remain (empty → configured)
  assert.match(qml, /Component\.onCompleted: if \(root\.ready\) root\.writeConf\(\)/)
  assert.match(qml, /onReadyChanged: if \(root\.ready\) root\.writeConf\(\)/)
})

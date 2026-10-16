// The Help page: what you can type, with examples. Opened by the "?" header
// button, F1, or a search for "help". Rows are plain informational notes in
// the menu tree — label is the example, description is what it does.

function PAGE_ID() { return "foyer-help" }

// Sections in order. A heading names a group; each example is one row.
function SECTIONS() {
  return [
    { heading: "Opening and moving", examples: [
      ["SUPER + SPACE", "open foyer"],
      ["type anything", "live results from every source"],
      ["Up · Down · Enter · Esc", "move, choose, back up, close"],
      ["Ctrl+P", "pin a result to Favorites"],
      ["Ctrl+S · Ctrl+,", "settings · sources"]
    ] },
    { heading: "Quick answers", examples: [
      ["2+2*3 · 10 km to mi", "calculator and units — Enter copies"],
      ["ai: why is dns slow", "one concise answer — Enter copies it"],
      ["? any question", "same as ai:"]
    ] },
    { heading: "Hand-offs to the right room", examples: [
      ["br arch wiki", "search Brave — also dd, gg, yt, wiki"],
      ["github.com/x · ~/Downloads", "open a URL or a folder"],
      ["> htop", "run a command in a terminal"],
      ["kill firefox", "end a process"],
      ["cb git", "clipboard history — never in plain search"]
    ] },
    { heading: "Finding things", examples: [
      ["fire", "apps, menu, files, windows at once"],
      ["recent report", "recently opened files"],
      ["nvim", "open window titles"]
    ] },
    { heading: "Voice — dictate it", examples: [
      ["ask ai why is dns slow", "dictated, lands in AI"],
      ["brave search for arch wifi", "dictated, lands in Brave"],
      ["search the web for omarchy", "dictated, default engine"]
    ] }
  ]
}

// The help page's rows, in display order. Headings are plain rows; each
// section's examples sit in their own divider group ("group:" sections get a
// gap, like the Settings page's pinned items).
function pageRows() {
  var rows = []
  var order = 0
  var sections = SECTIONS()
  for (var s = 0; s < sections.length; s++) {
    rows.push({ id: PAGE_ID() + "." + s + ".heading", parent: PAGE_ID(), kind: "note", icon: "", iconFont: "",
      label: sections[s].heading, title: "", target: "", description: "", action: "", provider: "",
      aliases: [], when: "", checked: "", value: "", order: order++, section: "" })
    for (var e = 0; e < sections[s].examples.length; e++) {
      rows.push({ id: PAGE_ID() + "." + s + "." + e, parent: PAGE_ID(), kind: "note", icon: "", iconFont: "",
        label: sections[s].examples[e][0], title: "", target: "", description: sections[s].examples[e][1],
        action: "", provider: "", aliases: [], when: "", checked: "", value: "", order: order++,
        section: "group:help" + s })
    }
  }
  return { rows: rows }
}

if (typeof module !== "undefined") {
  module.exports = { PAGE_ID: PAGE_ID, SECTIONS: SECTIONS, pageRows: pageRows }
}

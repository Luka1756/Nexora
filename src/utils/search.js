// Tool search: matches the query against name, keywords and description.
// Every word in the query must match somewhere; better matches rank higher.

const normalise = (text) => text.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')

function scoreTool(tool, words) {
  const name = normalise(tool.name)
  const keywords = tool.keywords.map(normalise)
  const description = normalise(tool.description)
  let total = 0

  for (const word of words) {
    let best = 0
    if (name.split(/\s+/).some((part) => part.startsWith(word))) best = 100
    else if (name.includes(word)) best = 80
    else if (keywords.some((keyword) => keyword.startsWith(word))) best = 60
    else if (keywords.some((keyword) => keyword.includes(word))) best = 40
    else if (description.includes(word)) best = 20
    if (best === 0) return 0
    total += best
  }
  return total
}

/** Returns matching tools, best first. An empty query returns no results. */
export function searchTools(tools, query, limit = 8) {
  const words = normalise(query).split(/\s+/).filter(Boolean)
  if (words.length === 0) return []

  return tools
    .map((tool, index) => ({ tool, index, score: scoreTool(tool, words) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map((entry) => entry.tool)
}

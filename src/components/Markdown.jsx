// ─── Minimal Markdown renderer ───────────────────────────────────────
//
// Renders the subset our deliverable generators emit (headings, tables,
// lists, task lists, rules, paragraphs, **bold**, _italic_, `code`) into
// React elements. Building elements instead of HTML keeps user-entered
// text from ever being interpreted as markup.

function inline(text, keyBase) {
  const parts = [];
  const re = /(\*\*[^*]+\*\*|_[^_]+_|`[^`]+`)/g;
  let last = 0;
  let m;
  let k = 0;
  const src = text.replace(/\\\|/g, "|");
  while ((m = re.exec(src))) {
    if (m.index > last) parts.push(src.slice(last, m.index));
    const tok = m[0];
    const key = `${keyBase}-${k++}`;
    if (tok.startsWith("**")) parts.push(<strong key={key}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("`")) parts.push(<code key={key} className="bg-gray-100 px-1 rounded text-[0.85em]">{tok.slice(1, -1)}</code>);
    else parts.push(<em key={key} className="text-gray-500">{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < src.length) parts.push(src.slice(last));
  return parts;
}

const splitRow = (line) =>
  line.trim().replace(/^\||\|$/g, "").split(/(?<!\\)\|/).map((c) => c.trim());

export default function Markdown({ source }) {
  const lines = source.split("\n");
  const blocks = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }

    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const cls = level === 1 ? "text-xl font-bold mt-2 mb-3" : level === 2 ? "text-base font-semibold mt-6 mb-2 pb-1 border-b" : "text-sm font-semibold mt-4 mb-1.5";
      const Tag = `h${level}`;
      blocks.push(<Tag key={key++} className={`${cls} text-gray-900`}>{inline(h[2], key)}</Tag>);
      i++;
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      blocks.push(<hr key={key++} className="my-5" />);
      i++;
      continue;
    }

    if (line.trim().startsWith("|") && lines[i + 1]?.trim().match(/^\|[\s|:-]+\|$/)) {
      const head = splitRow(line);
      const rows = [];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith("|")) rows.push(splitRow(lines[i++]));
      blocks.push(
        <div key={key++} className="overflow-x-auto my-2">
          <table className="text-xs border-collapse w-full">
            <thead><tr>{head.map((c, j) => <th key={j} className="border bg-gray-50 px-2 py-1 text-left font-semibold">{inline(c, `${key}h${j}`)}</th>)}</tr></thead>
            <tbody>{rows.map((r, ri) => <tr key={ri}>{r.map((c, j) => <td key={j} className="border px-2 py-1 align-top">{inline(c, `${key}-${ri}-${j}`)}</td>)}</tr>)}</tbody>
          </table>
        </div>
      );
      continue;
    }

    if (/^\s*-\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*-\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*-\s+/, ""));
      blocks.push(
        <ul key={key++} className="text-sm space-y-0.5 my-1.5 pl-1">
          {items.map((it, j) => {
            const task = it.match(/^\[( |x)\]\s+(.*)$/);
            if (task) {
              return (
                <li key={j} className="flex items-start gap-2">
                  <input type="checkbox" readOnly checked={task[1] === "x"} className="mt-1 rounded" />
                  <span>{inline(task[2], `${key}-${j}`)}</span>
                </li>
              );
            }
            return <li key={j} className="flex gap-2"><span className="text-gray-400">•</span><span>{inline(it, `${key}-${j}`)}</span></li>;
          })}
        </ul>
      );
      continue;
    }

    const para = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,3}\s|\||\s*-\s|---)/.test(lines[i])) para.push(lines[i++]);
    // A stray line that looks like a block start but isn't one (e.g. "|"
    // without a table separator) — render it as text so we always advance.
    if (para.length === 0) para.push(lines[i++]);
    blocks.push(
      <p key={key++} className="text-sm text-gray-700 my-1.5 leading-relaxed">
        {para.map((p, j) => <span key={j}>{inline(p.replace(/\s{2}$/, ""), `${key}-${j}`)}{j < para.length - 1 && <br />}</span>)}
      </p>
    );
  }

  return <div>{blocks}</div>;
}

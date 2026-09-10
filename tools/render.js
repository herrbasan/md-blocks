#!/usr/bin/env node
/*
MD-Blocks renderer (seed) — zero-dependency, three profiles from one parse:
  page  — continuous webpage
  print — A4 paged document (section = page, preset=page-break honored)
  deck  — slideshow (section = slide, keyboard nav, vars drive pacing)

NOT the reference renderer: the Markdown converter covers the CommonMark subset
the demos use (headings, paragraphs, lists, tables, quotes, fences, rules,
images, links, inline emphasis/code). Output is self-contained HTML+CSS per file.

Usage:  node tools/render.js <file.md> [profile]   profile: page|print|deck|all (default all)
Writes: <dir>/rendered/<name>.<profile>.html
*/

const fs = require('fs');
const path = require('path');

/* ---------------------------------------------------------------- parse */

const DIRECTIVE_RE = /^<!-- mb:(\/?)([a-z]+)((?: [^>]*?)?) -->$/;
const ATTR_RE = /([a-z][a-z0-9_-]*)=("[^"]*"|\[[^\]]*\]|\{[^}]*\}|[^\s]+)/g;

function parseAttrs(bodyRaw) {
  const attrs = {};
  let m; ATTR_RE.lastIndex = 0;
  while ((m = ATTR_RE.exec(bodyRaw)) !== null) {
    let v = m[2];
    if (v[0] === '"' || v[0] === '[' || v[0] === '{') { try { v = JSON.parse(v); } catch { } }
    attrs[m[1]] = v;
  }
  return attrs;
}

function parseYaml(text) {
  // minimal: scalars, [a, b] lists, one nesting level, numbers/booleans
  const root = {}; const stack = [[0, root]];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const indent = line.match(/^ */)[0].length;
    while (stack.length > 1 && stack[stack.length - 1][0] > indent) stack.pop();
    const parent = stack[stack.length - 1][1];
    const mm = line.match(/^ *([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!mm) continue;
    const [, key, rest] = mm;
    if (rest === '') { const obj = {}; parent[key] = obj; stack.push([indent + 2, obj]); }
    else if (rest.startsWith('[')) {
      parent[key] = rest.replace(/^\[|\]$/g, '').split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
    } else {
      const v = rest.replace(/^['"]|['"]$/g, '');
      parent[key] = v === 'true' ? true : v === 'false' ? false : (v !== '' && !isNaN(Number(v)) ? Number(v) : v);
    }
  }
  return root;
}

function parse(src) {
  const lines = src.split(/\r?\n/);
  let i = 0;
  const doc = { frontmatter: {}, sections: [] };
  if (lines[0] === '---') {
    const fm = [];
    for (i = 1; i < lines.length && lines[i] !== '---'; i++) fm.push(lines[i]);
    i++; doc.frontmatter = parseYaml(fm.join('\n'));
  }

  // A sink collects ordinary Markdown into an owning children array.
  // The section-level sink MUST wrap section.children — not a private array.
  const newSink = () => ({ children: [], buf: [] });
  const flush = sink => { if (sink.buf.length) { sink.children.push({ type: 'md', lines: sink.buf }); sink.buf = []; } };
  const newSection = () => {
    section = { attrs: {}, vars: [], children: [] };
    doc.sections.push(section);
    sink = { children: section.children, buf: [] };
    return section;
  };

  let section, sink;
  newSection();
  let mode = 'root';             // root | block | columns | col
  let block = null, columns = null, colSink = null;
  let fence = null;              // {char,len,dest} — dest: array lines accumulate into
  let expectVar = null;          // var awaiting its fence (blank lines between are legal)
  let varFence = null;           // {char,len,info,body,var} — consuming a var's payload fence

  for (; i < lines.length; i++) {
    const line = lines[i];

    // var fence consumption: everything until the closing fence is payload
    if (varFence) {
      const c = line.match(/^(`{3,}|~{3,})\s*$/);
      if (c && c[1][0] === varFence.char && c[1].length >= varFence.len) {
        varFence.var.value = varFence.info === 'json'
          ? JSON.parse(varFence.body.join('\n') || 'null')
          : varFence.body.join('\n');
        varFence = null;
      } else varFence.body.push(line);
      continue;
    }
    // a valueless var must meet its fence next
    if (expectVar) {
      if (line.trim() === '') continue;
      const fv = line.match(/^(`{3,}|~{3,})(.*)$/);
      if (fv && (fv[2].trim() === 'json' || fv[2].trim() === 'text')) {
        varFence = { char: fv[1][0], len: fv[1].length, info: fv[2].trim(), body: [], var: expectVar };
      }
      expectVar = null; // invalid binding: the validator reports it; parse on
      continue;
    }

    const fm = line.match(/^(`{3,}|~{3,})(.*)$/);
    if (fence) {
      fence.dest.push(line); // fence lines stay in the md stream
      if (fm && fm[1][0] === fence.char && fm[1].length >= fence.len) fence = null;
      continue;
    }
    if (fm) {
      const dest = mode === 'block' ? block.body : sink.buf;
      dest.push(line);
      fence = { char: fm[1][0], len: fm[1].length, dest };
      continue;
    }

    const dm = line.match(DIRECTIVE_RE);
    if (dm) {
      const [, slash, kind, bodyRaw] = dm;
      if (slash) {
        if (kind === 'block') {
          mode = colSink ? 'col' : 'root';
          (colSink || sink).children.push({ type: 'block', attrs: block.attrs, body: block.body });
          block = null;
        } else {
          flush(colSink);
          columns.cols.push({ attrs: colSink.attrs, children: colSink.children });
          colSink = null; mode = 'root';
          section.children.push({ type: 'columns', attrs: columns.attrs, cols: columns.cols });
          columns = null;
        }
        continue;
      }
      const attrs = parseAttrs(bodyRaw);
      if (kind === 'section') { section.attrs = attrs; continue; }
      if (kind === 'col') {
        if (colSink) { flush(colSink); columns.cols.push({ attrs: colSink.attrs, children: colSink.children }); }
        colSink = { attrs, ...newSink() }; mode = 'col'; continue;
      }
      if (kind === 'columns') { flush(sink); columns = { attrs, cols: [] }; mode = 'columns'; continue; }
      if (kind === 'var') {
        flush(sink);
        const v = { name: attrs.name, value: attrs.value };
        section.vars.push(v);
        if (attrs.value === undefined) expectVar = v;
        continue;
      }
      if (kind === 'block') {
        flush(sink);
        block = { attrs, body: [] }; mode = 'block';
        continue;
      }
    }

    // ordinary HTML comment: preserved in source, invisible in rendering
    if (/^<!--.*-->$/.test(line.trim())) continue;

    if (mode === 'root' && /^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      flush(sink);
      newSection();
      continue;
    }
    if (mode === 'block') block.body.push(line);
    else if (mode === 'col') colSink.buf.push(line);
    else if (mode === 'root') sink.buf.push(line);
    // 'columns' before first col: blanks/comments only (validated)
  }
  flush(sink);
  return doc;
}

/* ------------------------------------------------------- markdown → html */

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// output lives in <dir>/rendered/ — relative asset refs must climb one level
const src = s => /^(https?:|data:|#|\/)/.test(s) ? s : '../' + s;

function inline(s) {
  let rest = esc(s);
  const codes = [];
  rest = rest.replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return `\x00${codes.length - 1}\x00`; });
  rest = rest
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, s2) => `<img src="${src(s2)}" alt="${alt}" loading="lazy">`)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, h) => `<a href="${h}">${t}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
  rest = rest.replace(/\x00(\d+)\x00/g, (_, n) => `<code>${codes[+n]}</code>`);
  return rest;
}

function mdToHtml(lines) {
  const out = [];
  let para = [], list = null, quote = null, table = null, pre = null;
  const flushPara = () => { if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = []; } };
  const flushList = () => { if (list) { out.push(`<${list.tag}>${list.items.map(it => `<li>${inline(it)}</li>`).join('')}</${list.tag}>`); list = null; } };
  const flushQuote = () => { if (quote) { out.push(`<blockquote>${mdToHtml(quote)}</blockquote>`); quote = null; } };
  const flushTable = () => {
    if (table && table.rows.length) {
      const [head, ...body] = table.rows;
      out.push(`<table><thead><tr>${head.map(c => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${body.map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`);
    }
    table = null;
  };
  const flushAll = () => { flushPara(); flushList(); flushQuote(); flushTable(); };

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');

    if (pre) {
      if (new RegExp('^' + pre.char + '{3,}\\s*$').test(line)) { out.push(`<pre><code>${esc(pre.body.join('\n'))}</code></pre>`); pre = null; }
      else pre.body.push(line);
      continue;
    }
    if (/^(`{3,}|~{3,})/.test(line)) { flushAll(); pre = { char: line[0], body: [] }; continue; }

    if (line.trim() === '') { flushAll(); continue; }

    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) { flushAll(); out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); continue; }

    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) { flushAll(); out.push('<hr>'); continue; }

    if (line.startsWith('>')) { flushPara(); flushList(); flushTable(); (quote = quote || []).push(line.replace(/^>\s?/, '')); continue; }

    const t = line.match(/^\|(.+)\|\s*$/);
    if (t) {
      flushPara(); flushList(); flushQuote();
      const cells = t[1].split('|').map(c => c.trim());
      if (cells.every(c => /^:?-+:?$/.test(c))) continue;
      (table = table || { rows: [] }).rows.push(cells);
      continue;
    }

    const ul = line.match(/^[-*+]\s+(.*)$/);
    if (ul) { flushPara(); flushQuote(); flushTable(); if (!list || list.tag !== 'ul') { flushList(); list = { tag: 'ul', items: [] }; } list.items.push(ul[1]); continue; }

    const ol = line.match(/^\d+\.\s+(.*)$/);
    if (ol) { flushPara(); flushQuote(); flushTable(); if (!list || list.tag !== 'ol') { flushList(); list = { tag: 'ol', items: [] }; } list.items.push(ol[1]); continue; }

    flushList(); flushQuote(); flushTable();
    para.push(line.trim());
  }
  if (pre && pre.body.length) out.push(`<pre><code>${esc(pre.body.join('\n'))}</code></pre>`);
  flushAll();
  return out.join('\n');
}

/* ------------------------------------------------------------- profiles */

const PRESET_BLOCK = { lead: 'lead', note: 'callout note', warning: 'callout warning', card: 'card', cta: 'cta', 'page-break': 'page-break' };
const MEDIA_EXT = /\.(mp4|webm|mov|mp3|wav|ogg|m4a|pdf|zip)$/i;

function classifyBlock(block) {
  const body = block.body.filter(l => l.trim() !== '');
  if (!body.length) return { kind: 'empty' };
  const first = body[0];
  const img = first.match(/^!\[[^\]]*\]\(([^)]+)\)$/);
  if (img) return { kind: 'image', src: img[1], caption: body.slice(1) };
  if (/^[-*+]\s+!\[/.test(first)) {
    const items = [];
    for (const l of body) { const m2 = l.match(/^[-*+]\s+!\[([^\]]*)\]\(([^)]+)\)$/); if (m2) items.push({ alt: m2[1], src: m2[2] }); }
    const listLines = body.filter(l => /^[-*+]\s/.test(l)).length;
    if (items.length && items.length === listLines)
      return { kind: 'image-list', items, caption: body.slice(items.length) };
  }
  const link = first.match(/^\[!\[[^\]]*\]\([^)]+\)\]\(([^)]+)\)$/) || first.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
  if (link && MEDIA_EXT.test(link[1] || link[2] || '')) return { kind: 'media', caption: body.slice(1) };
  return { kind: 'text' };
}

function blockHtml(block) {
  const p = block.attrs.preset;
  if (p === 'page-break') return `<div class="page-break" data-preset="page-break"></div>`;
  const cls = ['block', PRESET_BLOCK[p] || ''].filter(Boolean).join(' ');
  const media = classifyBlock(block);
  if (media.kind === 'image' || media.kind === 'image-list') {
    const f = block.attrs.focal || {};
    const imgs = media.kind === 'image'
      ? `<img src="${src(media.src)}" alt="" style="object-position:${(f.x ?? .5) * 100}% ${(f.y ?? .5) * 100}%">`
      : `<div class="gallery-grid">${media.items.map(it => `<figure><img src="${src(it.src)}" alt="${esc(it.alt)}"></figure>`).join('')}</div>`;
    const cap = media.caption.length ? `<figcaption>${mdToHtml(media.caption)}</figcaption>` : '';
    return `<figure class="${cls} ${p === 'gallery' ? 'gallery' : 'hero'}" data-preset="${p || ''}">${imgs}${cap}</figure>`;
  }
  if (media.kind === 'media') return `<div class="${cls}" data-preset="${p || ''}">${media.caption.length ? mdToHtml(media.caption) : ''}</div>`;
  return `<div class="${cls}" data-preset="${p || ''}">${mdToHtml(block.body)}</div>`;
}

function childrenHtml(children) {
  return children.map(c => {
    if (c.type === 'md') return `<div class="md">${mdToHtml(c.lines)}</div>`;
    if (c.type === 'block') return blockHtml(c);
    if (c.type === 'columns') {
      const w = (c.attrs.weights && c.attrs.weights.length === c.cols.length)
        ? c.attrs.weights
        : c.cols.map(() => 1);
      const tmpl = w.map(x => `${x}fr`).join(' ');
      const cols = c.cols.map(col =>
        `<div class="col ${col.attrs.preset === 'card' ? 'card' : ''}">${childrenHtml(col.children)}</div>`).join('');
      return `<div class="columns" data-preset="${c.attrs.preset || ''}" style="grid-template-columns:${tmpl}">${cols}</div>`;
    }
    return '';
  }).join('\n');
}

const CSS_BASE = `
:root{
  --ink:#151a1f; --ink-2:#3a444f; --ink-3:#5f6975;
  --paper:#fbfaf7; --paper-2:#f3efe8; --card:#ffffff;
  --line:#e9e3d9; --line-2:#dad3c5;
  --accent:#0d6a5f; --accent-soft:#e7f1ef;
  --amber:#96571a; --amber-soft:#fbf1e4;
  --dark:#131b21; --dark-2:#1d2831; --dark-line:#2c3942; --dark-ink:#e8eef2; --dark-ink-2:#9db0bd;
  --r-sm:6px; --r:10px; --r-lg:16px;
  --sh-1:0 1px 2px rgba(20,26,33,.05), 0 1px 3px rgba(20,26,33,.04);
  --sh-2:0 2px 5px rgba(20,26,33,.05), 0 8px 20px rgba(20,26,33,.06);
  --sans:'Inter','Segoe UI Variable Text','Segoe UI',system-ui,-apple-system,sans-serif;
  --serif:'Iowan Old Style','Palatino Linotype',Palatino,Georgia,'Times New Roman',serif;
  --mono:'Cascadia Code',ui-monospace,Consolas,monospace;
}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font:17px/1.68 var(--serif);
  -webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
h1,h2,h3,h4,h5,h6{font-family:var(--sans);font-weight:600;line-height:1.2;letter-spacing:-.018em;margin:1.6em 0 .5em}
h1{font-size:clamp(1.9rem,3.4vw,2.6rem);letter-spacing:-.028em}
h2{font-size:1.4rem} h3{font-size:1.13rem} h4{font-size:1rem}
p{margin:.7em 0}
a{color:var(--accent);text-underline-offset:2px;text-decoration-thickness:1px}
strong{font-weight:600}
hr{border:0;border-top:1px solid var(--line);margin:2em 0}
img{max-width:100%;display:block;border-radius:var(--r);background:var(--paper-2)}
code{font:.87em/1.5 var(--mono);background:var(--paper-2);padding:.12em .4em;border-radius:5px;border:1px solid var(--line)}
pre{background:#1a2229;color:#dfe7ec;padding:1.1em 1.3em;border-radius:var(--r);overflow:auto;font-size:.9em}
pre code{background:none;border:0;padding:0;color:inherit}
blockquote{margin:1.4em 0;padding:.2em 0 .2em 1.3em;border-left:2px solid var(--accent);
  font-size:1.06em;font-style:italic;color:var(--ink-2)}
blockquote p{margin:.4em 0}
ul,ol{margin:.7em 0;padding-left:1.3em}
li{margin:.28em 0}
table{border-collapse:collapse;margin:1.2em 0;width:100%;font-family:var(--sans);font-size:.9rem}
th,td{padding:.6em .8em;text-align:left;border-bottom:1px solid var(--line)}
thead th{border-bottom:1.5px solid var(--line-2);font-weight:600;font-size:.83rem;
  text-transform:uppercase;letter-spacing:.06em;color:var(--ink-3)}
tbody tr:last-child td{border-bottom:0}
tbody tr:nth-child(even){background:var(--paper-2)}
figure{margin:0}
figcaption{font-family:var(--sans);font-size:.87rem;color:var(--ink-3);padding:.7em .1em 0;line-height:1.5}

/* prose measure: figures and column grids may use full width */
.md > p, .md > ul, .md > ol, .md > blockquote, .md > h2, .md > h3, .md > h4 { max-width:70ch }
.md > :first-child, .block > :first-child, .col > :first-child { margin-top:0 }
.md > :last-child, .block > :last-child, .col > :last-child { margin-bottom:0 }

/* blocks */
.block{margin:1.2em 0}
.block.lead{font-size:1.22em;line-height:1.6;color:var(--ink-2)}
.block.callout{background:var(--accent-soft);border-left:3px solid var(--accent);
  border-radius:0 var(--r) var(--r) 0;padding:1em 1.3em}
.block.callout.warning{background:var(--amber-soft);border-left-color:var(--amber)}
.block.callout h3{font-size:1rem;letter-spacing:0;margin:0 0 .35em;color:var(--accent)}
.block.callout.warning h3{color:var(--amber)}
.block.callout p:last-child{margin-bottom:0}
.block.card,.col.card{background:var(--card);border:1px solid var(--line);border-radius:var(--r-lg);
  padding:1.4em 1.5em;box-shadow:var(--sh-1)}
.block.cta{text-align:center;font-family:var(--sans);font-size:1.05rem;padding:1.2em;
  border:1px dashed var(--line-2);border-radius:var(--r-lg);background:#fff}
.block.cta p{margin:0}

/* media: ratios keep imagery from dominating the page */
figure.hero img{width:100%;aspect-ratio:21/9;object-fit:cover}
figure.gallery .gallery-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:.7em}
.gallery-grid figure{margin:0}
.gallery-grid img{width:100%;aspect-ratio:4/3;object-fit:cover}
.block.card img,.col.card img{width:100%;aspect-ratio:16/10;object-fit:cover}

/* columns */
.columns{display:grid;gap:1.5rem;align-items:start}
.columns .col{min-width:0}
.columns .col img{max-height:400px;object-fit:cover}
@media (max-width:820px){.columns{grid-template-columns:1fr !important}}

/* thematic sections */
section.region{padding:4.5rem max(6vw,calc((100vw - 1040px)/2))}
section.region + section.region{border-top:1px solid var(--line)}

/* Dark theme — ONE scope covering both containers a renderer may mark dark:
   section.region.dark (page/print) and .slide.dark (deck). Every inverting rule
   must live here: scoping these to the section alone left the deck rendering
   light text on white cards and code (contrast 1.17:1 — invisible). */
.dark{background:var(--dark);color:var(--dark-ink)}
.dark a{color:#7fd6c8}
.dark .block.lead{color:var(--dark-ink-2)}
.dark blockquote{border-left-color:#3f8f83;color:var(--dark-ink-2)}
.dark .block.callout{background:#1b2932;border-left-color:#3f8f83}
.dark .block.callout.warning{background:#2a2118;border-left-color:#c98a3e}
.dark .block.callout h3{color:#7fd6c8}
.dark .block.callout.warning h3{color:#e0a862}
.dark .block.card,.dark .col.card{background:var(--dark-2);border-color:var(--dark-line);box-shadow:none}
.dark .block.cta{background:#18222a;border-color:var(--dark-line);color:var(--dark-ink)}
.dark hr{border-top-color:var(--dark-line)}
.dark th,.dark td{border-bottom-color:var(--dark-line)}
.dark thead th{color:var(--dark-ink-2);border-bottom-color:#3a4a55}
.dark tbody tr:nth-child(even){background:#18222a}
.dark code{background:#1b2932;border-color:var(--dark-line);color:var(--dark-ink)}
.dark pre{background:#0f1519;border:1px solid var(--dark-line)}
.dark figcaption{color:var(--dark-ink-2)}
.dark img{background:#1b2932}
`;

const CSS_PAGE = `
header.doc{padding:5rem max(6vw,calc((100vw - 1040px)/2)) 1.5rem}
header.doc h1{margin:0}
header.doc::after{content:'';display:block;width:64px;height:3px;background:var(--accent);
  border-radius:2px;margin:1.3rem 0 0}
header.doc .meta{display:flex;flex-wrap:wrap;gap:.4rem;margin:1.1rem 0 0}
header.doc .meta span{font-family:var(--sans);font-size:.75rem;font-weight:600;letter-spacing:.07em;
  text-transform:uppercase;color:var(--accent);background:var(--accent-soft);
  border-radius:99px;padding:.32em .85em}
/* authored chrome — frontmatter header/footer, not directives */
.chrome-top{padding:.95rem max(6vw,calc((100vw - 1040px)/2));border-bottom:1px solid var(--line);
  font-family:var(--sans);font-size:.72rem;font-weight:600;letter-spacing:.14em;
  text-transform:uppercase;color:var(--ink-3)}
.chrome-foot{padding:2.5rem max(6vw,calc((100vw - 1040px)/2)) 3.5rem;border-top:1px solid var(--line);
  font-family:var(--sans);font-size:.75rem;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-3)}
`;

const CSS_PRINT = `
@page{size:A4;margin:0}
body{background:#e9e6e0;counter-reset:page;font-size:10.5pt;line-height:1.62}
.sheet{position:relative;background:#fff;width:210mm;min-height:297mm;
  margin:8mm auto;padding:20mm 18mm 24mm;counter-increment:page;
  box-shadow:0 1px 3px rgba(0,0,0,.09), 0 10px 30px rgba(0,0,0,.07)}
.sheet::after{content:counter(page);position:absolute;left:0;right:0;bottom:11mm;
  text-align:center;font-family:var(--sans);font-size:8.5pt;color:var(--ink-3);letter-spacing:.08em}
.sheet h1{font-size:1.85rem;padding-bottom:.35em;border-bottom:1.5px solid var(--line);margin:0 0 .9em}
.sheet h2{font-size:1.22rem;margin-top:1.6em}
.sheet h3{font-size:1.02rem}
.sheet img{width:100%;max-height:78mm;object-fit:cover}
.sheet .columns{gap:1.4rem}
.sheet table{font-size:.86rem}
.sheet.dochead{display:flex;flex-direction:column;justify-content:center;counter-increment:none}
.sheet.dochead::after{content:none}
.sheet.dochead h1{font-size:2.7rem;border:0;margin:0 0 .3rem;letter-spacing:-.03em;line-height:1.1}
.sheet.dochead .meta{font-family:var(--sans);font-size:.82rem;color:var(--ink-3);
  text-transform:uppercase;letter-spacing:.12em;margin:.2rem 0 0}
.sheet.dochead hr{border:0;border-top:3px solid var(--accent);width:70px;margin:1.6rem 0 0}
/* authored chrome — running head at the top, running foot beside the page number */
.sheet-head{position:absolute;top:12mm;left:18mm;right:18mm;padding-bottom:2.5mm;
  border-bottom:1px solid var(--line);font-family:var(--sans);font-size:7.5pt;
  letter-spacing:.12em;text-transform:uppercase;color:var(--ink-3)}
.sheet-foot{position:absolute;left:18mm;bottom:11mm;font-family:var(--sans);
  font-size:8.5pt;letter-spacing:.06em;color:var(--ink-3)}
section.region{padding:0}
.page-break{height:0;border-top:1px dashed var(--line-2);margin:2em 0}
@media print{
  body{background:#fff}
  .sheet{margin:0;box-shadow:none;width:auto;min-height:auto;padding:18mm;break-after:page}
  .sheet:last-child{break-after:auto}
  .page-break{break-after:page;height:0;border:none;margin:0}
}
`;

const CSS_DECK = `
body.deck{background:#0f1519;overflow:hidden}
#stage{position:fixed;inset:0;display:flex;align-items:center;justify-content:center}
#slideWrap{width:1280px;height:720px;position:relative;transform-origin:center center}
.slide{position:absolute;inset:0;display:flex;flex-direction:column;padding:74px 72px;
  background:var(--paper);color:var(--ink);border-radius:6px;overflow:hidden;
  opacity:0;visibility:hidden;transform:translateY(8px);
  transition:opacity .22s ease,transform .22s ease}
.slide.active{opacity:1;visibility:visible;transform:none}
/* content that exceeds the frame scrolls instead of being silently clipped */
.slide-body{flex:1;min-height:0;display:flex;flex-direction:column;
  justify-content:safe center;gap:.9rem;overflow-y:auto;overflow-x:hidden;
  scrollbar-width:thin;scrollbar-color:var(--line-2) transparent}
.slide-body::-webkit-scrollbar{width:6px}
.slide-body::-webkit-scrollbar-thumb{background:var(--line-2);border-radius:3px}
/* safety net: a plain Markdown image on a slide must not outgrow the frame.
   More specific rules (figure.hero, .gallery-grid, .col) override this. */
.slide-body img{max-height:260px;object-fit:cover}
.slide.overflowing::after{content:'';position:absolute;left:0;right:0;bottom:74px;height:46px;
  pointer-events:none;background:linear-gradient(to bottom,transparent,var(--paper))}
.slide.overflowing.dark::after{background:linear-gradient(to bottom,transparent,var(--dark))}
.slide.dark{background:linear-gradient(160deg,#182430 0%,#101820 100%);color:var(--dark-ink)}
.slide.cover h1{font-size:3rem;letter-spacing:-.035em}
.slide h1{font-size:2.5rem;margin:0 0 .1rem;letter-spacing:-.03em}
.slide h2{font-size:1.22rem;margin:.3em 0 .2em}
.slide h3{font-size:1rem}
.slide p{margin:.35em 0;font-size:1rem;line-height:1.6}
.slide .md > p,.slide .md > ul,.slide .md > ol,.slide .md > h2,.slide .md > h3{max-width:none}
.slide ul,.slide ol{padding-left:1.2em}
.slide li{margin:.16em 0}
.slide .block{margin:.6em 0}
.slide .block.lead{font-size:1.3rem;line-height:1.5}
.slide .block.lead p{font-size:inherit}
.slide .block.lead p,.slide .block.lead ul{max-width:46ch}
.slide .block.callout{padding:.85em 1.1em}
.slide .block.card,.slide .col.card{padding:1.1em 1.2em;border-radius:12px;box-shadow:var(--sh-1)}
.slide figure.hero{margin:0}
.slide figure.hero img{aspect-ratio:21/9;max-height:290px}
.slide figcaption{padding-top:.5em;font-size:.82rem}
.slide .gallery-grid{gap:.6rem;grid-template-columns:repeat(auto-fit,minmax(150px,1fr))}
.slide .gallery-grid img{aspect-ratio:16/10;max-height:210px}
.slide .columns{gap:1.1rem;align-items:stretch}
.slide .col img{aspect-ratio:16/10;max-height:145px}
.slide .col.card img{max-height:145px}
.slide blockquote{margin:.6em 0;font-size:1.5rem;line-height:1.5;border-left-width:3px;max-width:34ch}
.slide table{font-size:.84rem;margin:.6em 0}
.slide th,.slide td{padding:.45em .6em}
/* authored chrome — dim running head/foot inside the slide frame */
.slide-head,.slide-foot{position:absolute;left:72px;right:72px;font-family:var(--sans);
  font-size:.67rem;letter-spacing:.16em;text-transform:uppercase;color:var(--ink-3)}
.slide-head{top:30px;padding-bottom:9px;border-bottom:1px solid var(--line)}
.slide-foot{bottom:30px}
.slide.dark .slide-head{border-bottom-color:var(--dark-line)}
.slide.dark .slide-head,.slide.dark .slide-foot{color:var(--dark-ink-2)}
#bar{position:fixed;left:0;bottom:0;height:3px;width:0;transition:width .25s ease;
  background:linear-gradient(90deg,var(--accent),#4fb3a2)}
#count{position:fixed;left:50%;transform:translateX(-50%);bottom:14px;
  color:#6d7d88;font:600 11px/1 var(--sans);letter-spacing:.16em}
`;

const DECK_JS = `
const slides=[...document.querySelectorAll('.slide')];let i=0;
function show(n){slides[i]&&slides[i].classList.remove('active');i=(n+slides.length)%slides.length;slides[i].classList.add('active');
document.getElementById('bar').style.width=((i+1)/slides.length*100)+'%';
measure();count();}
function count(){const s=slides[i];
document.getElementById('count').textContent=(i+1)+' / '+slides.length+(s.classList.contains('overflowing')?' \u2193 more':'');}
function measure(){slides.forEach(s=>{const b=s.querySelector('.slide-body');if(!b)return;
s.classList.toggle('overflowing',b.scrollHeight>b.clientHeight+2);});}
function fit(){const s=Math.min(innerWidth/1280,innerHeight/720);document.getElementById('slideWrap').style.transform='scale('+s+')';measure();count();}
addEventListener('resize',fit);fit();show(0);
/* re-measure once assets settle: images change content height after first layout */
addEventListener('load',()=>{measure();count();});
slides.forEach(s=>s.querySelectorAll('img').forEach(im=>{
if(!im.complete)im.addEventListener('load',()=>{measure();count();},{once:true});}));
addEventListener('keydown',e=>{if(['ArrowRight',' ','PageDown','Enter'].includes(e.key)){e.preventDefault();show(i+1);}
if(['ArrowLeft','PageUp','Backspace'].includes(e.key)){e.preventDefault();show(i-1);}
if(e.key==='Home')show(0);if(e.key==='End')show(slides.length-1);});
addEventListener('click',e=>{if(e.clientX>innerWidth/2)show(i+1);else show(i-1);});
`;

function shell(title, css, body, js) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<style>${CSS_BASE}${css}</style></head>
<body${js ? ' class="deck"' : ''}>${body}${js ? `<script>${js}</script>` : ''}</body></html>`;
}

// Chrome is profile data: plain strings in frontmatter, never a directive.
// Derived chrome (page numbers, slide counts) is computed here and never authored.
const chromeOf = fm => ({ head: fm.header ? String(fm.header) : '', foot: fm.footer ? String(fm.footer) : '' });

function render(doc, profile, name) {
  const fm = doc.frontmatter; const title = fm.title || name;
  const ch = chromeOf(fm);
  if (profile === 'page') {
    const tags = (fm.tags || []).map(t => `<span>${esc(String(t))}</span>`).join('');
    const topbar = ch.head ? `<div class="chrome-top">${esc(ch.head)}</div>` : '';
    const header = `<header class="doc"><h1>${esc(title)}</h1>${tags ? `<p class="meta">${tags}</p>` : ''}</header>`;
    const body = doc.sections.map(s =>
      `<section class="region ${s.attrs.preset || ''}"${s.attrs.id ? ` id="${esc(s.attrs.id)}"` : ''} data-preset="${s.attrs.preset || ''}">${childrenHtml(s.children)}</section>`).join('\n');
    const foot = ch.foot ? `<footer class="chrome-foot">${esc(ch.foot)}</footer>` : '';
    return shell(title, CSS_PAGE, topbar + header + body + foot);
  }
  if (profile === 'print') {
    const meta = [fm.version ? 'v' + fm.version : '', fm.updated || fm.date || '', fm.audience].filter(Boolean).join(' · ');
    const head = `<div class="sheet dochead"><h1>${esc(title)}</h1>${meta ? `<p class="meta">${esc(meta)}</p>` : ''}<hr></div>`;
    const runHead = ch.head ? `<div class="sheet-head">${esc(ch.head)}</div>` : '';
    const runFoot = ch.foot ? `<div class="sheet-foot">${esc(ch.foot)}</div>` : '';
    const body = doc.sections.map(s =>
      `<div class="sheet">${runHead}<section class="region ${s.attrs.preset || ''}" data-preset="${s.attrs.preset || ''}">${childrenHtml(s.children)}</section>${runFoot}</div>`).join('\n');
    return shell(title + ' — print', CSS_PRINT, head + body);
  }
  if (profile === 'deck') {
    const body = doc.sections.map((s, n) => {
      const secs = s.vars.find(v => v.name === 'seconds');
      const cover = n === 0;
      const cls = ['slide', cover ? 'cover' : '', s.attrs.preset === 'dark' ? 'dark' : ''].filter(Boolean).join(' ');
      // the title slide carries no running chrome
      const ch0 = cover ? '' : [
        ch.head ? `<div class="slide-head">${esc(ch.head)}</div>` : '',
        ch.foot ? `<div class="slide-foot">${esc(ch.foot)}</div>` : ''
      ].join('');
      return `<div class="${cls}"${secs ? ` data-seconds="${secs.value}"` : ''}>${ch0}<div class="slide-body">${childrenHtml(s.children)}</div></div>`;
    }).join('\n');
    return shell(title, CSS_DECK, `<div id="stage"><div id="slideWrap">${body}</div></div><div id="bar"></div><div id="count"></div>`, DECK_JS);
  }
  throw new Error('unknown profile ' + profile);
}

/* --------------------------------------------------------------- main */

module.exports = { parse, mdToHtml, render };

if (require.main === module) {
  const [file, profileArg] = process.argv.slice(2);
  if (!file) { console.error('usage: node tools/render.js <file.md> [page|print|deck|all]'); process.exit(2); }
  const profiles = profileArg && profileArg !== 'all' ? [profileArg] : ['page', 'print', 'deck'];
  const source = fs.readFileSync(file, 'utf8');
  const doc = parse(source);
  const base = path.basename(file, '.md');
  const outDir = path.join(path.dirname(file), 'rendered');
  fs.mkdirSync(outDir, { recursive: true });
  for (const p of profiles) {
    const out = path.join(outDir, `${base}.${p}.html`);
    fs.writeFileSync(out, render(doc, p, base));
    console.log(`${out} (${doc.sections.length} sections)`);
  }
}
